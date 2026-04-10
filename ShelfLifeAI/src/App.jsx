import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import FeatureCard from './components/FeatureCard'
import DashboardTable from './components/DashboardTable'
import EdgeSection from './components/EdgeSection'
import ROICard from './components/ROICard'
import Footer from './components/Footer'
import { initialInventory } from './data/inventoryData'
import './App.css'

function App() {
  const [inventory, setInventory] = useState(initialInventory)
  const [toastMsg, setToastMsg] = useState(null)

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

  const features = [
    { icon: "fa-barcode", title: "Batch & Supplier Tracking", desc: "Manage multiple batches, track supplier returns automatically." },
    { icon: "fa-bolt", title: "Smart Flash Sale Triggers", desc: "Auto-suggest BOGO or % discount for items expiring within 72h." },
    { icon: "fa-exclamation-triangle", title: "Low Stock Alerts", desc: "Real-time inventory monitoring prevents out-of-stock scenarios." },
    { icon: "fa-cloud-upload-alt", title: "Cloud Sync", desc: "Access shop data anywhere, offline-first PWA syncs when back online." }
  ]

  return (
    <>
      <Navbar />
      <Hero />
      
      <main className="container">
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
            <i className="fas fa-check-circle"></i> Offline-first PWA<br />
            <i className="fas fa-check-circle"></i> AI-driven actionable insights<br /> 
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default App