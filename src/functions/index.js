const functions = require("firebase-functions");
const app = require("express")(); // Initialize express app
const {
  signup,
  login,
  uploadImage,
  addUserDetails
} = require("./route_handlers/users"); // Import user route handlers
const {
  createEvent,
  getEvent,
  getAllEvents,
  register,
  unregister,
  likeEvent,
  unlikeEvent,
  cancelEvent
} = require("./route_handlers/events"); // Import event route handlers
const { auth, checkAdmin } = require("./util/authentication"); // Import authentication middleware
const fileParser = require("express-multipart-file-parser"); // Middleware which seperates json data and Images

// TODO: Verify users after signup, probably using email verification. Any other ideas are welcome too though
// User Authentication Routes
app.post("/signup", signup); // Signup to the website
app.post("/login", login); // Login to the website
app.post("/user/image", auth, uploadImage); // Upload profile image
app.post("/user", auth, addUserDetails); // Add all the other user details

// Event generation/management routes
app.post("/event/create", auth, fileParser, checkAdmin, createEvent); // Create an event
app.get("/event/:eventID", auth, getEvent); // Get event details
app.get("/events", auth, getAllEvents); // Get all events
app.delete("/event/:eventID/cancel", auth, checkAdmin, cancelEvent); // Cancel an event
app.post("/event/:eventID/register", auth, register); // Register for an event
app.post("/event/:eventID/unregister", auth, unregister); // Unregister from an event
app.get("/event/:eventID/like", auth, likeEvent); // Like an event
app.get("/event/:eventID/unlike", auth, unlikeEvent); // Unlike an event

exports.api = functions.https.onRequest(app);
