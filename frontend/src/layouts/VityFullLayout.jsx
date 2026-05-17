import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import AdminPanel from '../components/AdminPanel';
import ScanPopup from '../components/ScanPopup';
import { products } from '../data/products';
import { keychains } from '../data/keychains';

// Nomor WhatsApp resmi bisnis Vity Anda (format internasional)
export const VITY_WA_NUMBER = "6287751033550";

/**
 * ============================================================
 * VityFullLayout — Layout Container Utama Layar Penuh
 * ============================================================
 * Menangani seluruh logika halaman:
 * - State produk aktif (activeIndex)
 * - State section aktif (menu / keychain)
 * - Transisi warna seluruh halaman berdasarkan produk
 * - Navigasi loop (kiri/kanan/dots/keyboard)
 * - Animasi slide kiri/kanan saat berpindah produk
 * - Keyboard support (ArrowLeft / ArrowRight)
 * - Admin Panel Trigger (Click Logo 5x)
 *
 * Layout:
 *   Header (Tabs) → Product Name + Tagline → [◀ Photo ▶] → Dots → Desc → Footer
 * ============================================================
 */
export default function VityFullLayout() {
  // State section yang aktif: 'menu' atau 'keychain'
  const [activeSection, setActiveSection] = useState('menu');

  // Index produk yang sedang aktif (0, 1, atau 2)
  const [activeIndex, setActiveIndex] = useState(0);

  // Arah slide: 'left' (klik kanan, konten geser ke kiri) atau 'right' (klik kiri, konten geser ke kanan)
  const [slideDirection, setSlideDirection] = useState(null);

  // State fase animasi: 'visible' | 'exiting' | 'entering'
  const [animPhase, setAnimPhase] = useState('visible');

  // State untuk menampilkan Admin Panel
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  // State untuk Test Scan Popup (Win/Lose/Scanned)
  const [testScanResult, setTestScanResult] = useState(null);

  // Ref untuk mencegah spam klik saat transisi berjalan
  const isTransitioning = useRef(false);

  // Tentukan data source berdasarkan section aktif
  const dataSource = activeSection === 'menu' ? products : keychains;
  const currentItem = dataSource[activeIndex];

  /**
   * Mengubah section (Menu <-> Keychain)
   */
  const handleSectionChange = useCallback((section) => {
    if (section === activeSection || isTransitioning.current) return;
    
    isTransitioning.current = true;
    setSlideDirection('left'); // Default slide out ke kiri saat ganti section
    setAnimPhase('exiting');
    
    setTimeout(() => {
      setActiveSection(section);
      setActiveIndex(0); // Reset index saat pindah section
      setAnimPhase('entering');
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          setAnimPhase('visible');
          isTransitioning.current = false;
        }, 20);
      });
    }, 350);
  }, [activeSection]);

  /**
   * Navigasi ke produk berikutnya (loop)
   * Konten geser ke KIRI (keluar ke kiri, masuk dari kanan)
   */
  const goNext = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    setSlideDirection('left');
    setAnimPhase('exiting');

    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % dataSource.length);
      setAnimPhase('entering');

      requestAnimationFrame(() => {
        setTimeout(() => {
          setAnimPhase('visible');
          isTransitioning.current = false;
        }, 20);
      });
    }, 350);
  }, [dataSource.length]);

  /**
   * Navigasi ke produk sebelumnya (loop)
   * Konten geser ke KANAN (keluar ke kanan, masuk dari kiri)
   */
  const goPrev = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    setSlideDirection('right');
    setAnimPhase('exiting');

    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + dataSource.length) % dataSource.length);
      setAnimPhase('entering');

      requestAnimationFrame(() => {
        setTimeout(() => {
          setAnimPhase('visible');
          isTransitioning.current = false;
        }, 20);
      });
    }, 350);
  }, [dataSource.length]);

  /**
   * Navigasi langsung ke produk tertentu via dot indicator
   */
  const goToIndex = useCallback((index) => {
    if (isTransitioning.current || index === activeIndex) return;
    isTransitioning.current = true;

    const dir = index > activeIndex ? 'left' : 'right';
    setSlideDirection(dir);
    setAnimPhase('exiting');

    setTimeout(() => {
      setActiveIndex(index);
      setAnimPhase('entering');

      requestAnimationFrame(() => {
        setTimeout(() => {
          setAnimPhase('visible');
          isTransitioning.current = false;
        }, 20);
      });
    }, 350);
  }, [activeIndex]);

  /**
   * Keyboard navigation — ArrowLeft & ArrowRight
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  /**
   * URL Scan Interceptor
   * Berfungsi jika URL berupa /scan/{code}
   */
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/scan/')) {
      const code = path.split('/')[2];
      if (code) {
        // Hilangkan dari URL agar tidak me-refresh terus
        window.history.replaceState({}, document.title, '/');
        
        // Panggil backend API
        const baseUrl = import.meta.env.VITE_API_URL || "";
        fetch(`${baseUrl}/api/scan/${code}`)
          .then(res => res.json().then(data => ({ status: res.status, body: data })))
          .then(({ status, body }) => {
            if (status === 200) {
              // Sukses scan
              if (body.status === 'WINNER') {
                setTestScanResult({ type: 'win', prize: body.data?.prize, code: code });
              } else {
                setTestScanResult({ type: 'lose' });
              }
            } else if (status === 400 && body.detail && (body.detail.includes("kedaluwarsa") || body.detail.includes("diklaim") || body.detail.includes("sudah"))) {
              // Botol sudah pernah di-scan
              setTestScanResult({ type: 'scanned', code: code });
            } else {
              // Jika error lainnya (misal code salah / tidak valid)
              alert(`Gagal: ${body.detail || 'Kode tidak valid'}`);
            }
          })
          .catch(err => {
            console.error('Network Error:', err);
            alert('Gagal terhubung ke server.');
          });
      }
    }
  }, []);

  /**
   * Touch/Swipe support untuk mobile
   */

  const touchStart = useRef(null);

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStart.current = null;
  };

  const slideClass = `slide-${animPhase}${slideDirection ? ` slide-${slideDirection}` : ''}`;

  return (
    <div
      className={`vity-layout ${activeSection === 'keychain' ? 'vity-light-mode' : ''}`}
      style={{ background: currentItem.bgGradient }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dekorasi background */}
      <div className="vity-bg-decoration vity-bg-circle-1" />
      <div className="vity-bg-decoration vity-bg-circle-2" />
      <div className="vity-bg-decoration vity-bg-circle-3" />

      {/* Header dengan logo dan tab switcher */}
      <Header
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onAdminTrigger={() => setIsAdminVisible(true)}
      />

      {/* Admin Panel Overlay */}
      {isAdminVisible && (
        <AdminPanel 
          onClose={() => setIsAdminVisible(false)} 
          onTestPopup={(type) => setTestScanResult(type)}
        />
      )}

      {/* Test Scan Popup Overlay */}
      {testScanResult && (
        <ScanPopup 
          type={typeof testScanResult === 'string' ? testScanResult : testScanResult.type} 
          prize={typeof testScanResult === 'object' ? testScanResult.prize : undefined}
          code={typeof testScanResult === 'object' ? testScanResult.code : undefined}
          onClose={() => setTestScanResult(null)} 
        />
      )}


      {/* Konten Utama */}
      <main className="vity-content" role="main">

        {/* Nama Item */}
        <h1 className={`vity-product-name ${slideClass}`} key={`name-${activeIndex}`}>
          {currentItem.name}
        </h1>

        {/* Tagline item */}
        <p className={`vity-tagline ${slideClass}`} key={`tagline-${activeIndex}`}>
          {currentItem.tagline}
        </p>

        {/* Showcase area — Arrow Kiri + Foto + Arrow Kanan */}
        <div className="vity-showcase">
          <button
            className="vity-nav-btn"
            onClick={goPrev}
            aria-label="Item sebelumnya"
          >
            <svg viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className={`vity-photo-frame ${slideClass}`} key={`photo-${activeIndex}`}>
            <div className="vity-photo-ring" />
            {currentItem.image ? (
              <img
                src={currentItem.image}
                alt={currentItem.name}
                loading="lazy"
              />
            ) : (
              <div className="vity-photo-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span>Foto {activeSection === 'menu' ? 'Produk' : 'Keychain'}</span>
              </div>
            )}
          </div>

          <button
            className="vity-nav-btn"
            onClick={goNext}
            aria-label="Item berikutnya"
          >
            <svg viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Dot Indicators — dipindah ke bawah showcase */}
        <nav className="vity-dots" aria-label="Navigasi item" style={{ marginTop: 'var(--space-xs)' }}>
          {Array.from({ length: dataSource.length }, (_, i) => (
            <button
              key={i}
              className={`vity-dot${i === activeIndex ? ' active' : ''}`}
              onClick={() => goToIndex(i)}
              aria-label={`Pilih item ${i + 1}`}
              aria-current={i === activeIndex ? 'true' : undefined}
            />
          ))}
        </nav>

        {/* Deskripsi item */}
        <p className={`vity-description ${slideClass}`} key={`desc-${activeIndex}`}>
          {currentItem.description}
        </p>
      </main>

      {/* Footer */}
      <footer className="vity-footer">
        <span className="vity-footer-brand">VITY</span>
        <span className="vity-footer-tagline">Nol Gula · Satu Rasa · Gacha Tiap Botol</span>
      </footer>

      {/* FAB Order ke WhatsApp */}
      <a 
        href={`https://wa.me/${VITY_WA_NUMBER}?text=${encodeURIComponent("Halo Vity, saya ingin memesan jus segar!")}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="vity-fab"
        aria-label="Order via WhatsApp"
        title="Order Sekarang!"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span className="vity-fab-text">Order Sekarang</span>
      </a>

    </div>
  );
}
