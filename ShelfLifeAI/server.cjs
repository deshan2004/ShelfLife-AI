// server.cjs - Complete backend with all Firebase connections
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const serviceAccount = require('./serviceAccountKey.json');

const app = express();

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Initialize Firebase Admin
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
        endpoints: {
            auth: '/api/signup, /api/login',
            inventory: '/api/inventory/:userId',
            subscription: '/api/subscription/:userId',
            analytics: '/api/analytics/:userId',
            scans: '/api/scans/:userId',
            payments: '/api/payments/process'
        }
    });
});

// ==================== AUTHENTICATION ====================

// Signup - Creates Auth user, Profile, Subscription and Inventory
app.post('/api/signup', async (req, res) => {
    console.log("Signup Request Received");
    try {
        const { email, password, name, businessName, businessType } = req.body;
        
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name
        });

        // 1. Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            businessName: businessName || `${name}'s Store`,
            businessType: businessType || 'retail',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // 2. Create default subscription (14-day Free Trial)
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        
        await db.collection('subscriptions').doc(userRecord.uid).set({
            userId: userRecord.uid,
            planId: 'FREE_TRIAL',
            status: 'trial_active',
            trialStart: new Date().toISOString(),
            trialEnd: trialEnd.toISOString(),
            features: {
                canOCRScan: false,
                canBarcodeScan: true,
                canFlashSale: true,
                canSupplierReturn: false,
                canAdvancedAnalytics: false
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
            createdAt: new Date().toISOString()
        });

        // 3. Create default inventory
        await db.collection('inventory').doc(userRecord.uid).set({
            items: [],
            lastUpdated: new Date().toISOString(),
            itemCount: 0
        });

        res.status(201).json({ 
            message: 'User registered successfully!', 
            uid: userRecord.uid,
            trial: { days: 14, end: trialEnd.toISOString() }
        });
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// Login Verification
app.post('/api/login', async (req, res) => {
    try {
        const { idToken } = req.body;
        const decodedToken = await auth.verifyIdToken(idToken);
        
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const subDoc = await db.collection('subscriptions').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ 
            message: 'Login successful!', 
            user: userDoc.data(),
            subscription: subDoc.exists ? subDoc.data() : null
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(401).json({ error: 'Unauthorized access' });
    }
});

// ==================== INVENTORY MANAGEMENT ====================

// Get all inventory items
app.get('/api/inventory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const invDoc = await db.collection('inventory').doc(userId).get();
        res.json(invDoc.exists ? invDoc.data() : { items: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a single product to inventory
app.post('/api/inventory/:userId/add', async (req, res) => {
    try {
        const { userId } = req.params;
        const { product } = req.body;
        
        const invDoc = await db.collection('inventory').doc(userId).get();
        let items = invDoc.exists ? invDoc.data().items || [] : [];
        
        // Check product limits from subscription
        const subDoc = await db.collection('subscriptions').doc(userId).get();
        const maxProducts = subDoc.exists ? subDoc.data().limits?.maxProducts || 50 : 50;
        
        if (items.length >= maxProducts) {
            return res.status(403).json({ error: 'Product limit reached', limit: maxProducts });
        }
        
        items.push({
            ...product,
            addedAt: new Date().toISOString()
        });
        
        await db.collection('inventory').doc(userId).update({
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
        res.status(500).json({ error: error.message });
    }
});

// ==================== SCANS MANAGEMENT ====================

// Scan එකක් කළ විට දත්ත ගබඩා කිරීම
app.post('/api/scans/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, value, result } = req.body;

        const scanData = {
            userId,
            type,
            value,
            result: result || 'Success',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('scans').add(scanData);
        
        // Update usage count in subscription
        await db.collection('subscriptions').doc(userId).update({
            'usage.scansThisMonth': admin.firestore.FieldValue.increment(1)
        });

        res.status(201).json({ success: true, scanId: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PAYMENTS & UPGRADES ====================
const crypto = require('crypto'); // මුලින්ම මෙය require කරගන්න

const MERCH_ID = "1235220";
const MERCH_SECRET = "MjUwMTMxNTE3NzEyMzU5NTc0NjQ5NTE0ODA5NzYzMjQxMzcwOTc";

// Hash එක generate කරන endpoint එක
app.post('/api/payments/generate-hash', (req, res) => {
    const { order_id, amount, currency } = req.body;
    const formattedAmount = Number(amount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');
    
    const hash = crypto.createHash('md5')
        .update(MERCH_ID + order_id + formattedAmount + currency + 
                crypto.createHash('md5').update(MERCH_SECRET).digest('hex').toUpperCase())
        .digest('hex').toUpperCase();

    res.json({ hash });
});
// Process Payment and Upgrade Plan
app.post('/api/payments/process', async (req, res) => {
    try {
        const { userId, amount, planId } = req.body;

        // 1. Save Payment Record
        const paymentData = {
            userId,
            amount,
            planId,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        await db.collection('payments').add(paymentData);

        // 2. Define Limits based on Plan
        let limits = { maxProducts: 50, maxScansPerMonth: 100 };
        
        if (planId === 'PROFESSIONAL') {
            limits = { maxProducts: 500, maxScansPerMonth: 1000 };
        } else if (planId === 'ENTERPRISE') {
            limits = { maxProducts: 10000, maxScansPerMonth: 50000 };
        }

        // 3. Update Subscription
        await db.collection('subscriptions').doc(userId).update({
            planId,
            status: 'active',
            limits,
            updatedAt: new Date().toISOString()
        });

        res.json({ success: true, message: `Upgraded to ${planId} successfully!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get User Payments
app.get('/api/payments/:userId', async (req, res) => {
    try {
        const snapshot = await db.collection('payments')
            .where('userId', '==', req.params.userId)
            .get();
            
        const payments = [];
        snapshot.forEach(doc => payments.push({ id: doc.id, ...doc.data() }));
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DASHBOARD & ANALYTICS ====================

app.get('/api/dashboard/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const invDoc = await db.collection('inventory').doc(userId).get();
        const subDoc = await db.collection('subscriptions').doc(userId).get();
        
        const items = invDoc.exists ? invDoc.data().items || [] : [];
        
        const expiringCount = items.filter(i => i.daysLeft <= 7 && i.daysLeft > 0).length;
        const expiredCount = items.filter(i => i.daysLeft <= 0).length;
        const totalValue = items.reduce((sum, i) => sum + (Number(i.sellingPrice) * Number(i.stock)), 0);

        res.json({
            totalItems: items.length,
            totalValue,
            expiringCount,
            expiredCount,
            recentItems: items.slice(-5).reverse(),
            subscription: subDoc.exists ? subDoc.data() : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 ShelfLife AI Backend is running on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
});

module.exports = app;