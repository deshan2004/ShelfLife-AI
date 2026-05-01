// src/pages/Admin/AdminUsers.jsx
import { useState, useEffect } from 'react'
import { db, collection, getDocs, doc, updateDoc, deleteDoc } from '../../firebaseConfig'
import './Admin.css'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subsData = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const usersWithSubs = usersData.map(user => ({
        ...user,
        subscription: subsData.find(s => s.userId === user.uid) || { status: 'none', planId: 'None' }
      }));
      
      setUsers(usersWithSubs);
      setSubscriptions(subsData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      await loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
    active: users.filter(u => u.subscription?.status === 'active').length
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading users...</p>
      </div>
    )
  }

  return (
    <div className="admin-users">
      <div className="admin-page-header">
        <div>
          <h1>
            <i className="fas fa-users"></i>
            User Management
          </h1>
          <p>Manage all users, view their details, and control access</p>
        </div>
        <div className="admin-stats-chips">
          <div className="admin-stat-chip">
            <i className="fas fa-users"></i>
            <span>Total: {stats.total}</span>
          </div>
          <div className="admin-stat-chip admin">
            <i className="fas fa-shield-alt"></i>
            <span>Admins: {stats.admins}</span>
          </div>
          <div className="admin-stat-chip user">
            <i className="fas fa-user"></i>
            <span>Users: {stats.users}</span>
          </div>
          <div className="admin-stat-chip active">
            <i className="fas fa-check-circle"></i>
            <span>Active: {stats.active}</span>
          </div>
        </div>
      </div>
      
      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="admin-filter-buttons">
          <button className={`admin-filter-btn ${filterRole === 'all' ? 'active' : ''}`} onClick={() => setFilterRole('all')}>All</button>
          <button className={`admin-filter-btn ${filterRole === 'admin' ? 'active' : ''}`} onClick={() => setFilterRole('admin')}>Admins</button>
          <button className={`admin-filter-btn ${filterRole === 'user' ? 'active' : ''}`} onClick={() => setFilterRole('user')}>Users</button>
        </div>
      </div>
      
      <div className="admin-users-table-container">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.uid}>
                <td>
                  <div className="admin-user-info">
                    <div className="admin-user-avatar" style={{ background: user.role === 'admin' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #39e75f, #22c55e)' }}>
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="admin-user-name">{user.name}</div>
                      {user.role === 'admin' && <span className="admin-role-tag">Admin</span>}
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`admin-plan-badge ${user.subscription?.planId?.toLowerCase() || 'none'}`}>
                    {user.subscription?.planId === 'FREE_TRIAL' ? 'Free Trial' : user.subscription?.planId || 'None'}
                  </span>
                </td>
                <td>
                  <span className={`admin-status-badge ${user.subscription?.status || 'inactive'}`}>
                    {user.subscription?.status === 'trial_active' ? 'Trial Active' : 
                     user.subscription?.status === 'active' ? 'Active' : 
                     user.subscription?.status === 'trial_expired' ? 'Trial Expired' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <select 
                    value={user.role || 'user'} 
                    onChange={(e) => handleUpdateUserRole(user.uid, e.target.value)}
                    className="admin-role-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <div className="admin-action-buttons">
                    <button 
                      className="admin-view-btn"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowUserModal(true)
                      }}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="admin-delete-btn"
                      onClick={() => handleDeleteUser(user.uid)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="admin-empty-state">
            <i className="fas fa-users-slash"></i>
            <p>No users found</p>
          </div>
        )}
      </div>
      
      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>User Details</h2>
              <button className="admin-modal-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-user-detail">
                <div className="admin-detail-avatar" style={{ background: selectedUser.role === 'admin' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #39e75f, #22c55e)' }}>
                  {selectedUser.name?.charAt(0) || 'U'}
                </div>
                <div className="admin-detail-info">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                  {selectedUser.role === 'admin' && <span className="admin-role-badge-large">Administrator</span>}
                </div>
              </div>
              
              <div className="admin-detail-section">
                <h4>Subscription Information</h4>
                <div className="admin-detail-row">
                  <span>Plan:</span>
                  <strong>{selectedUser.subscription?.planId || 'None'}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Status:</span>
                  <strong className={`status-${selectedUser.subscription?.status}`}>
                    {selectedUser.subscription?.status === 'trial_active' ? 'Trial Active' : 
                     selectedUser.subscription?.status === 'active' ? 'Active' : 
                     selectedUser.subscription?.status === 'trial_expired' ? 'Trial Expired' : 'Inactive'}
                  </strong>
                </div>
                {selectedUser.subscription?.trialEnd && (
                  <div className="admin-detail-row">
                    <span>Trial End:</span>
                    <strong>{new Date(selectedUser.subscription.trialEnd).toLocaleDateString()}</strong>
                  </div>
                )}
              </div>
              
              <div className="admin-detail-section">
                <h4>Account Information</h4>
                <div className="admin-detail-row">
                  <span>User ID:</span>
                  <strong className="admin-user-id">{selectedUser.uid}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Joined:</span>
                  <strong>{new Date(selectedUser.createdAt).toLocaleDateString()}</strong>
                </div>
                <div className="admin-detail-row">
                  <span>Role:</span>
                  <strong>{selectedUser.role || 'User'}</strong>
                </div>
                {selectedUser.businessName && (
                  <div className="admin-detail-row">
                    <span>Business:</span>
                    <strong>{selectedUser.businessName}</strong>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-modal-btn secondary" onClick={() => setShowUserModal(false)}>Close</button>
              <button className="admin-modal-btn primary" onClick={() => {
                handleUpdateUserRole(selectedUser.uid, selectedUser.role === 'admin' ? 'user' : 'admin');
                setShowUserModal(false);
              }}>
                {selectedUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers