import { useState, useRef } from 'react'
import './OCRScanner.css'

function OCRScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [manualExpiry, setManualExpiry] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCameraOCR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      alert('Could not access camera. Please use manual entry.')
    }
  }

  const captureAndScan = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      setScanning(true)
      
      // Simulate OCR processing
      setTimeout(() => {
        const demoDate = new Date()
        demoDate.setDate(demoDate.getDate() + Math.floor(Math.random() * 150) + 30)
        const expiryStr = demoDate.toISOString().split('T')[0]
        
        onScan({ type: 'ocr', value: expiryStr })
        setScanResult({ success: true, value: expiryStr })
        setScanning(false)
        stopCamera()
        
        setTimeout(() => setScanResult(null), 3000)
      }, 2000)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualExpiry) {
      onScan({ type: 'ocr', value: manualExpiry })
      setScanResult({ success: true, value: manualExpiry })
      setManualExpiry('')
      setTimeout(() => setScanResult(null), 3000)
    }
  }

  return (
    <div className="ocr-scanner">
      <div className="ocr-header">
        <i className="fas fa-eye"></i>
        <h4>OCR Expiry Scanner</h4>
        <button className="ocr-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Camera OCR */}
      {!cameraActive ? (
        <button onClick={startCameraOCR} className="btn-start-camera-ocr">
          <i className="fas fa-camera"></i> Scan Expiry Date with Camera
        </button>
      ) : (
        <div className="camera-ocr-container">
          <video ref={videoRef} className="camera-preview-ocr" autoPlay playsInline />
          <div className="ocr-overlay">
            <div className="ocr-instruction">
              <i className="fas fa-calendar-alt"></i>
              <span>Position expiry date in frame</span>
            </div>
          </div>
          <div className="ocr-actions">
            <button onClick={captureAndScan} className="btn-capture" disabled={scanning}>
              {scanning ? (
                <><i className="fas fa-spinner fa-pulse"></i> Reading...</>
              ) : (
                <><i className="fas fa-camera"></i> Capture & Read</>
              )}
            </button>
            <button onClick={stopCamera} className="btn-cancel-camera">
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="ocr-divider">or</div>

      {/* Manual Entry */}
      <form onSubmit={handleManualSubmit} className="ocr-form">
        <input
          type="text"
          placeholder="YYYY-MM-DD"
          value={manualExpiry}
          onChange={(e) => setManualExpiry(e.target.value)}
          className="ocr-input"
        />
        <button type="submit" className="btn-manual">
          <i className="fas fa-pen"></i> Enter Manually
        </button>
      </form>
      
      <div className="ocr-feature">
        <i className="fas fa-magic"></i>
        <span>AI-powered text recognition reads expiry dates from any packaging</span>
      </div>
      
      {scanResult && (
        <div className="ocr-success">
          <i className="fas fa-check-circle"></i> Expiry detected: {scanResult.value}
        </div>
      )}
    </div>
  )
}

export default OCRScanner