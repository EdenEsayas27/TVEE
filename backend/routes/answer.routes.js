const express = require("express");
const{postAnswer,answerForQuestion} = require("../controller/answer.controller.js")
const { protectedRoute } = require("../middleware/authMiddleware.js");
const router = express.Router();

//post questions

router.post('/send', protectedRoute,postAnswer);
router.get('/:question_id',protectedRoute, answerForQuestion);


module.exports = router;