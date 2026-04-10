import { useState } from 'react'
import './DashboardTable.css'

function DashboardTable({ inventory, onFlashSale, onDeleteItem, onUpdateItem }) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const getStatusClass = (daysLeft) => {
    if (daysLeft <= 0) return 'status-critical'
    if (daysLeft <= 3) return 'status-warning'
    if (daysLeft <= 7) return 'status-warning'
    return 'status-good'
  }

  const getStatusText = (daysLeft) => {
    if (daysLeft <= 0) return 'Expired'
    if (daysLeft <= 3) return 'Critical (48h)'
    if (daysLeft <= 7) return 'Near Expiry'
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

  const getCriticalCount = () => {
    if (!inventory) return 0
    return inventory.filter(item => 
      item.daysLeft !== undefined && 
      item.daysLeft <= 3 && 
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
    // Calculate based on actual selling prices
    return expiringItems.reduce((sum, item) => sum + (item.sellingPrice * Math.min(item.stock, 5)), 0)
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setEditValue(item.name)
  }

  const handleSaveEdit = (id) => {
    if (onUpdateItem) {
      onUpdateItem(id, editValue)
    }
    setEditingId(null)
    setEditValue('')
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
        <div className="empty-state">
          <i className="fas fa-box-open"></i>
          <p>No inventory items yet</p>
          <span>Use the scanner to add products</span>
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
              <th>Days Left</th>
              <th>Status</th>
              <th>Smart Action</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const daysLeftValue = item.daysLeft !== undefined ? item.daysLeft : 999
              const expiryDateValue = item.expiryDate ? new Date(item.expiryDate) : new Date()
              const isExpired = daysLeftValue <= 0
              const isCritical = daysLeftValue <= 3 && daysLeftValue > 0
              const isNearExpiry = daysLeftValue <= 7 && daysLeftValue > 3
              
              return (
                <tr key={item.id} className={isExpired ? 'row-expired' : isCritical ? 'row-critical' : isNearExpiry ? 'row-warning' : ''}>
                  <td className="cell-product">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(item.id)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                        className="edit-input"
                        autoFocus
                      />
                    ) : (
                      <span onDoubleClick={() => handleEdit(item)} title="Double-click to edit">
                        {item.name || 'Unknown'}
                      </span>
                    )}
                  </td>
                  <td className="cell-batch">
                    <span className="batch-code">{item.batch || 'N/A'}</span>
                  </td>
                  <td className="cell-date">
                    {expiryDateValue.toLocaleDateString()}
                  </td>
                  <td className="cell-days">
                    <span className={`days-badge ${isExpired ? 'expired' : isCritical ? 'critical' : isNearExpiry ? 'urgent' : ''}`}>
                      {isExpired ? 'Expired' : `${daysLeftValue} day${daysLeftValue !== 1 ? 's' : ''}`}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(daysLeftValue)}`}>
                      {isCritical && <span className="critical-dot"></span>}
                      {getStatusText(daysLeftValue)}
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
                    <div className="action-buttons">
                      {!isExpired && daysLeftValue <= 7 && onFlashSale && (
                        <button 
                          onClick={() => onFlashSale(item.id)} 
                          className="btn-flash"
                          title="Apply flash sale"
                        >
                          <i className="fas fa-tags"></i> Flash Sale
                        </button>
                      )}
                      {onDeleteItem && (
                        <button 
                          onClick={() => onDeleteItem(item.id)} 
                          className="btn-delete"
                          title="Delete item"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="ai-insight">
        <i className="fas fa-robot"></i>
        <strong>AI Insight:</strong> 
        <span className="highlight">{getExpiringCount()} products</span> near expiry 
        {getCriticalCount() > 0 && ` (${getCriticalCount()} critical)`} → 
        potential loss ~ <span className="highlight">LKR {getPotentialLoss().toLocaleString()}</span>. 
        {getExpiringCount() > 0 ? 'Flash sale recommended for expiring items.' : 'No expiring items. Great job!'}
      </div>
    </div>
  )
}

export default DashboardTable