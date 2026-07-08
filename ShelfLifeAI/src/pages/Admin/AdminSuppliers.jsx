// src/pages/Admin/AdminSuppliers.jsx
import { useState, useEffect } from 'react'
import './Admin.css'

function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/admin/suppliers')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      console.error('Error loading suppliers:', error)
      showToast('Error loading suppliers', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const search = searchTerm.toLowerCase()
    return supplier.name?.toLowerCase().includes(search) ||
           supplier.ownerName?.toLowerCase().includes(search) ||
           supplier.email?.toLowerCase().includes(search) ||
           supplier.contact?.includes(search)
  })

  const stats = {
    total: suppliers.length,
    avgRating: suppliers.length > 0 
      ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)
      : '—'
  }

  // Rating Stars
  const renderStars = (rating) => {
    return (
      <div className="admin-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`admin-star ${star <= (rating || 0) ? 'filled' : ''}`}>★</span>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading suppliers...</p>
      </div>
    )
  }

  return (
    <div className="admin-suppliers">
      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1><i className="fas fa-truck"></i> All Suppliers</h1>
          <p>View all suppliers across all stores</p>
        </div>
        <div className="admin-stats-chips">
          <div className="admin-stat-chip"><i className="fas fa-building"></i> Total: {stats.total}</div>
          <div className="admin-stat-chip"><i className="fas fa-star"></i> Avg Rating: {stats.avgRating}</div>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by supplier name, store, email, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-suppliers-table-container">
        <table className="admin-suppliers-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Store</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Rating</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier, index) => (
              <tr key={index}>
                <td>
                  <div className="admin-supplier-name">
                    <i className="fas fa-building"></i>
                    <span>{supplier.name}</span>
                  </div>
                </td>
                <td>
                  <div className="admin-store-info">
                    <div className="admin-store-avatar">{supplier.ownerName?.charAt(0) || 'U'}</div>
                    <div>
                      <div className="admin-store-name">{supplier.ownerName}</div>
                      <div className="admin-store-email">{supplier.ownerEmail}</div>
                    </div>
                  </div>
                </td>
                <td>{supplier.contact || '—'}</td>
                <td>{supplier.email || '—'}</td>
                <td>
                  <div className="admin-supplier-rating">
                    {renderStars(supplier.rating)}
                    <span className="admin-rating-text">({supplier.rating || 0})</span>
                  </div>
                </td>
                <td>{supplier.productCount || 0}</td>
                <td>
                  <button className="admin-view-btn" title="View Details">
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSuppliers.length === 0 && (
          <div className="admin-empty-state">
            <i className="fas fa-truck"></i>
            <p>No suppliers found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSuppliers