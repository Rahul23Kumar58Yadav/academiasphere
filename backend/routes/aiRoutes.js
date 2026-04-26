// routes/aiRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/ai.controller');

router.get ('/insights',                 protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), ctrl.getPlatformInsights);
router.get ('/attendance-predictions',   protect, authorize('SCHOOL_ADMIN','TEACHER'), ctrl.getAttendancePredictions);
router.get ('/performance-predictions',  protect, authorize('SCHOOL_ADMIN','TEACHER'), ctrl.getPerformancePredictions);
router.get ('/at-risk-students',         protect, authorize('SCHOOL_ADMIN','TEACHER'), ctrl.getAtRiskStudents);
router.get ('/model-health',             protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), ctrl.getModelHealth);
router.get ('/recommendations/:studentId', protect, ctrl.getStudentRecommendations);
router.post('/chatbot',                  protect, ctrl.chatbot);

module.exports = router;