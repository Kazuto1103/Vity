import React, { useState, useRef } from 'react';
import logoImg from '../assets/logo.png';

/**
 * ============================================================
 * Header Component — Navigasi Atas Vity
 * ============================================================
 * Menampilkan logo VITY (gambar) di kiri dan tab switcher
 * (Menu | Keychain) di tengah.
 *
 * Props:
 *   - activeSection (string): 'menu' atau 'keychain'
 *   - onSectionChange (function): Callback saat tab diubah
 *   - onAdminTrigger (function): Callback saat logo diklik 5x
 * ============================================================
 */
export default function Header({ activeSection, onSectionChange, onAdminTrigger }) {
  const [clickCount, setClickCount] = useState(0);
  const resetTimer = useRef(null);

  const handleLogoClick = () => {
    // Clear existing timer if any
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    const newCount = clickCount + 1;
    
    if (newCount >= 5) {
      setClickCount(0);
      if (onAdminTrigger) onAdminTrigger();
    } else {
      setClickCount(newCount);
      
      // Reset counter jika tidak ada klik lanjutan dalam 2 detik
      resetTimer.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  return (
    <header className="vity-header" role="banner">
      {/* Logo VITY — menggunakan gambar dari assets */}
      <div 
        className="vity-logo" 
        aria-label="Vity Logo"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer' }}
      >
        <img src={logoImg} alt="Vity Logo" className="vity-logo-img" />
      </div>

      {/* Tab Switcher (Menu | Keychain) */}
      <div className="vity-tabs" role="tablist">
        <button
          className={`vity-tab ${activeSection === 'menu' ? 'active' : ''}`}
          onClick={() => onSectionChange('menu')}
          role="tab"
          aria-selected={activeSection === 'menu'}
        >
          Menu
        </button>
        <button
          className={`vity-tab ${activeSection === 'keychain' ? 'active' : ''}`}
          onClick={() => onSectionChange('keychain')}
          role="tab"
          aria-selected={activeSection === 'keychain'}
        >
          Keychain
        </button>
      </div>
      
      {/* Spacer untuk menyeimbangkan flexbox (kiri logo, kanan kosong) */}
      <div style={{ width: '52px' }}></div>
    </header>
  );
}
