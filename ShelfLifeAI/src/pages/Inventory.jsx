// src/pages/Inventory.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BarcodeScanner from '../components/AdvancedBarcodeScanner'
import OCRScanner from '../components/AdvancedOCRScanner'
import ProductNameModal from '../components/ProductNameModal'
import SupplierPromptModal from '../components/SupplierPromptModal'
import AlertBar from '../components/AlertDropdown'
import OrderModal from '../components/OrderModal'
import SupplierNotificationModal from '../components/SupplierNotificationModal'
import { api } from '../services/apiService'
import './Pages.css'

// ============================================================
// ✅ FLASH CONFIRM MODAL - Inline Component
// ============================================================
function FlashConfirmModal({ isOpen, items, onConfirm, onCancel }) {
  if (!isOpen || !items || items.length === 0) return null;

  const tier1 = items.filter(i => i.daysLeft <= 1).length;
  const tier2 = items.filter(i => i.daysLeft === 2).length;
  const tier3 = items.filter(i => i.daysLeft >= 3 && i.daysLeft <= 7).length;

  const totalSavings = items.reduce((sum, i) => {
    let multiplier = 0.7;
    if (i.daysLeft <= 1) multiplier = 0.5;
    else if (i.daysLeft === 2) multiplier = 0.6;
    const discount = i.sellingPrice - Math.round(i.sellingPrice * multiplier);
    return sum + (discount * i.stock);
  }, 0);

  return (
    <div className="flash-confirm-overlay" onClick={onCancel}>
      <div className="flash-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flash-confirm-header">
          <div className="flash-confirm-icon"><i className="fas fa-bolt"></i></div>
          <div>
            <h3>🔥 Apply Flash Sales</h3>
            <p>{items.length} item{items.length > 1 ? 's' : ''} will be discounted</p>
          </div>
          <button className="flash-confirm-close" onClick={onCancel}><i className="fas fa-times"></i></button>
        </div>
        <div className="flash-confirm-summary">
          <div className="flash-confirm-stats">
            <div className="flash-stat"><span className="flash-stat-label">Total Items</span><span className="flash-stat-value">{items.length}</span></div>
            <div className="flash-stat"><span className="flash-stat-label">Potential Savings</span><span className="flash-stat-value highlight">LKR {totalSavings.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="flash-confirm-breakdown">
          <p className="flash-breakdown-label">📊 Discount Breakdown</p>
          <div className="flash-breakdown-grid">
            {tier1 > 0 && (<div className="flash-tier critical"><span className="flash-tier-label">🔴 1 day left</span><span className="flash-tier-discount">50% OFF</span><span className="flash-tier-count">{tier1} item{tier1 > 1 ? 's' : ''}</span></div>)}
            {tier2 > 0 && (<div className="flash-tier warning"><span className="flash-tier-label">🟠 2 days left</span><span className="flash-tier-discount">40% OFF</span><span className="flash-tier-count">{tier2} item{tier2 > 1 ? 's' : ''}</span></div>)}
            {tier3 > 0 && (<div className="flash-tier info"><span className="flash-tier-label">🟡 3-7 days left</span><span className="flash-tier-discount">30% OFF</span><span className="flash-tier-count">{tier3} item{tier3 > 1 ? 's' : ''}</span></div>)}
          </div>
        </div>
        <div className="flash-confirm-products">
          <p className="flash-products-label">📦 Affected Products</p>
          <div className="flash-products-list">
            {items.slice(0, 5).map((item, index) => {
              let discount = '30% OFF', color = '#f59e0b';
              if (item.daysLeft <= 1) { discount = '50% OFF'; color = '#ef4444'; }
              else if (item.daysLeft === 2) { discount = '40% OFF'; color = '#f97316'; }
              return (
                <div key={index} className="flash-product-item">
                  <span className="flash-product-name">{item.name}</span>
                  <span className="flash-product-stock">{item.stock} units</span>
                  <span className="flash-product-discount" style={{ background: color + '20', color: color }}>{discount}</span>
                </div>
              );
            })}
            {items.length > 5 && (<div className="flash-product-more">+ {items.length - 5} more items</div>)}
          </div>
        </div>
        <div className="flash-confirm-footer">
          <button className="flash-btn-cancel" onClick={onCancel}><i className="fas fa-times"></i> Cancel</button>
          <button className="flash-btn-confirm" onClick={onConfirm}><i className="fas fa-bolt"></i> Apply Flash Sales</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ✅ ORDER ALL CONFIRM MODAL - Inline Component
// ============================================================
function OrderAllConfirmModal({ isOpen, items, onConfirm, onCancel }) {
  if (!isOpen || !items || items.length === 0) return null;

  const totalCost = items.reduce((sum, item) => {
    const qty = (item.lowStockThreshold || 10) - item.stock + 10;
    return sum + (qty * (item.costPrice || 100));
  }, 0);
  const totalUnits = items.reduce((sum, item) => sum + (item.lowStockThreshold || 10) - item.stock + 10, 0);

  return (
    <div className="order-all-overlay" onClick={onCancel}>
      <div className="order-all-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-all-header">
          <div className="order-all-icon"><i className="fas fa-shopping-cart"></i></div>
          <div>
            <h3>📦 Order All Low Stock Items</h3>
            <p>{items.length} item{items.length > 1 ? 's' : ''} need restocking</p>
          </div>
          <button className="order-all-close" onClick={onCancel}><i className="fas fa-times"></i></button>
        </div>
        <div className="order-all-summary">
          <div className="order-all-stats">
            <div className="order-stat"><span className="order-stat-label">Total Items</span><span className="order-stat-value">{items.length}</span></div>
            <div className="order-stat"><span className="order-stat-label">Total Units</span><span className="order-stat-value">{totalUnits}</span></div>
            <div className="order-stat"><span className="order-stat-label">Est. Cost</span><span className="order-stat-value highlight">LKR {totalCost.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="order-all-products">
          <p className="order-products-label">📋 Items to Order</p>
          <div className="order-products-list">
            {items.map((item, index) => {
              const qty = (item.lowStockThreshold || 10) - item.stock + 10;
              const isCritical = item.stock <= 3;
              return (
                <div key={index} className={`order-product-item ${isCritical ? 'critical' : ''}`}>
                  <span className="order-product-name">{item.name}</span>
                  <span className="order-product-stock">{item.stock} <span className="order-product-threshold">/ {item.lowStockThreshold || 10}</span></span>
                  <span className="order-product-qty"><i className="fas fa-arrow-right"></i> +{qty}</span>
                  <span className="order-product-supplier"><i className="fas fa-truck"></i> {item.supplier}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="order-all-footer">
          <button className="order-all-btn-cancel" onClick={onCancel}><i className="fas fa-times"></i> Cancel</button>
          <button className="order-all-btn-confirm" onClick={onConfirm}><i className="fas fa-check"></i> Place All Orders</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN INVENTORY COMPONENT
// ============================================================
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
  const [filterSlow, setFilterSlow] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [preSelectedSupplier, setPreSelectedSupplier] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // ✅ Auto-Flash All State
  const [autoFlashing, setAutoFlashing] = useState(false);
  const [flashItems, setFlashItems] = useState([]);
  const [showFlashConfirm, setShowFlashConfirm] = useState(false);

  // ✅ Order All Low Stock State
  const [orderingLowStock, setOrderingLowStock] = useState(false);
  const [showOrderAllConfirm, setShowOrderAllConfirm] = useState(false);
  const [orderAllItems, setOrderAllItems] = useState([]);

  // ✅ Supplier Notification State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationProduct, setNotificationProduct] = useState(null);
  const [isNotificationSending, setIsNotificationSending] = useState(false);

  // ✅ Order Modal States
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProduct, setOrderProduct] = useState(null);

  // ✅ Bulk Actions States
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // ✅ Product Name Modal States
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [namePromptConfig, setNamePromptConfig] = useState({ title: '', message: '', defaultValue: '' });
  const [namePromptResolve, setNamePromptResolve] = useState(null);

  // ✅ Supplier Prompt Modal States
  const [showSupplierPrompt, setShowSupplierPrompt] = useState(false);
  const [supplierPromptConfig, setSupplierPromptConfig] = useState({ title: '', message: '', suppliers: [], defaultSupplier: '' });
  const [supplierPromptResolve, setSupplierPromptResolve] = useState(null);

  // ✅ Plan Name Display
  const [planNameDisplay, setPlanNameDisplay] = useState('Free Trial');
  const [productLimit, setProductLimit] = useState(50);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // ============================================================
  // LOAD DATA
  // ============================================================
  const loadSubscription = async () => {
    if (!user?.uid) { setIsLoadingSubscription(false); return; }
    try {
      const response = await fetch(`https://accustom-alias-altitude.grork-free.dev/api/subscription/${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const data = await response.json();
      if (data && data.planId) {
        setSubscription(data);
        let planName = data.planId;
        if (data.planId === 'FREE_TRIAL') planName = 'Free Trial';
        else if (data.planId === 'BASIC') planName = 'Basic';
        else if (data.planId === 'PROFESSIONAL') planName = 'Professional';
        else if (data.planId === 'ENTERPRISE') planName = 'Enterprise';
        setPlanNameDisplay(planName);
        const maxProducts = data.limits?.maxProducts;
        setProductLimit(maxProducts === Infinity ? Infinity : Number(maxProducts) || 50);
        const userData = JSON.parse(localStorage.getItem('shelflife_user') || '{}');
        userData.subscription = data;
        userData.planId = data.planId;
        userData.planName = planName;
        localStorage.setItem('shelflife_user', JSON.stringify(userData));
      } else {
        setPlanNameDisplay('Free Trial');
        setProductLimit(50);
      }
    } catch (error) {
      console.error('❌ Failed to load subscription:', error);
      try {
        const userData = JSON.parse(localStorage.getItem('shelflife_user') || '{}');
        if (userData.planName) setPlanNameDisplay(userData.planName);
        if (userData.subscription?.limits?.maxProducts) setProductLimit(Number(userData.subscription.limits.maxProducts));
      } catch (e) {}
    } finally { setIsLoadingSubscription(false); }
  };

  const loadSuppliers = async () => {
    if (!user?.uid) return;
    try {
      const data = await api.getSuppliers(user.uid);
      const list = data.list || [];
      setSuppliers(list);
      localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(list));
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      const localData = localStorage.getItem(`shelflife_suppliers_${user.uid}`);
      if (localData) setSuppliers(JSON.parse(localData));
    }
  };

  useEffect(() => {
    if (user?.uid) { loadSubscription(); loadSuppliers(); }
    else { setIsLoadingSubscription(false); }
  }, [user]);

  useEffect(() => {
    if (user?.uid && refreshInventory) loadSubscription();
  }, [inventory.length]);

  useEffect(() => {
    const handleFocus = () => { if (user?.uid) loadSubscription(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  useEffect(() => {
    if (location.state?.supplier) {
      setPreSelectedSupplier(location.state.supplier);
      setShowScanner(true);
    }
  }, [location]);

  useEffect(() => {
    const filterType = localStorage.getItem('shelflife_filter_type');
    const filterValue = localStorage.getItem('shelflife_filter_value');
    if (filterType && filterValue) {
      setFilterStatus('all'); setFilterSupplier('all'); setFilterSlow(false); setSearchTerm('');
      switch (filterType) {
        case 'critical': setFilterStatus('critical'); showToast(`🔍 Showing items expiring in ${filterValue} days or less`); break;
        case 'expiring': setFilterStatus('expiring'); showToast(`🔍 Showing items expiring within ${filterValue} days`); break;
        case 'top': setFilterSupplier(filterValue); showToast(`🔍 Showing products from supplier: ${filterValue}`); break;
        case 'slow': setFilterSlow(true); showToast(`🔍 Showing slow moving items (review ordering)`); break;
        default: break;
      }
      localStorage.removeItem('shelflife_filter_type');
      localStorage.removeItem('shelflife_filter_value');
    }
  }, []);

  const refreshData = async () => {
    if (refreshInventory) {
      setLoading(true);
      try { await refreshInventory(); await loadSubscription(); }
      catch (error) { console.error('Refresh error:', error); }
      finally { setLoading(false); }
    }
  };

  const canAdd = inventory.length < productLimit;

  // ============================================================
  // PROMPT FUNCTIONS
  // ============================================================
  const showProductNamePrompt = (title, message, defaultValue) => {
    return new Promise((resolve) => {
      setNamePromptConfig({ title, message, defaultValue: defaultValue || '' });
      setNamePromptResolve(() => resolve);
      setShowNamePrompt(true);
    });
  };

  const handleNameConfirm = (value) => {
    setShowNamePrompt(false);
    if (namePromptResolve) { namePromptResolve(value); setNamePromptResolve(null); }
  };
  const handleNameCancel = () => {
    setShowNamePrompt(false);
    if (namePromptResolve) { namePromptResolve(null); setNamePromptResolve(null); }
  };

  const showSupplierPromptFn = (title, message, supplierList, defaultSupplier) => {
    return new Promise((resolve) => {
      setSupplierPromptConfig({ title, message, suppliers: supplierList || [], defaultSupplier: defaultSupplier || '' });
      setSupplierPromptResolve(() => resolve);
      setShowSupplierPrompt(true);
    });
  };

  const handleSupplierConfirm = (value) => {
    setShowSupplierPrompt(false);
    if (supplierPromptResolve) { supplierPromptResolve(value); setSupplierPromptResolve(null); }
  };
  const handleSupplierCancel = () => {
    setShowSupplierPrompt(false);
    if (supplierPromptResolve) { supplierPromptResolve(null); setSupplierPromptResolve(null); }
  };

  const saveSupplierIfNotExists = async (supplierName) => {
    if (!supplierName || supplierName === 'Manual Entry' || supplierName === 'OCR Scanned') return;
    const existingSupplier = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
    if (existingSupplier) return existingSupplier;
    try {
      const newSupplier = { name: supplierName, contact: '', email: '', address: '', rating: 0, notes: 'Auto-created from inventory' };
      const result = await api.addSupplier(user.uid, newSupplier);
      if (result.success) {
        setSuppliers(prev => [...prev, result.supplier]);
        const updatedSuppliers = [...suppliers, result.supplier];
        localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(updatedSuppliers));
        return result.supplier;
      }
    } catch (error) { console.error(`Failed to auto-create supplier "${supplierName}":`, error); }
    return null;
  };

  // ============================================================
  // ✅ SMART ACTIONS
  // ============================================================

  // 🔥 Single Flash Sale
  const handleFlashSale = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    let discount = '30% OFF', saleType = 'Flash Sale', discountMultiplier = 0.7;
    if (product.daysLeft <= 1) { discount = '50% OFF'; saleType = 'Buy 1 Get 1 Free'; discountMultiplier = 0.5; }
    else if (product.daysLeft <= 2) { discount = '40% OFF'; saleType = 'Flash Sale'; discountMultiplier = 0.6; }
    else if (product.daysLeft <= 7) { discount = '30% OFF'; saleType = 'Flash Sale'; discountMultiplier = 0.7; }

    if (!window.confirm(`Apply ${discount} ${saleType} to "${product.name}"?`)) return;
    setActionLoading(productId);

    try {
      const newPrice = Math.round(product.sellingPrice * discountMultiplier);
      const newStock = Math.max(0, product.stock - 1);
      const updates = {
        sellingPrice: newPrice,
        suggestion: `🔥 ${saleType} ACTIVE - ${discount}`,
        flashSaleActive: true,
        flashSaleDiscount: discount,
        flashSaleAppliedAt: new Date().toISOString(),
        stock: newStock
      };

      if (newStock === 0) {
        updates.status = 'sold_out';
        updates.suggestion = '✅ Sold Out - Removed from active inventory';
        updates.flashSaleActive = false;
      }

      const result = await api.updateProduct(user.uid, productId, updates);
      if (result.success) {
        showToast(`🔥 ${saleType} applied to ${product.name}! New price: LKR ${newPrice}`);
        const event = new CustomEvent('flashSaleApplied', {
          detail: { productName: product.name, discount: discount, newPrice: newPrice, saleType: saleType }
        });
        window.dispatchEvent(event);
        await refreshData();
        setSelectedItems([]);
        setSelectAll(false);
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

  // 🔥 Auto-Flash All
  const handleAutoFlashAll = () => {
    const expiringItems = inventory.filter(item => item.daysLeft > 0 && item.daysLeft <= 7 && !item.flashSaleActive && item.stock > 0);
    if (expiringItems.length === 0) {
      showToast('✅ No items need flashing! All expiring items are already on sale or sold out.');
      return;
    }
    setFlashItems(expiringItems);
    setShowFlashConfirm(true);
  };

  const executeAutoFlash = async () => {
    setShowFlashConfirm(false);
    setAutoFlashing(true);
    setActionLoading('autoFlash');

    try {
      let successCount = 0;
      for (const item of flashItems) {
        let discount = '30% OFF', saleType = 'Flash Sale', discountMultiplier = 0.7;
        if (item.daysLeft <= 1) { discount = '50% OFF'; saleType = 'Buy 1 Get 1 Free'; discountMultiplier = 0.5; }
        else if (item.daysLeft <= 2) { discount = '40% OFF'; saleType = 'Flash Sale'; discountMultiplier = 0.6; }

        const newPrice = Math.round(item.sellingPrice * discountMultiplier);
        const newStock = Math.max(0, item.stock - 1);
        const updates = {
          sellingPrice: newPrice,
          suggestion: `🔥 ${saleType} ACTIVE - ${discount}`,
          flashSaleActive: true,
          flashSaleDiscount: discount,
          flashSaleAppliedAt: new Date().toISOString(),
          stock: newStock
        };

        if (newStock === 0) {
          updates.status = 'sold_out';
          updates.suggestion = '✅ Sold Out - Removed from active inventory';
          updates.flashSaleActive = false;
        }

        const result = await api.updateProduct(user.uid, item.id, updates);
        if (result.success) {
          successCount++;
          const event = new CustomEvent('flashSaleApplied', {
            detail: { productName: item.name, discount: discount, newPrice: newPrice, saleType: `Auto ${saleType}` }
          });
          window.dispatchEvent(event);
        }
      }
      await refreshData();
      showToast(`✅ ${successCount} flash sales applied successfully!`);
      setSelectedItems([]);
      setSelectAll(false);
      setFlashItems([]);
    } catch (error) {
      console.error('Auto-flash error:', error);
      showToast(`❌ ${error.message || 'Failed to apply auto-flash'}`);
    } finally {
      setAutoFlashing(false);
      setActionLoading(null);
    }
  };

  // 📧 Notify Supplier - Real API Call
  const handleNotifySupplier = (product) => {
    setNotificationProduct(product);
    setShowNotificationModal(true);
  };

  const sendSupplierNotification = async (message) => {
    if (!notificationProduct) return;
    
    setIsNotificationSending(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/suppliers/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          productId: notificationProduct.id,
          notificationType: notificationProduct.stock <= notificationProduct.lowStockThreshold ? 'low_stock' : 'near_expiry',
          customMessage: message || undefined
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`📧 Email sent to ${result.supplier} (${result.email})`);
      } else {
        showToast(`❌ Failed: ${result.error}`);
      }
      
      setShowNotificationModal(false);
      setNotificationProduct(null);
      
    } catch (error) {
      console.error('Send notification error:', error);
      showToast(`❌ ${error.message || 'Failed to send notification'}`);
    } finally {
      setIsNotificationSending(false);
    }
  };

  // 📦 Update Order Status
  const handleUpdateOrderStatus = async (productId, newStatus) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    const updates = {
      orderStatus: newStatus,
      orderStatusUpdatedAt: new Date().toISOString()
    };
    try {
      const result = await api.updateProduct(user.uid, productId, updates);
      if (result.success) {
        await refreshData();
        showToast(`📦 Order status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Update order status error:', error);
      showToast('❌ Failed to update order status');
    }
  };

  // 📦 Order All Low Stock
  const handleOrderAllLowStock = () => {
    const lowStockList = inventory.filter(item => item.stock > 0 && item.stock <= (item.lowStockThreshold || 10) && item.status !== 'sold_out');
    if (lowStockList.length === 0) {
      showToast('✅ All items are well stocked!');
      return;
    }
    setOrderAllItems(lowStockList);
    setShowOrderAllConfirm(true);
  };

  const executeOrderAll = async () => {
    setShowOrderAllConfirm(false);
    setOrderingLowStock(true);
    setActionLoading('bulkOrder');

    try {
      let orderedCount = 0;
      for (const item of orderAllItems) {
        const qty = (item.lowStockThreshold || 10) - item.stock + 10;
        const newStock = item.stock + qty;
        const updates = {
          stock: newStock,
          suggestion: `📦 Bulk order placed on ${new Date().toLocaleDateString()} (+${qty} units)`,
          lastOrderDate: new Date().toISOString(),
          lastOrderQuantity: qty,
          lastOrderReason: 'Low Stock Bulk Order',
          orderStatus: 'ordered'
        };
        const result = await api.updateProduct(user.uid, item.id, updates);
        if (result.success) orderedCount++;
      }
      await refreshData();
      showToast(`✅ Orders placed for ${orderedCount} items!`);
      setOrderAllItems([]);
    } catch (error) {
      console.error('Bulk order error:', error);
      showToast(`❌ ${error.message || 'Failed to place bulk orders'}`);
    } finally {
      setOrderingLowStock(false);
      setActionLoading(null);
    }
  };

  // 📦 Single Order Now
  const handleOrderNow = (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    setOrderProduct(product);
    setShowOrderModal(true);
  };

  const handleOrderConfirm = async (quantity, reason) => {
    if (!orderProduct) return;
    setShowOrderModal(false);
    setActionLoading(orderProduct.id);

    try {
      const newStock = orderProduct.stock + quantity;
      const updates = {
        stock: newStock,
        suggestion: `📦 Order placed on ${new Date().toLocaleDateString()} (${quantity} units) - ${reason}`,
        lastOrderDate: new Date().toISOString(),
        lastOrderQuantity: quantity,
        lastOrderReason: reason,
        orderStatus: 'ordered'
      };
      const result = await api.updateProduct(user.uid, orderProduct.id, updates);
      if (result.success) {
        showToast(`📦 Order placed for ${quantity} units of ${orderProduct.name}! New stock: ${newStock}`);
        await refreshData();
      } else {
        showToast(`❌ Failed to place order: ${result.error}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      showToast(`❌ ${error.message || 'Failed to place order'}`);
    } finally {
      setActionLoading(null);
      setOrderProduct(null);
    }
  };

  const handleOrderCancel = () => {
    setShowOrderModal(false);
    setOrderProduct(null);
  };

  // 🚚 Return to Supplier
  const handleReturnToSupplier = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    const isExpired = product.daysLeft <= 0;
    const defaultQty = isExpired ? product.stock : 0;

    const returnQty = window.prompt(
      `🚚 Return "${product.name}" to ${product.supplier}\nCurrent stock: ${product.stock}\nStatus: ${isExpired ? 'EXPIRED - Return recommended' : 'Near Expiry'}\n\nEnter quantity to return (or 0 to cancel):`,
      defaultQty || product.stock
    );
    if (returnQty === null) return;
    const qty = parseInt(returnQty);
    if (isNaN(qty) || qty < 0) { showToast('❌ Invalid quantity'); return; }
    if (qty === 0) { showToast('Return cancelled'); return; }
    if (qty > product.stock) { showToast(`❌ Cannot return more than available stock (${product.stock})`); return; }

    const reason = window.prompt('Reason for return:', isExpired ? 'Expired' : 'Near Expiry');
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
        lastReturnReason: reason || 'Not specified',
        orderStatus: 'cancelled'
      };
      if (newStock === 0) {
        updates.status = 'out_of_stock';
        updates.suggestion = `🚚 All units returned to supplier. Reason: ${reason || 'Near expiry'}`;
      }
      const result = await api.updateProduct(user.uid, productId, updates);
      if (result.success) {
        showToast(`🚚 ${qty} units of ${product.name} returned to ${product.supplier}! Remaining stock: ${newStock}`);
        // Notify supplier about return
        handleNotifySupplier(product);
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

  // 🗑️ Delete Product
  const handleDeleteProduct = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (product && window.confirm(`Delete ${product.name} from inventory?`)) {
      try {
        const result = await api.deleteProduct(user.uid, productId);
        if (result.success) {
          await refreshData();
          showToast(`🗑️ ${product.name} removed from inventory`);
          setSelectedItems([]);
          setSelectAll(false);
        }
      } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Failed to delete product');
      }
    }
  };

  // ============================================================
  // ✅ BULK ACTIONS
  // ============================================================
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedItems([]); }
    else { setSelectedItems(filteredInventory.map(item => item.id)); }
    setSelectAll(!selectAll);
  };

  const handleBulkFlashSale = async () => {
    const products = inventory.filter(item => selectedItems.includes(item.id));
    const expiringProducts = products.filter(item => item.daysLeft > 0 && item.daysLeft <= 7 && item.stock > 0);
    if (expiringProducts.length === 0) {
      showToast('⚠️ No expiring products selected (only 1-7 days left and in stock)');
      return;
    }
    if (!window.confirm(`Apply flash sale to ${expiringProducts.length} selected products?`)) return;
    setActionLoading('bulk');
    try {
      for (const product of expiringProducts) {
        await handleFlashSale(product.id);
      }
      showToast(`✅ Bulk flash sale applied to ${expiringProducts.length} products!`);
      setSelectedItems([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Bulk flash sale error:', error);
      showToast('❌ Failed to apply bulk flash sale');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) { showToast('⚠️ No items selected'); return; }
    if (!window.confirm(`Delete ${selectedItems.length} selected products?`)) return;
    setActionLoading('bulk');
    try {
      for (const itemId of selectedItems) {
        await api.deleteProduct(user.uid, itemId);
      }
      await refreshData();
      showToast(`🗑️ ${selectedItems.length} products deleted`);
      setSelectedItems([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('❌ Failed to delete products');
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // ✅ HANDLE ADD PRODUCT
  // ============================================================
  const handleAddProduct = async (productData) => {
    let productName = productData.name;
    if (!productName || productName.startsWith('Product ') || productName === 'OCR Product') {
      const result = await showProductNamePrompt('Add Product', 'Enter a name for this product', productData.name || 'New Product');
      if (!result || result.trim().length < 2) { showToast('❌ Product name is required (min 2 characters)'); return; }
      productName = result.trim();
    }

    if (!productName || productName.trim().length < 2) { showToast('❌ Product name is required (min 2 characters)'); return; }
    if (!canAdd) {
      showToast(`⚠️ Product limit reached (${inventory.length}/${productLimit}). Please upgrade.`);
      window.location.href = '/billing';
      return;
    }

    let supplierName = productData.supplier || 'Manual Entry';
    if (!preSelectedSupplier && supplierName !== 'Manual Entry' && supplierName !== 'OCR Scanned') {
      const supplierList = suppliers.map(s => s.name);
      const selected = await showSupplierPromptFn('Select or Add Supplier', 'Choose an existing supplier or type a new one', supplierList, supplierName);
      if (selected && selected.trim()) supplierName = selected.trim();
      else supplierName = 'Manual Entry';
    } else if (preSelectedSupplier) {
      supplierName = preSelectedSupplier;
    }

    if (supplierName !== 'Manual Entry' && supplierName !== 'OCR Scanned') await saveSupplierIfNotExists(supplierName);

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
      flashSaleActive: false,
      orderStatus: 'pending'
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

  // ============================================================
  // ✅ HANDLE SCAN (Barcode + OCR)
  // ============================================================
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
      const productName = await showProductNamePrompt('Add Product', 'Enter a name for this product', defaultName);
      if (!productName || productName.trim().length < 2) { showToast('❌ Product name is required'); setShowScanner(false); setScanType(null); return; }
      let supplierName = preSelectedSupplier || 'Manual Entry';
      if (!preSelectedSupplier) {
        const supplierList = suppliers.map(s => s.name);
        const selected = await showSupplierPromptFn('Select or Add Supplier', 'Choose an existing supplier or type a new one', supplierList, supplierName);
        if (selected && selected.trim()) supplierName = selected.trim();
        else supplierName = 'Manual Entry';
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
      if (scanData.productData) {
        handleAddProduct(scanData.productData);
        setShowScanner(false);
        setScanType(null);
      } else {
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
          const productName = await showProductNamePrompt('Add Product (OCR)', 'We detected an expiry date. Please enter the product name.', 'OCR Product');
          if (!productName || productName.trim().length < 2) { showToast('❌ Product name is required'); setShowScanner(false); setScanType(null); return; }
          let supplierName = 'OCR Scanned';
          const supplierList = suppliers.map(s => s.name);
          const selected = await showSupplierPromptFn('Select or Add Supplier (OCR)', 'Choose an existing supplier or type a new one', supplierList, 'OCR Scanned');
          if (selected && selected.trim()) supplierName = selected.trim();
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
    }
  };

  // ============================================================
  // ✅ HANDLE EDIT PRODUCT
  // ============================================================
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

  // ============================================================
  // ✅ HANDLE SUPPLIER CLICK
  // ============================================================
  const handleSupplierClick = (supplierName) => {
    navigate('/suppliers', { state: { supplier: supplierName } });
  };

  // ============================================================
  // ✅ FILTERED INVENTORY
  // ============================================================
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (filterStatus === 'expiring') matchesFilter = item.daysLeft <= 7 && item.daysLeft > 0;
    else if (filterStatus === 'critical') matchesFilter = item.daysLeft <= 3 && item.daysLeft > 0;
    else if (filterStatus === 'expired') matchesFilter = item.daysLeft <= 0;
    else if (filterStatus === 'healthy') matchesFilter = item.daysLeft > 7;
    else if (filterStatus === 'sold_out') matchesFilter = item.status === 'sold_out';
    const matchesSupplier = filterSupplier === 'all' || item.supplier === filterSupplier;
    let matchesSlow = true;
    if (filterSlow) matchesSlow = item.daysLeft > 30 && item.stock > 15;
    return matchesSearch && matchesFilter && matchesSupplier && matchesSlow;
  });

  const uniqueSuppliers = [...new Set(inventory.map(item => item.supplier))].filter(Boolean);

  const stats = {
    total: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0),
    expiringValue: inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0),
    lowStockCount: inventory.filter(i => i.stock <= i.lowStockThreshold && i.stock > 0).length
  };

  // ✅ Separate lists for alerts
  const lowStockItems = inventory.filter(item => item.stock > 0 && item.stock <= (item.lowStockThreshold || 10) && item.status !== 'sold_out');
  const expiringItems = inventory.filter(item => item.daysLeft > 0 && item.daysLeft <= 7 && !item.flashSaleActive && item.stock > 0);
  const criticalExpiring = expiringItems.filter(item => item.daysLeft <= 2);

  // ✅ Pending Orders
  const pendingOrders = inventory.filter(item => item.orderStatus === 'ordered' || item.orderStatus === 'pending');

  // ============================================================
  // ✅ RENDER
  // ============================================================
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
          <h1 className="page-title"><i className="fas fa-boxes"></i> Inventory Management</h1>
          <p className="page-description">Manage your stock, track batches, and monitor expiry dates</p>
        </div>

        <div className="usage-indicator">
          <span className="usage-text">{inventory.length} / {productLimit === Infinity ? '∞' : productLimit} products used</span>
          <div className="usage-bar">
            <div className="usage-bar-fill" style={{
              width: productLimit === Infinity ? '5%' : `${Math.min((inventory.length / productLimit) * 100, 100)}%`,
              background: productLimit === Infinity ? 'linear-gradient(90deg, #39e75f, #6eef8b)' : undefined
            }}></div>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{planNameDisplay}</small>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {lowStockItems.length > 0 && (
            <button className="btn-order-all" onClick={handleOrderAllLowStock} disabled={orderingLowStock || actionLoading === 'bulkOrder'}>
              {orderingLowStock ? <><i className="fas fa-spinner fa-pulse"></i> Ordering...</> : <><i className="fas fa-shopping-cart"></i> Order All ({lowStockItems.length})</>}
            </button>
          )}
          {expiringItems.length > 0 && (
            <button className="btn-auto-flash" onClick={handleAutoFlashAll} disabled={autoFlashing || actionLoading === 'autoFlash'}>
              {autoFlashing ? <><i className="fas fa-spinner fa-pulse"></i> Applying...</> : <><i className="fas fa-bolt"></i> Auto-Flash All ({expiringItems.length})</>}
            </button>
          )}
          <button className="btn-primary-lg" onClick={() => setShowScanner(true)} disabled={addingProduct || !canAdd}>
            {addingProduct ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-plus"></i>}
            {addingProduct ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* 🔵 Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="low-stock-alert-banner">
          <div className="low-stock-alert-icon"><i className="fas fa-boxes"></i></div>
          <div className="low-stock-alert-content">
            <strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock!</strong>
            <div className="low-stock-item-list">
              {lowStockItems.slice(0, 5).map((item, idx) => (
                <span key={idx} className="low-stock-tag">
                  {item.name} <span className="low-stock-qty">({item.stock}/{item.lowStockThreshold || 10})</span>
                </span>
              ))}
              {lowStockItems.length > 5 && (<span className="low-stock-tag more">+{lowStockItems.length - 5} more</span>)}
            </div>
          </div>
          <button className="low-stock-order-btn" onClick={handleOrderAllLowStock} disabled={orderingLowStock || actionLoading === 'bulkOrder'}>
            {orderingLowStock ? <><i className="fas fa-spinner fa-pulse"></i> Ordering...</> : <><i className="fas fa-shopping-cart"></i> Order All</>}
          </button>
        </div>
      )}

      {/* 🟡 Expiry Alert Banner */}
      {expiringItems.length > 0 && (
        <div className={`expiry-alert-banner ${criticalExpiring.length > 0 ? 'critical' : 'warning'}`}>
          <i className={`fas ${criticalExpiring.length > 0 ? 'fa-exclamation-triangle' : 'fa-clock'}`}></i>
          <div className="expiry-alert-content">
            <strong>{expiringItems.length} item{expiringItems.length > 1 ? 's' : ''} expiring soon!</strong>
            <div className="expiry-item-list">
              {expiringItems.slice(0, 5).map((item, idx) => (
                <span key={idx} className="expiry-tag">
                  {item.name}
                  <span className={`expiry-days ${item.daysLeft <= 2 ? 'critical' : ''}`}>({item.daysLeft}d)</span>
                  <span className="expiry-discount-badge">{item.daysLeft <= 1 ? '50%' : item.daysLeft <= 2 ? '40%' : '30%'} OFF</span>
                </span>
              ))}
              {expiringItems.length > 5 && (<span className="expiry-tag more">+{expiringItems.length - 5} more</span>)}
            </div>
          </div>
          <button className="expiry-alert-btn" onClick={handleAutoFlashAll} disabled={autoFlashing}>
            {autoFlashing ? 'Applying...' : '🔥 Apply Flash Sale'}
          </button>
        </div>
      )}

      {/* 📦 Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <div className="pending-orders-section">
          <div className="pending-orders-header">
            <h3><i className="fas fa-clock"></i> Pending Orders ({pendingOrders.length})</h3>
            <span className="pending-orders-sub">Orders placed but not yet delivered</span>
          </div>
          <div className="pending-orders-list">
            {pendingOrders.slice(0, 5).map((item) => (
              <div key={item.id} className="pending-order-item">
                <span className="pending-order-name">{item.name}</span>
                <span className="pending-order-stock">{item.stock} units</span>
                <span className="pending-order-supplier"><i className="fas fa-truck"></i> {item.supplier}</span>
                <span className={`pending-order-status ${item.orderStatus}`}>
                  {item.orderStatus === 'ordered' ? '📦 Ordered' : '⏳ Pending'}
                </span>
                <button className="pending-order-deliver" onClick={() => handleUpdateOrderStatus(item.id, 'delivered')}>
                  <i className="fas fa-check"></i> Mark Delivered
                </button>
              </div>
            ))}
            {pendingOrders.length > 5 && (<div className="pending-orders-more">+ {pendingOrders.length - 5} more</div>)}
          </div>
        </div>
      )}

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

      {/* Alert Bar */}
      <AlertBar inventory={inventory} onFlashSale={handleFlashSale} onOrderNow={handleOrderNow} actionLoading={actionLoading} />

      {/* Scanner Section */}
      {showScanner && !scanType && (
        <div className="scanner-section">
          <div className="scanner-tabs">
            <button className="scanner-tab" onClick={() => setScanType('barcode')} disabled={!canAdd}><i className="fas fa-barcode"></i> Barcode Scanner</button>
            <button className="scanner-tab" onClick={() => setScanType('ocr')} disabled={!canAdd} style={{ background: canAdd ? 'linear-gradient(135deg, var(--green-deep), var(--green-neon))' : 'var(--bg-raised)', color: canAdd ? '#030a03' : 'var(--text-muted)' }}>
              <i className="fas fa-eye"></i> OCR Scanner <span style={{ fontSize: '0.7rem', background: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>BETA</span>
            </button>
            <button className="scanner-close" onClick={() => setShowScanner(false)}><i className="fas fa-times"></i></button>
          </div>
          <div className="scanner-prompt">
            <p>Scan barcode or expiry date to add or update products</p>
            {preSelectedSupplier && <p style={{ color: 'var(--green-neon)', fontWeight: 'bold' }}>📦 Adding product for: <strong>{preSelectedSupplier}</strong></p>}
            {!canAdd && (
              <p style={{ color: 'var(--red)', fontWeight: 'bold' }}>
                ⚠️ Product limit reached ({inventory.length}/{productLimit}).
                <button onClick={() => window.location.href = '/billing'} style={{ background: 'var(--green-neon)', border: 'none', padding: '4px 12px', borderRadius: '20px', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#030a03' }}>Upgrade Now</button>
              </p>
            )}
            {canAdd && <small className="scan-limit-info">{productLimit === Infinity ? 'Unlimited' : productLimit - inventory.length} product slots remaining</small>}
          </div>
        </div>
      )}

      {scanType === 'barcode' && (<div className="scanner-section"><BarcodeScanner onScan={handleScan} onClose={() => setScanType(null)} /></div>)}
      {scanType === 'ocr' && (<div className="scanner-section"><OCRScanner onScan={handleScan} onClose={() => setScanType(null)} existingSuppliers={suppliers.map(s => ({ id: s.id, name: s.name }))} /></div>)}

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box"><i className="fas fa-search"></i><input type="text" placeholder="Search by name, batch, or supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>

      <div className="filter-buttons" style={{ marginBottom: '1rem' }}>
        <button className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setFilterSlow(false); }}>All</button>
        <button className={`filter-btn ${filterStatus === 'expiring' ? 'active' : ''}`} onClick={() => { setFilterStatus('expiring'); setFilterSlow(false); }}>Expiring Soon</button>
        <button className={`filter-btn ${filterStatus === 'critical' ? 'active' : ''}`} onClick={() => { setFilterStatus('critical'); setFilterSlow(false); }}>Critical</button>
        <button className={`filter-btn ${filterStatus === 'expired' ? 'active' : ''}`} onClick={() => { setFilterStatus('expired'); setFilterSlow(false); }}>Expired</button>
        <button className={`filter-btn ${filterStatus === 'healthy' ? 'active' : ''}`} onClick={() => { setFilterStatus('healthy'); setFilterSlow(false); }}>Healthy</button>
        <button className={`filter-btn ${filterStatus === 'sold_out' ? 'active' : ''}`} onClick={() => { setFilterStatus('sold_out'); setFilterSlow(false); }}>Sold Out</button>
        <button className={`filter-btn ${filterSlow ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setFilterSlow(!filterSlow); }}>Slow Moving</button>
      </div>

      {uniqueSuppliers.length > 1 && (
        <div className="filter-buttons" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button className={`filter-btn ${filterSupplier === 'all' ? 'active' : ''}`} onClick={() => setFilterSupplier('all')}><i className="fas fa-building"></i> All Suppliers</button>
          {uniqueSuppliers.map(supplier => (
            <button key={supplier} className={`filter-btn ${filterSupplier === supplier ? 'active' : ''}`} onClick={() => setFilterSupplier(supplier)}><i className="fas fa-truck"></i> {supplier}</button>
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-selected">{selectedItems.length} items selected</span>
          <div className="bulk-actions">
            <button className="bulk-btn flash" onClick={handleBulkFlashSale} disabled={actionLoading === 'bulk'}>
              {actionLoading === 'bulk' ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-tags"></i>} Bulk Flash Sale
            </button>
            <button className="bulk-btn delete" onClick={handleBulkDelete} disabled={actionLoading === 'bulk'}>
              {actionLoading === 'bulk' ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-trash"></i>} Bulk Delete
            </button>
            <button className="bulk-btn cancel" onClick={() => { setSelectedItems([]); setSelectAll(false); }}><i className="fas fa-times"></i> Clear</button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{ width: '16px', height: '16px', accentColor: '#39e75f', cursor: 'pointer' }} /></th>
              <th>Product</th>
              <th>Batch</th>
              <th>Supplier</th>
              <th>Stock</th>
              <th>Expiry</th>
              <th>Status</th>
              <th style={{ textAlign: 'center', minWidth: '340px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => {
              let rowClass = 'row-good';
              if (item.status === 'sold_out') rowClass = 'row-sold-out';
              else if (item.daysLeft <= 0) rowClass = 'row-expired';
              else if (item.daysLeft <= 3) rowClass = 'row-critical';
              else if (item.daysLeft <= 7) rowClass = 'row-warning';

              let stockClass = '';
              let stockDisplay = `${item.stock} units`;
              if (item.stock <= 0) { stockClass = 'out'; stockDisplay = 'Out of Stock'; }
              else if (item.stock <= item.lowStockThreshold) stockClass = 'low';

              let daysClass = 'good';
              let daysDisplay = `${item.daysLeft} days`;
              if (item.daysLeft <= 0) { daysClass = 'expired'; daysDisplay = 'Expired'; }
              else if (item.daysLeft <= 3) daysClass = 'critical';
              else if (item.daysLeft <= 7) daysClass = 'warning';

              let statusClass = 'good';
              let statusText = 'Healthy';
              if (item.status === 'sold_out') { statusClass = 'sold_out'; statusText = '✅ Sold Out'; }
              else if (item.daysLeft <= 0) { statusClass = 'expired'; statusText = 'Expired'; }
              else if (item.daysLeft <= 3) { statusClass = 'critical'; statusText = '⚠️ Critical'; }
              else if (item.daysLeft <= 7) { statusClass = 'warning'; statusText = '⚠️ Near Expiry'; }

              return (
                <tr key={item.id} className={rowClass}>
                  <td><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItemSelection(item.id)} style={{ width: '16px', height: '16px', accentColor: '#39e75f', cursor: 'pointer' }} /></td>
                  <td>
                    <span className="product-name">{item.name}</span>
                    {item.flashSaleActive && item.flashSaleDiscount && (<span className="discount-badge" data-discount={item.flashSaleDiscount}>🔥 {item.flashSaleDiscount}</span>)}
                    {item.stock <= item.lowStockThreshold && item.stock > 0 && (<span className="low-stock-badge">⚠️ Low Stock</span>)}
                    {item.status === 'sold_out' && (<span className="sold-out-badge">✅ Sold Out</span>)}
                  </td>
                  <td><code className="batch-code">{item.batch}</code></td>
                  <td><span className="supplier-link" onClick={() => handleSupplierClick(item.supplier)}>{item.supplier}</span></td>
                  <td><span className={`stock-badge ${stockClass}`}>{stockDisplay}</span></td>
                  <td><span className={`days-left ${daysClass}`}>{daysDisplay}</span></td>
                  <td><span className={`status-badge ${statusClass}`}>{statusText}</span></td>
                  <td>
                    <div className="action-buttons">
                      {/* Flash Sale */}
                      {item.daysLeft > 0 && item.daysLeft <= 7 && item.stock > 0 && item.status !== 'sold_out' && (
                        <button className="action-btn flash" onClick={() => handleFlashSale(item.id)} disabled={actionLoading === item.id}>
                          {actionLoading === item.id ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-tags"></i>} Flash
                        </button>
                      )}

                      {/* Order Now */}
                      {item.stock <= item.lowStockThreshold && item.stock > 0 && item.status !== 'sold_out' && (
                        <button className="action-btn order" onClick={() => handleOrderNow(item.id)} disabled={actionLoading === item.id}>
                          {actionLoading === item.id ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-shopping-cart"></i>} Order
                        </button>
                      )}

                      {/* Notify Supplier */}
                      {(item.stock <= item.lowStockThreshold || item.daysLeft <= 7) && item.stock > 0 && item.status !== 'sold_out' && (
                        <button className="action-btn notify" onClick={() => handleNotifySupplier(item)}>
                          <i className="fas fa-envelope"></i> Notify
                        </button>
                      )}

                      {/* Return */}
                      {item.daysLeft <= 7 && (
                        <button className="action-btn return" onClick={() => handleReturnToSupplier(item.id)} disabled={actionLoading === item.id}>
                          {actionLoading === item.id ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-undo-alt"></i>} Return
                        </button>
                      )}

                      {/* Edit */}
                      <button className="action-btn edit" onClick={() => { setSelectedProduct(item); setShowEditModal(true); }}>
                        <i className="fas fa-edit"></i>
                      </button>

                      {/* Delete */}
                      <button className="action-btn delete" onClick={() => handleDeleteProduct(item.id)} disabled={actionLoading === item.id}>
                        {actionLoading === item.id ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-trash"></i>}
                      </button>

                      {/* Order Status Dropdown */}
                      <select
                        className="order-status-select"
                        value={item.orderStatus || 'pending'}
                        onChange={(e) => handleUpdateOrderStatus(item.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="ordered">📦 Ordered</option>
                        <option value="delivered">✅ Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
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
            {canAdd ? <button className="btn-primary" onClick={() => setShowScanner(true)}>Add your first product</button> :
              <button className="btn-primary" onClick={() => window.location.href = '/billing'}>Upgrade to Add Products</button>}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Edit Product</h2><button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button></div>
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); handleEditProduct(selectedProduct); }}>
              <div className="form-group"><label>Product Name</label><input type="text" value={selectedProduct.name} onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })} required /></div>
              <div className="form-group"><label>Batch Number</label><input type="text" value={selectedProduct.batch} onChange={(e) => setSelectedProduct({ ...selectedProduct, batch: e.target.value })} required /></div>
              <div className="form-group"><label>Supplier</label><input type="text" value={selectedProduct.supplier} onChange={(e) => setSelectedProduct({ ...selectedProduct, supplier: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Stock Quantity</label><input type="number" value={selectedProduct.stock} onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: parseInt(e.target.value) })} required /></div>
                <div className="form-group"><label>Low Stock Threshold</label><input type="number" value={selectedProduct.lowStockThreshold} onChange={(e) => setSelectedProduct({ ...selectedProduct, lowStockThreshold: parseInt(e.target.value) })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Cost Price (LKR)</label><input type="number" value={selectedProduct.costPrice} onChange={(e) => setSelectedProduct({ ...selectedProduct, costPrice: parseInt(e.target.value) })} required /></div>
                <div className="form-group"><label>Selling Price (LKR)</label><input type="number" value={selectedProduct.sellingPrice} onChange={(e) => setSelectedProduct({ ...selectedProduct, sellingPrice: parseInt(e.target.value) })} required /></div>
              </div>
              <div className="form-group"><label>Expiry Date</label><input type="date" value={selectedProduct.expiryDate} onChange={(e) => setSelectedProduct({ ...selectedProduct, expiryDate: e.target.value })} required /></div>
              <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="btn-save">Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Flash Confirm Modal */}
      <FlashConfirmModal isOpen={showFlashConfirm} items={flashItems} onConfirm={executeAutoFlash} onCancel={() => { setShowFlashConfirm(false); setFlashItems([]); }} />

      {/* Order All Confirm Modal */}
      <OrderAllConfirmModal isOpen={showOrderAllConfirm} items={orderAllItems} onConfirm={executeOrderAll} onCancel={() => { setShowOrderAllConfirm(false); setOrderAllItems([]); }} />

      {/* Supplier Notification Modal */}
      <SupplierNotificationModal
        isOpen={showNotificationModal}
        product={notificationProduct}
        supplier={notificationProduct?.supplier}
        onClose={() => { setShowNotificationModal(false); setNotificationProduct(null); }}
        onSend={sendSupplierNotification}
        isSending={isNotificationSending}
      />

      {/* Order Modal */}
      <OrderModal isOpen={showOrderModal} product={orderProduct} onConfirm={handleOrderConfirm} onCancel={handleOrderCancel} />

      {/* Product Name Modal */}
      <ProductNameModal isOpen={showNamePrompt} title={namePromptConfig.title} message={namePromptConfig.message} defaultValue={namePromptConfig.defaultValue} onConfirm={handleNameConfirm} onCancel={handleNameCancel} />

      {/* Supplier Prompt Modal */}
      <SupplierPromptModal isOpen={showSupplierPrompt} title={supplierPromptConfig.title} message={supplierPromptConfig.message} suppliers={supplierPromptConfig.suppliers} defaultSupplier={supplierPromptConfig.defaultSupplier} onConfirm={handleSupplierConfirm} onCancel={handleSupplierCancel} />
    </div>
  );
}

export default Inventory;