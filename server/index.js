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
				// Support both Railway (env var) and local dev (file)
				try {
					// For local dev, load .env
					require('dotenv').config();
					if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
						serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
					} else {
						serviceAccount = require('./serviceAccountKey.json');
					}
					admin.initializeApp({
						credential: admin.credential.cert(serviceAccount)
					});
				} catch (e) {
					console.warn('Firebase Admin SDK not initialized. serviceAccountKey.json missing or env var not set.');
}
const db = admin.apps.length ? admin.firestore() : null;

// Example API route
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', message: 'GlobeTalk backend is running!' });
});

// API endpoint to receive and store user profile data
app.post('/api/profile', async (req, res) => {
	if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
	try {
		const { userID, intro, ageRange, hobbies, timezone } = req.body;
		if (!userID || !intro || !ageRange || !hobbies || !timezone) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		await db.collection('profiles').doc(userID).set({
			userID,
			intro,
			ageRange,
			hobbies,
			timezone
		});
		res.status(200).json({ message: 'Profile saved successfully' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// API endpoint to get a user's profile
app.get('/api/profile', async (req, res) => {
	if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
	const { userID } = req.query;
	if (!userID) return res.status(400).json({ error: 'Missing userID' });
	try {
		const doc = await db.collection('profiles').doc(userID).get();
		if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
		res.status(200).json(doc.data());
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// API endpoint to get anonymous facts about other users
app.get('/api/facts', async (req, res) => {
	if (!db) return res.status(500).json({ error: 'Firestore not initialized' });
	try {
		const snapshot = await db.collection('profiles').get();
		const facts = [];
		snapshot.forEach(doc => {
			const { ageRange, hobbies, timezone } = doc.data();
			facts.push({ ageRange, hobbies, timezone });
		});
		res.status(200).json(facts);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Serve static files (optional, e.g., for images or uploads)
// app.use('/static', express.static(path.join(__dirname, 'public')));

// Catch-all for undefined routes
app.use((req, res) => {
	res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
	console.log(`GlobeTalk backend listening on port ${PORT}`);
});
