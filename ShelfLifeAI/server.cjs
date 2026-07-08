// server.cjs - Complete backend with all endpoints
// ============================================================
// 📌 SHELFLIFE AI BACKEND - VERCEL DEPLOYMENT READY
// ============================================================

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

// ============================================================
// 🔥 GLOBAL ERROR HANDLING
// ============================================================
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

// ============================================================
// 📦 MIDDLEWARE
// ============================================================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ============================================================
// 🔥 FIREBASE ADMIN INITIALIZATION
// ============================================================
let firebaseInitialized = false;
let db = null;
let auth = null;

console.log('🚀 Starting Firebase Admin initialization...');
console.log('📡 Environment:', process.env.NODE_ENV || 'development');

try {
    if (!admin.apps.length) {
        // Check for Vercel environment variables
        const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
        const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
        const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
        
        console.log('📋 Environment Variables Status:');
        console.log(`   FIREBASE_PROJECT_ID: ${hasProjectId ? '✅' : '❌'}`);
        console.log(`   FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅' : '❌'}`);
        console.log(`   FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅' : '❌'}`);
        
        if (hasProjectId && hasClientEmail && hasPrivateKey) {
            // 🚀 Production / Vercel - Use Environment Variables
            try {
                let privateKey = process.env.FIREBASE_PRIVATE_KEY;
                
                // Remove surrounding quotes if present
                if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                    privateKey = privateKey.slice(1, -1);
                }
                // Replace literal \n with actual newlines
                privateKey = privateKey.replace(/\\n/g, '\n');
                
                console.log('🔑 Private Key length:', privateKey.length);
                console.log('🔑 Private Key starts with: BEGIN PRIVATE KEY');
                console.log('🔑 Private Key ends with: END PRIVATE KEY');
                
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: privateKey,
                    })
                });
                
                firebaseInitialized = true;
                console.log('✅ Firebase Admin initialized using Environment Variables');
                console.log(`📡 Project: ${process.env.FIREBASE_PROJECT_ID}`);
                console.log(`📧 Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
                
            } catch (initError) {
                console.error('❌ Firebase Admin ENV init failed:', initError.message);
                console.error('   Stack:', initError.stack);
            }
        } else {
            // 💻 Local Development - serviceAccountKey.json භාවිතා කරන්න
            console.log('📁 Trying to load serviceAccountKey.json...');
            try {
                const serviceAccount = require('./serviceAccountKey.json');
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                firebaseInitialized = true;
                console.log('✅ Firebase Admin initialized using serviceAccountKey.json');
            } catch (fileError) {
                console.error('❌ serviceAccountKey.json not found:', fileError.message);
                console.error('   Please ensure serviceAccountKey.json exists or set FIREBASE_* env vars.');
            }
        }
    } else {
        firebaseInitialized = true;
        console.log('✅ Firebase Admin already initialized');
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('   Stack:', error.stack);
}

// Set db and auth references
if (firebaseInitialized) {
    try {
        db = admin.firestore();
        auth = admin.auth();
        console.log('✅ Firestore and Auth references created');
    } catch (dbError) {
        console.error('❌ Failed to create db/auth references:', dbError.message);
        firebaseInitialized = false;
    }
} else {
    console.warn('⚠️ Firebase not initialized - Database operations will fail');
}

// ============================================================
// 🛡️ MIDDLEWARE - Check Firebase status
// ============================================================
app.use((req, res, next) => {
    // Skip health check
    if (req.path === '/api/health') return next();
    
    if (!firebaseInitialized) {
        console.error('🔥 Firebase not initialized! Request blocked:', req.path);
        return res.status(503).json({
            error: 'Service unavailable',
            message: 'Firebase initialization failed. Check environment variables.',
            status: 'firebase_not_initialized',
            timestamp: new Date().toISOString()
        });
    }
    next();
});

// ============================================================
// ✅ HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: firebaseInitialized ? 'healthy' : 'unhealthy',
        firebase: firebaseInitialized ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        envVars: {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
            VITE_FIREBASE_API_KEY: !!process.env.VITE_FIREBASE_API_KEY,
            VITE_FIREBASE_PROJECT_ID: !!process.env.VITE_FIREBASE_PROJECT_ID
        }
    });
});

// ============================================================
// 📌 ROOT
// ============================================================
app.get('/', (req, res) => {
    res.json({
        message: 'ShelfLife AI Backend',
        status: firebaseInitialized ? 'Online' : 'Offline',
        firebase: firebaseInitialized ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET /api/health',
            suppliers: 'GET /api/suppliers/:userId',
            addSupplier: 'POST /api/suppliers/:userId/add',
            inventory: 'GET /api/inventory/:userId',
            addProduct: 'POST /api/inventory/:userId/add',
            subscription: 'GET /api/subscription/:userId',
            usage: 'GET /api/usage/:userId/:type',
            admin: {
                users: 'GET /api/admin/users',
                subscriptions: 'GET /api/admin/subscriptions',
                stats: 'GET /api/admin/stats'
            }
        }
    });
});

// ============================================================
// 👤 USER ENDPOINTS
// ============================================================

// ============================================================
// 1. GET SUPPLIERS
// ============================================================
app.get('/api/suppliers/:userId', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId } = req.params;
        console.log(`📋 Getting suppliers for user: ${userId}`);
        
        const docRef = db.collection('suppliers').doc(userId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            await docRef.set({ list: [], updatedAt: new Date().toISOString() });
            return res.json({ list: [] });
        }
        
        res.json(doc.data());
    } catch (error) {
        console.error('❌ Get suppliers error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 2. ADD SUPPLIER
// ============================================================
app.post('/api/suppliers/:userId/add', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId } = req.params;
        const { name, contact, email, address, rating, notes } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }
        
        console.log(`📋 Adding supplier for user: ${userId}, name: ${name}`);
        
        const docRef = db.collection('suppliers').doc(userId);
        const doc = await docRef.get();
        let list = doc.exists ? doc.data().list || [] : [];
        
        if (list.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            return res.status(400).json({ error: 'Supplier with this name already exists' });
        }
        
        const newSupplier = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
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
        await docRef.set({ list, updatedAt: new Date().toISOString() });
        
        // Update subscription usage
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
        console.error('❌ Add supplier error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 3. UPDATE SUPPLIER
// ============================================================
app.put('/api/suppliers/:userId/update/:supplierId', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId, supplierId } = req.params;
        const updates = req.body;
        
        console.log(`📋 Updating supplier: ${supplierId} for user: ${userId}`);
        
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
        
        list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
        await docRef.set({ list, updatedAt: new Date().toISOString() });
        
        res.json({ success: true, supplier: list[index] });
    } catch (error) {
        console.error('❌ Update supplier error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 4. DELETE SUPPLIER
// ============================================================
app.delete('/api/suppliers/:userId/delete/:supplierId', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId, supplierId } = req.params;
        
        console.log(`📋 Deleting supplier: ${supplierId} for user: ${userId}`);
        
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
        await docRef.set({ list, updatedAt: new Date().toISOString() });
        
        const subRef = db.collection('subscriptions').doc(userId);
        await subRef.update({
            'usage.suppliersCount': list.length,
            updatedAt: new Date().toISOString()
        });
        
        res.json({ success: true, total: list.length });
    } catch (error) {
        console.error('❌ Delete supplier error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 5. GET INVENTORY
// ============================================================
app.get('/api/inventory/:userId', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId } = req.params;
        console.log(`📋 Getting inventory for user: ${userId}`);
        
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
        console.error('❌ Get inventory error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 6. ADD PRODUCT
// ============================================================
app.post('/api/inventory/:userId/add', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId } = req.params;
        const { product } = req.body;
        
        if (!product || !product.name) {
            return res.status(400).json({ error: 'Product name is required' });
        }
        
        console.log(`📋 Adding product for user: ${userId}, name: ${product.name}`);
        
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
        
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        const newProduct = { id: newId, ...product, addedAt: new Date().toISOString() };
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
        console.error('❌ Add product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 7. UPDATE PRODUCT
// ============================================================
app.put('/api/inventory/:userId/update', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId } = req.params;
        const { itemId, updates } = req.body;
        
        console.log(`📋 Updating product: ${itemId} for user: ${userId}`);
        
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
        console.error('❌ Update product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 8. DELETE PRODUCT
// ============================================================
app.delete('/api/inventory/:userId/delete/:itemId', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId, itemId } = req.params;
        
        console.log(`📋 Deleting product: ${itemId} for user: ${userId}`);
        
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
        console.error('❌ Delete product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 9. GET SUBSCRIPTION
// ============================================================
app.get('/api/subscription/:userId', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId } = req.params;
        console.log(`📋 Getting subscription for user: ${userId}`);
        
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
            return res.json(subscription);
        }
        
        res.json(subDoc.data());
    } catch (error) {
        console.error('❌ Get subscription error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 10. GET USAGE
// ============================================================
app.get('/api/usage/:userId/:type', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { userId, type } = req.params;
        console.log(`📋 Getting usage for user: ${userId}, type: ${type}`);
        
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
        console.error('❌ Usage check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 🛡️ ADMIN ENDPOINTS
// ============================================================

// ============================================================
// 11. GET ALL USERS (Admin)
// ============================================================
app.get('/api/admin/users', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        console.log('📋 Getting all users (Admin)');
        
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            uid: doc.id,
            ...doc.data()
        }));
        res.json(users);
    } catch (error) {
        console.error('❌ Get users error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 12. GET ALL SUBSCRIPTIONS (Admin)
// ============================================================
app.get('/api/admin/subscriptions', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        console.log('📋 Getting all subscriptions (Admin)');
        
        const snapshot = await db.collection('subscriptions').get();
        const subscriptions = snapshot.docs.map(doc => ({
            id: doc.id,
            userId: doc.id,
            ...doc.data()
        }));
        res.json(subscriptions);
    } catch (error) {
        console.error('❌ Get subscriptions error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 13. GET ADMIN STATS
// ============================================================
app.get('/api/admin/stats', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        console.log('📋 Getting admin stats');
        
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

        const scansSnapshot = await db.collection('scans').get();
        const totalScans = scansSnapshot.size;

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
            totalScans,
            totalRevenue,
            activeSubscriptions: activeSubs,
            trialUsers,
            expiredTrials,
            recentUsers
        });
    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 14. UPDATE USER ROLE (Admin)
// ============================================================
app.put('/api/admin/users/:uid/role', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { uid } = req.params;
        const { role } = req.body;
        
        console.log(`📋 Updating user role: ${uid} -> ${role}`);
        
        await db.collection('users').doc(uid).update({
            role: role,
            updatedAt: new Date().toISOString()
        });
        
        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('❌ Update role error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 15. EXTEND TRIAL (Admin)
// ============================================================
app.post('/api/admin/subscriptions/:uid/extend', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { uid } = req.params;
        const { days } = req.body;
        
        console.log(`📋 Extending trial: ${uid} by ${days || 7} days`);
        
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
        console.error('❌ Extend trial error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 16. UPGRADE PLAN (Admin)
// ============================================================
app.post('/api/admin/subscriptions/:uid/upgrade', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        const { uid } = req.params;
        const { planId } = req.body;
        
        console.log(`📋 Upgrading plan: ${uid} -> ${planId}`);
        
        const planLimits = {
            BASIC: { maxProducts: 200, maxSuppliers: 25, maxScansPerMonth: 500 },
            PROFESSIONAL: { maxProducts: 1000, maxSuppliers: 100, maxScansPerMonth: 2000 },
            ENTERPRISE: { maxProducts: Infinity, maxSuppliers: Infinity, maxScansPerMonth: Infinity }
        };
        
        const planFeatures = {
            BASIC: { canSupplierReturn: true, canBasicAnalytics: true },
            PROFESSIONAL: { canOCRScan: true, canSupplierReturn: true, canAdvancedAnalytics: true, canPrioritySupport: true, canExportData: true },
            ENTERPRISE: { canOCRScan: true, canSupplierReturn: true, canAdvancedAnalytics: true, canPrioritySupport: true, canAPIAccess: true, canMultiUser: true, canExportData: true, canCustomReports: true }
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
        console.error('❌ Upgrade plan error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 17. SEED TEST DATA
// ============================================================
app.post('/api/seed/data', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(503).json({ error: 'Firebase not initialized' });
        }
        console.log('📋 Seeding test data...');
        
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
            });
            
            await db.collection('inventory').doc(user.uid).set({
                items: [],
                lastUpdated: new Date().toISOString(),
                itemCount: 0
            });
            
            await db.collection('suppliers').doc(user.uid).set({
                list: [],
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
        console.error('❌ Seed error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 🚨 GLOBAL ERROR HANDLING MIDDLEWARE (අවසානයේ)
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message || 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// 🚀 START SERVER (Local Development Only - Vercel uses serverless)
// ============================================================
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log("=".repeat(60));
        console.log(`🚀 ShelfLife AI Backend is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`🔥 Firebase: ${firebaseInitialized ? '✅ Connected' : '❌ Failed'}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log("=".repeat(60));
    });
}

module.exports = app;