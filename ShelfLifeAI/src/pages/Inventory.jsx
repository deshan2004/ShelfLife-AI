// src/pages/Inventory.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BarcodeScanner from '../components/AdvancedBarcodeScanner'
import OCRScanner from '../components/AdvancedOCRScanner'
import { api } from '../services/apiService'
import './Pages.css'

function Inventory({ 
  inventory, 
  onUpdateInventory, 
  showToast, 
  user,
  refreshInventory 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showScanner, setShowScanner] = useState(false)
  const [scanType, setScanType] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSupplier, setFilterSupplier] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [preSelectedSupplier, setPreSelectedSupplier] = useState('')
  const [subscription, setSubscription] = useState(null)

  // ✅ Load suppliers from BACKEND (NOT localStorage first)
  useEffect(() => {
    const loadSuppliers = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`https://accustom-alias-altitude.grork-free.dev/api/suppliers/${user.uid}`);
        // const response = await fetch(`http://localhost:5000/api/suppliers/${user.uid}`);
        const data = await response.json();
        if (data && data.list) {
          setSuppliers(data.list);
          localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(data.list));
        }
      } catch (error) {
        console.error('Failed to load suppliers:', error);
        // Fallback to localStorage
        try {
          const localData = localStorage.getItem(`shelflife_suppliers_${user.uid}`);
          if (localData) {
            setSuppliers(JSON.parse(localData));
          }
        } catch (e) {}
      }
    };
    loadSuppliers();
  }, [user]);

  // ✅ Load subscription from backend
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`https://accustom-alias-altitude.grork-free.dev/api/subscription/${user.uid}`);
        // const response = await fetch(`http://localhost:5000/api/subscription/${user.uid}`);
        const data = await response.json();
        if (data && data.limits) {
          setSubscription(data);
          const userData = JSON.parse(localStorage.getItem('shelflife_user') || '{}');
          userData.subscription = data;
          localStorage.setItem('shelflife_user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Failed to load subscription:', error);
      }
    };
    loadSubscription();
  }, [user]);

  // Get pre-selected supplier from navigation state
  useEffect(() => {
    if (location.state?.supplier) {
      setPreSelectedSupplier(location.state.supplier);
      setShowScanner(true);
    }
  }, [location]);

  // ✅ Refresh inventory from backend (NOT localStorage)
  const refreshData = async () => {
    if (refreshInventory) {
      setLoading(true);
      try {
        await refreshInventory(); // This calls loadUserInventory from App.jsx
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Get product limit
  const getProductLimit = () => {
    if (subscription?.limits?.maxProducts) return subscription.limits.maxProducts;
    if (user?.subscription?.limits?.maxProducts) return user.subscription.limits.maxProducts;
    return 50;
  };

  const getPlanName = () => {
    if (subscription?.planId) return subscription.planId;
    if (user?.subscription?.planId) return user.subscription.planId;
    return 'FREE_TRIAL';
  };

  const productLimit = getProductLimit();
  const planName = getPlanName();
  const canAdd = inventory.length < productLimit;

  const uniqueSuppliers = [...new Set(inventory.map(item => item.supplier))].filter(Boolean);

  // ✅ Save supplier if not exists
  const saveSupplierIfNotExists = async (supplierName) => {
    if (!supplierName || supplierName === 'Manual Entry' || supplierName === 'OCR Scanned') {
      return;
    }
    
    const existingSupplier = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
    if (existingSupplier) {
      return existingSupplier;
    }
    
    try {
      const newSupplier = {
        name: supplierName,
        contact: '',
        email: '',
        address: '',
        rating: 0,
        notes: 'Auto-created from inventory'
      };
      
      const result = await api.addSupplier(user.uid, newSupplier);
      if (result.success) {
        console.log(`✅ Supplier "${supplierName}" auto-created from inventory`);
        setSuppliers(prev => [...prev, result.supplier]);
        const updatedSuppliers = [...suppliers, result.supplier];
        localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(updatedSuppliers));
        return result.supplier;
      }
    } catch (error) {
      console.error(`Failed to auto-create supplier "${supplierName}":`, error);
    }
    return null;
  };

  // Handle Add Product
  const handleAddProduct = async (productData) => {
    let productName = productData.name;
    if (!productName || productName.startsWith('Product ')) {
      productName = window.prompt('Enter product name:', productData.name || 'New Product');
      if (!productName) {
        showToast('❌ Product name is required');
        return;
      }
    }

    if (!productName || productName.trim().length < 2) {
      showToast('❌ Product name is required (min 2 characters)');
      return;
    }

    if (!canAdd) {
      showToast(`⚠️ Product limit reached (${inventory.length}/${productLimit}). Please upgrade.`);
      window.location.href = '/billing';
      return;
    }

    const supplierName = productData.supplier || 'Manual Entry';
    if (supplierName !== 'Manual Entry' && supplierName !== 'OCR Scanned') {
      await saveSupplierIfNotExists(supplierName);
    }

    const daysLeft = Math.ceil((new Date(productData.expiryDate || new Date(Date.now() + 30 * 86400000)) - new Date()) / (1000 * 60 * 60 * 24));
    
    const newProduct = {
      name: productName.trim(),
      batch: productData.batch || `B${String(Date.now()).slice(-6)}`,
      batchDate: new Date().toISOString().split('T')[0],
      supplier: supplierName,
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

    try {
      setAddingProduct(true);
      showToast(`📦 Adding ${newProduct.name}...`);
      
      const result = await api.addProduct(user.uid, newProduct);
      
      if (result.success) {
        await refreshData();
        showToast(`✅ ${newProduct.name} added to inventory!`);
        setScanType(null);
        setShowScanner(false);
        setPreSelectedSupplier('');
      } else {
        showToast(`❌ ${result.error || 'Failed to add product'}`);
      }
    } catch (error) {
      console.error('Add product error:', error);
      showToast(`❌ ${error.message || 'Failed to add product. Please try again.'}`);
    } finally {
      setAddingProduct(false);
    }
  };

  // Handle Scan
  const handleScan = async (scanData) => {
    console.log('📷 Scan data received:', scanData);
    
    if (scanData.type === 'barcode') {
      const existingProduct = inventory.find(p => p.batch === scanData.value);
      
      if (existingProduct) {
        showToast(`📦 Product found: ${existingProduct.name} - Stock: ${existingProduct.stock}`);
        setSelectedProduct(existingProduct);
        setShowEditModal(true);
        setShowScanner(false);
        setScanType(null);
        return;
      }
      
      const defaultName = scanData.productInfo?.name || `Product ${scanData.value.slice(-4)}`;
      const productName = window.prompt('Enter product name:', defaultName);
      
      if (!productName) {
        showToast('❌ Product name is required');
        setShowScanner(false);
        setScanType(null);
        return;
      }
      
      let supplierName = preSelectedSupplier || 'Manual Entry';
      
      if (suppliers.length > 0) {
        const supplierOptions = suppliers.map(s => s.name).join(', ');
        const supplierInput = window.prompt(
          `Enter supplier name (Available: ${supplierOptions})\nOr type new supplier name:`,
          supplierName
        );
        if (supplierInput && supplierInput.trim()) {
          supplierName = supplierInput.trim();
        }
      } else {
        const supplierInput = window.prompt('Enter supplier name (or leave blank for Manual Entry):', 'Manual Entry');
        if (supplierInput && supplierInput.trim()) {
          supplierName = supplierInput.trim();
        }
      }
      
      handleAddProduct({
        name: productName,
        batch: scanData.value,
        supplier: supplierName,
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        stock: 1,
        costPrice: 100,
        sellingPrice: 150
      });
      
      setShowScanner(false);
      setScanType(null);
      
    } else if (scanData.type === 'ocr') {
      showToast(`📅 Expiry date detected: ${scanData.value}`);
      
      const expiringProducts = inventory.filter(p => p.daysLeft <= 14 && p.daysLeft > 0);
      
      if (expiringProducts.length > 0) {
        const productToUpdate = expiringProducts[0];
        if (window.confirm(`Update expiry for ${productToUpdate.name} to ${scanData.value}?`)) {
          const daysLeft = Math.ceil((new Date(scanData.value) - new Date()) / (1000 * 60 * 60 * 24));
          const updatedProduct = { 
            ...productToUpdate, 
            expiryDate: scanData.value,
            daysLeft: daysLeft,
            status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good'
          };
          
          try {
            const result = await api.updateProduct(user.uid, productToUpdate.id, updatedProduct);
            if (result.success) {
              await refreshData();
              showToast(`✅ Expiry updated for ${productToUpdate.name}`);
            }
          } catch (error) {
            console.error('Update error:', error);
            showToast('❌ Failed to update product');
          }
        }
      } else {
        const productName = window.prompt('Enter product name:', 'OCR Product');
        if (!productName) {
          showToast('❌ Product name is required');
          setShowScanner(false);
          setScanType(null);
          return;
        }
        
        let supplierName = 'OCR Scanned';
        const supplierInput = window.prompt('Enter supplier name (or leave blank):', 'OCR Scanned');
        if (supplierInput && supplierInput.trim()) {
          supplierName = supplierInput.trim();
        }
        
        handleAddProduct({
          name: productName,
          batch: `OCR-${Date.now().toString().slice(-6)}`,
          supplier: supplierName,
          expiryDate: scanData.value,
          stock: 1,
          costPrice: 100,
          sellingPrice: 150
        });
      }
      
      setShowScanner(false);
      setScanType(null);
    }
  };

  // Handle Edit Product
  const handleEditProduct = async (updatedProduct) => {
    try {
      if (updatedProduct.supplier && updatedProduct.supplier !== 'Manual Entry' && updatedProduct.supplier !== 'OCR Scanned') {
        await saveSupplierIfNotExists(updatedProduct.supplier);
      }
      
      const result = await api.updateProduct(user.uid, updatedProduct.id, updatedProduct);
      if (result.success) {
        await refreshData();
        showToast(`✏️ ${updatedProduct.name} updated`);
        setShowEditModal(false);
        setSelectedProduct(null);
      } else {
        showToast('❌ Failed to update product');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('❌ Failed to update product');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (product && window.confirm(`Delete ${product.name} from inventory?`)) {
      try {
        const result = await api.deleteProduct(user.uid, productId);
        if (result.success) {
          await refreshData();
          showToast(`🗑️ ${product.name} removed from inventory`);
        }
      } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Failed to delete product');
      }
    }
  };

  // Handle Supplier Click
  const handleSupplierClick = (supplierName) => {
    navigate('/suppliers', { state: { supplier: supplierName } });
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                          (filterStatus === 'expiring' && item.daysLeft <= 7 && item.daysLeft > 0) ||
                          (filterStatus === 'critical' && item.daysLeft <= 3 && item.daysLeft > 0) ||
                          (filterStatus === 'expired' && item.daysLeft <= 0) ||
                          (filterStatus === 'healthy' && item.daysLeft > 7)
    const matchesSupplier = filterSupplier === 'all' || item.supplier === filterSupplier
    return matchesSearch && matchesFilter && matchesSupplier
  });

  const stats = {
    total: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0),
    expiringValue: inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0)
      .reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0),
    lowStockCount: inventory.filter(i => i.stock <= i.lowStockThreshold).length
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    );
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
        
        <div className="usage-indicator">
          <span className="usage-text">
            {inventory.length} / {productLimit} products used
          </span>
          <div className="usage-bar">
            <div 
              className="usage-bar-fill" 
              style={{ width: `${Math.min((inventory.length / productLimit) * 100, 100)}%` }}
            ></div>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            {planName === 'FREE_TRIAL' ? 'Free Trial' : 
             planName === 'PROFESSIONAL' ? 'Professional' : 
             planName === 'BASIC' ? 'Basic' : 
             planName === 'ENTERPRISE' ? 'Enterprise' : planName}
          </small>
        </div>
        
        <button 
          className="btn-primary-lg" 
          onClick={() => setShowScanner(true)} 
          disabled={addingProduct || !canAdd}
        >
          {addingProduct ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-plus"></i>}
          {addingProduct ? 'Adding...' : 'Add Product'}
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
            <button 
              className="scanner-tab" 
              onClick={() => setScanType('barcode')}
              disabled={!canAdd}
            >
              <i className="fas fa-barcode"></i> Barcode Scanner
            </button>
            <button 
              className="scanner-tab" 
              onClick={() => setScanType('ocr')}
              disabled={!canAdd}
              style={{ 
                background: canAdd ? 'linear-gradient(135deg, var(--green-deep), var(--green-neon))' : 'var(--bg-raised)',
                color: canAdd ? '#030a03' : 'var(--text-muted)'
              }}
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
            {preSelectedSupplier && (
              <p style={{ color: 'var(--green-neon)', fontWeight: 'bold' }}>
                📦 Adding product for: <strong>{preSelectedSupplier}</strong>
              </p>
            )}
            {!canAdd && (
              <p style={{ color: 'var(--red)', fontWeight: 'bold' }}>
                ⚠️ Product limit reached ({inventory.length}/{productLimit}). 
                <button 
                  onClick={() => window.location.href = '/billing'} 
                  style={{ background: 'var(--green-neon)', border: 'none', padding: '4px 12px', borderRadius: '20px', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#030a03' }}
                >
                  Upgrade Now
                </button>
              </p>
            )}
            {canAdd && (
              <small className="scan-limit-info">
                {productLimit - inventory.length} product slots remaining
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
      </div>

      <div className="filter-buttons" style={{ marginBottom: '1rem' }}>
        <button className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All</button>
        <button className={`filter-btn ${filterStatus === 'expiring' ? 'active' : ''}`} onClick={() => setFilterStatus('expiring')}>Expiring Soon</button>
        <button className={`filter-btn ${filterStatus === 'critical' ? 'active' : ''}`} onClick={() => setFilterStatus('critical')}>Critical</button>
        <button className={`filter-btn ${filterStatus === 'expired' ? 'active' : ''}`} onClick={() => setFilterStatus('expired')}>Expired</button>
        <button className={`filter-btn ${filterStatus === 'healthy' ? 'active' : ''}`} onClick={() => setFilterStatus('healthy')}>Healthy</button>
      </div>

      {uniqueSuppliers.length > 1 && (
        <div className="filter-buttons" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button className={`filter-btn ${filterSupplier === 'all' ? 'active' : ''}`} onClick={() => setFilterSupplier('all')}>
            <i className="fas fa-building"></i> All Suppliers
          </button>
          {uniqueSuppliers.map(supplier => (
            <button 
              key={supplier} 
              className={`filter-btn ${filterSupplier === supplier ? 'active' : ''}`} 
              onClick={() => setFilterSupplier(supplier)}
            >
              <i className="fas fa-truck"></i> {supplier}
            </button>
          ))}
        </div>
      )}

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
                <td>
                  <span 
                    style={{ 
                      cursor: 'pointer', 
                      color: 'var(--green-neon)',
                      textDecoration: 'underline',
                      textDecorationColor: 'rgba(57,231,95,0.3)'
                    }}
                    onClick={() => handleSupplierClick(item.supplier)}
                    title="Click to view supplier details"
                  >
                    {item.supplier}
                  </span>
                </td>
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
            {canAdd ? (
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