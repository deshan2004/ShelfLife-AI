// src/components/AdvancedOCRScanner.jsx
import { useState, useRef } from 'react'
import './AdvancedOCRScanner.css'

function AdvancedOCRScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [manualExpiry, setManualExpiry] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [ocrProgress, setOcrProgress] = useState('')
  const [capturedImage, setCapturedImage] = useState(null)
  const [detectedText, setDetectedText] = useState('')
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        setCapturedImage(null)
        setScanResult(null)
        setDetectedText('')
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
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)
      
      return imageData
    }
    return null
  }

  const parseExpiryDate = (text) => {
    const patterns = [
      /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
      /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
      /(?:exp|expiry|expiration|best before|use by)[:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
      /(?:exp|expiry|expiration|best before|use by)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i,
      /(?:exp|expiry)[:\s]*(\d{2})[-/](\d{2})[-/](\d{4})/i,
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        let year, month, day
        
        if (match[1] && match[1].length === 4) {
          year = parseInt(match[1])
          month = parseInt(match[2])
          day = parseInt(match[3])
        } else if (match[3] && match[3].length === 4) {
          day = parseInt(match[1])
          month = parseInt(match[2])
          year = parseInt(match[3])
        } else if (match[1] && match[2] && match[3]) {
          // Try to determine format
          if (parseInt(match[1]) > 31 && parseInt(match[1]) < 2100) {
            year = parseInt(match[1])
            month = parseInt(match[2])
            day = parseInt(match[3])
          } else if (parseInt(match[3]) > 31 && parseInt(match[3]) < 2100) {
            day = parseInt(match[1])
            month = parseInt(match[2])
            year = parseInt(match[3])
          } else {
            continue
          }
        } else {
          continue
        }
        
        if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day)
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
          }
        }
      }
    }
    return null
  }

  const processImage = async (imageData) => {
    setScanning(true)
    setOcrProgress('Initializing OCR...')
    
    try {
      setOcrProgress('Loading OCR engine...')
      const TesseractModule = await import('tesseract.js')
      const Tesseract = TesseractModule.default
      
      setOcrProgress('Reading text from image...')
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(`Reading: ${Math.round(m.progress * 100)}%`)
            }
          }
        }
      )
      
      const extractedText = result.data.text
      setDetectedText(extractedText)
      setOcrProgress('Parsing expiry date...')
      
      const expiryDate = parseExpiryDate(extractedText)
      
      if (expiryDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const expiry = new Date(expiryDate)
        expiry.setHours(0, 0, 0, 0)
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
        
        let status = ''
        let statusColor = ''
        if (daysLeft <= 0) {
          status = 'Expired'
          statusColor = '#ef4444'
        } else if (daysLeft <= 3) {
          status = 'Critical'
          statusColor = '#ef4444'
        } else if (daysLeft <= 7) {
          status = 'Near Expiry'
          statusColor = '#f59e0b'
        } else if (daysLeft <= 30) {
          status = 'Expiring Soon'
          statusColor = '#eab308'
        } else {
          status = 'Healthy'
          statusColor = '#22c55e'
        }
        
        onScan({ 
          type: 'ocr', 
          value: expiryDate,
          daysLeft: daysLeft,
          status: { text: status, color: statusColor }
        })
        
        setScanResult({ 
          success: true, 
          expiryDate: expiryDate,
          daysLeft: daysLeft,
          status: { text: status, color: statusColor },
          detectedText: extractedText.slice(0, 300)
        })
        
        setTimeout(() => {
          stopCamera()
          onClose()
        }, 3000)
      } else {
        setScanResult({ 
          success: false, 
          error: 'No valid expiry date found in image',
          detectedText: extractedText.slice(0, 300)
        })
      }
    } catch (error) {
      console.error('OCR processing error:', error)
      setScanResult({ 
        success: false, 
        error: 'Failed to process image. Please try again with better lighting.'
      })
    } finally {
      setScanning(false)
      setOcrProgress('')
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
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(manualExpiry)) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const expiry = new Date(manualExpiry)
        expiry.setHours(0, 0, 0, 0)
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
        
        let status = ''
        let statusColor = ''
        if (daysLeft <= 0) {
          status = 'Expired'
          statusColor = '#ef4444'
        } else if (daysLeft <= 3) {
          status = 'Critical'
          statusColor = '#ef4444'
        } else if (daysLeft <= 7) {
          status = 'Near Expiry'
          statusColor = '#f59e0b'
        } else {
          status = 'Healthy'
          statusColor = '#22c55e'
        }
        
        onScan({ 
          type: 'ocr', 
          value: manualExpiry,
          daysLeft: daysLeft,
          status: { text: status, color: statusColor }
        })
        setScanResult({ 
          success: true, 
          expiryDate: manualExpiry,
          daysLeft: daysLeft,
          status: { text: status, color: statusColor }
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
          <video 
            ref={videoRef} 
            className="camera-preview-ocr" 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: 'auto', minHeight: '300px', background: '#000' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="ocr-overlay">
            <div className="ocr-instruction">
              <i className="fas fa-calendar-alt"></i>
              <span>Position expiry date clearly, then tap Capture</span>
            </div>
          </div>
          <div className="ocr-actions">
            <button onClick={handleCaptureAndScan} className="btn-capture" disabled={scanning}>
              {scanning ? (
                <><i className="fas fa-spinner fa-pulse"></i> {ocrProgress || 'Processing...'}</>
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
                <div className="processing-text">{ocrProgress}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: ocrProgress.includes('%') ? (ocrProgress.match(/\d+/)?.[0] || '50') + '%' : '50%' }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="preview-actions">
            <button onClick={() => {
              setCapturedImage(null)
              setScanResult(null)
              setDetectedText('')
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
        <span>AI-powered OCR reads expiry dates from any packaging! Upload a photo of a product label.</span>
      </div>
      
      {scanResult && (
        <div className={`ocr-success ${scanResult.success ? 'success' : 'error'}`}>
          <i className={`fas ${scanResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {scanResult.success ? (
            <div>
              <strong>✓ Expiry Date Detected!</strong>
              <p>Date: {scanResult.expiryDate}</p>
              <p>Status: <span style={{ color: scanResult.status?.color }}>{scanResult.status?.text}</span></p>
              {scanResult.daysLeft > 0 ? (
                <p>{scanResult.daysLeft} days remaining</p>
              ) : (
                <p>Product has expired!</p>
              )}
              {scanResult.detectedText && (
                <details>
                  <summary>Detected Text</summary>
                  <small>{scanResult.detectedText}</small>
                </details>
              )}
            </div>
          ) : (
            <div>
              <strong>Detection Failed</strong>
              <p>{scanResult.error}</p>
              {scanResult.detectedText && (
                <details>
                  <summary>Raw Text</summary>
                  <small>{scanResult.detectedText}</small>
                </details>
              )}
              <p style={{ marginTop: '8px' }}>💡 Tip: Make sure the expiry date is clearly visible in good lighting.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedOCRScanner