// src/components/AdvancedOCRScanner.jsx
import { useState, useRef, useEffect } from 'react'
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

  // 1. කැමරාව ආරම්භ කිරීම
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      streamRef.current = stream;
      setCameraActive(true);
      setCapturedImage(null);
      setScanResult(null);
      setDetectedText('');
    } catch (err) {
      console.error('Camera access error:', err);
      alert('කැමරාව ක්‍රියාත්මක කිරීමට නොහැකි විය. කරුණාකර Permission පරීක්ෂා කරන්න.');
    }
  }

  // 2. වැදගත්ම කොටස: Stream එක Video tag එකට සම්බන්ධ කිරීම (White screen fix)
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(e => console.error("Video play error:", e));
      };
    }
  }, [cameraActive]);

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
      setOcrProgress('Loading Tesseract.js...')
      const TesseractModule = await import('tesseract.js')
      const Tesseract = TesseractModule.default
      
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
          status = 'Expired'; statusColor = '#ef4444'
        } else if (daysLeft <= 7) {
          status = 'Expiring Soon'; statusColor = '#f59e0b'
        } else {
          status = 'Healthy'; statusColor = '#22c55e'
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
      } else {
        setScanResult({ 
          success: false, 
          error: 'No valid expiry date found. Try better lighting.',
          detectedText: extractedText.slice(0, 300)
        })
      }
    } catch (error) {
      console.error('OCR Error:', error)
      setScanResult({ success: false, error: 'Failed to process image.' })
    } finally {
      setScanning(false)
      setOcrProgress('')
    }
  }

  const handleCaptureAndScan = () => {
    const imageData = captureImage()
    if (imageData) processImage(imageData)
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
      onScan({ type: 'ocr', value: manualExpiry })
      setScanResult({ success: true, expiryDate: manualExpiry })
      setManualExpiry('')
    }
  }

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="advanced-ocr-scanner">
      <div className="ocr-header">
        <i className="fas fa-eye"></i>
        <h4>AI Expiry Scanner</h4>
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
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      ) : cameraActive && !capturedImage ? (
        <div className="camera-ocr-container">
          <video ref={videoRef} className="camera-preview-ocr" autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="ocr-overlay">
            <div className="ocr-instruction">
              <span>Position date clearly and tap Capture</span>
            </div>
          </div>
          <div className="ocr-actions">
            <button onClick={handleCaptureAndScan} className="btn-capture" disabled={scanning}>
              {scanning ? <><i className="fas fa-spinner fa-pulse"></i> {ocrProgress || 'Reading...'}</> : "Capture & Read"}
            </button>
            <button onClick={stopCamera} className="btn-cancel-camera">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="ocr-preview">
          <img src={capturedImage} alt="Captured" />
          {scanning && <div className="processing-overlay"><p>{ocrProgress}</p></div>}
          <div className="preview-actions">
            <button onClick={() => {setCapturedImage(null); startCamera();}} className="btn-retry">Retry</button>
            <button onClick={stopCamera} className="btn-done">Done</button>
          </div>
        </div>
      )}

      {scanResult && (
        <div className={`ocr-success ${scanResult.success ? 'success' : 'error'}`}>
          <p>{scanResult.success ? `Detected: ${scanResult.expiryDate}` : scanResult.error}</p>
        </div>
      )}
    </div>
  )
}

export default AdvancedOCRScanner