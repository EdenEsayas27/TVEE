const express = require("express");
const {
  // getUsersForSidebar,
  getMessages,
  sendMessage,
} = require("../controller/message.controller.js");
const { protectedRoute } = require("../middleware/authMiddleware.js");

const router = express.Router();

// router.get("/users", protectedRoute, getUsersForSidebar);
router.get("/:id", protectedRoute, getMessages);
router.post("/send/:id", protectedRoute, sendMessage);

module.exports = router;
