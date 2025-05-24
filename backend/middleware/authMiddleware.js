const jwt = require("jsonwebtoken");
const dbConnection = require("../DB/dbConfig")


 const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Query MySQL to get the user by ID
    const [rows] = await dbConnection.query(
      "SELECT userid, fullname,role,field,qualificationfile, email, profilePic FROM users WHERE userid = ?",
      [decoded.userId]//   id: newUserId,
           
       
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    req.user = rows[0]; // Attach the user (without password)
    next();

  } catch (error) {
    console.log("Error in protected route:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { protectedRoute };