-- Hapus tabel lama jika ada (Hati-hati: Data akan hilang)
DROP TABLE IF EXISTS bottles;
DROP TABLE IF EXISTS keychains;

-- 1. Tabel Master Hadiah (Keychain)
CREATE TABLE keychains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    variant_name VARCHAR(50) NOT NULL, -- Nama varian: 'Vity Orange', 'Vity Green', dsb.
    stock INT DEFAULT 0                -- Stok fisik yang tersedia
) ENGINE=InnoDB;

-- 2. Tabel Transaksi Botol & QR Code
CREATE TABLE bottles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code VARCHAR(12) NOT NULL UNIQUE,  -- Kode unik 8-12 karakter (hashed)
    is_winner BOOLEAN DEFAULT FALSE,      -- Flag pemenang gacha
    reward_id INT,                        -- Referensi ke tabel keychains
    is_scanned BOOLEAN DEFAULT FALSE,     -- Anti-Fraud: Status scan
    scanned_at TIMESTAMP NULL DEFAULT NULL, -- Log waktu scan pertama
    FOREIGN KEY (reward_id) REFERENCES keychains(id) ON DELETE SET NULL
) ENGINE=InnoDB;