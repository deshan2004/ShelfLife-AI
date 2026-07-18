// src/components/AdvancedBarcodeScanner.jsx
import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import './AdvancedBarcodeScanner.css';

function AdvancedBarcodeScanner({ onScan, onClose }) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const lastDecodeTimeRef = useRef(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        if (backCamera) {
          setSelectedCamera(backCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };
    getCameras();
  }, []);

  // Barcode detection
  const detectBarcode = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || !cameraActive) {
      animationRef.current = requestAnimationFrame(detectBarcode);
      return;
    }
    
    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf']
        });
        
        const barcodes = await barcodeDetector.detect(videoRef.current);
        
        if (barcodes.length > 0) {
          setIsDetecting(true);
          const barcodeValue = barcodes[0].rawValue;
          setDetectedCount(prev => prev + 1);
          
          // Play success sound
          try {
            const audio = new Audio('/beep.mp3');
            audio.volume = 0.3;
            audio.play();
          } catch (e) {}
          
          setScanResult({ success: true, value: barcodeValue });
          
          onScan({ 
            type: 'barcode', 
            value: barcodeValue,
            productInfo: { 
              name: `Product ${barcodeValue.slice(-4)}`, 
              brand: 'Scanned Item' 
            }
          });
          
          stopCamera();
          setTimeout(() => {
            setScanResult(null);
            setIsDetecting(false);
          }, 2500);
          return;
        }
      } else {
        // Fallback to ZXing if native BarcodeDetector is unavailable
        if (!window.zxingReader) {
          window.zxingReader = new BrowserMultiFormatReader();
        }
        
        const now = Date.now();
        if (now - lastDecodeTimeRef.current > 500) {
          lastDecodeTimeRef.current = now;
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const img = new Image();
          img.src = canvas.toDataURL('image/jpeg', 0.8);
          await new Promise(r => { img.onload = r; img.onerror = r; });
          
          try {
            const result = await window.zxingReader.decodeFromImageElement(img);
            if (result) {
              setIsDetecting(true);
              const barcodeValue = result.getText();
              setDetectedCount(prev => prev + 1);
              
              try {
                const audio = new Audio('/beep.mp3');
                audio.volume = 0.3;
                audio.play();
              } catch (e) {}
              
              setScanResult({ success: true, value: barcodeValue });
              
              onScan({ 
                type: 'barcode', 
                value: barcodeValue,
                productInfo: { 
                  name: `Product ${barcodeValue.slice(-4)}`, 
                  brand: 'Scanned Item' 
                }
              });
              
              stopCamera();
              setTimeout(() => {
                setScanResult(null);
                setIsDetecting(false);
              }, 2500);
              return;
            }
          } catch (e) {
            // ZXing throws if no barcode is found
          }
        }
      }
    } catch (error) {
      console.error('Barcode detection error:', error);
    }
    
    animationRef.current = requestAnimationFrame(detectBarcode);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageBitmap = await createImageBitmap(file);
      
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf']
        });
        
        const barcodes = await barcodeDetector.detect(imageBitmap);
        
        if (barcodes.length > 0) {
          const barcodeValue = barcodes[0].rawValue;
          
          try {
            const audio = new Audio('/beep.mp3');
            audio.volume = 0.3;
            audio.play();
          } catch (e) {}
          
          setScanResult({ success: true, value: barcodeValue });
          
          onScan({ 
            type: 'barcode', 
            value: barcodeValue,
            productInfo: { 
              name: `Product ${barcodeValue.slice(-4)}`, 
              brand: 'Scanned from Photo' 
            }
          });
          
          setTimeout(() => {
            setScanResult(null);
          }, 3000);
        } else {
          setCameraError("No barcode detected in the image.");
        }
      } else {
        // Fallback to ZXing for file upload if native API is missing
        const reader = new BrowserMultiFormatReader();
        const imageUrl = URL.createObjectURL(file);
        
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        try {
          const result = await reader.decodeFromImageElement(img);
          if (result) {
            const barcodeValue = result.getText();
            
            try {
              const audio = new Audio('/beep.mp3');
              audio.volume = 0.3;
              audio.play();
            } catch (e) {}
            
            setScanResult({ success: true, value: barcodeValue });
            
            onScan({ 
              type: 'barcode', 
              value: barcodeValue,
              productInfo: { 
                name: `Product ${barcodeValue.slice(-4)}`, 
                brand: 'Scanned from Photo' 
              }
            });
            
            setTimeout(() => {
              setScanResult(null);
            }, 3000);
          }
        } catch (err) {
          setCameraError("No barcode detected in the image.");
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      }
    } catch (error) {
      console.error('File scan error:', error);
      setCameraError("Failed to process the image.");
    }
    
    e.target.value = '';
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);
    setCameraActive(true);
    setDetectedCount(0);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: { 
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setScanning(false);
          animationRef.current = requestAnimationFrame(detectBarcode);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraActive(false);
      
      let errorMessage = 'Could not access camera. ';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Please allow camera access in your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else {
        errorMessage += err.message;
      }
      setCameraError(errorMessage);
      setScanning(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setScanning(false);
    setIsDetecting(false);
  };

  // Manual barcode submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode) {
      onScan({ 
        type: 'barcode', 
        value: manualBarcode,
        productInfo: { name: `Product ${manualBarcode.slice(-4)}`, brand: 'Manual Entry' }
      });
      setScanResult({ success: true, value: manualBarcode });
      setManualBarcode('');
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="scanner-modal-overlay" onClick={onClose}>
      <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scanner-modal-header">
          <div className="scanner-modal-title">
            <div className="scanner-icon">
              <i className="fas fa-qrcode"></i>
            </div>
            <div>
              <h3>Scan Barcode</h3>
              <p>{cameraActive ? 'Point camera at the barcode' : 'Choose a scanning method'}</p>
            </div>
          </div>
          <button className="scanner-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Camera Selector */}
        {availableCameras.length > 1 && !cameraActive && (
          <div className="scanner-camera-selector">
            <i className="fas fa-camera"></i>
            <select 
              value={selectedCamera} 
              onChange={(e) => setSelectedCamera(e.target.value)}
            >
              {availableCameras.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start Camera Button */}
        {!cameraActive && !scanResult && (
          <div className="scanner-start-section" style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button 
              onClick={startCamera} 
              className="scanner-start-btn" 
              disabled={scanning}
            >
              {scanning ? (
                <><i className="fas fa-spinner fa-spin"></i> Initializing...</>
              ) : (
                <><i className="fas fa-camera"></i> Start Scanner</>
              )}
            </button>
            <input 
              type="file" 
              id="barcode-upload" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            <label htmlFor="barcode-upload" className="scanner-start-btn" style={{ background: 'var(--color-secondary, #2a3d2a)', color: '#9bbf9b', border: '1px solid rgba(57, 231, 95, 0.2)' }}>
              <i className="fas fa-image"></i> Upload Photo
            </label>
          </div>
        )}

        {/* Camera Preview */}
        {cameraActive && (
          <div className="scanner-camera-wrapper">
            <div className="scanner-camera-box">
              <video 
                ref={videoRef} 
                className="scanner-video" 
                autoPlay 
                playsInline 
                muted
              />
              
              {/* Scan Overlay */}
              <div className="scanner-overlay">
                <div className="scanner-frame">
                  <div className="scanner-corner tl"></div>
                  <div className="scanner-corner tr"></div>
                  <div className="scanner-corner bl"></div>
                  <div className="scanner-corner br"></div>
                  <div className="scanner-line"></div>
                </div>
                <div className="scanner-hint">
                  <i className="fas fa-qrcode"></i>
                  <span>{isDetecting ? '✅ Detected!' : 'Position barcode in the frame'}</span>
                </div>
              </div>

              {/* Status indicators */}
              <div className="scanner-status">
                <span className={`scanner-dot ${isDetecting ? 'detected' : 'scanning'}`}></span>
                <span>{isDetecting ? 'Barcode detected!' : 'Scanning...'}</span>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="scanner-controls">
              <button className="scanner-stop-btn" onClick={stopCamera}>
                <i className="fas fa-stop"></i> Stop
              </button>
              <button className="scanner-flash-btn" onClick={() => {
                // Toggle flash if available
                showToast('💡 Flash toggled');
              }}>
                <i className="fas fa-bolt"></i>
              </button>
            </div>
          </div>
        )}

        {/* Camera Error */}
        {cameraError && !cameraActive && (
          <div className="scanner-error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{cameraError}</span>
            <button onClick={() => setCameraError(null)}>Dismiss</button>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && scanResult.success && (
          <div className="scanner-result">
            <i className="fas fa-check-circle"></i>
            <div>
              <strong>✅ Barcode Detected!</strong>
              <p>{scanResult.value}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        {!cameraActive && !scanResult && (
          <div className="scanner-divider">
            <span>or</span>
          </div>
        )}

        {/* Manual Entry */}
        {!cameraActive && !scanResult && (
          <form onSubmit={handleManualSubmit} className="scanner-manual-form">
            <div className="scanner-input-group">
              <input
                type="text"
                placeholder="Enter barcode manually"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value.replace(/\s/g, ''))}
                className="scanner-manual-input"
              />
              <button type="submit" className="scanner-manual-btn">
                <i className="fas fa-search"></i> Lookup
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="scanner-footer">
          <i className="fas fa-info-circle"></i>
          <span>Supports EAN-13, UPC-A, Code 128, QR codes & more</span>
        </div>
      </div>
    </div>
  );
}

export default AdvancedBarcodeScanner;