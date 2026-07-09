// src/components/AlertDropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AlertDropdown.css';

function AlertDropdown({ inventory, onFlashSale, onOrderNow, actionLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Filter items
  const criticalItems = inventory.filter(item => item.daysLeft <= 3 && item.daysLeft > 0);
  const expiringItems = inventory.filter(item => item.daysLeft > 3 && item.daysLeft <= 7);
  const lowStockItems = inventory.filter(item => item.stock <= item.lowStockThreshold && item.stock > 0);
  const outOfStockItems = inventory.filter(item => item.stock <= 0);

  const totalAlerts = criticalItems.length + expiringItems.length + lowStockItems.length + outOfStockItems.length;

  // Get all alert items
  const allAlerts = [...criticalItems, ...expiringItems, ...lowStockItems, ...outOfStockItems];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item) => {
    setIsOpen(false);
    navigate('/inventory');
    // Set filter to show this product
    localStorage.setItem('shelflife_filter_search', item.name);
  };

  if (totalAlerts === 0) {
    return null;
  }

  return (
    <div className="alert-dropdown" ref={dropdownRef}>
      <button 
        className={`alert-dropdown-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-bell"></i>
        <span className="alert-badge">{totalAlerts}</span>
      </button>

      {isOpen && (
        <div className="alert-dropdown-menu">
          <div className="alert-dropdown-header">
            <span className="alert-dropdown-title">
              <i className="fas fa-bell"></i>
              Alerts ({totalAlerts})
            </span>
            <button 
              className="alert-dropdown-view-all"
              onClick={() => {
                setIsOpen(false);
                navigate('/inventory');
              }}
            >
              View All
            </button>
          </div>

          <div className="alert-dropdown-items">
            {allAlerts.slice(0, 8).map(item => {
              let alertType = 'info';
              let icon = 'fas fa-info-circle';
              let statusText = '';

              if (item.daysLeft <= 3 && item.daysLeft > 0) {
                alertType = 'critical';
                icon = 'fas fa-exclamation-triangle';
                statusText = `${item.daysLeft} days left`;
              } else if (item.daysLeft <= 7 && item.daysLeft > 3) {
                alertType = 'warning';
                icon = 'fas fa-clock';
                statusText = `${item.daysLeft} days left`;
              } else if (item.stock <= 0) {
                alertType = 'outofstock';
                icon = 'fas fa-times-circle';
                statusText = 'Out of Stock';
              } else if (item.stock <= item.lowStockThreshold) {
                alertType = 'lowstock';
                icon = 'fas fa-exclamation-circle';
                statusText = `${item.stock} units left`;
              }

              return (
                <div 
                  key={item.id} 
                  className={`alert-dropdown-item ${alertType}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="alert-dropdown-item-icon">
                    <i className={icon}></i>
                  </div>
                  <div className="alert-dropdown-item-content">
                    <div className="alert-dropdown-item-name">
                      {item.name}
                      {item.flashSaleActive && item.flashSaleDiscount && (
                        <span className="discount-badge">🔥 {item.flashSaleDiscount}</span>
                      )}
                    </div>
                    <div className="alert-dropdown-item-details">
                      <span>{statusText}</span>
                      <span className="alert-item-supplier">{item.supplier}</span>
                    </div>
                  </div>
                  <div className="alert-dropdown-item-actions">
                    {item.daysLeft > 0 && item.daysLeft <= 7 && (
                      <button 
                        className="alert-action-btn flash"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFlashSale(item.id);
                        }}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <i className="fas fa-spinner fa-pulse"></i>
                        ) : (
                          <i className="fas fa-tags"></i>
                        )}
                      </button>
                    )}
                    {item.stock <= item.lowStockThreshold && item.stock > 0 && (
                      <button 
                        className="alert-action-btn order"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOrderNow(item.id);
                        }}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <i className="fas fa-spinner fa-pulse"></i>
                        ) : (
                          <i className="fas fa-shopping-cart"></i>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {allAlerts.length > 8 && (
              <div className="alert-dropdown-more">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/inventory');
                  }}
                >
                  + {allAlerts.length - 8} more alerts
                </button>
              </div>
            )}
          </div>

          <div className="alert-dropdown-footer">
            <button 
              className="alert-dropdown-goto"
              onClick={() => {
                setIsOpen(false);
                navigate('/inventory');
              }}
            >
              <i className="fas fa-arrow-right"></i>
              Go to Inventory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertDropdown;