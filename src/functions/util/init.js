//jshint esversion:6
const firebase = require('firebase');
const firestore = require('firebase/firestore');
const admin = require('firebase-admin');

// Firebase project configuration
var firebaseConfig = {
    apiKey: "AIzaSyC6mswSdP3jvm9ErZa3TzCGIxrJzGb8exU",
    authDomain: "sem5proj-19434.firebaseapp.com",
    databaseURL: "https://sem5proj-19434.firebaseio.com",
    projectId: "sem5proj-19434",
    storageBucket: "",
    messagingSenderId: "182023481926",
    appId: "1:182023481926:web:e6ec907fea930bb9a2b847"
  };
// Initializing Firebase and Firestore
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();

// Initializing admin
admin.initializeApp();

module.exports = {admin, db};
