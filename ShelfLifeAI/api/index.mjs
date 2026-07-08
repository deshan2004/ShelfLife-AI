// api/index.mjs - Complete Vercel Serverless Function
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import crypto from 'crypto';

const app = express();

// ============================================================
// ✅ MIDDLEWARE
// ============================================================
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins for simplicity (Vercel same-origin, but also supports localhost)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://shelflife-ai.vercel.app',
      'https://shelflife-ai-git-main.vercel.app'
    ];
    if (allowed.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// 🔥 FIREBASE ADMIN INITIALIZE
// ============================================================
let db, auth;
let firebaseInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps || admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    auth = admin.auth();
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not set. Firebase features will not work.');
}

// ============================================================
// 🏥 HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    firebase: firebaseInitialized ? 'connected' : 'disconnected',
    environment: process.env.VERCEL ? 'vercel' : 'development'
  });
});

// ============================================================
// ✅ VALIDATION HELPERS
// ============================================================
const validateProduct = (product) => {
  const errors = [];
  if (!product.name || product.name.trim().length < 2) {
    errors.push('Product name is required (minimum 2 characters)');
  }
  if (!product.expiryDate) {
    errors.push('Expiry date is required');
  }
  if (product.stock !== undefined && (isNaN(product.stock) || product.stock < 0)) {
    errors.push('Stock must be a positive number');
  }
  if (product.costPrice !== undefined && (isNaN(product.costPrice) || product.costPrice < 0)) {
    errors.push('Cost price must be a positive number');
  }
  if (product.sellingPrice !== undefined && (isNaN(product.sellingPrice) || product.sellingPrice < 0)) {
    errors.push('Selling price must be a positive number');
  }
  return errors;
};

const validateSupplier = (supplier) => {
  const errors = [];
  if (!supplier.name || supplier.name.trim().length < 2) {
    errors.push('Supplier name is required (minimum 2 characters)');
  }
  if (supplier.email && !supplier.email.includes('@')) {
    errors.push('Invalid email format');
  }
  return errors;
};

// ============================================================
// 💳 PAYHERE CONFIG
// ============================================================
const PAYHERE_MERCHANT_ID = process.env.VITE_PAYHERE_MERCHANT_ID || '1235220';
const PAYHERE_MERCHANT_SECRET = process.env.VITE_PAYHERE_MERCHANT_SECRET || 'NDg1ODU3OTczNzYwMzc1MTQxNjk4MTU3MTcxMzg3NDc0MDM4Nw==';

function generatePayHereHash(merchantId, orderId, amount, currency, merchantSecret) {
  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const hashString = merchantId + orderId + amount + currency + hashedSecret;
  return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
}

