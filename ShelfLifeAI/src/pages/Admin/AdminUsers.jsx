// src/pages/Admin/AdminUsers.jsx
import { useState, useEffect } from 'react'
import { db, collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from '../../firebaseConfig'
import './Admin.css'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    loadUsers()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }));
      
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subsData = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Load inventory counts for each user
      const usersWithData = await Promise.all(usersData.map(async (user) => {
        let productCount = 0;
        try {
          const inventorySnapshot = await getDocs(collection(db, 'inventory', user.uid, 'items'));
          productCount = inventorySnapshot.size;
        } catch (e) {
          productCount = 0;
        }
        
        return {
          ...user,
          subscription: subsData.find(s => s.userId === user.uid) || { status: 'none', planId: 'None' },
          productCount
        };
      }));
      
      setUsers(usersWithData);
      setSubscriptions(subsData);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Error loading users', 'error');
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
      showToast(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('Error updating user role', 'error');
    }
  }

  const handleUpdateUser = async () => {
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        name: editFormData.name,
        businessName: editFormData.businessName,
        phone: editFormData.phone,
        address: editFormData.address,
        updatedAt: new Date().toISOString()
      });
      await loadUsers();
      setShowEditModal(false);
      setShowUserModal(false);
      showToast('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Error updating user', 'error');
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // Delete user document
        await deleteDoc(doc(db, 'users', userId));
        // Delete subscription
        await deleteDoc(doc(db, 'subscriptions', userId));
        // Delete inventory collection
        const inventorySnapshot = await getDocs(collection(db, 'inventory', userId, 'items'));
        for (const doc of inventorySnapshot.docs) {
          await deleteDoc(doc.ref);
        }
        await loadUsers();
        showToast('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user', 'error');
      }
    }
  }

  const handleUpdateSubscription = async (userId, planId, status, trialEndDays) => {
    try {
      const updateData = {
        planId: planId,
        status: status,
        updatedAt: new Date().toISOString()
      };
      
      if (trialEndDays && status === 'trial_active') {
        const newTrialEnd = new Date();
        newTrialEnd.setDate(newTrialEnd.getDate() + trialEndDays);
        updateData.trialEnd = newTrialEnd.toISOString();
      }
      
      await updateDoc(doc(db, 'subscriptions', userId), updateData);
      await loadUsers();
      showToast(`Subscription updated to ${planId}`);
    } catch (error) {
      console.error('Error updating subscription:', error);
      showToast('Error updating subscription', 'error');
    }
  }

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      businessName: user.businessName || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowEditModal(true);
    setShowUserModal(false);
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
    regularUsers: users.filter(u => u.role === 'user').length,
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
      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}
      
      <div className="admin-page-header">
        <div>
          <h1>
            <i className="fas fa-users"></i>
            User Management
          </h1>
          <p>Manage all users, view their details, edit profiles, and control access</p>
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
            <span>Users: {stats.regularUsers}</span>
          </div>
          <div className="admin-stat-chip active">
            <i className="fas fa-check-circle"></i>
            <span>Active Subs: {stats.active}</span>
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
              <th>Products</th>
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
                <td>{user.productCount || 0}</td>
                <td>
                  <select 
                    value={user.subscription?.planId || 'FREE_TRIAL'} 
                    onChange={(e) => handleUpdateSubscription(user.uid, e.target.value, user.subscription?.status, 0)}
                    className="admin-plan-select"
                  >
                    <option value="FREE_TRIAL">Free Trial</option>
                    <option value="BASIC">Basic</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </td>
                <td>
                  <select 
                    value={user.subscription?.status || 'trial_active'} 
                    onChange={(e) => handleUpdateSubscription(user.uid, user.subscription?.planId || 'FREE_TRIAL', e.target.value, e.target.value === 'trial_active' ? 14 : 0)}
                    className="admin-status-select"
                  >
                    <option value="trial_active">Trial Active</option>
                    <option value="active">Active</option>
                    <option value="trial_expired">Expired</option>
                  </select>
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
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="admin-edit-btn"
                      onClick={() => openEditModal(user)}
                      title="Edit User"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="admin-delete-btn"
                      onClick={() => handleDeleteUser(user.uid)}
                      title="Delete User"
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
                <div className="admin-detail-avatar" style={{ background: selectedUser.role === 'admin' ? '#ef4444' : '#39e75f' }}>
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
                <div className="admin-detail-row">
                  <span>Products:</span>
                  <strong>{selectedUser.productCount || 0} items</strong>
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
              <button className="admin-modal-btn primary" onClick={() => openEditModal(selectedUser)}>
                <i className="fas fa-edit"></i> Edit User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal admin-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit User: {selectedUser.name}</h2>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-edit-form">
                <div className="admin-form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Business Name</label>
                  <input 
                    type="text" 
                    value={editFormData.businessName} 
                    onChange={(e) => setEditFormData({...editFormData, businessName: e.target.value})}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={editFormData.phone} 
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Address</label>
                  <textarea 
                    rows="3"
                    value={editFormData.address} 
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-modal-btn secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="admin-modal-btn primary" onClick={handleUpdateUser}>
                <i className="fas fa-save"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers