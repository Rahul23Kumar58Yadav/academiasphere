// backend/routes/calendarRoutes.js
const express = require("express");
const { body, param } = require("express-validator");

const {
  getEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  bulkCreateEvents,
  exportJSON,
  getUpcoming,
} = require("../controllers/calendarController");  // ← correct import from controller

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All calendar routes require a logged-in user
router.use(protect);

// ── Validation rules ──────────────────────────────────────────────────────────
const eventRules = [
  body("title")
    .notEmpty().withMessage("Title is required").trim(),
  body("category")
    .isIn(["exam", "holiday", "event", "meeting", "sports", "academic"])
    .withMessage("Invalid category"),
  body("startDate")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("startDate must be YYYY-MM-DD"),
  body("endDate")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("endDate must be YYYY-MM-DD"),
  body("allDay").optional().isBoolean(),
  body("startTime").optional({ nullable: true }).matches(/^\d{2}:\d{2}$/).withMessage("Use HH:MM"),
  body("endTime").optional({ nullable: true }).matches(/^\d{2}:\d{2}$/).withMessage("Use HH:MM"),
  body("reminder").optional().isBoolean(),
  body("participants").optional().isArray(),
];

// All fields optional on update (map each rule to .optional())
const updateRules = eventRules.map((r) => r.optional());

const idRule = [param("id").isMongoId().withMessage("Invalid event ID")];

// ── Named/specific routes BEFORE /:id ─────────────────────────────────────────

/** GET /api/v1/calendar/upcoming?days=30 */
router.get(
  "/upcoming",
  authorize("SCHOOL_ADMIN", "TEACHER", "STUDENT"),
  getUpcoming
);

/** GET /api/v1/calendar/export/json?year=2024 */
router.get(
  "/export/json",
  authorize("SCHOOL_ADMIN"),
  exportJSON
);

/** POST /api/v1/calendar/bulk */
router.post(
  "/bulk",
  authorize("SCHOOL_ADMIN"),
  bulkCreateEvents
);

// ── Generic CRUD ──────────────────────────────────────────────────────────────

/** GET  /api/v1/calendar */
router.get(
  "/",
  authorize("SCHOOL_ADMIN", "TEACHER", "STUDENT"),
  getEvents
);

/** POST /api/v1/calendar */
router.post(
  "/",
  authorize("SCHOOL_ADMIN"),
  eventRules,
  createEvent
);

/** GET    /api/v1/calendar/:id */
router.get(
  "/:id",
  idRule,
  authorize("SCHOOL_ADMIN", "TEACHER", "STUDENT"),
  getEvent
);

/** PUT    /api/v1/calendar/:id */
router.put(
  "/:id",
  idRule,
  authorize("SCHOOL_ADMIN"),
  updateRules,
  updateEvent
);

/** DELETE /api/v1/calendar/:id */
router.delete(
  "/:id",
  idRule,
  authorize("SCHOOL_ADMIN"),
  deleteEvent
);

module.exports = router;