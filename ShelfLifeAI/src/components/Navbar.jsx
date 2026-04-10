import './Navbar.css'
import UserMenu from './UserMenu'

export default function Navbar({ onScanClick, onLoginClick, user, onLogout, activeTab, onTabChange }) {
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
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-link ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => onTabChange('batches')}
          >
            Batches
          </button>
          <button 
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onTabChange('analytics')}
          >
            Analytics
          </button>
          <button className="btn-nav-outline" onClick={onScanClick}>
            <i className="fas fa-camera" /> Scan
          </button>
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <button className="btn-nav-solid" onClick={onLoginClick}>
              <i className="fas fa-user-shield" /> Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}