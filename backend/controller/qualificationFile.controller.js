const dbConnection = require("../DB/dbConfig");
const cloudinary = require("../lib/cloudinary");
const { StatusCodes } = require("http-status-codes");

exports.uploadQualification = async (req, res) => {
  const userId = req.user.userid; 
  const { qualificationfile } = req.body;

  if (!qualificationfile) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please upload your qualification document." });
  }

  try {
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(qualificationfile);
    const fileUrl = uploadResponse.secure_url;

    // Update user record
    await dbConnection.query(
      "UPDATE users SET qualificationfile = ? WHERE userid = ?",
      [fileUrl, userId]
    );

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Qualification uploaded successfully", fileUrl });
  } catch (error) {
    console.error("Error uploading qualification:", error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Error uploading qualification. Try again later." });
  }
};
