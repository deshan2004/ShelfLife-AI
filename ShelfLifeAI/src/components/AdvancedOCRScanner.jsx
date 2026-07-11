// src/components/AdvancedOCRScanner.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import './AdvancedOCRScanner.css';

// ✅ Product Name Prompt Modal (Inline)
function ProductNamePrompt({ isOpen, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="prompt-modal-overlay" onClick={onCancel}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-modal-header">
          <div className="prompt-icon">
            <i className="fas fa-box-open"></i>
          </div>
          <div>
            <h3>Add Product</h3>
            <p>Enter product name for the scanned expiry date</p>
          </div>
        </div>
        <div className="prompt-modal-body">
          <div className="prompt-input-wrapper">
            <i className="fas fa-tag"></i>
            <input
              ref={inputRef}
              type="text"
              className="prompt-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && value.trim() && onConfirm(value.trim())}
              placeholder="e.g., Fresh Milk, Yogurt, Bread..."
              autoFocus
            />
          </div>
          {value.length > 0 && (
            <span className="prompt-char-count">{value.length} characters</span>
          )}
        </div>
        <div className="prompt-modal-footer">
          <button className="prompt-btn-cancel" onClick={onCancel}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            className="prompt-btn-confirm" 
            onClick={() => onConfirm(value.trim())}
            disabled={!value.trim()}
          >
            <i className="fas fa-plus-circle"></i> Add Product
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Supplier Prompt Modal (Inline)
function SupplierPrompt({ isOpen, suppliers, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setSelectedSupplier('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (name) => {
    setSelectedSupplier(name);
    setValue(name);
  };

  return (
    <div className="prompt-modal-overlay" onClick={onCancel}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-modal-header">
          <div className="prompt-icon">
            <i className="fas fa-truck"></i>
          </div>
          <div>
            <h3>Select or Add Supplier</h3>
            <p>Choose an existing supplier or type a new one</p>
          </div>
        </div>
        <div className="prompt-modal-body">
          {suppliers.length > 0 && (
            <div className="supplier-list">
              <label className="supplier-list-label">Existing Suppliers</label>
              <div className="supplier-buttons">
                {suppliers.slice(0, 8).map((s) => (
                  <button
                    key={s.id || s.name}
                    className={`supplier-btn ${selectedSupplier === s.name ? 'active' : ''}`}
                    onClick={() => handleSelect(s.name)}
                  >
                    <i className="fas fa-building"></i> {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {suppliers.length > 0 && (
            <div className="supplier-divider"><span>or type new supplier</span></div>
          )}
          <div className="prompt-input-wrapper">
            <i className="fas fa-pen"></i>
            <input
              ref={inputRef}
              type="text"
              className="prompt-input"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setSelectedSupplier('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && value.trim() && onConfirm(value.trim())}
              placeholder="Type supplier name..."
              autoFocus
            />
            {value && !selectedSupplier && (
              <span className="supplier-badge-new">New</span>
            )}
          </div>
          {value.length > 0 && (
            <span className="prompt-char-count">{value.length} characters</span>
          )}
        </div>
        <div className="prompt-modal-footer">
          <button className="prompt-btn-cancel" onClick={onCancel}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            className="prompt-btn-confirm" 
            onClick={() => onConfirm(value.trim())}
            disabled={!value.trim()}
          >
            <i className="fas fa-check"></i> Select Supplier
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN OCR SCANNER COMPONENT
// ============================================================
function AdvancedOCRScanner({ onScan, onClose, existingSuppliers = [] }) {
  const [scanning, setScanning] = useState(false);
  const [manualExpiry, setManualExpiry] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedText, setDetectedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [usePreprocessing, setUsePreprocessing] = useState(true);
  const [language, setLanguage] = useState('eng+sin');

  // ✅ Prompt states
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showSupplierPrompt, setShowSupplierPrompt] = useState(false);
  const [pendingExpiryDate, setPendingExpiryDate] = useState(null);
  const [pendingProductName, setPendingProductName] = useState('');
  const [pendingSupplierName, setPendingSupplierName] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  // Clean up
  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Camera
  const startCamera = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setCapturedImage(null);
      setScanResult(null);
      setDetectedText('');
      setConfidence(0);
    } catch (err) {
      console.error('Camera error:', err);
      alert('කැමරාව ක්‍රියාත්මක කිරීමට නොහැකි විය.');
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(e => console.error(e));
      };
    }
  }, [cameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCapturedImage(null);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      return imageData;
    }
    return null;
  };

  // Image Pre-processing
  const preprocessImage = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const MAX_SIZE = 1200;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const imageDataObj = ctx.getImageData(0, 0, width, height);
        const data = imageDataObj.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const contrast = 1.4;
          const bright = 20;
          let newVal = (gray - 128) * contrast + 128 + bright;
          newVal = Math.max(0, Math.min(255, newVal));
          data[i] = data[i + 1] = data[i + 2] = newVal;
        }
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = imageData;
    });
  };

  // Date Parser
  const parseExpiryDate = (text) => {
    if (!text) return null;
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const patterns = [
      { regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, groups: [1, 2, 3] },
      { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, groups: [3, 1, 2] },
      { regex: /(\d{2})(\d{2})(\d{4})/, groups: [3, 1, 2] },
      { regex: /(?:exp|expiry|expiration|best before|use by|bb|bestby)[:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i, groups: [1, null, null] },
      { regex: /(?:exp|expiry)[:\s]*(\d{1,2})[-/](\d{1,2})[-/](\d{4})/i, groups: [3, 1, 2] },
      { regex: /(?:exp|expiry)[:\s]*(\d{1,2})[-/](\d{4})/i, groups: [2, 1, null] },
      { regex: /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/, groups: [1, 2, 3] },
      { regex: /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/, groups: [3, 1, 2] },
    ];

    const digits = cleanText.replace(/\D/g, '');
    if (digits.length === 8) {
      const y = digits.substring(0, 4), m = digits.substring(4, 6), d = digits.substring(6, 8);
      if (parseInt(y) >= 2000 && parseInt(y) <= 2100 && parseInt(m) >= 1 && parseInt(m) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31)
        return `${y}-${m}-${d}`;
      const d2 = digits.substring(0, 2), m2 = digits.substring(2, 4), y2 = digits.substring(4, 8);
      if (parseInt(y2) >= 2000 && parseInt(y2) <= 2100 && parseInt(m2) >= 1 && parseInt(m2) <= 12 && parseInt(d2) >= 1 && parseInt(d2) <= 31)
        return `${y2}-${m2}-${d2}`;
    }
    if (digits.length === 6) {
      const m = digits.substring(0, 2), y = digits.substring(2, 6);
      if (parseInt(y) >= 2000 && parseInt(y) <= 2100 && parseInt(m) >= 1 && parseInt(m) <= 12)
        return `${y}-${m}-01`;
      const d = digits.substring(0, 2), m2 = digits.substring(2, 4), y2 = parseInt(digits.substring(4, 6)) + 2000;
      if (y2 >= 2000 && y2 <= 2100 && parseInt(m2) >= 1 && parseInt(m2) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31)
        return `${y2}-${m2}-${d}`;
    }

    for (const p of patterns) {
      const match = cleanText.match(p.regex);
      if (match) {
        let year, month, day;
        if (p.groups[0] !== null) {
          const parts = p.groups.map(g => g !== null ? match[g] : null);
          if (parts[0] && parts[1] && parts[2]) {
            year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
          } else if (parts[0] && parts[1] && !parts[2]) {
            month = parseInt(parts[1]); year = parseInt(parts[0]); day = 1;
          } else {
            const dateStr = match[1];
            if (dateStr.includes('-') || dateStr.includes('/')) {
              const sep = dateStr.includes('-') ? '-' : '/';
              const parts2 = dateStr.split(sep);
              if (parts2.length === 3) {
                const a = parseInt(parts2[0]), b = parseInt(parts2[1]), c = parseInt(parts2[2]);
                if (a >= 2000 && a <= 2100) { year = a; month = b; day = c; }
                else if (c >= 2000 && c <= 2100) { year = c; month = a; day = b; }
                else continue;
              }
            }
          }
        }
        if (year && month && day && year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
        }
      }
    }
    return null;
  };

  // ============================================================
  // ✅ MAIN OCR PROCESSING + PROMPT
  // ============================================================
  const processImage = useCallback(async (imageData) => {
    setScanning(true);
    setOcrProgress('Initializing OCR...');
    setConfidence(0);
    setProcessingTime(0);
    const startTime = Date.now();

    try {
      let processedImage = imageData;
      if (usePreprocessing) {
        setOcrProgress('Enhancing image quality...');
        processedImage = await preprocessImage(imageData);
      }

      setOcrProgress('Loading OCR engine...');
      const TesseractModule = await import('tesseract.js');
      const Tesseract = TesseractModule.default;

      const worker = await Tesseract.createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setOcrProgress(`Reading: ${Math.round(m.progress * 100)}%`);
        }
      });

      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/-:,. ',
        preserve_interword_spaces: '1'
      });

      setOcrProgress('Reading text from image...');
      const result = await worker.recognize(processedImage);
      const extractedText = result.data.text;

      let avgConfidence = 0;
      if (result.data.words && result.data.words.length > 0) {
        avgConfidence = result.data.words.reduce((sum, w) => sum + (w.confidence || 0), 0) / result.data.words.length;
      }
      setConfidence(Math.round(avgConfidence * 100));
      setDetectedText(extractedText);

      const expiryDate = parseExpiryDate(extractedText);
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      setProcessingTime(parseFloat(elapsedTime));

      await worker.terminate();
      workerRef.current = null;

      if (expiryDate) {
        // ✅ Show Product Name Prompt first
        setPendingExpiryDate(expiryDate);
        setShowNamePrompt(true);
        
        // Show result preview
        const today = new Date(); today.setHours(0,0,0,0);
        const expiry = new Date(expiryDate); expiry.setHours(0,0,0,0);
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        let status = daysLeft <= 0 ? 'Expired' : daysLeft <= 7 ? 'Expiring Soon' : 'Healthy';
        let statusColor = daysLeft <= 0 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#22c55e';
        
        setScanResult({
          success: true,
          expiryDate: expiryDate,
          daysLeft: daysLeft,
          status: { text: status, color: statusColor },
          confidence: Math.round(avgConfidence * 100),
          detectedText: extractedText.slice(0, 500)
        });
      } else {
        setScanResult({
          success: false,
          error: 'No valid expiry date found. Try better lighting or manual entry.',
          detectedText: extractedText.slice(0, 500),
          confidence: Math.round(avgConfidence * 100)
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setScanResult({ success: false, error: 'Failed to process image. Please try again.' });
    } finally {
      setScanning(false);
      setOcrProgress('');
    }
  }, [onScan, usePreprocessing, language]);

  // ✅ Handle Product Name Confirm
  const handleNameConfirm = (productName) => {
    setShowNamePrompt(false);
    if (productName) {
      setPendingProductName(productName);
      // Show Supplier Prompt
      setShowSupplierPrompt(true);
    } else {
      setPendingExpiryDate(null);
    }
  };

  // ✅ Handle Supplier Confirm
  const handleSupplierConfirm = (supplierName) => {
    setShowSupplierPrompt(false);
    if (supplierName && pendingExpiryDate && pendingProductName) {
      // ✅ Now add product with expiry date, name, and supplier
      const productData = {
        name: pendingProductName,
        supplier: supplierName,
        expiryDate: pendingExpiryDate,
        stock: 1,
        costPrice: 100,
        sellingPrice: 150,
        batch: `OCR-${Date.now().toString().slice(-6)}`,
        batchDate: new Date().toISOString().split('T')[0]
      };
      
      // Send to parent to add product
      onScan({
        type: 'ocr',
        value: pendingExpiryDate,
        productData: productData
      });
      
      // Reset
      setPendingExpiryDate(null);
      setPendingProductName('');
      setPendingSupplierName('');
      
      // Close scanner after product added
      setTimeout(() => onClose(), 1500);
    } else {
      setPendingExpiryDate(null);
      setPendingProductName('');
    }
  };

  // ✅ Cancel handlers
  const handleNameCancel = () => {
    setShowNamePrompt(false);
    setPendingExpiryDate(null);
  };

  const handleSupplierCancel = () => {
    setShowSupplierPrompt(false);
    setPendingExpiryDate(null);
    setPendingProductName('');
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleCaptureAndScan = () => {
    const imageData = captureImage();
    if (imageData) {
      setCapturedImage(imageData);
      processImage(imageData);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        setCapturedImage(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualExpiry) {
      const parsed = parseExpiryDate(manualExpiry);
      if (parsed) {
        // ✅ Show prompts for manual entry too
        setPendingExpiryDate(parsed);
        setShowNamePrompt(true);
        setScanResult({
          success: true,
          expiryDate: parsed,
          confidence: 100,
          detectedText: 'Manual Entry'
        });
        setManualExpiry('');
      } else {
        alert('Invalid date format. Please use YYYY-MM-DD, DD/MM/YYYY, or MM/YYYY.');
      }
    }
  };

  const handleRetry = () => {
    setScanResult(null);
    setDetectedText('');
    setConfidence(0);
    setCapturedImage(null);
    setPendingExpiryDate(null);
    setPendingProductName('');
    if (cameraActive) startCamera();
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="advanced-ocr-scanner">
      <div className="ocr-header">
        <div className="header-title">
          <i className="fas fa-eye"></i>
          <h4>AI Expiry Scanner</h4>
        </div>
        <button className="ocr-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Settings */}
      <div className="ocr-settings">
        <label className="ocr-toggle">
          <span>Enhance Image</span>
          <input type="checkbox" checked={usePreprocessing} onChange={(e) => setUsePreprocessing(e.target.checked)} />
          <span className="toggle-slider"></span>
        </label>
        <select className="ocr-language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="eng">English</option>
          <option value="eng+sin">English + Sinhala</option>
          <option value="eng+tam">English + Tamil</option>
          <option value="eng+sin+tam">All Languages</option>
        </select>
      </div>

      {/* Camera / Upload */}
      {!cameraActive && !capturedImage ? (
        <div className="ocr-options">
          <button onClick={startCamera} className="btn-start-camera-ocr">
            <i className="fas fa-camera"></i> Scan with Camera
          </button>
          <div className="ocr-divider">or</div>
          <label className="btn-upload">
            <i className="fas fa-upload"></i> Upload Photo
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      ) : cameraActive && !capturedImage ? (
        <div className="camera-ocr-container">
          <video ref={videoRef} className="camera-preview-ocr" autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="ocr-overlay">
            <div className="ocr-instruction">
              <i className="fas fa-camera"></i>
              <span>Position date clearly and tap "Capture & Read"</span>
            </div>
          </div>
          <div className="ocr-actions">
            <button onClick={handleCaptureAndScan} className="btn-capture" disabled={scanning}>
              {scanning ? <><i className="fas fa-spinner fa-pulse"></i> {ocrProgress || 'Reading...'}</> : <><i className="fas fa-camera"></i> Capture & Read</>}
            </button>
            <button onClick={stopCamera} className="btn-cancel-camera">
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="ocr-preview">
          <div className="preview-image">
            <img src={capturedImage} alt="Captured" />
            {scanning && (
              <div className="processing-overlay">
                <div className="processing-spinner"></div>
                <div className="processing-text">{ocrProgress}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: ocrProgress.includes('%') ? ocrProgress.match(/(\d+)%/)?.[1] + '%' || '50%' : '50%' }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="preview-actions">
            <button onClick={handleRetry} className="btn-retry"><i className="fas fa-redo"></i> Retry</button>
            <button onClick={stopCamera} className="btn-done"><i className="fas fa-check"></i> Done</button>
          </div>
        </div>
      )}

      {/* Results */}
      {scanResult && !scanning && (
        <div className={`ocr-success ${scanResult.success ? 'success' : 'error'}`}>
          <div className="ocr-result-header">
            <i className={`fas ${scanResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <div>
              <strong>
                {scanResult.success ? `✅ Detected: ${scanResult.expiryDate}` : scanResult.error}
              </strong>
              {scanResult.confidence !== undefined && scanResult.confidence > 0 && (
                <span className="confidence-badge">Confidence: {scanResult.confidence}%</span>
              )}
              {scanResult.daysLeft !== undefined && scanResult.success && (
                <span className="days-badge" style={{ background: scanResult.status.color + '20', color: scanResult.status.color }}>
                  {scanResult.daysLeft} days left • {scanResult.status.text}
                </span>
              )}
            </div>
          </div>
          {scanResult.detectedText && (
            <div className="raw-text">
              <details>
                <summary>📄 Show detected text</summary>
                <pre>{scanResult.detectedText}</pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry */}
      <form onSubmit={handleManualSubmit} className="ocr-form">
        <div className="ocr-form-group">
          <label>Or enter expiry date manually:</label>
          <div className="ocr-input-group">
            <input type="text" placeholder="e.g., 2025-12-31 or 31/12/2025" value={manualExpiry} onChange={(e) => setManualExpiry(e.target.value)} className="ocr-input" />
            <button type="submit" className="btn-manual"><i className="fas fa-edit"></i> Add</button>
          </div>
        </div>
      </form>

      <div className="ocr-feature">
        <i className="fas fa-robot"></i>
        <span>
          {usePreprocessing ? '🔬 Enhanced OCR active' : '📄 Basic OCR mode'}
          {processingTime > 0 && ` • ⏱️ ${processingTime}s`}
        </span>
      </div>

      {/* ✅ Product Name Prompt */}
      <ProductNamePrompt
        isOpen={showNamePrompt}
        onConfirm={handleNameConfirm}
        onCancel={handleNameCancel}
      />

      {/* ✅ Supplier Prompt */}
      <SupplierPrompt
        isOpen={showSupplierPrompt}
        suppliers={existingSuppliers}
        onConfirm={handleSupplierConfirm}
        onCancel={handleSupplierCancel}
      />
    </div>
  );
}

export default AdvancedOCRScanner;