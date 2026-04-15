const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const serviceAccount = require('./serviceAccountKey.json');

const app = express();

app.use(cors({
    origin: true, 
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

app.get('/', (req, res) => {
    res.send('ShelfLife AI Backend is running!');
});

app.post('/api/signup', async (req, res) => {
    console.log("Signup Request Received:", req.body);
    try {
        const { email, password, name } = req.body;
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name
        });

        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            role: 'user',
            createdAt: new Date()
        });

        res.status(201).json({ message: 'User registered successfully!', uid: userRecord.uid });
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { idToken } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ message: 'Login successful!', user: userDoc.data() });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(401).json({ error: 'Unauthorized access' });
    }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;