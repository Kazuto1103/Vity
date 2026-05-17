# Deskripsi Proyek: Backend Vity

## Narasi & Filosofi
Backend Vity adalah tulang punggung dari keseluruhan sistem "Vity Gacha". Vity merupakan produk minuman yang menawarkan nilai lebih berupa kejutan (gacha) di setiap kemasan botolnya. Oleh karena itu, backend ini didesain tidak hanya untuk menyimpan data, tetapi sebagai sebuah **mesin penjaga kejujuran dan keamanan**.

Tantangan terbesar dalam sistem gacha berbasis QR Code adalah potensi kecurangan. Seorang pelanggan bisa membagikan kode QR-nya ke orang lain, atau memindainya berkali-kali untuk mencoba mencurangi sistem. Menyadari hal ini, Backend Vity dibangun dengan mekanisme **Anti-Fraud (Anti Kecurangan)** yang sangat ketat menggunakan fitur "Pessimistic Locking" (`SELECT ... FOR UPDATE`) pada level database MySQL. Fitur ini memastikan bahwa pada saat sepersekian detik yang sama jika dua orang men-scan QR yang sama, hanya satu orang yang berhak mendapatkan status pemindaian pertama. 

## Teknologi yang Digunakan
Sistem ini menggunakan bahasa pemrograman **Python** dengan framework **FastAPI**. Pilihan ini dibuat karena FastAPI menawarkan kecepatan eksekusi tinggi (berkat arsitektur asinkron di bawah tenda) dan kecepatan pengembangan (developer experience) yang sangat baik dengan auto-dokumentasi menggunakan Swagger UI.

Untuk penyimpanan data, backend ini dipasangkan dengan database Relational **MySQL** (biasanya di-host melalui **Laragon** pada lingkungan pengembangan lokal). Seluruh interaksi dengan database diabstraksikan menggunakan **SQLAlchemy ORM**. ORM ini mempermudah kita untuk menulis query database menggunakan kode Python yang bersih dan aman dari serangan *SQL Injection*.

## Alur Kerja Sistem
1. **Pembuatan QR**: Entah itu melalui script `generate_qr.py` secara massal di pabrik, atau secara langsung (on-the-fly) dari *Panel Admin*, sistem akan membuat string acak 12 karakter yang sangat aman.
2. **Penyimpanan**: Kode ini disimpan di database. Jika ditentukan sebagai kode pemenang, sistem juga mengikat kode tersebut dengan jenis hadiah tertentu (tabel Keychain).
3. **Proses Scan**: Ketika pengguna membuka kamera dan memindai QR, HP mereka akan memanggil endpoint API `/api/scan/...`.
4. **Verifikasi & Eksekusi**: Backend akan mengecek apakah kode ini asli. Jika asli, dicek lagi apakah sudah pernah di-scan (`is_scanned == 1`). Jika belum pernah, statusnya akan langsung dikunci, diubah menjadi 1, dan dicatat waktu scan-nya (`scanned_at`).
5. **Respons ke Frontend**: Berdasarkan data dari database, backend akan membalas ke pengguna (melalui Frontend) apakah mereka mendapatkan hadiah (WINNER) atau tidak (LOSE), yang nantinya akan memicu animasi visual.

## Masa Depan & Pengembangan (Next Steps)
Backend saat ini masih didesain tanpa lapisan keamanan ganda pada bagian Admin demi kemudahan *prototyping*. Ke depannya, dapat dikembangkan:
- **Autentikasi (JWT)** untuk endpoint Admin.
- Pencatatan informasi pengguna (misalnya menautkan kemenangan ke nomor WhatsApp atau email untuk klaim hadiah).
- Analitik dasbor admin untuk melihat tingkat scan rate botol Vity per hari.
