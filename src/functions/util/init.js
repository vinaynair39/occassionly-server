//jshint esversion:6
const dotenv= require('dotenv').config();
const firebase = require('firebase');
const firestore = require('firebase/firestore');
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Firebase project configuration
var firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DB_URL,
    projectId: `${process.env.PROJECT_ID}`,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
  };
// Initializing Firebase and Firestore
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();

// Initializing admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET
});

module.exports = {admin, db};
