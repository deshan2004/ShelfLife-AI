import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import './Pages.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

function Analytics({ inventory }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [analyticsData, setAnalyticsData] = useState({
    totalSaved: 0,
    wasteReduction: 0,
    flashSaleRevenue: 0,
    projectedSavings: 0,
    turnoverRate: 0,
    avgMargin: 0
  })

  useEffect(() => {
    // Calculate analytics based on inventory
    const expiringValue = inventory
      .filter(item => item.daysLeft <= 7 && item.daysLeft > 0)
      .reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0)
    
    const savedValue = expiringValue * 0.7
    const wastePrevented = inventory
      .filter(item => item.daysLeft <= 0)
      .reduce((sum, item) => sum + (item.costPrice * item.stock), 0)
    
    const totalSales = inventory.reduce((sum, item) => sum + (item.sellingPrice * item.stock), 0)
    const totalCost = inventory.reduce((sum, item) => sum + (item.costPrice * item.stock), 0)
    const avgMargin = ((totalSales - totalCost) / totalSales) * 100
    
    setAnalyticsData({
      totalSaved: savedValue,
      wasteReduction: wastePrevented,
      flashSaleRevenue: expiringValue * 0.5,
      projectedSavings: savedValue * 12,
      turnoverRate: (totalSales / totalCost) * 100,
      avgMargin: avgMargin
    })
  }, [inventory])

  // Chart Data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const savingsData = [3200, 4100, 3800, 5200, 4800, 6100, 5800, 7200, 6900, 8400, 7900, analyticsData.totalSaved]
  
  const barChartData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Savings (LKR)',
        data: savingsData,
        backgroundColor: 'rgba(57, 231, 95, 0.8)',
        borderRadius: 8,
      }
    ]
  }

  const categoryData = {
    labels: ['Dairy', 'Bakery', 'Canned', 'Beverages', 'Other'],
    datasets: [
      {
        label: 'Inventory by Category',
        data: [35, 20, 25, 15, 5],
        backgroundColor: [
          'rgba(57, 231, 95, 0.8)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(22, 163, 74, 0.6)',
          'rgba(20, 83, 45, 0.5)',
          'rgba(16, 185, 129, 0.4)',
        ],
      }
    ]
  }

  const wasteData = {
    labels: months.slice(0, 6),
    datasets: [
      {
        label: 'Waste Value (LKR)',
        data: [1200, 800, 600, 400, 300, 200],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.4,
        fill: true,
      }
    ]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#dff0df' } },
      tooltip: { callbacks: { label: (context) => `LKR ${context.raw.toLocaleString()}` } }
    },
    scales: {
      y: { grid: { color: '#162416' }, ticks: { color: '#7aaa7a' } },
      x: { ticks: { color: '#7aaa7a' } }
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#dff0df' } } }
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: '#dff0df' } } },
    scales: {
      y: { grid: { color: '#162416' }, ticks: { color: '#7aaa7a' } },
      x: { ticks: { color: '#7aaa7a' } }
    }
  }

  const getTopExpiringProducts = () => {
    return inventory
      .filter(item => item.daysLeft > 0 && item.daysLeft <= 14)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }

  const getSlowMovingProducts = () => {
    // Simulate slow-moving products based on stock vs days left
    return inventory
      .filter(item => item.daysLeft > 30 && item.stock > 20)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5)
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-chart-pie"></i> Analytics & Insights
          </h1>
          <p className="page-description">Track savings, monitor waste reduction, and optimize inventory performance</p>
        </div>
        <div className="period-selector">
          <button className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`} onClick={() => setSelectedPeriod('week')}>Week</button>
          <button className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`} onClick={() => setSelectedPeriod('month')}>Month</button>
          <button className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`} onClick={() => setSelectedPeriod('year')}>Year</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><i className="fas fa-coins"></i></div>
          <div className="kpi-content">
            <span className="kpi-label">Monthly Savings</span>
            <span className="kpi-value">LKR {analyticsData.totalSaved.toLocaleString()}</span>
            <span className="kpi-change positive"><i className="fas fa-arrow-up"></i> +32% vs last month</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><i className="fas fa-trash-alt"></i></div>
          <div className="kpi-content">
            <span className="kpi-label">Waste Prevented</span>
            <span className="kpi-value">LKR {analyticsData.wasteReduction.toLocaleString()}</span>
            <span className="kpi-change positive"><i className="fas fa-leaf"></i> Environment impact</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><i className="fas fa-tags"></i></div>
          <div className="kpi-content">
            <span className="kpi-label">Flash Sale Revenue</span>
            <span className="kpi-value">LKR {analyticsData.flashSaleRevenue.toLocaleString()}</span>
            <span className="kpi-change"><i className="fas fa-clock"></i> From near-expiry items</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><i className="fas fa-chart-line"></i></div>
          <div className="kpi-content">
            <span className="kpi-label">Projected Annual Savings</span>
            <span className="kpi-value">LKR {analyticsData.projectedSavings.toLocaleString()}</span>
            <span className="kpi-change positive"><i className="fas fa-rocket"></i> ROI: 340%</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Savings Trend</h3>
          <div className="chart-container">
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Inventory by Category</h3>
          <div className="chart-container">
            <Pie data={categoryData} options={pieOptions} />
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Waste Reduction Trend</h3>
          <div className="chart-container">
            <Line data={wasteData} options={lineOptions} />
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Key Metrics</h3>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-name">Inventory Turnover Rate</span>
              <span className="metric-value">{analyticsData.turnoverRate.toFixed(1)}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Average Profit Margin</span>
              <span className="metric-value">{analyticsData.avgMargin.toFixed(1)}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Total SKUs</span>
              <span className="metric-value">{inventory.length}</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Expiring Items (7 days)</span>
              <span className="metric-value">{inventory.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h2><i className="fas fa-lightbulb"></i> Actionable Insights</h2>
        <div className="insights-grid">
          <div className="insight-card warning">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <h4>Critical Items</h4>
              <p>{inventory.filter(i => i.daysLeft <= 3 && i.daysLeft > 0).length} items expiring in 3 days</p>
              <button className="btn-link">View & Take Action →</button>
            </div>
          </div>
          <div className="insight-card success">
            <i className="fas fa-chart-line"></i>
            <div>
              <h4>Top Performing</h4>
              <p>Dairy products show 45% faster turnover this month</p>
              <button className="btn-link">View Details →</button>
            </div>
          </div>
          <div className="insight-card warning">
            <i className="fas fa-clock"></i>
            <div>
              <h4>Near Expiry</h4>
              <p>{getTopExpiringProducts().map(p => p.name).join(', ')}</p>
              <button className="btn-link">Schedule Flash Sale →</button>
            </div>
          </div>
          <div className="insight-card info">
            <i className="fas fa-boxes"></i>
            <div>
              <h4>Slow Moving Stock</h4>
              <p>{getSlowMovingProducts().map(p => p.name).join(', ')}</p>
              <button className="btn-link">Review Ordering →</button>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="roi-calculator-section">
        <h2><i className="fas fa-calculator"></i> ROI Calculator</h2>
        <div className="roi-calculator">
          <div className="roi-inputs">
            <div className="input-group">
              <label>Monthly Subscription (LKR)</label>
              <input type="number" id="subscriptionCost" defaultValue="2500" />
            </div>
            <div className="input-group">
              <label>Monthly Savings (LKR)</label>
              <input type="number" value={analyticsData.totalSaved} readOnly disabled />
            </div>
            <button className="btn-calc-roi" onClick={() => {
              const cost = document.getElementById('subscriptionCost').value
              const savings = analyticsData.totalSaved
              const netProfit = savings - cost
              const roi = ((netProfit / cost) * 100).toFixed(1)
              const payback = (cost / (savings / 30)).toFixed(1)
              alert(`Net Monthly Profit: LKR ${netProfit.toLocaleString()}\nROI: ${roi}%\nPayback Period: ${payback} days`)
            }}>
              Calculate ROI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics