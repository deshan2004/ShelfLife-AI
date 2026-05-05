// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { db, collection, getDocs } from '../../firebaseConfig'
import './Admin.css'

function AdminDashboard({ admin }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalScans: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    expiredTrials: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptions = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let totalProducts = 0;
      for (const user of users) {
        try {
          const inventorySnapshot = await getDocs(collection(db, 'inventory', user.uid, 'items'));
          totalProducts += inventorySnapshot.size;
        } catch (e) {}
      }
      
      const scansSnapshot = await getDocs(collection(db, 'scans'));
      const activeSubs = subscriptions.filter(s => s.status === 'active').length;
      const trialUsers = subscriptions.filter(s => s.status === 'trial_active').length;
      const expiredTrials = subscriptions.filter(s => s.status === 'trial_expired').length;
      
      const revenueMap = { BASIC: 2500, PROFESSIONAL: 5900, ENTERPRISE: 14900 };
      const totalRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (revenueMap[s.planId] || 0), 0);
      
      setStats({
        totalUsers: users.length,
        totalProducts: totalProducts,
        totalScans: scansSnapshot.size,
        totalRevenue: totalRevenue,
        activeSubscriptions: activeSubs,
        trialUsers: trialUsers,
        expiredTrials: expiredTrials
      });
      
      const sortedUsers = [...users].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 5);
      setRecentUsers(sortedUsers);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: '#3b82f6', change: '+12%', bg: 'rgba(59, 130, 246, 0.1)' },
    { title: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: 'fa-boxes', color: '#39e75f', change: '+8%', bg: 'rgba(57, 231, 95, 0.1)' },
    { title: 'Total Scans', value: stats.totalScans.toLocaleString(), icon: 'fa-qrcode', color: '#f59e0b', change: '+23%', bg: 'rgba(245, 158, 11, 0.1)' },
    { title: 'Revenue', value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: 'fa-chart-line', color: '#8b5cf6', change: '+15%', bg: 'rgba(139, 92, 246, 0.1)' },
    { title: 'Active Subs', value: stats.activeSubscriptions, icon: 'fa-check-circle', color: '#22c55e', change: '+5%', bg: 'rgba(34, 197, 94, 0.1)' },
    { title: 'Trial Users', value: stats.trialUsers, icon: 'fa-hourglass-half', color: '#f97316', change: '+18%', bg: 'rgba(249, 115, 22, 0.1)' },
  ]

  const growthData = [45, 62, 58, 78, 85, 92, 110, 125, 140, 158, 175, 195]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const pieData = [
    { name: 'Trial', percentage: 60, color: '#39e75f', strokeDashoffset: 100.48 },
    { name: 'Basic', percentage: 25, color: '#3b82f6', strokeDashoffset: 188.4 },
    { name: 'Pro', percentage: 10, color: '#8b5cf6', strokeDashoffset: 226.08 },
    { name: 'Enterprise', percentage: 5, color: '#f59e0b', strokeDashoffset: 238.64 }
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
          <h1>
            <i className="fas fa-chart-pie"></i>
            Dashboard Overview
          </h1>
          <p>Welcome back, {admin?.name || 'Admin'}! Here's what's happening with your platform.</p>
        </div>
        <div className="admin-header-right">
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
          <h3>
            <i className="fas fa-chart-line"></i>
            User Growth
          </h3>
          <div className="admin-growth-chart">
            {growthData.map((value, i) => (
              <div key={i} className="admin-chart-bar-wrapper">
                <div 
                  className="admin-chart-bar" 
                  style={{ height: `${(value / 200) * 100}%` }}
                >
                  <span>{value}</span>
                </div>
                <span className="admin-chart-label">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="admin-chart-card">
          <h3>
            <i className="fas fa-chart-pie"></i>
            Subscription Distribution
          </h3>
          <div className="admin-pie-chart">
            <div className="admin-pie-chart-visual">
              <svg viewBox="0 0 100 100" className="admin-pie-svg">
                {pieData.map((item, i) => (
                  <circle 
                    key={i}
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="none" 
                    stroke={item.color} 
                    strokeWidth="20" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={item.strokeDashoffset}
                  />
                ))}
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
          <h3>
            <i className="fas fa-users"></i>
            Recent Users
          </h3>
          <div className="admin-users-list">
            {recentUsers.map((user, index) => (
              <div key={index} className="admin-user-item">
                <div className="admin-user-avatar">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="admin-user-details">
                  <div className="admin-user-name">{user.name}</div>
                  <div className="admin-user-email">{user.email}</div>
                </div>
                <div className="admin-user-joined">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="admin-recent-activities">
          <h3>
            <i className="fas fa-history"></i>
            Recent Activities
          </h3>
          <div className="admin-activities-list">
            <div className="admin-activity-item">
              <div className="admin-activity-icon user">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="admin-activity-content">
                <div className="admin-activity-user">System</div>
                <div className="admin-activity-action">Dashboard loaded successfully</div>
              </div>
              <div className="admin-activity-time">Just now</div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon inventory">
                <i className="fas fa-box"></i>
              </div>
              <div className="admin-activity-content">
                <div className="admin-activity-user">Admin</div>
                <div className="admin-activity-action">Viewed analytics dashboard</div>
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