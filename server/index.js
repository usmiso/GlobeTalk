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

    const { userID, intro, ageRange, hobbies, timezone, language, country } = req.body;

    console.log('Received profile POST:', req.body);

    if (!userID || !intro || !ageRange || !hobbies || !timezone || !language || !country) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Use merge to avoid overwriting other fields accidentally
        await db.collection('profiles').doc(userID).set(
            { userID, intro, ageRange, hobbies, timezone, language, country },
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
        // 1. Create match document
        await db.collection('matches').doc(matchKey).set({
            users: [userA, userB],
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Create chat document with chatId = matchKey
        const chatDocRef = db.collection('chats').doc(matchKey);
        await chatDocRef.set({
            chatId: matchKey,
            users: [userA, userB],
            messages: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 3. Add chatId to both user profiles' chats array (create if not exists)
        const userARef = db.collection('profiles').doc(userA);
        const userBRef = db.collection('profiles').doc(userB);

        // Use arrayUnion to avoid duplicates
        await Promise.all([
            userARef.set({ chats: admin.firestore.FieldValue.arrayUnion(matchKey) }, { merge: true }),
            userBRef.set({ chats: admin.firestore.FieldValue.arrayUnion(matchKey) }, { merge: true })
        ]);

        res.status(200).json({ message: 'Match and chat created', chatId: matchKey });
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


// Get a chat by chatId
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


// Add a message to a chat
app.post('/api/chat/send', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
    const { chatId, message } = req.body;
    if (!chatId || !message || !message.sender || !message.text || !message.deliveryTime) {
        return res.status(400).json({ error: 'Missing required fields (chatId, message)' });
    }
    try {
        const chatRef = db.collection('chats').doc(chatId);
        // Use arrayUnion to append the message
        await chatRef.update({
            messages: admin.firestore.FieldValue.arrayUnion(message)
        });
        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Report a message in a chat
app.post('/api/chat/report', async (req, res) => {
    if (!db) {
        console.error('[REPORT] Firestore not initialized');
        return res.status(500).json({ error: 'Firestore not initialized' });
    }
    const { chatId, message, reporter, reason } = req.body;
    console.log('[REPORT] Incoming report:', { chatId, message, reporter, reason });
    if (!chatId || !message || !reporter) {
        console.warn('[REPORT] Missing required fields', { chatId, message, reporter });
        return res.status(400).json({ error: 'Missing required fields (chatId, message, reporter)' });
    }
    try {
        // Compose report document
        const reportDoc = {
            chatId,
            message,
            reporter,
            reason: reason || '',
            reportedAt: Date.now()
        };
        await db.collection('reports').add(reportDoc);
        console.log('[REPORT] Report saved to reports collection.');
        res.status(200).json({ message: 'Report submitted successfully' });
    } catch (error) {
        console.error('[REPORT] Error saving report:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Simple API to just receive and store IP address for a user
app.post('/api/user/ip', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    try {
        const { uid, ipAddress } = req.body;

        if (!uid) {
            return res.status(400).json({ error: 'Missing user ID' });
        }

        console.log('Storing IP address for user:', { uid, ipAddress });

        // Safely add IP address to the user's profile without affecting other fields
        await db.collection('users').doc(uid).set({
            ipAddress: ipAddress || 'unknown',
            //lastLogin: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true }); // merge: true preserves all existing fields

        res.status(200).json({ message: 'IP address stored successfully' });
    } catch (error) {
        console.error('Error storing IP address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get countries/timezones for matched users
app.get('/api/matchedUsers', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID } = req.query;
    if (!userID) return res.status(400).json({ error: 'Missing userID' });

    console.log("Received request for matched users with userID:", userID);

    try {
        // 1️⃣ Get current user profile
        const userDoc = await db.collection('profiles').doc(userID).get();
        if (!userDoc.exists) {
            console.log("User profile not found for:", userID);
            return res.status(404).json({ error: 'User profile not found' });
        }

        const userData = userDoc.data();
        const matchedUserIDs = userData.MatchedUsers || [];
        console.log("Matched user IDs:", matchedUserIDs);

        if (!matchedUserIDs.length) {
            console.log("No matched users for this user.");
            return res.status(200).json([]);
        }

        // 2️⃣ Fetch profiles of matched users and extract timezone (location/country)
        const countries = [];
        for (const matchedID of matchedUserIDs) {
            const doc = await db.collection('profiles').doc(matchedID).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.timezone) countries.push(data.timezone);
            }
        }

        // Remove duplicates
        const uniqueCountries = [...new Set(countries)];
        console.log("Countries/timezones for matched users:", uniqueCountries);

        res.status(200).json(uniqueCountries);

    } catch (error) {
        console.error('Error fetching matched users:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get user stats + recent activity
app.get('/api/stats', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

    const { userID } = req.query;
    if (!userID) return res.status(400).json({ error: 'Missing userID' });

    try {
        const chatsSnap = await db.collection('chats')
            .where('users', 'array-contains', userID).get();


        let totalLetters = 0;
        let countries = new Set();
        let activity = [];
        let responseTimes = [];

        for (const chatDoc of chatsSnap.docs) {
            const data = chatDoc.data();

            if (Array.isArray(data.messages)) {
                //  Sort messages by time
                const sortedMessages = [...data.messages].sort((a, b) => a.deliveryTime - b.deliveryTime);

                for (let i = 0; i < sortedMessages.length - 1; i++) {
                    const current = sortedMessages[i];
                    const next = sortedMessages[i + 1];

                    if (current.sender !== userID && next.sender === userID) {
                        const diff = next.deliveryTime - current.deliveryTime;
                        if (diff > 0) responseTimes.push(diff);
                    }
                }

                // Count + log activity
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

            // Track matches
            if (data.users) {
                const otherUserId = data.users.find(u => u !== userID);
                if (otherUserId) {
                    countries.add(otherUserId);

                    // Fetch username for other user
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
            avgResponse = avgHours < 24
                ? `${avgHours.toFixed(1)} hours`
                : `${(avgHours / 24).toFixed(1)} days`;
        }

        // Count active pen pals
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