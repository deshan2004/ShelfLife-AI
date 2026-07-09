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
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    rating: 0,
    notes: ''
  })
  const [highlightSupplier, setHighlightSupplier] = useState(null)

  // ✅ Highlight supplier from navigation state
  useEffect(() => {
    if (location.state?.supplier) {
      setHighlightSupplier(location.state.supplier);
      setTimeout(() => {
        const element = document.getElementById(`supplier-${location.state.supplier}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [location]);

  // ✅ Load suppliers from BACKEND (NOT localStorage first)
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

      // ✅ localStorage is just backup
      localStorage.setItem(`shelflife_suppliers_${user.uid}`, JSON.stringify(list));
    } catch (error) {
      console.error('❌ Load suppliers error:', error);
      setError(error.message || 'Failed to load suppliers');

      // ⚠️ ONLY use localStorage if backend fails
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

  // ✅ Add Supplier
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('❌ Supplier name is required');
      return;
    }

    try {
      const result = await api.addSupplier(user.uid, formData);
      if (result.success) {
        await loadSuppliers(); // Refresh from backend
        showToast(`✅ ${result.supplier.name} added successfully!`);
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Add supplier error:', error);
      showToast(`❌ ${error.message || 'Failed to add supplier'}`);
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
      const result = await api.updateSupplier(user.uid, selectedSupplier.id, formData);
      if (result.success) {
        await loadSuppliers(); // Refresh from backend
        showToast(`✅ ${result.supplier.name} updated successfully!`);
        setShowEditModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Update supplier error:', error);
      showToast(`❌ ${error.message || 'Failed to update supplier'}`);
    }
  };

  // ✅ Delete Supplier
  const handleDeleteSupplier = async (supplier) => {
    if (!window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) return;

    try {
      const result = await api.deleteSupplier(user.uid, supplier.id);
      if (result.success) {
        await loadSuppliers(); // Refresh from backend
        showToast(`🗑️ ${supplier.name} removed successfully!`);
      }
    } catch (error) {
      console.error('Delete supplier error:', error);
      showToast(`❌ ${error.message || 'Failed to delete supplier'}`);
    }
  };

  // ✅ Add Product for this supplier
  const handleAddProductForSupplier = (supplierName) => {
    navigate('/inventory', { state: { supplier: supplierName } });
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
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => editable && onChange && onChange(star)}
            style={{ cursor: editable ? 'pointer' : 'default', fontSize: editable ? '1.5rem' : '1.1rem' }}
          >
            ★
          </span>
        ))}
      </div>
    );
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
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="fas fa-truck"></i> Supplier Management</h1>
          <p className="page-description">Manage your suppliers, track performance, and handle returns</p>
        </div>
        <button className="btn-primary-lg" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus"></i> Add Supplier
        </button>
      </div>

      <div className="stats-grid-inline">
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-building"></i></div>
          <div className="stat-info">
            <span className="stat-number">{suppliers.length}</span>
            <span className="stat-label">Total Suppliers</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-star"></i></div>
          <div className="stat-info">
            <span className="stat-number">
              {suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1) : '—'}
            </span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-icon"><i className="fas fa-box"></i></div>
          <div className="stat-info">
            <span className="stat-number">{inventory?.length || 0}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-truck"></i>
          <p>No suppliers added yet</p>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>Add Your First Supplier</button>
        </div>
      ) : (
        <div className="suppliers-grid">
          {suppliers.map((supplier) => {
            const supplierProducts = (inventory || []).filter(p => p.supplier === supplier.name);
            const isHighlighted = highlightSupplier === supplier.name;
            
            return (
              <div 
                key={supplier.id} 
                id={`supplier-${supplier.name}`}
                className={`supplier-card ${isHighlighted ? 'highlighted' : ''}`}
                style={isHighlighted ? { 
                  borderColor: 'var(--green-neon)',
                  boxShadow: '0 0 30px rgba(57, 231, 95, 0.2)',
                  transition: 'all 0.5s ease'
                } : {}}
              >
                <div className="supplier-card-header">
                  <div className="supplier-info">
                    <i className="fas fa-building"></i>
                    <div>
                      <h3>{supplier.name}</h3>
                      <div className="supplier-rating">
                        {renderStars(supplier.rating || 0)}
                        <span className="rating-text">({supplier.rating || 0})</span>
                      </div>
                    </div>
                  </div>
                  <div className="supplier-actions">
                    <button className="btn-edit" onClick={() => openEditModal(supplier)} title="Edit Supplier">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteSupplier(supplier)} title="Delete Supplier">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="supplier-details">
                  {supplier.contact && <span><i className="fas fa-phone"></i> {supplier.contact}</span>}
                  {supplier.email && <span><i className="fas fa-envelope"></i> {supplier.email}</span>}
                  {supplier.address && <span><i className="fas fa-map-marker-alt"></i> {supplier.address}</span>}
                  {supplier.notes && <span className="supplier-notes"><i className="fas fa-info-circle"></i> {supplier.notes}</span>}
                </div>

                <div className="supplier-products">
                  <div className="supplier-products-header">
                    <span>📦 {supplierProducts.length} Products</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-add-product-supplier"
                        onClick={() => handleAddProductForSupplier(supplier.name)}
                        style={{
                          background: 'linear-gradient(135deg, var(--green-deep), var(--green-neon))',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '4px 12px',
                          color: '#030a03',
                          fontWeight: '600',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fas fa-plus"></i> Add Product
                      </button>
                      <button 
                        className="btn-view-products" 
                        onClick={() => {
                          const filtered = (inventory || []).filter(p => p.supplier === supplier.name);
                          if (filtered.length > 0) {
                            showToast(`📦 ${filtered.length} products from ${supplier.name}`);
                            navigate('/inventory');
                            localStorage.setItem('shelflife_filter_supplier', supplier.name);
                          } else {
                            showToast(`📦 No products yet from ${supplier.name}. Click "Add Product" to add one.`);
                          }
                        }}
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  {supplierProducts.length > 0 ? (
                    <div className="product-tags">
                      {supplierProducts.slice(0, 5).map(p => (
                        <span key={p.id} className="product-tag">{p.name}</span>
                      ))}
                      {supplierProducts.length > 5 && <span className="product-tag more">+{supplierProducts.length - 5} more</span>}
                    </div>
                  ) : (
                    <p className="no-products">No products from this supplier yet</p>
                  )}
                </div>
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
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter supplier name" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="+94 77 123 4567" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="supplier@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Supplier address" />
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
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes about this supplier" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Add Supplier</button>
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
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter supplier name" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="+94 77 123 4567" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="supplier@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Supplier address" />
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
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes about this supplier" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Update Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;