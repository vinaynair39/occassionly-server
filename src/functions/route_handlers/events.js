const { db } = require("../util/init");
const { validateEventData } = require("../util/validators");

// Create an event
exports.createEvent = (req, res) => {
  const newEvent = {
    eventName: req.body.eventName,
    description: req.body.description,
    location: req.body.location,
    tags: req.body.tags,
    date: req.body.date,
    time: req.body.time,
    fee: req.body.fee,
    createdAt: new Date().toISOString(),
    members: {} // Temporary, will change this later to accomodate actual users that register for the event
  };

  // Validating incoming form data
  const { valid, errors } = validateEventData(newEvent);
  if (!valid) return res.status(400).json(errors);

  db.collection("events")
    .where("location", "==", newEvent.location)
    .where("date", "==", newEvent.date)
    .where("time", "==", newEvent.time)
    .get()
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
        message: `Event ${doc.id} created successfully`
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
