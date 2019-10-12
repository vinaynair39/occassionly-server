const dotenv = require("dotenv").config();
const firebase = require("firebase");
// require('firebase/storage');
// const storage = require('@google-cloud/storage');
const { db, admin } = require("../util/init");
const {
  validateSignupData,
  validateLoginData,
  validateUserData
} = require("../util/validators");

// Signup route handler
exports.signup = (req, res) => {
  const newUser = {
    name: req.body.name,
    college: null,
    year: null,
    contact_no: null,
    email: req.body.email,
    isCSIMember: null, // CSI RAIT only
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
    isAdmin: false
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  let token, userID;
  const noImg = "no-img.png";

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "Handle already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userID = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageURL: `https://firebasestorage.googleapis.com/v0/b/${process.env.STORAGE_BUCKET}/o/${noImg}?alt=media`,
        userID
      };
      db.doc(`/follows/${newUser.userHandle}`).set({followers: [], following: []});
      db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ error: "Email already in use" });
      } else {
        res.status(500).json({ error: err.code });
      }
    });
};

// Login route handler
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  // Validating the entered user details
  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        return res
          .status(403)
          .json({ general: "Account not found. Sign up first!" });
      } else if (err.code === "auth/wrong-password") {
        return res
          .status(400)
          .json({ general: "Incorrect credentials entered" });
      } else {
        return res.status(500).json({ errors: err.code });
      }
    });
};

exports.addUserDetails = (req, res) => {
  let userDetails = {
    name: req.body.name,
    college: req.body.college,
    year: req.body.year,
    contact_no: req.body.contact_no,
    discount: req.body.discount // Default value should be false, if user does not enter anything
    // Keep the discount field as a checkbox, default value false lul
  };

  // Validate the user details
  const { valid, errors } = validateUserData(userDetails);
  if (!valid) return res.status(400).json(errors);

  // Update user details
  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details updated successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Route for profile image upload
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });
  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    const imageExtension = filename.split(".").pop();
    imageFileName = `${Math.round(
      Math.random() * 10000000000
    )}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
    busboy.on("finish", () => {
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
          const imageURL = `https://firebasestorage.googleapis.com/v0/b/${process.env.STORAGE_BUCKET}/o/${imageFileName}?alt=media`;
          return db.doc(`/users/${req.user.handle}`).update({ imageURL });
        })
        .then(() => {
          return res.json({ message: "Image uploaded successfully" });
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ error: err.code });
        });
    });
  });
  busboy.end(req.rawBody);
};

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.handle)
          .get();
      }
    })
    .then(data => {
      userData.likes = [];
      data.forEach(doc => {
        userData.likes.push(doc.data());
      });
      return db
        .collection("notifications")
        .where("recipient", "==", req.user.handle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then(data => {
      userData.notifications = [];
      data.forEach(doc => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          eventId: doc.data().eventId,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id
        });
      });

      return db.doc(`follows/${req.user.handle}`).get();
      }).then(doc => {
              userData.follows = {
                followers:doc.data().followers,
                following:doc.data().following
              };
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};


exports.getUserHandle = (req,res) => {
    return res.send(req.user.handle);
}


exports.followUser = (req, res) => {
  let batch = db.batch();
  const recipient = req.body.recipient;
  const sender = db.doc(`follows/${req.user.handle}`);
  batch.update(sender, {following:admin.firestore.FieldValue.arrayUnion(recipient)});
  const receiver = db.doc(`follows/${recipient}`);
  batch.update(receiver, {followers:admin.firestore.FieldValue.arrayUnion(req.user.handle)});
  return batch.commit().then(() => res.send('You started following ' + recipient + '!')
  ).catch((err) => {
    console.error(err);
    return res.status(500).json({ error: err.code });
  });
}



exports.unfollowUser = (req, res) => {
  let batch = db.batch();
  const recipient = req.body.recipient;
  const sender = db.doc(`follows/${req.user.handle}`);
  batch.update(sender, {following:admin.firestore.FieldValue.arrayRemove(recipient)});
  const receiver = db.doc(`follows/${recipient}`);
  batch.update(receiver, {followers:admin.firestore.FieldValue.arrayRemove(req.user.handle)});
  return batch.commit().then(() => res.send('You unfollowed ' + recipient + '!')
  ).catch((err) => {
    console.error(err);
    return res.status(500).json({ error: err.code });
  });
}
