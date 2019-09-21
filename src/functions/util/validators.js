// Helper Functions
const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

// Checks if email is valid
const isEmail = email => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (email.match(regex)) return true;
  else return false;
};

const isPhoneNumber = num => {
  if (num.length === 10) return true;
  else return false;
};

exports.validateSignupData = data => {
  let errors = {}; // Object stores all errors after validation

  // Validating email
  if (isEmpty(data.email)) errors.email = "Must not be empty";
  else if (!isEmail(data.email)) errors.email = "Must be a valid email address";

  // Validating password
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  // Validating confirm password field
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords don't match";

  // Validating handle
  if (isEmpty(data.handle)) errors.handle = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

exports.validateLoginData = data => {
  let errors = {};

  // Validating email
  if (isEmpty(data.email)) errors.email = "Must not be empty";
  else if (!isEmail(data.email)) errors.email = "Invalid email address";

  // Validating password
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

exports.validateEventData = data => {
  let errors = {};

  // Event name cannot be left empty
  if (isEmpty(data.eventName)) errors.eventName = "Must not be empty";

  // Event location cannot be left empty
  if (isEmpty(data.location)) errors.location = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

exports.validateUserData = data => {
  let errors = {};

  if (isEmpty(data.name)) errors.name = "Must not be empty";
  if (isEmpty(data.college)) errors.college = "Must not be empty";

  if (isEmpty(data.year.toString())) errors.year = "Must not be empty";
  else if (!(0 < data.year < 5)) errors.year = "Invalid year";

  if (isEmpty(data.contact_no)) errors.contact_no = "Must not be empty";
  else if (!isPhoneNumber(data.contact_no))
    errors.contact_no = "Contact number should be of 10 digits";

  return {
    errors: errors,
    valid: Object.keys(errors).length === 0
  };
};
