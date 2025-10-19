// Express server entry for the GlobeTalk backend API
// - Boots the app, wires endpoint routers, and (optionally) serves Swagger docs.
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');
let swaggerUi = null;
try {
    // Optional dependency for tests where server deps may not be installed at repo root
    swaggerUi = require('swagger-ui-express');
} catch (e) {
    // Leave swaggerUi as null; docs will be disabled in this environment
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin (from env JSON or serviceAccountKey.json)
// Note: The server runs fine without Firestore (health/docs endpoints still work).
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

// Routers (separation of concerns)
const makeHealthRouter = require('./endpoints/health');
const makeProfileRouter = require('./endpoints/profile');
const makeMatchmakingRouter = require('./endpoints/matchmaking');
const makeChatRouter = require('./endpoints/chat');
const makeUsersRouter = require('./endpoints/users');
const makeReportsRouter = require('./endpoints/reports');
const makeStatsRouter = require('./endpoints/stats');

// Swagger/OpenAPI setup (serves docs whether Firestore is initialized or not)
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

// Mount routers under /api
// Each router is a factory that receives dependencies (db, admin, etc.).
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