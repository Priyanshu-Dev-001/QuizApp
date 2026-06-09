const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ROUTES
const userRoutes = require("./routes/user.route");
const quizRoutes = require("./routes/quiz.route");
const resultRoutes = require("./routes/result.route");
const teacherQuizRoutes = require("./routes/teacherQuiz.routes");

// ✅ NEW PROFILE ROUTE
const profileRoutes = require("./routes/profileRoutes");

// 🤖 NEW AI ROUTE
const aiRoutes = require("./routes/aiRoutes");

// 👥 STUDY GROUPS ROUTE
const studyGroupRoutes = require("./routes/studyGroup.routes");

const app = express();

// ===============================
// ✅ MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ===============================
// ✅ HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// ===============================
// ✅ DATABASE CONNECTION
// ===============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.log("❌ DB Error:", err.message);
  });

// ===============================
// ✅ ROUTES
// ===============================
app.use("/api/users", userRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/teacher-quiz", teacherQuizRoutes);
app.use("/api/results", resultRoutes);

// 🔥 NEW PROFILE ROUTE
app.use("/api/profile", profileRoutes);

// 🤖 NEW AI ROUTE
app.use("/api/ai", aiRoutes);

// 👥 STUDY GROUPS ROUTE
app.use("/api/groups", studyGroupRoutes);

// ===============================
// ❌ 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

// ===============================
// ❌ ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.log("🔥 ERROR:", err.message);
  res.status(500).json({ message: err.message });
});

// ===============================
// ✅ SERVER START
// ===============================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
