// backend/controllers/schoolController.js
const crypto = require("crypto");
const School = require("../models/School");
const sendEmail = require("../utils/sendEmails");
const { validationResult } = require("express-validator");

// ── Safe email helper — never throws, just logs ───────────────────────────────
const trySendEmail = async (opts) => {
  try {
    await sendEmail(opts);
  } catch (err) {
    console.error(`[email] Failed to send to ${opts.to}:`, err.message);
    // Registration still succeeds even if email fails
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new school (public — anyone can apply)
// @route   POST /api/schools/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
// controllers/schoolController.js
exports.registerSchool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const {
      schoolName,
      schoolCode,
      city,
      state,
      type, // ← from frontend: school.board
      adminName,
      adminEmail,
      adminPhone,
      password,
    } = req.body;

    if (
      !schoolName?.trim() ||
      !schoolCode?.trim() ||
      !adminEmail?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "School name, code, admin email and password are required",
      });
    }

    const normalizedCode = schoolCode
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .trim();
    const lowerEmail = adminEmail.toLowerCase().trim();

    // Validation
    if (normalizedCode.length < 4 || normalizedCode.length > 10) {
      return res.status(400).json({
        success: false,
        message: "School code must be 4–10 alphanumeric characters.",
      });
    }

    if (
      password.length < 8 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and a number.",
      });
    }

    // Check for duplicates
    const [existingCode, existingEmail] = await Promise.all([
      School.findOne({ schoolCode: normalizedCode }),
      School.findOne({
        $or: [{ email: lowerEmail }, { adminEmail: lowerEmail }],
      }),
    ]);

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "This school code is already taken.",
      });
    }

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "An application with this admin email already exists.",
      });
    }

    // Create School Application (status = pending)
    const school = await School.create({
      name: schoolName.trim(),
      schoolCode: normalizedCode,
      type: type || "CBSE",
      email: lowerEmail,
      phone: adminPhone?.trim(),
      address: { city: city?.trim(), state },
      adminName: adminName.trim(),
      adminEmail: lowerEmail,
      adminPhone: adminPhone?.trim(),
      status: "pending",
      isActive: false,
    });

    // Create SCHOOL_ADMIN user (inactive until approved)
    const User = require("../models/User");
    const adminUser = await User.create({
      name: adminName.trim(),
      email: lowerEmail,
      phone: adminPhone?.trim(),
      password, // hashed by pre-save hook
      role: "SCHOOL_ADMIN",
      schoolId: school._id,
      isActive: false, // ← Important: remains inactive until Super Admin approves
    });

    school.adminUser = adminUser._id;
    await school.save();

    // Send confirmation email to admin
    await trySendEmail({
      to: school.adminEmail,
      subject: "School Application Received - AcademiaSphere",
      html: `
        <p>Hi ${adminName},</p>
        <p>Thank you for registering <strong>${schoolName}</strong>.</p>
        <p>Your application has been received. Our team will review it within 2-3 business days.</p>
        <p><strong>School Code:</strong> ${normalizedCode}</p>
      `,
    });

    return res.status(201).json({
      success: true,
      message:
        "School application submitted successfully. You will be notified once approved.",
      applicationId: school._id,
      schoolCode: normalizedCode,
    });
  } catch (err) {
    console.error("❌ registerSchool error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate entry detected. School code or email may already exist.",
      });
    }

    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message: msg });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all schools (with filters)
