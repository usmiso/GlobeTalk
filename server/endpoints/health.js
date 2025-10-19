// Health endpoint: quick readiness probe that doesn't require Firestore.
const express = require('express');

module.exports = ({ db }) => {
    const router = express.Router();

    // Simple health check - does not require Firestore
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', message: 'GlobeTalk backend is running!' });
    });

    return router;
};
