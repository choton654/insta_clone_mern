const mongoose = require("mongoose");
// const { isEmail } = require("validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      // validate: [isEmail, "Use valid email"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    photo: {
      type: String,
      required: [true, "Photo is required"],
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    followings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual("allposts", {
  ref: "post",
  localField: "_id", // `localField`
  foreignField: "postedBy", // `foreignField`
  justOne: false,
});

const User = new mongoose.model("user", userSchema);

module.exports = User;
