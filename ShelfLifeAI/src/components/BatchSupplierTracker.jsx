import { useState } from 'react'
import './BatchSupplierTracker.css'

function BatchSupplierTracker({ inventory, onReturnToSupplier }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)

  // Group products by supplier
  const supplierGroups = inventory.reduce((groups, product) => {
    const supplier = product.supplier
    if (!groups[supplier]) {
      groups[supplier] = []
    }
    groups[supplier].push(product)
    return groups
  }, {})

  const handleReturn = (product) => {
    setSelectedProduct(product)
    setShowReturnModal(true)
  }

  const confirmReturn = () => {
    if (onReturnToSupplier && selectedProduct) {
      onReturnToSupplier(selectedProduct.id)
    }
    setShowReturnModal(false)
    setSelectedProduct(null)
  }

  return (
    <div className="batch-tracker">
      <div className="tracker-header">
        <h2 className="section-title">
          <i className="fas fa-boxes"></i> Batch & Supplier Tracking
        </h2>
        <p className="tracker-subtitle">Manage batches, track suppliers, and handle returns</p>
      </div>

      {Object.entries(supplierGroups).map(([supplier, products]) => (
        <div key={supplier} className="supplier-group">
          <div className="supplier-header">
            <div className="supplier-info">
              <i className="fas fa-building"></i>
              <div>
                <h3>{supplier}</h3>
                <span className="supplier-contact">
                  {products[0]?.supplierContact} | {products[0]?.supplierEmail}
                </span>
              </div>
            </div>
            <div className="supplier-stats">
              <span className="batch-count">{products.length} batches</span>
              <span className="total-value">
                LKR {products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="batch-list">
            {products.map(product => (
              <div key={product.id} className={`batch-item ${product.daysLeft <= 7 ? 'warning' : ''} ${product.daysLeft <= 0 ? 'expired' : ''}`}>
                <div className="batch-info">
                  <div className="batch-name">
                    <strong>{product.name}</strong>
                    <span className="batch-code">Batch: {product.batch}</span>
                    <span className="batch-date">Manufactured: {product.batchDate}</span>
                  </div>
                  <div className="batch-details">
                    <span className="stock-info">
                      <i className="fas fa-box"></i> Stock: {product.stock} units
                    </span>
                    <span className="expiry-info">
                      <i className="fas fa-calendar"></i> Expires: {product.expiryDate}
                      <span className={`days-badge ${product.daysLeft <= 7 ? 'urgent' : ''}`}>
                        {product.daysLeft > 0 ? `${product.daysLeft} days left` : 'EXPIRED'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="batch-actions">
                  {product.daysLeft <= 7 && product.daysLeft > 0 && (
                    <button 
                      className="btn-return"
                      onClick={() => handleReturn(product)}
                    >
                      <i className="fas fa-undo-alt"></i> Return to Supplier
                    </button>
                  )}
                  {product.daysLeft <= 0 && (
                    <button 
                      className="btn-dispose"
                      onClick={() => handleReturn(product)}
                    >
                      <i className="fas fa-trash"></i> Dispose / Claim Credit
                    </button>
                  )}
                  <button className="btn-view-batch">
                    <i className="fas fa-chart-line"></i> History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Return Modal */}
      {showReturnModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="return-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Return to Supplier</h3>
            <div className="return-details">
              <p><strong>Product:</strong> {selectedProduct.name}</p>
              <p><strong>Batch:</strong> {selectedProduct.batch}</p>
              <p><strong>Supplier:</strong> {selectedProduct.supplier}</p>
              <p><strong>Contact:</strong> {selectedProduct.supplierContact}</p>
              <p><strong>Quantity to return:</strong></p>
              <input type="number" defaultValue={selectedProduct.stock} className="return-qty" />
              <p><strong>Reason for return:</strong></p>
              <select className="return-reason">
                <option>Near Expiry</option>
                <option>Damaged Goods</option>
                <option>Quality Issue</option>
                <option>Overstock</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button className="btn-confirm-return" onClick={confirmReturn}>Process Return</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchSupplierTracker