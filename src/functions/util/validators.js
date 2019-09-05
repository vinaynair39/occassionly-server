//jshint esversion:6

// Helper Functions
const isEmpty = (string) => {
  if(string.trim() === '') return true;
  else return false;
};

// Checks if email is valid
const isEmail = (email) => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if(email.match(regex))
    return true;
  else
    return false;
};

exports.validateSignupData = (data) => {
  let errors = {};  // Object stores all errors after validation

  // Validating email
  if(isEmpty(data.email))
    errors.email = 'Must not be empty';
  else if(!isEmail(data.email))
    errors.email = 'Must be a valid email address';

  // Validating password
  if(isEmpty(data.password))
    errors.password = 'Must not be empty';

  // Validating confirm password field
  if(data.password !== data.confirmPassword)
    errors.confirmPassword = 'Passwords don\'t match';

  // Validating handle
  if(isEmpty(data.handle))
    errors.handle = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

exports.validateLoginData = (data) => {
  let errors = {};
  
  // Validating email
  if(isEmpty(data.email))
    errors.email = 'Must not be empty';
  else if(!isEmail(data.email))
    errors.email = 'Invalid email address';

  // Validating password
  if(isEmpty(data.password))
    errors.password = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};
