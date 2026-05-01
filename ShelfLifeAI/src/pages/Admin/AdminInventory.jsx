// src/pages/Admin/AdminInventory.jsx
import { useState, useEffect } from 'react'
import { db, collection, getDocs } from '../../firebaseConfig'
import './Admin.css'

function AdminInventory() {
  const [allProducts, setAllProducts] = useState([])
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllInventory()
  }, [])

  const loadAllInventory = async () => {
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      
      // Load inventory from localStorage (in production, from Firestore)
      const allItems = [];
      
      usersData.forEach(user => {
        const userInventory = localStorage.getItem(`shelflife_inventory_${user.uid}`);
        if (userInventory) {
          const inventory = JSON.parse(userInventory);
          inventory.forEach(item => {
            allItems.push({
              ...item,
              ownerName: user.name,
              ownerEmail: user.email,
              ownerId: user.uid,
              ownerAvatar: user.name?.charAt(0) || 'U'
            });
          });
        }
      });
      
      setAllProducts(allItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                          (filterStatus === 'expiring' && product.daysLeft <= 7 && product.daysLeft > 0) ||
                          (filterStatus === 'critical' && product.daysLeft <= 3 && product.daysLeft > 0) ||
                          (filterStatus === 'expired' && product.daysLeft <= 0);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: allProducts.length,
    expiring: allProducts.filter(p => p.daysLeft <= 7 && p.daysLeft > 0).length,
    critical: allProducts.filter(p => p.daysLeft <= 3 && p.daysLeft > 0).length,
    expired: allProducts.filter(p => p.daysLeft <= 0).length,
    totalValue: allProducts.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.stock || 0)), 0)
  }

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
          <h1>
            <i className="fas fa-globe"></i>
            Global Inventory
          </h1>
          <p>View all products across all stores</p>
        </div>
        <div className="admin-inventory-stats">
          <div className="admin-stat-chip">
            <i className="fas fa-box"></i>
            <span>{stats.total} Products</span>
          </div>
          <div className="admin-stat-chip warning">
            <i className="fas fa-clock"></i>
            <span>{stats.expiring} Expiring</span>
          </div>
          <div className="admin-stat-chip critical">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{stats.critical} Critical</span>
          </div>
          <div className="admin-stat-chip danger">
            <i className="fas fa-skull"></i>
            <span>{stats.expired} Expired</span>
          </div>
          <div className="admin-stat-chip success">
            <i className="fas fa-chart-line"></i>
            <span>LKR {stats.totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search products or store owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="admin-filter-buttons">
          <button className={`admin-filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All</button>
          <button className={`admin-filter-btn ${filterStatus === 'expiring' ? 'active' : ''}`} onClick={() => setFilterStatus('expiring')}>Expiring Soon</button>
          <button className={`admin-filter-btn ${filterStatus === 'critical' ? 'active' : ''}`} onClick={() => setFilterStatus('critical')}>Critical</button>
          <button className={`admin-filter-btn ${filterStatus === 'expired' ? 'active' : ''}`} onClick={() => setFilterStatus('expired')}>Expired</button>
        </div>
      </div>
      
      <div className="admin-products-table-container">
        <table className="admin-products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Store</th>
              <th>Batch</th>
              <th>Stock</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr key={`${product.ownerId}-${product.id}-${index}`} className={product.daysLeft <= 0 ? 'expired-row' : product.daysLeft <= 3 ? 'critical-row' : product.daysLeft <= 7 ? 'warning-row' : ''}>
                <td>
                  <div className="admin-product-name">
                    <i className="fas fa-box"></i>
                    <span>{product.name}</span>
                  </div>
                </td>
                <td>
                  <div className="admin-store-info">
                    <div className="admin-store-avatar">{product.ownerAvatar}</div>
                    <div>
                      <div className="admin-store-name">{product.ownerName}</div>
                      <div className="admin-store-email">{product.ownerEmail}</div>
                    </div>
                  </div>
                </td>
                <td><code className="admin-batch-code">{product.batch}</code></td>
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
                <td>
                  <button className="admin-view-product-btn" title="View Details">
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredProducts.length === 0 && (
          <div className="admin-empty-state">
            <i className="fas fa-box-open"></i>
            <p>No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminInventory