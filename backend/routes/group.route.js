const express = require("express");

const { protectedRoute } = require("../middleware/authMiddleware.js");
const {createGroup,addMemberToGroup,sendGroupMessage,leaveGroup,getGroupMessages,getUserGroups,getGroupMembers}= require("../controller/groups.controller")
const router = express.Router();

router.post("/create", protectedRoute, createGroup);
router.post("/:id/add-member", protectedRoute, addMemberToGroup);
router.post("/:groupId/message", protectedRoute, sendGroupMessage);
router.delete("/leave/:groupId", protectedRoute, leaveGroup);
router.get("/:groupId/messages", protectedRoute, getGroupMessages);
router.get("/my-groups", protectedRoute, getUserGroups);
router.get("/:id/members", protectedRoute, getGroupMembers);


module.exports = router;