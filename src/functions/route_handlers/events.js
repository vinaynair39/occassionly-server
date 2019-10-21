const { db, admin, firebaseConfig } = require("../util/init");
const { validateEventData } = require("../util/validators");
const uuid = require("uuid");

// Create an event
exports.createEvent = (req, res) => {
  // Imports required for image upload
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  let newEvent;
  let imageToBeUploaded = {};
  let imageFileName;

  const { fieldname, originalname, encoding, mimetype, buffer } = req.files[0];

  if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
    return res.status(400).json({ error: "Wrong file type submitted" });
  }

  // Computing a new name for the image
  const imageExtension = originalname.split(".")[
    originalname.split(".").length - 1
  ];
  imageFileName = `${uuid()}.${imageExtension}`;
  const filepath = path.join(os.tmpdir(), imageFileName);
  imageToBeUploaded = { filepath, mimetype };
  fs.writeFile(filepath, buffer, err => {
    if (!err) console.log("Data written");
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
    })
    .then(() => {
      let imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
      newEvent = {
        eventName: req.body.eventName,
        description: req.body.description,
        location: req.body.location,
        userHandle: req.user.handle,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        fee: req.body.fee,
        imageUrl: imageUrl,
        userImageUrl: req.user.userImage,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        members: {} // Temporary, will change this later to accomodate actual users that register for the event
      };
      // Validating incoming form data
      const { valid, errors } = validateEventData(newEvent);
      if (!valid) return res.status(400).json(errors);
      return db
        .collection("events")
        .where("location", "==", newEvent.location)
        .where("date", "==", newEvent.startDate)
        .where("time", "==", newEvent.startTime)
        .get();
    })
    .then(doc => {
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

exports.editEvent = (req,res) => {

  if(!!req.files[0]){
    const path = require("path");
    const os = require("os");
    const fs = require("fs");

    let imageToBeUploaded = {};
    let imageFileName;

    const { fieldname, originalname, encoding, mimetype, buffer } = req.files[0];

    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }

    // Computing a new name for the image
    const imageExtension = originalname.split(".")[
      originalname.split(".").length - 1
    ];
    imageFileName = `${uuid()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    fs.writeFile(filepath, buffer, err => {
      if (!err) console.log("Data written");
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
        let imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
        // Validating incoming form data
        return db.doc(`events/${req.params.eventID}`).update({
          ...req.body,
          imageUrl
        })
      }).then(()=>{
            return res.json({message: 'details added successfully'})
        }).catch(err => {
            console.error(err);
            return res.status(401).json({error: "something happened"})
        })
      }

      else{
          db.doc(`events/${req.params.eventID}`).update({
          ...req.body
        }).then(()=>{
            return res.json({message: 'details added successfully'})
        }).catch(err => {
            console.error(err);
            return res.status(401).json({error: "something happened"})
        })
      }
}

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

exports.checkLike = (req, res) => {
  db.collection('likes').where('userHandle', '==', req.user.handle)
  .where('eventID', '==', req.params.eventId).get().then(data => {
    if(data.empty){
      return res.send(false);
    }
    else{
      return res.send(true);
    }
  }).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.code });
  });
}

// Like an event
exports.likeEvent = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("eventID", "==", req.params.eventID)
    .limit(1);

  const eventDocument = db.doc(`/events/${req.params.eventID}`);

  let eventData;
  eventDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        eventData = doc.data();
        eventData.eventID = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Event does not exist" });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            eventID: req.params.eventID,
            userHandle: req.user.handle
          })
          .then(() => {
            eventData.likeCount++;
            return eventDocument.update({ likeCount: eventData.likeCount });
          })
          .then(() => {
            return res.send("Event Liked!");
          });
      } else {
        return res.status(400).json({ error: "Event already liked" });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Unlike an event
exports.unlikeEvent = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("eventID", "==", req.params.eventID)
    .limit(1);

  const eventDocument = db.doc(`/events/${req.params.eventID}`);

  let eventData;
  eventDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        eventData = doc.data();
        eventData.eventID = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Event does not exist" });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: "Event not liked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            eventData.likeCount--;
            return eventDocument.update({ likeCount: eventData.likeCount });
          })
          .then(() => {
            return res.send('Event Unliked!');
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Cancel an event
// TODO: Send a notification to all the members when the event gets cancelled
// TODO: Delete all the likes associated with the event when the event gets cancelled
exports.cancelEvent = (req, res) => {
  db.doc(`/events/${req.params.eventID}`).get().then(doc => {
      if(doc.exists){
          if(doc.data().userHandle === req.user.handle)
              doc.ref.delete().then(() => {
                  return res.status(200).json({success:`deleted ${doc.data().eventName}`});
              })
          else{
              res.status(400).json({error: 'unauthorized'})
          }
      }
      else{
          res.status(400).json({error: 'event doesnt exist'})
      }
  }).catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
      });
};
