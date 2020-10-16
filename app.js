const express = require("express");
const authrouter = require("./route/auth");
const postrouter = require("./route/post");
const cookieparser = require("cookie-parser");
const cors = require("cors");
const { MONGO_URI } = require("./config/keys");
const mongoose = require("mongoose");
const path = require("path");
//db set-up
mongoose.connect(
  process.env.MONGO_URI ||
    "mongodb+srv://admin-choton:Toton_688@cluster0.j7z2c.mongodb.net/insta_clone?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("We are connectrd");
});

//app set-up
const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(cookieparser());
app.use(express.json());
const PORT = process.env.PORT || 5000;

//routes

app.use(authrouter);
app.use(postrouter);
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
