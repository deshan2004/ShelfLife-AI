import { useState, useRef, useEffect } from 'react'
import './BarcodeScanner.css'

function BarcodeScanner({ onScan, onClose }) {
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        
        // Simulate barcode detection after 3 seconds (demo)
        setTimeout(() => {
          if (cameraActive) {
            const mockBarcode = '8901234567890'
            handleBarcodeDetected(mockBarcode)
            stopCamera()
          }
        }, 3000)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      alert('Could not access camera. Please use manual entry.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const handleBarcodeDetected = (barcode) => {
    onScan({ type: 'barcode', value: barcode })
    setScanResult({ success: true, value: barcode })
    setTimeout(() => setScanResult(null), 3000)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualBarcode) {
      handleBarcodeDetected(manualBarcode)
      setManualBarcode('')
    }
  }

  return (
    <div className="barcode-scanner">
      <div className="scanner-header">
        <i className="fas fa-qrcode"></i>
        <h4>Barcode Scanner</h4>
        <button className="scanner-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Camera View */}
      {!cameraActive ? (
        <button onClick={startCamera} className="btn-start-camera">
          <i className="fas fa-video"></i> Start Camera Scanner
        </button>
      ) : (
        <div className="camera-container">
          <video ref={videoRef} className="camera-preview" autoPlay playsInline />
          <div className="scan-overlay">
            <div className="scan-frame"></div>
          </div>
          <button onClick={stopCamera} className="btn-stop-camera">
            <i className="fas fa-stop"></i> Stop Camera
          </button>
        </div>
      )}

      <div className="scanner-divider">or</div>

      {/* Manual Entry */}
      <form onSubmit={handleManualSubmit} className="scanner-form">
        <input
          type="text"
          placeholder="Enter barcode number manually"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          className="scanner-input"
        />
        <button type="submit" className="btn-scan">
          <i className="fas fa-search"></i> Lookup
        </button>
      </form>
      
      <div className="scanner-note">
        <i className="fas fa-info-circle"></i>
        <span>Position barcode in frame for automatic detection</span>
      </div>
      
      {scanResult && (
        <div className="scan-success">
          <i className="fas fa-check-circle"></i> Scanned: {scanResult.value}
        </div>
      )}
    </div>
  )
}

export default BarcodeScanner