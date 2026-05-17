# Struktur Kode Backend Vity

Dokumen ini menjelaskan struktur direktori dan fungsionalitas dari setiap komponen kode pada backend proyek Vity.

## Hierarki Folder & File

```text
backend/
├── main.py                # Titik masuk utama aplikasi FastAPI
├── database.py            # Konfigurasi dan koneksi ke database MySQL
├── models.py              # Definisi skema tabel database (SQLAlchemy)
├── requirements.txt       # Daftar dependensi library Python
├── .env                   # Variabel lingkungan (Kredensial database, URL)
├── .env.example           # Contoh template untuk file .env
├── scripts/               # Folder berisi script utilitas
│   └── generate_qr.py     # Script otomatis untuk pre-generate QR secara masal
└── logs/                  # Tempat penyimpanan file log (.log)
```

## Fungsionalitas per File

### 1. `main.py`
Merupakan inti dari server aplikasi. File ini menggunakan *framework* FastAPI.
**Fungsi Utama:**
- Mendefinisikan seluruh API endpoint (seperti `/api/scan/{qr_code}` dan `/api/admin/generate-qr`).
- Menginisialisasi *middleware* CORS untuk mengizinkan frontend mengakses API.
- Menangani *lifespan* event untuk memeriksa tabel database saat server baru menyala.
- Mengelola *logic* ketika QR di-*scan* (seperti memeriksa status gacha `is_winner`, mencegah klik ganda menggunakan `with_for_update()`, dan mencatat waktu scan).

### 2. `database.py`
File ini bertanggung jawab penuh atas koneksi ke database.
**Fungsi Utama:**
- Membaca konfigurasi kredensial dari `.env` menggunakan `python-dotenv`.
- Membuat `engine` SQLAlchemy untuk terkoneksi ke MySQL.
- Mendefinisikan kelas `Base` yang akan digunakan oleh semua model.
- Menyediakan *dependency injection* `get_db()` yang secara otomatis membuka dan menutup sesi ke database untuk setiap request API.

### 3. `models.py`
Mendefinisikan skema Object Relational Mapping (ORM) dari database.
**Fungsi Utama:**
- `Keychain`: Tabel untuk menyimpan varian hadiah gantungan kunci dan jumlah stoknya.
- `Bottle`: Tabel untuk mencatat setiap botol yang diproduksi, berisi kode QR unik, status menang (`is_winner`), status scan (`is_scanned`), waktu scan, dan relasi *Foreign Key* ke tabel `Keychain` jika menang.

### 4. `scripts/generate_qr.py`
Sebuah script *stand-alone* (dapat dijalankan terpisah dari server utama).
**Fungsi Utama:**
- Melakukan inisialisasi awal ke database.
- Otomatis membuat 3 varian `Keychain`.
- Membuat ratusan data QR code secara acak untuk tabel `Bottle`, dengan pengaturan persentase jumlah QR pemenang dan zonk.
- Berguna untuk testing awal dan produksi massal QR secara langsung.
