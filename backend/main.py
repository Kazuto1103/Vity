from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from . import models, database
from .database import get_db

# Konfigurasi basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Membuat instance FastAPI
app = FastAPI(
    title="Vity Backend API",
    description="Backend infrastructure for Vity, a campus-based healthy beverage startup.",
    version="1.0.0"
)

# Menambahkan CORS Middleware agar dapat diakses oleh Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pada produksi, ganti "*" dengan origin yang spesifik
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/scan/{qr_code}")
def scan_qr_code(qr_code: str, db: Session = Depends(get_db)):
    """
    Endpoint untuk memproses hasil scan QR Code dari botol Vity.
    
    Proses:
    1. Validasi: Cari qr_code di tabel bottles.
    2. Anti-Fraud: Periksa status is_scanned.
    3. Update Status: Ubah is_scanned menjadi True dan set scanned_at, commit SEGERA.
    4. Cek Hadiah: Cek apakah memenangkan gantungan kunci (keychain) atau poin back packaging.
    """
    try:
        # 1. Mencari data botol berdasarkan qr_code
        bottle = db.query(models.Bottle).filter(models.Bottle.qr_code == qr_code).first()

        # Validasi: Jika kode tidak ditemukan, kembalikan 404
        if not bottle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR Code tidak ditemukan."
            )

        # 2. Anti-Fraud Check: Mencegah klaim ganda
        if bottle.is_scanned:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kode sudah kedaluwarsa atau hadiah telah diklaim."
            )

        # 3. Update Status: Tandai sebagai sudah di-scan
        bottle.is_scanned = True
        bottle.scanned_at = datetime.now(timezone.utc)
        
        # COMMIT SEGERA untuk meminimalkan race conditions (mencegah multiple scan pada saat yang sama)
        try:
            db.commit()
            db.refresh(bottle) # Memperbarui instance bottle dengan data terbaru dari database
        except Exception as commit_error:
            db.rollback()
            logger.error(f"Gagal melakukan commit perubahan status scan: {commit_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Terjadi kesalahan saat memproses scan Anda. Silakan coba lagi."
            )

        # 4. Menentukan Hasil Scan (Gacha)
        if bottle.is_winner:
            # Jika menang, ambil data hadiah dari relasi
            keychain = db.query(models.Keychain).filter(models.Keychain.id == bottle.reward_id).first()
            variant_name = keychain.variant_name if keychain else "Gantungan Kunci Spesial"
            
            return {
                "success": True,
                "status": "WINNER",
                "message": "Selamat! Anda memenangkan gantungan kunci.",
                "data": {
                    "prize": variant_name
                }
            }
        else:
            # Jika tidak menang (Zonk), berikan 1 Point-Back
            return {
                "success": True,
                "status": "POINT",
                "message": "Zonk! Tapi tenang, Anda mendapatkan 1 Point-Back Packaging.",
                "data": {
                    "points_earned": 1
                }
            }

    except HTTPException:
        # Re-raise HTTPException agar response sesuai dengan yang kita buat
        raise
    except Exception as e:
        # Tangkap error yang tidak terduga, seperti masalah koneksi database
        logger.error(f"Terjadi kesalahan internal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Terjadi kesalahan pada sistem. Kami sedang memperbaikinya."
        )

@app.on_event("startup")
def on_startup():
    """
    Fungsi yang dijalankan saat server FastAPI pertama kali dijalankan.
    Mengecek koneksi database atau membuat tabel secara otomatis.
    """
    try:
        # Opsi: Secara otomatis membuat tabel jika belum ada. 
        # Untuk migrasi tingkat lanjut, gunakan Alembic.
        models.Base.metadata.create_all(bind=database.engine)
        logger.info("Database berhasil diinisialisasi dan tabel diperiksa.")
    except Exception as e:
        logger.error(f"Gagal menginisialisasi tabel database saat startup: {e}")
