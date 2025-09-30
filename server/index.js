const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin (from env JSON or serviceAccountKey.json)
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

/**
 * GET /api/health
 * Simple health check.
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GlobeTalk backend is running!' });
});

/**
 * POST /api/profile
 * Create or update a user profile.
 * Body: { userID, intro, ageRange, hobbies, timezone, language, country }
 */
app.post('/api/profile', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID, intro, ageRange, hobbies, timezone, language, country } = req.body;

    if (!userID || !intro || !ageRange || !hobbies || !timezone || !language || !country) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await db.collection('profiles').doc(userID).set(
            { userID, intro, ageRange, hobbies, timezone, language, country },
            { merge: true }
        );

        // Ensure language exists in available_languages
        if (language && typeof language === 'string') {
            const langDocId = encodeURIComponent(language);
            try {
                const langRef = db.collection('available_languages').doc(langDocId);
                const langDoc = await langRef.get();
                if (!langDoc.exists) await langRef.set({ name: language });
            } catch (err) {
                console.error('Error adding language to available_languages:', err);
            }
        }

        // Ensure timezone exists in available_countries
        if (timezone && typeof timezone === 'string') {
            const countryDocId = encodeURIComponent(timezone);
            try {
                const countryRef = db.collection('available_countries').doc(countryDocId);
                const countryDoc = await countryRef.get();
                if (!countryDoc.exists) await countryRef.set({ name: timezone });
            } catch (err) {
                console.error('Error adding timezone to available_countries:', err);
            }
        }

        res.status(200).json({ message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/profile
 * Fetch a user profile by userID.
 * Query: ?userID=...
 */
app.get('/api/profile', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID } = req.query;
    if (!userID) return res.status(400).json({ error: 'Missing userID' });

    try {
        const doc = await db.collection('profiles').doc(userID).get();
        if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
        res.status(200).json(doc.data());
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/facts
 * Returns basic profile attributes for all users (demo facts).
 */
app.get('/api/facts', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    try {
        const snapshot = await db.collection('profiles').get();
        const facts = [];
        snapshot.forEach(doc => {
            const { ageRange, hobbies, timezone, language } = doc.data();
            facts.push({ ageRange, hobbies, timezone, language });
        });
        res.status(200).json(facts);
    } catch (error) {
        console.error('Error fetching facts:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/profile/avatar
 * Save avatar and username for a user.
 * Body: { userID, username, avatarUrl }
 */
app.post('/api/profile/avatar', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    try {
        const { userID, username, avatarUrl } = req.body;
        if (!userID || !username || !avatarUrl) {
            return res.status(400).json({ error: 'Missing required fields (userID, username, avatarUrl)' });
        }
        await db.collection('profiles').doc(userID).set({ userID, username, avatarUrl }, { merge: true });
        res.status(200).json({ message: 'Avatar and username saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/matchmaking
 * Find a random match filtered by timezone and/or language, excluding current/previous matches.
 * Query: ?timezone=..&language=..&excludeUserID=..
 */
app.get('/api/matchmaking', async (req, res) => {
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

/**
 * POST /api/match
 * Create a match and initialize a chat between two users.
 * Body: { userA, userB }
 */
app.post('/api/match', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userA, userB } = req.body;
    if (!userA || !userB) {
        return res.status(400).json({ error: 'Missing user IDs' });
    }

    try {
        const matchKey = [userA, userB].sort().join('_');

        await db.collection('matches').doc(matchKey).set({
            users: [userA, userB],
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const chatDocRef = db.collection('chats').doc(matchKey);
        await chatDocRef.set({
            chatId: matchKey,
            users: [userA, userB],
            messages: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        const userARef = db.collection('profiles').doc(userA);
        const userBRef = db.collection('profiles').doc(userB);

        await Promise.all([
            userARef.set({ chats: admin.firestore.FieldValue.arrayUnion(matchKey) }, { merge: true }),
            userBRef.set({ chats: admin.firestore.FieldValue.arrayUnion(matchKey) }, { merge: true })
        ]);

        await Promise.all([
            userARef.set({ MatchedUsers: admin.firestore.FieldValue.arrayUnion(userB) }, { merge: true }),
            userBRef.set({ MatchedUsers: admin.firestore.FieldValue.arrayUnion(userA) }, { merge: true })
        ]);

        res.status(200).json({ message: 'Match and chat created', chatId: matchKey });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/profile/edit
 * Update editable profile fields for the edit page.
 * Body: { userID, intro, ageRange, hobbies, region, languages, sayings, username, avatarUrl, country }
 */
app.post('/api/profile/edit', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID, intro, ageRange, hobbies, region, languages, sayings, username, avatarUrl, country } = req.body;
    if (!userID) return res.status(400).json({ error: 'Missing userID' });

    try {
        await db.collection('profiles').doc(userID).set(
            {
                userID,
                intro: intro || "",
                ageRange: ageRange || "",
                hobbies: hobbies || [],
                region: region || "",
                languages: languages || [],
                sayings: sayings || [],
                username: username || "",
                avatarUrl: avatarUrl || "",
                country: country || ""
            },
            { merge: true }
        );
        res.status(200).json({ message: 'Profile (edit) saved successfully' });
    } catch (error) {
        console.error('Error saving profile (edit):', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/available_languages
 * List of languages added from profiles.
 */
app.get('/api/available_languages', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    try {
        const snapshot = await db.collection('available_languages').get();
        const languages = [];
        snapshot.forEach(doc => languages.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(languages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/available_timezones
 * List of timezones/regions added from profiles.
 */
app.get('/api/available_timezones', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    try {
        const snapshot = await db.collection('available_countries').get();
        const timezones = [];
        snapshot.forEach(doc => timezones.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(timezones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/chat
 * Retrieve a chat by chatId.
 * Query: ?chatId=...
 */
app.get('/api/chat', async (req, res) => {
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

/**
 * POST /api/chat/send
 * Append a message to a chat.
 * Body: { chatId, message: { sender, text, deliveryTime } }
 */
app.post('/api/chat/send', async (req, res) => {
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

/**
 * POST /api/chat/report
 * Report a chat message for moderation.
 * Body: { chatId, message, reporter, reason? }
 */
app.post('/api/chat/report', async (req, res) => {
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

/**
 * POST /api/user/ip
 * Store a user's IP address.
 * Body: { uid, ipAddress? }
 */
app.post('/api/user/ip', async (req, res) => {
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

/**
 * GET /api/reports
 * List all reports (moderation).
 */
app.get('/api/reports', async (req, res) => {
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

/**
 * POST /api/reports/:id/validate
 * Mark a report as resolved.
 */
app.post('/api/reports/:id/validate', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { id } = req.params;
    try {
        const reportRef = db.collection('reports').doc(id);
        await reportRef.set({ status: 'resolved' }, { merge: true });
        res.status(200).json({ success: true, message: 'Report marked as valid (resolved).' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/reports/:id/invalidate
 * Mark a report as rejected.
 */
app.post('/api/reports/:id/invalidate', async (req, res) => {
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

/**
 * GET /api/matchedUsers
 * For a user, return unique timezones of matched users.
 * Query: ?userID=...
 */
app.get('/api/matchedUsers', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID } = req.query;
    if (!userID) return res.status(400).json({ error: 'Missing userID' });

    try {
        const userDoc = await db.collection('profiles').doc(userID).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User profile not found' });

        const userData = userDoc.data();
        const matchedUserIDs = (userData.chats || [])
            .map(chatId => chatId.split('_'))
            .map(([a, b]) => (a === userID ? b : a)); // get the other user in chat

        if (!matchedUserIDs.length) return res.status(200).json([]);

        const countries = [];
        for (const matchedID of matchedUserIDs) {
            if (!matchedID) continue;
            const doc = await db.collection('profiles').doc(matchedID).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.timezone) countries.push(data.timezone);
            }
        }

        const uniqueCountries = [...new Set(countries)];
        res.status(200).json(uniqueCountries);
    } catch (error) {
        console.error('Error fetching matched users:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/stats
 * Compute user stats and recent activity summary.
 * Query: ?userID=...
 */
app.get('/api/stats', async (req, res) => {
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