import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          {/* ── Text side ── */}
          <div className="hero-text">
            <div className="hero-eyebrow">
              <span className="pulse-dot" />
              AI-Powered Expiry Management
            </div>

            <h1 className="hero-h1">
              Eliminate <em>Expiry Losses</em>,<br />
              Maximize Profits
            </h1>

            <p className="hero-desc">
              Small shops lose 5–15% annual profits due to expired items.
              ShelfLife AI watches your inventory 24/7, notifies before loss,
              and suggests flash sales or supplier returns.
            </p>

            <div className="hero-stats">
              <div className="stat-block">
                <div className="val">90%</div>
                <div className="lbl">Less manual checking</div>
              </div>
              <div className="stat-block">
                <div className="val">LKR 5k+</div>
                <div className="lbl">Avg monthly saved</div>
              </div>
              <div className="stat-block">
                <div className="val">99.9%</div>
                <div className="lbl">Data accuracy</div>
              </div>
            </div>

            <div className="hero-btns">
              <button className="btn-hero-primary">
                <i className="fas fa-qrcode" /> Start Free Trial
              </button>
              <button className="btn-hero-ghost">
                <i className="fas fa-play" /> See Demo
              </button>
            </div>
          </div>

          {/* ── Visual side ── */}
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-glow" />
              <div className="float-badge float-badge-tl">
                <span className="badge-dot" /> Live Monitoring
              </div>
              <i className="fas fa-boxes-stacked hero-main-icon" />
              <div className="float-badge float-badge-br">
                <i className="fas fa-eye" /> OCR reads expiry dates
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}