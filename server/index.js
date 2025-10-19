// Express server entry for the GlobeTalk backend API
// - Boots the app, wires endpoint routers, and (optionally) serves Swagger docs.
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');
const cron = require('node-cron');
let swaggerUi = null;

try {
    swaggerUi = require('swagger-ui-express');
} catch (e) {
    console.warn('Swagger UI not available. Skipping API docs setup.');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
let serviceAccount;
try {
    require('dotenv').config();
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
        serviceAccount = require('./serviceAccountKey.json');
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) {
    console.warn('Firebase Admin SDK not initialized. serviceAccountKey.json missing or env var not set.');
}

const db = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;

// Cron job to clean tempip_blocked collection
cron.schedule('*/5 * * * *', async () => {
    if (!db) return;
    console.log('Cleaning tempip_blocked collection...');
    const snapshot = await db.collection('tempip_blocked').get();
    const now = Date.now();
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.expiresAt && data.expiresAt.toMillis() < now) {
            doc.ref.delete();
        }
    });
});

// Endpoint to check if an IP is blocked
app.get('/api/tempip_blocked/:ip', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { ip } = req.params;
    if (!ip) return res.status(400).json({ error: 'Missing IP address' });

    try {
        const doc = await db.collection('tempip_blocked').doc(ip).get();
        if (!doc.exists) return res.status(200).json({ blocked: false });

        const data = doc.data();
        const now = Date.now();

        if (data.expiresAt && data.expiresAt.toMillis() < now) {
            await doc.ref.delete();
            return res.status(200).json({ blocked: false });
        }

        res.status(200).json({
            blocked: true,
            userId: data.userId || null,
            blockedAt: data.blockedAt ? data.blockedAt.toDate() : null,
            expiresAt: data.expiresAt ? data.expiresAt.toDate() : null,
            source: data.source || 'unknown'
        });
    } catch (error) {
        console.error('Error checking temp blocked IP:', error);
        res.status(500).json({ error: error.message });
    }
});

// Routers
const makeHealthRouter = require('./endpoints/health');
const makeProfileRouter = require('./endpoints/profile');
const makeMatchmakingRouter = require('./endpoints/matchmaking');
const makeChatRouter = require('./endpoints/chat');
const makeUsersRouter = require('./endpoints/users');
const makeReportsRouter = require('./endpoints/reports');
const makeStatsRouter = require('./endpoints/stats');

// Swagger/OpenAPI setup
let openApiSpec = null;
try {
    const specPath = path.join(__dirname, 'openapi.json');
    if (fs.existsSync(specPath)) {
        openApiSpec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    }
} catch (e) {
    console.warn('Failed to load OpenAPI spec:', e.message);
}
if (openApiSpec && swaggerUi) {
    app.get('/api-docs.json', (req, res) => res.json(openApiSpec));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

// Mount routers
app.use('/api', makeHealthRouter({ db }));
app.use('/api', makeProfileRouter({ db, admin }));
app.use('/api', makeMatchmakingRouter({ db }));
app.use('/api', makeChatRouter({ db, admin }));
app.use('/api', makeUsersRouter({ db, admin, adminAuth }));
app.use('/api', makeReportsRouter({ db, admin }));
app.use('/api', makeStatsRouter({ db }));

/**
 * 404 handler for unknown routes.
 */
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server if run directly (export app for testing)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`GlobeTalk backend listening on port ${PORT}`);
    });
}

module.exports = app;