// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth, db, onAuthStateChanged, doc, getDoc } from './firebaseConfig'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// Import pages
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Analytics from './pages/Analytics'
import BillingPage from './pages/BillingPage'
import Settings from './pages/Settings'

// Import subscription services
import subscriptionService from './services/subscriptionService'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState([])
  const [toastMsg, setToastMsg] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "No user");
      
      if (firebaseUser) {
        try {
          // Get user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let role = 'user';
          let userData = {};
          
          if (userDoc.exists()) {
            userData = userDoc.data();
            role = userData.role || 'user';
          } else {
            // Create user document if it doesn't exist
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
          
          // Load inventory for regular users
          if (role === 'user') {
            const savedInventory = localStorage.getItem(`shelflife_inventory_${firebaseUser.uid}`);
            if (savedInventory) {
              setInventory(JSON.parse(savedInventory));
            } else {
              // Load initial inventory
              const { initialInventory } = await import('./data/inventoryData');
              setInventory(initialInventory);
              localStorage.setItem(`shelflife_inventory_${firebaseUser.uid}`, JSON.stringify(initialInventory));
            }
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

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setUserRole(userData.role || 'user');
    setShowLogin(false);
    showToast(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserRole('user');
      showToast('You have been signed out');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateInventory = (newInventory) => {
    setInventory(newInventory);
    if (user && user.uid) {
      localStorage.setItem(`shelflife_inventory_${user.uid}`, JSON.stringify(newInventory));
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading ShelfLife AI...</p>
      </div>
    );
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
            <Route path="/" element={
              user ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace /> : 
              <LandingPage onLoginClick={() => setShowLogin(true)} />
            } />
            
            {/* User Routes */}
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
            
            {/* Admin Routes - Simple for now */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute user={user}>
                {isAdmin ? (
                  <div className="admin-container">
                    <h1>Admin Dashboard</h1>
                    <p>Welcome, {user?.name}</p>
                  </div>
                ) : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
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