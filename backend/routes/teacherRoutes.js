// routes/teacherRoutes.js
const express = require('express');
const {
  getTeachers,
  getTeacherById,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherStats,
  getSubjectsList,
  getAvailableTeachers,
  getTeacherSchedule,
  assignClasses,
  uploadTeacherDocument,
} = require('../controllers/teacher.controller');

const { protect, authorize } = require('../middleware/authMiddleware');

// ── Optional: multer for direct document upload (if you use it) ──────────────
// const { uploadSingle } = require('../middleware/uploadMiddleware');

const teacherRouter = express.Router();

// All routes require authentication
teacherRouter.use(protect);

// ── Collection ───────────────────────────────────────────────────────────────
teacherRouter
  .route('/')
  .get(authorize('SCHOOL_ADMIN', 'TEACHER'), getTeachers)
  .post(authorize('SCHOOL_ADMIN'), addTeacher);

// ── Utility routes (before /:id to avoid param collision) ────────────────────
teacherRouter.get(
  '/stats',
  authorize('SCHOOL_ADMIN'),
  getTeacherStats
);

teacherRouter.get(
  '/subjects',
  authorize('SCHOOL_ADMIN', 'TEACHER'),
  getSubjectsList
);

teacherRouter.get(
  '/available',
  authorize('SCHOOL_ADMIN'),
  getAvailableTeachers
);

// ── Single resource ───────────────────────────────────────────────────────────
teacherRouter
  .route('/:id')
  .get(authorize('SCHOOL_ADMIN', 'TEACHER'), getTeacherById)
  .put(authorize('SCHOOL_ADMIN'), updateTeacher)
  .delete(authorize('SCHOOL_ADMIN'), deleteTeacher);   // soft-delete (sets isActive: false)

// ── Sub-resources ─────────────────────────────────────────────────────────────
teacherRouter.get(
  '/:id/schedule',
  authorize('SCHOOL_ADMIN', 'TEACHER'),
  getTeacherSchedule
);

teacherRouter.put(
  '/:id/classes',
  authorize('SCHOOL_ADMIN'),
  assignClasses
);

// Document upload (uses multer on the middleware side, not multipart in the
// AddTeacher form — that form uploads to /uploads first then sends the URL)
teacherRouter.post(
  '/:id/documents',
  authorize('SCHOOL_ADMIN'),
  // uploadSingle('document'),   ← uncomment if you add multer middleware
  uploadTeacherDocument
);

module.exports = teacherRouter;