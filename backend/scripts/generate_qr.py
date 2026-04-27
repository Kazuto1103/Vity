import os
import secrets
import qrcode
import random
from sqlalchemy.orm import Session

# Import dari package backend (jalankan dari root folder Vity/)
from backend.database import SessionLocal, engine
from backend import models

def init_db():
    """
    Memastikan tabel ada di database sebelum script berjalan.
    """
    models.Base.metadata.create_all(bind=engine)

def generate_qrs():
    """
    Script standalone untuk men-generate 50 QR Code unik, 
    menyimpannya ke dalam database dengan win rate 20%, 
    dan membuat file gambar .png ke direktori /qrcodes.
    """
    # Pastikan direktori qrcodes ada
    qrcodes_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "qrcodes")
    if not os.path.exists(qrcodes_dir):
        os.makedirs(qrcodes_dir)

    # Inisialisasi sesi database
    db: Session = SessionLocal()

    try:
        # Cek apakah ada keychain (hadiah) di database. Jika belum, buat dummy.
        keychain = db.query(models.Keychain).first()
        if not keychain:
            print("Membuat data keychain dummy karena tabel masih kosong...")
            keychain = models.Keychain(variant_name="Gantungan Kunci Maskot Vity", stock=100)
            db.add(keychain)
            db.commit()
            db.refresh(keychain)

        total_bottles = 50
        win_rate = 0.20
        total_winners = int(total_bottles * win_rate) # 10 pemenang

        # Membuat list status menang/kalah
        # True sebanyak 10, False sebanyak 40
        win_status_list = [True] * total_winners + [False] * (total_bottles - total_winners)
        
        # Mengacak urutan menang/kalah
        random.shuffle(win_status_list)

        base_url = "https://vity.app/scan/"

        for i in range(total_bottles):
            # Menggunakan secrets untuk men-generate random string sepanjang 12 karakter yang aman
            unique_code = secrets.token_urlsafe(9)[:12] # 9 bytes = 12 base64 chars
            
            is_winner = win_status_list[i]
            reward_id = keychain.id if is_winner else None

            # Simpan ke tabel bottles
            new_bottle = models.Bottle(
                qr_code=unique_code,
                is_winner=is_winner,
                reward_id=reward_id
            )
            db.add(new_bottle)

            # Buat file gambar QR Code
            qr_url = f"{base_url}{unique_code}"
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_url)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")
            
            # Simpan sebagai file .png
            file_path = os.path.join(qrcodes_dir, f"qr_{unique_code}.png")
            img.save(file_path)

        # Commit ke database setelah semua botol dibuat
        db.commit()
        print(f"Berhasil men-generate {total_bottles} QR codes (10 Winner, 40 Zonk) dan menyimpannya di folder {qrcodes_dir}.")

    except Exception as e:
        print(f"Terjadi kesalahan saat men-generate QR Code: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Memulai proses generasi QR Code...")
    init_db()
    generate_qrs()
    print("Selesai.")
