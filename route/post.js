const router = require("express").Router();
const Post = require("../models/post");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");

const handleError = (err) => {
  // console.log(err.message, err.code);
  let error = {};

  if (err.code === 11000) {
    return (error.email = "the email or password already exists");
  }

  if (err.message.includes("post validation failed:")) {
    Object.values(err.errors).forEach(({ properties: { path, message } }) => {
      error[path] = message;
    });
  }
  return error;
};

const storage = multer.diskStorage({
  destination: "./public/upload",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage }).single("photo");

router.post("/api/createpost", authMiddleware, upload, async (req, res) => {
  const { title, body } = req.body;
  if (req.file === undefined) {
    return res.status(400).json({ msg: "Photo field can't be empty" });
  }
  const photo = `http://localhost:5000/upload/${req.file?.filename}`;
  req.user.password = undefined;
  try {
    const newPost = await Post.create({
      title,
      body,
      photo,
      postedBy: req.user,
    });
    res
      .status(200)
      .json({ success: "Post successfully created", newPost: newPost });
  } catch (error) {
    const err = handleError(error);
    // console.log(err);
    res.status(400).json(err);
  }
});
router.get("/api/allposts", async (req, res) => {
  const allPosts = await Post.find({})
    .populate("postedBy", "_id username email photo")
    .populate("comments.postedBy", "_id username photo")
    .sort("-createdAt");
  res.status(200).json({ allPosts });
});

router.get("/api/mypost", authMiddleware, async (req, res) => {
  const { user } = req;
  try {
    const myPost = await Post.find({ postedBy: user._id }).populate(
      "postedBy",
      "_id username email"
    );
    res.status(200).json({ myPost });
  } catch (error) {
    res.json({ msg: "User is not authenticated", error: error });
  }
});
router.put("/api/like", authMiddleware, async (req, res) => {
  const { user } = req;
  const postId = req.body.id;
  try {
    const data = await Post.findByIdAndUpdate(
      postId,
      { $push: { likes: user._id } },
      { new: true }
    )
      .populate("postedBy", "_id username photo")
      .populate("comments.postedBy", "_id username photo");
    // console.log(data);
    res.json(data);
  } catch (error) {
    res.json({ msg: error });
  }
});
router.put("/api/unlike", authMiddleware, async (req, res) => {
  const { user } = req;
  const postId = req.body.id;
  try {
    const data = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: user._id } },
      { new: true }
    )
      .populate("postedBy", "_id username photo")
      .populate("comments.postedBy", "_id username photo");
    // console.log(data);
    res.json(data);
  } catch (error) {
    res.json({ msg: error });
  }
});
router.put("/api/comment", authMiddleware, async (req, res) => {
  const { user } = req;
  const { id, text } = req.body;
  const comment = {
    text: text,
    postedBy: user._id,
  };
  // console.log(comment);
  try {
    const newComment = await Post.findByIdAndUpdate(
      id,
      {
        $push: { comments: comment },
      },
      { new: true }
    )
      .populate("comments.postedBy", "_id username photo")
      .populate("postedBy", "_id username photo");
    res.status(200).json({ newComment });
  } catch (error) {
    res.status(400).json({ msg: error });
  }
});
router.delete("/api/:id/delete", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  // console.log(id, user);
  const data = await Post.findById(id);

  if (data.postedBy.toString() !== user._id.toString()) {
    return res.status(400).json({ msg: "user not found" });
  }
  data.remove();
  res.status(200).json({ success: "Post has successfully deleted" });
});
router.delete(
  "/api/:postid/:commentid/deletecomment",
  authMiddleware,
  async (req, res) => {
    const { postid, commentid } = req.params;
    const { user } = req;
    const post = await Post.findById(postid);

    const foundComment = post.comments.find((comment) => {
      if (
        comment._id.toString() === commentid.toString() &&
        comment.postedBy.toString() === user._id.toString()
      ) {
        return comment;
      }
    });
    try {
      foundComment.remove();
      await post.save();
      res.status(200).json({ success: "comment deleted", post: post });
    } catch (error) {
      console.log(error);
    }
  }
);

router.get("/api/myfollowings", authMiddleware, async (req, res) => {
  const { user } = req;
  try {
    const subsUserPost = await Post.find({
      postedBy: { $in: user.followings },
    }).populate("postedBy", "_id username email photo followers followings");
    // console.log(subsUserPost);
    res.status(200).json({ subsUserPost });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
