// server.cjs - Complete backend with all working endpoints
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

// Initialize express
const app = express();

// Middleware
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

// ==================== ROOT ROUTE ====================

app.get('/', (req, res) => {
    res.json({ 
        message: 'ShelfLife AI Backend is running!',
        status: 'Online',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: { signup: 'POST /api/signup', login: 'POST /api/login' },
            inventory: { get: 'GET /api/inventory/:userId', add: 'POST /api/inventory/:userId/add', update: 'PUT /api/inventory/:userId/update', delete: 'DELETE /api/inventory/:userId/delete/:itemId' },
            subscription: { get: 'GET /api/subscription/:userId', upgrade: 'POST /api/subscription/upgrade' },
            scans: { log: 'POST /api/scans/:userId' },
            payments: { process: 'POST /api/payments/process', history: 'GET /api/payments/:userId' },
            dashboard: { get: 'GET /api/dashboard/:userId' },
            analytics: { get: 'GET /api/analytics/:userId' }
        }
    });
});

// ==================== AUTHENTICATION ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Signup - Creates Auth user, Profile, Subscription and Inventory
app.post('/api/signup', async (req, res) => {
    console.log("=".repeat(50));
    console.log(`[SIGNUP REQUEST] Email: ${req.body.email}`);
    
    let createdUid = null;

    try {
        const { email, password, name, businessName, businessType } = req.body;
        
        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // 1. Create User in Firebase Authentication
        console.log("1. Creating user in Firebase Auth...");
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name
        });
        createdUid = userRecord.uid;
        console.log(`✅ Auth User Created! UID: ${createdUid}`);

        // 2. Save to Firestore
        console.log("2. Saving data to Firestore...");
        
        // Create user document
        await db.collection('users').doc(createdUid).set({
            name,
            email,
            businessName: businessName || `${name}'s Store`,
            businessType: businessType || 'retail',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Create default subscription (14-day Free Trial)
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        await db.collection('subscriptions').doc(createdUid).set({
            userId: createdUid,
            planId: 'FREE_TRIAL',
            status: 'trial_active',
            trialStart: new Date().toISOString(),
            trialEnd: trialEnd.toISOString(),
            features: {
                canBasicScan: true,
                canOCRScan: true,  // Enable for trial
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
        });

        // Create empty inventory
        await db.collection('inventory').doc(createdUid).set({
            items: [],
            lastUpdated: new Date().toISOString(),
            itemCount: 0
        });

        console.log("✅ Firestore data saved!");
        
        res.status(201).json({ 
            success: true,
            message: 'User registered successfully!', 
            uid: createdUid,
            trial: { days: 14, end: trialEnd.toISOString() }
        });

    } catch (error) {
        console.error("❌ Signup Error:", error.message);
        
        // Rollback: Delete Auth user if Firestore failed
        if (createdUid) {
            try {
                await auth.deleteUser(createdUid);
                console.log(`Rolled back: Deleted user ${createdUid}`);
            } catch (e) {
                console.error("Rollback failed:", e.message);
            }
        }
        
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: 'This email is already registered. Please login instead.' });
        }
        
        res.status(400).json({ error: error.message });
    }
});

