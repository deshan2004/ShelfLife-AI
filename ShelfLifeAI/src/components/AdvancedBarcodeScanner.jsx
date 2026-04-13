import { useState, useRef, useEffect } from 'react'
import { startBarcodeScanner, isValidBarcode, formatBarcode, lookupProductByBarcode } from '../utils/advancedBarcodeHelper'
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
  const stopScanningRef = useRef(null)

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

  const startCamera = async () => {
    setCameraError(null)
    setScanning(true)
    
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      const constraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : { facingMode: 'environment' }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          
          // Start barcode detection
          stopScanningRef.current = startBarcodeScanner(videoRef.current, async (barcode) => {
            if (isValidBarcode(barcode)) {
              setScanning(false)
              const productInfo = await lookupProductByBarcode(barcode)
              onScan({ 
                type: 'barcode', 
                value: barcode,
                productInfo: productInfo
              })
              setScanResult({ success: true, value: formatBarcode(barcode), productInfo })
              stopCamera()
              setTimeout(() => setScanResult(null), 3000)
            }
          })
        }
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setCameraError('Could not access camera. Please check permissions and try again.')
      setScanning(false)
    }
  }

  const stopCamera = () => {
    if (stopScanningRef.current) {
      stopScanningRef.current()
      stopScanningRef.current = null
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

  const handleBarcodeDetected = async (barcode) => {
    const productInfo = await lookupProductByBarcode(barcode)
    onScan({ type: 'barcode', value: barcode, productInfo })
    setScanResult({ success: true, value: formatBarcode(barcode), productInfo })
    setTimeout(() => setScanResult(null), 3000)
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (manualBarcode && isValidBarcode(manualBarcode)) {
      await handleBarcodeDetected(manualBarcode)
      setManualBarcode('')
    } else if (manualBarcode) {
      setScanResult({ success: false, value: 'Invalid barcode format' })
      setTimeout(() => setScanResult(null), 3000)
    }
  }

  return (
    <div className="advanced-barcode-scanner">
      <div className="scanner-header">
        <i className="fas fa-qrcode"></i>
        <h4>Barcode Scanner</h4>
        <button className="scanner-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Camera Selector */}
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

      {/* Camera View */}
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
          <video ref={videoRef} className="camera-preview" autoPlay playsInline muted />
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

      {/* Manual Entry */}
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
        <span>Supports EAN-13, UPC-A, Code 128, and more. Position barcode clearly in frame.</span>
      </div>
      
      {scanResult && (
        <div className={`scan-success ${scanResult.success ? '' : 'error'}`}>
          <i className={`fas ${scanResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {scanResult.success ? (
            <div>
              <strong>Scanned: {scanResult.value}</strong>
              {scanResult.productInfo && (
                <div className="product-preview">
                  <p>{scanResult.productInfo.name}</p>
                  <small>by {scanResult.productInfo.brand}</small>
                </div>
              )}
            </div>
          ) : (
            <span>{scanResult.value}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedBarcodeScanner