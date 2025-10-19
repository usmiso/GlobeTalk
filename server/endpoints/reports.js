// Reports endpoints: list reports, validate (resolve) or invalidate (reject) moderation reports.
const express = require('express');

module.exports = ({ db, admin }) => {
    const router = express.Router();

    // List all reports (moderation)
    router.get('/reports', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
        try {
            const snapshot = await db.collection('reports').get();
            const reports = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                reports.push({ ...data, id: doc.id, _id: doc.id });
            });
            res.status(200).json({ success: true, data: reports });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Mark a report as resolved and record violation on user profile
    router.post('/reports/:id/validate', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
        const { id } = req.params;
        try {
            const reportRef = db.collection('reports').doc(id);
            const reportSnap = await reportRef.get();
            if (!reportSnap.exists) {
                return res.status(404).json({ success: false, error: 'Report not found' });
            }

            const reportData = reportSnap.data();

            // Mark report as resolved first
            await reportRef.set({ status: 'resolved', validatedAt: Date.now() }, { merge: true });

            // Determine reported user (sender of offending message or explicit reportedUserId)
            const reportedUserId = (reportData.message && reportData.message.sender) || reportData.reportedUserId;
            if (reportedUserId) {
                try {
                    const profileRef = db.collection('profiles').doc(reportedUserId);
                    const violationEntry = {
                        reportId: id,
                        reason: reportData.reason || '',
                        chatId: reportData.chatId || null,
                        messageText: reportData.message && reportData.message.text ? String(reportData.message.text).slice(0,500) : '',
                        reporter: reportData.reporter || null,
                        reportedAt: reportData.reportedAt || null,
                        validatedAt: Date.now()
                    };
                    await profileRef.set({
                        userID: reportedUserId,
                        violationCount: require('firebase-admin').firestore.FieldValue.increment(1),
                        violations: require('firebase-admin').firestore.FieldValue.arrayUnion(violationEntry)
                    }, { merge: true });
                } catch (profileErr) {
                    console.error('Error updating reported user profile with violation:', profileErr);
                }
            }

            res.status(200).json({ success: true, message: 'Report marked as valid (resolved) and violation recorded.' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Mark a report as rejected
    router.post('/reports/:id/invalidate', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
        const { id } = req.params;
        try {
            const reportRef = db.collection('reports').doc(id);
            await reportRef.set({ status: 'rejected' }, { merge: true });
            res.status(200).json({ success: true, message: 'Report marked as invalid (rejected).' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
