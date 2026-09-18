const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Parses the JSON string stored in Railway's environment variables
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Uses your local file when running on your computer
  serviceAccount = require('../firebase-service-key.json');
}

// Initialize Firebase using the explicit SDK modular functions
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
module.exports = db;