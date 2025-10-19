// Express server entry for the GlobeTalk backend API
// - Boots the app, wires endpoint routers, and (optionally) serves Swagger docs.
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');
// Try to load node-cron, but don't crash if unavailable (e.g., minimal containers)
let cron = null;
try {
    // eslint-disable-next-line global-require
    cron = require('node-cron');
} catch (e) {
    console.warn('node-cron not available. Scheduled maintenance will be skipped.');
}
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

// Optionally load .env if available (do not fail when not installed, e.g., slim containers)
try {
    // eslint-disable-next-line global-require
    require('dotenv').config();
} catch (e) {
    if (e && e.code !== 'MODULE_NOT_FOUND') {
        console.warn('dotenv failed to load:', e.message);
    }
}

// Initialize Firebase Admin
let serviceAccount;
let firebaseInitialized = false;
try {
    // 1) Prefer full JSON in FIREBASE_SERVICE_ACCOUNT_JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        firebaseInitialized = true;
    } else if (
        // 2) Support split env vars to avoid JSON escaping hassles
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        // Replace escaped newlines in env var with actual newlines
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey })
        });
        firebaseInitialized = true;
    } else {
        // 3) Fallback to local file (useful for local dev)
        const saPath = path.join(__dirname, 'serviceAccountKey.json');
        if (fs.existsSync(saPath)) {
            const raw = fs.readFileSync(saPath, 'utf-8');
            serviceAccount = JSON.parse(raw);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            firebaseInitialized = true;
        }
    }
} catch (e) {
    console.warn('Failed to initialize Firebase Admin:', e.message);
}

if (!firebaseInitialized) {
    console.warn('Firebase Admin SDK not initialized. Provide FIREBASE_* env vars or serviceAccountKey.json.');
}

const db = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;

// Cron job to clean tempip_blocked collection (disable during Jest by default)
const disableCronInTests = process.env.NODE_ENV === 'test' && process.env.ENABLE_CRON_IN_TESTS !== '1';
if (!disableCronInTests && cron && typeof cron.schedule === 'function') {
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
}

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

// Minimal firebase health probe to help diagnose prod issues
app.get('/api/health/firebase', (req, res) => {
    const initialized = admin.apps && admin.apps.length > 0;
    res.json({ firestoreInitialized: Boolean(db), adminInitialized: initialized });
});

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