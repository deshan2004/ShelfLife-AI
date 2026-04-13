import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'
import UserMenu from './UserMenu'

export default function Navbar({ onLoginClick, user, onLogout }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/dashboard" className="logo">
          <div className="logo-mark">
            <i className="fas fa-leaf" />
          </div>
          <span className="logo-name">
            ShelfLife <span className="logo-ai">AI</span>
          </span>
        </Link>

        <div className="nav-links">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/inventory" 
            className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}
          >
            Inventory
          </Link>
          <Link 
            to="/suppliers" 
            className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`}
          >
            Suppliers
          </Link>
          <Link 
            to="/analytics" 
            className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
          >
            Analytics
          </Link>
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