import os
import sys
from pathlib import Path

# Fix module imports untuk Vercel (karena Vercel menjalankan file ini dari root folder)
sys.path.append(str(Path(__file__).resolve().parent))

import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging
from pydantic import BaseModel

import models
import database
from database import get_db

from mangum import Mangum

# Konfigurasi basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Lifespan: menggantikan @app.on_event("startup") yang deprecated
# ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Konteks lifespan aplikasi FastAPI.
    Kode sebelum 'yield' dijalankan saat startup.
    Kode setelah 'yield' dijalankan saat shutdown.
    """
    # --- STARTUP ---
    try:
        models.Base.metadata.create_all(bind=database.engine)
        logger.info("Database berhasil diinisialisasi dan tabel diperiksa.")
    except Exception as e:
        logger.error(f"Gagal menginisialisasi tabel database saat startup: {e}")

    yield  # Aplikasi berjalan di sini

    # --- SHUTDOWN ---
    logger.info("Aplikasi dimatikan.")


# ─────────────────────────────────────────────────────────────
# Membuat instance FastAPI dengan lifespan
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Vity Backend API",
    description="Backend infrastructure for Vity, a campus-based healthy beverage startup.",
    version="1.0.0",
    lifespan=lifespan,
)


# ─────────────────────────────────────────────────────────────
# CORS Middleware — origin dibaca dari environment variable
# ─────────────────────────────────────────────────────────────
allowed_origins = [
    "http://localhost:5173",
    "https://vity-frontend.vercel.app", # Placeholder URL produksi Vercel
    os.getenv("ALLOWED_ORIGINS", "")
]
# Bersihkan origin kosong jika ada
allowed_origins = [o.strip() for o in allowed_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# Endpoint: Scan QR Code
# ─────────────────────────────────────────────────────────────
@app.get("/api/scan/{qr_code}", summary="Proses scan QR Code dari botol Vity")
def scan_qr_code(qr_code: str, db: Session = Depends(get_db)):
    """
    Endpoint untuk memproses hasil scan QR Code dari botol Vity.

    Proses:
    1. Validasi: Cari qr_code di tabel bottles.
    2. Anti-Fraud (Row Lock): Kunci baris dengan SELECT FOR UPDATE untuk mencegah
       race condition pada concurrent request.
    3. Anti-Fraud: Periksa status is_scanned.
    4. Update Status: Ubah is_scanned menjadi True dan set scanned_at, commit SEGERA.
    5. Cek Hadiah: Cek apakah memenangkan gantungan kunci (keychain) atau poin back packaging.
    6. Jika menang, kurangi stok keychain.
    """
    try:
        # 1 & 2. Cari data botol + kunci baris (SELECT FOR UPDATE)
        # Ini mencegah dua request bersamaan lolos dari pengecekan is_scanned
        bottle = (
            db.query(models.Bottle)
            .filter(models.Bottle.qr_code == qr_code)
            .with_for_update()
            .first()
        )

        # Validasi: Jika kode tidak ditemukan, kembalikan 404
        if not bottle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR Code tidak ditemukan.",
            )

        # 3. Anti-Fraud Check: Mencegah klaim ganda
        if bottle.is_scanned:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kode sudah kedaluwarsa atau hadiah telah diklaim.",
            )

        # 4. Update Status: Tandai sebagai sudah di-scan
        bottle.is_scanned = True
        bottle.scanned_at = datetime.now(timezone.utc)

        # 5. Menentukan Hasil Scan (Gacha)
        if bottle.is_winner:
            # Ambil data hadiah dari relasi
            keychain = (
                db.query(models.Keychain)
                .filter(models.Keychain.id == bottle.reward_id)
                .first()
            )
            variant_name = keychain.variant_name if keychain else "Gantungan Kunci Spesial"

            # 6. Kurangi stok keychain jika stok masih tersedia
            if keychain and keychain.stock > 0:
                keychain.stock -= 1
            elif keychain and keychain.stock <= 0:
                logger.warning(
                    f"Stok keychain '{variant_name}' (id={keychain.id}) sudah habis "
                    f"saat bottle id={bottle.id} di-scan."
                )

            # Commit semua perubahan (status scan + pengurangan stok)
            try:
                db.commit()
                db.refresh(bottle)
            except Exception as commit_error:
                db.rollback()
                logger.error(f"Gagal commit perubahan scan winner: {commit_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Terjadi kesalahan saat memproses scan Anda. Silakan coba lagi.",
                )

            return {
                "success": True,
                "status": "WINNER",
                "message": "Selamat! Anda memenangkan gantungan kunci.",
                "data": {
                    "prize": variant_name,
                },
            }

        else:
            # Jika tidak menang (Zonk), berikan 1 Point-Back
            try:
                db.commit()
                db.refresh(bottle)
            except Exception as commit_error:
                db.rollback()
                logger.error(f"Gagal commit perubahan scan zonk: {commit_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Terjadi kesalahan saat memproses scan Anda. Silakan coba lagi.",
                )

            return {
                "success": True,
                "status": "POINT",
                "message": "Zonk! Tapi tenang, Anda mendapatkan 1 Point-Back Packaging.",
                "data": {
                    "points_earned": 1,
                },
            }

    except HTTPException:
        # Re-raise HTTPException agar response sesuai dengan yang kita buat
        raise
    except Exception as e:
        # Tangkap error yang tidak terduga, seperti masalah koneksi database
        logger.error(f"Terjadi kesalahan internal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan pada sistem: {str(e)}"
        )

# ─────────────────────────────────────────────────────────────
# Endpoint: Admin Generate QR Code
# ─────────────────────────────────────────────────────────────
class GenerateQRRequest(BaseModel):
    type: str # "win" or "lose"

@app.post("/api/admin/generate-qr", summary="Generate QR Code baru (Win/Lose)")
def generate_qr_admin(request: GenerateQRRequest, db: Session = Depends(get_db)):
    """
    Endpoint untuk Admin Panel men-generate kode QR baru secara on-the-fly.
    Tidak memerlukan autentikasi untuk sementara waktu.
    """
    try:
        is_winner = request.type.lower() == "win"
        reward_id = None

        if is_winner:
            # Cari keychain pertama sebagai hadiah default
            keychain = db.query(models.Keychain).first()
            if not keychain:
                # Jika tidak ada keychain, buat dummy (mirip script lama)
                keychain = models.Keychain(variant_name="Gantungan Kunci Spesial", stock=100)
                db.add(keychain)
                db.commit()
                db.refresh(keychain)
            reward_id = keychain.id

        # Generate unique code aman, 12 karakter
        unique_code = secrets.token_urlsafe(9)[:12]
        
        # Cek apakah bentrok (sangat kecil kemungkinannya, tapi best practice)
        while db.query(models.Bottle).filter(models.Bottle.qr_code == unique_code).first():
            unique_code = secrets.token_urlsafe(9)[:12]

        new_bottle = models.Bottle(
            qr_code=unique_code,
            is_winner=is_winner,
            reward_id=reward_id
        )
        
        db.add(new_bottle)
        db.commit()

        base_url = "http://192.168.1.124:5173/scan/"
        qr_url = f"{base_url}{unique_code}"

        return {
            "success": True,
            "message": f"Berhasil generate QR {'Win' if is_winner else 'Lose'}",
            "data": {
                "qr_code": unique_code,
                "url": qr_url,
                "type": "win" if is_winner else "lose"
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Gagal generate QR admin: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal men-generate QR Code. Error details: {str(e)}"
        )

# ─────────────────────────────────────────────────────────────
# Serverless Adapter
# ─────────────────────────────────────────────────────────────
handler = Mangum(app)
