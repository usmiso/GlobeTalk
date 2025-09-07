// Standalone script to seed demo profiles into Firestore using Admin SDK
// Usage: node scripts/seedProfiles.js

const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  try {
    serviceAccount = require('../serviceAccountKey.json');
  } catch (e) {
    console.error('serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT_JSON not set');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  const USER_A = 'vAVstGYbfsh8HL0GtAQSqt1GSvJ2';
  const USER_B = 'YEYbsnLkxKOg7LgLpg1W5nQuFdr1';

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

  try {
    await db.collection('profiles').doc(USER_A).set(profileA, { merge: true });
    await db.collection('profiles').doc(USER_B).set(profileB, { merge: true });
    console.log('Seeded profiles:', USER_A, USER_B);
    process.exit(0);
  } catch (err) {
    console.error('Failed seeding profiles', err);
    process.exit(2);
  }
}

seed();
