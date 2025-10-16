// User administrative endpoints: store IP for audit, block users, and query block status.
const express = require('express');

module.exports = ({ db, admin, adminAuth }) => {
    const router = express.Router();

    // Store a user's IP address
    router.post('/user/ip', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        try {
            const { uid, ipAddress } = req.body;
            if (!uid) return res.status(400).json({ error: 'Missing user ID' });

            await db.collection('users').doc(uid).set(
                { ipAddress: ipAddress || 'unknown' },
                { merge: true }
            );

            res.status(200).json({ message: 'IP address stored successfully' });
        } catch (error) {
            console.error('Error storing IP address:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Marks a user as blocked in their profile; optionally stores their email for audit.
    router.post('/blockUser', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
        const { userID } = req.body;
        if (!userID) return res.status(400).json({ error: 'Missing userID' });
        try {
            let email = null;
            if (adminAuth) {
                try {
                    const userRecord = await adminAuth.getUser(userID);
                    email = userRecord.email || null;
                } catch (e) {
                    // user may not exist in auth; ignore
                }
            }
            const profileRef = db.collection('profiles').doc(userID);
            await profileRef.set({
                userID,
                blocked: true,
                blockedAt: Date.now(),
                blockedEmail: email
            }, { merge: true });
            // Add to blocked_users collection (idempotent)
            const blockedRef = db.collection('blocked_users').doc(userID);
            await blockedRef.set({
                userID,
                email,
                blockedAt: Date.now(),
                source: 'admin_action'
            }, { merge: true });
            res.status(200).json({ success: true, message: 'User blocked.' });
        } catch (error) {
            console.error('Error blocking user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Returns { blocked: boolean, source?, blockedAt? }
    router.get('/blocked/:userID', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
        const { userID } = req.params;
        if (!userID) return res.status(400).json({ error: 'Missing userID' });
        try {
            // Prefer blocked_users collection
            const blockedDoc = await db.collection('blocked_users').doc(userID).get();
            if (blockedDoc.exists) {
                const data = blockedDoc.data();
                return res.status(200).json({ blocked: true, source: data.source || 'admin_action', blockedAt: data.blockedAt || null });
            }
            // Fallback to profile flag
            const profileDoc = await db.collection('profiles').doc(userID).get();
            if (profileDoc.exists) {
                const pdata = profileDoc.data();
                if (pdata.blocked) {
                    return res.status(200).json({ blocked: true, source: 'profile_flag', blockedAt: pdata.blockedAt || null });
                }
            }
            return res.status(200).json({ blocked: false });
        } catch (error) {
            console.error('Error checking blocked status:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
