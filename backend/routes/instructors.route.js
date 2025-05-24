const express = require("express");
const { protectedRoute } = require("../middleware/authMiddleware.js");
const {getAllInstructors,searchInstructors,getInstructorById}= require("../controller/instructor.controller")
const router = express.Router();

router.get("/", protectedRoute, getAllInstructors);
router.get("/search", protectedRoute, searchInstructors);
router.get("/:id",protectedRoute,getInstructorById)
 
module.exports = router;