// ============================================================
// 💳 PAYHERE PAYMENT INITIATE
// ============================================================
app.post('/api/payment/initiate', (req, res) => {
  try {
    const { userId, planId, amount, orderId, firstName, lastName, email, phone, address } = req.body;
    if (!userId || !planId || !amount || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const currency = 'LKR';
    const hash = generatePayHereHash(
      PAYHERE_MERCHANT_ID,
      orderId,
      amount,
      currency,
      PAYHERE_MERCHANT_SECRET
    );
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173';
    const paymentData = {
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      notify_url: `${baseUrl}/api/payment/notify`,
      order_id: orderId,
      items: `${planId} Plan - Monthly Subscription`,
      currency: currency,
      amount: amount,
      first_name: firstName || 'Demo',
      last_name: lastName || 'User',
      email: email || 'test@example.com',
      phone: phone || '0771234567',
      address: address || 'No. 1, Galle Road, Colombo',
      city: 'Colombo',
      country: 'Sri Lanka',
      custom_1: userId,
      custom_2: planId,
      hash: hash
    };
    res.json({ success: true, paymentData });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// ============================================================
// 📦 INVENTORY ENDPOINTS
// ============================================================

// GET Inventory
app.get('/api/inventory/:userId', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const invDoc = await db.collection('inventory').doc(userId).get();
    if (!invDoc.exists) {
      await db.collection('inventory').doc(userId).set({
        items: [],
        lastUpdated: new Date().toISOString(),
        itemCount: 0
      });
      return res.json({ items: [], itemCount: 0 });
    }
    const data = invDoc.data();
    if (!data.items) {
      data.items = [];
      data.itemCount = 0;
    }
    res.json(data);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
  }
});

// ADD Product
app.post('/api/inventory/:userId/add', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { userId } = req.params;
    const { product } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'Product data is required' });
    }
    const errors = validateProduct(product);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const invDoc = await db.collection('inventory').doc(userId).get();
    let items = invDoc.exists ? invDoc.data().items || [] : [];
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const maxProducts = subDoc.exists ? subDoc.data().limits?.maxProducts || 50 : 50;
    if (items.length >= maxProducts) {
      return res.status(403).json({
        error: 'Product limit reached',
        limit: maxProducts,
        current: items.length
      });
    }
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
    const expiryDate = new Date(product.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    const newProduct = {
      id: newId,
      name: product.name.trim(),
      batch: product.batch || `B${String(Date.now()).slice(-6)}`,
      batchDate: product.batchDate || new Date().toISOString().split('T')[0],
      supplier: product.supplier || 'Manual Entry',
      supplierContact: product.supplierContact || 'N/A',
      supplierEmail: product.supplierEmail || 'N/A',
      expiryDate: product.expiryDate,
      daysLeft: daysLeft,
      status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good',
      suggestion: daysLeft <= 7 ? 'Monitor closely' : 'Normal Stock',
      stock: product.stock || 1,
      lowStockThreshold: product.lowStockThreshold || 10,
      costPrice: product.costPrice || 100,
      sellingPrice: product.sellingPrice || 150,
      addedAt: new Date().toISOString()
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
    res.status(201).json({
      success: true,
      product: newProduct,
      total: items.length
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Failed to add product', details: error.message });
  }
});

// UPDATE Product
app.put('/api/inventory/:userId/update', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { userId } = req.params;
    const { itemId, updates } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    const invDoc = await db.collection('inventory').doc(userId).get();
    if (!invDoc.exists) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    let items = invDoc.data().items || [];
    const index = items.findIndex(i => i.id === itemId);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    if (updates.expiryDate) {
      const expiryDate = new Date(updates.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      items[index].daysLeft = daysLeft;
      items[index].status = daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good';
      items[index].suggestion = daysLeft <= 7 ? 'Monitor closely' : 'Normal Stock';
    }
    await db.collection('inventory').doc(userId).set({
      items: items,
      lastUpdated: new Date().toISOString(),
      itemCount: items.length
    });
    res.json({
      success: true,
      item: items[index]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// DELETE Product
app.delete('/api/inventory/:userId/delete/:itemId', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { userId, itemId } = req.params;
    const invDoc = await db.collection('inventory').doc(userId).get();
    if (!invDoc.exists) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    let items = invDoc.data().items || [];
    const product = items.find(i => i.id === parseInt(itemId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
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
    res.json({
      success: true,
      deleted: product,
      total: items.length
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

// ============================================================
// 🚚 SUPPLIER ENDPOINTS
// ============================================================

// GET Suppliers
app.get('/api/suppliers/:userId', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
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
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// ADD Supplier
app.post('/api/suppliers/:userId/add', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { userId } = req.params;
    const supplier = req.body;
    const errors = validateSupplier(supplier);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const docRef = db.collection('suppliers').doc(userId);
    const doc = await docRef.get();
    let list = doc.exists ? doc.data().list || [] : [];
    if (list.some(s => s.name.toLowerCase() === supplier.name.toLowerCase())) {
      return res.status(400).json({ error: 'Supplier with this name already exists' });
    }
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const maxSuppliers = subDoc.exists ? subDoc.data().limits?.maxSuppliers || 10 : 10;
    if (list.length >= maxSuppliers) {
      return res.status(403).json({
        error: 'Supplier limit reached',
        limit: maxSuppliers,
        current: list.length
      });
    }
    const newSupplier = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: supplier.name.trim(),
      contact: supplier.contact || '',
      email: supplier.email || '',
      address: supplier.address || '',
      rating: supplier.rating || 0,
      notes: supplier.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(newSupplier);
    await docRef.set({ list: list, updatedAt: new Date().toISOString() });
    await db.collection('subscriptions').doc(userId).update({
      'usage.suppliersCount': list.length,
      updatedAt: new Date().toISOString()
    });
    res.status(201).json({
      success: true,
      supplier: newSupplier,
      total: list.length
    });
  } catch (error) {
    console.error('Add supplier error:', error);
    res.status(500).json({ error: 'Failed to add supplier', details: error.message });
  }
});

// UPDATE Supplier
app.put('/api/suppliers/:userId/update/:supplierId', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
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
    await docRef.set({ list: list, updatedAt: new Date().toISOString() });
    res.json({ success: true, supplier: list[index] });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE Supplier
app.delete('/api/suppliers/:userId/delete/:supplierId', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { userId, supplierId } = req.params;
    const docRef = db.collection('suppliers').doc(userId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Supplier list not found' });
    }
    let list = doc.data().list || [];
    const removed = list.find(s => s.id === supplierId);
    if (!removed) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    list = list.filter(s => s.id !== supplierId);
    await docRef.set({ list: list, updatedAt: new Date().toISOString() });
    await db.collection('subscriptions').doc(userId).update({
      'usage.suppliersCount': list.length,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, deleted: removed, total: list.length });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// ============================================================
// 💳 SUBSCRIPTION ENDPOINTS
// ============================================================

// GET Subscription
app.get('/api/subscription/:userId', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
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
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: trialEnd.toISOString(),
        cancelAtPeriodEnd: false,
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
        limits: {
          maxProducts: 50,
          maxSuppliers: 10,
          maxScansPerMonth: 100
        },
        usage: {
          productsCount: 0,
          suppliersCount: 0,
          scansThisMonth: 0
        },
        notifications: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.collection('subscriptions').doc(userId).set(subscription);
      return res.json(subscription);
    }
    res.json(subDoc.data());
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// ============================================================
// 📊 USAGE CHECK
// ============================================================
app.get('/api/usage/:userId/:type', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { userId, type } = req.params;
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    if (!subDoc.exists) {
      return res.json({ current: 0, limit: 50, remaining: 50, percentageUsed: 0 });
    }
    const sub = subDoc.data();
    const limits = {
      products: sub.limits?.maxProducts || 50,
      suppliers: sub.limits?.maxSuppliers || 10,
      scans: sub.limits?.maxScansPerMonth || 100
    };
    const current = {
      products: sub.usage?.productsCount || 0,
      suppliers: sub.usage?.suppliersCount || 0,
      scans: sub.usage?.scansThisMonth || 0
    };
    const limit = limits[type] || 50;
    const count = current[type] || 0;
    res.json({
      current: count,
      limit: limit,
      remaining: Math.max(0, limit - count),
      percentageUsed: limit > 0 ? Math.min(100, (count / limit) * 100) : 0
    });
  } catch (error) {
    console.error('Usage check error:', error);
    res.status(500).json({ error: 'Failed to check usage' });
  }
});

// ============================================================
// 🛡️ ADMIN ENDPOINTS
// ============================================================

// GET All Users
app.get('/api/admin/users', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
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
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET All Subscriptions
app.get('/api/admin/subscriptions', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
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
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET Admin Stats
app.get('/api/admin/stats', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalUsers = users.length;

    const subsSnapshot = await db.collection('subscriptions').get();
    const subscriptions = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
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
      totalRevenue,
      activeSubscriptions,
      trialUsers,
      expiredTrials,
      recentUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// UPDATE User Role
app.put('/api/admin/users/:uid/role', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { uid } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }
    await db.collection('users').doc(uid).update({
      role: role,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// DELETE User
app.delete('/api/admin/users/:uid', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { uid } = req.params;
    await db.collection('users').doc(uid).delete();
    await db.collection('subscriptions').doc(uid).delete();
    await db.collection('inventory').doc(uid).delete();
    await db.collection('suppliers').doc(uid).delete();

    const scansSnapshot = await db.collection('scans')
      .where('userId', '==', uid)
      .get();
    for (const doc of scansSnapshot.docs) {
      await doc.ref.delete();
    }

    const paymentsSnapshot = await db.collection('payments')
      .where('userId', '==', uid)
      .get();
    for (const doc of paymentsSnapshot.docs) {
      await doc.ref.delete();
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// EXTEND Trial
app.post('/api/admin/subscriptions/:uid/extend', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { uid } = req.params;
    const { days } = req.body;
    const subDoc = await db.collection('subscriptions').doc(uid).get();
    if (!subDoc.exists) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    const currentEnd = new Date(subDoc.data().trialEnd || new Date());
    const newEnd = new Date(currentEnd);
    const extendDays = days || 7;
    newEnd.setDate(newEnd.getDate() + extendDays);
    await db.collection('subscriptions').doc(uid).update({
      trialEnd: newEnd.toISOString(),
      status: 'trial_active',
      updatedAt: new Date().toISOString()
    });
    res.json({
      success: true,
      message: `Trial extended by ${extendDays} days`,
      newEnd: newEnd.toISOString()
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({ error: 'Failed to extend trial' });
  }
});

// UPGRADE Plan
app.post('/api/admin/subscriptions/:uid/upgrade', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
  try {
    const { uid } = req.params;
    const { planId } = req.body;
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
    await db.collection('subscriptions').doc(uid).update({
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
    console.error('Upgrade plan error:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
});

// ============================================================
// 🌱 SEED TEST DATA
// ============================================================
app.post('/api/seed/data', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }
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

    for (const user of testUsers) {
      await db.collection('users').doc(user.uid).set(user);

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      await db.collection('subscriptions').doc(user.uid).set({
        userId: user.uid,
        planId: 'FREE_TRIAL',
        status: 'trial_active',
        trialStart: new Date().toISOString(),
        trialEnd: trialEnd.toISOString(),
        limits: { maxProducts: 50, maxSuppliers: 10, maxScansPerMonth: 100 },
        usage: { productsCount: 0, suppliersCount: 0, scansThisMonth: 0 },
        features: { canBasicScan: true, canOCRScan: true, canBarcodeScan: true, canFlashSale: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const products = [
        { name: 'Fresh Milk (1L)', batch: 'B001', supplier: 'Dairy Farms', stock: 24, expiryDate: '2026-08-15', costPrice: 280, sellingPrice: 350 },
        { name: 'Greek Yogurt', batch: 'B002', supplier: 'Dairy Farms', stock: 15, expiryDate: '2026-07-20', costPrice: 180, sellingPrice: 220 }
      ];
      const items = products.map((p, index) => {
        const daysLeft = Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return {
          id: index + 1,
          ...p,
          batchDate: new Date().toISOString().split('T')[0],
          supplierContact: 'N/A',
          supplierEmail: 'N/A',
          expiryDate: p.expiryDate,
          daysLeft: daysLeft,
          status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good',
          suggestion: daysLeft <= 7 ? 'Monitor closely' : 'Normal Stock',
          lowStockThreshold: 10,
          addedAt: new Date().toISOString()
        };
      });
      await db.collection('inventory').doc(user.uid).set({
        items: items,
        lastUpdated: new Date().toISOString(),
        itemCount: items.length
      });
      await db.collection('subscriptions').doc(user.uid).update({
        'usage.productsCount': items.length
      });

      await db.collection('suppliers').doc(user.uid).set({
        list: [
          { id: 's1', name: 'Dairy Farms', contact: '+94 11 234 5678', rating: 5, createdAt: new Date().toISOString() }
        ],
        updatedAt: new Date().toISOString()
      });

      await db.collection('scans').add({
        userId: user.uid,
        type: 'barcode',
        value: '8901234567890',
        result: 'Success',
        createdAt: new Date().toISOString()
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
    res.status(500).json({ error: 'Failed to seed data', details: error.message });
  }
});

// ============================================================
// 🎯 ROOT ENDPOINT
// ============================================================
app.get('/', (req, res) => {
  res.json({
    name: 'ShelfLife AI Backend',
    version: '2.0.0',
    status: 'Online',
    firebase: firebaseInitialized ? 'connected' : 'disconnected',
    endpoints: {
      health: 'GET /api/health',
      payment: 'POST /api/payment/initiate',
      inventory: 'GET/POST/PUT/DELETE /api/inventory/:userId',
      suppliers: 'GET/POST/PUT/DELETE /api/suppliers/:userId',
      subscription: 'GET /api/subscription/:userId',
      usage: 'GET /api/usage/:userId/:type',
      admin: {
        users: 'GET /api/admin/users',
        subscriptions: 'GET /api/admin/subscriptions',
        stats: 'GET /api/admin/stats',
        seed: 'POST /api/seed/data'
      }
    }
  });
});

// ============================================================
// ❌ 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ============================================================
// ❌ Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================================
// 🚀 EXPORT for Vercel (මෙය අනිවාර්යයි!)
// ============================================================
export default app;