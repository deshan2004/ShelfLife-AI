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
import Analytics from './components/Analytics'
import BatchSupplierTracker from './components/BatchSupplierTracker'
import { initialInventory } from './data/inventoryData'
import './App.css'

function App() {
  const [inventory, setInventory] = useState(initialInventory)
  const [toastMsg, setToastMsg] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanType, setScanType] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [lowStockAlerts, setLowStockAlerts] = useState([])

  // Check for saved user session
  useEffect(() => {
    const savedUser = localStorage.getItem('shelflife_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // Monitor low stock items
  useEffect(() => {
    const lowStock = inventory.filter(item => item.stock <= item.lowStockThreshold && item.stock > 0)
    setLowStockAlerts(lowStock)
  }, [inventory])

  // Auto flash sale suggestions for items expiring within 72 hours
  useEffect(() => {
    const urgentItems = inventory.filter(item => item.daysLeft <= 3 && item.daysLeft > 0)
    urgentItems.forEach(item => {
      if (!item.suggestion.includes('FLASH SALE') && !item.suggestion.includes('BOGO')) {
        let discount = ''
        let saleType = ''
        if (item.daysLeft <= 1) {
          discount = '50% OFF'
          saleType = 'BOGO'
        } else if (item.daysLeft <= 2) {
          discount = '40% OFF'
          saleType = 'Flash Sale'
        } else {
          discount = '30% OFF'
          saleType = 'Flash Sale'
        }
        setInventory(prev => prev.map(i => 
          i.id === item.id ? { ...i, suggestion: `🔥 ${saleType} - ${discount}` } : i
        ))
      }
    })
  }, [inventory])

  // Cloud sync - save to localStorage
  useEffect(() => {
    localStorage.setItem('shelflife_inventory', JSON.stringify(inventory))
  }, [inventory])

  // Load from cloud on startup
  useEffect(() => {
    const savedInventory = localStorage.getItem('shelflife_inventory')
    if (savedInventory) {
      try {
        const parsed = JSON.parse(savedInventory)
        if (parsed && parsed.length > 0) {
          setInventory(parsed)
        }
      } catch (e) {
        console.error('Failed to load saved inventory', e)
      }
    }
  }, [])

  const showToast = (message) => {
    setToastMsg(message)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleFlashSale = (productId) => {
    const product = inventory.find(p => p.id === productId)
    if (product) {
      let discount = '30% OFF'
      let saleType = 'Flash Sale'
      
      if (product.daysLeft <= 1) {
        discount = '50% OFF'
        saleType = 'Buy 1 Get 1 Free'
      } else if (product.daysLeft <= 2) {
        discount = '40% OFF'
        saleType = 'Flash Sale'
      } else if (product.daysLeft <= 7) {
        discount = '30% OFF'
        saleType = 'Flash Sale'
      }
      
      showToast(`🔥 ${saleType} triggered for ${product.name}! ${discount} applied.`)
      setInventory(prev => prev.map(item => 
        item.id === productId ? { 
          ...item, 
          suggestion: `🔥 ${saleType} ACTIVE - ${discount}`,
          sellingPrice: Math.round(item.sellingPrice * (product.daysLeft <= 1 ? 0.5 : product.daysLeft <= 2 ? 0.6 : 0.7))
        } : item
      ))
    }
  }

  const handleDeleteItem = (productId) => {
    const product = inventory.find(p => p.id === productId)
    if (product && window.confirm(`Delete ${product.name} from inventory?`)) {
      setInventory(prev => prev.filter(item => item.id !== productId))
      showToast(`🗑️ ${product.name} removed from inventory`)
    }
  }

  const handleUpdateItem = (productId, newName) => {
    setInventory(prev => prev.map(item => 
      item.id === productId ? { ...item, name: newName } : item
    ))
    showToast(`✏️ Product name updated to "${newName}"`)
  }

  const handleReturnToSupplier = (productId) => {
    const product = inventory.find(p => p.id === productId)
    if (product) {
      setInventory(prev => prev.filter(item => item.id !== productId))
      showToast(`📦 Return request sent to ${product.supplier} for ${product.name}`)
    }
  }

  const handleAddProduct = (product) => {
    const newId = Math.max(...inventory.map(i => i.id), 0) + 1
    const daysLeft = Math.ceil((new Date(product.expiryDate || new Date(Date.now() + 30 * 86400000)) - new Date()) / (1000 * 60 * 60 * 24))
    
    const newProduct = {
      id: newId,
      name: product.name || 'New Product',
      batch: product.batch || `B${String(newId).padStart(3, '0')}`,
      batchDate: new Date().toISOString().split('T')[0],
      supplier: product.supplier || 'Manual Entry',
      supplierContact: product.supplierContact || 'N/A',
      supplierEmail: product.supplierEmail || 'N/A',
      expiryDate: product.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      daysLeft: daysLeft,
      status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good',
      suggestion: daysLeft <= 7 ? 'Monitor closely' : 'Normal Stock',
      stock: product.stock || 1,
      lowStockThreshold: 10,
      costPrice: product.costPrice || 100,
      sellingPrice: product.sellingPrice || 150
    }
    setInventory(prev => [...prev, newProduct])
    showToast(`✅ ${newProduct.name} added to inventory!`)
  }

  const handleScan = (scanData) => {
    if (scanData.type === 'barcode') {
      const existingProduct = inventory.find(p => p.batch === scanData.value)
      if (existingProduct) {
        showToast(`📦 Product found: ${existingProduct.name} - Stock: ${existingProduct.stock}`)
      } else {
        const productName = window.prompt('Enter product name:', 'New Product')
        if (productName) {
          handleAddProduct({
            name: productName,
            batch: scanData.value,
            supplier: 'Scanned Item'
          })
        } else {
          showToast('Product addition cancelled')
        }
      }
    } else if (scanData.type === 'ocr') {
      showToast(`📅 Expiry date detected: ${scanData.value}`)
      // Find expiring products to update
      const expiringProducts = inventory.filter(p => p.daysLeft <= 14 && p.daysLeft > 0)
      if (expiringProducts.length > 0) {
        const productToUpdate = expiringProducts[0]
        if (window.confirm(`Update expiry for ${productToUpdate.name} to ${scanData.value}?`)) {
          const daysLeft = Math.ceil((new Date(scanData.value) - new Date()) / (1000 * 60 * 60 * 24))
          setInventory(prev => prev.map(item => 
            item.id === productToUpdate.id ? { 
              ...item, 
              expiryDate: scanData.value,
              daysLeft: daysLeft,
              status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good'
            } : item
          ))
          showToast(`✅ Expiry updated for ${productToUpdate.name}`)
        }
      } else {
        showToast(`No products to update. Use "Add Product" to create a new item.`)
      }
    }
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
    showToast(`👋 Welcome, ${userData.name}!`)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('shelflife_user')
    showToast('👋 You have been signed out')
  }

  const features = [
    { icon: "fa-barcode", title: "Batch & Supplier Tracking", desc: "Manage multiple batches, track supplier returns automatically." },
    { icon: "fa-bolt", title: "Smart Flash Sale Triggers", desc: "Auto-suggest BOGO or % discount for items expiring within 72h." },
    { icon: "fa-exclamation-triangle", title: "Low Stock Alerts", desc: "Real-time inventory monitoring prevents out-of-stock scenarios." },
    { icon: "fa-cloud-upload-alt", title: "Cloud Sync", desc: "Access shop data anywhere, offline-first PWA syncs when back online." }
  ]

  const expiringCount = inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length
  const criticalCount = inventory.filter(i => i.daysLeft <= 3 && i.daysLeft > 0).length
  const expiredCount = inventory.filter(i => i.daysLeft <= 0).length

  return (
    <>
      <Navbar 
        onScanClick={() => setShowScanner(!showScanner)} 
        onLoginClick={() => setShowLogin(true)}
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <Hero />
      
      <main className="container">
        {/* Welcome Banner for Logged-in Users */}
        {user && (
          <div className="welcome-banner">
            <i className="fas fa-hand-wave"></i>
            <div>
              <strong>Welcome back, {user.name}!</strong>
              <p>
                {lowStockAlerts.length > 0 && `⚠️ ${lowStockAlerts.length} item(s) need restocking. `}
                {expiringCount > 0 && `${expiringCount} item(s) near expiry (${criticalCount} critical). `}
                {expiredCount > 0 && `${expiredCount} item(s) expired. `}
                {expiringCount === 0 && lowStockAlerts.length === 0 && expiredCount === 0 && 'Your inventory is healthy!'}
              </p>
            </div>
          </div>
        )}

        {/* Low Stock Alert Bar */}
        {lowStockAlerts.length > 0 && (
          <div className="low-stock-alert">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <strong>Low Stock Alert!</strong>
              <p>{lowStockAlerts.map(item => `${item.name} (${item.stock} left)`).join(', ')}</p>
            </div>
            <button className="btn-order" onClick={() => showToast("📦 Order placed with suppliers! Stock will arrive in 2-3 days.")}>
              Order Now
            </button>
          </div>
        )}

        {/* Scanner Section */}
        {showScanner && !scanType && (
          <div className="scanner-section">
            <div className="scanner-tabs">
              <button className="scanner-tab" onClick={() => setScanType('barcode')}>
                <i className="fas fa-barcode"></i> Barcode Scanner
              </button>
              <button className="scanner-tab" onClick={() => setScanType('ocr')}>
                <i className="fas fa-eye"></i> OCR Scanner
              </button>
              <button className="scanner-close" onClick={handleCloseScanner}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="scanner-prompt">
              <p>One-touch scanning - Position barcode or expiry date in frame</p>
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

        {/* Tab Navigation */}
        <div className="app-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            <i className="fas fa-boxes"></i> Batches & Suppliers
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fas fa-chart-line"></i> Analytics
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <section className="features-section">
              <h2 className="section-title">Core Retail Features</h2>
              <div className="card-grid">
                {features.map((feature, index) => (
                  <FeatureCard key={index} {...feature} />
                ))}
              </div>
            </section>

            <DashboardTable 
              inventory={inventory} 
              onFlashSale={handleFlashSale}
              onDeleteItem={handleDeleteItem}
              onUpdateItem={handleUpdateItem}
            />
          </>
        )}

        {/* Batches & Suppliers Tab */}
        {activeTab === 'batches' && (
          <BatchSupplierTracker 
            inventory={inventory} 
            onReturnToSupplier={handleReturnToSupplier}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Analytics inventory={inventory} />
        )}
        
        {toastMsg && (
          <div className="toast-notification">
            {toastMsg}
          </div>
        )}

        {/* Our Edge Section */}
        <EdgeSection />

        {/* Business Impact & ROI */}
        <ROICard monthlySavings={5200} />

        {/* Cloud Sync Status */}
        <div className="cloud-sync-status">
          <i className="fas fa-cloud-upload-alt"></i>
          <span>Cloud Sync Active</span>
          <span className="sync-time">Last synced: {new Date().toLocaleTimeString()}</span>
          <i className="fas fa-check-circle sync-success"></i>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => setShowScanner(true)} title="Quick Scan">
            <i className="fas fa-camera"></i>
          </button>
          <button className="quick-action-btn" onClick={() => setActiveTab('analytics')} title="View Analytics">
            <i className="fas fa-chart-line"></i>
          </button>
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