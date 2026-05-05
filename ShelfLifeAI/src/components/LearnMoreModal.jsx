// src/components/LearnMoreModal.jsx
import { useState, useEffect } from 'react'
import './LearnMoreModal.css'

function LearnMoreModal({ isOpen, onClose, feature }) {
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const featureDetails = {
    'AI OCR Scanner': {
      icon: 'fa-camera',
      color: '#39e75f',
      overview: 'Our AI-powered OCR (Optical Character Recognition) scanner reads expiry dates directly from product packaging - no barcode needed!',
      benefits: [
        'Works with any printed text on packaging',
        'Perfect for local products without standard barcodes',
        '99.9% accuracy in ideal lighting conditions',
        'Processes images in under 2 seconds',
        'Supports multiple date formats (YYYY-MM-DD, DD/MM/YYYY, etc.)'
      ],
      howItWorks: [
        'Position your camera over the expiry date',
        'Our AI detects and extracts the text',
        'Automatically parses the date format',
        'Calculates days until expiry',
        'Adds to inventory with smart suggestions'
      ],
      useCases: [
        'Small shops with unbranded products',
        'Farmers markets with handwritten labels',
        'Imported goods with foreign date formats',
        'Products with damaged or missing barcodes'
      ],
      demo: 'Try scanning any expiry date - our AI will read it instantly!'
    },
    'Smart Flash Sales': {
      icon: 'fa-bolt',
      color: '#f59e0b',
      overview: 'Automatically trigger discounts for products approaching their expiry date, maximizing revenue and reducing waste.',
      benefits: [
        'Auto-calculates optimal discount based on days left',
        '50% OFF for items expiring within 24 hours',
        '40% OFF for items expiring within 48 hours',
        '30% OFF for items expiring within 7 days',
        'BOGO (Buy One Get One) for critical items'
      ],
      howItWorks: [
        'System monitors expiry dates 24/7',
        'AI predicts optimal discount percentage',
        'Automatically applies flash sale pricing',
        'Notifies customers via email/SMS',
        'Tracks sale performance in real-time'
      ],
      useCases: [
        'Dairy products with short shelf life',
        'Fresh bakery items',
        'Seasonal products',
        'Overstocked inventory'
      ],
      demo: 'Watch as items automatically get discounted as they near expiry!'
    },
    'Real-time Analytics': {
      icon: 'fa-chart-line',
      color: '#3b82f6',
      overview: 'Beautiful, interactive dashboards that show your savings, waste reduction, and inventory performance in real-time.',
      benefits: [
        'Live inventory tracking',
        'Monthly savings calculations',
        'Waste reduction metrics',
        'ROI projections',
        'Category performance analysis'
      ],
      howItWorks: [
        'Data syncs automatically from your inventory',
        'AI analyzes patterns and trends',
        'Generates actionable insights',
        'Creates visual reports and charts',
        'Exports data to CSV/PDF'
      ],
      useCases: [
        'Monthly profit & loss reporting',
        'Inventory turnover analysis',
        'Supplier performance tracking',
        'Seasonal trend forecasting'
      ],
      demo: 'See your savings grow in real-time with our interactive charts!'
    },
    'Supplier Returns': {
      icon: 'fa-truck',
      color: '#8b5cf6',
      overview: 'Automated supplier return management for near-expiry items, saving you money and simplifying logistics.',
      benefits: [
        'One-click return requests',
        'Automated email to suppliers',
        'Track return status in real-time',
        'Credit note management',
        'Return history and analytics'
      ],
      howItWorks: [
        'System identifies return-eligible items',
        'Generates return request automatically',
        'Sends notification to supplier',
        'Tracks return until completion',
        'Updates inventory automatically'
      ],
      useCases: [
        'Near-expiry dairy products',
        'Damaged packaging items',
        'Wrong shipments',
        'Quality issue returns'
      ],
      demo: 'Process supplier returns in seconds with automated workflows!'
    }
  }

  const currentFeature = featureDetails[feature.title] || featureDetails['AI OCR Scanner']

  return (
    <div className="learnmore-overlay" onClick={onClose}>
      <div className="learnmore-container" onClick={(e) => e.stopPropagation()}>
        <button className="learnmore-close" onClick={onClose}>✕</button>
        
        <div className="learnmore-header" style={{ borderBottomColor: `${currentFeature.color}30` }}>
          <div className="learnmore-icon" style={{ background: `${currentFeature.color}15` }}>
            <i className={`fas ${currentFeature.icon}`} style={{ color: currentFeature.color }}></i>
          </div>
          <div>
            <h2>{feature.title}</h2>
            <p>{currentFeature.overview}</p>
          </div>
        </div>
        
        <div className="learnmore-tabs">
          <button 
            className={`learnmore-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-info-circle"></i> Overview
          </button>
          <button 
            className={`learnmore-tab ${activeTab === 'benefits' ? 'active' : ''}`}
            onClick={() => setActiveTab('benefits')}
          >
            <i className="fas fa-gift"></i> Benefits
          </button>
          <button 
            className={`learnmore-tab ${activeTab === 'howitworks' ? 'active' : ''}`}
            onClick={() => setActiveTab('howitworks')}
          >
            <i className="fas fa-cogs"></i> How It Works
          </button>
          <button 
            className={`learnmore-tab ${activeTab === 'usecases' ? 'active' : ''}`}
            onClick={() => setActiveTab('usecases')}
          >
            <i className="fas fa-briefcase"></i> Use Cases
          </button>
        </div>
        
        <div className="learnmore-content">
          {activeTab === 'overview' && (
            <div className="learnmore-panel fade-in">
              <div className="learnmore-overview">
                <i className="fas fa-robot" style={{ color: currentFeature.color }}></i>
                <h3>What is {feature.title}?</h3>
                <p>{currentFeature.overview}</p>
                <div className="learnmore-stats">
                  <div className="stat">
                    <span className="stat-value">99.9%</span>
                    <span className="stat-label">Accuracy Rate</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">&lt;2s</span>
                    <span className="stat-label">Processing Time</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">24/7</span>
                    <span className="stat-label">Monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'benefits' && (
            <div className="learnmore-panel fade-in">
              <div className="learnmore-benefits">
                <h3><i className="fas fa-star" style={{ color: currentFeature.color }}></i> Key Benefits</h3>
                <ul>
                  {currentFeature.benefits.map((benefit, index) => (
                    <li key={index}>
                      <i className="fas fa-check-circle" style={{ color: currentFeature.color }}></i>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'howitworks' && (
            <div className="learnmore-panel fade-in">
              <div className="learnmore-howitworks">
                <h3><i className="fas fa-cogs" style={{ color: currentFeature.color }}></i> How It Works</h3>
                <div className="steps">
                  {currentFeature.howItWorks.map((step, index) => (
                    <div key={index} className="step">
                      <div className="step-number" style={{ background: currentFeature.color }}>{index + 1}</div>
                      <div className="step-content">
                        <p>{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'usecases' && (
            <div className="learnmore-panel fade-in">
              <div className="learnmore-usecases">
                <h3><i className="fas fa-briefcase" style={{ color: currentFeature.color }}></i> Use Cases</h3>
                <div className="usecase-grid">
                  {currentFeature.useCases.map((useCase, index) => (
                    <div key={index} className="usecase-card">
                      <i className="fas fa-check" style={{ color: currentFeature.color }}></i>
                      <span>{useCase}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="learnmore-footer">
          <div className="demo-section">
            <i className="fas fa-play-circle" style={{ color: currentFeature.color }}></i>
            <span>{currentFeature.demo}</span>
          </div>
          <button className="learnmore-cta" onClick={onClose}>
            Try {feature.title} <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LearnMoreModal