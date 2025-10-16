// Stats endpoint: aggregate lightweight user activity metrics from chat data.
const express = require('express');

module.exports = ({ db }) => {
    const router = express.Router();

    // Compute user stats and recent activity summary
    router.get('/stats', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const { userID } = req.query;
        if (!userID) return res.status(400).json({ error: 'Missing userID' });

        try {
            const chatsSnap = await db.collection('chats').where('users', 'array-contains', userID).get();

            let totalLetters = 0;
            let countries = new Set();
            let activity = [];
            let responseTimes = [];

            for (const chatDoc of chatsSnap.docs) {
                const data = chatDoc.data();

                if (Array.isArray(data.messages)) {
                    const sortedMessages = [...data.messages].sort((a, b) => a.deliveryTime - b.deliveryTime);

                    // Approximate response time: measure time from a partner's message to user's next message
                    for (let i = 0; i < sortedMessages.length - 1; i++) {
                        const current = sortedMessages[i];
                        const next = sortedMessages[i + 1];
                        if (current.sender !== userID && next.sender === userID) {
                            const diff = next.deliveryTime - current.deliveryTime;
                            if (diff > 0) responseTimes.push(diff);
                        }
                    }

                    sortedMessages.forEach(m => {
                        if (m.sender === userID) totalLetters++;
                        activity.push({
                            type: m.sender === userID ? "sent" : "received",
                            text: m.text,
                            sender: m.sender,
                            timestamp: m.deliveryTime,
                        });
                    });
                }

                if (data.users) {
                    const otherUserId = data.users.find(u => u !== userID);
                    if (otherUserId) {
                        countries.add(otherUserId);
                        const otherUserDoc = await db.collection("profiles").doc(otherUserId).get();
                        activity.push({
                            type: "match",
                            users: [userID, otherUserId],
                            otherUsername: otherUserDoc.exists ? otherUserDoc.data().username : otherUserId,
                            timestamp: data.createdAt?.toMillis() || Date.now(),
                        });
                    }
                }
            }

            let avgResponse = "N/A";
            if (responseTimes.length > 0) {
                const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
                const avgHours = avgMs / (1000 * 60 * 60);
                avgResponse = avgHours < 24 ? `${avgHours.toFixed(1)} hours` : `${(avgHours / 24).toFixed(1)} days`;
            }

            const activePenPals = countries.size;

            res.status(200).json({
                totalLetters,
                activePenPals,
                countriesConnected: countries.size,
                averageResponseTime: avgResponse,
                lettersThisMonth: totalLetters,
                favoriteLetters: 0,
                activity: activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
