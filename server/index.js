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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GlobeTalk backend is running!' });
});

// Create or update user profile
app.post('/api/profile', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID, intro, ageRange, hobbies, timezone, language } = req.body;

    console.log('Received profile POST:', req.body);

    if (!userID || !intro || !ageRange || !hobbies || !timezone || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Use merge to avoid overwriting other fields accidentally
        await db.collection('profiles').doc(userID).set(
            { userID, intro, ageRange, hobbies, timezone, language },
            { merge: true }
        );
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
// app.use('/static', express.static(path.join(__dirname, 'public')));

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`GlobeTalk backend listening on port ${PORT}`);
});