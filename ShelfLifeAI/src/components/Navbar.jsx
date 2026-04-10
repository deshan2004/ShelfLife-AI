import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <div className="logo">
          <div className="logo-mark">
            <i className="fas fa-leaf" />
          </div>
          <span className="logo-name">
            ShelfLife <span className="logo-ai">AI</span>
          </span>
        </div>

        <div className="nav-links">
          <a href="#" className="nav-link hide-mobile">Dashboard</a>
          <a href="#" className="nav-link hide-mobile">Inventory</a>
          <a href="#" className="nav-link hide-mobile">Analytics</a>
          <button className="btn-nav-outline">
            <i className="fas fa-camera" /> OCR Scan
          </button>
          <button className="btn-nav-solid">
            <i className="fas fa-user-shield" /> Sign In
          </button>
        </div>
      </div>
    </nav>
  )
}