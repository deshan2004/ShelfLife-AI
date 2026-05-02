// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'
import UserMenu from './UserMenu'

export default function Navbar({ onLoginClick, user, onLogout, isAdmin }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to={user ? (isAdmin ? "/admin/dashboard" : "/dashboard") : "/"} className="logo">
          <div className="logo-mark">
            <i className="fas fa-leaf" />
          </div>
          <span className="logo-name">
            ShelfLife <span className="logo-ai">AI</span>
          </span>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {isAdmin ? (
                // Admin Navigation - NO BILLING ICON
                <>
                  <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                    <i className="fas fa-chart-pie"></i> Dashboard
                  </Link>
                  <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
                    <i className="fas fa-users"></i> Users
                  </Link>
                  <Link to="/admin/inventory" className={`nav-link ${isActive('/admin/inventory') ? 'active' : ''}`}>
                    <i className="fas fa-boxes"></i> Inventory
                  </Link>
                  <Link to="/admin/subscriptions" className={`nav-link ${isActive('/admin/subscriptions') ? 'active' : ''}`}>
                    <i className="fas fa-credit-card"></i> Subscriptions
                  </Link>
                  <Link to="/admin/analytics" className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}>
                    <i className="fas fa-chart-line"></i> Analytics
                  </Link>
                  <Link to="/admin/settings" className={`nav-link ${isActive('/admin/settings') ? 'active' : ''}`}>
                    <i className="fas fa-cog"></i> Settings
                  </Link>
                </>
              ) : (
                // User Navigation - NO BILLING ICON
                <>
                  <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/inventory" className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}>
                    Inventory
                  </Link>
                  <Link to="/suppliers" className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`}>
                    Suppliers
                  </Link>
                  <Link to="/analytics" className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}>
                    Analytics
                  </Link>
                  {/* Billing link removed from here */}
                </>
              )}
              <UserMenu user={user} onLogout={onLogout} isAdmin={isAdmin} />
            </>
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