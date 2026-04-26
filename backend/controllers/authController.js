// controllers/authController.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const School = require("../models/School");
const { validationResult } = require("express-validator");
const { sendEmail } = require("../utils/sendEmails");
// ── Token generators ───────────────────────────────────────────────────────
const signAccess = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

const signRefresh = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  schoolId: user.schoolId,
  emailVerified: user.emailVerified,
  photo: user.photo,
  isActive: user.isActive,
});

const sendTokens = (res, user, statusCode = 200) => {
  // Cookies are already set by the caller before this is called.
  // Only return the user object in the body.
  res.status(statusCode).json({
    success: true,
    user: safeUser(user),
  });
};

// ── POST /api/v1/auth/setup-super-admin ───────────────────────────────────
// One-time only. Blocked permanently once a SUPER_ADMIN exists in the DB.
// Optionally protect with SUPER_ADMIN_SETUP_KEY env var for extra security.
exports.setupSuperAdmin = async (req, res) => {
  try {
    // 1. Block if any SUPER_ADMIN already exists
    const existing = await User.findOne({ role: "SUPER_ADMIN" });
    if (existing) {
      return res.status(403).json({
        success: false,
        message:
          "Super Admin already exists. This endpoint is permanently disabled.",
      });
    }

    // 2. Optional secret key guard (set SUPER_ADMIN_SETUP_KEY in .env)
    const setupKey = process.env.SUPER_ADMIN_SETUP_KEY;
    if (setupKey) {
      const provided = req.headers["x-setup-key"] || req.body.setupKey;
      if (provided !== setupKey) {
        return res.status(401).json({
          success: false,
          message: "Invalid setup key.",
        });
      }
    }

    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
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

    // 3. Create the one and only SUPER_ADMIN
    const superAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password,
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true, // super admin is auto-verified
    });

    console.log(`✅ Super Admin created: ${superAdmin.email}`);

    return sendTokens(res, superAdmin, 201);
  } catch (err) {
    console.error("❌ Setup super admin error:", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    }
    res.status(500).json({
      success: false,
      message: "Error creating super admin.",
      error: err.message,
    });
  }
};

// ── GET /api/v1/auth/super-admin-exists ───────────────────────────────────
// Frontend can call this to decide whether to show the setup page
exports.superAdminExists = async (req, res) => {
  try {
    const exists = await User.exists({ role: "SUPER_ADMIN" });
    res.json({ success: true, exists: Boolean(exists) });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error checking super admin." });
  }
};

// ── POST /api/v1/auth/register ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: valErrors.array()[0].msg,
        errors: valErrors.array(),
      });
    }

    const { name, email, phone, password, role, schoolCode } = req.body;

    const normRole = (role || "").toUpperCase();

    // SUPER_ADMIN cannot self-register — must use /setup-super-admin
    const allowedRoles = ["STUDENT", "TEACHER", "PARENT", "VENDOR"];
    if (!allowedRoles.includes(normRole)) {
      return res.status(400).json({
        success: false,
        message: `Role '${role}' cannot self-register. Contact your administrator.`,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // School lookup for STUDENT / TEACHER
    let schoolId;
    if (["STUDENT", "TEACHER"].includes(normRole)) {
      if (!schoolCode?.trim()) {
        return res.status(400).json({
          success: false,
          message: "School code is required for students and teachers.",
        });
      }
      const school = await School.findOne({
        schoolCode: schoolCode.trim().toUpperCase(),
      });
      if (!school)
        return res.status(404).json({
          success: false,
          message: "School not found. Check your school code.",
        });
      if (!school.isActive)
        return res.status(400).json({
          success: false,
          message: "This school is currently inactive.",
        });
      schoolId = school._id;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password,
      role: normRole,
      schoolId,
      schoolCode: schoolCode?.trim().toUpperCase(),
      isActive: true,
    });

    return sendTokens(res, user, 201);
  } catch (err) {
    console.error("❌ Register error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res
        .status(409)
        .json({ success: false, message: `${field} already exists.` });
    }
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)
        .map((e) => e.message)
        .join(". ");
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({
      success: false,
      message: "Error registering user.",
      error: err.message,
    });
  }
};

// ── POST /api/v1/auth/login ────────────────────────────────────────────────
// ── POST /api/v1/auth/login ────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty())
      return res
        .status(400)
        .json({ success: false, message: valErrors.array()[0].msg });

    const { email, password } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password +twoFactorSecret");

    if (!user || !(await user.comparePassword(password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });

    if (!user.isActive) {
      const message =
        user.role === "SCHOOL_ADMIN"
          ? "Your school is pending approval."
          : "Your account has been deactivated.";
      return res.status(401).json({ success: false, message });
    }

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, purpose: "2fa" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.json({ success: true, requires2FA: true, tempToken });
    }

    // ✅ CALL the top-level functions — no redeclaration
    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    const isProd = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOpts,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOpts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendTokens(res, user);
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Error logging in." });
  }
};

// ── POST /api/v1/auth/refresh ──────────────────────────────────────────────
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // ← Read from cookie

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      );
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive.",
      });
    }

    const newAccessToken = signAccess(user._id);
    const newRefreshToken = signRefresh(user._id);

    // Set new cookies
    const cookieOpts = {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("accessToken", newAccessToken, {
      ...cookieOpts,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOpts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken: newAccessToken, // optional - can remove if using cookies only
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error refreshing token." });
  }
};

// ── POST /api/v1/auth/logout ───────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    if (req.user?._id)
      await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 },
      });
    res.json({ success: true, message: "Logout successful." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error logging out." });
  }
};

// ── GET /api/v1/auth/me ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "schoolId",
      "name schoolCode",
    );
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching user." });
  }
};

// ── GET /api/v1/auth/verify ────────────────────────────────────────────────
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({ success: true, valid: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error verifying token." });
  }
};

// ── POST /api/v1/auth/forgot-password ─────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return the same response to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const rawToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: `<p>Reset your password: <a href="${resetUrl}">Click here</a>. Expires in 10 minutes.</p>`,
      });
    } catch (mailErr) {
      // Roll back the token if email fails so the user can try again
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({ success: false, message: "Email could not be sent." });
    }

    res.json({ success: true, message: "Password reset email sent." });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error processing request." });
  }
};

// ── POST /api/v1/auth/reset-password ──────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token." });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return sendTokens(res, user);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error resetting password." });
  }
};

// ── POST /api/v1/auth/change-password ─────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "Both passwords are required." });

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword)))
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();
    return sendTokens(res, user);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error changing password." });
  }
};

// ── PATCH /api/v1/auth/profile ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "phone", "photo", "dateOfBirth", "gender"];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    );
    res.json({
      success: true,
      message: "Profile updated.",
      user: safeUser(user),
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error updating profile." });
  }
};

exports.refreshToken = exports.refresh;
