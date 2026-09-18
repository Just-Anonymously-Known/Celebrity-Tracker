const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../firebase-service-key.json');

// Initialize Firebase using the explicit SDK modular functions
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
module.exports = db;