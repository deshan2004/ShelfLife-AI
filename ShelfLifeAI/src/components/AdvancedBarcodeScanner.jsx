// src/components/AdvancedBarcodeScanner.jsx
import { useState, useRef, useEffect } from 'react';
import MobileScanner from './MobileScanner';
import './AdvancedBarcodeScanner.css';

function AdvancedBarcodeScanner({ onScan, onClose }) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [showMobileScanner, setShowMobileScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };
    getCameras();
  }, []);

  // Barcode detection using BarcodeDetector API
  const detectBarcode = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || !cameraActive) {
      animationRef.current = requestAnimationFrame(detectBarcode);
      return;
    }
    
    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'code_128', 'itf']
        });
        
        const barcodes = await barcodeDetector.detect(videoRef.current);
        
        if (barcodes.length > 0) {
          const barcodeValue = barcodes[0].rawValue;
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
          setTimeout(() => setScanResult(null), 3000);
          return;
        }
      } else {
        console.log('BarcodeDetector not supported, using mock detection');
        // Mock detection for demo (remove in production)
        if (Math.random() < 0.05) {
          const mockBarcode = '8901234567890';
          setScanResult({ success: true, value: mockBarcode });
          onScan({ type: 'barcode', value: mockBarcode });
          stopCamera();
          setTimeout(() => setScanResult(null), 3000);
        }
      }
    } catch (error) {
      console.error('Barcode detection error:', error);
    }
    
    animationRef.current = requestAnimationFrame(detectBarcode);
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);
    
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
          setCameraActive(true);
          setScanning(false);
          animationRef.current = requestAnimationFrame(detectBarcode);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
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
    <div className="advanced-barcode-scanner">
      <div className="scanner-header">
        <div className="header-title">
          <i className="fas fa-qrcode"></i>
          <h4>Barcode Scanner</h4>
        </div>
        <button className="scanner-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Camera Selector */}
      {availableCameras.length > 1 && !cameraActive && (
        <div className="camera-selector">
          <label><i className="fas fa-camera"></i> Select Camera:</label>
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="camera-select"
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
      {!cameraActive && !showMobileScanner && (
        <div className="start-container">
          <button onClick={startCamera} className="btn-start-camera" disabled={scanning}>
            {scanning ? (
              <><i className="fas fa-spinner fa-spin"></i> Initializing Camera...</>
            ) : (
              <><i className="fas fa-video"></i> Start Camera Scanner</>
            )}
          </button>
        </div>
      )}

      {/* Active Camera View */}
      {cameraActive && !showMobileScanner && (
        <div className="camera-container">
          <video 
            ref={videoRef} 
            className="camera-preview" 
            autoPlay 
            playsInline 
            muted
          />
          <div className="scan-overlay">
            <div className="scan-frame">
              <div className="scan-line"></div>
              <div className="corner tl"></div>
              <div className="corner tr"></div>
              <div className="corner bl"></div>
              <div className="corner br"></div>
            </div>
            <div className="scan-instruction">
              <i className="fas fa-qrcode"></i>
              <span>Position barcode within the frame</span>
            </div>
          </div>
          <button onClick={stopCamera} className="btn-stop-camera">
            <i className="fas fa-stop"></i> Stop Scanner
          </button>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && !showMobileScanner && (
        <div className="camera-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{cameraError}</span>
        </div>
      )}

      {/* Mobile Scanner Option */}
      {!cameraActive && !showMobileScanner && (
        <>
          <div className="scanner-divider">
            <span>or</span>
          </div>
          
          <div className="mobile-scanner-option">
            <button 
              className="btn-mobile-scanner"
              onClick={() => setShowMobileScanner(true)}
            >
              <i className="fas fa-mobile-alt"></i>
              Scan with Phone Camera
            </button>
            <p className="mobile-scanner-note">
              <i className="fas fa-info-circle"></i>
              Use your phone to scan barcodes and expiry dates
            </p>
          </div>
        </>
      )}

      {/* Mobile Scanner Modal */}
      {showMobileScanner && (
        <MobileScanner 
          onScan={onScan} 
          onClose={() => setShowMobileScanner(false)} 
        />
      )}

      {/* Manual Entry Form */}
      {!cameraActive && !showMobileScanner && (
        <>
          <div className="scanner-divider">
            <span>or enter manually</span>
          </div>

          <form onSubmit={handleManualSubmit} className="scanner-form">
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter barcode number manually (e.g., 8901234567890)"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value.replace(/\s/g, ''))}
                className="scanner-input"
              />
              <button type="submit" className="btn-scan">
                <i className="fas fa-search"></i> Lookup
              </button>
            </div>
          </form>
        </>
      )}
      
      <div className="scanner-note">
        <i className="fas fa-info-circle"></i>
        <span>Auto-detects EAN-13, UPC-A, Code 128, QR codes, and more</span>
      </div>
      
      {scanResult && scanResult.success && (
        <div className="scan-feedback">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>✓ Barcode Detected!</strong>
            <p>{scanResult.value}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedBarcodeScanner;