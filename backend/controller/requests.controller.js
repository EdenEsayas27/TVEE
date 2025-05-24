const dbConnection = require("../DB/dbConfig");
const uuidv4 = require('uuid').v4;
const { StatusCodes } = require('http-status-codes');

const  sendRequest = async (req, res) =>{
     const{request,description}=req.body;
     const instructorId = req.params.id;
     const studentId = req.user.userid;

     if(!request||!description){
       return res.status(400).json({message:"please fill all the required fields"});
     }
    try {
         const requestId = uuidv4();
          await dbConnection.query(
            "INSERT INTO requests (requestId,studentId,instructorId,request,description,status) VALUES (?, ?, ?, ?,?,?)",
            [requestId,studentId, instructorId, request, description,"pending"]
        );
      res.status(201).json({message:"request send secuessfully",
        data:{
            requestId,
            studentId, 
            instructorId, 
            request, 
            description,
            status:"pending"

        }
      })
        
    } catch (error) {
        console.error('Error sending request:', error.message);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              err: 'Internal Server Error',
              msg: 'An unexpected error occurred.',
            });
    }
    
} 
//Instructor get all requests send to him

const getInstructorRequests = async (req, res) => {
  const instructorId = req.user.userid; // assuming this is protectedRoute for instructor

  try {
    const [requests] = await dbConnection.query(
      `SELECT r.*, u.fullname AS studentName, u.email AS studentEmail ,u.profilepic AS studentprofile
       FROM requests r
       JOIN users u ON r.studentId = u.userid
       WHERE r.instructorId = ?`,
      [instructorId]
    );

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Error fetching instructor requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

const getSingleRequest = async (req, res) => {
  const instructorId = req.user.userid;
  const { requestId } = req.params;

  try {
    const [rows] = await dbConnection.query(
      `SELECT r.*, u.fullname AS studentName, u.email AS studentEmail ,u.profilepic AS studentprofile
       FROM requests r
       JOIN users u ON r.studentId = u.userid
       WHERE r.instructorId = ? AND r.requestId = ?`,
      [instructorId, requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({ request: rows[0] });
  } catch (error) {
    console.error('Error fetching single request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
};

const updateRequestStatus = async (req, res) => {
  const instructorId = req.user.userid;
  const { requestId } = req.params;
  const { status } = req.body; // should be either "accepted" or "rejected"

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const [result] = await dbConnection.query(
      `UPDATE requests
       SET status = ?
       WHERE instructorId = ? AND requestId = ?`,
      [status, instructorId, requestId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found or unauthorized' });
    }

    res.status(200).json({ message: `Request ${status}` 
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
};
// instructor get all accepted requests
const getAcceptedRequestsForInstructor = async (req, res) => {
  const instructorId = req.user.userid; // assuming protectedRoute adds req.user

  try {
    const [acceptedRequests] = await dbConnection.query(
      `SELECT r.*, u.fullname AS studentName, u.email AS studentEmail, u.profilepic AS studentprofile
       FROM requests r
       JOIN users u ON r.studentId = u.userid
       WHERE r.instructorId = ? AND r.status = 'accepted'`,
      [instructorId]
    );

    res.status(200).json({ acceptedRequests });
  } catch (error) {
    console.error("Error fetching accepted requests:", error);
    res.status(500).json({ error: "Failed to fetch accepted requests" });
  }
};
// get singleaccepted request 
const getSingleAcceptedRequest = async (req, res) => {
  const instructorId = req.user.userid;
  const { requestId } = req.params;

  try {
    const [rows] = await dbConnection.query(
      `SELECT r.*, u.fullname AS studentName, u.email AS studentEmail, u.profilepic AS studentprofile
       FROM requests r
       JOIN users u ON r.studentId = u.userid
       WHERE r.instructorId = ? AND r.requestId = ? AND r.status = 'accepted'`,
      [instructorId, requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Accepted request not found' });
    }
// to add to notification table
   const notificationId = uuidv4();
   const message = `Your mentorship request has been ${status} by Instructor ${requestInfo.instructorName}.`;

      await dbConnection.query(
        `INSERT INTO notifications (notificationId, userId, message, link)
        VALUES (?, ?, ?, ?)`,
        [notificationId, requestInfo.studentId, message, "/requests"]
      );
    res.status(200).json({ acceptedRequest: rows[0] });
  } catch (error) {
    console.error('Error fetching single accepted request:', error);
    res.status(500).json({ error: 'Failed to fetch accepted request' });
  }
};


module.exports ={sendRequest,getInstructorRequests,getSingleRequest,updateRequestStatus,getAcceptedRequestsForInstructor,getSingleAcceptedRequest}