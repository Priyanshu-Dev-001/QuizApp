const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes } = require('../controllers/quiz.controller');

router.post('/', createQuiz);
router.get('/', getQuizzes);

module.exports = router;
