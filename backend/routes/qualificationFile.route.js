const express = require("express");
const { protectedRoute } = require("../middleware/authMiddleware.js");
const {uploadQualification}= require("../controller/qualificationFile.controller")
const router = express.Router();

router.get("/", protectedRoute, uploadQualification);

 
module.exports = router;