// @route   GET /api/schools
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getSchools = async (req, res) => {
  try {
    const { search, city, state, type, page = 1, limit = 12 } = req.query;
    const query = { status: "approved", isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
        { schoolCode: { $regex: search, $options: "i" } },
      ];
    }
    if (city) query["address.city"] = { $regex: city, $options: "i" };
    if (state) query["address.state"] = { $regex: state, $options: "i" };
    if (type) query.type = type;

    const total = await School.countDocuments(query);
    const schools = await School.find(query)
      .select(
        "-setupToken -setupTokenExpire -rejectionReason -approvedBy -rejectedBy",
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      schools,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get pending applications  [Super Admin]
// @route   GET /api/schools/applications
// @access  Private (SUPER_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingApplications = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const query = {};
    if (status !== "all") query.status = status;

    const total = await School.countDocuments(query);
    const applications = await School.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({ success: true, total, applications });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Approve a school application  [Super Admin]
// @route   PUT /api/schools/:id/approve
// @access  Private (SUPER_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
// In schoolController.js
exports.approveSchool = async (req, res) => {
  try {
    const User = require("../models/User");
    const school = await School.findById(req.params.id);

    if (!school) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    if (school.status === "approved") {
      return res
        .status(400)
        .json({ success: false, message: "School is already approved" });
    }

    // Activate the school
    school.status = "approved";
    school.isActive = true;
    school.approvedAt = Date.now();
    school.approvedBy = req.user?._id;

    // Activate the SCHOOL_ADMIN user
    if (school.adminUser) {
      await User.findByIdAndUpdate(school.adminUser, {
        isActive: true,
      });
    }

    await school.save();

    // Send approval email
    await trySendEmail({
      to: school.adminEmail,
      subject: "🎉 Your School Has Been Approved - AcademiaSphere",
      html: `
        <h2>Congratulations!</h2>
        <p>Hi ${school.adminName},</p>
        <p>Your school <strong>${school.name}</strong> has been approved.</p>
        <p>School Code: <strong>${school.schoolCode}</strong></p>
        <p>You can now login using your email and password.</p>
        <a href="${process.env.FRONTEND_URL}/login">Go to Login</a>
      `,
    });

    return res.status(200).json({
      success: true,
      message: `School approved successfully. ${school.adminEmail} can now log in.`,
    });
  } catch (err) {
    console.error("approveSchool error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reject a school application  [Super Admin]
// @route   PUT /api/schools/:id/reject
// @access  Private (SUPER_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectSchool = async (req, res) => {
  try {
    const { reason } = req.body;
    const school = await School.findById(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });

    school.status = "rejected";
    school.isActive = false;
    school.rejectionReason = reason || "Application did not meet requirements.";
    school.rejectedAt = Date.now();
    school.rejectedBy = req.user._id;
    await school.save();

    await trySendEmail({
      to: school.adminEmail,
      subject: "EduSphere — Application Update",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2>Application Status Update</h2>
          <p>Hi <strong>${school.adminName}</strong>,</p>
          <p>After reviewing your application for <strong>${school.name}</strong>,
             we're unable to approve it at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>You may reapply after addressing the above. Contact
             <a href="mailto:support@edusphere.in">support@edusphere.in</a>
             for assistance.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Application rejected. Notification sent.",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Complete account setup after approval (admin sets password)
// @route   POST /api/schools/setup/:token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.completeSetup = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const school = await School.findOne({
      setupToken: hashedToken,
      setupTokenExpire: { $gt: Date.now() },
    });

    if (!school) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired setup link" });
    }

    const User = require("../models/User");
    const adminUser = await User.findById(school.adminUser).select("+password");
    if (!adminUser) {
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    adminUser.password = password;
    school.setupToken = undefined;
    school.setupTokenExpire = undefined;

    await Promise.all([adminUser.save(), school.save()]);

    return res.status(200).json({
      success: true,
      message: "Account setup complete. You can now log in.",
      email: school.adminEmail,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single school by ID or schoolCode
// @route   GET /api/schools/:identifier
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getSchool = async (req, res) => {
  try {
    const { identifier } = req.params;
    const school = await School.findOne({
      $or: [
        { _id: identifier.match(/^[a-f\d]{24}$/i) ? identifier : null },
        { schoolCode: identifier.toUpperCase() },
        { slug: identifier.toLowerCase() },
      ],
      status: "approved",
      isActive: true,
    }).select("-setupToken -setupTokenExpire -adminPhone -adminEmail");

    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    return res.status(200).json({ success: true, school });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update school profile  [SCHOOL_ADMIN]
// @route   PUT /api/schools/:id
// @access  Private (school_admin of that school)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateSchool = async (req, res) => {
  try {
    const allowed = [
      "description",
      "phone",
      "website",
      "logo",
      "address",
      "established",
      "category",
      "schoolType",
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const school = await School.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    return res.status(200).json({ success: true, school });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });

    // SCHOOL_ADMIN may only update their own school
    if (
      req.user.role === "SCHOOL_ADMIN" &&
      school._id.toString() !== req.user.schoolId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to update this school",
      });
    }

    // ── Fields school admin is allowed to change ──────────────────────────────
    const ALLOWED_SCHOOL_ADMIN = [
      // Identity
      "name",
      "affiliation",
      "type",
      "category",
      "schoolType",
      "medium",
      "accreditation",
      "motto",
      "established",
      "logo",
      "description",
      // Contact
      "email",
      "phone",
      "website",
      // Address (nested)
      "address",
      // Stats / counts
      "totalClasses",
      "totalStaff",
      "maleStudents",
      "femaleStudents",
      "studentTeacherRatio",
      "averageAttendance",
      "passPercentage",
      "feeCollectionRate",
      // Module feature flags
      "features",
    ];

    // SUPER_ADMIN additionally may change plan & status
    const ALLOWED_SUPER_ADMIN = [
      ...ALLOWED_SCHOOL_ADMIN,
      "plan",
      "status",
      "isActive",
      "notes",
      "subscription",
    ];

    const allowed =
      req.user.role === "SUPER_ADMIN"
        ? ALLOWED_SUPER_ADMIN
        : ALLOWED_SCHOOL_ADMIN;

    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    // Sync top-level studentCount / teacherCount from form values
    if (req.body.totalStudents !== undefined)
      updates.studentCount = Number(req.body.totalStudents) || 0;
    if (req.body.totalTeachers !== undefined)
      updates.teacherCount = Number(req.body.totalTeachers) || 0;

    // Nested address merge — don't overwrite fields not sent
    if (updates.address) {
      updates.address = {
        ...(school.address?.toObject?.() ?? {}),
        ...updates.address,
      };
    }

    // Features merge — allow partial feature updates
    if (updates.features) {
      updates.features = {
        ...(school.features?.toObject?.() ?? {}),
        ...updates.features,
      };
    }

    const updated = await School.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    return res.status(200).json({ success: true, school: updated });
  } catch (err) {
    console.error("updateSchool error:", err);

    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message: msg });
    }

    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

