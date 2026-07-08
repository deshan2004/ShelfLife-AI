// src/pages/Inventory.jsx
import { useState } from 'react'
import BarcodeScanner from '../components/AdvancedBarcodeScanner'
import OCRScanner from '../components/AdvancedOCRScanner'
import SubscriptionGuard from '../components/subscription/SubscriptionGuard'
import { api } from '../services/apiService' // ✅ API Service import කරන්න
import './Pages.css'

function Inventory({ 
  inventory, 
  onUpdateInventory, 
  showToast, 
  features,
  usage,
  canAddProduct,
  onLimitReached,
  subscriptionStatus,
  isTrialActive,
  isTrialExpired,
  user  // ✅ user prop එක add කරන්න (UID එක සඳහා)
}) {
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

  // ============================================================
  // 🔥 UPDATED: handleAddProduct - දැන් Firebase API එක CALL කරනවා
  // ============================================================
  const handleAddProduct = async (productData) => {
    // Trial limits check
    if (!canAddProduct) {
      if (isTrialActive) {
        onLimitReached('products', usage.productsUsed, usage.productsLimit);
      } else if (isTrialExpired) {
        showToast('⚠️ Your free trial has ended. Please upgrade to add more products.');
        window.location.href = '/billing';
      }
      return;
    }

    // Generate new ID for local state
    const newId = Math.max(...inventory.map(i => i.id), 0) + 1;
    const daysLeft = Math.ceil((new Date(productData.expiryDate || new Date(Date.now() + 30 * 86400000)) - new Date()) / (1000 * 60 * 60 * 24));
    
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
    };

    // 🔥 1. API එක හරහා Firebase Firestore එකට Save කරන්න
    try {
      const result = await api.addProduct(user.uid, newProduct);
      if (result.success) {
        // 2. Local state එක update කරන්න (Server response එකෙන් product එක ගන්න)
        const addedProduct = result.product;
        const finalProduct = { ...newProduct, ...addedProduct };
        onUpdateInventory([...inventory, finalProduct]);
        showToast(`✅ ${finalProduct.name} added to inventory!`);
      } else {
        showToast(`❌ Failed to add product: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Add product error:', error);
      showToast('❌ Failed to add product. Please try again.');
    }
  };

  // ============================================================
  // 🔥 UPDATED: handleScan - Barcode / OCR Scan results handle කරනවා
  // ============================================================
  const handleScan = (scanData) => {
    if (scanData.type === 'barcode') {
      // Barcode එකෙන් product එක හොයන්න
      const existingProduct = inventory.find(p => p.batch === scanData.value);
      if (existingProduct) {
        showToast(`📦 Product found: ${existingProduct.name} - Stock: ${existingProduct.stock}`);
        setSelectedProduct(existingProduct);
        setShowEditModal(true);
      } else {
        // ✅ New Product - Auto Add කරන්න
        if (!canAddProduct && isTrialActive) {
          onLimitReached('products', usage.productsUsed, usage.productsLimit);
          setShowScanner(false);
          return;
        }
        
        const productName = window.prompt('Enter product name:', scanData.productInfo?.name || 'New Product');
        if (productName) {
          // 🔥 මෙතනින් handleAddProduct call වෙනවා -> API call යනවා
          handleAddProduct({
            name: productName,
            batch: scanData.value,
            supplier: scanData.productInfo?.brand || 'Scanned Item',
            expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            stock: 1,
            costPrice: 100,
            sellingPrice: 150
          });
        }
      }
    } else if (scanData.type === 'ocr') {
      // OCR - Expiry date detection
      showToast(`📅 Expiry date detected: ${scanData.value}`);
      const expiringProducts = inventory.filter(p => p.daysLeft <= 14 && p.daysLeft > 0);
      
      if (expiringProducts.length > 0) {
        // Existing product එකක expiry date එක update කරන්න
        const productToUpdate = expiringProducts[0];
        if (window.confirm(`Update expiry for ${productToUpdate.name} to ${scanData.value}?`)) {
          const daysLeft = Math.ceil((new Date(scanData.value) - new Date()) / (1000 * 60 * 60 * 24));
          const updatedInventory = inventory.map(item => 
            item.id === productToUpdate.id ? { 
              ...item, 
              expiryDate: scanData.value,
              daysLeft: daysLeft,
              status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good'
            } : item
          );
          onUpdateInventory(updatedInventory);
          showToast(`✅ Expiry updated for ${productToUpdate.name}`);
        }
      } else {
        // ✅ New Product - Scanned Expiry Date එකත් එක්ක Auto Add කරන්න
        const productName = window.prompt('Enter product name:', 'New Product');
        if (productName) {
          handleAddProduct({
            name: productName,
            batch: `OCR-${Date.now().toString().slice(-6)}`,
            supplier: 'OCR Scanned',
            expiryDate: scanData.value,
            stock: 1,
            costPrice: 100,
            sellingPrice: 150
          });
        }
      }
    }
    setShowScanner(false);
    setScanType(null);
  };

  // ============================================================
  // Edit Modal & Delete Functions (Local state update + API call optional)
  // ============================================================
  const handleEditProduct = (updatedProduct) => {
    const updatedInventory = inventory.map(item => 
      item.id === updatedProduct.id ? updatedProduct : item
    );
    onUpdateInventory(updatedInventory);
    showToast(`✏️ ${updatedProduct.name} updated`);
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (product && window.confirm(`Delete ${product.name} from inventory?`)) {
      const updatedInventory = inventory.filter(item => item.id !== productId);
      onUpdateInventory(updatedInventory);
      showToast(`🗑️ ${product.name} removed from inventory`);
    }
  };

  // ============================================================
  // UI RENDER (Unchanged)
  // ============================================================
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-boxes"></i> Inventory Management
          </h1>
          <p className="page-description">Manage your stock, track batches, and monitor expiry dates</p>
        </div>
        
        {isTrialActive && (
          <div className="usage-indicator">
            <span className="usage-text">
              {usage.productsUsed} / {usage.productsLimit} products used
            </span>
            <div className="usage-bar">
              <div 
                className="usage-bar-fill" 
                style={{ width: `${usage.productsPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <button className="btn-primary-lg" onClick={() => setShowScanner(true)}>
          <i className="fas fa-plus"></i> Add Product
        </button>
      </div>

      {/* Stats Cards */}
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

      {/* Scanner Selection */}
      {showScanner && !scanType && (
        <div className="scanner-section">
          <div className="scanner-tabs">
            <button className="scanner-tab" onClick={() => setScanType('barcode')}>
              <i className="fas fa-barcode"></i> Barcode Scanner
            </button>
            <button 
              className="scanner-tab" 
              onClick={() => setScanType('ocr')}
              style={{ background: 'linear-gradient(135deg, var(--green-deep), var(--green-neon))', color: '#030a03' }}
            >
              <i className="fas fa-eye"></i> OCR Scanner 
              <span style={{ fontSize: '0.7rem', background: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>BETA</span>
            </button>
            <button className="scanner-close" onClick={() => setShowScanner(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="scanner-prompt">
            <p>Scan barcode or expiry date to add or update products</p>
            {isTrialActive && (
              <small className="scan-limit-info">
                {usage.productsRemaining} product slots remaining in trial
              </small>
            )}
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

      {/* Search and Filter */}
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

      {/* Inventory Table */}
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
                      setSelectedProduct(item);
                      setShowEditModal(true);
                    }}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteProduct(item.id)}>
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
            {canAddProduct ? (
              <button className="btn-primary" onClick={() => setShowScanner(true)}>Add your first product</button>
            ) : (
              <button className="btn-primary" onClick={() => window.location.href = '/billing'}>Upgrade to Add Products</button>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={(e) => {
              e.preventDefault();
              handleEditProduct(selectedProduct);
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
  );
}

export default Inventory;