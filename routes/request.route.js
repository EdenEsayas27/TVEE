const express = require("express");
const {sendRequest,getInstructorRequests,getSingleRequest,updateRequestStatus,getAcceptedRequestsForInstructor,getSingleAcceptedRequest} = require("../controller/requests.controller.js")
const { protectedRoute } = require("../middleware/authMiddleware.js");
const router = express.Router();

//send request to instructor

router.post('/send/:id', protectedRoute,sendRequest);

// instructor get all accepted requests
router.get('/accepted',protectedRoute,getAcceptedRequestsForInstructor)
// get single accepted request 
router.get('/accepted/:requestId',protectedRoute,getSingleAcceptedRequest)
// instructor get all request 
router.get('/',protectedRoute,getInstructorRequests)
// instructor get single request
router.get('/:requestId',protectedRoute,getSingleRequest)
//update request status to accept or reject
router.patch('/status/:requestId',protectedRoute,updateRequestStatus)






module.exports = router;
