// src/pages/Inventory.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BarcodeScanner from '../components/AdvancedBarcodeScanner'
import OCRScanner from '../components/AdvancedOCRScanner'
import ProductNameModal from '../components/ProductNameModal'
import SupplierPromptModal from '../components/SupplierPromptModal'
import AlertBar from '../components/AlertDropdown'
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
  const [actionLoading, setActionLoading] = useState(null)

  // ✅ Product Name Modal States
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [namePromptConfig, setNamePromptConfig] = useState({ 
    title: '', 
    message: '', 
    defaultValue: '' 
  });
  const [namePromptResolve, setNamePromptResolve] = useState(null);

  // ✅ Supplier Prompt Modal States
  const [showSupplierPrompt, setShowSupplierPrompt] = useState(false);
  const [supplierPromptConfig, setSupplierPromptConfig] = useState({
    title: '',
    message: '',
    suppliers: [],
    defaultSupplier: ''
  });
  const [supplierPromptResolve, setSupplierPromptResolve] = useState(null);

  // ✅ Load suppliers from BACKEND
  useEffect(() => {
    const loadSuppliers = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`https://accustom-alias-altitude.grork-free.dev/api/suppliers/${user.uid}`);
        const data = await response.json();
        if (data && data.list) {
          setSuppliers(data.list);
          localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(data.list));
        }
      } catch (error) {
        console.error('Failed to load suppliers:', error);
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

  // ✅ Refresh inventory from backend
  const refreshData = async () => {
    if (refreshInventory) {
      setLoading(true);
      try {
        await refreshInventory();
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

  // ✅ Product Name Prompt Function
  const showProductNamePrompt = (title, message, defaultValue) => {
    return new Promise((resolve) => {
      setNamePromptConfig({ title, message, defaultValue: defaultValue || '' });
      setNamePromptResolve(() => resolve);
      setShowNamePrompt(true);
    });
  };

  const handleNameConfirm = (value) => {
    setShowNamePrompt(false);
    if (namePromptResolve) {
      namePromptResolve(value);
      setNamePromptResolve(null);
    }
  };

  const handleNameCancel = () => {
    setShowNamePrompt(false);
    if (namePromptResolve) {
      namePromptResolve(null);
      setNamePromptResolve(null);
    }
  };

  // ✅ Supplier Prompt Function
  const showSupplierPromptFn = (title, message, supplierList, defaultSupplier) => {
    return new Promise((resolve) => {
      setSupplierPromptConfig({ 
        title, 
        message, 
        suppliers: supplierList || [], 
        defaultSupplier: defaultSupplier || '' 
      });
      setSupplierPromptResolve(() => resolve);
      setShowSupplierPrompt(true);
    });
  };

  const handleSupplierConfirm = (value) => {
    setShowSupplierPrompt(false);
    if (supplierPromptResolve) {
      supplierPromptResolve(value);
      setSupplierPromptResolve(null);
    }
  };

  const handleSupplierCancel = () => {
    setShowSupplierPrompt(false);
    if (supplierPromptResolve) {
      supplierPromptResolve(null);
      setSupplierPromptResolve(null);
    }
  };

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

  // ============================================================
  // ✅ SMART ACTIONS - DATABASE SAVE + AUTO REFRESH
  // ============================================================

  // 🔥 Flash Sale
  const handleFlashSale = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    let discount = '30% OFF';
    let saleType = 'Flash Sale';
    let discountMultiplier = 0.7;
    
    if (product.daysLeft <= 1) {
      discount = '50% OFF';
      saleType = 'Buy 1 Get 1 Free';
      discountMultiplier = 0.5;
    } else if (product.daysLeft <= 2) {
      discount = '40% OFF';
      saleType = 'Flash Sale';
      discountMultiplier = 0.6;
    } else if (product.daysLeft <= 7) {
      discount = '30% OFF';
      saleType = 'Flash Sale';
      discountMultiplier = 0.7;
    }
    
    if (!window.confirm(`Apply ${discount} ${saleType} to "${product.name}"?`)) return;
    
    setActionLoading(productId);
    
    try {
      const newPrice = Math.round(product.sellingPrice * discountMultiplier);
      const updates = {
        sellingPrice: newPrice,
        suggestion: `🔥 ${saleType} ACTIVE - ${discount}`,
        flashSaleActive: true,
        flashSaleDiscount: discount,
        flashSaleAppliedAt: new Date().toISOString()
      };
      
      const result = await api.updateProduct(user.uid, productId, updates);
      
      if (result.success) {
        showToast(`🔥 ${saleType} applied to ${product.name}! New price: LKR ${newPrice}`);
        await refreshData();
      } else {
        showToast(`❌ Failed to apply flash sale: ${result.error}`);
      }
    } catch (error) {
      console.error('Flash sale error:', error);
      showToast(`❌ ${error.message || 'Failed to apply flash sale'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 📦 Order Now (Low Stock)
  const handleOrderNow = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    
    const orderQuantity = window.prompt(
      `📦 Order more stock for "${product.name}"\nCurrent stock: ${product.stock}\nLow stock threshold: ${product.lowStockThreshold}\n\nEnter quantity to order:`,
      product.lowStockThreshold + 10
    );
    
    if (orderQuantity === null) return;
    
    const qty = parseInt(orderQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('❌ Invalid quantity');
      return;
    }
    
    if (!window.confirm(`📦 Place order for ${qty} units of "${product.name}" from ${product.supplier}?`)) return;
    
    setActionLoading(productId);
    
    try {
      const newStock = product.stock + qty;
      const updates = {
        stock: newStock,
        suggestion: `📦 Order placed on ${new Date().toLocaleDateString()} (${qty} units)`,
        lastOrderDate: new Date().toISOString(),
        lastOrderQuantity: qty
      };
      
      const result = await api.updateProduct(user.uid, productId, updates);
      
      if (result.success) {
        showToast(`📦 Order placed for ${qty} units of ${product.name}! New stock: ${newStock}`);
        await refreshData();
      } else {
        showToast(`❌ Failed to place order: ${result.error}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      showToast(`❌ ${error.message || 'Failed to place order'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 🚚 Return to Supplier
  const handleReturnToSupplier = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    
    const returnQty = window.prompt(
      `🚚 Return "${product.name}" to ${product.supplier}\nCurrent stock: ${product.stock}\n\nEnter quantity to return (or 0 to cancel):`,
      product.stock
    );
    
    if (returnQty === null) return;
    
    const qty = parseInt(returnQty);
    if (isNaN(qty) || qty < 0) {
      showToast('❌ Invalid quantity');
      return;
    }
    
    if (qty === 0) {
      showToast('Return cancelled');
      return;
    }
    
    if (qty > product.stock) {
      showToast(`❌ Cannot return more than available stock (${product.stock})`);
      return;
    }
    
    const reason = window.prompt('Reason for return:', 'Near Expiry');
    if (reason === null) return;
    
    if (!window.confirm(`🚚 Return ${qty} units of "${product.name}" to ${product.supplier}?\nReason: ${reason || 'Not specified'}`)) return;
    
    setActionLoading(productId);
    
    try {
      const newStock = product.stock - qty;
      
      const updates = {
        stock: newStock,
        suggestion: `🚚 Returned ${qty} units to supplier on ${new Date().toLocaleDateString()} (${reason || 'No reason'})`,
        lastReturnDate: new Date().toISOString(),
        lastReturnQuantity: qty,
        lastReturnReason: reason || 'Not specified'
      };
      
      if (newStock === 0) {
        updates.status = 'out_of_stock';
        updates.suggestion = `🚚 All units returned to supplier. Reason: ${reason || 'Near expiry'}`;
      }
      
      const result = await api.updateProduct(user.uid, productId, updates);
      
      if (result.success) {
        showToast(`🚚 ${qty} units of ${product.name} returned to ${product.supplier}! Remaining stock: ${newStock}`);
        await refreshData();
      } else {
        showToast(`❌ Failed to return: ${result.error}`);
      }
    } catch (error) {
      console.error('Return error:', error);
      showToast(`❌ ${error.message || 'Failed to return product'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 🗑️ Quick Delete
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

  // ============================================================
  // END OF SMART ACTIONS
  // ============================================================

  // Handle Add Product
  const handleAddProduct = async (productData) => {
    let productName = productData.name;
    if (!productName || productName.startsWith('Product ') || productName === 'OCR Product') {
      const result = await showProductNamePrompt(
        'Add Product',
        'Enter a name for this product',
        productData.name || 'New Product'
      );
      
      if (!result || result.trim().length < 2) {
        showToast('❌ Product name is required (min 2 characters)');
        return;
      }
      productName = result.trim();
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

    let supplierName = productData.supplier || 'Manual Entry';
    
    if (!preSelectedSupplier && supplierName !== 'Manual Entry' && supplierName !== 'OCR Scanned') {
      const supplierList = suppliers.map(s => s.name);
      const selected = await showSupplierPromptFn(
        'Select or Add Supplier',
        'Choose an existing supplier or type a new one',
        supplierList,
        supplierName
      );
      
      if (selected && selected.trim()) {
        supplierName = selected.trim();
      } else {
        supplierName = 'Manual Entry';
      }
    } else if (preSelectedSupplier) {
      supplierName = preSelectedSupplier;
    }

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
      sellingPrice: productData.sellingPrice || 150,
      flashSaleActive: false
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
      
      const productName = await showProductNamePrompt(
        'Add Product',
        'Enter a name for this product',
        defaultName
      );

      if (!productName || productName.trim().length < 2) {
        showToast('❌ Product name is required');
        setShowScanner(false);
        setScanType(null);
        return;
      }
      
      let supplierName = preSelectedSupplier || 'Manual Entry';
      
      if (!preSelectedSupplier) {
        const supplierList = suppliers.map(s => s.name);
        const selected = await showSupplierPromptFn(
          'Select or Add Supplier',
          'Choose an existing supplier or type a new one',
          supplierList,
          supplierName
        );
        
        if (selected && selected.trim()) {
          supplierName = selected.trim();
        } else {
          supplierName = 'Manual Entry';
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
        const productName = await showProductNamePrompt(
          'Add Product (OCR)',
          'We detected an expiry date. Please enter the product name.',
          'OCR Product'
        );

        if (!productName || productName.trim().length < 2) {
          showToast('❌ Product name is required');
          setShowScanner(false);
          setScanType(null);
          return;
        }
        
        let supplierName = 'OCR Scanned';
        const supplierList = suppliers.map(s => s.name);
        const selected = await showSupplierPromptFn(
          'Select or Add Supplier (OCR)',
          'Choose an existing supplier or type a new one',
          supplierList,
          'OCR Scanned'
        );
        
        if (selected && selected.trim()) {
          supplierName = selected.trim();
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
      {/* Page Header */}
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

      {/* ✅ ALERT BAR - Low Stock & Near Expiry Items */}
      <AlertBar 
        inventory={inventory}
        onFlashSale={handleFlashSale}
        onOrderNow={handleOrderNow}
        actionLoading={actionLoading}
      />

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

      {/* ============================================================
          INVENTORY TABLE - IMPROVED DESIGN
          ============================================================ */}
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch</th>
              <th>Supplier</th>
              <th>Stock</th>
              <th>Expiry</th>
              <th>Status</th>
              <th style={{ textAlign: 'center', minWidth: '240px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => {
              // Determine row class
              let rowClass = 'row-good';
              if (item.daysLeft <= 0) rowClass = 'row-expired';
              else if (item.daysLeft <= 3) rowClass = 'row-critical';
              else if (item.daysLeft <= 7) rowClass = 'row-warning';

              // Stock badge
              let stockClass = '';
              let stockDisplay = `${item.stock} units`;
              if (item.stock <= 0) {
                stockClass = 'out';
                stockDisplay = 'Out of Stock';
              } else if (item.stock <= item.lowStockThreshold) {
                stockClass = 'low';
              }

              // Days left display
              let daysClass = 'good';
              let daysDisplay = `${item.daysLeft} days`;
              if (item.daysLeft <= 0) {
                daysClass = 'expired';
                daysDisplay = 'Expired';
              } else if (item.daysLeft <= 3) {
                daysClass = 'critical';
              } else if (item.daysLeft <= 7) {
                daysClass = 'warning';
              }

              // Status badge
              let statusClass = 'good';
              let statusText = 'Healthy';
              if (item.daysLeft <= 0) {
                statusClass = 'expired';
                statusText = 'Expired';
              } else if (item.daysLeft <= 3) {
                statusClass = 'critical';
                statusText = '⚠️ Critical';
              } else if (item.daysLeft <= 7) {
                statusClass = 'warning';
                statusText = '⚠️ Near Expiry';
              }

              return (
                <tr key={item.id} className={rowClass}>
                  <td>
                    <span className="product-name">{item.name}</span>
                    
                    {/* 🔥 Flash Sale Discount Badge */}
                    {item.flashSaleActive && item.flashSaleDiscount && (
                      <span 
                        className="discount-badge"
                        data-discount={item.flashSaleDiscount}
                      >
                        🔥 {item.flashSaleDiscount}
                      </span>
                    )}
                    
                    {/* ⚠️ Low Stock Badge */}
                    {item.stock <= item.lowStockThreshold && item.stock > 0 && (
                      <span className="low-stock-badge">
                        ⚠️ Low Stock
                      </span>
                    )}
                  </td>
                  
                  <td>
                    <code className="batch-code">{item.batch}</code>
                  </td>
                  <td>
                    <span 
                      className="supplier-link"
                      onClick={() => handleSupplierClick(item.supplier)}
                    >
                      {item.supplier}
                    </span>
                  </td>
                  <td>
                    <span className={`stock-badge ${stockClass}`}>
                      {stockDisplay}
                    </span>
                  </td>
                  <td>
                    <span className={`days-left ${daysClass}`}>
                      {daysDisplay}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass}`}>
                      {statusText}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {/* 🔥 Flash Sale - Only for near expiry (1-7 days) */}
                      {item.daysLeft > 0 && item.daysLeft <= 7 && (
                        <button 
                          className="action-btn flash" 
                          onClick={() => handleFlashSale(item.id)}
                          disabled={actionLoading === item.id}
                          title="Apply flash sale discount"
                        >
                          {actionLoading === item.id ? (
                            <i className="fas fa-spinner fa-pulse"></i>
                          ) : (
                            <i className="fas fa-tags"></i>
                          )}
                          Flash
                        </button>
                      )}

                      {/* 📦 Order Now - Only for low stock */}
                      {item.stock <= item.lowStockThreshold && item.stock > 0 && (
                        <button 
                          className="action-btn order" 
                          onClick={() => handleOrderNow(item.id)}
                          disabled={actionLoading === item.id}
                          title="Order more stock"
                        >
                          {actionLoading === item.id ? (
                            <i className="fas fa-spinner fa-pulse"></i>
                          ) : (
                            <i className="fas fa-shopping-cart"></i>
                          )}
                          Order
                        </button>
                      )}

                      {/* 🚚 Return - For near expiry or expired */}
                      {item.daysLeft <= 7 && (
                        <button 
                          className="action-btn return" 
                          onClick={() => handleReturnToSupplier(item.id)}
                          disabled={actionLoading === item.id}
                          title="Return to supplier"
                        >
                          {actionLoading === item.id ? (
                            <i className="fas fa-spinner fa-pulse"></i>
                          ) : (
                            <i className="fas fa-undo-alt"></i>
                          )}
                          Return
                        </button>
                      )}

                      {/* ✏️ Edit - Always visible */}
                      <button 
                        className="action-btn edit" 
                        onClick={() => {
                          setSelectedProduct(item);
                          setShowEditModal(true);
                        }}
                        title="Edit product"
                      >
                        <i className="fas fa-edit"></i>
                      </button>

                      {/* 🗑️ Delete - Always visible */}
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDeleteProduct(item.id)}
                        disabled={actionLoading === item.id}
                        title="Delete product"
                      >
                        {actionLoading === item.id ? (
                          <i className="fas fa-spinner fa-pulse"></i>
                        ) : (
                          <i className="fas fa-trash"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredInventory.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-box-open"></i>
            <p>No products found</p>
            {canAdd ? (
              <button className="btn-primary" onClick={() => setShowScanner(true)}>
                Add your first product
              </button>
            ) : (
              <button className="btn-primary" onClick={() => window.location.href = '/billing'}>
                Upgrade to Add Products
              </button>
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

      {/* Product Name Modal */}
      <ProductNameModal
        isOpen={showNamePrompt}
        title={namePromptConfig.title}
        message={namePromptConfig.message}
        defaultValue={namePromptConfig.defaultValue}
        onConfirm={handleNameConfirm}
        onCancel={handleNameCancel}
      />

      {/* Supplier Prompt Modal */}
      <SupplierPromptModal
        isOpen={showSupplierPrompt}
        title={supplierPromptConfig.title}
        message={supplierPromptConfig.message}
        suppliers={supplierPromptConfig.suppliers}
        defaultSupplier={supplierPromptConfig.defaultSupplier}
        onConfirm={handleSupplierConfirm}
        onCancel={handleSupplierCancel}
      />
    </div>
  );
}

export default Inventory;