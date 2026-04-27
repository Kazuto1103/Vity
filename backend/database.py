import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Memuat variabel lingkungan dari file .env
load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "vity_db")

# URL Koneksi MySQL menggunakan mysql-connector-python
SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    # Membuat engine dengan connection pooling
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=5,          # Jumlah koneksi yang dipertahankan
        max_overflow=10,      # Jumlah koneksi tambahan jika pool penuh
        pool_timeout=30,      # Waktu tunggu (detik) sebelum timeout jika tidak ada koneksi
        pool_recycle=1800     # Daur ulang koneksi setelah 30 menit untuk mencegah koneksi terputus dari sisi MySQL
    )
    
    # SessionLocal akan digunakan untuk membuat instance sesi database untuk setiap request
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Base class untuk model SQLAlchemy
    Base = declarative_base()

except Exception as e:
    print(f"Gagal menghubungkan ke database: {e}")
    # Pada sistem produksi yang sebenarnya, error harus dilog menggunakan modul logging
    raise

def get_db():
    """
    Dependency generator untuk mendapatkan sesi database per request.
    Memastikan sesi ditutup setelah request selesai.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
