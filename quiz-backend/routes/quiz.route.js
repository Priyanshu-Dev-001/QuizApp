const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes, getQuizById } = require('../controllers/quiz.controller');

router.post('/', createQuiz);
router.get('/', getQuizzes);
router.get('/:id', getQuizById);

module.exports = router;
