//jshint esversion:6
const firebase = require('firebase');
const { db } = require('../util/init');
const { validateSignupData, validateLoginData } = require('../util/validators');

// Signup route handler
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  const { valid, errors } = validateSignupData(newUser);
  if(!valid)
    return res.status(400).json(errors);

  let token, userID;

  db.doc(`/users/${newUser.handle}`).get()
  .then(doc => {
    if(doc.exists){
      return res.status(400).json({ handle: 'Handle already taken' });
    } else{
      return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
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
      userID
    };
    return db.doc(`/users/${newUser.handle}`).set(userCredentials);
  })
  .then(() => {
    return res.status(201).json({ token });
  })
  .catch(err => {
    console.error(err);

    if(err.code === 'auth/email-already-in-use'){
      return res.status(400).json({ error: 'Email already in use' });
    } else{
      res.status(500).json({error: err.code});
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
  if(!valid)
    return res.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
  .then(data => {
    return data.user.getIdToken();
  })
  .then(token => {
    return res.json({ token });
  })
  .catch(err => {
    console.error(err);
    if(err.code === 'auth/wrong-password'){
      return res.status(400).json({ general: 'Incorrect credentials entered' });
    } else{
      return res.status(500).json({ errors: err.code });
    }
  });
};
