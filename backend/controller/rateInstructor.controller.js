const dbConnection = require("../DB/dbConfig");
const cloudinary = require("../lib/cloudinary");
const { StatusCodes } = require('http-status-codes');
const uuidv4 = require('uuid').v4;

//getall sessions that can be rate by the student
const getRatableSessions = async (req, res) => {
  const studentId = req.user.userid;

  try {
    const [sessions] = await dbConnection.query(
      `SELECT s.scheduleId, s.scheduledDate, u.fullname AS instructorName
       FROM schedules s
       JOIN users u ON u.userid = s.instructorId
       LEFT JOIN ratings r ON r.scheduleId = s.scheduleId
       WHERE s.studentId = ? 
         AND s.scheduledDate < NOW()
         AND r.scheduleId IS NULL`,
      [studentId]
    );

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching ratable sessions:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};
// submit rating 
const submitRating = async (req, res) => {
  const studentId = req.user.userid;
  const { scheduleId, rating, comment } = req.body;
  const ratingId = uuidv4();

  try {
    // Get instructor from schedule
    const [[session]] = await dbConnection.query(
      `SELECT instructorId FROM schedules WHERE scheduleId = ? AND studentId = ?`,
      [scheduleId, studentId]
    );

    if (!session) {
      return res.status(400).json({ message: "Invalid session or unauthorized" });
    }

    await dbConnection.query(
      `INSERT INTO iratings (ratingId, scheduleId, studentId, instructorId, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ratingId, scheduleId, studentId, session.instructorId, rating, comment || null]
    );

    res.status(201).json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ message: "Failed to submit rating" });
  }
};
//Instructor sees their average rating & eligibility
const getInstructorRatingSummary = async (req, res) => {
  const instructorId = req.user.userid;

  try {
    const [[stats]] = await dbConnection.query(
      `SELECT COUNT(*) AS totalRatings, AVG(rating) AS averageRating
       FROM iratings WHERE instructorId = ?`,
      [instructorId]
    );

    const [[alreadyClaimed]] = await dbConnection.query(
      `SELECT * FROM certificates WHERE instructorId = ?`,
      [instructorId]
    );

    const eligible = stats.totalRatings >= 5 && stats.averageRating >= 4;

    res.json({
      averageRating: parseFloat(stats.averageRating || 0).toFixed(2),
      totalRatings: stats.totalRatings,
      eligible,
      certificateClaimed: !!alreadyClaimed,
    });
  } catch (error) {
    console.error("Error getting instructor rating summary:", error);
    res.status(500).json({ message: "Failed to get rating summary" });
  }
};
//Instructor claims their certificate
const claimCertificate = async (req, res) => {
  const instructorId = req.user.userid;
  const certificateId = uuidv4();

  try {
    const [[stats]] = await dbConnection.query(
      `SELECT COUNT(*) AS totalRatings, AVG(rating) AS averageRating
       FROM iratings WHERE instructorId = ?`,
      [instructorId]
    );

    const [[alreadyClaimed]] = await dbConnection.query(
      `SELECT * FROM certificates WHERE instructorId = ?`,
      [instructorId]
    );

    if (alreadyClaimed) {
      return res.status(400).json({ message: "Certificate already claimed" });
    }

    if (stats.totalRatings < 5 || stats.averageRating < 4) {
      return res.status(400).json({ message: "Not eligible yet" });
    }

    await dbConnection.query(
      `INSERT INTO certificates (certificateId, instructorId) VALUES (?, ?)`,
      [certificateId, instructorId]
    );

    res.status(201).json({ message: "Certificate claimed successfully" });
  } catch (error) {
    console.error("Error claiming certificate:", error);
    res.status(500).json({ message: "Failed to claim certificate" });
  }
};


module.exports = {
  getRatableSessions,
  submitRating,
  getInstructorRatingSummary,
  claimCertificate
};