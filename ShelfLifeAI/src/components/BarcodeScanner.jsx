import { useState } from 'react'
import './BarcodeScanner.css'

function BarcodeScanner({ onScan, onClose }) {
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanResult, setScanResult] = useState(null)

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualBarcode) {
      onScan({ type: 'barcode', value: manualBarcode })
      setScanResult({ success: true, value: manualBarcode })
      setManualBarcode('')
      setTimeout(() => setScanResult(null), 3000)
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
      
      <form onSubmit={handleManualSubmit} className="scanner-form">
        <input
          type="text"
          placeholder="Enter barcode number"
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
        <span>Enter product barcode to add to inventory</span>
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