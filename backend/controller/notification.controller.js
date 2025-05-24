const dbConnection = require("../DB/dbConfig");
const { v4: uuidv4 } = require("uuid");

const getUserNotifications = async (req, res) => {
  const userId = req.user.userid; // from JWT middleware

  try {
    const [notifications] = await dbConnection.query(
      `SELECT notificationId, message, link ,seen,createdAt
       FROM notifications 
       WHERE userId = ?
       ORDER BY createdAt DESC`,
      [userId]
    );

    res.status(200).json({
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};
module.exports = {
  getUserNotifications,
};
