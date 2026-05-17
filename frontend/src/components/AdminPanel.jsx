import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * ============================================================
 * AdminPanel Component — Panel Rahasia Admin
 * ============================================================
 * Panel ini diakses dengan menekan logo 5 kali.
 * Berisi tombol untuk generate QR Win dan Lose.
 * ============================================================
 */
export default function AdminPanel({ onClose, onTestPopup }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateQR = async (type) => {
    setIsLoading(true);
    setResult(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/admin/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error('Gagal terhubung ke server');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWin = () => generateQR('win');
  const handleGenerateLose = () => generateQR('lose');

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    
    // Create download link
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `Vity_QR_${result.data.type}_${result.data.qr_code}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="vity-admin-overlay">
      <div className="vity-admin-container">
        <header className="vity-admin-header">
          <h2>Admin Panel</h2>
          <button className="vity-admin-close" onClick={onClose} aria-label="Tutup Admin Panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="vity-admin-content" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              onClick={() => onTestPopup && onTestPopup('win')}
              style={{ flex: 1, padding: '8px', background: 'rgba(250,204,21,0.2)', border: '1px solid rgba(250,204,21,0.5)', color: '#fde047', borderRadius: '6px', cursor: 'pointer' }}
            >
              👁️ Preview Win
            </button>
            <button 
              onClick={() => onTestPopup && onTestPopup('lose')}
              style={{ flex: 1, padding: '8px', background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.5)', color: '#fca5a5', borderRadius: '6px', cursor: 'pointer' }}
            >
              👁️ Preview Lose
            </button>
          </div>

          <p className="vity-admin-hint">Silakan pilih jenis QR yang ingin dibuat:</p>
          
          <div className="vity-admin-actions">
            <button 
              className="vity-admin-btn win" 
              onClick={handleGenerateWin}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              <div className="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span>{isLoading && result?.data?.type === 'win' ? 'Loading...' : 'Generate Win QR'}</span>
            </button>

            <button 
              className="vity-admin-btn lose" 
              onClick={handleGenerateLose}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              <div className="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <span>{isLoading && result?.data?.type === 'lose' ? 'Loading...' : 'Generate Lose QR'}</span>
            </button>
          </div>

          {result && (
            <div style={{
              marginTop: '20px',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              textAlign: 'center',
              border: `2px solid ${result.data.type === 'win' ? 'rgba(250, 204, 21, 0.6)' : 'rgba(248, 113, 113, 0.6)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                {result.message}
              </p>
              
              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
                <QRCodeCanvas 
                  id="qr-canvas"
                  value={result.data.url} 
                  size={200} 
                  level={"M"}
                  includeMargin={true}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button 
                  onClick={downloadQR}
                  style={{
                    color: '#fff',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '18px', height: '18px'}}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Unduh QR
                </button>
              </div>

              <div style={{
                textAlign: 'left',
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Info URL:</strong> URL di atas adalah link yang tersimpan di dalam QR Code. Ketika pengguna memindai QR ini melalui kamera HP, browser mereka akan otomatis diarahkan ke URL tersebut untuk proses klaim hadiah.
              </div>
            </div>
          )}
        </div>

        <footer className="vity-admin-footer">
          <span>Vity System Admin v1.0</span>
        </footer>
      </div>
    </div>
  );
}
