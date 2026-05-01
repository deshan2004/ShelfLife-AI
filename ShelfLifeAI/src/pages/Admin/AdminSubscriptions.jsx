// src/pages/Admin/AdminSubscriptions.jsx
import { useState, useEffect } from 'react'
import { db, collection, getDocs, doc, updateDoc } from '../../firebaseConfig'
import './Admin.css'

function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [users, setUsers] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subsData = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const subscriptionsWithUsers = subsData.map(sub => ({
        ...sub,
        user: usersData.find(u => u.uid === sub.userId)
      }));
      
      setSubscriptions(subscriptionsWithUsers);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleExtendTrial = async (userId, days) => {
    const subscription = subscriptions.find(s => s.userId === userId);
    if (subscription) {
      const newTrialEnd = new Date(subscription.trialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + days);
      
      try {
        await updateDoc(doc(db, 'subscriptions', userId), {
          trialEnd: newTrialEnd.toISOString(),
          updatedAt: new Date().toISOString()
        });
        await loadSubscriptions();
      } catch (error) {
        console.error('Error extending trial:', error);
      }
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesPlan = selectedPlan === 'all' || sub.planId === selectedPlan;
    const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
    return matchesPlan && matchesStatus;
  });

  const planStats = {
    trial: subscriptions.filter(s => s.status === 'trial_active').length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'trial_expired').length,
    total: subscriptions.length,
    monthlyRevenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => {
      const prices = { BASIC: 2500, PROFESSIONAL: 5900, ENTERPRISE: 14900 };
      return sum + (prices[s.planId] || 0);
    }, 0)
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading subscriptions...</p>
      </div>
    )
  }

  return (
    <div className="admin-subscriptions">
      <div className="admin-page-header">
        <div>
          <h1>
            <i className="fas fa-credit-card"></i>
            Subscription Management
          </h1>
          <p>Manage user subscriptions, trials, and payment plans</p>
        </div>
      </div>
      
      <div className="admin-subscription-stats">
        <div className="admin-stats-card">
          <div className="admin-stats-icon trial">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="admin-stats-info">
            <h3>{planStats.trial}</h3>
            <p>Trial Users</p>
          </div>
        </div>
        <div className="admin-stats-card">
          <div className="admin-stats-icon active">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="admin-stats-info">
            <h3>{planStats.active}</h3>
            <p>Active Subscriptions</p>
          </div>
        </div>
        <div className="admin-stats-card">
          <div className="admin-stats-icon expired">
            <i className="fas fa-clock"></i>
          </div>
          <div className="admin-stats-info">
            <h3>{planStats.expired}</h3>
            <p>Expired Trials</p>
          </div>
        </div>
        <div className="admin-stats-card">
          <div className="admin-stats-icon revenue">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="admin-stats-info">
            <h3>LKR {planStats.monthlyRevenue.toLocaleString()}</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>
      </div>
      
      <div className="admin-filters-bar">
        <div className="admin-plan-filters">
          <button className={`admin-plan-filter ${selectedPlan === 'all' ? 'active' : ''}`} onClick={() => setSelectedPlan('all')}>All Plans</button>
          <button className={`admin-plan-filter ${selectedPlan === 'FREE_TRIAL' ? 'active' : ''}`} onClick={() => setSelectedPlan('FREE_TRIAL')}>Free Trial</button>
          <button className={`admin-plan-filter ${selectedPlan === 'BASIC' ? 'active' : ''}`} onClick={() => setSelectedPlan('BASIC')}>Basic</button>
          <button className={`admin-plan-filter ${selectedPlan === 'PROFESSIONAL' ? 'active' : ''}`} onClick={() => setSelectedPlan('PROFESSIONAL')}>Professional</button>
          <button className={`admin-plan-filter ${selectedPlan === 'ENTERPRISE' ? 'active' : ''}`} onClick={() => setSelectedPlan('ENTERPRISE')}>Enterprise</button>
        </div>
        <div className="admin-status-filters">
          <button className={`admin-filter-btn ${selectedStatus === 'all' ? 'active' : ''}`} onClick={() => setSelectedStatus('all')}>All</button>
          <button className={`admin-filter-btn ${selectedStatus === 'trial_active' ? 'active' : ''}`} onClick={() => setSelectedStatus('trial_active')}>Trial</button>
          <button className={`admin-filter-btn ${selectedStatus === 'active' ? 'active' : ''}`} onClick={() => setSelectedStatus('active')}>Active</button>
          <button className={`admin-filter-btn ${selectedStatus === 'trial_expired' ? 'active' : ''}`} onClick={() => setSelectedStatus('trial_expired')}>Expired</button>
        </div>
      </div>
      
      <div className="admin-subscriptions-table-container">
        <table className="admin-subscriptions-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Trial End</th>
              <th>Days Left</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map(sub => {
              const daysLeft = sub.trialEnd ? Math.ceil((new Date(sub.trialEnd) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <tr key={sub.userId}>
                  <td>
                    <div className="admin-user-info">
                      <div className="admin-user-avatar">
                        {sub.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="admin-user-name">{sub.user?.name || 'Unknown'}</div>
                        <div className="admin-user-email">{sub.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-plan-badge ${sub.planId?.toLowerCase()}`}>
                      {sub.planId === 'FREE_TRIAL' ? 'Free Trial' : sub.planId}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${sub.status}`}>
                      {sub.status === 'trial_active' ? 'Trial Active' : 
                       sub.status === 'active' ? 'Active' : 
                       sub.status === 'trial_expired' ? 'Trial Expired' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                  <td>{sub.trialEnd ? new Date(sub.trialEnd).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {sub.status === 'trial_active' && (
                      <span className={`admin-days-badge ${daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : ''}`}>
                        {daysLeft} days
                      </span>
                    )}
                    {sub.status === 'active' && <span className="admin-days-badge active">Active</span>}
                    {sub.status === 'trial_expired' && <span className="admin-days-badge expired">Expired</span>}
                   </td>
                  <td>
                    <div className="admin-action-buttons">
                      {sub.status === 'trial_active' && (
                        <>
                          <button 
                            className="admin-extend-btn" 
                            onClick={() => handleExtendTrial(sub.userId, 7)}
                            title="Extend trial by 7 days"
                          >
                            <i className="fas fa-calendar-plus"></i>
                          </button>
                          <button 
                            className="admin-upgrade-btn" 
                            onClick={() => handleExtendTrial(sub.userId, 14)}
                            title="Extend trial by 14 days"
                          >
                            <i className="fas fa-gift"></i>
                          </button>
                        </>
                      )}
                      <button className="admin-view-btn" title="View Details">
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                   </td>
                 </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredSubscriptions.length === 0 && (
          <div className="admin-empty-state">
            <i className="fas fa-credit-card"></i>
            <p>No subscriptions found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSubscriptions