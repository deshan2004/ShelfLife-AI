// src/components/MobileScanner.jsx
import { useState, useEffect } from 'react';
import './MobileScanner.css';

function MobileScanner({ onScan, onClose }) {
  const [scanType, setScanType] = useState('barcode');
  const [pairingCode, setPairingCode] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isPaired, setIsPaired] = useState(false);
  const [mobileUrl, setMobileUrl] = useState('');
  const [ngrokUrl, setNgrokUrl] = useState('');

  useEffect(() => {
    // Generate unique pairing code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setPairingCode(code);
    
    // Get ngrok URL from current window location
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.split('/').slice(0, 3).join('/');
    setNgrokUrl(baseUrl);
    
    const url = `${baseUrl}/mobile-scan.html?pair=${code}&type=${scanType}`;
    setMobileUrl(url);
    
    // Listen for messages from mobile scanner page
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'scan' && event.data.code === code) {
        setScanResult({ success: true, value: event.data.scanData.value });
        onScan(event.data.scanData);
        
        // Play beep sound
        const audio = new Audio('/beep.mp3');
        audio.play().catch(e => console.log('Audio not supported'));
        
        setTimeout(() => setScanResult(null), 3000);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onScan, scanType]);

  const openMobileScanner = () => {
    window.open(mobileUrl, '_blank', 'width=450,height=750,menubar=no,toolbar=no,location=no');
    setIsPaired(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mobileUrl);
    alert('✅ Link copied! Send it to your phone via WhatsApp, Email, or SMS.');
  };

  // Generate QR code
  const generateQRCodeUrl = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(mobileUrl)}`;
  };

  return (
    <div className="mobile-scanner">
      <div className="mobile-scanner-header">
        <div className="header-icon">
          <i className="fas fa-mobile-alt"></i>
        </div>
        <h3>Mobile Scanner</h3>
        <p>Scan using your phone camera</p>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* ngrok Success Message */}
      <div className="ngrok-success">
        <i className="fas fa-check-circle"></i>
        <div>
          <strong>✓ External Access Enabled!</strong>
          <p>Your ngrok tunnel is active. Share this link with anyone, anywhere!</p>
        </div>
      </div>

      <div className="pairing-section">
        <div className="pairing-code-container">
          <span className="code-label">Pairing Code:</span>
          <span className="code-value">{pairingCode}</span>
        </div>
        
        <div className="qr-code-container">
          <img 
            src={generateQRCodeUrl()} 
            alt="QR Code to scan with phone" 
            className="qr-code"
          />
          <p className="qr-hint">
            <i className="fas fa-qrcode"></i> 
            Scan this QR code with your phone camera
          </p>
        </div>
        
        <div className="mobile-links">
          <button className="btn-open-mobile" onClick={openMobileScanner}>
            <i className="fas fa-external-link-alt"></i>
            Open on this device
          </button>
          
          <button className="btn-copy-link" onClick={copyToClipboard}>
            <i className="fas fa-copy"></i>
            Copy link to send to phone
          </button>
        </div>
        
        <div className="share-buttons">
          <button className="share-whatsapp" onClick={() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(mobileUrl)}`, '_blank');
          }}>
            <i className="fab fa-whatsapp"></i> WhatsApp
          </button>
          <button className="share-telegram" onClick={() => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(mobileUrl)}&text=Scan%20products%20for%20ShelfLife%20AI`, '_blank');
          }}>
            <i className="fab fa-telegram"></i> Telegram
          </button>
          <button className="share-email" onClick={() => {
            window.location.href = `mailto:?subject=ShelfLife AI Mobile Scanner&body=Open this link on your phone to scan products: ${mobileUrl}`;
          }}>
            <i className="fas fa-envelope"></i> Email
          </button>
        </div>
        
        {isPaired && (
          <div className="paired-status">
            <i className="fas fa-check-circle"></i>
            <span>Ready to scan! Point your phone at the product.</span>
          </div>
        )}
        
        <div className="instruction-card">
          <i className="fas fa-info-circle"></i>
          <div>
            <strong>How to connect your phone:</strong>
            <ul>
              <li><strong>Method 1:</strong> Scan the QR code above with your phone's camera</li>
              <li><strong>Method 2:</strong> Click WhatsApp/Telegram/Email to share the link</li>
              <li><strong>Method 3:</strong> Copy the link and paste it on your phone's browser</li>
            </ul>
            <div className="ngrok-url">
              <i className="fas fa-globe"></i>
              <span>Your public URL:</span>
              <code>{ngrokUrl}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="scanner-type-selector">
        <button 
          className={`type-btn ${scanType === 'barcode' ? 'active' : ''}`}
          onClick={() => setScanType('barcode')}
        >
          <i className="fas fa-barcode"></i> Barcode Scanner
        </button>
        <button 
          className={`type-btn ${scanType === 'ocr' ? 'active' : ''}`}
          onClick={() => setScanType('ocr')}
        >
          <i className="fas fa-eye"></i> Expiry Date Scanner
        </button>
      </div>

      <div className="instruction-section">
        <i className="fas fa-phone-alt"></i>
        <div>
          <h4>How to scan:</h4>
          <ol>
            <li>Open the mobile scanner on your phone (via QR code or link)</li>
            <li>Point your phone camera at the product barcode or expiry date</li>
            <li>When detected, results will instantly appear here</li>
            <li>Product will be automatically added to inventory</li>
          </ol>
        </div>
      </div>

      {scanResult && scanResult.success && (
        <div className="scan-result-success">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>✓ Scan Successful!</strong>
            <p>{scanResult.value}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileScanner;