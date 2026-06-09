const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  quizId:   { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", default: null },
  username: { type: String, required: true },
  title:    { type: String, required: true },
  subject:  { type: String, required: true },
  // ✅ SET
  set:      { type: String, default: "Set 1" },
  examDate: { type: Date,   default: null },
  examDay:  { type: String, default: "" },
  score:    { type: Number, required: true },
  total:    { type: Number, required: true },
  duration: { type: Number, default: 60 },
  timeSpent:{ type: Number, default: 0 },
  answers: [
    {
      question: { type: String, default: "" },
      type: { type: String, default: "mcq" },
      options: { type: [String], default: [] },
      selectedAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
      correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  date:     { type: Date,   default: Date.now },
});

resultSchema.index({ userId: 1 });
resultSchema.index({ quizId: 1 });
resultSchema.index({ date: 1 });
resultSchema.index({ examDate: 1 });
resultSchema.index({ examDay: 1 });
resultSchema.index({ set: 1 });
resultSchema.index({ username: 1 });
resultSchema.index({ subject: 1 });

module.exports = mongoose.model("Result", resultSchema);
