import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

import models
import database
from database import get_db

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
# Contoh di .env: ALLOWED_ORIGINS=https://vity.app,https://www.vity.app
# Jika tidak diset, default ke "*" (hanya untuk development)
# ─────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

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
            detail="Terjadi kesalahan pada sistem. Kami sedang memperbaikinya.",
        )
