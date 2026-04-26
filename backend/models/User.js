// models/User.js
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  // ✅ unique: true only here — NO schema.index({ email: 1 }) below
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },

  role: {
    type:     String,
    enum:     ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT", "VENDOR"],
    required: true,
  },

  schoolId:   { type: mongoose.Schema.Types.ObjectId, ref: "School" },
  schoolCode: { type: String },

  photo:       { type: String },
  dateOfBirth: { type: Date },
  gender:      { type: String, enum: ["male", "female", "other"] },

  isActive:      { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },

  passwordChangedAt:    { type: Date,   select: false },
  refreshToken:         { type: String, select: false },
  emailVerifyToken:     { type: String, select: false },
  emailVerifyExpires:   { type: Date,   select: false },
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date,   select: false },

  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret:  { type: String,  select: false },

  lastLogin: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ── Indexes — only compound or non-unique ones here ────────────────────────
// email unique index is already created by unique:true above — don't repeat it
userSchema.index({ schoolId: 1, role: 1 });

// ── Hash password before save ──────────────────────────────────────────────
userSchema.pre('save', async function() {
  // 'this' refers to the document being saved
  if (this.isModified('password') && this.password) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  const rawToken    = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetPasswordToken   = hashedToken;
  this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  return rawToken;
};

userSchema.methods.generateEmailVerifyToken = function () {
  const rawToken    = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.emailVerifyToken   = hashedToken;
  this.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return rawToken;
};

module.exports = mongoose.model("User", userSchema);