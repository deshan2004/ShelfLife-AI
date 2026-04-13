import { useState, useEffect } from 'react'
import './LandingPage.css'

function LandingPage({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: "fa-eye",
      title: "OCR Expiry Detection",
      description: "Read expiry dates directly from packaging using AI-powered OCR. No barcode required.",
      color: "#39e75f"
    },
    {
      icon: "fa-bolt",
      title: "Smart Flash Sales",
      description: "Auto-trigger BOGO or percentage discounts for items expiring within 72 hours.",
      color: "#f59e0b"
    },
    {
      icon: "fa-chart-line",
      title: "Real-time Analytics",
      description: "Track savings, waste reduction, and inventory performance with beautiful dashboards.",
      color: "#3b82f6"
    }
  ]

  const stats = [
    { value: "90%", label: "Less Manual Work", icon: "fa-clock" },
    { value: "LKR 5k+", label: "Avg Monthly Saved", icon: "fa-coins" },
    { value: "99.9%", label: "Data Accuracy", icon: "fa-shield-alt" },
    { value: "1000+", label: "Happy Stores", icon: "fa-store" }
  ]

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="landing-bg">
        <div className="bg-gradient"></div>
        <div className="bg-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">✨</span>
              <span>AI-Powered Inventory Management</span>
            </div>
            
            <h1 className="hero-title">
              Eliminate{' '}
              <span className="gradient-text">Expiry Losses</span>
              <br />
              Maximize{' '}
              <span className="highlight">Retail Profits</span>
            </h1>
            
            <p className="hero-description">
              Small shops lose 5–15% annual profits due to expired items.
              ShelfLife AI watches your inventory 24/7, notifies before loss,
              and suggests flash sales or supplier returns.
            </p>
            
            <div className="hero-actions">
              <button className="btn-primary-glow" onClick={onLoginClick}>
                <span>Start Free Trial</span>
                <i className="fas fa-arrow-right"></i>
              </button>
              <button className="btn-outline" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                <i className="fas fa-play"></i>
                <span>Watch Demo</span>
              </button>
            </div>
            
            <div className="trust-badges">
              <div className="trust-item">
                <i className="fas fa-star"></i>
                <span>4.9/5 Rating</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <i className="fas fa-shield-alt"></i>
                <span>Bank-grade Security</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <i className="fas fa-headset"></i>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="mockup-title">Inventory Monitor</span>
                <i className="fas fa-sync-alt sync-icon"></i>
              </div>
              <div className="mockup-content">
                <div className="metric-cards">
                  <div className="metric">
                    <span className="metric-value">24</span>
                    <span className="metric-label">Total Items</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value warning">3</span>
                    <span className="metric-label">Near Expiry</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value success">LKR 8.2k</span>
                    <span className="metric-label">Saved</span>
                  </div>
                </div>
                <div className="product-list">
                  <div className="product-item critical">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Greek Yogurt</span>
                    <span className="expiry">2 days left</span>
                    <span className="flash-tag">Flash Sale</span>
                  </div>
                  <div className="product-item warning">
                    <i className="fas fa-clock"></i>
                    <span>Probiotic Drink</span>
                    <span className="expiry">4 days left</span>
                    <span className="flash-tag">30% OFF</span>
                  </div>
                  <div className="product-item healthy">
                    <i className="fas fa-check-circle"></i>
                    <span>Fresh Milk</span>
                    <span className="expiry">8 days left</span>
                    <span className="view-tag">Monitor</span>
                  </div>
                </div>
              </div>
              <div className="mockup-footer">
                <i className="fas fa-brain"></i>
                <span>AI Insight: 3 items need attention</span>
              </div>
            </div>
            
            <div className="floating-stats">
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
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-icon">
                  <i className={`fas ${stat.icon}`}></i>
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
            <p className="section-subtitle">
              Everything you need to eliminate waste and maximize profits
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="feature-icon" style={{ background: `${feature.color}15`, borderColor: `${feature.color}30` }}>
                  <i className={`fas ${feature.icon}`} style={{ color: feature.color }}></i>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-link">
                  <span>Learn more</span>
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="problem-section">
        <div className="container">
          <div className="problem-grid">
            <div className="problem-content">
              <span className="section-eyebrow">The Problem</span>
              <h2 className="section-title">Hidden losses are killing your profits</h2>
              <div className="problem-stats">
                <div className="problem-stat">
                  <span className="stat-highlight">5-15%</span>
                  <span className="stat-text">Annual profit loss from expired items</span>
                </div>
                <div className="problem-stat">
                  <span className="stat-highlight">2-3 hours</span>
                  <span className="stat-text">Daily manual checking time</span>
                </div>
                <div className="problem-stat">
                  <span className="stat-highlight">30%</span>
                  <span className="stat-text">Markdown needed for expiring stock</span>
                </div>
              </div>
            </div>
            <div className="solution-content">
              <span className="section-eyebrow">The Solution</span>
              <h2 className="section-title">ShelfLife AI fixes everything</h2>
              <ul className="solution-list">
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Automated monitoring</strong>
                    <p>24/7 tracking without manual checking</p>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Smart notifications</strong>
                    <p>Alerts at 30, 7, and 2 days before expiry</p>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Actionable insights</strong>
                    <p>Specific actions: Flash Sale or Return to Supplier</p>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Offline-first PWA</strong>
                    <p>Works without internet, syncs when back online</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Preview */}
      <section className="roi-preview-section">
        <div className="container">
          <div className="roi-card-large">
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
              <button className="btn-primary" onClick={onLoginClick}>
                Calculate Your ROI
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className="roi-visual">
              <div className="savings-chart">
                <div className="chart-bar" style={{ height: '60%' }}>
                  <span>LKR 3.2k</span>
                </div>
                <div className="chart-bar" style={{ height: '75%' }}>
                  <span>LKR 4.1k</span>
                </div>
                <div className="chart-bar" style={{ height: '85%' }}>
                  <span>LKR 5.2k</span>
                </div>
                <div className="chart-bar" style={{ height: '95%' }}>
                  <span>LKR 6.1k</span>
                </div>
                <div className="chart-bar projected" style={{ height: '120%' }}>
                  <span>LKR 8.4k</span>
                </div>
              </div>
              <div className="chart-labels">
                <span>Month 1</span>
                <span>Month 2</span>
                <span>Month 3</span>
                <span>Month 4</span>
                <span>Projected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to stop losing money to expired stock?</h2>
            <p>Join 1000+ retailers who are already saving thousands with ShelfLife AI</p>
            <div className="cta-buttons">
              <button className="btn-primary-large" onClick={onLoginClick}>
                Start Free Trial
                <i className="fas fa-rocket"></i>
              </button>
              <button className="btn-outline-light">
                Schedule Demo
                <i className="fas fa-calendar"></i>
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
            <p>&copy; 2026 ShelfLife AI. All rights reserved.</p>
            <p>Built with <i className="fas fa-heart"></i> for retailers worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage