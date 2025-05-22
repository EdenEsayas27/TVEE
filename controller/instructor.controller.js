const dbConnection = require("../DB/dbConfig");
const { StatusCodes } = require('http-status-codes');
const uuidv4 = require('uuid').v4;
const cloudinary = require("../lib/cloudinary");

const getAllInstructors= async(req,res)=>{
    try {
        const [instructors]= await dbConnection.query("SELECT * FROM users WHERE role='instructor'");
        if(instructors.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                err: 'Not Found',
                msg: 'No instructors found',
            });

        }
        res.status(200).json({
            instructors
        })
    } catch (error) {
        console.error('Error fetching instructors:', error.message);
        res.status(500).json({error:error.message,
            msg:"internal server error "
        })
    }
}

const searchInstructors = async (req, res) => {
  const searchTerm = req.query.query;

  if (!searchTerm) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      err: 'Bad Request',
      msg: 'Search term is required',
    });
  }

  try {
    const [instructors] = await dbConnection.query(
      `SELECT * FROM users WHERE role = 'instructor' AND 
      (fullname LIKE ? OR field LIKE ?)`,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );

    if (instructors.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        err: 'Not Found',
        msg: 'No matching instructors found',
      });
    }

    res.status(StatusCodes.OK).json({ instructors });
  } catch (error) {
    console.error('Error searching instructors:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      msg: 'Internal server error',
    });
  }
};
const getInstructorById = async (req, res) => {
  const instructorId = req.params.id;

  try {
    const [instructor] = await dbConnection.query(
      `SELECT * FROM users WHERE userid = ? AND role = 'instructor'`,
      [instructorId]
    );

    if (instructor.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        err: 'Not Found',
        msg: 'Instructor not found',
      });
    }

    res.status(StatusCodes.OK).json({ instructor });
  } catch (error) {
    console.error('Error fetching instructor:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      msg: 'Internal server error',
    });
  }
};

module.exports={getAllInstructors,searchInstructors,getInstructorById}