const functions = require("firebase-functions");
const app = require("express")(); // Initialize express app
const { db } = require("./util/init");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserHandle
} = require("./route_handlers/users"); // Import user route handlers
const {
  createEvent,
  editEvent,
  getEvent,
  getAllEvents,
  register,
  unregister,
  likeEvent,
  unlikeEvent,
  cancelEvent,
  checkLike,
} = require("./route_handlers/events"); // Import event route handlers
const { auth, checkAdmin } = require("./util/authentication"); // Import authentication middleware
const fileParser = require("express-multipart-file-parser"); // Middleware which seperates json data and Images

// TODO: Verify users after signup, probably using email verification. Any other ideas are welcome too though
// User Authentication Routes
app.post("/signup", signup); // Signup to the website
app.post("/login", login); // Login to the website
app.post("/user/image", auth, uploadImage); // Upload profile image
app.post("/user", auth, addUserDetails); // Add all the other user details
app.get("/user/profile", auth, getAuthenticatedUser);
app.get("/user/userHandle",auth, getUserHandle);

// Event generation/management routes
app.post("/event/create", auth, fileParser, checkAdmin, createEvent); // Create an event
app.post('/event/:eventID/edit',auth, fileParser, editEvent);
app.get("/event/:eventID", auth, getEvent); // Get event details
app.get("/events", auth, getAllEvents); // Get all events
app.delete("/event/:eventID/cancel", auth, checkAdmin, cancelEvent); // Cancel an event
app.post("/event/:eventID/register", auth, register); // Register for an event
app.post("/event/:eventID/unregister", auth, unregister); // Unregister from an event
app.post("/event/:eventID/like", auth, likeEvent); // Like an event
app.post("/event/:eventID/unlike", auth, unlikeEvent); // Unlike an event
app.get('/event/:eventId/checkLike', auth, checkLike)

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/events/${snapshot.data().eventID}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            eventID: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });

exports.deleteNotificationOnUnLike = functions.firestore
  .document("likes/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });
