const dbConnection = require("../DB/dbConfig");
const { v4: uuidv4 } = require("uuid");

const { createMeetingLink } = require("./googleMeet.controller");
// Schedule a meeting for a request
// const scheduleMeeting = async (req, res) => {
//   const { scheduledDate, meetingLink } = req.body;
//   const{requestId}=req.params
//   const instructorId = req.user.userid;

//   if (!requestId || !scheduledDate || !meetingLink) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     // Check if the request exists and belongs to the instructor
//        const [[requestData]] = await dbConnection.query(
//       `SELECT r.studentId, u.fullname AS instructorName
//        FROM requests r
//        JOIN users u ON r.instructorId = u.userid
//        WHERE r.requestId = ? AND r.instructorId = ?`,
//       [requestId, instructorId]
//     )

//     if (!requestData) {
//       return res.status(404).json({ message: "Request not found or unauthorized" });
//     }

//     const scheduleId = uuidv4();

//     // Insert schedule
//     await dbConnection.query(
//       `INSERT INTO schedules (scheduleId, requestId, instructorId, studentId, meetingLink, scheduledDate)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [scheduleId, requestId, instructorId, requestData.studentId, meetingLink, scheduledDate]
//     );

//     // Insert notification for student
//     const notificationId = uuidv4();
//     const formattedDate = new Date(scheduledDate).toLocaleString();
//     const message = `Instructor ${requestData.instructorName} has scheduled your mentorship session for ${formattedDate}. <a href="${meetingLink}" target="_blank">Click to join</a>.`;


//     await dbConnection.query(
//       `INSERT INTO notifications (notificationId, userId, message, link)
//        VALUES (?, ?, ?, ?)`,
//       [notificationId, requestData.studentId, message, meetingLink]
//     );

//     res.status(201).json({
//       message: "Meeting scheduled successfully",
//       data: {
//         scheduleId,
//         requestId,
//         instructorId,
//         studentId: requestData.studentId,
//         scheduledDate,
//         meetingLink,
//       },
//     });
//   } catch (error) {
//     console.error("Error scheduling meeting:", error);
//     res.status(500).json({ message: "Failed to schedule meeting" });
//   }
// };
const scheduleMeeting = async (req, res) => {
  const { scheduledDate } = req.body;
  const { requestId } = req.params;
  const instructorId = req.user.userid;

  if (!requestId || !scheduledDate) {
    return res.status(400).json({ message: "Request ID and date are required" });
  }

  // ✅ Convert ISO date to MySQL DATETIME format
  const mysqlFormattedDate = new Date(scheduledDate).toISOString().slice(0, 19).replace('T', ' ');

  try {
    const [[requestData]] = await dbConnection.query(
      `SELECT r.studentId, u.fullname AS instructorName
       FROM requests r
       JOIN users u ON r.instructorId = u.userid
       WHERE r.requestId = ? AND r.instructorId = ?`,
      [requestId, instructorId]
    );

    if (!requestData) {
      return res.status(404).json({ message: "Request not found or unauthorized" });
    }

    // 👇 Generate Google Meet link
    const meetingLink = await createMeetingLink(scheduledDate);

    const scheduleId = uuidv4();

    await dbConnection.query(
      `INSERT INTO schedules (scheduleId, requestId, instructorId, studentId, meetingLink, scheduledDate)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [scheduleId, requestId, instructorId, requestData.studentId, meetingLink, mysqlFormattedDate]
    );

    const notificationId = uuidv4();
    const formattedDate = new Date(scheduledDate).toLocaleString();
    const message = `Instructor ${requestData.instructorName} has scheduled your mentorship session for ${formattedDate}. <a href="${meetingLink}" target="_blank">Click to join</a>.`;

    await dbConnection.query(
      `INSERT INTO notifications (notificationId, userId, message, link)
       VALUES (?, ?, ?, ?)`,
      [notificationId, requestData.studentId, message, meetingLink]
    );

    res.status(201).json({
      message: "Meeting scheduled successfully",
      data: {
        scheduleId,
        requestId,
        instructorId,
        studentId: requestData.studentId,
        scheduledDate: mysqlFormattedDate,
        meetingLink,
      },
    });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    res.status(500).json({ message: "Failed to schedule meeting" });
  }
};


// Get all scheduled meetings for an instructor

const getInstructorSchedules = async (req, res) => {
  const instructorId = req.user.userid;

  try {
    const [schedules] = await dbConnection.query(
      `SELECT 
         s.scheduleId,
         s.scheduledDate,
         s.meetingLink,
         r.request AS requestTitle,
         u.fullname AS studentName,
         u.email AS studentEmail,
         u.profilepic AS studentProfile
       FROM schedules s
       JOIN requests r ON s.requestId = r.requestId
       JOIN users u ON s.studentId = u.userid
       WHERE s.instructorId = ?
       ORDER BY s.scheduledDate DESC`,
      [instructorId]
    );

    res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching instructor schedules:", error);
    res.status(500).json({ message: "Failed to fetch schedules" });
  }
};


const deleteSchedule = async (req, res) => {
    const{scheduleId}=req.params
    const instructorId = req.user.userid;
    try {
        // Check if the schedule exists and belongs to the instructor
        const [[scheduleData]] = await dbConnection.query(
            `SELECT r.studentId, u.fullname AS instructorName,s.scheduledDate as scheduledDate ,s.meetingLink as meetingLink
            FROM schedules s
            JOIN requests r ON s.requestId = r.requestId
            JOIN users u ON r.instructorId = u.userid
            WHERE s.scheduleId = ? AND s.instructorId = ?`,
            [scheduleId, instructorId]
        );

        if (!scheduleData) {
            return res.status(404).json({ message: "Schedule not found or unauthorized" });
        }

        // Delete the schedule
        await dbConnection.query(
            `DELETE FROM schedules WHERE scheduleId = ?`,
            [scheduleId]
        );

        // Insert notification for student
        const notificationId = uuidv4();
        const formattedDate = new Date(scheduleData.scheduledDate).toLocaleString();

        const message = `Instructor ${scheduleData.instructorName} has canceled your scheduled mentorship session  scheduled at ${formattedDate}.`;

        await dbConnection.query(
            `INSERT INTO notifications (notificationId, userId, message,link)
             VALUES (?, ?, ?,?)`,
            [notificationId, scheduleData.studentId, message, scheduleData.meetingLink]
        );

        res.status(200).json({ message: "Schedule deleted successfully" });
    } catch (error) {
        console.error("Error deleting schedule:", error);
        res.status(500).json({ message: "Failed to delete schedule" });
    }
}

module.exports = {
  scheduleMeeting,
  getInstructorSchedules,
  deleteSchedule
};

// to do 
// integrate google meet  to authomatically generate meeting link and in iframe    in front end 