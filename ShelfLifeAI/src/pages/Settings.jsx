// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import './Settings.css';

function Settings({ user, onUpdateUser, onUpdateTheme }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    storeName: '',
    phone: '',
    address: '',
    bio: ''
  });
  const [themeColors, setThemeColors] = useState({
    primary: '#39e75f',
    secondary: '#22c55e',
    background: '#030a03',
    surface: '#0c190c',
    text: '#dff0df'
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    expiryAlerts: true,
    lowStockAlerts: true,
    marketingEmails: false,
    pushNotifications: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedTheme = localStorage.getItem('shelflife_theme');
    if (savedTheme) {
      setThemeColors(JSON.parse(savedTheme));
    }
    
    const savedNotifications = localStorage.getItem('shelflife_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        storeName: user.storeName || user.businessName || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = () => {
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem('shelflife_user', JSON.stringify(updatedUser));
    if (onUpdateUser) onUpdateUser(updatedUser);
    setIsEditing(false);
    showSuccessMessage('Profile updated successfully!');
  };

  const handleThemeUpdate = () => {
    localStorage.setItem('shelflife_theme', JSON.stringify(themeColors));
    // Apply theme colors to CSS variables
    document.documentElement.style.setProperty('--green-neon', themeColors.primary);
    document.documentElement.style.setProperty('--green-mid', themeColors.secondary);
    document.documentElement.style.setProperty('--bg-base', themeColors.background);
    document.documentElement.style.setProperty('--bg-panel', themeColors.surface);
    document.documentElement.style.setProperty('--text-primary', themeColors.text);
    
    if (onUpdateTheme) onUpdateTheme(themeColors);
    showSuccessMessage('Theme updated successfully!');
  };

  const handleNotificationUpdate = () => {
    localStorage.setItem('shelflife_notifications', JSON.stringify(notifications));
    showSuccessMessage('Notification settings saved!');
  };

  const showSuccessMessage = (message) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const presetThemes = [
    { name: 'Default Green', colors: { primary: '#39e75f', secondary: '#22c55e', background: '#030a03', surface: '#0c190c', text: '#dff0df' } },
    { name: 'Ocean Blue', colors: { primary: '#3b82f6', secondary: '#2563eb', background: '#030a14', surface: '#0c1428', text: '#e0e7ff' } },
    { name: 'Sunset Orange', colors: { primary: '#f97316', secondary: '#ea580c', background: '#1a0a03', surface: '#2a1508', text: '#ffedd5' } },
    { name: 'Purple Dream', colors: { primary: '#a855f7', secondary: '#7c3aed', background: '#0a0314', surface: '#150828', text: '#f3e8ff' } },
    { name: 'Dark Mode', colors: { primary: '#39e75f', secondary: '#22c55e', background: '#000000', surface: '#0a0a0a', text: '#ffffff' } },
    { name: 'Light Mode', colors: { primary: '#16a34a', secondary: '#15803d', background: '#f5f5f5', surface: '#ffffff', text: '#1a1a1a' } }
  ];

  const applyPresetTheme = (preset) => {
    setThemeColors(preset.colors);
  };

  return (
    <div className="settings-page">
      <div className="container">
        {/* Header */}
        <div className="settings-header">
          <h1>
            <i className="fas fa-cog"></i>
            Settings
          </h1>
          <p>Manage your profile, customize appearance, and configure notifications</p>
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="success-toast">
            <i className="fas fa-check-circle"></i>
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i> Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <i className="fas fa-palette"></i> Appearance
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <i className="fas fa-bell"></i> Notifications
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fas fa-shield-alt"></i> Security
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-card">
            <div className="card-header">
              <h2><i className="fas fa-user-circle"></i> Profile Information</h2>
              {!isEditing ? (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  <i className="fas fa-pen"></i> Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button className="btn-save" onClick={handleProfileUpdate}>Save Changes</button>
                </div>
              )}
            </div>
            
            <div className="profile-avatar">
              <div className="avatar-large">
                <i className="fas fa-user"></i>
              </div>
              {isEditing && (
                <button className="btn-change-avatar">
                  <i className="fas fa-camera"></i> Change Photo
                </button>
              )}
            </div>

            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label><i className="fas fa-user"></i> Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="field-value">{profileData.name || 'Not set'}</p>
                  )}
                </div>
                <div className="form-group">
                  <label><i className="fas fa-envelope"></i> Email Address</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="field-value">{profileData.email || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><i className="fas fa-store"></i> Store Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.storeName} 
                      onChange={(e) => setProfileData({...profileData, storeName: e.target.value})}
                      placeholder="Enter your store name"
                    />
                  ) : (
                    <p className="field-value">{profileData.storeName || 'Not set'}</p>
                  )}
                </div>
                <div className="form-group">
                  <label><i className="fas fa-phone"></i> Phone Number</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="field-value">{profileData.phone || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-map-marker-alt"></i> Store Address</label>
                {isEditing ? (
                  <textarea 
                    value={profileData.address} 
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    placeholder="Enter your store address"
                    rows="3"
                  />
                ) : (
                  <p className="field-value">{profileData.address || 'Not set'}</p>
                )}
              </div>

              <div className="form-group">
                <label><i className="fas fa-info-circle"></i> Bio</label>
                {isEditing ? (
                  <textarea 
                    value={profileData.bio} 
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about your store"
                    rows="2"
                  />
                ) : (
                  <p className="field-value">{profileData.bio || 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="profile-stats">
              <div className="stat-item">
                <i className="fas fa-box"></i>
                <div>
                  <h4>Total Products</h4>
                  <p>24 items</p>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-truck"></i>
                <div>
                  <h4>Suppliers</h4>
                  <p>5 partners</p>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-calendar"></i>
                <div>
                  <h4>Member Since</h4>
                  <p>April 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="settings-card">
            <div className="card-header">
              <h2><i className="fas fa-palette"></i> Customize Theme</h2>
              <button className="btn-save" onClick={handleThemeUpdate}>
                <i className="fas fa-save"></i> Apply Theme
              </button>
            </div>

            {/* Preset Themes */}
            <div className="theme-section">
              <h3>Preset Themes</h3>
              <div className="preset-themes">
                {presetThemes.map((theme, index) => (
                  <div 
                    key={index} 
                    className="preset-card"
                    onClick={() => applyPresetTheme(theme)}
                  >
                    <div className="preset-preview">
                      <div className="preview-bar" style={{ background: theme.colors.primary }}></div>
                      <div className="preview-circle" style={{ background: theme.colors.secondary }}></div>
                      <div className="preview-bg" style={{ background: theme.colors.surface }}></div>
                    </div>
                    <p>{theme.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="theme-section">
              <h3>Custom Colors</h3>
              <div className="color-grid">
                <div className="color-picker">
                  <label>Primary Color</label>
                  <input 
                    type="color" 
                    value={themeColors.primary}
                    onChange={(e) => setThemeColors({...themeColors, primary: e.target.value})}
                  />
                  <span>{themeColors.primary}</span>
                </div>
                <div className="color-picker">
                  <label>Secondary Color</label>
                  <input 
                    type="color" 
                    value={themeColors.secondary}
                    onChange={(e) => setThemeColors({...themeColors, secondary: e.target.value})}
                  />
                  <span>{themeColors.secondary}</span>
                </div>
                <div className="color-picker">
                  <label>Background Color</label>
                  <input 
                    type="color" 
                    value={themeColors.background}
                    onChange={(e) => setThemeColors({...themeColors, background: e.target.value})}
                  />
                  <span>{themeColors.background}</span>
                </div>
                <div className="color-picker">
                  <label>Surface Color</label>
                  <input 
                    type="color" 
                    value={themeColors.surface}
                    onChange={(e) => setThemeColors({...themeColors, surface: e.target.value})}
                  />
                  <span>{themeColors.surface}</span>
                </div>
                <div className="color-picker">
                  <label>Text Color</label>
                  <input 
                    type="color" 
                    value={themeColors.text}
                    onChange={(e) => setThemeColors({...themeColors, text: e.target.value})}
                  />
                  <span>{themeColors.text}</span>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="theme-section">
              <h3>Live Preview</h3>
              <div className="live-preview" style={{ 
                background: themeColors.surface,
                borderColor: themeColors.primary
              }}>
                <div className="preview-header" style={{ background: themeColors.background }}>
                  <div className="preview-logo" style={{ color: themeColors.primary }}>
                    <i className="fas fa-leaf"></i> ShelfLife AI
                  </div>
                  <div className="preview-nav">
                    <span style={{ color: themeColors.text }}>Dashboard</span>
                    <span style={{ color: themeColors.text }}>Inventory</span>
                    <button className="preview-btn" style={{ background: themeColors.primary, color: '#fff' }}>
                      Sign In
                    </button>
                  </div>
                </div>
                <div className="preview-content">
                  <div className="preview-card" style={{ background: themeColors.background }}>
                    <h4 style={{ color: themeColors.primary }}>Welcome to ShelfLife AI</h4>
                    <p style={{ color: themeColors.text }}>Your inventory management solution</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="settings-card">
            <div className="card-header">
              <h2><i className="fas fa-bell"></i> Notification Preferences</h2>
              <button className="btn-save" onClick={handleNotificationUpdate}>
                <i className="fas fa-save"></i> Save Preferences
              </button>
            </div>

            <div className="notifications-list">
              <div className="notification-item">
                <div className="notification-info">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <h4>Email Alerts</h4>
                    <p>Receive important updates via email</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.emailAlerts}
                    onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <i className="fas fa-calendar-times"></i>
                  <div>
                    <h4>Expiry Alerts</h4>
                    <p>Get notified when products are about to expire</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.expiryAlerts}
                    onChange={(e) => setNotifications({...notifications, expiryAlerts: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <i className="fas fa-box"></i>
                  <div>
                    <h4>Low Stock Alerts</h4>
                    <p>Get notified when inventory is running low</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.lowStockAlerts}
                    onChange={(e) => setNotifications({...notifications, lowStockAlerts: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <i className="fas fa-chart-line"></i>
                  <div>
                    <h4>Weekly Reports</h4>
                    <p>Receive weekly performance reports</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.marketingEmails}
                    onChange={(e) => setNotifications({...notifications, marketingEmails: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <i className="fas fa-mobile-alt"></i>
                  <div>
                    <h4>Push Notifications</h4>
                    <p>Get real-time alerts on your device</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-card">
            <div className="card-header">
              <h2><i className="fas fa-shield-alt"></i> Security Settings</h2>
            </div>

            <div className="security-section">
              <div className="security-item">
                <div className="security-info">
                  <i className="fas fa-key"></i>
                  <div>
                    <h4>Change Password</h4>
                    <p>Update your password to keep your account secure</p>
                  </div>
                </div>
                <button className="btn-secondary">Change Password</button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <i className="fas fa-mobile-alt"></i>
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button className="btn-secondary">Enable 2FA</button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <i className="fas fa-history"></i>
                  <div>
                    <h4>Session Management</h4>
                    <p>Manage active sessions and devices</p>
                  </div>
                </div>
                <button className="btn-secondary">View Sessions</button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <i className="fas fa-download"></i>
                  <div>
                    <h4>Export Data</h4>
                    <p>Download all your inventory and account data</p>
                  </div>
                </div>
                <button className="btn-secondary">Export Data</button>
              </div>

              <div className="security-item danger">
                <div className="security-info">
                  <i className="fas fa-trash-alt"></i>
                  <div>
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all data</p>
                  </div>
                </div>
                <button className="btn-danger">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;