// controllers/uploadController.js
const asyncHandler = require('../middleware/asyncHandler');
const AppError     = require('../utils/AppError');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads
// Accepts:  multipart/form-data  { file: <binary>, field?: string }
// Returns:  { success, url, publicId, filename, size, mimetype }
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadFile = asyncHandler(async (req, res) => {
 console.log("=== CLOUDINARY ENV DEBUG START ===");
  console.log("CLOUDINARY_CLOUD_NAME  :", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("CLOUDINARY_API_KEY     :", process.env.CLOUDINARY_API_KEY);
  console.log("CLOUDINARY_API_SECRET length:", process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.length : "MISSING");
  console.log("Current working dir    :", process.cwd());
  console.log("=== CLOUDINARY ENV DEBUG END ===");

  if (!req.file) {
    throw new AppError('No file received. Make sure the field name is "file".', 400);
  }

  // multer-storage-cloudinary attaches these to req.file:
  //   .path        → secure Cloudinary URL  (e.g. https://res.cloudinary.com/…)
  //   .filename    → public_id              (e.g. academysphere/schoolId/resume/xyz)
  //   .originalname, .size, .mimetype
  res.status(200).json({
    success:   true,
    url:       req.file.path,          // ← use this as the stored URL
    publicId:  req.file.filename,      // ← store if you need to delete later
    filename:  req.file.originalname,
    size:      req.file.size,
    mimetype:  req.file.mimetype,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/uploads/:publicId
// Removes a file from Cloudinary by its public_id.
// Useful when a teacher record is deleted or a document is replaced.
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteFile = asyncHandler(async (req, res) => {
  const cloudinary = require('../config/cloudinary');

  // public_id may contain slashes → passed as a base64-encoded param from the client
  const publicId = req.params.publicId
    ? Buffer.from(req.params.publicId, 'base64').toString('utf8')
    : null;

  if (!publicId) throw new AppError('publicId is required', 400);

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new AppError(`Cloudinary deletion failed: ${result.result}`, 500);
  }

  res.status(200).json({
    success: true,
    message: 'File deleted successfully',
    result:  result.result,   // 'ok' or 'not found'
  });
});