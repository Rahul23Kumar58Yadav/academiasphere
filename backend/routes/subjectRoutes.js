// routes/subjectRoutes.js
const express = require("express");

const {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  assignClasses,
} = require("../controllers/subjectController");

const { protect, authorize } = require("../middleware/authMiddleware");

const subjectRouter = express.Router();

// All routes require authentication
subjectRouter.use(protect);

// Collection routes
subjectRouter
  .route("/")
  .get(authorize("SCHOOL_ADMIN", "TEACHER", "STUDENT"), getSubjects)   // ← STUDENT added
  .post(authorize("SCHOOL_ADMIN"), createSubject);

// Single subject routes
subjectRouter
  .route("/:id")
  .get(authorize("SCHOOL_ADMIN", "TEACHER", "STUDENT"), getSubject)    // ← STUDENT added
  .put(authorize("SCHOOL_ADMIN"), updateSubject)
  .delete(authorize("SCHOOL_ADMIN"), deleteSubject);

// Assign classes (admin-only)
subjectRouter.put(
  "/:id/classes",
  authorize("SCHOOL_ADMIN"),
  assignClasses
);

const safeRoute = (routePath) => {
  try {
    const mod = require(routePath);
    const isRouter =
      typeof mod === "function" ||
      (mod && typeof mod.handle === "function");
    if (!isRouter) {
      console.warn(`⚠️  '${routePath}' did not export a valid router — skipped.`);
      return (_req, _res, next) => next();
    }
    return mod;
  } catch (err) {
    console.error(`❌ FAILED TO LOAD '${routePath}':`, err); // ← change warn to error, log full err
    return (_req, _res, next) => next();
  }
};

module.exports = subjectRouter;