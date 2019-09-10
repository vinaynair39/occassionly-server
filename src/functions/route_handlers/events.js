const { db } = require("../util/init");
const { validateEventData } = require("../util/validators");

exports.createEvent = (req, res) => {
  const newEvent = {
    eventName: req.body.eventName,
    location: req.body.location,
    tags: req.body.tags,
    date: req.body.date,
    time: req.body.time,
    members: [req.user.handle] // Temporary, will change this later to accomodate actual users that register for the event
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

// TODO: Make route handler for event registration
// TODO: Make route handler for event unregister
// TODO: Make route handler to like event
// TODO: Make route handler to unlike event
