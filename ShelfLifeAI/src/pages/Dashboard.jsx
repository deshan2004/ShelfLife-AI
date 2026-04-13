import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import FeatureCard from '../components/FeatureCard'
import DashboardTable from '../components/DashboardTable'
import QuickStats from '../components/QuickStats'
import './Pages.css'

function Dashboard({ inventory, onUpdateInventory, showToast }) {
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [expiringCount, setExpiringCount] = useState(0)
  const [criticalCount, setCriticalCount] = useState(0)

  useEffect(() => {
    const lowStock = inventory.filter(item => item.stock <= item.lowStockThreshold && item.stock > 0)
    setLowStockAlerts(lowStock)
    
    const expiring = inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length
    const critical = inventory.filter(i => i.daysLeft <= 3 && i.daysLeft > 0).length
    setExpiringCount(expiring)
    setCriticalCount(critical)
  }, [inventory])

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
      const updatedInventory = inventory.map(item => 
        item.id === productId ? { 
          ...item, 
          suggestion: `🔥 ${saleType} ACTIVE - ${discount}`,
          sellingPrice: Math.round(item.sellingPrice * (product.daysLeft <= 1 ? 0.5 : product.daysLeft <= 2 ? 0.6 : 0.7))
        } : item
      )
      onUpdateInventory(updatedInventory)
    }
  }

  const handleDeleteItem = (productId) => {
    const product = inventory.find(p => p.id === productId)
    if (product && window.confirm(`Delete ${product.name} from inventory?`)) {
      const updatedInventory = inventory.filter(item => item.id !== productId)
      onUpdateInventory(updatedInventory)
      showToast(`🗑️ ${product.name} removed from inventory`)
    }
  }

  const features = [
    { icon: "fa-barcode", title: "Batch & Supplier Tracking", desc: "Manage multiple batches, track supplier returns automatically." },
    { icon: "fa-bolt", title: "Smart Flash Sale Triggers", desc: "Auto-suggest BOGO or % discount for items expiring within 72h." },
    { icon: "fa-exclamation-triangle", title: "Low Stock Alerts", desc: "Real-time inventory monitoring prevents out-of-stock scenarios." },
    { icon: "fa-cloud-upload-alt", title: "Cloud Sync", desc: "Access shop data anywhere, offline-first PWA syncs when back online." }
  ]

  return (
    <div className="page-container">
      <Hero />
      
      <QuickStats inventory={inventory} />

      <div className="welcome-banner">
        <i className="fas fa-chart-line"></i>
        <div>
          <strong>Dashboard Overview</strong>
          <p>
            {lowStockAlerts.length > 0 && `⚠️ ${lowStockAlerts.length} item(s) need restocking. `}
            {expiringCount > 0 && `${expiringCount} item(s) near expiry (${criticalCount} critical). `}
            {expiringCount === 0 && lowStockAlerts.length === 0 && 'All systems healthy!'}
          </p>
        </div>
      </div>

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
      />

      <div className="cloud-sync-status">
        <i className="fas fa-cloud-upload-alt"></i>
        <span>Cloud Sync Active</span>
        <span className="sync-time">Last synced: {new Date().toLocaleTimeString()}</span>
        <i className="fas fa-check-circle"></i>
      </div>
    </div>
  )
}

export default Dashboard