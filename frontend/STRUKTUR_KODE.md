# Struktur Kode Frontend Vity

Dokumen ini menjelaskan struktur direktori dan fungsi dari setiap komponen di dalam folder *frontend* proyek Vity. Frontend dibangun menggunakan **React** dan dikemas menggunakan *bundler* **Vite**.

## Hierarki Folder & File

```text
frontend/
├── package.json               # Daftar dependensi npm (react, vite, qrcode.react)
├── index.html                 # Titik masuk file HTML utama
├── vite.config.js             # Konfigurasi bundler Vite
├── src/
│   ├── main.jsx               # Titik masuk React (merender App.jsx ke DOM)
│   ├── App.jsx                # Komponen App utama (me-load VityFullLayout)
│   ├── design-system.css      # Variabel CSS global, typography, dan utilitas dasar
│   ├── vity.css               # Styling utama aplikasi (animasi, layout, komponen)
│   ├── data/
│   │   ├── products.js        # Data dummy katalog produk minuman Vity
│   │   └── keychains.js       # Data dummy varian gantungan kunci
│   ├── layouts/
│   │   └── VityFullLayout.jsx # Container layar penuh (navigasi, animasi transisi, scan QR logic)
│   ├── components/
│   │   ├── Header.jsx         # Komponen Navigasi atas & pemicu Admin Panel (klik logo)
│   │   ├── AdminPanel.jsx     # Panel rahasia (Generate QR Win/Lose & Preview Popup)
│   │   └── ScanPopup.jsx      # Animasi visual pop-up saat hasil scan selesai
│   └── assets/                # Aset statis seperti gambar (jika ada)
```

## Fungsionalitas per File Utama

### 1. `layouts/VityFullLayout.jsx`
Ini adalah komponen raksasa (pusat kendali) tempat seluruh pengalaman aplikasi berjalan. Karena Vity saat ini bertindak sebagai *Single Page Application* (SPA) khusus tanpa routing (seperti `react-router`), layout ini menangani segalanya.
- **Navigasi Slider**: Menangani index produk yang sedang aktif dan mengatur animasi pergeseran kiri/kanan berdasarkan tombol atau *swipe*.
- **Integrasi Scan QR**: Melalui efek (`useEffect`), file ini mendengarkan apakah URL web diakses menggunakan awalan `/scan/...`. Jika iya, ia akan otomatis "menembak" ke API backend dan memunculkan hasil tanpa me-refresh halaman.

### 2. `components/AdminPanel.jsx`
Antarmuka rahasia yang dapat dipicu oleh aksi klik pada logo sebanyak 5 kali di bagian `Header.jsx`.
- Menghubungi API `/api/admin/generate-qr` di backend.
- Menampilkan QR Code asli menggunakan library `qrcode.react`.
- Menyediakan fasilitas tombol untuk mengunduh gambar QR tersebut secara lokal.

### 3. `components/ScanPopup.jsx`
Komponen visual ini sangat penting karena memegang peranan *WOW Factor* yang diminta oleh tim desain.
- Membawa *props* `type` yang bernilai `win` atau `lose`.
- Menampilkan hujan konfeti (menggunakan CSS animation murni di `vity.css`) dan warna-warna cerah jika tipe yang dilempar adalah pemenang.

### 4. `vity.css` & `design-system.css`
- `design-system.css`: Bertanggung jawab atas pendefinisian fondasi *brand* seperti ukuran font (skala *rem*), *border-radius*, warna dasar, dan utility margin/padding standar.
- `vity.css`: Digunakan secara spesifik untuk aplikasi ini. Memuat efek *glassmorphism*, paralaks bayangan, gaya slider, efek neon, hingga *keyframes* animasi rumit untuk Pop-up.
