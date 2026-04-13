import { useState, useRef } from 'react'
import { detectExpiryDateFromImage, calculateDaysLeft, getExpiryStatus } from '../utils/advancedOCRHelper'
import './AdvancedOCRScanner.css'

function AdvancedOCRScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [manualExpiry, setManualExpiry] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [ocrProgress, setOcrProgress] = useState({ stage: '', message: '', progress: 0 })
  const [capturedImage, setCapturedImage] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
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
        setCapturedImage(null)
        setScanResult(null)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      alert('Could not access camera. Please check permissions and try again.')
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Get image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)
      
      return imageData
    }
    return null
  }

  const processImage = async (imageData) => {
    setScanning(true)
    setOcrProgress({ stage: 'starting', message: 'Starting OCR processing...', progress: 0 })
    
    try {
      const result = await detectExpiryDateFromImage(imageData, (progress) => {
        setOcrProgress(progress)
      })
      
      if (result.isValid) {
        const daysLeft = calculateDaysLeft(result.formatted)
        const status = getExpiryStatus(daysLeft)
        
        const scanData = {
          type: 'ocr',
          value: result.formatted,
          daysLeft: daysLeft,
          status: status,
          confidence: result.confidence,
          rawText: result.raw
        }
        
        onScan(scanData)
        setScanResult({ 
          success: true, 
          expiryDate: result.formatted,
          daysLeft: daysLeft,
          status: status,
          rawText: result.raw
        })
        
        // Auto-close after 5 seconds on success
        setTimeout(() => {
          stopCamera()
          onClose()
        }, 5000)
      } else {
        setScanResult({ 
          success: false, 
          error: result.error || 'Could not detect expiry date',
          rawText: result.raw
        })
      }
    } catch (error) {
      console.error('OCR processing error:', error)
      setScanResult({ 
        success: false, 
        error: 'Failed to process image. Please try again or enter manually.'
      })
    } finally {
      setScanning(false)
      setOcrProgress({ stage: '', message: '', progress: 0 })
    }
  }

  const handleCaptureAndScan = () => {
    const imageData = captureImage()
    if (imageData) {
      processImage(imageData)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target.result
        setCapturedImage(imageData)
        processImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setCapturedImage(null)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualExpiry) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(manualExpiry)) {
        const daysLeft = calculateDaysLeft(manualExpiry)
        const status = getExpiryStatus(daysLeft)
        onScan({ 
          type: 'ocr', 
          value: manualExpiry,
          daysLeft: daysLeft,
          status: status
        })
        setScanResult({ 
          success: true, 
          expiryDate: manualExpiry,
          daysLeft: daysLeft,
          status: status
        })
        setManualExpiry('')
        setTimeout(() => setScanResult(null), 3000)
      } else {
        setScanResult({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' })
        setTimeout(() => setScanResult(null), 3000)
      }
    }
  }

  return (
    <div className="advanced-ocr-scanner">
      <div className="ocr-header">
        <i className="fas fa-eye"></i>
        <h4>AI-Powered Expiry Date Scanner</h4>
        <button className="ocr-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Camera OCR */}
      {!cameraActive && !capturedImage ? (
        <div className="ocr-options">
          <button onClick={startCamera} className="btn-start-camera-ocr">
            <i className="fas fa-camera"></i> Scan with Camera
          </button>
          <div className="ocr-divider">or</div>
          <label className="btn-upload">
            <i className="fas fa-upload"></i> Upload Photo
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      ) : cameraActive && !capturedImage ? (
        <div className="camera-ocr-container">
          <video ref={videoRef} className="camera-preview-ocr" autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="ocr-overlay">
            <div className="ocr-instruction">
              <i className="fas fa-calendar-alt"></i>
              <span>Position expiry date clearly in frame</span>
            </div>
          </div>
          <div className="ocr-actions">
            <button onClick={handleCaptureAndScan} className="btn-capture" disabled={scanning}>
              {scanning ? (
                <><i className="fas fa-spinner fa-pulse"></i> Processing...</>
              ) : (
                <><i className="fas fa-camera"></i> Capture & Read</>
              )}
            </button>
            <button onClick={stopCamera} className="btn-cancel-camera">
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      ) : capturedImage && (
        <div className="ocr-preview">
          <div className="preview-image">
            <img src={capturedImage} alt="Captured" />
            {scanning && (
              <div className="processing-overlay">
                <div className="processing-spinner"></div>
                <div className="processing-text">{ocrProgress.message}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${ocrProgress.progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="preview-actions">
            <button onClick={() => {
              setCapturedImage(null)
              setScanResult(null)
              if (cameraActive) startCamera()
            }} className="btn-retry">
              <i className="fas fa-redo"></i> Take Another
            </button>
            <button onClick={stopCamera} className="btn-done">
              <i className="fas fa-check"></i> Done
            </button>
          </div>
        </div>
      )}

      <div className="ocr-divider">or enter manually</div>

      {/* Manual Entry */}
      <form onSubmit={handleManualSubmit} className="ocr-form">
        <input
          type="text"
          placeholder="YYYY-MM-DD (e.g., 2025-12-31)"
          value={manualExpiry}
          onChange={(e) => setManualExpiry(e.target.value)}
          className="ocr-input"
        />
        <button type="submit" className="btn-manual">
          <i className="fas fa-pen"></i> Confirm Date
        </button>
      </form>
      
      <div className="ocr-feature">
        <i className="fas fa-magic"></i>
        <span>AI-powered OCR reads expiry dates from any packaging - even handwritten dates!</span>
      </div>
      
      {scanResult && (
        <div className={`ocr-success ${scanResult.success ? '' : 'error'}`}>
          <i className={`fas ${scanResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {scanResult.success ? (
            <div>
              <strong>Expiry Date: {scanResult.expiryDate}</strong>
              <div className="expiry-details">
                <span className={`days-badge ${scanResult.status?.severity}`}>
                  {scanResult.daysLeft > 0 ? `${scanResult.daysLeft} days remaining` : 'EXPIRED'}
                </span>
                <span className="status-text" style={{ color: scanResult.status?.color }}>
                  {scanResult.status?.text}
                </span>
              </div>
              {scanResult.rawText && (
                <div className="raw-text">
                  <small>Detected text: "{scanResult.rawText.slice(0, 100)}"</small>
                </div>
              )}
            </div>
          ) : (
            <div>
              <strong>Detection Failed</strong>
              <p>{scanResult.error}</p>
              {scanResult.rawText && (
                <div className="raw-text">
                  <small>Raw text: "{scanResult.rawText.slice(0, 100)}"</small>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedOCRScanner