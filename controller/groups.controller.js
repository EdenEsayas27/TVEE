const dbConnection = require("../DB/dbConfig");
const cloudinary = require("../lib/cloudinary");
const { StatusCodes } = require("http-status-codes");

exports.createGroup = async (req, res) => {
  try {
    const { groupName, memberIds } = req.body;
    const creatorId = req.user.userid;
    let groupImage = null;

    // Upload group image if provided
    if (req.body.groupImage) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.groupImage);
      groupImage = uploadResponse.secure_url;
    }

    // Step 1: Create the group
    const [groupResult] = await dbConnection.query(
      "INSERT INTO groups (groupName, groupImage, createdBy) VALUES (?, ?, ?)",
      [groupName, groupImage, creatorId]
    );

    const groupId = groupResult.insertId;

    // Step 2: Add creator and optional members to group_members
    const allMemberIds = memberIds && Array.isArray(memberIds)
      ? [...new Set([...memberIds, creatorId])] // ensure no duplicates
      : [creatorId];

    if (allMemberIds.length > 0) {
      const values = allMemberIds.map(userId => [groupId, userId]);
      await dbConnection.query(
        "INSERT INTO group_members (groupId, userId) VALUES ?",
        [values]
      );
    }

    res.status(StatusCodes.CREATED).json({
      message: "Group created successfully",
      groupId,
      membersAdded: allMemberIds
    });
  } catch (error) {
    console.error("Error creating group:", error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      msg: "Internal server error"
    });
  }
};
//ADDMEMBERS 
exports.addMemberToGroup = async (req, res) => {
  const groupId = req.params.id;
  const { userId } = req.body;

  try {
    await dbConnection.query(
      "INSERT INTO group_members (groupId, userId) VALUES (?, ?)",
      [groupId, userId]
    );
    res.status(201).json({ msg: "Member added successfully" });
  } catch (error) {
    console.error("Error adding member:", error.message);
    res.status(500).json({ error: error.message });
  }
};
// send message to the group 

exports.sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const groupId = req.params.groupId;
    const senderId = req.user.userid;

    let imageUrl = null;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Save message to DB
    const [result] = await dbConnection.query(
      "INSERT INTO group_messages (groupId, senderId, text, image) VALUES (?, ?, ?, ?)",
      [groupId, senderId, text, imageUrl]
    );

    const [newMessageRows] = await dbConnection.query(
      "SELECT * FROM group_messages WHERE messageId = ?",
      [result.insertId]
    );

    const newMessage = newMessageRows[0];

    // Get all group members except sender
    const [members] = await dbConnection.query(
      "SELECT userId FROM group_members WHERE groupId = ? AND userId != ?",
      [groupId, senderId]
    );

    // Emit to each member's socket if online
    members.forEach(({ userId }) => {
      const socketId = getReceiverSocketId(userId);
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", {
          groupId,
          message: newMessage,
        });
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
//leave group 
exports.leaveGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.userid;

    // Remove the user from the group_members table
    await dbConnection.query(
      "DELETE FROM group_members WHERE groupId = ? AND userId = ?",
      [groupId, userId]
    );

    res.status(200).json({ message: "Left the group successfully" });

  } catch (error) {
    console.error("Error in leaveGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//fetch all messages from the given group 
exports.getGroupMessages = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const [messages] = await dbConnection.query(
      `SELECT gm.*, u.fullname, u.profilePic
       FROM group_messages gm
       JOIN users u ON gm.senderId = u.userid
       WHERE gm.groupId = ?
       ORDER BY gm.createdAt ASC`,
      [groupId]
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
//Get all groups for user 
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userid;

    const [groups] = await dbConnection.query(
      `SELECT g.groupId, g.groupName, g.createdAt,g.groupImage, u.fullname AS createdByName
       FROM groups g
       JOIN group_members gm ON g.groupId = gm.groupId
       JOIN users u ON g.createdBy = u.userid
       WHERE gm.userId = ?`,
      [userId]
    );

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getUserGroups controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get group members
exports.getGroupMembers = async (req, res) => {
  try {
    const groupId = req.params.id;

    const [members] = await dbConnection.query(
      `SELECT u.userid, u.fullname, u.profilePic
       FROM group_members gm
       JOIN users u ON gm.userId = u.userid
       WHERE gm.groupId = ?`,
      [groupId]
    );

    res.status(200).json(members);
  } catch (error) {
    console.error("Error in getGroupMembers controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

