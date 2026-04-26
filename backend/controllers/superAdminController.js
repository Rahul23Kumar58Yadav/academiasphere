// controllers/superAdminController.js
const User = require("../models/User");
const School = require("../models/School");
const mongoose = require("mongoose");

// ── Helpers ────────────────────────────────────────────────────────────────────
const safeUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  schoolId: u.schoolId,
  emailVerified: u.emailVerified,
  photo: u.photo,
  isActive: u.isActive,
  lastLogin: u.lastLogin,
  createdAt: u.createdAt,
});

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// GET /api/v1/super-admin/dashboard
// Returns platform-wide KPI summary used by SuperAdminDashboard.jsx
// ══════════════════════════════════════════════════════════════════════════════
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      totalUsers,
      recentSchools,
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: "active" }),
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "TEACHER" }),
      User.countDocuments(),
      School.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name city state students plan status createdAt"),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalSchools,
          activeSchools,
          totalStudents,
          totalTeachers,
          totalUsers,
        },
        recentSchools,
      },
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error loading dashboard." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SCHOOL APPLICATIONS
// GET  /api/v1/super-admin/applications          — list (filterable by status)
// GET  /api/v1/super-admin/applications/:id      — single detail
// PUT  /api/v1/super-admin/applications/:id/approve
// PUT  /api/v1/super-admin/applications/:id/reject
// ══════════════════════════════════════════════════════════════════════════════
exports.getApplications = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const filter = status === "all" ? {} : { status };

    const [applications, total] = await Promise.all([
      School.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select("-__v"),
      School.countDocuments(filter),
    ]);

    res.json({
      success: true,
      applications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("❌ Get applications error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching applications." });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "Application not found." });
    res.json({ success: true, application: school });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching application." });
  }
};

exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found." });
    }

    if (school.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        message: `School is already ${school.status}.` 
      });
    }

    // === SAFE PLAN FIX ===
    if (!school.subscription) {
      school.subscription = {};
    }
    school.subscription.plan = "free";     // Use lowercase

    school.status = "approved";
    school.isActive = true;
    school.approvedBy = req.user?._id;
    school.approvedAt = new Date();
    school.rejectionReason = undefined;

    const savedSchool = await school.save();

    res.json({
      success: true,
      message: "School approved successfully.",
      school: savedSchool
    });
  } catch (err) {
    console.error("❌ Approve error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error approving application.",
      debug: process.env.NODE_ENV === "development" ? err.message : undefined 
    });
  }
};


// controllers/superAdminController.js

