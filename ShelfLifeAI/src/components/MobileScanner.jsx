import { useState, useEffect, useRef } from 'react';
import './MobileScanner.css';

function MobileScanner({ onScan, onClose, pairingCode: propPairingCode }) {
  const [scanType, setScanType] = useState('barcode');
  const [pairingCode, setPairingCode] = useState(propPairingCode || null);
  const [scanResult, setScanResult] = useState(null);
  const [isPaired, setIsPaired] = useState(false);
  const [mobileUrl, setMobileUrl] = useState('');
  const [ngrokUrl, setNgrokUrl] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Generate unique pairing code if not provided
    const code = propPairingCode || Math.random().toString(36).substring(2, 10).toUpperCase();
    setPairingCode(code);
    
    // Get ngrok URL from current window location
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.split('/').slice(0, 3).join('/');
    setNgrokUrl(baseUrl);
    
    const url = `${baseUrl}/mobile-scan.html?pair=${code}&type=${scanType}`;
    setMobileUrl(url);
    
    // Listen for messages from mobile scanner page
    const handleMessage = (event) => {
      if (!event.data) return;
      
      // Handle scan result
      if (event.data.type === 'scanResult' && event.data.code === code) {
        const scanData = {
          type: event.data.scanType,
          value: event.data.value,
          data: event.data.data
        };
        console.log('📥 Scan received from mobile:', scanData);
        
        setScanResult({ 
          success: true, 
          type: scanData.type,
          value: scanData.value,
          productData: scanData.data || null
        });
        
        // Add to history
        setScanHistory(prev => [
          { 
            type: scanData.type, 
            value: scanData.value,
            time: new Date().toLocaleTimeString()
          },
          ...prev
        ].slice(0, 10));
        
        // Play beep sound
        try {
          const audio = new Audio('/beep.mp3');
          audio.volume = 0.3;
          audio.play().catch(e => console.log('Audio not supported'));
        } catch (e) {}
        
        // Send to parent component (Inventory)
        if (onScan) {
          onScan(scanData);
        }
        
        // Auto-clear result after 5 seconds
        setTimeout(() => {
          setScanResult(null);
        }, 5000);
      }
      
      // Handle ready event
      if (event.data.type === 'ready' && event.data.code === code) {
        setIsPaired(true);
      }
    };
    
    window.addEventListener('message', handleMessage);

    // Also listen to ntfy.sh for zero-config cross-device pairing
    const eventSource = new EventSource(`https://ntfy.sh/shelflife_scan_${code}/sse`);
    eventSource.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event === 'message') {
          const data = JSON.parse(message.message);
          
          if (data.type === 'ready') {
            setIsPaired(true);
          } else if (data.type === 'scanResult') {
            const scanData = {
              type: data.scanType,
              value: data.value,
              data: data.data
            };
            console.log('📥 Scan received from Cloud:', scanData);
            
            setScanResult({ 
              success: true, 
              type: scanData.type,
              value: scanData.value,
              productData: scanData.data || null
            });
            
            setScanHistory(prev => [
              { type: scanData.type, value: scanData.value, time: new Date().toLocaleTimeString() },
              ...prev
            ].slice(0, 10));
            
            try {
              const audio = new Audio('/beep.mp3');
              audio.volume = 0.3;
              audio.play().catch(e => console.log('Audio not supported'));
            } catch (err) {}
            
            if (onScan) onScan(scanData);
            
            setTimeout(() => setScanResult(null), 5000);
          }
        }
      } catch (err) {
        console.error("Error parsing cloud message", err);
      }
    };

    return () => {
      window.removeEventListener('message', handleMessage);
      eventSource.close();
    };
  }, [onScan, scanType, propPairingCode]);

  const openMobileScanner = () => {
    window.open(mobileUrl, '_blank', 'width=450,height=800,menubar=no,toolbar=no,location=no');
    setIsPaired(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mobileUrl);
    alert('✅ Link copied! Send it to your phone via WhatsApp, Email, or SMS.');
  };

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
        <p>Scan using your phone camera • {scanType === 'barcode' ? '📷 Barcode' : '📅 OCR'}</p>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Status */}
      <div className="ngrok-success">
        <i className={`fas ${isPaired ? 'fa-check-circle' : 'fa-clock'}`}></i>
        <div>
          <strong>{isPaired ? '✓ Connected!' : 'Waiting for connection...'}</strong>
          <p>{isPaired ? 'Phone is ready to scan' : 'Open the scanner on your phone to connect'}</p>
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && scanResult.success && (
        <div className="scan-result-success">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>✓ {scanResult.type === 'barcode' ? 'Barcode' : 'Expiry Date'} Detected!</strong>
            <p>{scanResult.value}</p>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              {scanResult.productData ? 'Product data included' : 'Add product details in inventory'}
            </small>
          </div>
        </div>
      )}

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
            <span>✅ Connected! Point your phone at the product to scan.</span>
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

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="scan-history-section">
          <h4>📋 Recent Scans</h4>
          <div className="scan-history-list">
            {scanHistory.map((item, index) => (
              <div key={index} className="scan-history-item">
                <span className="scan-type">{item.type === 'barcode' ? '📷' : '📅'}</span>
                <span className="scan-value">{item.value}</span>
                <span className="scan-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileScanner;