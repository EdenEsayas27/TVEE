const { StatusCodes } = require("http-status-codes");
const { v4: uuidv4 } = require("uuid");
const dbConnection = require("../DB/dbConfig");
const cloudinary = require("cloudinary").v2;

const postResource = async (req, res) => {
  const { title, description, category, file, image, video, voice } = req.body;
  const { userid, fullname } = req.user;

  // Require at least one media type
  if (!file && !image && !video && !voice && !description) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      err: "Bad Request",
      msg: "Please provide at least a file, image, video, voice, or text content",
    });
  }

  if (!title || !category) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      err: "Bad Request",
      msg: "Title and category are required",
    });
  }

  try {
    const resourceId = uuidv4();
    let fileUrl = null;
    let imageUrl = null;
    let videoUrl = null;
    let voiceUrl = null;

    // Uploads to Cloudinary
    if (file) {
      const uploadFile = await cloudinary.uploader.upload(file);
      fileUrl = uploadFile.secure_url;
    }

    if (image) {
      const uploadImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadImage.secure_url;
    }

    if (video) {
      const uploadVideo = await cloudinary.uploader.upload(video);
      videoUrl = uploadVideo.secure_url;
    }

    if (voice) {
      const uploadVoice = await cloudinary.uploader.upload(voice );
      voiceUrl = uploadVoice.secure_url;
    }

    // Save to DB
    const query = `
      INSERT INTO resources 
      (resourceId, instructorId, instructorName, title, description, category, fileUrl, imageUrl, videoUrl, voiceUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await dbConnection.query(query, [
      resourceId,
      userid,
      fullname,
      title,
      description || null,
      category,
      fileUrl,
      imageUrl,
      videoUrl,
      voiceUrl,
    ]);

    res.status(StatusCodes.CREATED).json({
      msg: "Resource posted successfully",
      data: {
        resourceId,
        instructorId: userid,
        instructorName: fullname,
        title,
        category,
        description,
        file: fileUrl,
        image: imageUrl,
        video: videoUrl,
        voice: voiceUrl,
      },
    });
  } catch (err) {
    console.error("Error posting resource:", err.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: "Internal Server Error",
      msg: "Something went wrong while posting the resource",
    });
  }
};


const getAllResources = async (req, res) => {
  try {
    const [resources] = await dbConnection.query(`
      SELECT 
        resourceId,
        instructorId,
        instructorName,
        title,
        description,
        category,
        fileUrl,
        imageUrl,
        videoUrl,
        voiceUrl,
        likes,
        dislikes,
        created_at
      FROM resources
      ORDER BY created_at DESC
    `);

    res.status(StatusCodes.OK).json({
      msg: "Resources fetched successfully",
      count: resources.length,
      resources,
    });
  } catch (error) {
    console.error("Error fetching resources:", error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: "Internal Server Error",
      msg: "Failed to fetch resources",
    });
  }
};



const getResourceById = async (req, res) => {
  const { resourceId } = req.params;

  if (!resourceId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      err: "Bad Request",
      msg: "Resource ID is required",
    });
  }

  try {
    const [[resource]] = await dbConnection.query(
      `
      SELECT 
        resourceId,
        instructorId,
        instructorName,
        title,
        description,
        category,
        fileUrl,
        imageUrl,
        videoUrl,
        voiceUrl,
        likes,
        dislikes,
        created_at
      FROM resources
      WHERE resourceId = ?
      `,
      [resourceId]
    );

    if (!resource) {
      return res.status(StatusCodes.NOT_FOUND).json({
        err: "Not Found",
        msg: "Resource not found",
      });
    }

    res.status(StatusCodes.OK).json({
      msg: "Resource fetched successfully",
      data: resource,
    });
  } catch (error) {
    console.error("Error fetching resource by ID:", error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: "Internal Server Error",
      msg: "Failed to fetch resource",
    });
  }
};


const searchResources = async (req, res) => {
  const { title, resourceId, category } = req.query;

  try {
    let baseQuery = `
      SELECT resourceId, instructorId, instructorName, title, description, category,
             fileUrl, imageUrl, videoUrl, voiceUrl, likes, dislikes, created_at
      FROM resources
      WHERE 1 = 1
    `;
    const queryParams = [];

    if (title) {
      baseQuery += ` AND title LIKE ?`;
      queryParams.push(`%${title}%`);
    }

    if (resourceId) {
      baseQuery += ` AND resourceId = ?`;
      queryParams.push(resourceId);
    }

    if (category) {
      baseQuery += ` AND category = ?`;
      queryParams.push(category);
    }

    const [results] = await dbConnection.query(baseQuery, queryParams);

    res.status(StatusCodes.OK).json({
      msg: "Resources fetched successfully",
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error searching resources:", error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: "Internal Server Error",
      msg: "Failed to search resources",
    });
  }
};


const likeOrDislikeResource = async (req, res) => {
  const { resourceId } = req.params;
  const { action } = req.body; // 'like' or 'dislike'
  const userId = req.user.userid;

  if (!['like', 'dislike'].includes(action)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Invalid action. Use 'like' or 'dislike'."
    });
  }

  try {
    // Check if resource exists
    const [[resource]] = await dbConnection.query(
      `SELECT * FROM resources WHERE resourceId = ?`,
      [resourceId]
    );
    if (!resource) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Resource not found" });
    }

    // Check if user already reacted
    const [[existingVote]] = await dbConnection.query(
      `SELECT * FROM resource_votes WHERE userId = ? AND resourceId = ?`,
      [userId, resourceId]
    );

    let likeCount = resource.likes;
    let dislikeCount = resource.dislikes;

    if (existingVote) {
      if (existingVote.action === action) {
        // Toggle off (remove like or dislike)
        await dbConnection.query(
          `DELETE FROM resource_votes WHERE userId = ? AND resourceId = ?`,
          [userId, resourceId]
        );

        if (action === 'like') likeCount--;
        else dislikeCount--;

        await dbConnection.query(
          `UPDATE resources SET likes = ?, dislikes = ? WHERE resourceId = ?`,
          [likeCount, dislikeCount, resourceId]
        );

        return res.status(StatusCodes.OK).json({
          msg: `${action} removed`,
          likes: likeCount,
          dislikes: dislikeCount,
        });
      } else {
        // Switch vote
        await dbConnection.query(
          `UPDATE resource_votes SET action = ? WHERE userId = ? AND resourceId = ?`,
          [action, userId, resourceId]
        );

        if (action === 'like') {
          likeCount++;
          dislikeCount--;
        } else {
          likeCount--;
          dislikeCount++;
        }

        await dbConnection.query(
          `UPDATE resources SET likes = ?, dislikes = ? WHERE resourceId = ?`,
          [likeCount, dislikeCount, resourceId]
        );

        return res.status(StatusCodes.OK).json({
          msg: `Changed to ${action}`,
          likes: likeCount,
          dislikes: dislikeCount,
        });
      }
    } else {
      // New vote
      await dbConnection.query(
        `INSERT INTO resource_votes (voteId, userId, resourceId, action) VALUES (UUID(), ?, ?, ?)`,
        [userId, resourceId, action]
      );

      if (action === 'like') likeCount++;
      else dislikeCount++;

      await dbConnection.query(
        `UPDATE resources SET likes = ?, dislikes = ? WHERE resourceId = ?`,
        [likeCount, dislikeCount, resourceId]
      );

      return res.status(StatusCodes.OK).json({
        msg: `${action} added`,
        likes: likeCount,
        dislikes: dislikeCount,
      });
    }
  } catch (err) {
    console.error("Error updating vote:", err.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Failed to process vote"
    });
  }
};
const getResourceReactions = async (req, res) => {
  const { resourceId } = req.params;

  try {
    const [[resource]] = await dbConnection.query(
      `SELECT likes, dislikes FROM resources WHERE resourceId = ?`,
      [resourceId]
    );

    if (!resource) {
      return res.status(404).json({ msg: "Resource not found" });
    }

    res.status(200).json({
      resourceId,
      likes: resource.likes,
      dislikes: resource.dislikes,
    });
  } catch (err) {
    console.error("Error getting reactions:", err.message);
    res.status(500).json({ msg: "Failed to get like/dislike counts" });
  }
};
const deletResource = async (req, res) => {
  const { resourceId } = req.params;

  try {
    // Check if resource exists
    const [[resource]] = await dbConnection.query(
      `SELECT * FROM resources WHERE resourceId = ?`,
      [resourceId]
    );
    if (!resource) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Resource not found" });
    }

    // Delete the resource
    await dbConnection.query(
      `DELETE FROM resources WHERE resourceId = ?`,
      [resourceId]
    );

    res.status(StatusCodes.OK).json({ msg: "Resource deleted successfully" });
  } catch (err) {
    console.error("Error deleting resource:", err.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: "Internal Server Error",
      msg: "Failed to delete resource",
    });
  }
};
const selectresourcebycategory = async (req, res) => {
  const { category } = req.params;

  try {
    const [resources] = await dbConnection.query(
      `SELECT * FROM resources WHERE category = ?`,
      [category]
    );

    if (resources.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        err: "Not Found",
        msg: "No resources found in this category",
      });
    }

    res.status(StatusCodes.OK).json({
      msg: "Resources fetched successfully",
      data: resources,
    });
  } catch (err) {
    console.error("Error fetching resources by category:", err.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      err: "Internal Server Error",
      msg: "Failed to fetch resources by category",
    });
  }
};
module.exports = {
  postResource,
  getAllResources,
  getResourceById,
  searchResources,
  likeOrDislikeResource,
  getResourceReactions,
  deletResource,
  selectresourcebycategory,
};










