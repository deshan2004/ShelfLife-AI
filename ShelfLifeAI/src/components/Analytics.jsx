import { useState, useEffect } from 'react'
import './Analytics.css'

function Analytics({ inventory, monthlySales = 125000 }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [analyticsData, setAnalyticsData] = useState({
    totalSaved: 0,
    wasteReduction: 0,
    flashSaleRevenue: 0,
    projectedSavings: 0
  })

  useEffect(() => {
    // Calculate analytics based on inventory
    const expiringValue = inventory
      .filter(item => item.daysLeft <= 7 && item.daysLeft > 0)
      .reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0)
    
    const savedValue = expiringValue * 0.7 // 70% recovery through flash sales
    const wastePrevented = inventory
      .filter(item => item.daysLeft <= 0)
      .reduce((sum, item) => sum + (item.costPrice * item.stock), 0)
    
    setAnalyticsData({
      totalSaved: savedValue,
      wasteReduction: wastePrevented,
      flashSaleRevenue: expiringValue * 0.5,
      projectedSavings: savedValue * 12
    })
  }, [inventory])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const savingsData = [3200, 4100, 3800, 5200, 4800, 6100, 5800, 7200, 6900, 8400, 7900, analyticsData.totalSaved]

  return (
    <div className="analytics-section">
      <div className="analytics-header">
        <h2 className="section-title">
          <i className="fas fa-chart-pie"></i> Financial Analytics
        </h2>
        <div className="period-selector">
          <button 
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            Week
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Month
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card savings-card">
          <div className="stat-icon">
            <i className="fas fa-coins"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Monthly Savings</span>
            <span className="stat-value">LKR {analyticsData.totalSaved.toLocaleString()}</span>
            <span className="stat-change positive">
              <i className="fas fa-arrow-up"></i> +32% from last month
            </span>
          </div>
        </div>

        <div className="stat-card waste-card">
          <div className="stat-icon">
            <i className="fas fa-trash-alt"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Waste Prevented</span>
            <span className="stat-value">LKR {analyticsData.wasteReduction.toLocaleString()}</span>
            <span className="stat-change positive">
              <i className="fas fa-leaf"></i> Environment saved
            </span>
          </div>
        </div>

        <div className="stat-card revenue-card">
          <div className="stat-icon">
            <i className="fas fa-tags"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Flash Sale Revenue</span>
            <span className="stat-value">LKR {analyticsData.flashSaleRevenue.toLocaleString()}</span>
            <span className="stat-change">
              <i className="fas fa-clock"></i> From near-expiry items
            </span>
          </div>
        </div>

        <div className="stat-card roi-card">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Projected Annual Savings</span>
            <span className="stat-value">LKR {analyticsData.projectedSavings.toLocaleString()}</span>
            <span className="stat-change positive">
              <i className="fas fa-rocket"></i> ROI: 340%
            </span>
          </div>
        </div>
      </div>

      {/* Savings Chart */}
      <div className="chart-container">
        <h3>Monthly Savings Trend</h3>
        <div className="bar-chart">
          {savingsData.slice(0, 12).map((value, index) => (
            <div key={index} className="bar-wrapper">
              <div 
                className="bar" 
                style={{ height: `${(value / Math.max(...savingsData)) * 100}%` }}
              >
                <span className="bar-value">LKR {value.toLocaleString()}</span>
              </div>
              <span className="bar-label">{months[index]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="roi-calculator">
        <h3><i className="fas fa-calculator"></i> ROI Calculator</h3>
        <div className="roi-inputs">
          <div className="input-group">
            <label>Monthly Subscription (LKR)</label>
            <input type="number" defaultValue="2500" id="subscriptionCost" />
          </div>
          <div className="input-group">
            <label>Monthly Savings (LKR)</label>
            <input type="number" value={analyticsData.totalSaved} readOnly disabled />
          </div>
          <button 
            className="btn-calc-roi"
            onClick={() => {
              const cost = document.getElementById('subscriptionCost').value
              const savings = analyticsData.totalSaved
              const netProfit = savings - cost
              const roi = ((netProfit / cost) * 100).toFixed(1)
              alert(`Net Monthly Profit: LKR ${netProfit.toLocaleString()}\nROI: ${roi}%\nPayback Period: ${(cost / (savings / 30)).toFixed(1)} days`)
            }}
          >
            Calculate ROI
          </button>
        </div>
      </div>
    </div>
  )
}

export default Analytics