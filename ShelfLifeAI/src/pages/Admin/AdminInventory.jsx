// src/pages/Admin/AdminInventory.jsx
import { useState, useEffect } from 'react'
import { api } from '../../services/apiService'
import './Admin.css'

function AdminInventory({ admin }) {
  const [shops, setShops] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedShops, setExpandedShops] = useState({})

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const data = await api.getAdminInventoryByShop()
      const filtered = data.filter(shop => shop.products.length > 0)
      setShops(filtered)
      if (filtered.length > 0) {
        setExpandedShops({ [filtered[0].shopId]: true })
      }
    } catch (error) {
      console.error('Error loading inventory:', error)
      alert('Failed to load inventory. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const toggleShop = (shopId) => {
    setExpandedShops(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }))
  }

  const filteredShops = shops.filter(shop => {
    const search = searchTerm.toLowerCase()
    return shop.shopName.toLowerCase().includes(search) ||
           shop.ownerName.toLowerCase().includes(search) ||
           shop.products.some(p => p.name?.toLowerCase().includes(search))
  })

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading global inventory...</p>
      </div>
    )
  }

  return (
    <div className="admin-inventory">
      <div className="admin-page-header">
        <div>
          <h1><i className="fas fa-globe"></i> Global Inventory</h1>
          <p>View all products grouped by store/shop</p>
        </div>
        <div className="admin-inventory-stats">
          <div className="admin-stat-chip"><i className="fas fa-store"></i> <span>{shops.length} Shops</span></div>
          <div className="admin-stat-chip"><i className="fas fa-box"></i> <span>{shops.reduce((sum, s) => sum + s.products.length, 0)} Products</span></div>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Search by shop name, owner, or product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="admin-shop-inventory-container">
        {filteredShops.map(shop => (
          <div key={shop.shopId} className="admin-shop-card">
            <div className="admin-shop-header" onClick={() => toggleShop(shop.shopId)}>
              <div className="admin-shop-info">
                <div className="admin-shop-avatar">{shop.ownerName?.charAt(0) || 'S'}</div>
                <div>
                  <h3>{shop.shopName}</h3>
                  <p><i className="fas fa-user"></i> {shop.ownerName} • <i className="fas fa-envelope"></i> {shop.ownerEmail}</p>
                </div>
              </div>
              <div className="admin-shop-stats">
                <span className="admin-stat-chip"><i className="fas fa-box"></i> {shop.products.length} Products</span>
                <i className={`fas fa-chevron-${expandedShops[shop.shopId] ? 'up' : 'down'}`}></i>
              </div>
            </div>
            
            {expandedShops[shop.shopId] && (
              <div className="admin-shop-products">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Batch</th>
                      <th>Supplier</th>
                      <th>Stock</th>
                      <th>Expiry Date</th>
                      <th>Days Left</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shop.products.map((product, index) => (
                      <tr key={index} className={product.daysLeft <= 0 ? 'expired-row' : product.daysLeft <= 3 ? 'critical-row' : product.daysLeft <= 7 ? 'warning-row' : ''}>
                        <td><div className="admin-product-name"><i className="fas fa-box"></i> <span>{product.name}</span></div></td>
                        <td><code className="admin-batch-code">{product.batch}</code></td>
                        <td>{product.supplier}</td>
                        <td>{product.stock} units</td>
                        <td>{product.expiryDate}</td>
                        <td>
                          <span className={`admin-days-badge ${product.daysLeft <= 0 ? 'expired' : product.daysLeft <= 3 ? 'critical' : product.daysLeft <= 7 ? 'warning' : ''}`}>
                            {product.daysLeft > 0 ? `${product.daysLeft} days` : 'Expired'}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-badge ${product.daysLeft <= 0 ? 'expired' : product.daysLeft <= 3 ? 'critical' : product.daysLeft <= 7 ? 'warning' : 'good'}`}>
                            {product.daysLeft <= 0 ? 'Expired' : product.daysLeft <= 3 ? 'Critical' : product.daysLeft <= 7 ? 'Near Expiry' : 'Healthy'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {filteredShops.length === 0 && (
          <div className="admin-empty-state-large">
            <i className="fas fa-store-alt"></i>
            <h3>No shops with products found</h3>
            <p>Click "Add Test Data" to populate inventory across multiple shops</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminInventory