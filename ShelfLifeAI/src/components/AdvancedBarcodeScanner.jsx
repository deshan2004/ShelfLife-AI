// src/components/AdvancedBarcodeScanner.jsx
import { useState, useRef, useEffect } from 'react'
import './AdvancedBarcodeScanner.css'

function AdvancedBarcodeScanner({ onScan, onClose }) {
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [availableCameras, setAvailableCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const animationRef = useRef(null)

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setAvailableCameras(videoDevices)
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId)
        }
      } catch (error) {
        console.error('Error getting cameras:', error)
      }
    }
    getCameras()
  }, [])

  // Barcode detection
  const detectBarcode = async () => {
    if (!videoRef.current || !cameraActive) return
    
    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93']
        })
        
        const barcodes = await barcodeDetector.detect(videoRef.current)
        
        if (barcodes.length > 0) {
          const barcodeValue = barcodes[0].rawValue
          setScanResult({ success: true, value: barcodeValue })
          
          onScan({ 
            type: 'barcode', 
            value: barcodeValue,
            productInfo: { name: `Product ${barcodeValue.slice(-4)}`, brand: 'Scanned Item' }
          })
          
          stopCamera()
          setTimeout(() => setScanResult(null), 3000)
        }
      }
    } catch (error) {
      console.error('Barcode detection error:', error)
    }
    
    animationRef.current = requestAnimationFrame(detectBarcode)
  }

  const startCamera = async () => {
    setCameraError(null)
    setScanning(true)
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera')
      }
      
      const constraints = {
        video: { facingMode: 'environment' }
      }
      
      console.log('Requesting camera...')
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Camera obtained:', stream.getVideoTracks())
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded, playing...')
          videoRef.current.play()
          setCameraActive(true)
          setScanning(false)
          animationRef.current = requestAnimationFrame(detectBarcode)
        }
        
        videoRef.current.onerror = (err) => {
          console.error('Video error:', err)
          setCameraError('Video playback error')
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      let errorMessage = 'Could not access camera. '
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Please allow camera access in your browser.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.'
      } else {
        errorMessage += err.message
      }
      setCameraError(errorMessage)
      setScanning(false)
    }
  }

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setCameraActive(false)
    setScanning(false)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualBarcode) {
      onScan({ 
        type: 'barcode', 
        value: manualBarcode,
        productInfo: { name: `Product ${manualBarcode.slice(-4)}`, brand: 'Manual Entry' }
      })
      setScanResult({ success: true, value: manualBarcode })
      setManualBarcode('')
      setTimeout(() => setScanResult(null), 3000)
    }
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    }
  }, [])

  return (
    <div className="advanced-barcode-scanner">
      <div className="scanner-header">
        <i className="fas fa-qrcode"></i>
        <h4>Barcode Scanner</h4>
        <button className="scanner-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {availableCameras.length > 1 && !cameraActive && (
        <div className="camera-selector">
          <label>Select Camera:</label>
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="camera-select"
          >
            {availableCameras.map((camera, index) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                Camera {index + 1}: {camera.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {!cameraActive ? (
        <button onClick={startCamera} className="btn-start-camera" disabled={scanning}>
          {scanning ? (
            <><i className="fas fa-spinner fa-pulse"></i> Initializing Camera...</>
          ) : (
            <><i className="fas fa-video"></i> Start Camera Scanner</>
          )}
        </button>
      ) : (
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
            </div>
            <div className="scan-instruction">
              <i className="fas fa-qrcode"></i>
              <span>Position barcode in frame</span>
            </div>
          </div>
          <button onClick={stopCamera} className="btn-stop-camera">
            <i className="fas fa-stop"></i> Stop Camera
          </button>
        </div>
      )}

      {cameraError && (
        <div className="camera-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{cameraError}</span>
        </div>
      )}

      <div className="scanner-divider">or</div>

      <form onSubmit={handleManualSubmit} className="scanner-form">
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
      </form>
      
      <div className="scanner-note">
        <i className="fas fa-info-circle"></i>
        <span>Auto-detects EAN-13, UPC-A, Code 128, QR codes.</span>
      </div>
      
      {scanResult && scanResult.success && (
        <div className="scan-success success">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>✓ Barcode Detected!</strong>
            <p>Value: {scanResult.value}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedBarcodeScanner