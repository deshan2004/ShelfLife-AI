// src/pages/LandingPage.jsx - Complete Beautiful Landing Page with Demo
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

function LandingPage({ onLoginClick }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [activeDemoIndex, setActiveDemoIndex] = useState(0)
  const [showDemoToast, setShowDemoToast] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate demo cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemoIndex((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleStartFreeTrial = () => {
    const user = localStorage.getItem('shelflife_user')
    if (user) {
      navigate('/billing')
    } else {
      if (onLoginClick) onLoginClick()
    }
  }

  const handleSeeDemo = () => {
    setShowDemoToast(true)
    setTimeout(() => setShowDemoToast(false), 3000)
    
    const demoSection = document.getElementById('demo-section')
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const stats = [
    { value: "90%", label: "LESS MANUAL CHECKING", icon: "fa-clock", color: "#39e75f" },
    { value: "LKR 5k+", label: "AVG MONTHLY SAVED", icon: "fa-coins", color: "#f59e0b" },
    { value: "99.9%", label: "DATA ACCURACY", icon: "fa-shield-alt", color: "#3b82f6" }
  ]

  const features = [
    { icon: "fa-camera", title: "AI OCR Scanner", desc: "Read expiry dates directly from packaging. No barcode needed." },
    { icon: "fa-bolt", title: "Smart Flash Sales", desc: "Auto-trigger discounts for items expiring soon." },
    { icon: "fa-chart-line", title: "Real-time Analytics", desc: "Track savings and waste reduction instantly." },
    { icon: "fa-truck", title: "Supplier Returns", desc: "Automated return requests for near-expiry items." }
  ]

  const demoProducts = [
    { name: "Fresh Milk", daysLeft: 2, status: "critical", discount: "50% OFF" },
    { name: "Greek Yogurt", daysLeft: 4, status: "warning", discount: "30% OFF" },
    { name: "Wheat Bread", daysLeft: 8, status: "healthy", discount: "Monitor" }
  ]

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="landing-bg">
        <div className="bg-gradient"></div>
        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{ 
              '--duration': `${12 + Math.random() * 20}s`,
              '--delay': `${Math.random() * 10}s`,
              '--left': `${Math.random() * 100}%`,
              '--top': `${Math.random() * 100}%`
            }}></div>
          ))}
        </div>
      </div>

      {/* Demo Toast Notification */}
      {showDemoToast && (
        <div className="demo-toast">
          <i className="fas fa-play-circle"></i>
          <span>🎬 Demo mode activated! Check out the interactive preview below.</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            {/* Left Content */}
            <div className="hero-content fade-in-up">
              <div className="hero-badge">
                <span className="badge-icon">✨</span>
                <span>AI-Powered Inventory Management</span>
                <span className="badge-new">NEW</span>
              </div>
              
              <h1 className="hero-title">
                Eliminate <span className="gradient-text">Expiry Losses</span>
                <br />
                Maximize <span className="highlight">Retail Profits</span>
              </h1>
              
              <p className="hero-description">
                Small shops lose 5–15% annual profits due to expired items.
                ShelfLife AI watches your inventory 24/7, notifies before loss,
                and suggests flash sales or supplier returns.
              </p>
              
              {/* Stats Cards */}
              <div className="hero-stats">
                {stats.map((stat, index) => (
                  <div key={index} className="hero-stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="hero-stat-icon" style={{ background: `${stat.color}15` }}>
                      <i className={`fas ${stat.icon}`} style={{ color: stat.color }}></i>
                    </div>
                    <div>
                      <div className="hero-stat-value">{stat.value}</div>
                      <div className="hero-stat-label">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* CTA Buttons */}
              <div className="hero-buttons">
                <button className="btn-primary-glow" onClick={handleStartFreeTrial}>
                  <i className="fas fa-rocket"></i>
                  <span>Start Free Trial</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
                <button className="btn-outline-glow" onClick={handleSeeDemo}>
                  <i className="fas fa-play"></i>
                  <span>See Demo</span>
                </button>
              </div>
              
              {/* Trust Badges */}
              <div className="trust-badges">
                <div className="trust-item">
                  <i className="fas fa-star"></i>
                  <span>4.9/5 Rating</span>
                </div>
                <div className="trust-divider"></div>
                <div className="trust-item">
                  <i className="fas fa-users"></i>
                  <span>1000+ Stores</span>
                </div>
                <div className="trust-divider"></div>
                <div className="trust-item">
                  <i className="fas fa-headset"></i>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Interactive Dashboard Demo */}
            <div className="hero-visual fade-in-up-delayed">
              <div className="dashboard-demo-card">
                <div className="demo-card-header">
                  <div className="demo-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="demo-title">Inventory Monitor</span>
                  <i className="fas fa-sync-alt sync-icon"></i>
                </div>
                
                <div className="demo-card-content">
                  <div className="demo-metrics">
                    <div className="demo-metric">
                      <span className="demo-metric-value">24</span>
                      <span className="demo-metric-label">Total Items</span>
                    </div>
                    <div className="demo-metric">
                      <span className="demo-metric-value warning">3</span>
                      <span className="demo-metric-label">Near Expiry</span>
                    </div>
                    <div className="demo-metric">
                      <span className="demo-metric-value success">LKR 8.2k</span>
                      <span className="demo-metric-label">Monthly Saved</span>
                    </div>
                  </div>
                  
                  <div className="demo-product-list">
                    {demoProducts.map((product, index) => (
                      <div 
                        key={index} 
                        className={`demo-product-item ${product.status}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <i className={`fas ${product.status === 'critical' ? 'fa-exclamation-triangle' : product.status === 'warning' ? 'fa-clock' : 'fa-check-circle'}`}></i>
                        <span className="demo-product-name">{product.name}</span>
                        <span className="demo-product-expiry">{product.daysLeft} days left</span>
                        <button className={`demo-action-btn ${product.status !== 'healthy' ? 'flash' : 'view'}`}>
                          {product.status !== 'healthy' ? product.discount : 'View'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="demo-card-footer">
                  <i className="fas fa-brain"></i>
                  <span>AI Insight: 3 items need attention - Flash sale recommended</span>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="floating-elements">
                <div className="float-card float-1">
                  <i className="fas fa-camera"></i>
                  <span>OCR Scan</span>
                </div>
                <div className="float-card float-2">
                  <i className="fas fa-bell"></i>
                  <span>Auto Alert</span>
                </div>
                <div className="float-card float-3">
                  <i className="fas fa-chart-line"></i>
                  <span>+32% ROI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-icon-wrapper" style={{ background: `${stat.color}15` }}>
                  <i className={`fas ${stat.icon}`} style={{ color: stat.color }}></i>
                </div>
                <div className="stat-number">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Why Choose Us</span>
            <h2 className="section-title">Smart Features for Smart Retailers</h2>
            <p className="section-subtitle">Everything you need to eliminate waste and maximize profits</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon-wrapper">
                  <i className={`fas ${feature.icon}`}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <div className="feature-link">
                  <span>Learn more</span>
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo-section" className="demo-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Live Demo</span>
            <h2 className="section-title">See ShelfLife AI in Action</h2>
            <p className="section-subtitle">Watch how our AI helps you save thousands on expiry losses</p>
          </div>
          
          <div className="demo-container">
            <div className="demo-tabs">
              <button 
                className={`demo-tab ${activeDemoIndex === 0 ? 'active' : ''}`}
                onClick={() => setActiveDemoIndex(0)}
              >
                <i className="fas fa-camera"></i> OCR Scanner
              </button>
              <button 
                className={`demo-tab ${activeDemoIndex === 1 ? 'active' : ''}`}
                onClick={() => setActiveDemoIndex(1)}
              >
                <i className="fas fa-chart-line"></i> Analytics Dashboard
              </button>
              <button 
                className={`demo-tab ${activeDemoIndex === 2 ? 'active' : ''}`}
                onClick={() => setActiveDemoIndex(2)}
              >
                <i className="fas fa-bell"></i> Smart Alerts
              </button>
            </div>
            
            <div className="demo-content">
              {activeDemoIndex === 0 && (
                <div className="demo-panel slide-in">
                  <div className="demo-scan-area">
                    <div className="scan-frame">
                      <div className="scan-line"></div>
                      <div className="scan-placeholder">
                        <i className="fas fa-camera"></i>
                        <p>Position expiry date in frame</p>
                      </div>
                    </div>
                    <div className="scan-result">
                      <i className="fas fa-check-circle"></i>
                      <div>
                        <strong>Expiry Date Detected!</strong>
                        <p>2025-12-31 • 213 days remaining</p>
                      </div>
                    </div>
                  </div>
                  <div className="demo-info">
                    <h4>📱 AI-Powered OCR Technology</h4>
                    <p>Our advanced OCR reads expiry dates directly from packaging - no barcode needed. Perfect for local products without standard barcodes!</p>
                  </div>
                </div>
              )}
              
              {activeDemoIndex === 1 && (
                <div className="demo-panel slide-in">
                  <div className="demo-chart">
                    <div className="chart-bars">
                      {[65, 75, 55, 85, 70, 90, 80, 95].map((height, i) => (
                        <div key={i} className="chart-bar-wrapper">
                          <div className="chart-bar" style={{ height: `${height}%` }}>
                            <span>LKR {(height * 100).toLocaleString()}</span>
                          </div>
                          <span className="chart-label">Week {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="demo-info">
                    <h4>📊 Real-time Analytics Dashboard</h4>
                    <p>Track your savings, waste reduction, and inventory performance with beautiful, real-time charts and insights.</p>
                  </div>
                </div>
              )}
              
              {activeDemoIndex === 2 && (
                <div className="demo-panel slide-in">
                  <div className="demo-alerts">
                    <div className="alert-item critical">
                      <i className="fas fa-exclamation-triangle"></i>
                      <div>
                        <strong>Critical Alert!</strong>
                        <p>Greek Yogurt expires in 2 days - Flash sale recommended</p>
                      </div>
                      <button className="alert-action">Take Action</button>
                    </div>
                    <div className="alert-item warning">
                      <i className="fas fa-clock"></i>
                      <div>
                        <strong>Warning</strong>
                        <p>Fresh Milk expires in 4 days - Schedule flash sale</p>
                      </div>
                      <button className="alert-action">Schedule</button>
                    </div>
                    <div className="alert-item info">
                      <i className="fas fa-info-circle"></i>
                      <div>
                        <strong>Low Stock Alert</strong>
                        <p>Wheat Bread only 5 units remaining</p>
                      </div>
                      <button className="alert-action">Order Now</button>
                    </div>
                  </div>
                  <div className="demo-info">
                    <h4>🔔 Smart Notification System</h4>
                    <p>Get real-time alerts before products expire, so you never miss a flash sale opportunity. Customize your notification preferences.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="roi-section">
        <div className="container">
          <div className="roi-card">
            <div className="roi-content">
              <i className="fas fa-chart-line roi-icon"></i>
              <h2>ROI That Pays for Itself</h2>
              <p>
                If the system saves just LKR 5,000 worth of stock per month, 
                it pays for itself immediately. Reduce time spent on manual 
                stock-checking by 90%.
              </p>
              <div className="roi-stats">
                <div className="roi-stat">
                  <strong>LKR 5,000+</strong>
                  <span>Monthly savings</span>
                </div>
                <div className="roi-stat">
                  <strong>90%</strong>
                  <span>Efficiency boost</span>
                </div>
                <div className="roi-stat">
                  <strong>Zero waste</strong>
                  <span>Smarter ordering</span>
                </div>
              </div>
              <button className="btn-primary" onClick={handleStartFreeTrial}>
                Calculate Your ROI <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className="roi-visual">
              <div className="savings-chart">
                <div className="savings-bar" style={{ height: '60%' }}><span>LKR 3.2k</span></div>
                <div className="savings-bar" style={{ height: '75%' }}><span>LKR 4.1k</span></div>
                <div className="savings-bar" style={{ height: '85%' }}><span>LKR 5.2k</span></div>
                <div className="savings-bar" style={{ height: '95%' }}><span>LKR 6.1k</span></div>
                <div className="savings-bar projected" style={{ height: '120%' }}><span>LKR 8.4k</span></div>
              </div>
              <div className="savings-labels">
                <span>Month 1</span><span>Month 2</span><span>Month 3</span><span>Month 4</span><span>Projected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to stop losing money to expired stock?</h2>
            <p>Join 1000+ retailers who are already saving thousands with ShelfLife AI</p>
            <div className="cta-buttons">
              <button className="btn-cta-primary" onClick={handleStartFreeTrial}>
                Start Free Trial <i className="fas fa-rocket"></i>
              </button>
              <button className="btn-cta-secondary" onClick={handleSeeDemo}>
                Watch Demo <i className="fas fa-play"></i>
              </button>
            </div>
            <div className="cta-note">
              <i className="fas fa-credit-card"></i>
              <span>No credit card required • Free for 14 days • Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <i className="fas fa-leaf"></i>
                <span>ShelfLife <span className="logo-ai">AI</span></span>
              </div>
              <p>Eliminating expiry losses, maximizing retail profits.</p>
              <div className="footer-social">
                <i className="fab fa-twitter"></i>
                <i className="fab fa-linkedin"></i>
                <i className="fab fa-github"></i>
                <i className="fab fa-discord"></i>
              </div>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Product</h4>
                <a href="#">Features</a>
                <a href="#">Pricing</a>
                <a href="#">Demo</a>
                <a href="#">API</a>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#">Press</a>
              </div>
              <div className="link-group">
                <h4>Resources</h4>
                <a href="#">Documentation</a>
                <a href="#">Help Center</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 ShelfLife AI. All rights reserved. Built with <i className="fas fa-heart"></i> for retailers worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage