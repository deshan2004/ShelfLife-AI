import './QuickStats.css'

function QuickStats({ inventory }) {
  const totalItems = inventory.reduce((sum, item) => sum + item.stock, 0)
  const totalValue = inventory.reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0)
  const expiringCount = inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length
  const expiredCount = inventory.filter(i => i.daysLeft <= 0).length
  const lowStockCount = inventory.filter(i => i.stock <= i.lowStockThreshold).length

  return (
    <div className="quick-stats">
      <div className="stat-card">
        <div className="stat-icon green">
          <i className="fas fa-box"></i>
        </div>
        <div className="stat-info">
          <h3>{totalItems}</h3>
          <p>Total Units</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon blue">
          <i className="fas fa-rupee-sign"></i>
        </div>
        <div className="stat-info">
          <h3>LKR {totalValue.toLocaleString()}</h3>
          <p>Inventory Value</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon orange">
          <i className="fas fa-clock"></i>
        </div>
        <div className="stat-info">
          <h3>{expiringCount}</h3>
          <p>Expiring Soon</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon red">
          <i className="fas fa-skull-crosswalk"></i>
        </div>
        <div className="stat-info">
          <h3>{expiredCount}</h3>
          <p>Expired</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon yellow">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div className="stat-info">
          <h3>{lowStockCount}</h3>
          <p>Low Stock</p>
        </div>
      </div>
    </div>
  )
}

export default QuickStats