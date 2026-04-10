import './DashboardTable.css'

function DashboardTable({ inventory, onFlashSale }) {
  const getStatusClass = (status, daysLeft) => {
    // Handle undefined or null values
    if (status === 'expired' || (daysLeft !== undefined && daysLeft < 0)) return 'status-critical'
    if (daysLeft !== undefined && daysLeft <= 3) return 'status-warning'
    if (daysLeft !== undefined && daysLeft <= 7) return 'status-warning'
    return 'status-good'
  }

  const getStatusText = (status, daysLeft) => {
    // Handle undefined or null values
    if (status === 'expired' || (daysLeft !== undefined && daysLeft < 0)) return 'Expired'
    if (daysLeft !== undefined && daysLeft <= 3) return '🔥 Critical (48h)'
    if (daysLeft !== undefined && daysLeft <= 7) return '⚠️ Near Expiry'
    return 'Healthy'
  }

  const getExpiringCount = () => {
    return inventory.filter(item => 
      item.daysLeft !== undefined && 
      item.daysLeft <= 7 && 
      item.daysLeft > 0
    ).length
  }

  const getPotentialLoss = () => {
    const expiringItems = inventory.filter(item => 
      item.daysLeft !== undefined && 
      item.daysLeft <= 7 && 
      item.daysLeft > 0
    )
    return expiringItems.length * 450
  }

  // Check if inventory is valid
  if (!inventory || inventory.length === 0) {
    return (
      <div className="dashboard-preview">
        <div className="dashboard-header">
          <h3><i className="fas fa-chart-line"></i> Smart Inventory Monitor</h3>
          <div className="tech-badge"><i className="fas fa-cloud-upload-alt"></i> Live Sync | AI Alerts</div>
        </div>
        <div className="ai-insight">
          <i className="fas fa-robot"></i>
          <strong>AI Insight:</strong> No inventory data available. Please add products to get started.
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-preview">
      <div className="dashboard-header">
        <h3>
          <i className="fas fa-chart-line"></i> Smart Inventory Monitor
        </h3>
        <div className="tech-badge">
          <i className="fas fa-cloud-upload-alt"></i> Live Sync | AI Alerts
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="expiry-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Smart Action</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              // Safely check values with fallbacks
              const isExpired = item.status === 'expired' || (item.daysLeft !== undefined && item.daysLeft < 0)
              const daysLeftValue = item.daysLeft !== undefined ? item.daysLeft : 999
              const expiryDateValue = item.expiryDate ? new Date(item.expiryDate) : new Date()
              
              return (
                <tr key={item.id}>
                  <td className="product-name">{item.name || 'Unknown'}</td>
                  <td>{item.batch || 'N/A'}</td>
                  <td>{expiryDateValue.toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status, daysLeftValue)}`}>
                      {getStatusText(item.status, daysLeftValue)}
                    </span>
                  </td>
                  <td>
                    {item.suggestion && (
                      <span className="action-suggest">
                        <i className="fas fa-bullhorn"></i> {item.suggestion}
                      </span>
                    )}
                  </td>
                  <td>
                    {!isExpired && daysLeftValue <= 7 && onFlashSale && (
                      <button 
                        onClick={() => onFlashSale(item.id)} 
                        className="flash-sale-btn"
                      >
                        <i className="fas fa-tags"></i> Apply Flash Sale
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="ai-insight">
        <i className="fas fa-robot"></i>
        <strong>AI Insight:</strong> {getExpiringCount()} products near expiry → 
        potential loss ~ LKR {getPotentialLoss().toLocaleString()}. 
        Flash sale recommended for expiring items.
      </div>
    </div>
  )
}

export default DashboardTable