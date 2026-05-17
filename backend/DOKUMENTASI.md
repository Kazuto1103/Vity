# Dokumentasi Backend Vity

Dokumentasi ini menjelaskan arsitektur, struktur, dan cara penggunaan dari sistem backend **Vity** (Startup minuman sehat berbasis kampus). Backend ini dibangun menggunakan **FastAPI** dan **MySQL**, dengan ORM **SQLAlchemy**.

## 📑 Daftar Isi
1. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
2. [Struktur Direktori](#struktur-direktori)
3. [Instalasi dan Konfigurasi](#instalasi-dan-konfigurasi)
4. [Desain Database (Models)](#desain-database-models)
5. [API Endpoints](#api-endpoints)
6. [Fitur Keamanan dan Anti-Fraud](#fitur-keamanan-dan-anti-fraud)

---

## 🛠️ Teknologi yang Digunakan
- **Framework Utama**: [FastAPI](https://fastapi.tiangolo.com/) (Web Framework asinkron berkinerja tinggi)
- **Database**: MySQL
- **ORM**: SQLAlchemy
- **Konektor DB**: `mysql-connector-python`
- **Server ASGI**: Uvicorn
- **Environment Management**: `python-dotenv`
- **Generasi QR Code**: `qrcode`, `Pillow` (pada modul `scripts/`)

---

## 📁 Struktur Direktori
Struktur folder `backend` dibangun dengan pemisahan tanggung jawab yang jelas:
```text
backend/
├── main.py             # Entry point aplikasi FastAPI, definisi API endpoint, dan middleware CORS.
├── models.py           # Definisi skema tabel database menggunakan SQLAlchemy ORM.
├── database.py         # Konfigurasi koneksi MySQL, setup engine, dan session pooling.
├── requirements.txt    # Daftar pustaka/dependensi Python.
├── .env.example        # Template untuk environment variables.
├── .env                # File konfigurasi environment (tidak di-commit).
└── scripts/
    └── generate_qr.py  # Skrip utilitas untuk men-generate gambar QR code.
```

---

## ⚙️ Instalasi dan Konfigurasi

### 1. Prasyarat
- Python 3.9 atau lebih baru.
- MySQL Server yang berjalan lokal atau remote.

### 2. Langkah Instalasi
Buka terminal dan navigasikan ke folder `backend`.

```bash
# 1. Buat Virtual Environment (opsional namun direkomendasikan)
python -m venv venv

# 2. Aktivasi Virtual Environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 3. Instal Dependensi
pip install -r requirements.txt
```

### 3. Setup Database MySQL (Local via Laragon)
Bagi Anda yang menggunakan [Laragon](https://laragon.org/) di Windows, berikut cara membuat database-nya:
1. Buka aplikasi **Laragon** dan pastikan service **MySQL** sudah berjalan (tombol "Start All").
2. Klik tombol **Database** di Laragon (biasanya akan membuka HeidiSQL atau phpMyAdmin).
3. Buat sesi koneksi baru jika belum ada (User bawaan biasanya `root` tanpa password).
4. Klik kanan pada panel kiri (daftar database), pilih **Create new -> Database**.
5. Beri nama database, misalnya `vity_db`. Collation biarkan default (sebaiknya `utf8mb4_general_ci`).
6. Selesai! Database `vity_db` siap digunakan.

### 4. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` di dalam folder `backend/`. Sesuaikan dengan konfigurasi MySQL Laragon Anda (secara default Laragon menggunakan user `root` tanpa password).

```env
DB_USER=root
DB_PASSWORD=password_database_anda
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vity_db

# Konfigurasi CORS (pisahkan dengan koma jika lebih dari satu)
ALLOWED_ORIGINS=http://localhost:3000,https://vity.app
```

### 5. Menjalankan Server
```bash
uvicorn main:app --reload
```
Server akan berjalan di `http://127.0.0.1:8000`. Dokumentasi interaktif (Swagger UI) dapat diakses di `http://127.0.0.1:8000/docs`.

---

## 🗄️ Desain Database (Models)

Sistem database menggunakan dua tabel utama:

### 1. Tabel `keychains`
Menyimpan data tentang jenis hadiah (gantungan kunci) beserta stok yang tersedia.
- `id` (Integer, Primary Key)
- `variant_name` (String): Nama varian hadiah.
- `stock` (Integer): Jumlah stok yang tersedia.

### 2. Tabel `bottles`
Menyimpan identitas unik setiap botol Vity yang akan di-scan oleh pengguna.
- `id` (Integer, Primary Key)
- `qr_code` (String, Unique): Teks/Karakter unik yang disematkan dalam QR Code.
- `is_winner` (Boolean): Penanda apakah botol ini mengandung hadiah fisik.
- `reward_id` (Integer, Foreign Key ke `keychains.id`): Relasi jenis hadiah jika botol menang.
- `is_scanned` (Boolean): Penanda apakah QR code sudah di-scan.
- `scanned_at` (DateTime): Waktu pasti kapan QR code di-scan.

---

## 🚀 API Endpoints

### `GET /api/scan/{qr_code}`
Endpoint utama yang dipanggil oleh frontend/aplikasi saat pengguna melakukan scan pada botol.

**Proses Internal Endpoint:**
1. **Pencarian Botol**: Mencari data botol di database berdasarkan `qr_code`.
2. **Validasi Ketersediaan**: Jika tidak ada, kembalikan error `404 Not Found`.
3. **Pemeriksaan Fraud**: Jika `is_scanned` bernilai `True`, tolak dengan `400 Bad Request` (kode sudah pernah di-scan).
4. **Eksekusi Penanda**: Mengubah `is_scanned = True` dan menyimpan `scanned_at`.
5. **Gacha / Penentuan Hadiah**:
   - **Jika `is_winner` True**: Cek data hadiah (keychain) dari relasi. Jika stok `> 0`, stok dikurangi. Response menyatakan "WINNER" dengan detail nama hadiah.
   - **Jika `is_winner` False**: Response menyatakan "POINT" (pengguna mendapatkan poin Point-Back packaging).

**Contoh Response Sukses (Winner):**
```json
{
  "success": true,
  "status": "WINNER",
  "message": "Selamat! Anda memenangkan gantungan kunci.",
  "data": {
    "prize": "Gantungan Kunci Spesial"
  }
}
```

**Contoh Response Sukses (Zonk/Point):**
```json
{
  "success": true,
  "status": "POINT",
  "message": "Zonk! Tapi tenang, Anda mendapatkan 1 Point-Back Packaging.",
  "data": {
    "points_earned": 1
  }
}
```

---

## 🛡️ Fitur Keamanan dan Anti-Fraud

1. **Row-Level Locking (`SELECT FOR UPDATE`)**
   Untuk mencegah _Race Condition_ dimana satu QR code yang sama di-scan dalam milidetik yang bersamaan, backend menerapkan _database lock_ (`.with_for_update()`) pada query pencarian `bottles`. Ini menjamin hanya ada 1 request yang bisa berhasil memvalidasi status scan.
2. **Koneksi Stabil (Connection Pooling)**
   Aplikasi menggunakan konfigurasi pool dari SQLAlchemy (`pool_size`, `max_overflow`, `pool_recycle`) untuk mencegah habisnya slot koneksi MySQL saat diakses puluhan/ratusan perangkat secara paralel, serta menghindari *"MySQL server has gone away"*.
3. **CORS Dinamis**
   Konfigurasi `ALLOWED_ORIGINS` di `main.py` menggunakan _environment variables_, mempermudah pemblokiran request asing dari domain yang tidak terdaftar saat aplikasi sudah di-deploy ke production.
