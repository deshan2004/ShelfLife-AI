// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { api } from '../../services/apiService'
import './Admin.css'

function AdminDashboard({ admin }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalScans: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    expiredTrials: 0,
    recentUsers: []
  })
  const [loading, setLoading] = useState(true)
  const [seedLoading, setSeedLoading] = useState(false)

  // Load dashboard stats from API
  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await api.getAdminStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
      alert('Failed to load dashboard data. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // Seed test data
  const seedDatabase = async () => {
    if (!window.confirm('Add test data to the database? This will create 3 test users with inventory and subscriptions.')) return
    try {
      setSeedLoading(true)
      const result = await api.seedData()
      if (result.success) {
        alert(`✅ Test data added!\n\n${result.users} users created\n\nRefresh to see data.`)
        await loadStats()
      } else {
        alert('❌ Failed to add test data: ' + result.message)
      }
    } catch (error) {
      console.error('Seed error:', error)
      alert('❌ Error seeding database. Make sure backend is running.')
    } finally {
      setSeedLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: '#3b82f6', change: '+12%', bg: 'rgba(59, 130, 246, 0.1)' },
    { title: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: 'fa-boxes', color: '#39e75f', change: '+8%', bg: 'rgba(57, 231, 95, 0.1)' },
    { title: 'Total Scans', value: stats.totalScans.toLocaleString(), icon: 'fa-qrcode', color: '#f59e0b', change: '+23%', bg: 'rgba(245, 158, 11, 0.1)' },
    { title: 'Monthly Revenue', value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: 'fa-chart-line', color: '#8b5cf6', change: '+15%', bg: 'rgba(139, 92, 246, 0.1)' },
    { title: 'Active Subs', value: stats.activeSubscriptions, icon: 'fa-check-circle', color: '#22c55e', change: '+5%', bg: 'rgba(34, 197, 94, 0.1)' },
    { title: 'Trial Users', value: stats.trialUsers, icon: 'fa-hourglass-half', color: '#f97316', change: '+18%', bg: 'rgba(249, 115, 22, 0.1)' },
  ]

  const growthData = [45, 62, 58, 78, 85, 92, 110, 125, 140, 158, 175, 195]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const pieData = [
    { name: 'Trial', percentage: stats.trialUsers > 0 ? Math.round((stats.trialUsers / (stats.totalUsers || 1)) * 100) : 60, color: '#39e75f' },
    { name: 'Active', percentage: stats.activeSubscriptions > 0 ? Math.round((stats.activeSubscriptions / (stats.totalUsers || 1)) * 100) : 25, color: '#3b82f6' },
    { name: 'Expired', percentage: stats.expiredTrials > 0 ? Math.round((stats.expiredTrials / (stats.totalUsers || 1)) * 100) : 15, color: '#ef4444' }
  ]

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1><i className="fas fa-chart-pie"></i> Dashboard Overview</h1>
          <p>Welcome back, {admin?.name || 'Admin'}! Here's what's happening with your platform.</p>
        </div>
        <div className="admin-header-right">
          <button 
            className="admin-primary-btn" 
            onClick={seedDatabase} 
            disabled={seedLoading}
            style={{ marginRight: '1rem' }}
          >
            {seedLoading ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-database"></i>}
            {seedLoading ? 'Adding...' : 'Add Test Data'}
          </button>
          <div className="admin-date float-animation">
            <i className="fas fa-calendar"></i>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: stat.bg }}>
              <i className={`fas ${stat.icon}`} style={{ color: stat.color }}></i>
            </div>
            <div className="admin-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
              <span className="admin-stat-change positive">
                <i className="fas fa-arrow-up"></i> {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <h3><i className="fas fa-chart-line"></i> User Growth</h3>
          <div className="admin-growth-chart">
            {growthData.map((value, i) => (
              <div key={i} className="admin-chart-bar-wrapper">
                <div className="admin-chart-bar" style={{ height: `${(value / 200) * 100}%` }}>
                  <span>{value}</span>
                </div>
                <span className="admin-chart-label">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-chart-card">
          <h3><i className="fas fa-chart-pie"></i> Subscription Distribution</h3>
          <div className="admin-pie-chart">
            <div className="admin-pie-chart-visual">
              <svg viewBox="0 0 100 100" className="admin-pie-svg">
                {pieData.map((item, i) => {
                  const circumference = 2 * Math.PI * 40
                  const offset = circumference - (item.percentage / 100) * circumference
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="20"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                    />
                  )
                })}
              </svg>
            </div>
            <div className="admin-pie-legend">
              {pieData.map((item, i) => (
                <div key={i} className="admin-legend-item">
                  <span className="admin-legend-color" style={{ background: item.color }}></span>
                  <span>{item.name} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-recent-section">
        <div className="admin-recent-users">
          <h3><i className="fas fa-users"></i> Recent Users</h3>
          <div className="admin-users-list">
            {stats.recentUsers?.length > 0 ? (
              stats.recentUsers.map((user, index) => (
                <div key={index} className="admin-user-item">
                  <div className="admin-user-avatar">{user.name?.charAt(0) || 'U'}</div>
                  <div className="admin-user-details">
                    <div className="admin-user-name">{user.name}</div>
                    <div className="admin-user-email">{user.email}</div>
                  </div>
                  <div className="admin-user-joined">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-empty-state">
                <p>No users found. Click "Add Test Data" to populate.</p>
              </div>
            )}
          </div>
        </div>
        <div className="admin-recent-activities">
          <h3><i className="fas fa-history"></i> Recent Activities</h3>
          <div className="admin-activities-list">
            <div className="admin-activity-item">
              <div className="admin-activity-icon user"><i className="fas fa-user-plus"></i></div>
              <div className="admin-activity-content">
                <div className="admin-activity-user">System</div>
                <div className="admin-activity-action">Dashboard loaded successfully</div>
              </div>
              <div className="admin-activity-time">Just now</div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon inventory"><i className="fas fa-box"></i></div>
              <div className="admin-activity-content">
                <div className="admin-activity-user">Admin</div>
                <div className="admin-activity-action">Viewed dashboard</div>
              </div>
              <div className="admin-activity-time">1 min ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard