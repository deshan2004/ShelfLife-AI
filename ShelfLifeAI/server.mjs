// server.mjs - ES Module Version for Vercel
import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

let db = null;
let firebaseReady = false;

console.log('🚀 Starting server (ES Module)...');

// ============================================================
// 🔥 FIREBASE ADMIN INITIALIZATION
// ============================================================
try {
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    
    console.log(`📋 Project ID: ${hasProjectId ? '✅' : '❌'}`);
    console.log(`📋 Client Email: ${hasClientEmail ? '✅' : '❌'}`);
    console.log(`📋 Private Key: ${hasPrivateKey ? '✅' : '❌'}`);
    
    if (hasProjectId && hasClientEmail && hasPrivateKey) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        
        db = admin.firestore();
        firebaseReady = true;
        console.log('✅ Firebase initialized with environment variables!');
    } else {
        // Local development - try serviceAccountKey.json
        try {
            const serviceAccount = await import('./serviceAccountKey.json', { 
                assert: { type: 'json' } 
            });
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount.default)
            });
            db = admin.firestore();
            firebaseReady = true;
            console.log('✅ Firebase initialized with serviceAccountKey.json');
        } catch (err) {
            console.error('❌ No valid credentials found');
        }
    }
} catch (error) {
    console.error('❌ Firebase error:', error.message);
}

// ============================================================
// ✅ TEST ENDPOINT
// ============================================================
app.get('/api/test', (req, res) => {
    res.json({
        status: 'ok',
        firebaseReady: firebaseReady,
        timestamp: new Date().toISOString(),
        env: {
            PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
        }
    });
});

// ============================================================
// ✅ HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: firebaseReady ? 'healthy' : 'unhealthy',
        firebase: firebaseReady ? 'connected' : 'disconnected'
    });
});

// ============================================================
// 🛡️ MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    if (req.path === '/api/health' || req.path === '/api/test') {
        return next();
    }
    if (!firebaseReady) {
        return res.status(503).json({ error: 'Firebase not ready' });
    }
    next();
});

// ============================================================
// 👤 SUPPLIERS
// ============================================================
app.get('/api/suppliers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const doc = await db.collection('suppliers').doc(userId).get();
        if (!doc.exists) {
            await db.collection('suppliers').doc(userId).set({ list: [], updatedAt: new Date().toISOString() });
            return res.json({ list: [] });
        }
        res.json(doc.data());
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/suppliers/:userId/add', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, contact, email, address, rating, notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });
        
        const doc = await db.collection('suppliers').doc(userId).get();
        let list = doc.exists ? doc.data().list || [] : [];
        
        const newSupplier = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name: name.trim(),
            contact: contact || '',
            email: email || '',
            address: address || '',
            rating: rating || 0,
            notes: notes || '',
            createdAt: new Date().toISOString()
        };
        list.push(newSupplier);
        await db.collection('suppliers').doc(userId).set({ list, updatedAt: new Date().toISOString() });
        res.status(201).json({ success: true, supplier: newSupplier });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/suppliers/:userId/update/:supplierId', async (req, res) => {
    try {
        const { userId, supplierId } = req.params;
        const updates = req.body;
        const doc = await db.collection('suppliers').doc(userId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Not found' });
        let list = doc.data().list || [];
        const index = list.findIndex(s => s.id === supplierId);
        if (index === -1) return res.status(404).json({ error: 'Supplier not found' });
        list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
        await db.collection('suppliers').doc(userId).set({ list, updatedAt: new Date().toISOString() });
        res.json({ success: true, supplier: list[index] });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/suppliers/:userId/delete/:supplierId', async (req, res) => {
    try {
        const { userId, supplierId } = req.params;
        const doc = await db.collection('suppliers').doc(userId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Not found' });
        let list = doc.data().list || [];
        const index = list.findIndex(s => s.id === supplierId);
        if (index === -1) return res.status(404).json({ error: 'Supplier not found' });
        list.splice(index, 1);
        await db.collection('suppliers').doc(userId).set({ list, updatedAt: new Date().toISOString() });
        res.json({ success: true, total: list.length });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 👤 INVENTORY
// ============================================================
app.get('/api/inventory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const doc = await db.collection('inventory').doc(userId).get();
        if (!doc.exists) {
            await db.collection('inventory').doc(userId).set({ items: [], lastUpdated: new Date().toISOString(), itemCount: 0 });
            return res.json({ items: [], itemCount: 0 });
        }
        res.json(doc.data());
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory/:userId/add', async (req, res) => {
    try {
        const { userId } = req.params;
        const { product } = req.body;
        if (!product || !product.name) return res.status(400).json({ error: 'Name required' });
        const doc = await db.collection('inventory').doc(userId).get();
        let items = doc.exists ? doc.data().items || [] : [];
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        const newProduct = { id: newId, ...product, addedAt: new Date().toISOString() };
        items.push(newProduct);
        await db.collection('inventory').doc(userId).set({ items, lastUpdated: new Date().toISOString(), itemCount: items.length });
        res.json({ success: true, product: newProduct });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 👤 SUBSCRIPTION
// ============================================================
app.get('/api/subscription/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const doc = await db.collection('subscriptions').doc(userId).get();
        if (!doc.exists) {
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
                createdAt: new Date().toISOString()
            };
            await db.collection('subscriptions').doc(userId).set(subscription);
            return res.json(subscription);
        }
        res.json(doc.data());
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 👤 USAGE
// ============================================================
app.get('/api/usage/:userId/:type', async (req, res) => {
    try {
        const { userId, type } = req.params;
        const doc = await db.collection('subscriptions').doc(userId).get();
        if (!doc.exists) {
            return res.json({ current: 0, limit: 50, remaining: 50, percentageUsed: 0 });
        }
        const data = doc.data();
        let current = 0, limit = 50;
        switch (type) {
            case 'products':
                current = data.usage?.productsCount || 0;
                limit = data.limits?.maxProducts || 50;
                break;
            case 'suppliers':
                current = data.usage?.suppliersCount || 0;
                limit = data.limits?.maxSuppliers || 10;
                break;
            case 'scans':
                current = data.usage?.scansThisMonth || 0;
                limit = data.limits?.maxScansPerMonth || 100;
                break;
            default:
                return res.json({ current: 0, limit: 0, remaining: 0, percentageUsed: 0 });
        }
        const remaining = Math.max(0, limit - current);
        const percentageUsed = limit > 0 ? (current / limit) * 100 : 0;
        res.json({ current, limit, remaining, percentageUsed });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 🛡️ ADMIN
// ============================================================
app.get('/api/admin/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }));
        res.json(users);
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/subscriptions', async (req, res) => {
    try {
        const snapshot = await db.collection('subscriptions').get();
        const subscriptions = snapshot.docs.map(doc => ({ id: doc.id, userId: doc.id, ...doc.data() }));
        res.json(subscriptions);
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const subsSnapshot = await db.collection('subscriptions').get();
        const subscriptions = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeSubs = subscriptions.filter(s => s.status === 'active').length;
        const trialUsers = subscriptions.filter(s => s.status === 'trial_active').length;
        const planPrices = { BASIC: 2500, PROFESSIONAL: 5900, ENTERPRISE: 14900 };
        const totalRevenue = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (planPrices[s.planId] || 0), 0);
        res.json({
            totalUsers: users.length,
            activeSubscriptions: activeSubs,
            trialUsers: trialUsers,
            totalRevenue: totalRevenue,
            recentUsers: users.slice(0, 5).map(u => ({ name: u.name || 'Unknown', email: u.email || '', createdAt: u.createdAt || new Date().toISOString() }))
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 🌐 ROOT
// ============================================================
app.get('/', (req, res) => {
    res.json({ message: 'ShelfLife AI Backend', status: firebaseReady ? 'Online' : 'Offline' });
});

// ============================================================
// 🚨 ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============================================================
// 🚀 EXPORT
// ============================================================
export default app;

// Local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🔥 Firebase: ${firebaseReady ? '✅ Ready' : '❌ Not ready'}`);
    });
}