// src/components/SupplierNotificationModal.jsx
import { useState } from 'react';
import './SupplierNotificationModal.css';

function SupplierNotificationModal({ isOpen, product, supplier, onClose, onSend, isSending }) {
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('low_stock');

  if (!isOpen || !product) return null;

  const getDefaultMessage = () => {
    if (notificationType === 'low_stock') {
      return `Dear ${supplier},\n\nWe need to reorder ${product.name}. Current stock: ${product.stock} units (Threshold: ${product.lowStockThreshold || 10}).\n\nPlease send ${(product.lowStockThreshold || 10) - product.stock + 10} units urgently.\n\nThank you,\nShelfLife AI`;
    } else if (notificationType === 'near_expiry') {
      return `Dear ${supplier},\n\nProduct ${product.name} is nearing expiry (${product.daysLeft} days left).\nWe request you to arrange a return or exchange.\n\nThank you,\nShelfLife AI`;
    }
    return '';
  };

  return (
    <div className="supplier-notification-overlay" onClick={onClose}>
      <div className="supplier-notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <div className="notification-icon"><i className="fas fa-envelope"></i></div>
          <div>
            <h3>Notify Supplier</h3>
            <p>Send notification to {supplier}</p>
          </div>
          <button className="notification-close" onClick={onClose} disabled={isSending}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="notification-body">
          <div className="notification-type">
            <label>Notification Type</label>
            <select value={notificationType} onChange={(e) => setNotificationType(e.target.value)} disabled={isSending}>
              <option value="low_stock">📉 Low Stock</option>
              <option value="near_expiry">⏰ Near Expiry</option>
            </select>
          </div>

          <div className="notification-message">
            <label>Message</label>
            <textarea
              rows="6"
              value={message || getDefaultMessage()}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to supplier..."
              disabled={isSending}
            />
          </div>

          <div className="notification-product-info">
            <div className="info-row"><span>Product:</span><strong>{product.name}</strong></div>
            <div className="info-row"><span>Stock:</span><strong>{product.stock} units</strong></div>
            <div className="info-row"><span>Expiry:</span><strong>{product.expiryDate} ({product.daysLeft} days)</strong></div>
            <div className="info-row"><span>Supplier:</span><strong>{supplier}</strong></div>
          </div>
        </div>

        <div className="notification-footer">
          <button className="notification-btn-cancel" onClick={onClose} disabled={isSending}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            className="notification-btn-send" 
            onClick={() => onSend(message || getDefaultMessage())}
            disabled={isSending}
          >
            {isSending ? (
              <><i className="fas fa-spinner fa-pulse"></i> Sending...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> Send Notification</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierNotificationModal;