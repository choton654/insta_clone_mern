if (process.env.NODE_ENV === "production") {
  module.exports = require("./prod");
} else {
  module.exports = require("./dev");
}
// "mongodb+srv://admin-choton:Toton_688@cluster0.j7z2c.mongodb.net/insta_clone?retryWrites=true&w=majority"
