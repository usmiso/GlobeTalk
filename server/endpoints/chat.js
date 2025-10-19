// Chat endpoints: fetch chat threads, append messages, and report messages for moderation.
const express = require('express');

module.exports = ({ db, admin }) => {
    const router = express.Router();

    // Retrieve a chat by chatId
    router.get('/chat', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const { chatId } = req.query;
        if (!chatId) return res.status(400).json({ error: 'Missing chatId' });

        try {
            const doc = await db.collection('chats').doc(chatId).get();
            if (!doc.exists) return res.status(404).json({ error: 'Chat not found' });
            res.status(200).json(doc.data());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Append a message to a chat
    router.post('/chat/send', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const { chatId, message } = req.body;
        if (!chatId || !message || !message.sender || !message.text || !message.deliveryTime) {
            return res.status(400).json({ error: 'Missing required fields (chatId, message)' });
        }

        try {
            const chatRef = db.collection('chats').doc(chatId);
            await chatRef.update({
                messages: admin.firestore.FieldValue.arrayUnion(message)
            });
            res.status(200).json({ message: 'Message sent successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Report a chat message for moderation
    router.post('/chat/report', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const { chatId, message, reporter, reason } = req.body;
        if (!chatId || !message || !reporter) {
            return res.status(400).json({ error: 'Missing required fields (chatId, message, reporter)' });
        }

        try {
            const reportDoc = {
                chatId,
                message,
                reporter,
                reason: reason || '',
                reportedAt: Date.now()
            };
            await db.collection('reports').add(reportDoc);
            res.status(200).json({ message: 'Report submitted successfully' });
        } catch (error) {
            console.error('[REPORT] Error saving report:', error);
            res.status(500).json({ error: error.message, stack: error.stack });
        }
    });

    return router;
};
