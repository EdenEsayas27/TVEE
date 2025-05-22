const dbConnection = require("../DB/dbConfig");
const { StatusCodes } = require('http-status-codes');
const uuidv4 = require('uuid').v4;



/*************************************** Post answer ********************************************/

const postAnswer = async function (req, res) {
  const { question_id, answer,image,voice } = req.body;
  const { userid, fullname} = req.user; // Assuming user_id is extracted from the authentication middleware

  // Validate answer input
  if (!answer && !image && !voice) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      err: 'Bad Request',
      msg: 'Please provide an answer.',
    });
  }


  try {
    const answer_id = uuidv4(); // Generate a unique answer_id
    let imageUrl = null;
    let voiceUrl = null;
     if (image) {
              const uploadResponse = await cloudinary.uploader.upload(image);
              imageUrl = uploadResponse.secure_url;
            }
    
        // Upload voice if exists
    if (voice) {
          const uploadRes = await cloudinary.uploader.upload(voice);
          voiceUrl = uploadRes.secure_url;
        }
    await dbConnection.query(
      `
      INSERT INTO answers (answer_id, question_id, user_id, fullname, answer,image,voice)
      VALUES (?, ?, ?, ?, ?,?,?)
    `,
      [answer_id, question_id, userid, fullname, answer,imageUrl,voiceUrl]
    );

    res.status(StatusCodes.CREATED).json({
      msg: 'Answer posted successfully.',
      data:{
        userid,
        fullname,
        question_id,
        answer_id,
        answer,
        image:imageUrl,
        voice:voiceUrl,

      }
    });
  } catch (err) {
    console.error('Error posting answer:', err); // Improved logging
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: err.message,
      msg: 'An unexpected error occurred.',
    });
  }
};
// get answers for single question

const answerForQuestion = async function (req, res) {
  const { question_id } = req.params; // Get the question_id from request parameters
  //   console.log('Received question_id:', question_id); // Log received question_id for debugging

  try {
    // Query the database to get answers for the specified question along with usernames
    const [answers] = await dbConnection.query(
      `
      SELECT a.question_id, a.answer_id, a.answer, a.image,a.voice,u.fullname AS fullname, a.user_id
      FROM answers a
      JOIN users u ON a.user_id = u.userid
      WHERE a.question_id = ?;
    `,
      [question_id]
    );

    //  console.log('Fetched Answers:', answers); // Log fetched answers for debugging

    // Check if answers exist
    if (!answers || answers.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        err: 'Not Found',
        msg: 'The requested question has no answers yet.',
      });
    }

    res.status(StatusCodes.OK).json({ answers });
  } catch (err) {
    console.error('Error fetching answers:', err); // Improved logging
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: err.message,
      msg: 'An unexpected error occurred.',
    });
  }
};
module.exports = {postAnswer,answerForQuestion}


//to do 
// like  answer 
// reply to answer