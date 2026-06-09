const express = require("express");
const router = express.Router();

const {
  createQuiz,
  deleteQuiz,
  getTeacherQuizzes,
  updateQuiz,
} = require("../controllers/quiz.controller");

// CREATE QUIZ
router.post("/", createQuiz);

// GET TEACHER QUIZZES
router.get("/:teacherId", getTeacherQuizzes);

router.put("/:id", updateQuiz);

router.delete("/:id", deleteQuiz);

module.exports = router;
