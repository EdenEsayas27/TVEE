const express = require('express');
const router = express.Router();
const{getUserNotifications} = require('../controller/notification.controller.js')
const {protectedRoute} = require('../middleware/authMiddleware.js')
// Get user notifications
router.get('/', protectedRoute, getUserNotifications);
// Export the router
module.exports = router;