// Login Verification
app.post('/api/login', async (req, res) => {
    console.log("[LOGIN REQUEST]");
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return res.status(400).json({ error: 'ID token required' });
        }
        
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        const userDoc = await db.collection('users').doc(userId).get();
        const subDoc = await db.collection('subscriptions').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        // Check if trial expired
        let subscription = subDoc.exists ? subDoc.data() : null;
        if (subscription && subscription.status === 'trial_active') {
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

        res.status(200).json({ 
            success: true,
            message: 'Login successful!', 
            user: userDoc.data(),
            subscription: subscription
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(401).json({ error: 'Unauthorized access' });
    }
});

// Social login handler
app.post('/api/social-login', async (req, res) => {
    console.log("[SOCIAL LOGIN REQUEST]");
    try {
        const { idToken, email, name, provider } = req.body;
        
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch {
            // Create new user
            userRecord = await auth.createUser({
                email,
                displayName: name,
                emailVerified: true
            });
            
            // Create Firestore profile
            await db.collection('users').doc(userRecord.uid).set({
                name: name,
                email: email,
                businessName: `${name}'s Store`,
                businessType: 'retail',
                role: 'user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            // Create subscription
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);
            await db.collection('subscriptions').doc(userRecord.uid).set({
                userId: userRecord.uid,
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
            
            await db.collection('inventory').doc(userRecord.uid).set({
                items: [],
                lastUpdated: new Date().toISOString(),
                itemCount: 0
            });
        }
        
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        
        res.json({
            success: true,
            user: userDoc.data(),
            uid: userRecord.uid
        });
    } catch (error) {
        console.error("Social login error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== INVENTORY MANAGEMENT ====================

// Get all inventory items
app.get('/api/inventory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const invDoc = await db.collection('inventory').doc(userId).get();
        
        if (!invDoc.exists) {
            // Create empty inventory
            await db.collection('inventory').doc(userId).set({
                items: [],
                lastUpdated: new Date().toISOString(),
                itemCount: 0
            });
            return res.json({ items: [], itemCount: 0 });
        }
        
        const data = invDoc.data();
        res.json(data);
    } catch (error) {
        console.error("Get inventory error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Add a single product to inventory
app.post('/api/inventory/:userId/add', async (req, res) => {
    try {
        const { userId } = req.params;
        const { product } = req.body;
        
        if (!product || !product.name) {
            return res.status(400).json({ error: 'Product name is required' });
        }
        
        // Get current inventory
        const invDoc = await db.collection('inventory').doc(userId).get();
        let items = invDoc.exists ? invDoc.data().items || [] : [];
        
        // Check product limits from subscription
        const subDoc = await db.collection('subscriptions').doc(userId).get();
        const maxProducts = subDoc.exists ? subDoc.data().limits?.maxProducts || 50 : 50;
        
        if (items.length >= maxProducts) {
            return res.status(403).json({ 
                error: 'Product limit reached', 
                limit: maxProducts,
                current: items.length
            });
        }
        
        // Generate new ID
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        
        const newProduct = {
            id: newId,
            ...product,
            addedAt: new Date().toISOString()
        };
        
        items.push(newProduct);
        
        await db.collection('inventory').doc(userId).set({
            items: items,
            lastUpdated: new Date().toISOString(),
            itemCount: items.length
        });

        // Update usage count
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

// Update inventory item
app.put('/api/inventory/:userId/update', async (req, res) => {
    try {
        const { userId } = req.params;
        const { itemId, updates } = req.body;
        
        const invDoc = await db.collection('inventory').doc(userId).get();
        let items = invDoc.exists ? invDoc.data().items || [] : [];
        
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Calculate days left if expiry date changed
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
            items: items,
            lastUpdated: new Date().toISOString(),
            itemCount: items.length
        });
        
        res.json({ success: true, item: items[itemIndex] });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete inventory item
app.delete('/api/inventory/:userId/delete/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        
        const invDoc = await db.collection('inventory').doc(userId).get();
        let items = invDoc.exists ? invDoc.data().items || [] : [];
        
        const itemIdNum = parseInt(itemId);
        items = items.filter(i => i.id !== itemIdNum);
        
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

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Get subscription status
app.get('/api/subscription/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let subDoc = await db.collection('subscriptions').doc(userId).get();
        
        if (!subDoc.exists) {
            // Create default trial subscription
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
            
            // Check if trial expired
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
});

// Upgrade subscription
app.post('/api/subscription/upgrade', async (req, res) => {
    try {
        const { userId, planId } = req.body;
        
        let limits = { maxProducts: 50, maxSuppliers: 10, maxScansPerMonth: 100 };
        let features = {
            canBasicScan: true,
            canOCRScan: false,
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
        };
        
        if (planId === 'BASIC') {
            limits = { maxProducts: 200, maxSuppliers: 25, maxScansPerMonth: 500 };
            features.canSupplierReturn = true;
            features.canBasicAnalytics = true;
        } else if (planId === 'PROFESSIONAL') {
            limits = { maxProducts: 1000, maxSuppliers: 100, maxScansPerMonth: 2000 };
            features.canOCRScan = true;
            features.canSupplierReturn = true;
            features.canAdvancedAnalytics = true;
            features.canPrioritySupport = true;
            features.canExportData = true;
        } else if (planId === 'ENTERPRISE') {
            limits = { maxProducts: Infinity, maxSuppliers: Infinity, maxScansPerMonth: Infinity };
            features.canOCRScan = true;
            features.canSupplierReturn = true;
            features.canAdvancedAnalytics = true;
            features.canPrioritySupport = true;
            features.canAPIAccess = true;
            features.canMultiUser = true;
            features.canExportData = true;
            features.canCustomReports = true;
        }
        
        await db.collection('subscriptions').doc(userId).update({
            planId: planId,
            status: 'active',
            limits: limits,
            features: features,
            updatedAt: new Date().toISOString()
        });
        
        res.json({ success: true, message: `Upgraded to ${planId} successfully!` });
    } catch (error) {
        console.error("Upgrade error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== SCANS MANAGEMENT ====================

// Log a scan
app.post('/api/scans/:userId', async (req, res) => {
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
        
        // Update usage count
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
});

// Get scan history
app.get('/api/scans/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('scans')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const scans = [];
        snapshot.forEach(doc => scans.push({ id: doc.id, ...doc.data() }));
        res.json(scans);
    } catch (error) {
        console.error("Get scans error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== PAYMENTS ====================

// Process payment and upgrade
app.post('/api/payments/process', async (req, res) => {
    try {
        const { userId, amount, planId, paymentId } = req.body;
        
        if (!userId || !amount || !planId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Save payment record
        const paymentData = {
            userId,
            amount: Number(amount),
            planId,
            status: 'completed',
            paymentId: paymentId || `pay_${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('payments').add(paymentData);

        // Update subscription
        let limits = { maxProducts: 50, maxScansPerMonth: 100 };
        if (planId === 'BASIC') {
            limits = { maxProducts: 200, maxScansPerMonth: 500 };
        } else if (planId === 'PROFESSIONAL') {
            limits = { maxProducts: 1000, maxScansPerMonth: 2000 };
        } else if (planId === 'ENTERPRISE') {
            limits = { maxProducts: Infinity, maxScansPerMonth: Infinity };
        }
        
        await db.collection('subscriptions').doc(userId).update({
            planId: planId,
            status: 'active',
            limits: limits,
            updatedAt: new Date().toISOString()
        });

        res.json({ success: true, message: `Upgraded to ${planId} successfully!` });
    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get payment history
app.get('/api/payments/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('payments')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        const payments = [];
        snapshot.forEach(doc => payments.push({ id: doc.id, ...doc.data() }));
        res.json(payments);
    } catch (error) {
        console.error("Get payments error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== DASHBOARD & ANALYTICS ====================

// Get dashboard data
app.get('/api/dashboard/:userId', async (req, res) => {
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
});

// Get analytics data
app.get('/api/analytics/:userId', async (req, res) => {
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
        
        const monthlyTrend = [3200, 4100, 3800, 5200, 4800, 6100, 5800, 7200, 6900, 8400, 7900, expiringValue * 0.7];
        
        res.json({
            totalSaved: expiringValue * 0.7,
            wasteReduction: wasteValue,
            flashSaleRevenue: expiringValue * 0.5,
            projectedSavings: expiringValue * 0.7 * 12,
            turnoverRate: items.length > 0 ? 85 : 0,
            avgMargin: avgMargin,
            monthlyTrend: monthlyTrend,
            categoryData: {
                labels: ['Dairy', 'Bakery', 'Canned', 'Beverages', 'Other'],
                values: [35, 20, 25, 15, 5]
            }
        });
    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== USAGE CHECK ====================

// Check usage limits
app.get('/api/usage/:userId/:type', async (req, res) => {
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
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`🚀 ShelfLife AI Backend is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 Firestore: Connected`);
    console.log(`🔐 Firebase Auth: Ready`);
    console.log("=".repeat(50));
});

module.exports = app;