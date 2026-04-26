// routes/uploadRoutes.js
const express    = require('express');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadFile, deleteFile } = require('../controllers/uploadController');
const { protect, authorize }     = require('../middleware/authMiddleware');

const uploadRouter = express.Router();

uploadRouter.use(protect);   // all upload endpoints require login

// POST /api/uploads
// Field name must be "file" — matches what AddTeacher.jsx sends via FormData.append('file', ...)
uploadRouter.post('/', upload.single('file'), uploadFile);

// DELETE /api/uploads/:publicId
// :publicId is base64-encoded because Cloudinary public_ids contain slashes
uploadRouter.delete('/:publicId', authorize('SCHOOL_ADMIN'), deleteFile);

module.exports = uploadRouter;