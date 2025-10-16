// Matchmaking endpoints: find a random compatible user and create match/chat records.
const express = require('express');

module.exports = ({ db }) => {
    const router = express.Router();

    // Find a random match filtered by timezone and/or language, excluding current/previous matches.
    router.get('/matchmaking', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const { timezone, language, excludeUserID } = req.query;
        if (!timezone && !language) {
            return res.status(400).json({ error: 'At least one of timezone or language is required' });
        }

        try {
            let matchedUserIDs = new Set();
            if (excludeUserID) {
                const matchesSnapshot = await db.collection('matches')
                    .where('users', 'array-contains', excludeUserID).get();
                matchesSnapshot.forEach(doc => {
                    const usersArr = doc.data().users;
                    usersArr.forEach(uid => {
                        if (uid !== excludeUserID) matchedUserIDs.add(uid);
                    });
                });
            }

            // Naive scan of all profiles with in-memory filtering.
            // For large datasets, replace with indexed Firestore queries.
            const snapshot = await db.collection('profiles').get();
            let users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (excludeUserID && data.userID === excludeUserID) return;
                if (excludeUserID && matchedUserIDs.has(data.userID)) return;

                let timezoneMatch = true;
                let languageMatch = true;
                if (timezone) {
                    timezoneMatch = data.timezone === timezone;
                }
                if (language) {
                    languageMatch =
                        (typeof data.language === 'string' && data.language === language) ||
                        (Array.isArray(data.language) && data.language.includes(language));
                }
                if (timezoneMatch && languageMatch) users.push(data);
            });

            if (users.length === 0) {
                return res.status(404).json({ error: 'No users found for the given filters' });
            }
            const randomIndex = Math.floor(Math.random() * users.length);
            const matchedUser = users[randomIndex];
            res.status(200).json(matchedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Create a match and initialize a chat between two users.
    router.post('/match', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const { userA, userB } = req.body;
        if (!userA || !userB) {
            return res.status(400).json({ error: 'Missing user IDs' });
        }

        try {
            const matchKey = [userA, userB].sort().join('_');

            await db.collection('matches').doc(matchKey).set({
                users: [userA, userB],
                timestamp: require('firebase-admin').firestore.FieldValue.serverTimestamp()
            });

            const chatDocRef = db.collection('chats').doc(matchKey);
            await chatDocRef.set({
                chatId: matchKey,
                users: [userA, userB],
                messages: [],
                createdAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            const userARef = db.collection('profiles').doc(userA);
            const userBRef = db.collection('profiles').doc(userB);

            await Promise.all([
                userARef.set({ chats: require('firebase-admin').firestore.FieldValue.arrayUnion(matchKey) }, { merge: true }),
                userBRef.set({ chats: require('firebase-admin').firestore.FieldValue.arrayUnion(matchKey) }, { merge: true })
            ]);

            await Promise.all([
                userARef.set({ MatchedUsers: require('firebase-admin').firestore.FieldValue.arrayUnion(userB) }, { merge: true }),
                userBRef.set({ MatchedUsers: require('firebase-admin').firestore.FieldValue.arrayUnion(userA) }, { merge: true })
            ]);

            res.status(200).json({ message: 'Match and chat created', chatId: matchKey });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
