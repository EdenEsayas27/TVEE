const express = require('express');
const router = express.Router();

const{protectedRoute} = require('../middleware/authMiddleware.js')
const{getRatableSessions,
  submitRating,
  getInstructorRatingSummary,
  claimCertificate} = require('../controller/rateInstructor.controller.js')

// Student routes
router.get('/ratings', protectedRoute,getRatableSessions );
router.post('/submit', protectedRoute, submitRating);
router.get('/summary', protectedRoute, getInstructorRatingSummary);
router.post('/claim', protectedRoute, claimCertificate);

module.exports = router;
