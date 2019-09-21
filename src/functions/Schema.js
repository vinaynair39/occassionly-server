User = {
  name: String,
  college: String,
  year: 1,
  contact_no: String,
  email: String,
  isCSIMember: Boolean,
  amountPaid: 30,
  balance: 10
};

Event = {
  eventName: String,
  tags: [],
  time: String,
  date: String,
  location: String, // Maps API?, Idk just take string input for now
  fee: 100, // False if not applicable, or probably 0 lol. Yeah, 0 is better
  likes_no: 3,
  members: {} // Really not sure about this, have to do something to limit the number of reads :(
};
