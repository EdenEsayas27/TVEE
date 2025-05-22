const dbConnection = require("../DB/dbConfig");
const cloudinary = require("../lib/cloudinary");
const { getReceiverSocketId, io } = require("../lib/socket");

// exports.getUsersForSidebar = async (req, res) => {
//   try {
//     const loggedInUserId = req.user.userid;
//     const [users] = await dbConnection.query(
//       "SELECT userid, fullname, email, profilePic FROM users WHERE userid != ?",
//       [loggedInUserId]
//     );

//     res.status(200).json(users);
//   } catch (error) {
//     console.error("Error in getUsersForSidebar: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

exports.getMessages = async (req, res) => {
  try {
    const userToChatId = req.params.id;
    const myId = req.user.userid;

    const [messages] = await dbConnection.query(
      `SELECT * FROM messages 
       WHERE (senderId = ? AND receiverId = ?) 
          OR (senderId = ? AND receiverId = ?) 
       ORDER BY createdAt ASC`,
      [myId, userToChatId, userToChatId, myId]
    );

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user.userid;

    let imageUrl = null;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const [result] = await dbConnection.query(
      "INSERT INTO messages (senderId, receiverId, text, image) VALUES (?, ?, ?, ?)",
      [senderId, receiverId, text, imageUrl]
    );

    const [newMessageRows] = await dbConnection.query(
      "SELECT * FROM messages WHERE messageId = ?",
      [result.insertId]
    );

    const newMessage = newMessageRows[0];

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
// to do 
// how to get people to chat 
// search people for chat etc