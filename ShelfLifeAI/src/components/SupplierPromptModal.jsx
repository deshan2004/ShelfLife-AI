// src/components/SupplierPromptModal.jsx
import { useState, useEffect, useRef } from 'react';
import './SupplierPromptModal.css';

function SupplierPromptModal({ 
  isOpen, 
  title, 
  message, 
  suppliers = [], 
  defaultSupplier = '',
  onConfirm, 
  onCancel 
}) {
  const [inputValue, setInputValue] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultSupplier || '');
      setSelectedSupplier(defaultSupplier || '');
      setIsCustom(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, defaultSupplier]);

  const handleSupplierSelect = (name) => {
    setSelectedSupplier(name);
    setInputValue(name);
    setIsCustom(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedSupplier(value);
    setIsCustom(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onConfirm(inputValue.trim());
      }
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="supplier-modal-overlay" onClick={onCancel}>
      <div className="supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="supplier-modal-header">
          <div className="supplier-modal-icon">
            <i className="fas fa-truck"></i>
          </div>
          <div>
            <h3>{title || 'Select or Add Supplier'}</h3>
            {message && <p>{message}</p>}
          </div>
        </div>

        <div className="supplier-modal-body">
          {/* Existing suppliers list */}
          {suppliers.length > 0 && (
            <div className="supplier-list">
              <label className="supplier-list-label">Existing Suppliers</label>
              <div className="supplier-buttons">
                {suppliers.map((supplier, index) => (
                  <button
                    key={index}
                    className={`supplier-btn ${selectedSupplier === supplier ? 'active' : ''}`}
                    onClick={() => handleSupplierSelect(supplier)}
                  >
                    <i className="fas fa-building"></i>
                    {supplier}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Or divider */}
          {suppliers.length > 0 && (
            <div className="supplier-divider">
              <span>or type new supplier</span>
            </div>
          )}

          {/* Input field */}
          <div className="supplier-input-wrapper">
            <i className="fas fa-pen"></i>
            <input
              ref={inputRef}
              type="text"
              className="supplier-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type supplier name..."
              autoFocus
            />
            {isCustom && inputValue && (
              <span className="supplier-badge-new">New</span>
            )}
          </div>
          {inputValue.length > 0 && (
            <span className="supplier-char-count">{inputValue.length} characters</span>
          )}
        </div>

        <div className="supplier-modal-footer">
          <button className="supplier-btn-cancel" onClick={onCancel}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            className="supplier-btn-confirm" 
            onClick={() => onConfirm(inputValue.trim())}
            disabled={!inputValue.trim()}
          >
            <i className="fas fa-check"></i> Select Supplier
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierPromptModal;