// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import ProtectedRoute from './components/ProtectedRoute'
import TrialReminder from './components/subscription/TrialReminder'
import UpgradeModal from './components/subscription/UpgradeModal'

// Pages
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Analytics from './pages/Analytics'
import BillingPage from './pages/BillingPage'
import Settings from './pages/Settings'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'

// Services
import subscriptionService from './services/subscriptionService'
import { useFeatureAccess } from './hooks/useFeatureAccess'

// Styles
import './App.css'
import './components/subscription/subscription.css'

function App() {
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeContext, setUpgradeContext] = useState({ resourceType: 'products', currentUsage: 0, limit: 0 })
  
  const { 
    features, 
    usage, 
    subscription, 
    trialDaysLeft,
    canAddProduct,
    isTrialActive,
    isTrialExpired,
    isSubscribed,
    refresh 
  } = useFeatureAccess()

  // Load initial data
  useEffect(() => {
    const savedUser = localStorage.getItem('shelflife_user')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('shelflife_theme')
    if (savedTheme) {
      const theme = JSON.parse(savedTheme)
      applyTheme(theme)
    }
    
    loadInventory()
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.style.setProperty('--green-neon', theme.primary || '#39e75f')
    document.documentElement.style.setProperty('--green-mid', theme.secondary || '#22c55e')
    document.documentElement.style.setProperty('--bg-base', theme.background || '#030a03')
    document.documentElement.style.setProperty('--bg-panel', theme.surface || '#0c190c')
    document.documentElement.style.setProperty('--text-primary', theme.text || '#dff0df')
  }

  const loadInventory = async () => {
    const savedInventory = localStorage.getItem('shelflife_inventory')
    if (savedInventory) {
      try {
        const parsed = JSON.parse(savedInventory)
        if (parsed && parsed.length > 0) {
          setInventory(parsed)
        } else {
          await loadInitialInventory()
        }
      } catch (e) {
        await loadInitialInventory()
      }
    } else {
      await loadInitialInventory()
    }
    setLoading(false)
  }

  const loadInitialInventory = async () => {
    const { initialInventory } = await import('./data/inventoryData')
    setInventory(initialInventory)
    localStorage.setItem('shelflife_inventory', JSON.stringify(initialInventory))
  }

  // Save to localStorage whenever inventory changes
  useEffect(() => {
    if (inventory.length > 0) {
      localStorage.setItem('shelflife_inventory', JSON.stringify(inventory))
    }
  }, [inventory])

  const showToast = (message) => {
    setToastMsg(message)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Handle user login
  const handleLogin = async (userData) => {
    setUser(userData)
    localStorage.setItem('shelflife_user', JSON.stringify(userData))
    
    // Check if user has an active subscription/trial
    const existingSub = await subscriptionService.getSubscriptionStatus(userData.uid)
    
    if (!existingSub) {
      await subscriptionService.startFreeTrial(
        userData.uid, 
        userData.email, 
        userData.businessName || userData.name + "'s Store",
        'retail'
      )
      showToast(`🎉 Welcome ${userData.name}! Your 14-day free trial has started.`)
    } else if (existingSub.status === 'trial_active') {
      const daysLeft = await subscriptionService.getTrialDaysLeft(userData.uid)
      showToast(`👋 Welcome back! You have ${daysLeft} days left in your free trial.`)
    } else if (existingSub.status === 'active') {
      showToast(`👋 Welcome back, ${userData.name}!`)
    } else if (existingSub.status === 'trial_expired') {
      showToast(`⚠️ Your free trial has ended. Please upgrade to continue using all features.`)
      setShowUpgradeModal(true)
    }
    
    setShowLogin(false)
    refresh()
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('shelflife_user')
    showToast('👋 You have been signed out')
  }

  const handleUpdateInventory = (newInventory) => {
    setInventory(newInventory)
  }

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('shelflife_user', JSON.stringify(updatedUser))
    showToast('Profile updated successfully!')
  }

  const handleUpdateTheme = (theme) => {
    applyTheme(theme)
    showToast('Theme applied successfully!')
  }

  const canAddNewProduct = () => {
    if (!user) return false
    if (isSubscribed) return true
    if (isTrialActive && canAddProduct) return true
    return false
  }

  const handleLimitReached = (resourceType, currentUsage, limit) => {
    setUpgradeContext({ resourceType, currentUsage, limit })
    setShowUpgradeModal(true)
  }

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading ShelfLife AI...</p>
      </div>
    )
  }

  return (
    <Router>
      <div className="app-wrapper">
        {/* Only show Navbar for logged-in users */}
        {user && (
          <Navbar 
            onLoginClick={() => setShowLogin(true)}
            user={user}
            onLogout={handleLogout}
          />
        )}
        
        <main className="main-content">
          <Routes>
            {/* Landing Page - Public (Beautiful Demo Page) */}
            <Route path="/" element={
              user ? <Navigate to="/dashboard" replace /> : <LandingPage onLoginClick={() => setShowLogin(true)} />
            } />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                <>
                  {isTrialActive && trialDaysLeft <= 7 && (
                    <div className="container">
                      <TrialReminder 
                        subscription={subscription}
                        onUpgradeClick={handleUpgradeClick}
                      />
                    </div>
                  )}
                  <Dashboard 
                    inventory={inventory} 
                    onUpdateInventory={handleUpdateInventory}
                    showToast={showToast}
                    canAddProduct={canAddNewProduct()}
                    onLimitReached={handleLimitReached}
                    subscriptionStatus={subscription?.status}
                    trialDaysLeft={trialDaysLeft}
                  />
                </>
              </ProtectedRoute>
            } />
            
            {/* Inventory */}
            <Route path="/inventory" element={
              <ProtectedRoute user={user}>
                <>
                  {isTrialActive && trialDaysLeft <= 7 && (
                    <div className="container">
                      <TrialReminder 
                        subscription={subscription}
                        onUpgradeClick={handleUpgradeClick}
                      />
                    </div>
                  )}
                  <Inventory 
                    inventory={inventory}
                    onUpdateInventory={handleUpdateInventory}
                    showToast={showToast}
                    features={features}
                    usage={usage}
                    canAddProduct={canAddNewProduct()}
                    onLimitReached={handleLimitReached}
                    subscriptionStatus={subscription?.status}
                    isTrialActive={isTrialActive}
                    isTrialExpired={isTrialExpired}
                  />
                </>
              </ProtectedRoute>
            } />
            
            {/* Suppliers */}
            <Route path="/suppliers" element={
              <ProtectedRoute user={user}>
                <>
                  {isTrialActive && trialDaysLeft <= 7 && (
                    <div className="container">
                      <TrialReminder 
                        subscription={subscription}
                        onUpgradeClick={handleUpgradeClick}
                      />
                    </div>
                  )}
                  <Suppliers 
                    inventory={inventory}
                    onUpdateInventory={handleUpdateInventory}
                    showToast={showToast}
                    features={features}
                    onLimitReached={handleLimitReached}
                  />
                </>
              </ProtectedRoute>
            } />
            
            {/* Analytics */}
            <Route path="/analytics" element={
              <ProtectedRoute user={user}>
                <>
                  {isTrialActive && trialDaysLeft <= 7 && (
                    <div className="container">
                      <TrialReminder 
                        subscription={subscription}
                        onUpgradeClick={handleUpgradeClick}
                      />
                    </div>
                  )}
                  <Analytics 
                    inventory={inventory}
                    features={features}
                  />
                </>
              </ProtectedRoute>
            } />
            
            {/* Billing */}
            <Route path="/billing" element={
              <ProtectedRoute user={user}>
                <BillingPage user={user} />
              </ProtectedRoute>
            } />
            
            {/* Settings */}
            <Route path="/settings" element={
              <ProtectedRoute user={user}>
                <Settings 
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onUpdateTheme={handleUpdateTheme}
                />
              </ProtectedRoute>
            } />
            
            {/* Payment Success */}
            <Route path="/payment-success" element={
              <ProtectedRoute user={user}>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            
            {/* Payment Cancel */}
            <Route path="/payment-cancel" element={
              <ProtectedRoute user={user}>
                <PaymentCancel />
              </ProtectedRoute>
            } />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Only show Footer for logged-in users */}
        {user && <Footer />}

        {/* Toast Notification */}
        {toastMsg && (
          <div className="toast-notification">
            {toastMsg}
          </div>
        )}

        {/* Login Modal */}
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)} 
          onLogin={handleLogin}
        />

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <UpgradeModal 
            onClose={() => setShowUpgradeModal(false)}
            currentUsage={upgradeContext.currentUsage}
            limit={upgradeContext.limit}
            resourceType={upgradeContext.resourceType}
          />
        )}
      </div>
    </Router>
  )
}

export default App