import { useState } from 'react'
import './Pages.css'

function Suppliers({ inventory, onUpdateInventory, showToast }) {
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Group products by supplier
  const supplierGroups = inventory.reduce((groups, product) => {
    const supplier = product.supplier
    if (!groups[supplier]) {
      groups[supplier] = {
        name: supplier,
        contact: product.supplierContact,
        email: product.supplierEmail,
        products: [],
        totalValue: 0,
        totalItems: 0
      }
    }
    groups[supplier].products.push(product)
    groups[supplier].totalValue += product.costPrice * product.stock
    groups[supplier].totalItems += product.stock
    return groups
  }, {})

  const handleReturnToSupplier = (product) => {
    setSelectedProduct(product)
    setShowReturnModal(true)
  }

  const confirmReturn = (quantity, reason) => {
    if (selectedProduct) {
      if (quantity >= selectedProduct.stock) {
        // Remove entire product
        const updatedInventory = inventory.filter(item => item.id !== selectedProduct.id)
        onUpdateInventory(updatedInventory)
        showToast(`📦 Return request sent to ${selectedProduct.supplier} for ${selectedProduct.name}`)
      } else {
        // Reduce quantity
        const updatedInventory = inventory.map(item =>
          item.id === selectedProduct.id 
            ? { ...item, stock: item.stock - quantity }
            : item
        )
        onUpdateInventory(updatedInventory)
        showToast(`📦 Returned ${quantity} units of ${selectedProduct.name} to supplier`)
      }
    }
    setShowReturnModal(false)
    setSelectedProduct(null)
  }

  const getSupplierStats = () => {
    const stats = {
      totalSuppliers: Object.keys(supplierGroups).length,
      totalInventoryValue: Object.values(supplierGroups).reduce((sum, s) => sum + s.totalValue, 0),
      expiringItems: inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length,
      returnableItems: inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length
    }
    return stats
  }

  const stats = getSupplierStats()

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-truck"></i> Supplier Tracking
          </h1>
          <p className="page-description">Manage supplier relationships, track batches, and process returns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-inline">
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-building"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalSuppliers}</span>
            <span className="stat-label">Active Suppliers</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-rupee-sign"></i></div>
          <div className="stat-info">
            <span className="stat-number">LKR {stats.totalInventoryValue.toLocaleString()}</span>
            <span className="stat-label">Total Inventory Value</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.expiringItems}</span>
            <span className="stat-label">Items Near Expiry</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-undo-alt"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.returnableItems}</span>
            <span className="stat-label">Returnable Items</span>
          </div>
        </div>
      </div>

      {/* Supplier List */}
      <div className="suppliers-container">
        {Object.values(supplierGroups).map((supplier) => (
          <div key={supplier.name} className="supplier-card">
            <div className="supplier-card-header" onClick={() => setSelectedSupplier(selectedSupplier === supplier.name ? null : supplier.name)}>
              <div className="supplier-info">
                <i className="fas fa-building"></i>
                <div>
                  <h3>{supplier.name}</h3>
                  <p className="supplier-contact-details">
                    <i className="fas fa-phone"></i> {supplier.contact} &nbsp;|&nbsp;
                    <i className="fas fa-envelope"></i> {supplier.email}
                  </p>
                </div>
              </div>
              <div className="supplier-stats">
                <span className="supplier-badge">{supplier.products.length} Products</span>
                <span className="supplier-badge">{supplier.totalItems} Units</span>
                <span className="supplier-value">LKR {supplier.totalValue.toLocaleString()}</span>
                <i className={`fas fa-chevron-${selectedSupplier === supplier.name ? 'up' : 'down'}`}></i>
              </div>
            </div>
            
            {selectedSupplier === supplier.name && (
              <div className="supplier-products">
                <table className="supplier-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Batch</th>
                      <th>Stock</th>
                      <th>Expiry Date</th>
                      <th>Days Left</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.products.map(product => (
                      <tr key={product.id} className={product.daysLeft <= 0 ? 'row-expired' : product.daysLeft <= 3 ? 'row-critical' : product.daysLeft <= 7 ? 'row-warning' : ''}>
                        <td><strong>{product.name}</strong></td>
                        <td><code>{product.batch}</code></td>
                        <td>{product.stock} units</td>
                        <td>{product.expiryDate}</td>
                        <td>{product.daysLeft > 0 ? `${product.daysLeft} days` : 'Expired'}</td>
                        <td>
                          <span className={`status-badge ${product.daysLeft <= 0 ? 'expired' : product.daysLeft <= 3 ? 'critical' : product.daysLeft <= 7 ? 'warning' : 'good'}`}>
                            {product.daysLeft <= 0 ? 'Expired' : product.daysLeft <= 3 ? 'Critical' : product.daysLeft <= 7 ? 'Near Expiry' : 'Good'}
                          </span>
                        </td>
                        <td>
                          {(product.daysLeft <= 7 && product.daysLeft > 0) && (
                            <button className="btn-return" onClick={() => handleReturnToSupplier(product)}>
                              <i className="fas fa-undo-alt"></i> Return
                            </button>
                          )}
                          {product.daysLeft <= 0 && (
                            <button className="btn-dispose" onClick={() => handleReturnToSupplier(product)}>
                              <i className="fas fa-trash"></i> Dispose
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedProduct && (
        <ReturnModal 
          product={selectedProduct}
          onConfirm={confirmReturn}
          onClose={() => {
            setShowReturnModal(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}

// Return Modal Component
function ReturnModal({ product, onConfirm, onClose }) {
  const [quantity, setQuantity] = useState(product.stock)
  const [reason, setReason] = useState('Near Expiry')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Return to Supplier</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-content">
          <div className="return-details">
            <p><strong>Product:</strong> {product.name}</p>
            <p><strong>Batch:</strong> {product.batch}</p>
            <p><strong>Supplier:</strong> {product.supplier}</p>
            <p><strong>Contact:</strong> {product.supplierContact}</p>
          </div>
          <div className="form-group">
            <label>Quantity to return</label>
            <input 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value), product.stock))}
              max={product.stock}
              min={1}
            />
          </div>
          <div className="form-group">
            <label>Reason for return</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>Near Expiry</option>
              <option>Damaged Goods</option>
              <option>Quality Issue</option>
              <option>Overstock</option>
              <option>Wrong Product</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={() => onConfirm(quantity, reason)}>Process Return</button>
        </div>
      </div>
    </div>
  )
}

export default Suppliers