// backend/routes/classRoutes.js
const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createClass, getClasses, getClass, updateClass, deleteClass,
  addStudent, updateStudent, removeStudent,
  updateSubjects, updateTimetable,
  addAssignment, updateAssignment, deleteAssignment,
  addExam, updateExamResults, deleteExam,
  addAnnouncement, updateAnnouncement, deleteAnnouncement,
  addResource, deleteResource,
  promoteClass, archiveClass, restoreClass, getClassStats,
} = require("../controllers/classController");

router.use(protect);
const SA = authorize("SCHOOL_ADMIN");
const SAT = authorize("SCHOOL_ADMIN", "TEACHER");

// ── Classes ──────────────────────────────────────────────────────────────────
router.route("/").get(SAT, getClasses).post(SA, createClass);
router.route("/:id").get(SAT, getClass).put(SA, updateClass).delete(SA, deleteClass);
router.get("/:id/stats", SAT, getClassStats);

// ── Students ─────────────────────────────────────────────────────────────────
router.post  ("/:id/students",             SA, addStudent);
router.put   ("/:id/students/:studentId",  SA, updateStudent);
router.delete("/:id/students/:studentId",  SA, removeStudent);

// ── Subjects & Timetable ─────────────────────────────────────────────────────
router.put("/:id/subjects",   SA, updateSubjects);
router.put("/:id/timetable",  SA, updateTimetable);

// ── Assignments ──────────────────────────────────────────────────────────────
router.post  ("/:id/assignments",                  SA, addAssignment);
router.put   ("/:id/assignments/:assignmentId",    SA, updateAssignment);
router.delete("/:id/assignments/:assignmentId",    SA, deleteAssignment);

// ── Exams & Results ──────────────────────────────────────────────────────────
router.post  ("/:id/exams",                SA, addExam);
router.put   ("/:id/exams/:examId",        SA, updateExamResults);
router.delete("/:id/exams/:examId",        SA, deleteExam);

// ── Announcements ─────────────────────────────────────────────────────────────
router.post  ("/:id/announcements",                    SAT, addAnnouncement);
router.put   ("/:id/announcements/:announcementId",    SA,  updateAnnouncement);
router.delete("/:id/announcements/:announcementId",    SA,  deleteAnnouncement);

// ── Resources ────────────────────────────────────────────────────────────────
router.post  ("/:id/resources",              SAT, addResource);
router.delete("/:id/resources/:resourceId",  SA,  deleteResource);

// ── System Controls ───────────────────────────────────────────────────────────
router.put("/:id/promote", SA, promoteClass);
router.put("/:id/archive", SA, archiveClass);
router.put("/:id/restore", SA, restoreClass);

module.exports = router;