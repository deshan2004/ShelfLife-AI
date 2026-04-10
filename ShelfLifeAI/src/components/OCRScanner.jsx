import { useState } from 'react'
import './OCRScanner.css'

function OCRScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [manualExpiry, setManualExpiry] = useState('')
  const [scanResult, setScanResult] = useState(null)

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualExpiry) {
      onScan({ type: 'ocr', value: manualExpiry })
      setScanResult({ success: true, value: manualExpiry })
      setManualExpiry('')
      setTimeout(() => setScanResult(null), 3000)
    }
  }

  const simulateOCR = () => {
    setScanning(true)
    setTimeout(() => {
      const demoDate = new Date()
      demoDate.setDate(demoDate.getDate() + 14)
      const expiryStr = demoDate.toISOString().split('T')[0]
      onScan({ type: 'ocr', value: expiryStr })
      setScanResult({ success: true, value: expiryStr })
      setScanning(false)
      setTimeout(() => setScanResult(null), 3000)
    }, 1500)
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
      
      <div className="ocr-demo">
        <button 
          onClick={simulateOCR} 
          className="btn-ocr"
          disabled={scanning}
        >
          {scanning ? (
            <>
              <i className="fas fa-spinner fa-pulse"></i> Scanning...
            </>
          ) : (
            <>
              <i className="fas fa-camera"></i> Scan Expiry Date
            </>
          )}
        </button>
        <span className="ocr-hint">Click to simulate OCR scan (demo)</span>
      </div>
      
      <div className="ocr-divider">or</div>
      
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
        <i className="fas fa-check-circle"></i>
        <span>Reads expiry from any packaging — no barcode needed!</span>
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