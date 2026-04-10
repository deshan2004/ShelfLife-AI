import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg-gradient"></div>
      <div className="hero-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <div className="container">
        <div className="hero-grid">
          {/* Left side - Text content */}
          <div className="hero-text animate-slide-up">
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
            <div className="hero-stats-grid">
              <div className="stat-card-mini">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-number">90%</span>
                  <span className="stat-label">Less manual checking</span>
                </div>
              </div>
              
              <div className="stat-card-mini">
                <div className="stat-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-number">LKR 5k+</span>
                  <span className="stat-label">Avg monthly saved</span>
                </div>
              </div>
              
              <div className="stat-card-mini">
                <div className="stat-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Data accuracy</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hero-cta-group">
              <button className="btn-primary">
                <i className="fas fa-rocket"></i>
                <span>Start Free Trial</span>
                <i className="fas fa-arrow-right"></i>
              </button>
              <button className="btn-secondary">
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
                <i className="fas fa-clock"></i>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right side - Visual Dashboard Preview */}
          <div className="hero-visual animate-slide-up-delayed">
            <div className="dashboard-preview-card">
              <div className="card-header">
                <div className="header-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="header-title">Inventory Monitor</span>
                <i className="fas fa-sync-alt sync-icon"></i>
              </div>
              
              <div className="card-content">
                <div className="metric-row">
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
                    <span className="metric-label">Monthly Saved</span>
                  </div>
                </div>
                
                <div className="product-list">
                  <div className="product-item critical">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Greek Yogurt</span>
                    <span className="expiry-badge">2 days left</span>
                    <button className="flash-btn">Flash Sale</button>
                  </div>
                  <div className="product-item warning">
                    <i className="fas fa-clock"></i>
                    <span>Probiotic Drink</span>
                    <span className="expiry-badge">4 days left</span>
                    <button className="flash-btn">Flash Sale</button>
                  </div>
                  <div className="product-item healthy">
                    <i className="fas fa-check-circle"></i>
                    <span>Fresh Milk</span>
                    <span className="expiry-badge">8 days left</span>
                    <button className="view-btn">View</button>
                  </div>
                </div>
              </div>
              
              <div className="card-footer">
                <div className="ai-insight-badge">
                  <i className="fas fa-brain"></i>
                  <span>AI Insight: 3 items need attention</span>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="floating-element element-1">
              <i className="fas fa-camera"></i>
              <span>OCR Scan</span>
            </div>
            <div className="floating-element element-2">
              <i className="fas fa-bolt"></i>
              <span>Auto Alert</span>
            </div>
            <div className="floating-element element-3">
              <i className="fas fa-chart-line"></i>
              <span>+32% ROI</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}