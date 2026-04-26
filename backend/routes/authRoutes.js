// routes/authRoutes.js
const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");
const {
  superAdminExists,
  register,
  login,
  logout,
  getMe,
  verifyToken,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  refresh,
} = require("../controllers/authController");
const { setupSuperAdmin , checkSuperAdminExists} = require("../controllers/superAdminController");
const { protect } = require("../middleware/authMiddleware");

// ── Validators ─────────────────────────────────────────────────────────────

// Used by /register (STUDENT | TEACHER | PARENT only)
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 3 }).withMessage("Name must be at least 3 characters"),
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone is required")
    .matches(/^\d{10}$/).withMessage("Phone must be 10 digits"),
  body("password").notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
  // ── Role validator: student/teacher/parent only ──
  // SUPER_ADMIN uses /setup-super-admin, SCHOOL_ADMIN uses /schools/register
  body("role")
    .notEmpty().withMessage("Role is required")
    .customSanitizer((v) => (v || "").toUpperCase())
    .isIn(["STUDENT", "TEACHER", "PARENT"])
    .withMessage("Invalid role. School admins register via the school form. Super Admin uses the setup endpoint."),
];

// Used by /setup-super-admin
const setupSuperAdminValidation = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 3 }).withMessage("Name must be at least 3 characters"),
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email").normalizeEmail(),
  body("phone").optional().trim()
    .matches(/^\d{10}$/).withMessage("Phone must be 10 digits"),
  body("password").notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
];

const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email").normalizeEmail(),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword").notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
];

// ── Super Admin setup ──────────────────────────────────────────────────────
// GET  → frontend checks if a SA already exists before showing the setup tab
// POST → creates the SA; blocked automatically once one exists in the DB
router.post("/setup-super-admin",  setupSuperAdminValidation, setupSuperAdmin);
router.get("/super-admin-exists", checkSuperAdminExists);

router.post("/super-admin/login", loginValidation, login);

// ── Public routes ──────────────────────────────────────────────────────────
router.post("/register",        registerValidation,       register);
router.post("/login",           loginValidation,          login);
router.post("/refresh",         refresh);
router.post("/refresh-token",   refresh);                 // legacy alias
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password",  resetPasswordValidation,  resetPassword);

// ── Protected routes ───────────────────────────────────────────────────────
router.use(protect);

router.post ("/logout",          logout);
router.get  ("/me",              getMe);
router.get  ("/verify",          verifyToken);
router.post ("/change-password", changePasswordValidation, changePassword);
router.patch("/profile",         updateProfile);

module.exports = router;