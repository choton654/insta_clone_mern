const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, "a new secret", async (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ msg: "user is unauthenticated" });
      } else {
        const { email } = decoded;
        const getuser = await User.findOne({ email });
        req.user = getuser;
        next();
      }
    });
  } else {
    res.status(400).json({ msg: "user not found" });
  }
};

module.exports = authMiddleware;
