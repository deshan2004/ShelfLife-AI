import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <i className="fas fa-leaf"></i> ShelfLife AI © 2026 | Eliminating expiry losses
        </div>
        <div className="footer-social">
          <i className="fab fa-github"></i>
          <i className="fab fa-twitter"></i>
          <i className="fab fa-linkedin"></i>
          <i className="fas fa-envelope"></i>
          <span>hello@shelflife.ai</span>
        </div>
        <div className="footer-features">
          ⚡ Offline-first | OCR | Smart Alerts
        </div>
      </div>
    </footer>
  )
}

export default Footer