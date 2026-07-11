// server.cjs - Updated for Vercel
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// ============================================================
// FIREBASE ADMIN SDK - Vercel Compatible
// ============================================================
let serviceAccount;

// 1️⃣ Try environment variable (Vercel production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Firebase credentials loaded from environment variable.');
    } catch (e) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
}

// 2️⃣ Fallback to local file (local development)
if (!serviceAccount) {
    try {
        serviceAccount = require('./serviceAccountKey.json');
        console.log('✅ Firebase credentials loaded from local file.');
    } catch (e) {
        console.error('❌ serviceAccountKey.json not found.');
        console.error('Please set FIREBASE_SERVICE_ACCOUNT env var in Vercel.');
        // Don't exit in serverless - let it fail gracefully
    }
}

// Initialize Firebase Admin
if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized successfully!');
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error.message);
    }
} else if (!serviceAccount) {
    console.error('❌ No service account available. Admin routes will fail.');
}

const db = admin.firestore ? admin.firestore() : null;
const auth = admin.auth ? admin.auth() : null;

// ============================================================
// HEALTH CHECK - No Firebase required
// ============================================================
app.get('/', (req, res) => {
    res.json({
        message: 'ShelfLife AI Backend is running!',
        status: serviceAccount ? 'Firebase Connected' : 'Firebase Not Connected',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: serviceAccount ? 'healthy' : 'degraded',
        firebase: serviceAccount ? 'connected' : 'not_connected',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// AUTHENTICATION - With Firebase
// ============================================================
app.post('/api/signup', async (req, res) => {
    if (!auth) {
        return res.status(503).json({ error: 'Firebase not initialized' });
    }
    // ... existing signup code ...
});

// ============================================================
// ALL OTHER ROUTES - Check Firebase first
// ============================================================
const requireFirebase = (handler) => {
    return async (req, res) => {
        if (!auth || !db) {
            return res.status(503).json({ 
                error: 'Firebase services not available. Check FIREBASE_SERVICE_ACCOUNT env var.' 
            });
        }
        return handler(req, res);
    };
};

// ============================================================
// ADMIN USERS ROUTE - With better error handling
// ============================================================
app.get('/api/admin/users', requireFirebase(async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        res.json(users);
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
}));

// ============================================================
// ADMIN STATS ROUTE
// ============================================================
app.get('/api/admin/stats', requireFirebase(async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => users.push({ uid: doc.id, ...doc.data() }));

        const subsSnapshot = await db.collection('subscriptions').get();
        let activeSubscriptions = 0, trialUsers = 0, expiredTrials = 0;
        subsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'active') activeSubscriptions++;
            else if (data.status === 'trial_active') trialUsers++;
            else if (data.status === 'trial_expired') expiredTrials++;
        });

        const invSnapshot = await db.collection('inventory').get();
        let totalProducts = 0;
        invSnapshot.forEach(doc => {
            const items = doc.data().items || [];
            totalProducts += items.length;
        });

        const scansSnapshot = await db.collection('scans').get();
        const totalScans = scansSnapshot.size;

        const recentUsers = users.slice(-5).reverse();

        res.json({
            totalUsers: users.length,
            totalProducts,
            totalScans,
            totalRevenue: 125000,
            activeSubscriptions,
            trialUsers,
            expiredTrials,
            recentUsers
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// ADMIN SUBSCRIPTIONS ROUTE
// ============================================================
app.get('/api/admin/subscriptions', requireFirebase(async (req, res) => {
    try {
        const subsSnapshot = await db.collection('subscriptions').get();
        const subscriptions = [];
        subsSnapshot.forEach(doc => {
            subscriptions.push({ userId: doc.id, ...doc.data() });
        });
        res.json(subscriptions);
    } catch (error) {
        console.error('Admin subscriptions error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// ADMIN INVENTORY BY SHOP
// ============================================================
app.get('/api/admin/inventory/by-shop', requireFirebase(async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const result = [];
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const invDoc = await db.collection('inventory').doc(userDoc.id).get();
            const products = invDoc.exists ? invDoc.data().items || [] : [];
            if (products.length > 0) {
                result.push({
                    shopId: userDoc.id,
                    shopName: userData.businessName || `${userData.name}'s Store`,
                    ownerName: userData.name,
                    ownerEmail: userData.email,
                    products: products.map(p => ({ ...p, daysLeft: p.daysLeft !== undefined ? p.daysLeft : 999 }))
                });
            }
        }
        res.json(result);
    } catch (error) {
        console.error('Admin inventory by shop error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// INVENTORY ROUTES
// ============================================================
app.get('/api/inventory/:userId', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const invDoc = await db.collection('inventory').doc(userId).get();
        if (!invDoc.exists) {
            return res.json({ items: [], itemCount: 0 });
        }
        res.json(invDoc.data());
    } catch (error) {
        console.error("Get inventory error:", error);
        res.status(500).json({ error: error.message });
    }
}));

app.post('/api/inventory/:userId/add', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const { product } = req.body;
        if (!product || !product.name) {
            return res.status(400).json({ error: 'Product name is required' });
        }

        const invDoc = await db.collection('inventory').doc(userId).get();
        let items = invDoc.exists ? invDoc.data().items || [] : [];

        const subDoc = await db.collection('subscriptions').doc(userId).get();
        const maxProducts = subDoc.exists ? subDoc.data().limits?.maxProducts || 50 : 50;

        if (items.length >= maxProducts) {
            return res.status(403).json({ error: 'Product limit reached', limit: maxProducts, current: items.length });
        }

        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        const newProduct = { id: newId, ...product, addedAt: new Date().toISOString() };
        items.push(newProduct);

        await db.collection('inventory').doc(userId).set({
            items,
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
}));

app.put('/api/inventory/:userId/update', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const { itemId, updates } = req.body;

        const invDoc = await db.collection('inventory').doc(userId).get();
        let items = invDoc.exists ? invDoc.data().items || [] : [];

        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (updates.expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(updates.expiryDate);
            expiry.setHours(0, 0, 0, 0);
            updates.daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            if (updates.daysLeft <= 0) {
                updates.status = 'expired';
                updates.suggestion = 'DISPOSE / Return to supplier';
            } else if (updates.daysLeft <= 3) {
                updates.status = 'critical';
                updates.suggestion = 'URGENT: Flash Sale NOW!';
            } else if (updates.daysLeft <= 7) {
                updates.status = 'warning';
                updates.suggestion = 'Flash Sale recommended';
            } else {
                updates.status = 'good';
                updates.suggestion = 'Monitor regularly';
            }
        }

        items[itemIndex] = { ...items[itemIndex], ...updates, updatedAt: new Date().toISOString() };
        await db.collection('inventory').doc(userId).set({
            items,
            lastUpdated: new Date().toISOString(),
            itemCount: items.length
        });

        res.json({ success: true, item: items[itemIndex] });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ error: error.message });
    }
}));

app.delete('/api/inventory/:userId/delete/:itemId', requireFirebase(async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const invDoc = await db.collection('inventory').doc(userId).get();
        let items = invDoc.exists ? invDoc.data().items || [] : [];
        const itemIdNum = parseInt(itemId);
        items = items.filter(i => i.id !== itemIdNum);

        await db.collection('inventory').doc(userId).set({
            items,
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
}));

// ============================================================
// SUPPLIER ROUTES
// ============================================================
async function getUserSuppliers(userId) {
    if (!db) return [];
    const doc = await db.collection('suppliers').doc(userId).get();
    if (!doc.exists) return [];
    return doc.data().suppliers || [];
}

async function saveUserSuppliers(userId, suppliers) {
    if (!db) return;
    await db.collection('suppliers').doc(userId).set({
        suppliers,
        lastUpdated: new Date().toISOString(),
        count: suppliers.length
    });
}

app.get('/api/suppliers/:userId', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const suppliers = await getUserSuppliers(userId);
        res.json({ list: suppliers, count: suppliers.length });
    } catch (error) {
        console.error("Get suppliers error:", error);
        res.status(500).json({ error: error.message });
    }
}));