exports.rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    console.log("🔍 [REJECT] Starting reject for ID:", id);
    console.log("🔍 [REJECT] Reason:", reason || "(none)");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid school ID format." });
    }

    // Use findByIdAndUpdate with $set to avoid full validation issues
    const school = await School.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "rejected",
          isActive: false,
          rejectionReason: reason?.trim() || "No reason provided.",
          rejectedBy: req.user?._id,
          rejectedAt: new Date(),
          // Force schoolCode to remain as-is and bypass some validation edge cases
          schoolCode: undefined   // let Mongoose keep existing value
        }
      },
      { 
        new: true,           // return updated document
        runValidators: true  // still run validators but safer
      }
    );

    if (!school) {
      return res.status(404).json({ success: false, message: "School not found." });
    }

    console.log("✅ [REJECT] Success - School rejected:", school._id, "Status:", school.status);

    res.json({
      success: true,
      message: "Application rejected successfully.",
      school
    });
  } catch (err) {
    console.error("❌ [REJECT] Full Error:", err);
    console.error("❌ [REJECT] Error Name:", err.name);
    console.error("❌ [REJECT] Message:", err.message);

    res.status(500).json({
      success: false,
      message: "Error rejecting application.",
      debug: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};
// ══════════════════════════════════════════════════════════════════════════════
// SCHOOLS (full management)
// GET    /api/v1/super-admin/schools             — list with filters/pagination
// GET    /api/v1/super-admin/schools/:id         — detail + students + teachers
// PATCH  /api/v1/super-admin/schools/:id         — edit school fields
// DELETE /api/v1/super-admin/schools/:id         — delete school
// PATCH  /api/v1/super-admin/schools/:id/suspend — suspend/reactivate
// PATCH  /api/v1/super-admin/schools/:id/plan    — change plan
// ══════════════════════════════════════════════════════════════════════════════
exports.getAllSchools = async (req, res) => {
  try {
    const {
      status,
      plan,
      state,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (plan && plan !== "all") filter.plan = plan;
    if (state && state !== "all") filter["address.state"] = state;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
        { schoolCode: { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };

    const [schools, total] = await Promise.all([
      School.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select("-__v"),
      School.countDocuments(filter),
    ]);

    res.json({
      success: true,
      schools,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("❌ Get schools error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching schools." });
  }
};

exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).lean();
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found." });

    const [students, teachers] = await Promise.all([
      User.find({ schoolId: school._id, role: "STUDENT" })
        .select("name email phone isActive createdAt")
        .limit(50),
      User.find({ schoolId: school._id, role: "TEACHER" })
        .select("name email phone isActive createdAt")
        .limit(50),
    ]);

    res.json({ success: true, school, students, teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching school." });
  }
};

exports.updateSchool = async (req, res) => {
  try {
    const allowed = [
      "name",
      "address",
      "phone",
      "email",
      "website",
      "plan",
      "type",
      "category",
      "schoolType",
      "established",
    ];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const school = await School.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found." });

    res.json({ success: true, message: "School updated.", school });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating school." });
  }
};

exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found." });

    // Remove all users belonging to this school
    await User.deleteMany({ schoolId: req.params.id });

    res.json({
      success: true,
      message: "School and all associated users deleted.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting school." });
  }
};

exports.suspendSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found." });

    const isSuspended = school.status === "suspended";
    school.status = isSuspended ? "active" : "suspended";
    school.isActive = isSuspended;
    await school.save();

    res.json({
      success: true,
      message: `School ${isSuspended ? "reactivated" : "suspended"}.`,
      school,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error updating school status." });
  }
};

exports.changeSchoolPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ["free", "basic", "pro", "enterprise", "trial"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan." });
    }

    const school = await School.findByIdAndUpdate(
      req.params.id,
      { $set: { plan } },
      { new: true },
    );
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found." });

    res.json({ success: true, message: `Plan updated to ${plan}.`, school });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error changing plan." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// USERS (platform-wide)
// GET    /api/v1/super-admin/users               — list with filters
// GET    /api/v1/super-admin/users/:id
// POST   /api/v1/super-admin/users               — create any role
// PATCH  /api/v1/super-admin/users/:id
// DELETE /api/v1/super-admin/users/:id
// PATCH  /api/v1/super-admin/users/:id/toggle    — activate / deactivate
// PATCH  /api/v1/super-admin/users/:id/role      — change role
// ══════════════════════════════════════════════════════════════════════════════
exports.getAllUsers = async (req, res) => {
  try {
    const {
      role,
      status,
      schoolId,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query;

    const filter = {};
    if (role && role !== "ALL") filter.role = role;
    if (schoolId) filter.schoolId = schoolId;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("schoolId", "name schoolCode")
        .select("-password -twoFactorSecret -resetPasswordToken"),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users: users.map(safeUser),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching users." });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("schoolId", "name schoolCode")
      .select("-password -twoFactorSecret -resetPasswordToken");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching user." });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, schoolId } = req.body;
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, email, password, and role are required.",
        });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res
        .status(409)
        .json({ success: false, message: "Email already exists." });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password,
      role: role.toUpperCase(),
      schoolId: schoolId || undefined,
      isActive: true,
      emailVerified: true, // SA-created accounts skip email verification
    });

    res
      .status(201)
      .json({ success: true, message: "User created.", user: safeUser(user) });
  } catch (err) {
    console.error("❌ Create user error:", err);
    if (err.code === 11000)
      return res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    res.status(500).json({ success: false, message: "Error creating user." });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const allowed = ["name", "phone", "photo", "isActive", "schoolId"];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User updated.", user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating user." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You cannot delete your own account.",
        });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting user." });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"}.`,
      user: safeUser(user),
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error toggling user status." });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = [
      "STUDENT",
      "TEACHER",
      "PARENT",
      "VENDOR",
      "SCHOOL_ADMIN",
    ];
    if (!validRoles.includes(role?.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: role.toUpperCase() } },
      { new: true },
    ).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({ success: true, message: "Role updated.", user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error changing role." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM ANALYTICS  (PlatformAnalytics.jsx)
// GET /api/v1/super-admin/analytics
// ══════════════════════════════════════════════════════════════════════════════
exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      totalUsers,
      schoolsByPlan,
      schoolsByStatus,
      schoolsByState,
      recentRegistrations,
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: "active" }),
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "TEACHER" }),
      User.countDocuments(),

      // Plan distribution
      School.aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Status distribution
      School.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // Top 10 states by school count
      School.aggregate([
        { $group: { _id: "$address.state", schools: { $sum: 1 } } },
        { $sort: { schools: -1 } },
        { $limit: 10 },
      ]),

      // Registrations last 12 months
      School.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - 1),
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalSchools,
          activeSchools,
          totalStudents,
          totalTeachers,
          totalUsers,
        },
        schoolsByPlan,
        schoolsByStatus,
        schoolsByState,
        recentRegistrations,
      },
    });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching analytics." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ROLES & PERMISSIONS  (RolesPermissions.jsx)
// GET   /api/v1/super-admin/roles
// PUT   /api/v1/super-admin/roles/:roleKey/permissions
// ══════════════════════════════════════════════════════════════════════════════
exports.getRoles = async (req, res) => {
  try {
    // Aggregate live user counts per role
    const counts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const countMap = counts.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    const roles = [
      "SUPER_ADMIN",
      "SCHOOL_ADMIN",
      "TEACHER",
      "STUDENT",
      "PARENT",
      "VENDOR",
    ].map((role) => ({
      role,
      userCount: countMap[role] || 0,
    }));

    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching roles." });
  }
};

exports.updateRolePermissions = async (req, res) => {
  try {
    const { roleKey } = req.params;
    const { permissions } = req.body;

    if (roleKey === "SUPER_ADMIN") {
      return res
        .status(403)
        .json({
          success: false,
          message: "SUPER_ADMIN permissions cannot be modified.",
        });
    }

    // In a full implementation: persist to a RolePermissions collection
    // For now, acknowledge and return the received config
    res.json({
      success: true,
      message: `Permissions saved for ${roleKey}.`,
      roleKey,
      permissions,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error saving permissions." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM SETTINGS
// GET   /api/v1/super-admin/settings
// PATCH /api/v1/super-admin/settings
// ══════════════════════════════════════════════════════════════════════════════
exports.getSettings = async (req, res) => {
  try {
    res.json({
      success: true,
      settings: {
        maintenanceMode: process.env.MAINTENANCE_MODE === "true",
        allowRegistrations: process.env.ALLOW_REGISTRATIONS !== "false",
        platformName: process.env.PLATFORM_NAME || "AcademySphere",
        supportEmail: process.env.SUPPORT_EMAIL || "support@academysphere.in",
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching settings." });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    // In production: persist to a Settings collection or update .env via config service
    res.json({
      success: true,
      message: "Settings updated.",
      settings: req.body,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error updating settings." });
  }
};

exports.setupSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    /*
    const setupKey = req.headers['x-setup-key'];
    if (process.env.SUPER_ADMIN_SETUP_KEY && setupKey !== process.env.SUPER_ADMIN_SETUP_KEY) {
      return res.status(403).json({ success: false, message: "Invalid setup key." });
    }*/

    // Prevent multiple Super Admins (one-time setup)
    const existingSA = await User.findOne({ role: "SUPER_ADMIN" });
    if (existingSA) {
      return res.status(403).json({
        success: false,
        message:
          "Super Admin already exists. This endpoint is permanently disabled.",
      });
    }

    // Create Super Admin (password will be hashed automatically if you have pre-save hook in User model)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password,
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
    });

    // ==================== GENERATE TOKENS ====================
    const jwt = require("jsonwebtoken");

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" },
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    // ========================================================

    res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      user: safeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("❌ Setup Super Admin error:", err);

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    }

    // Safe error response (global errorHandler will also catch if you prefer)
    res.status(500).json({
      success: false,
      message: "Error creating super admin.",
    });
  }
};

exports.checkSuperAdminExists = async (req, res) => {
  try {
    const existingSA = await User.findOne({ role: "SUPER_ADMIN" }).select(
      "_id",
    );

    res.json({
      success: true,
      exists: Boolean(existingSA),
    });
  } catch (err) {
    console.error("❌ Check super admin exists error:", err);
    res.json({
      success: true,
      exists: false, // safe fallback
    });
  }
};
