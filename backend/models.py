from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Keychain(Base):
    """
    Model untuk tabel keychains, merepresentasikan jenis-jenis hadiah (gantungan kunci).
    """
    __tablename__ = "keychains"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    variant_name = Column(String(50), nullable=False)
    stock = Column(Integer, default=0)

    # Relasi ke tabel bottles (satu keychain bisa dimenangkan oleh banyak botol)
    bottles = relationship("Bottle", back_populates="reward")


class Bottle(Base):
    """
    Model untuk tabel bottles, merepresentasikan setiap botol jus Vity dan QR codenya.
    """
    __tablename__ = "bottles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    qr_code = Column(String(12), unique=True, index=True, nullable=False)
    is_winner = Column(Boolean, default=False)
    
    # ForeignKey mengarah ke tabel keychains (id)
    reward_id = Column(Integer, ForeignKey("keychains.id", ondelete="SET NULL"), nullable=True)
    
    is_scanned = Column(Boolean, default=False)
    scanned_at = Column(DateTime, nullable=True)

    # Relasi kembali ke Keychain
    reward = relationship("Keychain", back_populates="bottles")
