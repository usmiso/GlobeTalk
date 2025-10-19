// Profile endpoints: create/update profiles, fetch profile data, and expose reference data lists.
const express = require('express');

module.exports = ({ db, admin }) => {
    const router = express.Router();

    // Create or update a user profile
    router.post('/profile', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const {
            userID,
            intro,
            ageRange,
            hobbies,
            timezone,
            language,
            country,
            favorites,
            facts,
            sayings,
            username,
            avatarUrl,
            countryCode,
            languageCode,
        } = req.body;

        if (!userID || !intro || !ageRange || !hobbies || !timezone || !language || !country) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            const update = {
                userID,
                intro,
                ageRange,
                hobbies,
                timezone,
                language,
                country,
            };

            if (typeof favorites !== 'undefined') update.favorites = favorites;
            if (typeof facts !== 'undefined') update.facts = facts;
            if (typeof sayings !== 'undefined') update.sayings = sayings;
            if (typeof username !== 'undefined') update.username = username;
            if (typeof avatarUrl !== 'undefined') update.avatarUrl = avatarUrl;
            if (typeof countryCode !== 'undefined') update.countryCode = countryCode;
            if (typeof languageCode !== 'undefined') update.languageCode = languageCode;

            await db.collection('profiles').doc(userID).set(update, { merge: true });

            // Ensure language exists in available_languages (used for filters in UI)
            try {
                const addLanguage = async (lang) => {
                    if (!lang || typeof lang !== 'string') return;
                    const langDocId = encodeURIComponent(lang);
                    const langRef = db.collection('available_languages').doc(langDocId);
                    const langDoc = await langRef.get();
                    if (!langDoc.exists) await langRef.set({ name: lang });
                };
                if (Array.isArray(language)) {
                    for (const lang of language) {
                        await addLanguage(lang);
                    }
                } else if (typeof language === 'string') {
                    await addLanguage(language);
                }
            } catch (err) {
                console.error('Error adding language(s) to available_languages:', err);
            }

            // Ensure timezone exists in available_countries (kept for backwards naming compat)
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

    // Fetch a user profile by userID
    router.get('/profile', async (req, res) => {
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

    // Returns basic profile attributes for all users (demo facts)
    router.get('/facts', async (req, res) => {
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

    // Save avatar and username for a user
    router.post('/profile/avatar', async (req, res) => {
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

    // Update editable profile fields for the edit page (non-destructive merge)
    router.post('/profile/edit', async (req, res) => {
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

    // List of languages added from profiles (drives UI selectors)
    router.get('/available_languages', async (req, res) => {
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

    // List of timezones/regions added from profiles
    router.get('/available_timezones', async (req, res) => {
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

    // For a user, return unique timezones of matched users
    router.get('/matchedUsers', async (req, res) => {
        if (!db) return res.status(500).json({ error: 'Firestore not initialized' });

        const { userID } = req.query;
        if (!userID) return res.status(400).json({ error: 'Missing userID' });

        try {
            const userDoc = await db.collection('profiles').doc(userID).get();
            if (!userDoc.exists) return res.status(404).json({ error: 'User profile not found' });

            const userData = userDoc.data();
            const matchedUserIDs = (userData.chats || [])
                .map(chatId => chatId.split('_'))
                .map(([a, b]) => (a === userID ? b : a));

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

    return router;
};
