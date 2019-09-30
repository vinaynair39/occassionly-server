const { db, admin, firebaseConfig} = require("../util/init");
const { validateEventData } = require("../util/validators");
const uuid = require('uuid');
// Create an event
exports.createEvent = (req, res) => {

  //imports required for image upload
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  let newEvent;
  let imageToBeUploaded = {};
  let imageFileName;
  let newBlog = {};

  const {
    fieldname,
    originalname,
    encoding,
    mimetype,
    buffer,
  } = req.files[0]

  if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
    return res.status(400).json({ error: 'Wrong file type submitted' });
  }

  //computing a new name for the image
  const imageExtension = originalname.split('.')[originalname.split('.').length - 1];
  imageFileName = `${uuid()}.${imageExtension}`;
  const filepath = path.join(os.tmpdir(), imageFileName);
  imageToBeUploaded = { filepath, mimetype };
  fs.writeFile(filepath, buffer, (err) => {
  if(!err) console.log('Data written');
  });
  admin
    .storage()
    .bucket()
    .upload(imageToBeUploaded.filepath, {
      resumable: false,
      metadata: {
        metadata: {
          contentType: imageToBeUploaded.mimetype
        }
      }
  }).then(() => {
        imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
        firebaseConfig.storageBucket
        }/o/${imageFileName}?alt=media`;
        newEvent = {
          eventName: req.body.eventName,
          description: req.body.description,
          location: req.body.location,
          userHandle: req.user.handle,
          tags: req.body.tags,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          time: req.body.time,
          fee: req.body.fee,
          imageUrl: imageUrl,
          createdAt: new Date().toISOString(),
          members: {} // Temporary, will change this later to accomodate actual users that register for the event
        };
          // Validating incoming form data
        const { valid, errors } = validateEventData(newEvent);
        if (!valid) return res.status(400).json(errors);
        return db.collection("events")
          .where("location", "==", newEvent.location)
          .where("date", "==", newEvent.date)
          .where("time", "==", newEvent.time)
          .get();
        }).then(doc => {
          if (doc.exists) {
            return res.status(400).json({
              error: "Event already exists"
            });
          } else {
            return db.collection("events").add(newEvent);
          }
        })
        .then(doc => {
          return res.json({
            ...newEvent,
            id: doc.id
            });
          })
        .catch(err => {
          console.error(err);
          return res.status(500).json({
            error: err.code
          });
        });
    };



// Get event details
exports.getEvent = (req, res) => {
  db.doc(`/events/${req.params.eventID}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Event does not exist" });
      } else {
        return res.json(doc.data());
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getAllEvents = (req, res) => {
  db.collection("events")
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => {
      let events = [];
      snapshot.docs.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return res.send(events);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Register user for an event
exports.register = (req, res) => {
  // If the user has not entered the required details, they cannot register for events
  if (!req.user.addedDetails)
    return res.status(403).json({
      error:
        "User must add required details to the profile before registering for any event"
    });

  // Add user handle to the members object
  db.doc(`/events/${req.params.eventID}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Event does not exist" });
      } else {
        let members = doc.data().members;
        if (members[req.user.handle]) {
          return res
            .status(400)
            .json({ error: "Already registered for this event" });
        } else {
          members[req.user.handle] = req.user.handle;
          return db.doc(`/events/${req.params.eventID}`).update({ members });
        }
      }
    })
    .then(() => {
      return res.json({ message: "Registered successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Unregister user from an event
exports.unregister = (req, res) => {
  // Deletes user handle from the members object
  db.doc(`/events/${req.params.eventID}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Event does not exist" });
      } else {
        let members = doc.data().members;
        if (!members[req.user.handle]) {
          return res
            .status(400)
            .json({ error: "User is not registered for this event" });
        } else {
          delete members[req.user.handle];
          return db.doc(`/events/${req.params.eventID}`).update({ members });
        }
      }
    })
    .then(() => {
      return res.json({ message: "Unregistered from event successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// TODO: Make route handler to like event
// TODO: Make route handler to unlike event
