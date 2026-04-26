// routes/assignment.routes.js
const express  = require('express');
const multer   = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  // teacher
  getAll, getStats, create, update, remove, publish,
  getAllSubmissions, getSubmissionsByAssignment,
  gradeSubmission, returnSubmission, bulkDownload,
  // school
  getTeacherSubjects, getSchoolClasses,
  // student
  getAssignments, getAssignment, submitAssignment,
  getMySubmission, saveDraft,
} = require('../controllers/assignment.controller');

// Multer for file uploads (student submit)
const upload = multer({ dest: 'uploads/submissions/' });

// ── Teacher assignments  (mounted at /api/v1/teacher/assignments) ─────────────
const assignmentRouter = express.Router();
assignmentRouter.use(protect, authorize('TEACHER'));

assignmentRouter.get('/stats', getStats);           // GET  /teacher/assignments/stats
assignmentRouter.get('/',      getAll);             // GET  /teacher/assignments
assignmentRouter.post('/',     create);             // POST /teacher/assignments

assignmentRouter.put(   '/:id',         update);   // PUT    /teacher/assignments/:id
assignmentRouter.delete('/:id',         remove);   // DELETE /teacher/assignments/:id
assignmentRouter.patch( '/:id/publish', publish);  // PATCH  /teacher/assignments/:id/publish

// bulk-download MUST be before /:id/submissions so Express doesn't swallow "bulk-download" as a submissionId
assignmentRouter.get('/:id/submissions/bulk-download', bulkDownload);
assignmentRouter.get('/:id/submissions',               getSubmissionsByAssignment);

// Grade lives under assignmentRouter because the frontend calls
//   PUT /teacher/assignments/submissions/:submissionId/grade
assignmentRouter.put('/submissions/:submissionId/grade', gradeSubmission);

// ── Teacher submissions  (mounted at /api/v1/teacher/submissions) ─────────────
const submissionRouter = express.Router();
submissionRouter.use(protect, authorize('TEACHER'));

submissionRouter.get(  '/',                       getAllSubmissions);   // GET   /teacher/submissions
submissionRouter.patch('/:submissionId/return',   returnSubmission);   // PATCH /teacher/submissions/:id/return

// ── School helpers  (mounted at /api/v1/school) ───────────────────────────────
const schoolRouter = express.Router();
schoolRouter.use(protect);

schoolRouter.get('/teachers/:teacherId/subjects', getTeacherSubjects); // GET /school/teachers/:id/subjects
schoolRouter.get('/:schoolId/classes',            getSchoolClasses);   // GET /school/:id/classes
// getSchoolInfo is called by the frontend but has no controller yet — stub it:
schoolRouter.get('/:schoolId/info', (_req, res) =>
  res.json({ success: true, data: { data: {} } })
);

// ── Student assignments  (mounted at /api/v1/student/assignments) ─────────────
const studentAssignmentRouter = express.Router();
studentAssignmentRouter.use(protect, authorize('STUDENT'));

studentAssignmentRouter.get( '/',                getAssignments);                         // GET  /student/assignments
studentAssignmentRouter.get( '/:id',             getAssignment);                          // GET  /student/assignments/:id
studentAssignmentRouter.post('/:id/submit',      upload.array('files', 10), submitAssignment); // POST /student/assignments/:id/submit
studentAssignmentRouter.get( '/:id/submission',  getMySubmission);                        // GET  /student/assignments/:id/submission
studentAssignmentRouter.post('/:id/draft',       saveDraft);                              // POST /student/assignments/:id/draft



module.exports = { assignmentRouter, submissionRouter, schoolRouter, studentAssignmentRouter };