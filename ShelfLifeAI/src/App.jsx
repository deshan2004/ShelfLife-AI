// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc } from './firebaseConfig'
import { api } from './services/apiService'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import ProtectedRoute from './components/ProtectedRoute'
import Chatbot from './components/Chatbot'
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
  const [actionLoading, setActionLoading] = useState(null)
  const [subscription, setSubscription] = useState(null)

  // ✅ Setup global toast for Chatbot
  useEffect(() => {
    window.showToast = showToast;

    const handleFlashSaleEvent = (event) => {
      console.log('Flash sale event received:', event.detail);
    };

    window.addEventListener('flashSaleApplied', handleFlashSaleEvent);
    return () => window.removeEventListener('flashSaleApplied', handleFlashSaleEvent);
  }, []);

  // ✅ Load subscription from backend
  const loadSubscription = async (userId) => {
    if (!userId) return null;
    try {
      console.log('🔄 Loading subscription for user:', userId);
      const response = await fetch(`http://localhost:5000/api/subscription/${userId}`);
      const data = await response.json();
      console.log('✅ Subscription loaded:', data);
      
      if (data && data.planId) {
        setSubscription(data);
        // Update user object
        setUser(prev => ({
          ...prev,
          subscription: data,
          planId: data.planId,
          planName: data.planId === 'FREE_TRIAL' ? 'Free Trial' : data.planId
        }));
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('shelflife_user') || '{}');
        userData.subscription = data;
        userData.planId = data.planId;
        userData.planName = data.planId === 'FREE_TRIAL' ? 'Free Trial' : data.planId;
        localStorage.setItem('shelflife_user', JSON.stringify(userData));
        return data;
      }
    } catch (error) {
      console.error('❌ Failed to load subscription:', error);
      // Try localStorage fallback
      try {
        const userData = JSON.parse(localStorage.getItem('shelflife_user') || '{}');
        if (userData.subscription) {
          setSubscription(userData.subscription);
          return userData.subscription;
        }
      } catch (e) {}
    }
    return null;
  };

  // ✅ Load inventory from BACKEND
  const loadUserInventory = async (userId, forceRefresh = false) => {
    if (!userId) return;

    try {
      console.log('🔄 Loading inventory from backend for user:', userId);
      const data = await api.getInventory(userId);
      const items = data.items || [];
      console.log(`✅ Loaded ${items.length} products from backend`);
      
      setInventory(items);
      localStorage.setItem(`shelflife_inventory_${userId}`, JSON.stringify(items));
      return items;
    } catch (error) {
      console.error('❌ Error loading inventory from server:', error);
      
      const savedInventory = localStorage.getItem(`shelflife_inventory_${userId}`);
      if (savedInventory) {
        try {
          const items = JSON.parse(savedInventory);
          console.log(`📦 Loaded ${items.length} products from localStorage fallback`);
          setInventory(items);
          return items;
        } catch (e) {
          console.error('❌ Error parsing localStorage:', e);
        }
      }
      
      await seedInitialInventory(userId);
      return [];
    }
  };

  // ✅ Seed initial inventory if empty
  const seedInitialInventory = async (userId) => {
    try {
      const { initialInventory } = await import('./data/inventoryData');
      console.log('🌱 Seeding initial inventory...');
      
      let addedCount = 0;
      for (const product of initialInventory) {
        try {
          const result = await api.addProduct(userId, product);
          if (result.success) addedCount++;
        } catch (e) {
          console.error('Error seeding product:', e);
        }
      }
      
      console.log(`✅ Seeded ${addedCount} products`);
      await loadUserInventory(userId, true);
    } catch (error) {
      console.error('❌ Seed error:', error);
    }
  };

  // ============================================================
  // ✅ SMART ACTIONS (for Navbar Alerts & Chatbot)
  // ============================================================

  // 🔥 Flash Sale
  const handleFlashSale = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    let discount = '30% OFF';
    let saleType = 'Flash Sale';
    let discountMultiplier = 0.7;
    
    if (product.daysLeft <= 1) {
      discount = '50% OFF';
      saleType = 'Buy 1 Get 1 Free';
      discountMultiplier = 0.5;
    } else if (product.daysLeft <= 2) {
      discount = '40% OFF';
      saleType = 'Flash Sale';
      discountMultiplier = 0.6;
    } else if (product.daysLeft <= 7) {
      discount = '30% OFF';
      saleType = 'Flash Sale';
      discountMultiplier = 0.7;
    }
    
    if (!window.confirm(`Apply ${discount} ${saleType} to "${product.name}"?`)) return;
    
    setActionLoading(productId);
    
    try {
      const newPrice = Math.round(product.sellingPrice * discountMultiplier);
      const updates = {
        sellingPrice: newPrice,
        suggestion: `🔥 ${saleType} ACTIVE - ${discount}`,
        flashSaleActive: true,
        flashSaleDiscount: discount,
        flashSaleAppliedAt: new Date().toISOString()
      };
      
      const result = await api.updateProduct(user.uid, productId, updates);
      
      if (result.success) {
        showToast(`🔥 ${saleType} applied to ${product.name}! New price: LKR ${newPrice}`);
        
        const event = new CustomEvent('flashSaleApplied', {
          detail: {
            productName: product.name,
            discount: discount,
            newPrice: newPrice,
            saleType: saleType
          }
        });
        window.dispatchEvent(event);
        
        await loadUserInventory(user.uid, true);
        await loadSubscription(user.uid); // ✅ Refresh subscription data
      } else {
        showToast(`❌ Failed to apply flash sale: ${result.error}`);
      }
    } catch (error) {
      console.error('Flash sale error:', error);
      showToast(`❌ ${error.message || 'Failed to apply flash sale'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 📦 Order Now (Low Stock)
  const handleOrderNow = async (productId) => {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    
    const orderQuantity = window.prompt(
      `📦 Order more stock for "${product.name}"\nCurrent stock: ${product.stock}\nLow stock threshold: ${product.lowStockThreshold}\n\nEnter quantity to order:`,
      product.lowStockThreshold + 10
    );
    
    if (orderQuantity === null) return;
    
    const qty = parseInt(orderQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('❌ Invalid quantity');
      return;
    }
    
    if (!window.confirm(`📦 Place order for ${qty} units of "${product.name}" from ${product.supplier}?`)) return;
    
    setActionLoading(productId);
    
    try {
      const newStock = product.stock + qty;
      const updates = {
        stock: newStock,
        suggestion: `📦 Order placed on ${new Date().toLocaleDateString()} (${qty} units)`,
        lastOrderDate: new Date().toISOString(),
        lastOrderQuantity: qty
      };
      
      const result = await api.updateProduct(user.uid, productId, updates);
      
      if (result.success) {
        showToast(`📦 Order placed for ${qty} units of ${product.name}! New stock: ${newStock}`);
        await loadUserInventory(user.uid, true);
      } else {
        showToast(`❌ Failed to place order: ${result.error}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      showToast(`❌ ${error.message || 'Failed to place order'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // END OF SMART ACTIONS
  // ============================================================

  // ✅ Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
              phone: '',
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
            phone: userData.phone || '',
            photoURL: firebaseUser.photoURL,
            role: role,
            ...userData
          };

          setUser(fullUserData);
          setUserRole(role);
          localStorage.setItem('shelflife_user', JSON.stringify(fullUserData));

          if (role === 'user' || role === 'admin') {
            await loadUserInventory(firebaseUser.uid);
            await loadSubscription(firebaseUser.uid); // ✅ Load subscription after login
          }
        } catch (error) {
          console.error("❌ Error loading user data:", error);
        }
      } else {
        setUser(null);
        setUserRole('user');
        localStorage.removeItem('shelflife_user');
        setInventory([]);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setUserRole(userData.role || 'user');
    setShowLogin(false);
    showToast(`Welcome back, ${userData.name}!`);
    if (userData.uid) {
      loadUserInventory(userData.uid);
      loadSubscription(userData.uid);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserRole('user');
      setInventory([]);
      setSubscription(null);
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

  // ✅ Get plan name from subscription
  const getPlanName = () => {
    if (subscription) {
      if (subscription.planId === 'FREE_TRIAL') return 'Free Trial';
      if (subscription.planId === 'BASIC') return 'Basic';
      if (subscription.planId === 'PROFESSIONAL') return 'Professional';
      if (subscription.planId === 'ENTERPRISE') return 'Enterprise';
      return subscription.planId;
    }
    // Fallback to user object
    if (user?.planId) {
      if (user.planId === 'FREE_TRIAL') return 'Free Trial';
      if (user.planId === 'BASIC') return 'Basic';
      if (user.planId === 'PROFESSIONAL') return 'Professional';
      if (user.planId === 'ENTERPRISE') return 'Enterprise';
      return user.planId;
    }
    return 'Free Trial';
  };

  // ✅ Get product limit from subscription
  const getProductLimit = () => {
    if (subscription?.limits?.maxProducts) {
      return subscription.limits.maxProducts;
    }
    if (user?.subscription?.limits?.maxProducts) {
      return user.subscription.limits.maxProducts;
    }
    return 50;
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const planName = getPlanName();
  const productLimit = getProductLimit();

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
          inventory={inventory}
          onFlashSale={handleFlashSale}
          onOrderNow={handleOrderNow}
          actionLoading={actionLoading}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              user ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace /> :
                <LandingPage onLoginClick={() => setShowLogin(true)} />
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                {isAdmin ? <Navigate to="/admin/dashboard" replace /> : (
                  <Dashboard
                    inventory={inventory}
                    onUpdateInventory={handleUpdateInventory}
                    showToast={showToast}
                    subscriptionStatus={subscription?.status}
                    trialDaysLeft={subscription?.trialEnd ? Math.ceil((new Date(subscription.trialEnd) - new Date()) / (1000 * 60 * 60 * 24)) : 0}
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
                    user={user}
                    refreshInventory={() => loadUserInventory(user?.uid, true)}
                    planName={planName}
                    productLimit={productLimit}
                    subscription={subscription}
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
                    user={user}
                    refreshInventory={() => loadUserInventory(user?.uid, true)}
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
                <BillingPage user={user} subscription={subscription} />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute user={user}>
                <Settings user={user} />
              </ProtectedRoute>
            } />

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

            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {user && <Footer />}

        {toastMsg && (
          <div className="toast-notification">
            <i className="fas fa-info-circle"></i>
            <span>{toastMsg}</span>
          </div>
        )}

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />

        <Chatbot />
      </div>
    </Router>
  );
}

export default App;