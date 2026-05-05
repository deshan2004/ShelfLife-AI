// src/pages/Admin/AdminAnalytics.jsx
import { useState, useEffect } from 'react'
import './Admin.css'

function AdminAnalytics() {
  const [period, setPeriod] = useState('month')
  const [analytics, setAnalytics] = useState({
    revenueData: [],
    userGrowth: [],
    topProducts: [],
    categoryData: []
  })

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = () => {
    // Revenue data by month
    const revenueByMonth = {
      week: [12500, 14200, 13800, 15600, 16800, 17200, 18900],
      month: [45200, 49800, 52300, 58700, 62100, 68900, 74500, 79800, 84200, 89100, 93400, 98500],
      year: [589000, 623000, 678000, 745000, 812000, 891000]
    }
    
    const userGrowthData = {
      week: [12, 15, 18, 22, 25, 28, 32],
      month: [45, 62, 78, 95, 112, 128, 145, 162, 178, 195, 212, 228],
      year: [156, 245, 389, 512, 678, 845]
    }
    
    setAnalytics({
      revenueData: revenueByMonth[period],
      userGrowth: userGrowthData[period],
      topProducts: [
        { name: 'Fresh Milk', count: 1245, revenue: 435750 },
        { name: 'Greek Yogurt', count: 989, revenue: 217580 },
        { name: 'Wheat Bread', count: 856, revenue: 128400 },
        { name: 'Canned Beans', count: 742, revenue: 237440 },
        { name: 'Tomato Ketchup', count: 598, revenue: 269100 }
      ],
      categoryData: [
        { name: 'Dairy', value: 35, color: '#39e75f' },
        { name: 'Bakery', value: 20, color: '#f59e0b' },
        { name: 'Canned', value: 18, color: '#3b82f6' },
        { name: 'Beverages', value: 15, color: '#8b5cf6' },
        { name: 'Other', value: 12, color: '#ec489a' }
      ]
    })
  }

  const maxRevenue = Math.max(...analytics.revenueData)
  const maxUsers = Math.max(...analytics.userGrowth)

  const getPeriodLabels = () => {
    if (period === 'week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    if (period === 'month') return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return ['2022', '2023', '2024', '2025', '2026', '2027']
  }

  return (
    <div className="admin-analytics">
      <div className="admin-page-header">
        <div>
          <h1>
            <i className="fas fa-chart-line"></i>
            Analytics & Insights
          </h1>
          <p>Platform-wide analytics and performance metrics</p>
        </div>
        <div className="admin-period-selector">
          <button className={`admin-period-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>Week</button>
          <button className={`admin-period-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Month</button>
          <button className={`admin-period-btn ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>Year</button>
        </div>
      </div>
      
      <div className="admin-analytics-grid">
        <div className="admin-analytics-card full-width">
          <h3>
            <i className="fas fa-chart-line"></i>
            Revenue Growth
          </h3>
          <div className="admin-revenue-chart">
            <div className="admin-chart-bars">
              {analytics.revenueData.map((value, i) => (
                <div key={i} className="admin-chart-bar-wrapper">
                  <div 
                    className="admin-revenue-bar" 
                    style={{ height: `${(value / maxRevenue) * 100}%` }}
                  >
                    <span>LKR {(value / 1000).toFixed(0)}k</span>
                  </div>
                  <span className="admin-chart-label">{getPeriodLabels()[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="admin-analytics-card">
          <h3>
            <i className="fas fa-users"></i>
            User Growth
          </h3>
          <div className="admin-user-chart">
            <div className="admin-chart-bars">
              {analytics.userGrowth.map((value, i) => (
                <div key={i} className="admin-chart-bar-wrapper">
                  <div 
                    className="admin-user-bar" 
                    style={{ height: `${(value / maxUsers) * 100}%` }}
                  >
                    <span>{value}</span>
                  </div>
                  <span className="admin-chart-label">{getPeriodLabels()[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="admin-analytics-card">
          <h3>
            <i className="fas fa-chart-pie"></i>
            Category Distribution
          </h3>
          <div className="admin-category-chart">
            {analytics.categoryData.map((category, i) => (
              <div key={i} className="admin-category-item">
                <div className="admin-category-header">
                  <span className="admin-category-name">
                    <span className="admin-category-dot" style={{ background: category.color }}></span>
                    {category.name}
                  </span>
                  <span className="admin-category-value">{category.value}%</span>
                </div>
                <div className="admin-category-bar">
                  <div className="admin-category-fill" style={{ width: `${category.value}%`, background: category.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="admin-top-products">
        <h3>
          <i className="fas fa-trophy"></i>
          Top Selling Products
        </h3>
        <div className="admin-products-table-container">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProducts.map((product, i) => (
                <tr key={i}>
                  <td>
                    <div className="admin-product-rank">
                      <span className={`admin-rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                        #{i + 1}
                      </span>
                      {product.name}
                    </div>
                  </td>
                  <td>{product.count.toLocaleString()}</td>
                  <td>LKR {product.revenue.toLocaleString()}</td>
                  <td>
                    <div className="admin-performance-bar">
                      <div className="admin-performance-fill" style={{ width: `${(product.revenue / analytics.topProducts[0].revenue) * 100}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="admin-key-metrics">
        <h3>
          <i className="fas fa-chart-simple"></i>
          Key Metrics Summary
        </h3>
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <div className="admin-metric-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Average Order Value</span>
              <span className="admin-metric-value">LKR 4,250</span>
              <span className="admin-metric-change positive">+12% vs last month</span>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="admin-metric-icon">
              <i className="fas fa-percent"></i>
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Conversion Rate</span>
              <span className="admin-metric-value">24.8%</span>
              <span className="admin-metric-change positive">+5.2% vs last month</span>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="admin-metric-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Avg. Response Time</span>
              <span className="admin-metric-value">2.4 min</span>
              <span className="admin-metric-change positive">-18% vs last month</span>
            </div>
          </div>
          <div className="admin-metric-card">
            <div className="admin-metric-icon">
              <i className="fas fa-smile"></i>
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Customer Satisfaction</span>
              <span className="admin-metric-value">4.92/5</span>
              <span className="admin-metric-change positive">+0.08 vs last month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics