// Express.js backend setup for GlobeTalk
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin SDK setup
let serviceAccount;
try {
    require('dotenv').config();
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
        serviceAccount = require('./serviceAccountKey.json');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} catch (e) {
    console.warn('Firebase Admin SDK not initialized. serviceAccountKey.json missing or env var not set.');
}

const db = admin.apps.length ? admin.firestore() : null;

// Middleware to verify Firebase ID token from Authorization header
async function authenticateToken(req, res, next) {
    if (!admin.apps.length) return res.status(500).json({ error: 'Firebase admin not initialized' });
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const match = String(authHeader).split(' ');
    const token = match && match[0] && match[0].toLowerCase() === 'bearer' ? match[1] : match[1] || null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded; // contains uid, email, etc.
        return next();
    } catch (err) {
        console.error('Token verification failed', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GlobeTalk backend is running!' });
});

// Create or update user profile
// app.post('/api/profile', async (req, res) => {
//     if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

//     const { userID, intro, ageRange, hobbies, timezone, language } = req.body;

//     console.log('Received profile POST:', req.body);

//     if (!userID || !intro || !ageRange || !hobbies || !timezone || !language) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     try {
//         // Use merge to avoid overwriting other fields accidentally
//         await db.collection('profiles').doc(userID).set(
//             { userID, intro, ageRange, hobbies, timezone, language },
//             { merge: true }
//         );
//         res.status(200).json({ message: 'Profile saved successfully' });
//     } catch (error) {
//         console.error('Error saving profile:', error);
//         res.status(500).json({ error: error.message });
//     }
// });
// Create or update user profile (merged: creation + edit)
// Create or update user profile
app.post('/api/profile', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const data = {};
    Object.entries(req.body).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            data[key] = value;
        }
    });

    // Map commonSayings to sayings if present
    if (data.commonSayings) {
        data.sayings = data.commonSayings;
        delete data.commonSayings;
    }

    if (!data.userID) {
        return res.status(400).json({ error: 'Missing userID' });
    }
    try {
        await db.collection('profiles').doc(data.userID).set(data, { merge: true });
        res.status(200).json({ message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/profile', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID } = req.query;
    if (!userID) return res.status(400).json({ error: 'Missing userID' });

    try {
        const doc = await db.collection('profiles').doc(userID).get();
        if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });

        console.log('Fetched profile GET:', doc.data());
        res.status(200).json(doc.data());
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: error.message });
    }
});
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



// 🆕 API endpoint to save avatar + username
app.post('/api/profile/avatar', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    try {
        const { userID, username, avatarUrl } = req.body;
        if (!userID || !username || !avatarUrl) {
            return res.status(400).json({ error: 'Missing required fields (userID, username, avatarUrl)' });
        }
        await db.collection('profiles').doc(userID).set({
            userID,
            username,
            avatarUrl
        }, { merge: true }); // merge ensures we don’t overwrite intro/age/etc
        res.status(200).json({ message: 'Avatar and username saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// Serve static files (optional)

// Matchmaking endpoint: filter by timezone and language, return a random user
app.get('/api/matchmaking', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { timezone, language, excludeUserID } = req.query;
    if (!timezone || !language) {
        return res.status(400).json({ error: 'Both timezone and language are required' });
    }
    try {
        const snapshot = await db.collection('profiles').get();
        let users = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Exclude the requesting user if excludeUserID is provided
            if (excludeUserID && data.userID === excludeUserID) return;
            // Match timezone (exact text) and language (exact name)
            if (
                data.timezone === timezone &&
                ((typeof data.language === 'string' && data.language === language) ||
                    (Array.isArray(data.language) && data.language.includes(language)))
            ) {
                users.push(data);
            }
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

// Chat endpoints
// GET messages for a chat
app.get('/api/chats/:chatId/messages', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { chatId } = req.params;
    try {
        const msgsSnap = await db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt', 'asc').get();
        const messages = msgsSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                text: data.text,
                sender: data.sender,
                recipient: data.recipient,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                deliverAt: data.deliverAt ? (data.deliverAt.toDate ? data.deliverAt.toDate().toISOString() : (new Date(data.deliverAt)).toISOString()) : null,
                delayMs: data.delayMs || null,
                delayLabel: data.delayLabel || null,
                meta: data.meta || null,
            };
        });
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching chat messages', error);
        res.status(500).json({ error: error.message });
    }
});

// GET chats for a user (list chat docs where participants contains userID)
app.get('/api/chats', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { userID } = req.query;
    if (!userID) return res.status(400).json({ error: 'Missing userID' });
    try {
        const snaps = await db.collection('chats').where('participants', 'array-contains', userID).get();
        const chats = [];
        for (const doc of snaps.docs) {
            const data = doc.data() || {};
            // get last message (if any)
            let lastMessage = null;
            try {
                const msgsSnap = await db.collection('chats').doc(doc.id).collection('messages').orderBy('createdAt', 'desc').limit(1).get();
                if (!msgsSnap.empty) {
                    const m = msgsSnap.docs[0].data();
                    lastMessage = {
                        text: m.text || '',
                        sender: m.sender || null,
                        createdAt: m.createdAt ? m.createdAt.toDate().toISOString() : null,
                    };
                }
            } catch (e) {
                // ignore per-chat message read errors
            }

            chats.push({ chatId: doc.id, participants: data.participants || [], lastMessage });
        }
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error listing chats', error);
        res.status(500).json({ error: error.message });
    }
});

// POST create a message in a chat
app.post('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { chatId } = req.params;
    const { text, sender, recipient, delayMs, delayLabel } = req.body;
    if (!text || !sender || !recipient) return res.status(400).json({ error: 'Missing required fields (text, sender, recipient)' });
    // ensure the authenticated user is the sender
    if (req.user.uid !== sender) return res.status(403).json({ error: 'Sender mismatch: token uid does not match sender' });
    try {
        const messagesRef = db.collection('chats').doc(chatId).collection('messages');
        const now = new Date();
        const deliverAtDate = delayMs ? new Date(now.getTime() + Number(delayMs)) : now;
        const docRef = await messagesRef.add({
            text,
            sender,
            recipient,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            deliverAt: admin.firestore.Timestamp.fromDate(deliverAtDate),
            delayMs: delayMs || null,
            delayLabel: delayLabel || null,
            meta: { type: 'letter' },
        });
        // ensure chat participants set
        await db.collection('chats').doc(chatId).set({ participants: [sender, recipient] }, { merge: true });
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        console.error('Error creating chat message', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE all messages in a chat (used by reseed)
app.delete('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { chatId } = req.params;
    try {
        const msgsSnap = await db.collection('chats').doc(chatId).collection('messages').get();
        const deletes = [];
        msgsSnap.forEach(d => deletes.push(d.ref.delete()));
        await Promise.all(deletes);
        res.status(200).json({ deleted: deletes.length });
    } catch (error) {
        console.error('Error deleting messages', error);
        res.status(500).json({ error: error.message });
    }
});

// POST seed messages for a chat with canonical demo users
app.post('/api/chats/:chatId/seed', authenticateToken, async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { chatId } = req.params;
    // Seed with demo profiles (profiles collection IDs)
    const USER_A = 'vAVstGYbfsh8HL0GtAQSqt1GSvJ2';
    const USER_B = 'YEYbsnLkxKOg7LgLpg1W5nQuFdr1';
    try {
        // delete existing
        const msgsRef = db.collection('chats').doc(chatId).collection('messages');
        const snaps = await msgsRef.get();
        const deletes = [];
        snaps.forEach(d => deletes.push(d.ref.delete()));
        await Promise.all(deletes);

        // add seed messages
        await msgsRef.add({
            text: "Hello! I'm excited to be your pen pal. I'm from Tokyo and I love learning about different cultures. What's your favorite local tradition?",
            sender: USER_B,
            recipient: USER_A,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            deliverAt: admin.firestore.Timestamp.fromDate(new Date()),
            delayMs: 12 * 60 * 60 * 1000,
            delayLabel: '12 hr',
            meta: { type: 'letter' },
        });

        await msgsRef.add({
            text: "Hi there! It's wonderful to meet you. I'm from San Francisco, and one of my favorite traditions is our Chinese New Year parade. The dragon dances are absolutely magical! What about you?",
            sender: USER_A,
            recipient: USER_B,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            deliverAt: admin.firestore.Timestamp.fromDate(new Date()),
            delayMs: 12 * 60 * 60 * 1000,
            delayLabel: '12 hr',
            meta: { type: 'letter' },
        });

        // ensure participants set
        await db.collection('chats').doc(chatId).set({ participants: [USER_A, USER_B] }, { merge: true });

        res.status(200).json({ seeded: true });
    } catch (error) {
        console.error('Error seeding chat messages', error);
        res.status(500).json({ error: error.message });
    }
});

// POST seed demo profiles into `profiles` collection (protected)
app.post('/api/profiles/seed-demo', authenticateToken, async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    // demo profile IDs requested
    const USER_A = 'vAVstGYbfsh8HL0GtAQSqt1GSvJ2';
    const USER_B = 'YEYbsnLkxKOg7LgLpg1W5nQuFdr1';
    try {
        const profilesRef = db.collection('profiles');
        // Example profile data based on screenshot/expected shape
        const profileA = {
            userID: USER_A,
            username: 'penpal_tokyo',
            intro: "Hi! I'm from Tokyo and I love learning about different cultures.",
            ageRange: '25-34',
            language: 'Japanese',
            timezone: '(UTC+09:00) Osaka, Sapporo, Tokyo',
            hobbies: ['travel', 'photography'],
            avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=tokyo&top=dreads02'
        };

        const profileB = {
            userID: USER_B,
            username: 'lazyfrog685',
            intro: 'sdf',
            ageRange: '18-24',
            language: 'Xhosa',
            timezone: '(UTC+02:00) Harare, Pretoria, Johannesburg',
            hobbies: ['sad', 'fas'],
            avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=k9a8tusa&top=dreads02'
        };

        await profilesRef.doc(USER_A).set(profileA, { merge: true });
        await profilesRef.doc(USER_B).set(profileB, { merge: true });

        res.status(200).json({ seeded: [USER_A, USER_B] });
    } catch (error) {
        console.error('Error seeding profiles', error);
        res.status(500).json({ error: error.message });
    }
});
// app.use('/static', express.static(path.join(__dirname, 'public')));



//api for edit page specifically
// app.post('/api/profile/edit', async (req, res) => {
//     if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

//     const { userID, intro, ageRange, hobbies, region, languages, sayings, username, avatarUrl } = req.body;

//     if (!userID) {
//         return res.status(400).json({ error: 'Missing userID' });
//     }

//     try {
//         await db.collection('profiles').doc(userID).set(
//             {
//                 userID,
//                 intro: intro || "",
//                 ageRange: ageRange || "",
//                 hobbies: hobbies || [],
//                 region: region || "",
//                 languages: languages || [],
//                 sayings: sayings || [],
//                 username: username || "",
//                 avatarUrl: avatarUrl || ""
//             },
//             { merge: true }
//         );
//         res.status(200).json({ message: 'Profile (edit) saved successfully' });
//     } catch (error) {
//         console.error('Error saving profile (edit):', error);
//         res.status(500).json({ error: error.message });
//     }
// });


// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`GlobeTalk backend listening on port ${PORT}`);
    });
}
/*
app.listen(PORT, () => {
    console.log(`GlobeTalk backend listening on port ${PORT}`);
});*/

module.exports = app;