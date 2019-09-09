const functions = require('firebase-functions');
const app = require('express')(); // Initialize express app
const {
    signup,
    login,
    uploadImage
} = require('./route_handlers/users'); // Import route handlers
const {
    createEvent
} = require('./route_handlers/events');
const {
    auth
} = require('./util/authentication'); // Import authentication middleware

// User Authentication Routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', auth, uploadImage);

// Event generation routes
app.post('/event/create', auth, createEvent);
// TODO: Create route for event registration and unregister

exports.api = functions.https.onRequest(app);