app.post('/api/suppliers/:userId/add', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const { supplier } = req.body;
        if (!supplier || !supplier.name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        const subDoc = await db.collection('subscriptions').doc(userId).get();
        const maxSuppliers = subDoc.exists ? subDoc.data().limits?.maxSuppliers || 10 : 10;
        const currentSuppliers = await getUserSuppliers(userId);

        if (currentSuppliers.length >= maxSuppliers) {
            return res.status(403).json({ error: 'Supplier limit reached', limit: maxSuppliers, current: currentSuppliers.length });
        }

        const newId = currentSuppliers.length > 0 ? Math.max(...currentSuppliers.map(s => s.id)) + 1 : 1;
        const newSupplier = { id: newId, ...supplier, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        currentSuppliers.push(newSupplier);
        await saveUserSuppliers(userId, currentSuppliers);

        await db.collection('subscriptions').doc(userId).update({
            'usage.suppliersCount': currentSuppliers.length,
            updatedAt: new Date().toISOString()
        });

        res.json({ success: true, supplier: newSupplier });
    } catch (error) {
        console.error("Add supplier error:", error);
        res.status(500).json({ error: error.message });
    }
}));

app.put('/api/suppliers/:userId/update', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const { supplierId, updates } = req.body;
        const suppliers = await getUserSuppliers(userId);
        const index = suppliers.findIndex(s => s.id === supplierId);
        if (index === -1) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        suppliers[index] = { ...suppliers[index], ...updates, updatedAt: new Date().toISOString() };
        await saveUserSuppliers(userId, suppliers);
        res.json({ success: true, supplier: suppliers[index] });
    } catch (error) {
        console.error("Update supplier error:", error);
        res.status(500).json({ error: error.message });
    }
}));

