// api/index.js - Vercel Serverless Function
// මෙය ඔබගේ server.cjs එක Vercel එකට ගැලපෙන ලෙස පරිවර්තනය කළ අනුවාදයයි

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ============================================================
// 🔥 FIREBASE ADMIN SDK INITIALIZATION (Vercel Environment)
// ============================================================
if (!admin.apps.length) {
  try {
    // Vercel environment variables වලින් Firebase credentials load කරන්න
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

// ============================================================
// 🏥 HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development'
  });
});

// ============================================================
// 👤 USER ENDPOINTS
// ============================================================

// 1. GET USER PROFILE
app.get('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. UPDATE USER PROFILE
app.put('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    await db.collection('users').doc(uid).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 📦 SUPPLIER MANAGEMENT (User)
// ============================================================

// GET all suppliers for a user
app.get('/api/suppliers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const docRef = db.collection('suppliers').doc(userId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await docRef.set({ list: [], updatedAt: new Date().toISOString() });
      return res.json({ list: [] });
    }
    
    res.json(doc.data());
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ADD new supplier
app.post('/api/suppliers/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, contact, email, address, rating, notes } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    
    const docRef = db.collection('suppliers').doc(userId);
    const doc = await docRef.get();
    let list = doc.exists ? doc.data().list || [] : [];
    
    // Check for duplicate name
    if (list.some(s => s.name.toLowerCase() === name.toLowerCase().trim())) {
      return res.status(400).json({ error: 'Supplier with this name already exists' });
    }
    
    const newSupplier = {
      id: `supp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      contact: contact || '',
      email: email || '',
      address: address || '',
      rating: rating || 0,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    list.push(newSupplier);
    
    await docRef.set({
      list: list,
      updatedAt: new Date().toISOString()
    });
    
    // Update subscription usage count
    const subRef = db.collection('subscriptions').doc(userId);
    const subDoc = await subRef.get();
    if (subDoc.exists) {
      await subRef.update({
        'usage.suppliersCount': list.length,
        updatedAt: new Date().toISOString()
      });
    }
    
    res.status(201).json({ success: true, supplier: newSupplier, total: list.length });
  } catch (error) {
    console.error("Add supplier error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE supplier
app.put('/api/suppliers/:userId/update/:supplierId', async (req, res) => {
  try {
    const { userId, supplierId } = req.params;
    const updates = req.body;
    
    const docRef = db.collection('suppliers').doc(userId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Supplier list not found' });
    }
    
    let list = doc.data().list || [];
    const index = list.findIndex(s => s.id === supplierId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await docRef.set({
      list: list,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, supplier: list[index] });
  } catch (error) {
    console.error("Update supplier error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE supplier
app.delete('/api/suppliers/:userId/delete/:supplierId', async (req, res) => {
  try {
    const { userId, supplierId } = req.params;
    
    const docRef = db.collection('suppliers').doc(userId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Supplier list not found' });
    }
    
    let list = doc.data().list || [];
    const index = list.findIndex(s => s.id === supplierId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    list.splice(index, 1);
    
    await docRef.set({
      list: list,
      updatedAt: new Date().toISOString()
    });
    
    // Update subscription usage count
    const subRef = db.collection('subscriptions').doc(userId);
    await subRef.update({
      'usage.suppliersCount': list.length,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, total: list.length });
  } catch (error) {
    console.error("Delete supplier error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 📦 INVENTORY MANAGEMENT (User)
// ============================================================

// GET inventory
app.get('/api/inventory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const invDoc = await db.collection('inventory').doc(userId).get();
    
    if (!invDoc.exists) {
      await db.collection('inventory').doc(userId).set({
        items: [],
        lastUpdated: new Date().toISOString(),
        itemCount: 0
      });
      return res.json({ items: [], itemCount: 0 });
    }
    
    res.json(invDoc.data());
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ADD product
app.post('/api/inventory/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { product } = req.body;
    
    if (!product || !product.name) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    const invDoc = await db.collection('inventory').doc(userId).get();
    let items = invDoc.exists ? invDoc.data().items || [] : [];
    
    // Check subscription limit
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const maxProducts = subDoc.exists ? subDoc.data().limits?.maxProducts || 50 : 50;
    
    if (items.length >= maxProducts) {
      return res.status(403).json({ 
        error: 'Product limit reached', 
        limit: maxProducts,
        current: items.length
      });
    }
    
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const newProduct = { 
      id: newId, 
      ...product, 
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newProduct);
    
    await db.collection('inventory').doc(userId).set({
      items: items,
      lastUpdated: new Date().toISOString(),
      itemCount: items.length
    });

    await db.collection('subscriptions').doc(userId).update({
      'usage.productsCount': items.length,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, product: newProduct, total: items.length });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE product
app.put('/api/inventory/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemId, updates } = req.body;
    
    const invDoc = await db.collection('inventory').doc(userId).get();
    let items = invDoc.exists ? invDoc.data().items || [] : [];
    
    const index = items.findIndex(i => i.id === itemId);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });
    
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    
    await db.collection('inventory').doc(userId).set({
      items: items,
      lastUpdated: new Date().toISOString(),
      itemCount: items.length
    });
    
    res.json({ success: true, item: items[index] });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE product
app.delete('/api/inventory/:userId/delete/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    const invDoc = await db.collection('inventory').doc(userId).get();
    let items = invDoc.exists ? invDoc.data().items || [] : [];
    items = items.filter(i => i.id !== parseInt(itemId));
    
    await db.collection('inventory').doc(userId).set({
      items: items,
      lastUpdated: new Date().toISOString(),
      itemCount: items.length
    });
    
    await db.collection('subscriptions').doc(userId).update({
      'usage.productsCount': items.length,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, total: items.length });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 💳 SUBSCRIPTION MANAGEMENT (User)
// ============================================================

// GET subscription status
app.get('/api/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    
    if (!subDoc.exists) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const subscription = {
        userId: userId,
        planId: 'FREE_TRIAL',
        status: 'trial_active',
        trialStart: new Date().toISOString(),
        trialEnd: trialEnd.toISOString(),
        features: {
          canBasicScan: true,
          canOCRScan: true,
          canBarcodeScan: true,
          canFlashSale: true,
          canSupplierReturn: false,
          canBasicAnalytics: true,
          canAdvancedAnalytics: false,
          canPrioritySupport: false,
          canAPIAccess: false,
          canMultiUser: false,
          canExportData: false,
          canCustomReports: false
        },
        limits: { maxProducts: 50, maxSuppliers: 10, maxScansPerMonth: 100 },
        usage: { productsCount: 0, suppliersCount: 0, scansThisMonth: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.collection('subscriptions').doc(userId).set(subscription);
      res.json(subscription);
    } else {
      res.json(subDoc.data());
    }
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPGRADE subscription
app.post('/api/subscription/upgrade', async (req, res) => {
  try {
    const { userId, planId } = req.body;
    
    const planLimits = {
      BASIC: { maxProducts: 200, maxSuppliers: 25, maxScansPerMonth: 500 },
      PROFESSIONAL: { maxProducts: 1000, maxSuppliers: 100, maxScansPerMonth: 2000 },
      ENTERPRISE: { maxProducts: Infinity, maxSuppliers: Infinity, maxScansPerMonth: Infinity }
    };

    const planFeatures = {
      BASIC: { canSupplierReturn: true, canBasicAnalytics: true },
      PROFESSIONAL: { 
        canOCRScan: true, 
        canSupplierReturn: true, 
        canAdvancedAnalytics: true, 
        canPrioritySupport: true, 
        canExportData: true 
      },
      ENTERPRISE: { 
        canOCRScan: true, 
        canSupplierReturn: true, 
        canAdvancedAnalytics: true, 
        canPrioritySupport: true, 
        canAPIAccess: true, 
        canMultiUser: true, 
        canExportData: true, 
        canCustomReports: true 
      }
    };

    const limits = planLimits[planId] || planLimits.BASIC;
    const features = planFeatures[planId] || planFeatures.BASIC;

    await db.collection('subscriptions').doc(userId).update({
      planId: planId,
      status: 'active',
      limits: limits,
      features: {
        canBasicScan: true,
        canBarcodeScan: true,
        canFlashSale: true,
        canBasicAnalytics: true,
        ...features
      },
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: `Upgraded to ${planId} successfully` });
  } catch (error) {
    console.error("Upgrade plan error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 📊 USAGE CHECK
// ============================================================
app.get('/api/usage/:userId/:type', async (req, res) => {
  try {
    const { userId, type } = req.params;
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    
    if (!subDoc.exists) {
      return res.json({ current: 0, limit: 50, remaining: 50, percentageUsed: 0 });
    }
    
    const subscription = subDoc.data();
    let current = 0, limit = 50;
    
    switch (type) {
      case 'products':
        current = subscription.usage?.productsCount || 0;
        limit = subscription.limits?.maxProducts || 50;
        break;
      case 'suppliers':
        current = subscription.usage?.suppliersCount || 0;
        limit = subscription.limits?.maxSuppliers || 10;
        break;
      case 'scans':
        current = subscription.usage?.scansThisMonth || 0;
        limit = subscription.limits?.maxScansPerMonth || 100;
        break;
      default:
        return res.json({ current: 0, limit: 0, remaining: 0, percentageUsed: 0 });
    }
    
    const remaining = Math.max(0, limit - current);
    const percentageUsed = limit > 0 ? (current / limit) * 100 : 0;
    
    res.json({ current, limit, remaining, percentageUsed });
  } catch (error) {
    console.error("Usage check error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 🛡️ ADMIN ENDPOINTS
// ============================================================

// GET all users (admin only - add auth check in production)
app.get('/api/admin/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data()
    }));
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all subscriptions (admin only)
app.get('/api/admin/subscriptions', async (req, res) => {
  try {
    const snapshot = await db.collection('subscriptions').get();
    const subscriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.id,
      ...doc.data()
    }));
    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all suppliers (admin)
app.get('/api/admin/suppliers', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const allSuppliers = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        if (supplierDoc.exists) {
          const supplierList = supplierDoc.data().list || [];
          supplierList.forEach(supplier => {
            allSuppliers.push({
              ...supplier,
              ownerId: userId,
              ownerName: userData.name || 'Unknown',
              ownerEmail: userData.email || '',
              shopName: userData.businessName || userData.name || 'Unknown Shop'
            });
          });
        }
      } catch (e) {
        console.log(`No suppliers for user ${userId}`);
      }
    }

    res.json(allSuppliers);
  } catch (error) {
    console.error('Get all suppliers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all inventory (admin)
app.get('/api/admin/inventory', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const allProducts = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        const invDoc = await db.collection('inventory').doc(userId).get();
        if (invDoc.exists) {
          const items = invDoc.data().items || [];
          items.forEach(item => {
            allProducts.push({
              ...item,
              ownerId: userId,
              ownerName: userData.name || 'Unknown',
              ownerEmail: userData.email || '',
              shopName: userData.businessName || userData.name || 'Unknown Shop'
            });
          });
        }
      } catch (e) {
        console.log(`No inventory for user ${userId}`);
      }
    }

    res.json(allProducts);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET inventory by shop (grouped)
app.get('/api/admin/inventory/by-shop', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const groupedInventory = {};

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      groupedInventory[userId] = {
        shopId: userId,
        shopName: userData.businessName || userData.name || 'Unknown Shop',
        ownerName: userData.name || 'Unknown',
        ownerEmail: userData.email || '',
        products: []
      };

      try {
        const invDoc = await db.collection('inventory').doc(userId).get();
        if (invDoc.exists) {
          const items = invDoc.data().items || [];
          items.forEach(item => {
            groupedInventory[userId].products.push({
              ...item,
              ownerId: userId
            });
          });
        }
      } catch (e) {
        console.log(`No inventory for user ${userId}`);
      }
    }

    const result = Object.values(groupedInventory);
    res.json(result);
  } catch (error) {
    console.error('Get grouped inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET admin stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalUsers = users.length;

    const subsSnapshot = await db.collection('subscriptions').get();
    const subscriptions = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const activeSubs = subscriptions.filter(s => s.status === 'active').length;
    const trialUsers = subscriptions.filter(s => s.status === 'trial_active').length;
    const expiredTrials = subscriptions.filter(s => s.status === 'trial_expired').length;
    
    const planPrices = { BASIC: 2500, PROFESSIONAL: 5900, ENTERPRISE: 14900 };
    const totalRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (planPrices[s.planId] || 0), 0);

    let totalProducts = 0;
    for (const user of users) {
      try {
        const invDoc = await db.collection('inventory').doc(user.id).get();
        if (invDoc.exists) {
          totalProducts += (invDoc.data().items || []).length;
        }
      } catch (e) {}
    }

    let totalSuppliers = 0;
    for (const user of users) {
      try {
        const supplierDoc = await db.collection('suppliers').doc(user.id).get();
        if (supplierDoc.exists) {
          totalSuppliers += (supplierDoc.data().list || []).length;
        }
      } catch (e) {}
    }

    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(u => ({
        name: u.name || 'Unknown',
        email: u.email || '',
        createdAt: u.createdAt || new Date().toISOString()
      }));

    res.json({
      totalUsers,
      totalProducts,
      totalSuppliers,
      totalRevenue,
      activeSubscriptions: activeSubs,
      trialUsers,
      expiredTrials,
      recentUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE user role (admin)
app.put('/api/admin/users/:uid/role', async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    await db.collection('users').doc(uid).update({
      role: role,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE user (admin)
app.delete('/api/admin/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    await db.collection('users').doc(uid).delete();
    await db.collection('subscriptions').doc(uid).delete();
    await db.collection('inventory').doc(uid).delete();
    await db.collection('suppliers').doc(uid).delete();

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXTEND trial (admin)
app.post('/api/admin/subscriptions/:uid/extend', async (req, res) => {
  try {
    const { uid } = req.params;
    const { days } = req.body;

    const subDoc = await db.collection('subscriptions').doc(uid).get();
    if (!subDoc.exists) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const currentEnd = new Date(subDoc.data().trialEnd || new Date());
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + (days || 7));

    await db.collection('subscriptions').doc(uid).update({
      trialEnd: newEnd.toISOString(),
      status: 'trial_active',
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: `Trial extended by ${days || 7} days`,
      newEnd: newEnd.toISOString()
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SEED test data (admin)
app.post('/api/seed/data', async (req, res) => {
  try {
    const { adminUid } = req.body;

    const testUsers = [
      {
        uid: 'test_user_1',
        name: 'Dineth Perera',
        email: 'dineth@example.com',
        role: 'user',
        businessName: 'Dineth Supermarket',
        createdAt: new Date().toISOString()
      },
      {
        uid: 'test_user_2',
        name: 'Kamal Silva',
        email: 'kamal@example.com',
        role: 'user',
        businessName: 'Kamal Grocery Store',
        createdAt: new Date().toISOString()
      },
      {
        uid: 'test_user_3',
        name: 'Nimal Fernando',
        email: 'nimal@example.com',
        role: 'user',
        businessName: 'Nimal Fresh Mart',
        createdAt: new Date().toISOString()
      }
    ];

    const testSuppliers = {
      'test_user_1': [
        { name: 'Dairy Farms', contact: '+94 11 234 5678', email: 'orders@dairyfarms.lk', address: 'Colombo', rating: 5, notes: 'Best dairy products' },
        { name: 'Bakery Hub', contact: '+94 77 345 6789', email: 'info@bakeryhub.lk', address: 'Kandy', rating: 4, notes: 'Fresh bread daily' },
        { name: 'Global Foods', contact: '+94 11 456 7890', email: 'sales@globalfoods.lk', address: 'Negombo', rating: 3, notes: 'Good canned goods' }
      ],
      'test_user_2': [
        { name: 'Local Mart', contact: '+94 55 678 9012', email: 'orders@localmart.lk', address: 'Galle', rating: 4, notes: 'Reliable supplier' },
        { name: 'HealthVibe', contact: '+94 77 890 1234', email: 'contact@healthvibe.lk', address: 'Colombo', rating: 5, notes: 'Excellent service' }
      ],
      'test_user_3': [
        { name: 'Fresh Farms', contact: '+94 66 234 5678', email: 'info@freshfarms.lk', address: 'Kurunegala', rating: 4, notes: 'Organic products' },
        { name: 'Spice World', contact: '+94 88 345 6789', email: 'sales@spiceworld.lk', address: 'Matale', rating: 3, notes: 'Good spices' }
      ]
    };

    for (const user of testUsers) {
      await db.collection('users').doc(user.uid).set(user);

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      
      const isPro = user.uid === 'test_user_1';
      await db.collection('subscriptions').doc(user.uid).set({
        userId: user.uid,
        planId: isPro ? 'PROFESSIONAL' : 'FREE_TRIAL',
        status: isPro ? 'active' : 'trial_active',
        trialStart: new Date().toISOString(),
        trialEnd: trialEnd.toISOString(),
        features: {
          canBasicScan: true,
          canOCRScan: isPro,
          canBarcodeScan: true,
          canFlashSale: true,
          canSupplierReturn: isPro,
          canBasicAnalytics: true,
          canAdvancedAnalytics: isPro,
          canPrioritySupport: isPro
        },
        limits: {
          maxProducts: isPro ? 1000 : 50,
          maxSuppliers: isPro ? 100 : 10,
          maxScansPerMonth: isPro ? 2000 : 100
        },
        usage: {
          productsCount: isPro ? 5 : 3,
          suppliersCount: testSuppliers[user.uid]?.length || 0,
          scansThisMonth: 10
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Products
      const shopProducts = {
        'test_user_1': [
          { id: 1, name: 'Fresh Milk (1L)', batch: 'B001', supplier: 'Dairy Farms', stock: 24, expiryDate: '2026-08-15', costPrice: 280, sellingPrice: 350, lowStockThreshold: 10, daysLeft: 30, status: 'good', suggestion: 'Normal Stock' },
          { id: 2, name: 'Greek Yogurt', batch: 'B002', supplier: 'Dairy Farms', stock: 15, expiryDate: '2026-07-20', costPrice: 180, sellingPrice: 220, lowStockThreshold: 8, daysLeft: 5, status: 'warning', suggestion: 'Flash Sale recommended' },
          { id: 3, name: 'Wheat Bread', batch: 'B003', supplier: 'Bakery Hub', stock: 5, expiryDate: '2026-07-05', costPrice: 120, sellingPrice: 150, lowStockThreshold: 10, daysLeft: 2, status: 'critical', suggestion: 'URGENT: Flash Sale NOW!' }
        ],
        'test_user_2': [
          { id: 1, name: 'Tomato Ketchup', batch: 'B101', supplier: 'Local Mart', stock: 18, expiryDate: '2026-08-10', costPrice: 380, sellingPrice: 450, lowStockThreshold: 12, daysLeft: 25, status: 'good', suggestion: 'Normal Stock' },
          { id: 2, name: 'Probiotic Drink', batch: 'B102', supplier: 'HealthVibe', stock: 9, expiryDate: '2026-07-14', costPrice: 420, sellingPrice: 520, lowStockThreshold: 15, daysLeft: 4, status: 'warning', suggestion: 'Flash Sale recommended' }
        ],
        'test_user_3': [
          { id: 1, name: 'Organic Rice (5kg)', batch: 'B201', supplier: 'Fresh Farms', stock: 30, expiryDate: '2026-10-01', costPrice: 850, sellingPrice: 950, lowStockThreshold: 20, daysLeft: 90, status: 'good', suggestion: 'Normal Stock' },
          { id: 2, name: 'Cinnamon Sticks', batch: 'B202', supplier: 'Spice World', stock: 8, expiryDate: '2026-11-15', costPrice: 1200, sellingPrice: 1500, lowStockThreshold: 5, daysLeft: 130, status: 'good', suggestion: 'Normal Stock' }
        ]
      };

      const products = shopProducts[user.uid] || [];
      await db.collection('inventory').doc(user.uid).set({
        items: products,
        lastUpdated: new Date().toISOString(),
        itemCount: products.length
      });

      // Suppliers
      const supplierList = testSuppliers[user.uid] || [];
      const suppliersWithId = supplierList.map((s, index) => ({
        id: `supp_${user.uid}_${index}`,
        ...s,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      await db.collection('suppliers').doc(user.uid).set({
        list: suppliersWithId,
        updatedAt: new Date().toISOString()
      });
    }

    if (adminUid) {
      await db.collection('users').doc(adminUid).update({
        role: 'admin',
        updatedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Test data added successfully!',
      users: testUsers.length
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 🚀 EXPORT SERVERLESS FUNCTION
// ============================================================
module.exports = app;