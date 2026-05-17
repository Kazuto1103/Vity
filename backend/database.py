import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Memuat variabel lingkungan dari file .env yang berada di folder backend/
# Menggunakan path absolut agar selalu ditemukan terlepas dari CWD saat startup
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=5,          
        max_overflow=10,      
        pool_timeout=30,    
        pool_recycle=1800    
    )
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    Base = declarative_base()

except Exception as e:
    print(f"Gagal menghubungkan ke database: {e}")
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
