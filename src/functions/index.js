//jshint esversion:6
// const firebase = require('firebase');
const functions = require('firebase-functions');
const app = require('express')();  // Initialize express app
// const { db } = require('./util/init');
const { signup, login } = require('./route_handlers/users');

app.post('/signup', signup);
app.post('/login', login);

exports.api = functions.https.onRequest(app);
