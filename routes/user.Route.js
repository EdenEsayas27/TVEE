const express = require("express");
const router = express.Router();
//authentication middleware
const { protectedRoute } = require( "../middleware/authMiddleware");
// user controllers 
const {register,login,logout,updateProfile,checkUser} = require('../controller/user.controller');


// register routes 
router.post("/register",register
)
//login user
router.post("/login",login)
//logout 
router.get("/logout",logout)
//profile picture 
router.put("/update-profile",protectedRoute,updateProfile)
// check user 
router.get("/check",protectedRoute,checkUser)

module.exports = router;