import './DashboardTable.css'

function DashboardTable({ inventory, onFlashSale }) {
  const getStatusClass = (status, daysLeft) => {
    if (status === 'expired' || (daysLeft !== undefined && daysLeft < 0)) return 'status-critical'
    if (daysLeft !== undefined && daysLeft <= 3) return 'status-warning'
    if (daysLeft !== undefined && daysLeft <= 7) return 'status-warning'
    return 'status-good'
  }

  const getStatusText = (status, daysLeft) => {
    if (status === 'expired' || (daysLeft !== undefined && daysLeft < 0)) return 'Expired'
    if (daysLeft !== undefined && daysLeft <= 3) return 'Critical (48h)'
    if (daysLeft !== undefined && daysLeft <= 7) return 'Near Expiry'
    return 'Healthy'
  }

  const getExpiringCount = () => {
    if (!inventory) return 0
    return inventory.filter(item => 
      item.daysLeft !== undefined && 
      item.daysLeft <= 7 && 
      item.daysLeft > 0
    ).length
  }

  const getPotentialLoss = () => {
    if (!inventory) return 0
    const expiringItems = inventory.filter(item => 
      item.daysLeft !== undefined && 
      item.daysLeft <= 7 && 
      item.daysLeft > 0
    )
    return expiringItems.length * 450
  }

  if (!inventory || inventory.length === 0) {
    return (
      <div className="dashboard-wrap">
        <div className="dash-header">
          <div className="dash-title">
            <i className="fas fa-chart-line"></i> Smart Inventory Monitor
          </div>
          <div className="live-badge">
            <span className="live-dot"></span> Live Sync | AI Alerts
          </div>
        </div>
        <div className="ai-insight">
          <i className="fas fa-robot"></i>
          <strong>AI Insight:</strong> No inventory data available. Please add products to get started.
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-wrap">
      <div className="dash-header">
        <div className="dash-title">
          <i className="fas fa-chart-line"></i> Smart Inventory Monitor
        </div>
        <div className="live-badge">
          <span className="live-dot"></span> Live Sync | AI Alerts
        </div>
      </div>
      
      <div className="table-scroll">
        <table className="inv-table">
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
              const isExpired = item.status === 'expired' || (item.daysLeft !== undefined && item.daysLeft < 0)
              const daysLeftValue = item.daysLeft !== undefined ? item.daysLeft : 999
              const expiryDateValue = item.expiryDate ? new Date(item.expiryDate) : new Date()
              
              return (
                <tr key={item.id}>
                  <td className="cell-product">{item.name || 'Unknown'}</td>
                  <td className="cell-batch">{item.batch || 'N/A'}</td>
                  <td className="cell-date">{expiryDateValue.toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status, daysLeftValue)}`}>
                      {daysLeftValue <= 3 && daysLeftValue > 0 && <span className="critical-dot"></span>}
                      {getStatusText(item.status, daysLeftValue)}
                    </span>
                  </td>
                  <td>
                    {item.suggestion && (
                      <span className="suggestion-pill">
                        <i className="fas fa-bullhorn"></i> {item.suggestion}
                      </span>
                    )}
                  </td>
                  <td>
                    {!isExpired && daysLeftValue <= 7 && onFlashSale && (
                      <button 
                        onClick={() => onFlashSale(item.id)} 
                        className="btn-flash"
                      >
                        <i className="fas fa-tags"></i> Flash Sale
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
        <strong>AI Insight:</strong> <span className="highlight">{getExpiringCount()} products</span> near expiry → 
        potential loss ~ <span className="highlight">LKR {getPotentialLoss().toLocaleString()}</span>. 
        Flash sale recommended for expiring items.
      </div>
    </div>
  )
}

export default DashboardTable