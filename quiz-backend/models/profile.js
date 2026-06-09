const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: String,
  email: String,
  phone: String,
  className: String,
  city: String,
  bio: String,
  photo: String,
});

module.exports = mongoose.model("Profile", profileSchema);