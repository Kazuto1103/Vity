# Deskripsi Proyek: Frontend Vity

## Visi Desain & Pengalaman Pengguna (UX)
Frontend Vity bukanlah sekadar halaman *landing page* biasa. Ia dikonsepkan sebagai sebuah **"Etalase Etalase Digital yang Hidup"**. Vity adalah minuman modern dengan tagline *"Nol Gula, Satu Rasa, Gacha Tiap Botol"*. Oleh karena itu, antarmuka pengguna (UI) harus merepresentasikan nilai-nilai *fun*, dinamis, dan premium.

Pengalaman pengguna dibangun berpusat pada sebuah *Slider/Carousel* interaktif raksasa yang memenuhi layar. Saat pengguna berinteraksi (menggeser atau menekan tombol), tidak hanya produk yang berpindah, namun **seluruh aura halaman (warna latar, aksen)* ikut bertransformasi sesuai dengan produk yang sedang ditampilkan. Ini memberikan rasa imersi (keterlibatan penuh) yang tinggi kepada pengunjung.

## Filosofi "Wow Factor"
Kami memastikan tidak ada elemen yang terasa "murahan". Fitur-fitur seperti *Scan Popup* untuk pemenang gacha dibuat sedemikian rupa untuk meledakkan perasaan senang pengunjung. Kami mengimplementasikan:
- **Glassmorphism**: Desain semi-transparan yang menampilkan keindahan gradasi di belakangnya.
- **Micro-interactions**: Efek ketika tombol di-hover (diarahkan mouse), transisi halus, dan animasi yang tidak mematahkan fokus.
- **Tanpa Frame Statis**: Semuanya terasa mengalir tanpa batasan kotak-kotak kaku konvensional.

## Fitur Rahasia (Admin Panel)
Sebagai lapisan utilitas, frontend ini juga menanamkan panel admin secara tersembunyi (tanpa perlu repot membuat proyek *dashboard* terpisah). Dengan mengetuk logo "VITY" sebanyak 5 kali secara berurutan, halaman administratif akan terbuka. 
Panel ini digunakan secara internal untuk *generate* (memproduksi) QR code "Menang" maupun "Kalah" pada masa produksi, yang kemudian dicetak ke tutup botol fisik.

## Tantangan & Solusi yang Diimplementasikan
- **Intersepsi Rute (Scan Handling)**: Karena aplikasi ini bertindak sebagai satu halaman utuh, saat HP pengguna memindai QR (misalnya masuk ke link `/scan/ABC`), aplikasi dituntut untuk segera memproses API ke server tanpa berpindah halaman putih (blank). Kami menyelesaikannya dengan menggunakan `useEffect` yang segera mengecek *pathname* saat komponen termuat, memberikan pengalaman "Seamless Scan" (Scan Tanpa Jeda).
- **Responsivitas**: Desain ini terlihat rapi tidak hanya di monitor besar PC, tetapi disesuaikan agar tombol geser, jarak dot, dan ukuran font tetap elegan saat dioperasikan melalui *swipe* jempol di layar ponsel pintar.
