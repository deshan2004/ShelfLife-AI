// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import UserMenu from './UserMenu';

export default function Navbar({ onLoginClick, user, onLogout, isAdmin }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside (handled by overlay)
  const handleOverlayClick = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Mobile navigation links based on user role
  const getMobileNavLinks = () => {
    if (isAdmin) {
      return [
        { path: '/admin/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { path: '/admin/users', icon: 'fa-users', label: 'Users' },
        { path: '/admin/inventory', icon: 'fa-boxes', label: 'Inventory' },
        { path: '/admin/subscriptions', icon: 'fa-credit-card', label: 'Subscriptions' },
        { path: '/admin/analytics', icon: 'fa-chart-line', label: 'Analytics' },
        { path: '/admin/settings', icon: 'fa-cog', label: 'Settings' }
      ];
    } else if (user) {
      return [
        { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
        { path: '/inventory', icon: 'fa-box', label: 'Inventory' },
        { path: '/suppliers', icon: 'fa-truck', label: 'Suppliers' },
        { path: '/analytics', icon: 'fa-chart-pie', label: 'Analytics' },
        { path: '/billing', icon: 'fa-credit-card', label: 'Billing' },
        { path: '/settings', icon: 'fa-cog', label: 'Settings' }
      ];
    }
    return [];
  };

  const mobileNavLinks = getMobileNavLinks();

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

        {/* Desktop Navigation */}
        <div className="nav-links">
          {user ? (
            <>
              {isAdmin ? (
                // Admin Navigation
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
                // User Navigation
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

        {/* Hamburger Menu Button - Mobile Only */}
        {user && (
          <button 
            className={`hamburger-btn ${mobileMenuOpen ? 'active' : ''}`} 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={handleOverlayClick}>
          <div className="mobile-menu-container" onClick={(e) => e.stopPropagation()}>
            {/* User Info */}
            {user && (
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="mobile-user-details">
                  <div className="mobile-user-name">{user.name}</div>
                  <div className="mobile-user-email">{user.email}</div>
                  {isAdmin && <div className="mobile-user-role">Administrator</div>}
                </div>
              </div>
            )}
            
            {/* Navigation Links */}
            <div className="mobile-nav-links">
              {mobileNavLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className={`fas ${link.icon}`}></i>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
            
            {/* Logout Button */}
            <button className="mobile-logout-btn" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}