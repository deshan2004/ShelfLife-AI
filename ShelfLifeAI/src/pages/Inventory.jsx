import { useState } from 'react'
import BarcodeScanner from '../components/AdvancedBarcodeScanner'
import OCRScanner from '../components/AdvancedOCRScanner'
import './Pages.css'

function Inventory({ inventory, onUpdateInventory, showToast }) {
  const [showScanner, setShowScanner] = useState(false)
  const [scanType, setScanType] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                          (filterStatus === 'expiring' && item.daysLeft <= 7 && item.daysLeft > 0) ||
                          (filterStatus === 'critical' && item.daysLeft <= 3 && item.daysLeft > 0) ||
                          (filterStatus === 'expired' && item.daysLeft <= 0) ||
                          (filterStatus === 'healthy' && item.daysLeft > 7)
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0),
    expiringValue: inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0)
      .reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0),
    lowStockCount: inventory.filter(i => i.stock <= i.lowStockThreshold).length
  }

  const handleAddProduct = (productData) => {
    const newId = Math.max(...inventory.map(i => i.id), 0) + 1
    const daysLeft = Math.ceil((new Date(productData.expiryDate || new Date(Date.now() + 30 * 86400000)) - new Date()) / (1000 * 60 * 60 * 24))
    
    const newProduct = {
      id: newId,
      name: productData.name || 'New Product',
      batch: productData.batch || `B${String(newId).padStart(3, '0')}`,
      batchDate: new Date().toISOString().split('T')[0],
      supplier: productData.supplier || 'Manual Entry',
      supplierContact: productData.supplierContact || 'N/A',
      supplierEmail: productData.supplierEmail || 'N/A',
      expiryDate: productData.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      daysLeft: daysLeft,
      status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good',
      suggestion: daysLeft <= 7 ? 'Monitor closely' : 'Normal Stock',
      stock: productData.stock || 1,
      lowStockThreshold: 10,
      costPrice: productData.costPrice || 100,
      sellingPrice: productData.sellingPrice || 150
    }
    
    onUpdateInventory([...inventory, newProduct])
    showToast(`✅ ${newProduct.name} added to inventory!`)
  }

  const handleUpdateProduct = (updatedProduct) => {
    const updatedInventory = inventory.map(item => 
      item.id === updatedProduct.id ? updatedProduct : item
    )
    onUpdateInventory(updatedInventory)
    showToast(`✏️ ${updatedProduct.name} updated successfully`)
    setShowEditModal(false)
    setSelectedProduct(null)
  }

  const handleDeleteProduct = (product) => {
    if (window.confirm(`Delete ${product.name} from inventory? This action cannot be undone.`)) {
      const updatedInventory = inventory.filter(item => item.id !== product.id)
      onUpdateInventory(updatedInventory)
      showToast(`🗑️ ${product.name} removed from inventory`)
    }
  }

  const handleScan = (scanData) => {
    if (scanData.type === 'barcode') {
      const existingProduct = inventory.find(p => p.batch === scanData.value)
      if (existingProduct) {
        showToast(`📦 Product found: ${existingProduct.name} - Stock: ${existingProduct.stock}`)
        setSelectedProduct(existingProduct)
        setShowEditModal(true)
      } else {
        const productName = window.prompt('Enter product name:', 'New Product')
        if (productName) {
          handleAddProduct({
            name: productName,
            batch: scanData.value,
            supplier: 'Scanned Item'
          })
        }
      }
    } else if (scanData.type === 'ocr') {
      showToast(`📅 Expiry date detected: ${scanData.value}`)
      const expiringProducts = inventory.filter(p => p.daysLeft <= 14 && p.daysLeft > 0)
      if (expiringProducts.length > 0) {
        const productToUpdate = expiringProducts[0]
        if (window.confirm(`Update expiry for ${productToUpdate.name} to ${scanData.value}?`)) {
          const daysLeft = Math.ceil((new Date(scanData.value) - new Date()) / (1000 * 60 * 60 * 24))
          const updatedInventory = inventory.map(item => 
            item.id === productToUpdate.id ? { 
              ...item, 
              expiryDate: scanData.value,
              daysLeft: daysLeft,
              status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good'
            } : item
          )
          onUpdateInventory(updatedInventory)
          showToast(`✅ Expiry updated for ${productToUpdate.name}`)
        }
      }
    }
    setShowScanner(false)
    setScanType(null)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-boxes"></i> Inventory Management
          </h1>
          <p className="page-description">Manage your stock, track batches, and monitor expiry dates</p>
        </div>
        <button className="btn-primary-lg" onClick={() => setShowScanner(true)}>
          <i className="fas fa-plus"></i> Add Product
        </button>
      </div>

      <div className="stats-grid-inline">
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-box"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-rupee-sign"></i></div>
          <div className="stat-info">
            <span className="stat-number">LKR {stats.totalValue.toLocaleString()}</span>
            <span className="stat-label">Inventory Value</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-info">
            <span className="stat-number">LKR {stats.expiringValue.toLocaleString()}</span>
            <span className="stat-label">At Risk Value</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.lowStockCount}</span>
            <span className="stat-label">Low Stock Items</span>
          </div>
        </div>
      </div>

      {showScanner && !scanType && (
        <div className="scanner-section">
          <div className="scanner-tabs">
            <button className="scanner-tab" onClick={() => setScanType('barcode')}>
              <i className="fas fa-barcode"></i> Barcode Scanner
            </button>
            <button className="scanner-tab" onClick={() => setScanType('ocr')}>
              <i className="fas fa-eye"></i> OCR Scanner
            </button>
            <button className="scanner-close" onClick={() => setShowScanner(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="scanner-prompt">
            <p>Scan barcode or expiry date to add or update products</p>
          </div>
        </div>
      )}
      
      {scanType === 'barcode' && (
        <div className="scanner-section">
          <BarcodeScanner onScan={handleScan} onClose={() => setScanType(null)} />
        </div>
      )}
      
      {scanType === 'ocr' && (
        <div className="scanner-section">
          <OCRScanner onScan={handleScan} onClose={() => setScanType(null)} />
        </div>
      )}

      <div className="search-filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search by name, batch, or supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All</button>
          <button className={`filter-btn ${filterStatus === 'expiring' ? 'active' : ''}`} onClick={() => setFilterStatus('expiring')}>Expiring Soon</button>
          <button className={`filter-btn ${filterStatus === 'critical' ? 'active' : ''}`} onClick={() => setFilterStatus('critical')}>Critical</button>
          <button className={`filter-btn ${filterStatus === 'expired' ? 'active' : ''}`} onClick={() => setFilterStatus('expired')}>Expired</button>
          <button className={`filter-btn ${filterStatus === 'healthy' ? 'active' : ''}`} onClick={() => setFilterStatus('healthy')}>Healthy</button>
        </div>
      </div>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch</th>
              <th>Supplier</th>
              <th>Stock</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => (
              <tr key={item.id} className={item.daysLeft <= 0 ? 'row-expired' : item.daysLeft <= 3 ? 'row-critical' : item.daysLeft <= 7 ? 'row-warning' : ''}>
                <td><strong>{item.name}</strong></td>
                <td><code>{item.batch}</code></td>
                <td>{item.supplier}</td>
                <td>{item.stock} units</td>
                <td>{item.expiryDate}</td>
                <td>
                  <span className={`status-badge ${item.daysLeft <= 0 ? 'expired' : item.daysLeft <= 3 ? 'critical' : item.daysLeft <= 7 ? 'warning' : 'good'}`}>
                    {item.daysLeft <= 0 ? 'Expired' : `${item.daysLeft} days left`}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => {
                      setSelectedProduct(item)
                      setShowEditModal(true)
                    }}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteProduct(item)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInventory.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-box-open"></i>
            <p>No products found</p>
            <button className="btn-primary" onClick={() => setShowScanner(true)}>Add your first product</button>
          </div>
        )}
      </div>

      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={(e) => {
              e.preventDefault()
              const daysLeft = Math.ceil((new Date(selectedProduct.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
              handleUpdateProduct({
                ...selectedProduct,
                daysLeft: daysLeft,
                status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good'
              })
            }}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={selectedProduct.name} onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Batch Number</label>
                <input type="text" value={selectedProduct.batch} onChange={(e) => setSelectedProduct({...selectedProduct, batch: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input type="text" value={selectedProduct.supplier} onChange={(e) => setSelectedProduct({...selectedProduct, supplier: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" value={selectedProduct.stock} onChange={(e) => setSelectedProduct({...selectedProduct, stock: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input type="number" value={selectedProduct.lowStockThreshold} onChange={(e) => setSelectedProduct({...selectedProduct, lowStockThreshold: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cost Price (LKR)</label>
                  <input type="number" value={selectedProduct.costPrice} onChange={(e) => setSelectedProduct({...selectedProduct, costPrice: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>Selling Price (LKR)</label>
                  <input type="number" value={selectedProduct.sellingPrice} onChange={(e) => setSelectedProduct({...selectedProduct, sellingPrice: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input type="date" value={selectedProduct.expiryDate} onChange={(e) => setSelectedProduct({...selectedProduct, expiryDate: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory