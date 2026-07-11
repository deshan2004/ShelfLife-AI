// src/components/OrderModal.jsx
import { useState, useEffect, useRef } from 'react';
import './OrderModal.css';

function OrderModal({ isOpen, product, onConfirm, onCancel }) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Low Stock');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && product) {
      // Default quantity = threshold - current stock + buffer
      const defaultQty = Math.max(1, (product.lowStockThreshold || 10) - product.stock + 5);
      setQuantity(defaultQty);
      setReason('Low Stock');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setQuantity(val);
    }
  };

  const increment = () => setQuantity(prev => prev + 5);
  const decrement = () => setQuantity(prev => Math.max(0, prev - 5));

  const quickQuantities = [5, 10, 20, 50, 100];

  const handleConfirm = () => {
    if (quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    onConfirm(quantity, reason);
  };

  // Calculate suggested quantity
  const suggestedQty = Math.max(1, (product.lowStockThreshold || 10) - product.stock + 10);
  const isUrgent = product.stock <= 5;

  return (
    <div className="order-modal-overlay" onClick={onCancel}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="order-modal-header">
          <div className="order-modal-icon">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div>
            <h3>📦 Order More Stock</h3>
            <p className="order-product-name">{product.name}</p>
          </div>
          <button className="order-modal-close" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Product Info */}
        <div className="order-product-info">
          <div className="order-info-grid">
            <div className="order-info-item">
              <span className="order-info-label">Current Stock</span>
              <span className={`order-info-value ${isUrgent ? 'urgent' : ''}`}>
                {product.stock} units
                {isUrgent && <span className="order-urgent-badge">⚠️ Low</span>}
              </span>
            </div>
            <div className="order-info-item">
              <span className="order-info-label">Low Stock Threshold</span>
              <span className="order-info-value">{product.lowStockThreshold || 10} units</span>
            </div>
            <div className="order-info-item">
              <span className="order-info-label">Supplier</span>
              <span className="order-info-value">{product.supplier}</span>
            </div>
            <div className="order-info-item">
              <span className="order-info-label">Suggested Order</span>
              <span className="order-info-value highlight">{suggestedQty} units</span>
            </div>
          </div>
        </div>

        {/* Stock Status Bar */}
        <div className="order-stock-status">
          <div className="order-stock-bar">
            <div 
              className="order-stock-fill" 
              style={{ 
                width: `${Math.min((product.stock / (product.lowStockThreshold || 10)) * 100, 100)}%`,
                background: isUrgent ? '#ef4444' : '#f59e0b'
              }}
            ></div>
          </div>
          <span className="order-stock-text">
            {isUrgent ? '⚠️ Critical - Order immediately!' : '📉 Stock running low'}
          </span>
        </div>

        {/* Quantity Selector */}
        <div className="order-quantity-section">
          <label className="order-quantity-label">
            <i className="fas fa-box"></i>
            Quantity to Order
          </label>
          
          <div className="order-quantity-controls">
            <button className="order-qty-btn" onClick={decrement}>
              <i className="fas fa-minus"></i>
            </button>
            <input
              ref={inputRef}
              type="number"
              className="order-qty-input"
              value={quantity}
              onChange={handleQuantityChange}
              min="0"
              step="1"
            />
            <button className="order-qty-btn" onClick={increment}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          <div className="order-quick-qty">
            <span className="order-quick-label">Quick select:</span>
            {quickQuantities.map((qty) => (
              <button
                key={qty}
                className={`order-quick-btn ${quantity === qty ? 'active' : ''}`}
                onClick={() => setQuantity(qty)}
              >
                {qty}
              </button>
            ))}
          </div>

          <div className="order-estimated">
            <span className="order-estimated-label">🛒 Estimated total:</span>
            <span className="order-estimated-value">
              {quantity} units × ~LKR {product.costPrice || 100} = 
              <strong> LKR {(quantity * (product.costPrice || 100)).toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="order-reason-section">
          <label className="order-reason-label">
            <i className="fas fa-pen"></i>
            Order Reason
          </label>
          <select 
            className="order-reason-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="Low Stock">📉 Low Stock</option>
            <option value="Near Expiry">⏰ Near Expiry</option>
            <option value="Seasonal Demand">📈 Seasonal Demand</option>
            <option value="Promotion">🎉 Promotion</option>
            <option value="Supplier Discount">💰 Supplier Discount</option>
            <option value="Regular Replenishment">🔄 Regular Replenishment</option>
            <option value="Other">📝 Other</option>
          </select>
        </div>

        {/* Footer */}
        <div className="order-modal-footer">
          <button className="order-btn-cancel" onClick={onCancel}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button className="order-btn-confirm" onClick={handleConfirm}>
            <i className="fas fa-check"></i> 
            Place Order ({quantity} units)
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderModal;