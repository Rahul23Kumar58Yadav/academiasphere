
const express = require("express");

// ── Controllers ───────────────────────────────────────────────────────────────
const {
  registerSchool,
  getSchools,
  getSchool,
  getPendingApplications,
  approveSchool,
  rejectSchool,
  completeSetup,
  updateSchool,
} = require("../controllers/Schoolcontroller");

// ── Auth middleware ────────────────────────────────────────────────────────────
const { protect, authorize } = require("../middleware/authMiddleware");

// =============================================================================
// SCHOOL ROUTER
// =============================================================================
const schoolRouter = express.Router();

// ── Super Admin only ──────────────────────────────────────────────────────────
// IMPORTANT: /applications must come BEFORE /:identifier
// otherwise Express matches "applications" as the identifier param.
schoolRouter.get ("applications",    protect, authorize("SUPER_ADMIN"), getPendingApplications);
schoolRouter.put ("/:id/approve",    protect, authorize("SUPER_ADMIN"), approveSchool);
schoolRouter.put ("/:id/reject",     protect, authorize("SUPER_ADMIN"), rejectSchool);

// ── School Admin / Super Admin ────────────────────────────────────────────────
schoolRouter.put ("/:id",            protect, authorize("SCHOOL_ADMIN", "SUPER_ADMIN"), updateSchool);

// ── Public ────────────────────────────────────────────────────────────────────
schoolRouter.get ("/",               getSchools);
schoolRouter.post("/register",       registerSchool);
schoolRouter.post("/setup/:token",   completeSetup);
schoolRouter.get ("/:identifier",    getSchool);   // must stay LAST (catch-all param)

// =============================================================================
// Exports
// =============================================================================
module.exports = schoolRouter;