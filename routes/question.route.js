const express = require("express");
const {postQuestion,allQuestions,getSingleQuestion} = require("../controller/question.controller")
const { protectedRoute } = require("../middleware/authMiddleware.js");
const router = express.Router();

//post questions

router.post('/send', protectedRoute,postQuestion);

// Get Single Question
router.get('/:question_id',protectedRoute, getSingleQuestion);

// get all questions 
router.get('/',protectedRoute, allQuestions);

module.exports = router;