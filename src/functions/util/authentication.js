const { db, admin } = require("./init");

exports.auth = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(401).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      return db
        .collection("users")
        .where("userID", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      req.user.isAdmin = data.docs[0].data().isAdmin;
      return next();
    })
    .catch(err => {
      console.error("Error while verifying token");
      return res.status(403).json(err);
    });
};

exports.checkAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    return next();
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
