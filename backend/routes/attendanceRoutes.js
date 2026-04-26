// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

// Import all controllers at once (recommended and clean)
const {
  getTodayStatus,
  getAttendanceSummary,
  getAttendancePredictions,
  getMonthlyReport,
  getStudentAttendance,
  getAttendance,
  markAttendance,
  editAttendance,
  deleteAttendanceRecord,
} = require('../controllers/attendance.controller');

router.get('/today-status',    protect, authorize('SCHOOL_ADMIN'), getTodayStatus);
router.get('/summary',         protect, authorize('SCHOOL_ADMIN', 'TEACHER'), getAttendanceSummary);
router.get('/predictions',     protect, authorize('SCHOOL_ADMIN'), getAttendancePredictions);
router.get('/monthly/:grade/:section', protect, authorize('SCHOOL_ADMIN', 'TEACHER'), getMonthlyReport);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/',                protect, authorize('SCHOOL_ADMIN', 'TEACHER'), getAttendance);

router.post('/mark',           protect, authorize('SCHOOL_ADMIN', 'TEACHER'), markAttendance);
router.put('/:id',             protect, authorize('SCHOOL_ADMIN', 'TEACHER'), editAttendance);
router.delete('/:id',          protect, authorize('SCHOOL_ADMIN'), deleteAttendanceRecord);

module.exports = router;