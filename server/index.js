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

        // Firestore creates collections automatically when a document is added.
        // Always attempt to add language and timezone if not present.
        if (language && typeof language === 'string') {
            const langDocId = encodeURIComponent(language);
            try {
                const langRef = db.collection('available_languages').doc(langDocId);
                const langDoc = await langRef.get();
                if (!langDoc.exists) {
                    await langRef.set({ name: language });
                }
            } catch (err) {
                // If collection does not exist, Firestore will create it on set()
                console.error('Error adding language to available_languages:', err);
            }
        }

        if (timezone && typeof timezone === 'string') {
            const countryDocId = encodeURIComponent(timezone);
            try {
                const countryRef = db.collection('available_countries').doc(countryDocId);
                const countryDoc = await countryRef.get();
                if (!countryDoc.exists) {
                    await countryRef.set({ name: timezone });
                }
            } catch (err) {
                // If collection does not exist, Firestore will create it on set()
                console.error('Error adding timezone to available_countries:', err);
            }
        }

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
    if (!timezone && !language) {
        return res.status(400).json({ error: 'At least one of timezone or language is required' });
    }
    try {
        // Get all users the current user has already matched with
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
            // Exclude the requesting user if excludeUserID is provided
            if (excludeUserID && data.userID === excludeUserID) return;
            // Exclude users already matched with this user
            if (excludeUserID && matchedUserIDs.has(data.userID)) return;
            // Prevent matching with self (even if excludeUserID is not set)
            if (excludeUserID && data.userID && data.userID === excludeUserID) return;
            // Flexible matching: filter by whichever criteria are provided
            let timezoneMatch = true;
            let languageMatch = true;
            if (timezone) {
                timezoneMatch = data.timezone === timezone;
            }
            if (language) {
                languageMatch = (typeof data.language === 'string' && data.language === language) ||
                    (Array.isArray(data.language) && data.language.includes(language));
            }
            if (timezoneMatch && languageMatch) {
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

// Create a match only after user clicks 'Proceed to chat'
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
        res.status(200).json({ message: 'Match created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// app.use('/static', express.static(path.join(__dirname, 'public')));



//api for edit page specifically
app.post('/api/profile/edit', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID, intro, ageRange, hobbies, region, languages, sayings, username, avatarUrl } = req.body;

    if (!userID) {
        return res.status(400).json({ error: 'Missing userID' });
    }

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
                avatarUrl: avatarUrl || ""
            },
            { merge: true }
        );
        res.status(200).json({ message: 'Profile (edit) saved successfully' });
    } catch (error) {
        console.error('Error saving profile (edit):', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available languages
app.get('/api/available_languages', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    try {
        const snapshot = await db.collection('available_languages').get();
        const languages = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            languages.push({ id: doc.id, ...data });
        });
        res.status(200).json(languages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available timezones (countries/regions)
app.get('/api/available_timezones', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    try {
        const snapshot = await db.collection('available_countries').get();
        const timezones = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            timezones.push({ id: doc.id, ...data });
        });
        res.status(200).json(timezones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


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