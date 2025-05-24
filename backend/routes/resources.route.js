const express = require('express');
const router = express.Router();
const{postResource,getAllResources,getResourceById,searchResources,likeOrDislikeResource,getResourceReactions,deletResource,selectresourcebycategory} = require("../controller/resource.controller");

const { protectedRoute } = require("../middleware/authMiddleware.js");

// Post a new resource
router.post('/send', protectedRoute, postResource);
// Get all resources
router.get('/', protectedRoute, getAllResources);
// Get a single resource by ID
router.get('/:resourceId', protectedRoute, getResourceById);
// Search resources 
router.get('/search', protectedRoute, searchResources);
//GET /api/resources/search?title=math
//GET /api/resources/search?category=video
//GET /api/resources/search?resourceId=abc123
//GET /api/resources/search?title=math&category=pdf

// Like or dislike a resource
router.post('/vote/:resourceId', protectedRoute, likeOrDislikeResource);
// Get like/dislike counts for a resource
router.get('/reactions/:resourceId', protectedRoute, getResourceReactions);
// Delete a resource
router.delete('/:resourceId', protectedRoute, deletResource);
// Get resources by category
router.get('/category/:category', protectedRoute, selectresourcebycategory);


module.exports= router;