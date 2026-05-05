// src/pages/Admin/AdminSettings.jsx
import { useState, useEffect } from 'react'
import './Admin.css'

function AdminSettings({ admin }) {
  const [settings, setSettings] = useState({
    siteName: 'ShelfLife AI',
    siteDescription: 'AI-Powered Inventory Management',
    contactEmail: 'support@shelflife.ai',
    supportPhone: '+94 77 123 4567',
    trialDays: 14,
    maintenanceMode: false,
    enableSignups: true,
    emailNotifications: true
  })
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Save settings to localStorage (in production, to Firestore)
    localStorage.setItem('shelflife_admin_settings', JSON.stringify(settings))
    setTimeout(() => {
      setSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }, 1000)
  }

  return (
    <div className="admin-settings">
      <div className="admin-page-header">
        <div>
          <h1>
            <i className="fas fa-cog"></i>
            System Settings
          </h1>
          <p>Configure platform settings and preferences</p>
        </div>
        <button className="admin-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <i className="fas fa-spinner fa-pulse"></i> : <i className="fas fa-save"></i>}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      {showSuccess && (
        <div className="admin-success-toast">
          <i className="fas fa-check-circle"></i>
          <span>Settings saved successfully!</span>
        </div>
      )}
      
      <div className="admin-settings-grid">
        <div className="admin-settings-card">
          <h3>
            <i className="fas fa-globe"></i>
            General Settings
          </h3>
          <div className="admin-settings-form">
            <div className="admin-form-group">
              <label>Site Name</label>
              <input 
                type="text" 
                value={settings.siteName} 
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              />
            </div>
            <div className="admin-form-group">
              <label>Site Description</label>
              <textarea 
                rows="3"
                value={settings.siteDescription} 
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
              />
            </div>
            <div className="admin-form-group">
              <label>Contact Email</label>
              <input 
                type="email" 
                value={settings.contactEmail} 
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
              />
            </div>
            <div className="admin-form-group">
              <label>Support Phone</label>
              <input 
                type="text" 
                value={settings.supportPhone} 
                onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="admin-settings-card">
          <h3>
            <i className="fas fa-gift"></i>
            Trial Settings
          </h3>
          <div className="admin-settings-form">
            <div className="admin-form-group">
              <label>Trial Duration (days)</label>
              <input 
                type="number" 
                value={settings.trialDays} 
                onChange={(e) => setSettings({...settings, trialDays: parseInt(e.target.value)})}
              />
            </div>
            <div className="admin-form-group">
              <label>Default Plan for New Users</label>
              <select>
                <option>Free Trial</option>
                <option>Basic</option>
                <option>Professional</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="admin-settings-card">
          <h3>
            <i className="fas fa-toggle-on"></i>
            Platform Controls
          </h3>
          <div className="admin-settings-form">
            <div className="admin-toggle-group">
              <label className="admin-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.maintenanceMode} 
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                />
                <span className="admin-toggle-slider"></span>
                <span className="admin-toggle-label">Maintenance Mode</span>
              </label>
              <p className="admin-toggle-desc">When enabled, only admins can access the platform</p>
            </div>
            
            <div className="admin-toggle-group">
              <label className="admin-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.enableSignups} 
                  onChange={(e) => setSettings({...settings, enableSignups: e.target.checked})}
                />
                <span className="admin-toggle-slider"></span>
                <span className="admin-toggle-label">Enable New Signups</span>
              </label>
              <p className="admin-toggle-desc">Allow new users to create accounts</p>
            </div>
            
            <div className="admin-toggle-group">
              <label className="admin-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.emailNotifications} 
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                />
                <span className="admin-toggle-slider"></span>
                <span className="admin-toggle-label">Email Notifications</span>
              </label>
              <p className="admin-toggle-desc">Send system notifications to users</p>
            </div>
          </div>
        </div>
        
        <div className="admin-settings-card">
          <h3>
            <i className="fas fa-chart-line"></i>
            Analytics Settings
          </h3>
          <div className="admin-settings-form">
            <div className="admin-form-group">
              <label>Google Analytics ID</label>
              <input type="text" placeholder="UA-XXXXXXXXX-X" />
            </div>
            <div className="admin-form-group">
              <label>Enable Analytics</label>
              <select>
                <option>Enabled</option>
                <option>Disabled</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="admin-settings-card">
        <h3>
          <i className="fas fa-database"></i>
          Data Management
        </h3>
        <div className="admin-data-actions">
          <button className="admin-data-btn">
            <i className="fas fa-download"></i>
            Export All Data
          </button>
          <button className="admin-data-btn">
            <i className="fas fa-upload"></i>
            Import Backup
          </button>
          <button className="admin-data-btn danger">
            <i className="fas fa-trash-alt"></i>
            Clear Cache
          </button>
        </div>
      </div>
      
      <div className="admin-settings-card">
        <h3>
          <i className="fas fa-info-circle"></i>
          System Information
        </h3>
        <div className="admin-system-info">
          <div className="admin-info-row">
            <span>Version:</span>
            <strong>v2.0.0</strong>
          </div>
          <div className="admin-info-row">
            <span>Last Updated:</span>
            <strong>December 15, 2024</strong>
          </div>
          <div className="admin-info-row">
            <span>Environment:</span>
            <strong>Production</strong>
          </div>
          <div className="admin-info-row">
            <span>Database Status:</span>
            <strong className="status-green">Connected</strong>
          </div>
          <div className="admin-info-row">
            <span>API Status:</span>
            <strong className="status-green">Operational</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings