const dbConnection = require("../DB/dbConfig");
const cloudinary = require("../lib/cloudinary");
const { StatusCodes } = require('http-status-codes');
const uuidv4 = require('uuid').v4;

/********************* Create a new question  *************************************/




const postQuestion = async (req, res) => {
  const { question, description, tag, image, voice } = req.body;
  const { userid, fullname } = req.user;

  // Check for at least one content input: question, image, or voice
  if (!question && !image && !voice) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      err: 'Bad Request',
      msg: 'Please provide at least a question, image, or voice input',
    });
  }

  if (!description || !tag) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      err: 'Bad Request',
      msg: 'Description and tag are required',
    });
  }

  try {
    const question_id = uuidv4(); // Generate a unique ID
    let imageUrl = null;
    let voiceUrl = null;

    // Upload image if exists
     if (image) {
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = uploadResponse.secure_url;
        }

    // Upload voice if exists
    if (voice) {
      const uploadRes = await cloudinary.uploader.upload(voice);
      voiceUrl = uploadRes.secure_url;
    }

    // Insert into DB
    const query = `
      INSERT INTO questions 
      (question_id, user_id, fullname, question, description, tag, image, voice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await dbConnection.query(query, [
      question_id,
      userid,
      fullname,
      question || null,
      description,
      tag,
      imageUrl,
      voiceUrl,
    ]);

    res.status(StatusCodes.CREATED).json({
      msg: 'Question created successfully',
      data: {
        userid,
        fullname,
        question_id,
        question,
        image: imageUrl,
        voice: voiceUrl,
        description,
        tag
      },
    });
  } catch (err) {
    console.error('Error posting question:', err.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: 'Internal Server Error',
      msg: 'An unexpected error occurred.',
    });
  }
};

/********************* get questions *************************************/

// get all questions
const allQuestions = async (req, res) => {
  try {
    // Query to get all questions with their user details and tags

    const [questions] = await dbConnection.query(`
      SELECT
        u.fullname AS fullname, 
        q.question_id, 
        q.question, 
        q.description AS content, 
        q.tag ,
        q.image,
        q.voice 
      FROM 
        questions q
      JOIN 
        users u ON q.user_id = u.userid
    `);

    // Handle case where no questions are found
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        err: 'Not Found',
        msg: 'No questions found.',
      });
    }

    // Send the list of questions as the response
    res.status(StatusCodes.OK).json({ questions });
  } catch (err) {
    console.error(err); // Log the entire error for more context

    // Handle server error
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: err.message,
      msg: 'An unexpected error occurred.',
    });
  }
};

//get single question
const getSingleQuestion = async (req, res) => {
  const { question_id } = req.params;

  try {
    // Check if question exists
    const [question] = await dbConnection.query(
      `SELECT fullname, question, description, tag,image,voice, question_id FROM questions q WHERE question_id = ?`,
      [question_id]
    );

    // If question does not exist
    if (question.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'Not Found',
        message: `Question with ID ${question_id} not found`,
      });
    }

   
    res.status(StatusCodes.OK).json({
      question,
    });
  } catch (error) {
    // Handle any other errors (like DB connection issues)
    console.error(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    });
  }
};



module.exports = { postQuestion , allQuestions,getSingleQuestion};
//to do 
// search  question(will be done in front end )
//  like question
