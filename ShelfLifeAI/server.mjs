// server.mjs - ES Module Version
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Import firebase-admin using dynamic import
let admin;
try {
  // Try ES module import first
  const module = await import('firebase-admin');
  admin = module.default || module;
  console.log('✅ firebase-admin loaded (ES Module)');
} catch (error) {
  console.error('❌ Failed to load firebase-admin:', error.message);
  console.error('Please run: npm install firebase-admin');
  process.exit(1);
}

const app = express();

// ============================================================
// 🔥 CHECK SERVICE ACCOUNT FILE
// ============================================================
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found!');
  console.error(`Expected at: ${serviceAccountPath}`);
  console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Service account loaded successfully');
} catch (error) {
  console.error('❌ Failed to load serviceAccountKey.json:', error.message);
  process.exit(1);
}

// ============================================================
// 🔥 FIREBASE ADMIN INITIALIZE
// ============================================================
try {
  // Check if admin.credential exists
  if (!admin.credential) {
    console.error('❌ admin.credential is undefined.');
    console.error('Try: npm uninstall firebase-admin && npm install firebase-admin@11.11.0');
    process.exit(1);
  }

  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.log('✅ Firebase Admin already initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// ============================================================
// ✅ CORS CONFIGURATION
// ============================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// 🏥 HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
// 📦 INVENTORY ENDPOINTS
// ============================================================

// GET Inventory
app.get('/api/inventory/:userId', async (req, res) => {
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
  try {
    const { userId } = req.params;
    const docRef = db.collection('suppliers').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({
        list: [],
        updatedAt: new Date().toISOString()
      });
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

    await docRef.set({
      list: list,
      updatedAt: new Date().toISOString()
    });

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

    res.json({
      success: true,
      supplier: list[index]
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE Supplier
app.delete('/api/suppliers/:userId/delete/:supplierId', async (req, res) => {
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

    await docRef.set({
      list: list,
      updatedAt: new Date().toISOString()
    });

    await db.collection('subscriptions').doc(userId).update({
      'usage.suppliersCount': list.length,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      deleted: removed,
      total: list.length
    });
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
// 🛡️ ADMIN ENDPOINTS (Shortened for brevity - same as before)
// ============================================================

// GET All Users
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
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET All Subscriptions
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
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET Admin Stats
app.get('/api/admin/stats', async (req, res) => {
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

// ============================================================
// 🌱 SEED TEST DATA
// ============================================================
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
    endpoints: {
      health: 'GET /api/health',
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
// 🚀 START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('='.repeat(55));
  console.log(`🚀 ShelfLife AI Backend v2.0 (ES Module)`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔒 CORS: Restricted to allowed domains`);
  console.log(`✅ Validation: Enabled`);
  console.log(`🔥 Firebase: Connected`);
  console.log('='.repeat(55));
});