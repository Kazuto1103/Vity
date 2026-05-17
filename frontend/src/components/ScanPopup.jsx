import React, { useEffect, useState } from 'react';

/**
 * ============================================================
 * ScanPopup Component — Animasi Hasil Gacha (Menang/Kalah)
 * ============================================================
 * Ditampilkan setelah user melakukan scan QR.
 * Memiliki animasi wow-factor:
 * - Win: Konfeti, cahaya emas, efek membesar.
 * - Lose: Warna soft, animasi pantulan ringan.
 * ============================================================
 */
export default function ScanPopup({ type, prize, onClose }) {
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

      <div className={`vity-scan-card ${isWin ? 'win' : 'lose'} ${isVisible ? 'active' : ''}`}>
        
        {/* Dekorasi Glow */}
        <div className="vity-scan-glow"></div>

        <div className="vity-scan-content">
          <div className="vity-scan-icon">
            {isWin ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
            {isWin ? 'SELAMAT!' : 'ZONK!'}
          </h2>

          <p className="vity-scan-desc">
            {isWin 
              ? 'Anda mendapatkan hadiah spesial dari botol ini.' 
              : 'Belum beruntung kali ini. Tapi tenang, botol ini masih berharga!'}
          </p>

          <div className="vity-scan-reward-box">
            <span className="reward-label">{isWin ? 'Hadiah Anda:' : 'Anda Mendapatkan:'}</span>
            <span className="reward-value">{isWin ? (prize || 'Gantungan Kunci Spesial') : '1 Point-Back'}</span>
          </div>

          {/* Action Button */}
          <button className="vity-scan-btn" onClick={handleClose}>
            {isWin ? 'Klaim Sekarang' : 'Tukar Poin Nanti'}
          </button>
        </div>
      </div>
    </div>
  );
}
