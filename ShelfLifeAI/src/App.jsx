import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Analytics from './pages/Analytics'

import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    const savedUser = localStorage.getItem('shelflife_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    
    const savedInventory = localStorage.getItem('shelflife_inventory')
    if (savedInventory) {
      try {
        const parsed = JSON.parse(savedInventory)
        if (parsed && parsed.length > 0) {
          setInventory(parsed)
        } else {
          loadInitialInventory()
        }
      } catch (e) {
        loadInitialInventory()
      }
    } else {
      loadInitialInventory()
    }
    setLoading(false)
  }, [])

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

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('shelflife_user', JSON.stringify(userData))
    setShowLogin(false)
    showToast(`👋 Welcome, ${userData.name}!`)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('shelflife_user')
    showToast('👋 You have been signed out')
  }

  const handleUpdateInventory = (newInventory) => {
    setInventory(newInventory)
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
            {/* Landing Page - Public */}
            <Route path="/" element={
              user ? <Navigate to="/dashboard" replace /> : <LandingPage onLoginClick={() => setShowLogin(true)} />
            } />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                <Dashboard 
                  inventory={inventory} 
                  onUpdateInventory={handleUpdateInventory}
                  showToast={showToast}
                />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute user={user}>
                <Inventory 
                  inventory={inventory}
                  onUpdateInventory={handleUpdateInventory}
                  showToast={showToast}
                />
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute user={user}>
                <Suppliers 
                  inventory={inventory}
                  onUpdateInventory={handleUpdateInventory}
                  showToast={showToast}
                />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute user={user}>
                <Analytics inventory={inventory} />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {/* Only show Footer for logged-in users */}
        {user && <Footer />}

        {toastMsg && (
          <div className="toast-notification">
            {toastMsg}
          </div>
        )}

        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)} 
          onLogin={handleLogin}
        />
      </div>
    </Router>
  )
}

export default App