const express = require("express");
const router = express.Router();

const {
  createQuiz,
  getTeacherQuizzes,
} = require("../controllers/quiz.controller");

// CREATE QUIZ
router.post("/", createQuiz);

// GET TEACHER QUIZZES
router.get("/:teacherId", getTeacherQuizzes);

module.exports = router;