app.delete('/api/suppliers/:userId/delete/:supplierId', requireFirebase(async (req, res) => {
    try {
        const { userId, supplierId } = req.params;
        const supplierIdNum = parseInt(supplierId);
        let suppliers = await getUserSuppliers(userId);
        suppliers = suppliers.filter(s => s.id !== supplierIdNum);
        await saveUserSuppliers(userId, suppliers);

        await db.collection('subscriptions').doc(userId).update({
            'usage.suppliersCount': suppliers.length,
            updatedAt: new Date().toISOString()
        });

        res.json({ success: true, count: suppliers.length });
    } catch (error) {
        console.error("Delete supplier error:", error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// SUBSCRIPTION ROUTES
// ============================================================
app.get('/api/subscription/:userId', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        let subDoc = await db.collection('subscriptions').doc(userId).get();

        if (!subDoc.exists) {
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);
            const subscription = {
                userId: userId,
                planId: 'FREE_TRIAL',
                planName: 'Free Trial',
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
                limits: {
                    maxProducts: 50,
                    maxSuppliers: 10,
                    maxScansPerMonth: 100
                },
                usage: {
                    productsCount: 0,
                    suppliersCount: 0,
                    scansThisMonth: 0,
                    lastResetDate: new Date().toISOString()
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await db.collection('subscriptions').doc(userId).set(subscription);
            res.json(subscription);
        } else {
            let subscription = subDoc.data();
            if (subscription.status === 'trial_active') {
                const trialEnd = new Date(subscription.trialEnd);
                const now = new Date();
                if (now > trialEnd) {
                    subscription.status = 'trial_expired';
                    await db.collection('subscriptions').doc(userId).update({
                        status: 'trial_expired',
                        updatedAt: now.toISOString()
                    });
                }
            }
            res.json(subscription);
        }
    } catch (error) {
        console.error("Get subscription error:", error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// SEED DATA ROUTE
// ============================================================
app.post('/api/seed/data', requireFirebase(async (req, res) => {
    try {
        const testUsers = [
            { name: 'Kamal Perera', email: 'kamal@test.lk', businessName: 'Kamal Grocery' },
            { name: 'Nimal Silva', email: 'nimal@test.lk', businessName: 'Nimal Supermarket' },
            { name: 'Sunil Fernando', email: 'sunil@test.lk', businessName: 'Sunil Mart' }
        ];

        let createdCount = 0;
        for (const user of testUsers) {
            try {
                const userRecord = await auth.createUser({
                    email: user.email,
                    password: 'Test@123456',
                    displayName: user.name
                });

                await db.collection('users').doc(userRecord.uid).set({
                    name: user.name,
                    email: user.email,
                    phone: '',
                    businessName: user.businessName,
                    role: 'user',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 14);
                await db.collection('subscriptions').doc(userRecord.uid).set({
                    userId: userRecord.uid,
                    planId: 'FREE_TRIAL',
                    planName: 'Free Trial',
                    status: 'trial_active',
                    trialStart: new Date().toISOString(),
                    trialEnd: trialEnd.toISOString(),
                    limits: { maxProducts: 50, maxSuppliers: 10, maxScansPerMonth: 100 },
                    usage: { productsCount: 0, suppliersCount: 0, scansThisMonth: 0 },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                const products = [
                    { name: 'Fresh Milk (1L)', batch: 'B001', supplier: 'Dairy Farms', expiryDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0], stock: 24, costPrice: 280, sellingPrice: 350 },
                    { name: 'Greek Yogurt', batch: 'B002', supplier: 'Dairy Farms', expiryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], stock: 15, costPrice: 180, sellingPrice: 220 },
                    { name: 'Wheat Bread', batch: 'B003', supplier: 'Bakery Hub', expiryDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], stock: 5, costPrice: 120, sellingPrice: 150 }
                ];

                const items = products.map((p, i) => {
                    const daysLeft = Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return {
                        id: i + 1,
                        ...p,
                        batchDate: new Date().toISOString().split('T')[0],
                        supplierContact: '+94 11 234 5678',
                        supplierEmail: 'supplier@test.lk',
                        daysLeft,
                        status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'warning' : 'good',
                        suggestion: daysLeft <= 7 ? 'Monitor closely' : 'Normal Stock',
                        lowStockThreshold: 10
                    };
                });

                await db.collection('inventory').doc(userRecord.uid).set({
                    items,
                    lastUpdated: new Date().toISOString(),
                    itemCount: items.length
                });

                await db.collection('suppliers').doc(userRecord.uid).set({
                    suppliers: [
                        { id: 1, name: 'Dairy Farms', contact: '+94 11 234 5678', email: 'orders@dairyfarms.lk', rating: 4.5 },
                        { id: 2, name: 'Bakery Hub', contact: '+94 77 345 6789', email: 'info@bakeryhub.lk', rating: 4.0 }
                    ],
                    lastUpdated: new Date().toISOString(),
                    count: 2
                });

                createdCount++;
            } catch (e) {
                console.error(`Failed to create test user ${user.email}:`, e.message);
            }
        }

        res.json({ success: true, users: createdCount, message: `${createdCount} test users created` });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// USAGE CHECK
// ============================================================
app.get('/api/usage/:userId/:type', requireFirebase(async (req, res) => {
    try {
        const { userId, type } = req.params;
        const subDoc = await db.collection('subscriptions').doc(userId).get();
        if (!subDoc.exists) {
            return res.json({ current: 0, limit: 50, remaining: 50, percentageUsed: 0 });
        }
        const subscription = subDoc.data();
        let current = 0;
        let limit = 50;
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
}));

// ============================================================
// PAYMENT ROUTES
// ============================================================
app.post('/api/payments/process', requireFirebase(async (req, res) => {
    try {
        const { userId, amount, planId, paymentId } = req.body;
        if (!userId || !amount || !planId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const paymentData = {
            userId,
            amount: Number(amount),
            planId,
            status: 'completed',
            paymentId: paymentId || `pay_${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        await db.collection('payments').add(paymentData);

        let limits = { maxProducts: 50, maxScansPerMonth: 100 };
        let planName = 'Free Trial';
        if (planId === 'BASIC') {
            limits = { maxProducts: 200, maxScansPerMonth: 500 };
            planName = 'Basic';
        } else if (planId === 'PROFESSIONAL') {
            limits = { maxProducts: 1000, maxScansPerMonth: 2000 };
            planName = 'Professional';
        } else if (planId === 'ENTERPRISE') {
            limits = { maxProducts: Infinity, maxScansPerMonth: Infinity };
            planName = 'Enterprise';
        }

        await db.collection('subscriptions').doc(userId).update({
            planId: planId,
            planName: planName,
            status: 'active',
            limits: limits,
            updatedAt: new Date().toISOString()
        });

        res.json({ success: true, message: `Upgraded to ${planId} successfully!` });
    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// SCAN ROUTES
// ============================================================
app.post('/api/scans/:userId', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, value, result } = req.body;
        const scanData = {
            userId,
            type: type || 'unknown',
            value: value || '',
            result: result || 'Success',
            createdAt: new Date().toISOString()
        };
        const docRef = await db.collection('scans').add(scanData);

        const subDoc = await db.collection('subscriptions').doc(userId).get();
        if (subDoc.exists) {
            const currentScans = subDoc.data().usage?.scansThisMonth || 0;
            await db.collection('subscriptions').doc(userId).update({
                'usage.scansThisMonth': currentScans + 1,
                updatedAt: new Date().toISOString()
            });
        }

        res.status(201).json({ success: true, scanId: docRef.id });
    } catch (error) {
        console.error("Log scan error:", error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// DASHBOARD ROUTES
// ============================================================
app.get('/api/dashboard/:userId', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const invDoc = await db.collection('inventory').doc(userId).get();
        const subDoc = await db.collection('subscriptions').doc(userId).get();
        const items = invDoc.exists ? invDoc.data().items || [] : [];

        const expiringCount = items.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length;
        const criticalCount = items.filter(i => i.daysLeft <= 3 && i.daysLeft > 0).length;
        const expiredCount = items.filter(i => i.daysLeft <= 0).length;
        const totalValue = items.reduce((sum, i) => sum + ((i.sellingPrice || 0) * (i.stock || 0)), 0);
        const lowStockCount = items.filter(i => i.stock <= (i.lowStockThreshold || 10)).length;

        res.json({
            totalItems: items.length,
            totalValue,
            expiringCount,
            criticalCount,
            expiredCount,
            lowStockCount,
            recentItems: items.slice(-5).reverse(),
            subscription: subDoc.exists ? subDoc.data() : null
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// ANALYTICS ROUTES
// ============================================================
app.get('/api/analytics/:userId', requireFirebase(async (req, res) => {
    try {
        const { userId } = req.params;
        const invDoc = await db.collection('inventory').doc(userId).get();
        const items = invDoc.exists ? invDoc.data().items || [] : [];

        const expiringItems = items.filter(i => i.daysLeft <= 7 && i.daysLeft > 0);
        const expiredItems = items.filter(i => i.daysLeft <= 0);

        const expiringValue = expiringItems.reduce((sum, i) => sum + ((i.sellingPrice || 0) * (i.stock || 0)), 0);
        const wasteValue = expiredItems.reduce((sum, i) => sum + ((i.costPrice || 0) * (i.stock || 0)), 0);
        const totalSales = items.reduce((sum, i) => sum + ((i.sellingPrice || 0) * (i.stock || 0)), 0);
        const totalCost = items.reduce((sum, i) => sum + ((i.costPrice || 0) * (i.stock || 0)), 0);
        const avgMargin = totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : 0;

        res.json({
            totalSaved: expiringValue * 0.7,
            wasteReduction: wasteValue,
            flashSaleRevenue: expiringValue * 0.5,
            projectedSavings: expiringValue * 0.7 * 12,
            turnoverRate: items.length > 0 ? 85 : 0,
            avgMargin: avgMargin,
            monthlyTrend: [3200, 4100, 3800, 5200, 4800, 6100, 5800, 7200, 6900, 8400, 7900, expiringValue * 0.7],
            categoryData: { labels: ['Dairy', 'Bakery', 'Canned', 'Beverages', 'Other'], values: [35, 20, 25, 15, 5] }
        });
    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// ADMIN: UPDATE USER ROLE
// ============================================================
app.put('/api/admin/users/:uid/role', requireFirebase(async (req, res) => {
    try {
        const { uid } = req.params;
        const { role } = req.body;
        await db.collection('users').doc(uid).update({
            role,
            updatedAt: new Date().toISOString()
        });
        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// ADMIN: DELETE USER
// ============================================================
app.delete('/api/admin/users/:uid', requireFirebase(async (req, res) => {
    try {
        const { uid } = req.params;
        await auth.deleteUser(uid);
        await db.collection('users').doc(uid).delete();
        await db.collection('subscriptions').doc(uid).delete();
        await db.collection('inventory').doc(uid).delete();
        await db.collection('suppliers').doc(uid).delete();
        const scansSnapshot = await db.collection('scans').where('userId', '==', uid).get();
        scansSnapshot.forEach(doc => doc.ref.delete());
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// ADMIN: EXTEND TRIAL
// ============================================================
app.post('/api/admin/subscriptions/:uid/extend', requireFirebase(async (req, res) => {
    try {
        const { uid } = req.params;
        const { days } = req.body;
        const subDoc = await db.collection('subscriptions').doc(uid).get();
        if (!subDoc.exists) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        const data = subDoc.data();
        const currentEnd = new Date(data.trialEnd || new Date());
        currentEnd.setDate(currentEnd.getDate() + (days || 7));
        await db.collection('subscriptions').doc(uid).update({
            trialEnd: currentEnd.toISOString(),
            status: 'trial_active',
            updatedAt: new Date().toISOString()
        });
        res.json({ success: true, message: `Trial extended by ${days || 7} days` });
    } catch (error) {
        console.error('Extend trial error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// ADMIN: UPGRADE USER
// ============================================================
app.post('/api/admin/subscriptions/:uid/upgrade', requireFirebase(async (req, res) => {
    try {
        const { uid } = req.params;
        const { planId } = req.body;
        const limits = { maxProducts: planId === 'BASIC' ? 200 : planId === 'PROFESSIONAL' ? 1000 : Infinity };
        const features = {
            canBasicScan: true,
            canOCRScan: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
            canBarcodeScan: true,
            canFlashSale: true,
            canSupplierReturn: planId === 'BASIC' || planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
            canBasicAnalytics: true,
            canAdvancedAnalytics: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
            canPrioritySupport: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
            canAPIAccess: planId === 'ENTERPRISE',
            canMultiUser: planId === 'ENTERPRISE',
            canExportData: planId === 'PROFESSIONAL' || planId === 'ENTERPRISE',
            canCustomReports: planId === 'ENTERPRISE'
        };
        let planName = planId === 'FREE_TRIAL' ? 'Free Trial' : planId;
        await db.collection('subscriptions').doc(uid).update({
            planId,
            planName,
            status: 'active',
            limits,
            features,
            updatedAt: new Date().toISOString()
        });
        res.json({ success: true, message: `Upgraded to ${planId}` });
    } catch (error) {
        console.error('Admin upgrade error:', error);
        res.status(500).json({ error: error.message });
    }
}));

// ============================================================
// START SERVER - Vercel Compatible
// ============================================================
const PORT = process.env.PORT || 5000;

// Only listen when NOT in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log("=".repeat(50));
        console.log(`🚀 ShelfLife AI Backend is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`📡 Firestore: ${db ? 'Connected' : 'Not Connected'}`);
        console.log(`🔐 Firebase Auth: ${auth ? 'Ready' : 'Not Ready'}`);
        console.log("=".repeat(50));
    });
}

// Export for Vercel serverless
module.exports = app;