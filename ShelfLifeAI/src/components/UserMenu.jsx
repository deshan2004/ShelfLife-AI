// Update UserMenu.jsx to include Settings
// src/components/UserMenu.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserMenu.css'

function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  if (!user) return null

  const handleNavigation = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <div className="user-menu">
      <button className="user-menu-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-avatar">
          <i className="fas fa-user"></i>
        </div>
        <span className="user-name">{user.name}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>
      
      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-avatar-large">
              <i className="fas fa-user"></i>
            </div>
            <div>
              <div className="user-email">{user.email}</div>
              <div className="user-role">Store Owner</div>
            </div>
          </div>
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => handleNavigation('/dashboard')}>
            <i className="fas fa-chart-line"></i> Dashboard
          </button>
          <button className="menu-item" onClick={() => handleNavigation('/inventory')}>
            <i className="fas fa-box"></i> My Inventory
          </button>
          <button className="menu-item" onClick={() => handleNavigation('/suppliers')}>
            <i className="fas fa-truck"></i> Suppliers
          </button>
          <button className="menu-item" onClick={() => handleNavigation('/analytics')}>
            <i className="fas fa-chart-pie"></i> Analytics
          </button>
          <button className="menu-item" onClick={() => handleNavigation('/billing')}>
            <i className="fas fa-credit-card"></i> Billing
          </button>
          {/* Settings Link */}
          <button className="menu-item" onClick={() => handleNavigation('/settings')}>
            <i className="fas fa-cog"></i> Settings
          </button>
          <div className="menu-divider"></div>
          <button className="menu-item logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu