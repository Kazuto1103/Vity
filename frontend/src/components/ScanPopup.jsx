import React, { useEffect, useState } from 'react';
import { VITY_WA_NUMBER } from '../layouts/VityFullLayout';

/**
 * ============================================================
 * ScanPopup Component — Animasi Hasil Gacha (Menang/Kalah/Double Scan)
 * ============================================================
 * Ditampilkan setelah user melakukan scan QR.
 * Memiliki animasi wow-factor:
 * - Win: Konfeti, cahaya emas, efek membesar.
 * - Lose: Warna soft, animasi pantulan ringan.
 * - Scanned (Double Scan): Warna warning orange, ikon peringatan.
 * ============================================================
 */
export default function ScanPopup({ type, prize, code, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animasi masuk setelah komponen di-mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400); // Tunggu animasi keluar selesai
  };

  const isWin = type === 'win';
  const isLose = type === 'lose';
  const isScanned = type === 'scanned';

  // Menyusun pesan WhatsApp otomatis untuk klaim hadiah
  const getWhatsAppClaimLink = () => {
    const defaultPrize = prize || 'Gantungan Kunci Spesial';
    const codeText = code ? ` dengan kode unik: *${code}*` : '';
    const message = `Halo Vity! Saya memenangkan gacha *${defaultPrize}* dari scan botol Vity${codeText}. Saya ingin mengklaim hadiah saya! 🥳`;
    return `https://wa.me/${VITY_WA_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className={`vity-scan-overlay ${isVisible ? 'active' : ''}`}>
      {/* Efek Confetti (CSS-based) untuk Menang */}
      {isWin && (
        <div className="vity-confetti-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`confetti-piece style-${i % 4}`} style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }}></div>
          ))}
        </div>
      )}

      <div className={`vity-scan-card ${type} ${isVisible ? 'active' : ''}`}>
        
        {/* Dekorasi Glow */}
        <div className="vity-scan-glow"></div>

        <div className="vity-scan-content">
          <div className="vity-scan-icon">
            {isWin ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : isScanned ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            )}
          </div>

          <h2 className="vity-scan-title">
            {isWin ? 'SELAMAT!' : isScanned ? 'SUDAH DI-SCAN!' : 'ZONK!'}
          </h2>

          <p className="vity-scan-desc">
            {isWin 
              ? 'Anda mendapatkan hadiah spesial dari botol ini.' 
              : isScanned
              ? 'Oops! Kode QR pada botol Vity ini sudah pernah dipindai sebelumnya.'
              : 'Belum beruntung kali ini. Kalau ada kesempatan, coba lagi ya~'}
          </p>

          <div className="vity-scan-reward-box">
            <span className="reward-label">
              {isWin ? 'Hadiah Anda:' : isScanned ? 'Status Kode:' : 'Anda Mendapatkan:'}
            </span>
            <span className="reward-value">
              {isWin ? (prize || 'Gantungan Kunci Spesial') : isScanned ? 'Expired / Sudah Diklaim' : 'Maaf yaa~'}
            </span>
          </div>

          {/* Action Button */}
          {isWin ? (
            <a 
              href={getWhatsAppClaimLink()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="vity-scan-btn win-claim-btn"
              onClick={handleClose}
              style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
            >
              Klaim Sekarang
            </a>
          ) : (
            <button className="vity-scan-btn" onClick={handleClose}>
              {isScanned ? 'Tutup Halaman' : 'Tukar Poin Nanti'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
