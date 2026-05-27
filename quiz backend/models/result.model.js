const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  username: { type: String, required: true },
  title:    { type: String, required: true },
  subject:  { type: String, required: true },
  // ✅ SET
  set:      { type: String, default: "Set 1" },
  examDate: { type: Date,   default: null },
  examDay:  { type: String, default: "" },
  score:    { type: Number, required: true },
  total:    { type: Number, required: true },
  date:     { type: Date,   default: Date.now },
});

resultSchema.index({ date: 1 });
resultSchema.index({ examDate: 1 });
resultSchema.index({ examDay: 1 });
resultSchema.index({ set: 1 });

module.exports = mongoose.model("Result", resultSchema);