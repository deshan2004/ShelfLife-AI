// src/pages/Suppliers.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/apiService'
import './Pages.css'

function Suppliers({ inventory, onUpdateInventory, showToast, user, refreshInventory }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [highlightSupplier, setHighlightSupplier] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSuppliers, setExpandedSuppliers] = useState({})
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    rating: 0,
    notes: ''
  })

  // ✅ Highlight supplier from navigation state
  useEffect(() => {
    if (location.state?.supplier) {
      setHighlightSupplier(location.state.supplier);
      setExpandedSuppliers({ [location.state.supplier]: true });
      setTimeout(() => {
        const element = document.getElementById(`supplier-${location.state.supplier}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [location]);

  // ✅ Load suppliers from BACKEND
  const loadSuppliers = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading suppliers from backend...');

      const data = await api.getSuppliers(user.uid);
      console.log('✅ Suppliers loaded:', data);

      const list = data.list || [];
      setSuppliers(list);

      // Auto-expand first supplier if any
      if (list.length > 0 && Object.keys(expandedSuppliers).length === 0) {
        setExpandedSuppliers({ [list[0].name]: true });
      }

      localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(list));
    } catch (error) {
      console.error('❌ Load suppliers error:', error);
      setError(error.message || 'Failed to load suppliers');

      try {
        const localData = localStorage.getItem(`shelflife_suppliers_${user.uid}`);
        if (localData) {
          const list = JSON.parse(localData);
          setSuppliers(list);
          console.log(`📦 Loaded ${list.length} suppliers from localStorage fallback`);
        }
      } catch (e) {
        console.error('LocalStorage fallback error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load on mount and when user changes
  useEffect(() => {
    loadSuppliers();
  }, [user]);

  // ✅ Save to localStorage backup
  const saveToLocalStorage = (data) => {
    if (user?.uid) {
      localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(data));
    }
  };

  // ✅ Refresh data
  const refreshData = async () => {
    if (refreshInventory) {
      await refreshInventory();
    }
    await loadSuppliers();
  };

  // ✅ Add Supplier
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('❌ Supplier name is required');
      return;
    }

    try {
      setActionLoading('add');
      const result = await api.addSupplier(user.uid, formData);
      if (result.success) {
        await loadSuppliers();
        showToast(`✅ ${result.supplier.name} added successfully!`);
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Add supplier error:', error);
      showToast(`❌ ${error.message || 'Failed to add supplier'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Update Supplier
  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('❌ Supplier name is required');
      return;
    }

    try {
      setActionLoading('edit');
      const result = await api.updateSupplier(user.uid, selectedSupplier.id, formData);
      if (result.success) {
        await loadSuppliers();
        showToast(`✅ ${result.supplier.name} updated successfully!`);
        setShowEditModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Update supplier error:', error);
      showToast(`❌ ${error.message || 'Failed to update supplier'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Delete Supplier
  const handleDeleteSupplier = async (supplier) => {
    if (!window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) return;

    try {
      setActionLoading(supplier.id);
      const result = await api.deleteSupplier(user.uid, supplier.id);
      if (result.success) {
        await loadSuppliers();
        showToast(`🗑️ ${supplier.name} removed successfully!`);
      }
    } catch (error) {
      console.error('Delete supplier error:', error);
      showToast(`❌ ${error.message || 'Failed to delete supplier'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Add Product for this supplier
  const handleAddProductForSupplier = (supplierName) => {
    navigate('/inventory', { state: { supplier: supplierName } });
  };

  // ✅ View Products for supplier
  const handleViewProducts = (supplierName) => {
    const filtered = inventory.filter(p => p.supplier === supplierName);
    if (filtered.length > 0) {
      showToast(`📦 ${filtered.length} products from ${supplierName}`);
      navigate('/inventory');
      localStorage.setItem('shelflife_filter_supplier', supplierName);
    } else {
      showToast(`📦 No products yet from ${supplierName}. Click "Add Product" to add one.`);
    }
  };

  // ✅ Toggle supplier expansion
  const toggleSupplier = (supplierName) => {
    setExpandedSuppliers(prev => ({
      ...prev,
      [supplierName]: !prev[supplierName]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      email: '',
      address: '',
      rating: 0,
      notes: ''
    });
    setSelectedSupplier(null);
  };

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact: supplier.contact || '',
      email: supplier.email || '',
      address: supplier.address || '',
      rating: supplier.rating || 0,
      notes: supplier.notes || ''
    });
    setShowEditModal(true);
  };

  const renderStars = (rating, editable = false, onChange = null) => {
    return (
      <div className="supplier-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => editable && onChange && onChange(star)}
            style={{ 
              cursor: editable ? 'pointer' : 'default', 
              fontSize: editable ? '1.8rem' : '1.1rem',
              transition: 'all 0.15s ease'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const search = searchTerm.toLowerCase();
    return supplier.name?.toLowerCase().includes(search) ||
           supplier.contact?.toLowerCase().includes(search) ||
           supplier.email?.toLowerCase().includes(search) ||
           supplier.address?.toLowerCase().includes(search);
  });

  // Stats
  const stats = {
    total: suppliers.length,
    avgRating: suppliers.length > 0 
      ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)
      : '—',
    totalProducts: inventory?.length || 0
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  if (error && suppliers.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title"><i className="fas fa-truck"></i> Supplier Management</h1>
            <p className="page-description">Manage your suppliers, track performance, and handle returns</p>
          </div>
        </div>
        <div className="empty-state" style={{ borderColor: 'var(--red-border)' }}>
          <i className="fas fa-exclamation-triangle" style={{ color: 'var(--red)' }}></i>
          <p style={{ color: 'var(--red)' }}>{error}</p>
          <button className="btn-primary" onClick={() => { setError(null); setLoading(true); loadSuppliers(); }}>
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-truck"></i> Supplier Management
          </h1>
          <p className="page-description">Manage your suppliers, track performance, and handle returns</p>
        </div>
        <button className="btn-primary-lg" onClick={() => setShowAddModal(true)} disabled={actionLoading === 'add'}>
          {actionLoading === 'add' ? (
            <><i className="fas fa-spinner fa-pulse"></i> Adding...</>
          ) : (
            <><i className="fas fa-plus"></i> Add Supplier</>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-inline">
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-building"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Suppliers</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-star"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.avgRating}</span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-box"></i></div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalProducts}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search by name, contact, email, or address..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Suppliers Grid - Beautiful Cards */}
      {filteredSuppliers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-truck"></i>
          <p>{searchTerm ? 'No suppliers match your search' : 'No suppliers added yet'}</p>
          {!searchTerm && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Add Your First Supplier
            </button>
          )}
        </div>
      ) : (
        <div className="suppliers-grid">
          {filteredSuppliers.map((supplier) => {
            const supplierProducts = inventory.filter(p => p.supplier === supplier.name);
            const isHighlighted = highlightSupplier === supplier.name;
            const isExpanded = expandedSuppliers[supplier.name];
            
            // Count expiring products
            const expiringCount = supplierProducts.filter(p => p.daysLeft <= 7 && p.daysLeft > 0).length;
            const expiredCount = supplierProducts.filter(p => p.daysLeft <= 0).length;
            const lowStockCount = supplierProducts.filter(p => p.stock <= p.lowStockThreshold).length;

            return (
              <div 
                key={supplier.id} 
                id={`supplier-${supplier.name}`}
                className={`supplier-card-modern ${isHighlighted ? 'highlighted' : ''}`}
              >
                {/* Card Header - Click to expand */}
                <div className="supplier-card-header-modern" onClick={() => toggleSupplier(supplier.name)}>
                  <div className="supplier-card-left">
                    <div className="supplier-avatar-modern">
                      {supplier.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="supplier-name-section">
                      <h3 className="supplier-name">{supplier.name}</h3>
                      <div className="supplier-rating-row">
                        {renderStars(supplier.rating || 0)}
                        <span className="rating-text">({supplier.rating || 0})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="supplier-card-right">
                    <div className="supplier-badges">
                      <span className="badge-count">
                        <i className="fas fa-box"></i> {supplierProducts.length}
                      </span>
                      {expiringCount > 0 && (
                        <span className="badge-expiring">
                          ⚠️ {expiringCount}
                        </span>
                      )}
                      {expiredCount > 0 && (
                        <span className="badge-expired">
                          ❌ {expiredCount}
                        </span>
                      )}
                    </div>
                    <button 
                      className="toggle-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSupplier(supplier.name);
                      }}
                    >
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Contact Details */}
                {(supplier.contact || supplier.email || supplier.address || supplier.notes) && (
                  <div className="supplier-contact-row">
                    {supplier.contact && (
                      <span><i className="fas fa-phone"></i> {supplier.contact}</span>
                    )}
                    {supplier.email && (
                      <span><i className="fas fa-envelope"></i> {supplier.email}</span>
                    )}
                    {supplier.address && (
                      <span><i className="fas fa-map-marker-alt"></i> {supplier.address}</span>
                    )}
                    {supplier.notes && (
                      <span className="notes-text"><i className="fas fa-info-circle"></i> {supplier.notes}</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="supplier-actions-modern">
                  <button 
                    className="action-btn-modern primary"
                    onClick={() => handleAddProductForSupplier(supplier.name)}
                  >
                    <i className="fas fa-plus"></i> Add Product
                  </button>
                  <button 
                    className="action-btn-modern secondary"
                    onClick={() => handleViewProducts(supplier.name)}
                  >
                    <i className="fas fa-eye"></i> View Products
                  </button>
                  <button 
                    className="action-btn-modern edit"
                    onClick={() => openEditModal(supplier)}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button 
                    className="action-btn-modern delete"
                    onClick={() => handleDeleteSupplier(supplier)}
                    disabled={actionLoading === supplier.id}
                  >
                    {actionLoading === supplier.id ? (
                      <i className="fas fa-spinner fa-pulse"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                </div>

                {/* Products List (Expanded) */}
                {isExpanded && (
                  <div className="supplier-products-expanded-modern">
                    <div className="products-header-modern">
                      <span className="products-title">
                        <i className="fas fa-box"></i> Products ({supplierProducts.length})
                      </span>
                      {expiringCount > 0 && (
                        <span className="expiring-badge">⚠️ {expiringCount} expiring soon</span>
                      )}
                      {lowStockCount > 0 && (
                        <span className="lowstock-badge">📉 {lowStockCount} low stock</span>
                      )}
                    </div>
                    
                    {supplierProducts.length > 0 ? (
                      <div className="products-list-modern">
                        {supplierProducts.map(product => (
                          <div key={product.id} className="product-item-modern">
                            <div className="product-info-left">
                              <span className="product-name-modern">{product.name}</span>
                              <span className="product-stock-modern">{product.stock} units</span>
                            </div>
                            <div className="product-info-right">
                              <span className={`product-expiry-modern ${product.daysLeft <= 0 ? 'expired' : product.daysLeft <= 3 ? 'critical' : product.daysLeft <= 7 ? 'warning' : ''}`}>
                                {product.daysLeft <= 0 ? 'Expired' : `${product.daysLeft} days`}
                              </span>
                              {product.flashSaleActive && product.flashSaleDiscount && (
                                <span className="flash-badge">🔥 {product.flashSaleDiscount}</span>
                              )}
                              <button 
                                className="goto-product-btn"
                                onClick={() => {
                                  navigate('/inventory');
                                  localStorage.setItem('shelflife_filter_supplier', supplier.name);
                                }}
                                title="View in inventory"
                              >
                                <i className="fas fa-arrow-right"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-products-modern">No products from this supplier yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-plus-circle"></i> Add New Supplier</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleAddSupplier}>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Enter supplier name" 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number</label>
                  <input 
                    type="text" 
                    value={formData.contact} 
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })} 
                    placeholder="+94 77 123 4567" 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="supplier@example.com" 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  placeholder="Supplier address" 
                />
              </div>
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                  {renderStars(formData.rating, true, (val) => setFormData({ ...formData, rating: val }))}
                  <span className="rating-value">{formData.rating} / 5</span>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  rows="2" 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                  placeholder="Additional notes about this supplier" 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={actionLoading === 'add'}>
                  {actionLoading === 'add' ? (
                    <><i className="fas fa-spinner fa-pulse"></i> Adding...</>
                  ) : (
                    'Add Supplier'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-edit"></i> Edit Supplier</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleUpdateSupplier}>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Enter supplier name" 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number</label>
                  <input 
                    type="text" 
                    value={formData.contact} 
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })} 
                    placeholder="+94 77 123 4567" 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="supplier@example.com" 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  placeholder="Supplier address" 
                />
              </div>
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                  {renderStars(formData.rating, true, (val) => setFormData({ ...formData, rating: val }))}
                  <span className="rating-value">{formData.rating} / 5</span>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  rows="2" 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                  placeholder="Additional notes about this supplier" 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={actionLoading === 'edit'}>
                  {actionLoading === 'edit' ? (
                    <><i className="fas fa-spinner fa-pulse"></i> Updating...</>
                  ) : (
                    'Update Supplier'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;