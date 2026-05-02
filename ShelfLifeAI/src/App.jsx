// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth, db, onAuthStateChanged, doc, getDoc } from './firebaseConfig'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// User Pages
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Analytics from './pages/Analytics'
import BillingPage from './pages/BillingPage'
import Settings from './pages/Settings'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminInventory from './pages/Admin/AdminInventory'
import AdminSubscriptions from './pages/Admin/AdminSubscriptions'
import AdminAnalytics from './pages/Admin/AdminAnalytics'
import AdminSettings from './pages/Admin/AdminSettings'

// Services
import subscriptionService from './services/subscriptionService'
import { useFeatureAccess } from './hooks/useFeatureAccess'

// Styles
import './App.css'
import './components/subscription/subscription.css'
import './pages/Admin/Admin.css'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState([])
  const [toastMsg, setToastMsg] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeContext, setUpgradeContext] = useState({ resourceType: 'products', currentUsage: 0, limit: 0 })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "No user");
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let role = 'user';
          let userData = {};
          
          if (userDoc.exists()) {
            userData = userDoc.data();
            role = userData.role || 'user';
          } else {
            const newUserData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email,
              role: 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
            userData = newUserData;
            role = 'user';
          }
          
          const fullUserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.name || firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL,
            role: role,
            ...userData
          };
          
          setUser(fullUserData);
          setUserRole(role);
          localStorage.setItem('shelflife_user', JSON.stringify(fullUserData));
          
          if (role === 'user') {
            await loadUserInventory(firebaseUser.uid);
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else {
        setUser(null);
        setUserRole('user');
        localStorage.removeItem('shelflife_user');
        setInventory([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const loadUserInventory = async (userId) => {
    const savedInventory = localStorage.getItem(`shelflife_inventory_${userId}`)
    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory))
      } catch (e) {
        await loadInitialInventory(userId)
      }
    } else {
      await loadInitialInventory(userId)
    }
  }

  const loadInitialInventory = async (userId) => {
    const { initialInventory } = await import('./data/inventoryData')
    setInventory(initialInventory)
    localStorage.setItem(`shelflife_inventory_${userId}`, JSON.stringify(initialInventory))
  }

  const showToast = (message) => {
    setToastMsg(message)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setUserRole(userData.role || 'user')
    setShowLogin(false)
    showToast(`Welcome back, ${userData.name}!`)
  }

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserRole('user');
      showToast('You have been signed out');
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const handleUpdateInventory = (newInventory) => {
    setInventory(newInventory)
    if (user && user.uid) {
      localStorage.setItem(`shelflife_inventory_${user.uid}`, JSON.stringify(newInventory))
    }
  }

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

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
        <Navbar 
          onLoginClick={() => setShowLogin(true)}
          user={user}
          onLogout={handleLogout}
          isAdmin={isAdmin}
        />
        
        <main className="main-content">
          <Routes>
            {/* Public Route */}
            <Route path="/" element={
              user ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace /> : 
              <LandingPage onLoginClick={() => setShowLogin(true)} />
            } />
            
            {/* User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <Navigate to="/admin/dashboard" replace /> : (
                  <Dashboard 
                    inventory={inventory} 
                    onUpdateInventory={handleUpdateInventory}
                    showToast={showToast}
                  />
                )}
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <Navigate to="/admin/inventory" replace /> : (
                  <Inventory 
                    inventory={inventory}
                    onUpdateInventory={handleUpdateInventory}
                    showToast={showToast}
                  />
                )}
              </ProtectedRoute>
            } />
            
            <Route path="/suppliers" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <Navigate to="/admin/inventory" replace /> : (
                  <Suppliers 
                    inventory={inventory}
                    onUpdateInventory={handleUpdateInventory}
                    showToast={showToast}
                  />
                )}
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <Navigate to="/admin/analytics" replace /> : (
                  <Analytics inventory={inventory} />
                )}
              </ProtectedRoute>
            } />
            
            <Route path="/billing" element={
              <ProtectedRoute user={user}>
                <BillingPage user={user} />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute user={user}>
                <Settings user={user} />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes - IMPORTANT: These must be defined */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <AdminDashboard admin={user} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <AdminUsers admin={user} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/admin/inventory" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <AdminInventory admin={user} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/admin/subscriptions" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <AdminSubscriptions admin={user} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/admin/analytics" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <AdminAnalytics admin={user} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <AdminSettings admin={user} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            {/* Payment Routes */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

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