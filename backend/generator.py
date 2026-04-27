import qrcode
import secrets
import mysql.connector # atau library database lain yang kamu pakai

# 1. Koneksi ke Database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password_kamu",
    database="vity_db"
)
cursor = db.cursor()

# 2. Pengaturan Produksi
jumlah_botol = 50
url_base = "https://vity.juice/scan/" # Ganti dengan URL web kamu nanti

for i in range(jumlah_botol):
    # Generate kode unik (8 karakter alfanumerik)
    kode_unik = secrets.token_urlsafe(6) # Contoh hasil: "A7b2-X9"
    
    # Tentukan apakah botol ini pemenang (Misal: 10 botol pertama)
    is_winner = True if i < 10 else False
    
    # 3. Simpan ke SQL
    sql = "INSERT INTO bottles (qr_code, is_winner) VALUES (%s, %s)"
    cursor.execute(sql, (kode_unik, is_winner))
    
    # 4. Generate QR Code Image
    full_url = f"{url_base}{kode_unik}"
    img = qrcode.make(full_url)
    
    # Simpan gambar dengan nama sesuai kode uniknya
    img.save(f"qrcodes/{kode_unik}.png")

db.commit()
print(f"Berhasil generate {jumlah_botol} QR Codes dan data SQL!")