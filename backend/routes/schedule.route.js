const express = require('express');
const router = express.Router();
const { scheduleMeeting,getInstructorSchedules,deleteSchedule } = require('../controller/schedule.controller');
const {protectedRoute} = require('../middleware/authMiddleware.js')
// Schedule a meeting
router.post('/schedule/:requestId', protectedRoute, scheduleMeeting);
// Get all scheduled meetings for an instructor
router.get('/instructor', protectedRoute, getInstructorSchedules);
// Delete a scheduled meeting
router.delete('/delete/:scheduleId', protectedRoute, deleteSchedule);
// Export the router
module.exports = router;