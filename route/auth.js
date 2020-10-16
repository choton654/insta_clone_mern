const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Post = require("../models/post");
const { isLength, isEmail, isEmpty } = require("validator");
const User = require("../models/user");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

const maxAge = 60 * 60 * 12;
const createToken = (email) => {
  const token = jwt.sign({ email }, "a new secret", { expiresIn: maxAge });
  return token;
};

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "53adc14a16e7da",
    pass: "20432f9f5cd818",
  },
});

const storage = multer.diskStorage({
  destination: "./public/profilepic",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage }).single("photo");
router.post("/api/signup", upload, async (req, res) => {
  const { email, username, password } = req.body;

  // const photo = `http://localhost:5000/profilepic/${req.file?.filename}`;
  const photo = `https://pacific-crag-92696.herokuapp.com/profilepic/${req.file.filename}`;

  if (!isEmail(email)) {
    return res.status(400).json({ msg: "Use valid email" });
  } else if (!isLength(password, { min: 6 })) {
    return res.status(400).json({ msg: "Password must be 6 charecter long" });
  } else if (isEmpty(username, { ignore_whitespace: true })) {
    return res.status(400).json({ msg: "Username can't be empty" });
  } else if (req.file === undefined) {
    return res.status(400).json({ msg: "Photo can't be empty" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.json({ msg: "user already exists" });
  }
  const salt = await bcrypt.genSalt();
  const newPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    email,
    username,
    password: newPassword,
    photo,
  });
  const mailOptions = {
    from: "noWhwre688@gmail.com",
    to: user.email,
    subject: "Account Registration",
    text: "Hey there, it’s our first time in our app;",
    html:
      "<h4>Congratulations!</h4><br/><p>your account has successfully created</p>",
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.log(error);
  }
  res.status(200).json({ success: "User creation successfull" });
});

router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const matchedUser = await User.findOne({ email });
  if (matchedUser) {
    const foundUser = await bcrypt.compare(password, matchedUser.password);
    if (foundUser) {
      const token = createToken(email);
      res.cookie("jwt", token, { httpOnly: true, maxAge: 60 * 60 * 12 });
      res.status(200).json({
        success: "User found",
        token: token,
        user: {
          _id: matchedUser._id,
          username: matchedUser.username,
          email: matchedUser.email,
          photo: matchedUser.photo,
          followers: matchedUser.followers,
          followings: matchedUser.followings,
        },
      });
    } else {
      res.status(400).json({ msg: "User not found" });
    }
  } else {
    res.status(400).json({ msg: "Email does not match" });
  }
});

router.get("/api/currentuser", authMiddleware, (req, res) => {
  const { user } = req;
  res.status(200).json({
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      photo: user.photo,
      followers: user.followers,
      followings: user.followings,
    },
  });
});
router.get("/api/:id/otherprofile", authMiddleware, async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  try {
    const userPosts = await User.findOne({ _id: id })
      .populate("allposts")
      .select("-password");
    res.status(200).json({ userPosts });
  } catch (error) {
    res.status(400).json({ msg: error });
  }
});

router.post("/api/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.json({ msg: "successfully logged out" });
});
router.put("/api/follow", authMiddleware, async (req, res) => {
  const { user } = req;
  const { id } = req.body;
  try {
    const followUser = await User.findByIdAndUpdate(
      id,
      {
        $push: { followers: user._id },
      },
      { new: true }
    )
      .select("-password")
      .populate("allposts");
    if (followUser) {
      console.log("other user", followUser);
      const followingUser = await User.findByIdAndUpdate(
        user._id,
        {
          $push: { followings: id },
        },
        { new: true }
      ).select("-password");
      if (followingUser) {
        console.log("logged user", followingUser);
        res.status(200).json({
          success: "You are following the user",
          loggedUser: followingUser,
          otherUser: followUser,
        });
      } else {
        console.log("Can't add followings");
      }
    } else {
      console.log("Can't add followers");
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/api/unfollow", authMiddleware, async (req, res) => {
  const { user } = req;
  const { id } = req.body;
  try {
    const unfollowUser = await User.findByIdAndUpdate(
      id,
      {
        $pull: { followers: user._id },
      },
      { new: true }
    )
      .select("-password")
      .populate("allposts");
    if (unfollowUser) {
      // console.log(unfollowUser);
      const unfollowingUser = await User.findByIdAndUpdate(
        user._id,
        {
          $pull: { followings: id },
        },
        { new: true }
      ).select("-password");
      if (unfollowingUser) {
        // console.log(unfollowingUser);
        res.status(200).json({
          success: "You are unfollowing the user",
          loggedUser: unfollowingUser,
          otherUser: unfollowUser,
        });
      } else {
        console.log("act blocked");
      }
    } else {
      console.log("unfollow has blocked");
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/api/updatepic", authMiddleware, upload, async (req, res) => {
  const photo = `https://pacific-crag-92696.herokuapp.com/profilepic/${req.file.filename}`;
  const { id } = req.user;
  try {
    const updatedPic = await User.findByIdAndUpdate(
      id,
      { $set: { photo: photo } },
      { new: true }
    );
    console.log(updatedPic);
    res.status(200).json({ pic: updatedPic.photo });
  } catch (error) {
    console.log(error);
  }
});

router.get("/api/allUsers", async (req, res) => {
  const allUser = await User.find({}).populate("allposts").select("-password");
  console.log(allUser);
  res.json({ allUser });
});
router.post("/api/search", authMiddleware, async (req, res) => {
  // console.log(req.body);
  const query = new RegExp("^" + req.body.search);
  try {
    const searchedUser = await User.find({ email: { $regex: query } });
    console.log(searchedUser);
    res.status(200).json({ searchedUser });
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
