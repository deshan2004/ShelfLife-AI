import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import FeatureCard from './components/FeatureCard'
import DashboardTable from './components/DashboardTable'
import EdgeSection from './components/EdgeSection'
import ROICard from './components/ROICard'
import Footer from './components/Footer'
import BarcodeScanner from './components/BarcodeScanner'
import OCRScanner from './components/OCRScanner'
import LoginModal from './components/LoginModal'
import UserMenu from './components/UserMenu'
import { initialInventory } from './data/inventoryData'
import './App.css'

function App() {
  const [inventory, setInventory] = useState(initialInventory)
  const [toastMsg, setToastMsg] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanType, setScanType] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(null)

  // Check for saved user session
  useEffect(() => {
    const savedUser = localStorage.getItem('shelflife_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // Listen for toast events from modal
  useEffect(() => {
    const handleToast = (event) => {
      setToastMsg(event.detail)
      setTimeout(() => setToastMsg(null), 3000)
    }
    window.addEventListener('showToast', handleToast)
    return () => window.removeEventListener('showToast', handleToast)
  }, [])

  const handleFlashSale = (productId) => {
    const product = inventory.find(p => p.id === productId)
    if (product) {
      setToastMsg(`✅ Flash sale triggered for ${product.name}! Suggested discount applied.`)
      setTimeout(() => setToastMsg(null), 3000)
      setInventory(prev => prev.map(item => 
        item.id === productId ? { ...item, suggestion: "🔥 FLASH SALE ACTIVE - 30% OFF" } : item
      ))
    }
  }

  const handleScan = (scanData) => {
    if (scanData.type === 'barcode') {
      setToastMsg(`📦 Barcode scanned: ${scanData.value} - Looking up product...`)
    } else if (scanData.type === 'ocr') {
      setToastMsg(`📅 Expiry date detected: ${scanData.value} - Updating inventory...`)
    }
    setTimeout(() => setToastMsg(null), 3000)
    setShowScanner(false)
    setScanType(null)
  }

  const handleCloseScanner = () => {
    setShowScanner(false)
    setScanType(null)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('shelflife_user', JSON.stringify(userData))
    setShowLogin(false)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('shelflife_user')
    setToastMsg('👋 You have been signed out')
    setTimeout(() => setToastMsg(null), 3000)
  }

  const features = [
    { icon: "fa-barcode", title: "Batch & Supplier Tracking", desc: "Manage multiple batches, track supplier returns automatically." },
    { icon: "fa-bolt", title: "Smart Flash Sale Triggers", desc: "Auto-suggest BOGO or % discount for items expiring within 72h." },
    { icon: "fa-exclamation-triangle", title: "Low Stock Alerts", desc: "Real-time inventory monitoring prevents out-of-stock scenarios." },
    { icon: "fa-cloud-upload-alt", title: "Cloud Sync", desc: "Access shop data anywhere, offline-first PWA syncs when back online." }
  ]

  return (
    <>
      <Navbar 
        onScanClick={() => setShowScanner(!showScanner)} 
        onLoginClick={() => setShowLogin(true)}
        user={user}
      />
      
      {/* Render UserMenu separately if user is logged in */}
      {user && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 201 }}>
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
      )}
      
      <Hero />
      
      <main className="container">
        {/* Welcome Banner for Logged-in Users */}
        {user && (
          <div className="welcome-banner">
            <i className="fas fa-hand-wave"></i>
            <div>
              <strong>Welcome back, {user.name}!</strong>
              <p>Your inventory is being monitored. {inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length} items need attention.</p>
            </div>
          </div>
        )}

        {/* Scanner Section */}
        {showScanner && !scanType && (
          <div className="scanner-section">
            <div className="scanner-tabs">
              <button 
                className="scanner-tab"
                onClick={() => setScanType('barcode')}
              >
                <i className="fas fa-barcode"></i> Barcode Scanner
              </button>
              <button 
                className="scanner-tab"
                onClick={() => setScanType('ocr')}
              >
                <i className="fas fa-eye"></i> OCR Scanner
              </button>
              <button 
                className="scanner-close"
                onClick={handleCloseScanner}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="scanner-prompt">
              <p>Choose a scan method to add products to inventory</p>
              <div className="scanner-options">
                <button onClick={() => setScanType('barcode')} className="btn-option">
                  <i className="fas fa-barcode"></i> Barcode Scanner
                </button>
                <button onClick={() => setScanType('ocr')} className="btn-option">
                  <i className="fas fa-eye"></i> OCR Expiry Reader
                </button>
              </div>
            </div>
          </div>
        )}
        
        {scanType === 'barcode' && (
          <div className="scanner-section">
            <BarcodeScanner onScan={handleScan} onClose={handleCloseScanner} />
          </div>
        )}
        
        {scanType === 'ocr' && (
          <div className="scanner-section">
            <OCRScanner onScan={handleScan} onClose={handleCloseScanner} />
          </div>
        )}

        {/* Core Features Section */}
        <section className="features-section">
          <h2 className="section-title">Core Retail Features</h2>
          <div className="card-grid">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>

        {/* Live Dashboard */}
        <DashboardTable inventory={inventory} onFlashSale={handleFlashSale} />
        
        {toastMsg && (
          <div className="toast-notification">
            {toastMsg}
          </div>
        )}

        {/* Our Edge Section */}
        <EdgeSection />

        {/* Business Impact & ROI */}
        <ROICard monthlySavings={5200} />

        {/* Tech & Vision */}
        <div className="vision-section">
          <p className="vision-quote">
            "ShelfLife AI transforms a chaotic storeroom into a data-driven, waste-free business."
          </p>
          <div className="tech-stack">
            <i className="fas fa-check-circle"></i> OCR-based expiry detection<br />
            <i className="fas fa-check-circle"></i> Barcode & QR support<br />
            <i className="fas fa-check-circle"></i> Offline-first PWA<br />
            <i className="fas fa-check-circle"></i> AI-driven actionable insights<br /> 
          </div>
        </div>
      </main>

      <Footer />

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
        onLogin={handleLogin}
      />
    </>
  )
}

export default App