// routes/superAdminRoutes.js  (COMPLETE — replace existing file)
const express = require("express");
const router  = express.Router();
const { body, param } = require("express-validator");

const {
  getDashboard,
  getApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  suspendSchool,
  changeSchoolPlan,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changeUserRole,
  getAnalytics,
  getRoles,
  updateRolePermissions,
  getSettings,
  updateSettings,
} = require("../controllers/superAdminController");

const {
  getSuperAdminNotifications      : getNotifications,
  markSuperAdminNotificationRead  : markNotificationRead,
  markAllSuperAdminNotificationsRead : markAllNotificationsRead,
} = require("../controllers/Notification.controller");

const { protect }     = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// ── Every route requires: valid JWT + SUPER_ADMIN role ────────────────────────
router.use(protect);
router.use(requireRole("SUPER_ADMIN"));

// ─── Validators ───────────────────────────────────────────────────────────────
const mongoId = (field = "id") =>
  param(field).isMongoId().withMessage(`${field} must be a valid MongoDB ID`);

const createUserValidation = [
  body("name").trim().notEmpty().isLength({ min: 3 }),
  body("email").trim().isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body("role").isIn(["STUDENT","TEACHER","PARENT","VENDOR","SCHOOL_ADMIN"]),
];

const planValidation = [
  mongoId(),
  body("plan").isIn(["free","basic","pro","enterprise","trial"]),
];

const roleChangeValidation = [
  mongoId(),
  body("role").isIn(["STUDENT","TEACHER","PARENT","VENDOR","SCHOOL_ADMIN"]),
];

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get("/dashboard", getDashboard);

// ─────────────────────────────────────────────────────────────────────────────
// Applications
// ─────────────────────────────────────────────────────────────────────────────
router.get ("/applications",                getApplications);
router.get ("/applications/:id", [mongoId()], getApplicationById);
router.put ("/applications/:id/approve",    approveApplication);
router.put ("/applications/:id/reject",     rejectApplication);

// ─────────────────────────────────────────────────────────────────────────────
// Schools
// ─────────────────────────────────────────────────────────────────────────────
router.get   ("/schools",                          getAllSchools);
router.get   ("/schools/:id",    [mongoId()],      getSchoolById);
router.patch ("/schools/:id",    [mongoId()],      updateSchool);
router.delete("/schools/:id",    [mongoId()],      deleteSchool);
router.patch ("/schools/:id/suspend", [mongoId()], suspendSchool);
router.patch ("/schools/:id/plan",    planValidation, changeSchoolPlan);

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────
router.get   ("/users",                               getAllUsers);
router.get   ("/users/:id",        [mongoId()],       getUserById);
router.post  ("/users",            createUserValidation, createUser);
router.patch ("/users/:id",        [mongoId()],       updateUser);
router.delete("/users/:id",        [mongoId()],       deleteUser);
router.patch ("/users/:id/toggle", [mongoId()],       toggleUserStatus);
router.patch ("/users/:id/role",   roleChangeValidation, changeUserRole);

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────
router.get("/analytics", getAnalytics);

// ─────────────────────────────────────────────────────────────────────────────
// Roles & Permissions
// ─────────────────────────────────────────────────────────────────────────────
router.get("/roles",                         getRoles);
router.put("/roles/:roleKey/permissions",    updateRolePermissions);

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
router.get  ("/settings", getSettings);
router.patch("/settings", updateSettings);

// ─────────────────────────────────────────────────────────────────────────────
// Notifications  (new)
// ─────────────────────────────────────────────────────────────────────────────
router.get  ("/notifications",              getNotifications);
router.patch("/notifications/read-all",     markAllNotificationsRead);
router.patch("/notifications/:id/read",     markNotificationRead);

module.exports = router;