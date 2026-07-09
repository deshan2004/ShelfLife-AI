// src/components/ProductNameModal.jsx
import { useState, useEffect, useRef } from 'react';
import './ProductNameModal.css';

function ProductNameModal({ isOpen, title, message, defaultValue, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue || '');
      // Auto-focus කරන්න
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, defaultValue]);

  // Enter එක එබුවොත් Confirm කරන්න
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(value.trim());
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="prompt-modal-overlay" onClick={onCancel}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="prompt-modal-header">
          <div className="prompt-icon">
            <i className="fas fa-box-open"></i>
          </div>
          <div>
            <h3>{title || 'Enter Product Name'}</h3>
            {message && <p>{message}</p>}
          </div>
        </div>

        {/* Body */}
        <div className="prompt-modal-body">
          <div className="prompt-input-wrapper">
            <i className="fas fa-tag"></i>
            <input
              ref={inputRef}
              type="text"
              className="prompt-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Fresh Milk, Yogurt, Bread..."
              autoFocus
            />
          </div>
          {value.length > 0 && (
            <span className="prompt-char-count">{value.length} characters</span>
          )}
        </div>

        {/* Footer */}
        <div className="prompt-modal-footer">
          <button className="prompt-btn-cancel" onClick={onCancel}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            className="prompt-btn-confirm" 
            onClick={() => onConfirm(value.trim())}
            disabled={!value.trim()}
          >
            <i className="fas fa-plus-circle"></i> Add Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductNameModal;