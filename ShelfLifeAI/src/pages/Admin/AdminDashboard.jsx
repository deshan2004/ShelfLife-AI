// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { db, collection, getDocs, query, orderBy, limit } from '../../firebaseConfig'
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
      // Load users from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Load subscriptions
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptions = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate stats
      let totalProducts = 0;
      users.forEach(user => {
        const userInventory = localStorage.getItem(`shelflife_inventory_${user.uid}`);
        if (userInventory) {
          const inventory = JSON.parse(userInventory);
          totalProducts += inventory.length;
        }
      });
      
      const activeSubs = subscriptions.filter(s => s.status === 'active').length;
      const trialUsers = subscriptions.filter(s => s.status === 'trial_active').length;
      const expiredTrials = subscriptions.filter(s => s.status === 'trial_expired').length;
      
      // Calculate revenue (mock - in production get from payments)
      const totalRevenue = activeSubs * 5900;
      
      setStats({
        totalUsers: users.length,
        totalProducts: totalProducts,
        totalScans: Math.floor(Math.random() * 500) + 200,
        totalRevenue: totalRevenue,
        activeSubscriptions: activeSubs,
        trialUsers: trialUsers,
        expiredTrials: expiredTrials
      });
      
      // Get recent users
      const recentUsersList = users.slice(-5).reverse();
      setRecentUsers(recentUsersList);
      
      // Mock recent activities
      setRecentActivities([
        { id: 1, user: 'John Doe', action: 'Signed up', time: '2 minutes ago', type: 'user', icon: 'fa-user-plus' },
        { id: 2, user: 'Sarah Smith', action: 'Upgraded to Professional', time: '1 hour ago', type: 'subscription', icon: 'fa-crown' },
        { id: 3, user: 'Mike Johnson', action: 'Added 15 products', time: '3 hours ago', type: 'inventory', icon: 'fa-box' },
        { id: 4, user: 'Emily Brown', action: 'Started free trial', time: '5 hours ago', type: 'user', icon: 'fa-hourglass-start' },
        { id: 5, user: 'David Wilson', action: 'Processed payment', time: 'Yesterday', type: 'payment', icon: 'fa-credit-card' },
      ]);
      
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

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>
            <i className="fas fa-chart-pie"></i>
            Dashboard Overview
          </h1>
          <p>Welcome back, {admin?.name || 'Admin'}! Here's what's happening with your platform.</p>
        </div>
        <div className="admin-header-right">
          <div className="admin-date">
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
              <span className="admin-stat-change positive">{stat.change}</span>
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
          <div className="admin-chart-container">
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
        </div>
        
        <div className="admin-chart-card">
          <h3>
            <i className="fas fa-chart-pie"></i>
            Subscription Distribution
          </h3>
          <div className="admin-pie-chart">
            <div className="admin-pie-segments">
              <div className="admin-pie-segment" style={{ width: '60%', background: 'linear-gradient(90deg, #39e75f, #22c55e)' }}>
                <span>Trial (60%)</span>
              </div>
              <div className="admin-pie-segment" style={{ width: '25%', background: 'linear-gradient(90deg, #3b82f6, #2563eb)' }}>
                <span>Basic (25%)</span>
              </div>
              <div className="admin-pie-segment" style={{ width: '10%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }}>
                <span>Pro (10%)</span>
              </div>
              <div className="admin-pie-segment" style={{ width: '5%', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}>
                <span>Enterprise (5%)</span>
              </div>
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
            {recentActivities.map(activity => (
              <div key={activity.id} className="admin-activity-item">
                <div className={`admin-activity-icon ${activity.type}`}>
                  <i className={`fas ${activity.icon}`}></i>
                </div>
                <div className="admin-activity-content">
                  <div className="admin-activity-user">{activity.user}</div>
                  <div className="admin-activity-action">{activity.action}</div>
                </div>
                <div className="admin-activity-time">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard