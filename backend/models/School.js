const mongoose = require("mongoose");
const crypto = require("crypto");

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas — School
// ─────────────────────────────────────────────────────────────────────────────

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "Pincode must be exactly 6 digits"],
    },
    country: { type: String, default: "India", trim: true },
  },
  { _id: false },
);

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise", "trial"],
      default: "free",
    },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    maxStudents: { type: Number, default: 500 },
    maxTeachers: { type: Number, default: 50 },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// School Schema
// ─────────────────────────────────────────────────────────────────────────────

const schoolSchema = new mongoose.Schema(
  {
    // ── Core Identity ──────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      minlength: [3, "School name must be at least 3 characters"],
      maxlength: [150, "School name must be 150 characters or fewer"],
    },
    schoolCode: {
      type: String,
      required: [true, "School code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, "School code must be at least 4 characters"],
      maxlength: [10, "School code must be 10 characters or fewer"],
      match: [
        /^[A-Z0-9]+$/,
        "School code may only contain uppercase letters and numbers",
      ],
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    // ── Board / Affiliation ────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["CBSE", "ICSE", "State", "IB", "IGCSE", "Other"],
      trim: true,
    },
    affiliation: { type: String, trim: true, maxlength: 150 },
    medium: {
      type: String,
      trim: true,
      enum: ["English", "Hindi", "Bilingual", "Other"],
    },
    accreditation: { type: String, trim: true, maxlength: 100 },
    motto: { type: String, trim: true, maxlength: 200 },

    // ── Academic / HR Stats ────────────────────────────────────────────────
    totalClasses: { type: Number, default: 0, min: 0 },
    totalStaff: { type: Number, default: 0, min: 0 },
    maleStudents: { type: Number, default: 0, min: 0 },
    femaleStudents: { type: Number, default: 0, min: 0 },
    studentTeacherRatio: { type: String, trim: true },
    averageAttendance: { type: Number, default: 0, min: 0, max: 100 },
    passPercentage: { type: Number, default: 0, min: 0, max: 100 },
    feeCollectionRate: { type: Number, default: 0, min: 0, max: 100 },
    studentCount: { type: Number, default: 0, min: 0 },
    teacherCount: { type: Number, default: 0, min: 0 },
    category: { type: String, trim: true }, // Co-Ed, Boys, Girls
    schoolType: { type: String, trim: true }, // Day, Boarding, Day-Boarding
    established: { type: Number, min: 1800, max: new Date().getFullYear() },

    // ── Address & Contact ──────────────────────────────────────────────────
    address: { type: addressSchema, default: () => ({}) },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true, index: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-().]{7,20}$/, "Invalid phone number"],
    },
    website: { type: String, trim: true },
    logo: String,
    description: { type: String, maxlength: 1000 },

    // ── Admin Details ──────────────────────────────────────────────────────
    adminName: { type: String, trim: true },
    adminEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid admin email"],
    },
    adminPhone: { type: String, trim: true },
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── Status & Lifecycle ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },
    isActive: { type: Boolean, default: false, index: true },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, maxlength: 500 },
    suspendedAt: Date,
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    suspensionReason: { type: String, maxlength: 500 },

    setupToken: { type: String, select: false },
    setupTokenExpire: { type: Date, select: false },

    plan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise", "trial"],
      default: "free",
    },
    subscription: { type: subscriptionSchema, default: () => ({}) },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },

    // ── Feature flags ──────────────────────────────────────────────────────
    features: {
      attendance: { type: Boolean, default: true },
      fees: { type: Boolean, default: true },
      performance: { type: Boolean, default: true },
      ai: { type: Boolean, default: false },
      blockchain: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true },
    },

    notes: { type: String, maxlength: 2000 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Virtuals ───────────────────────────────────────────────────────────────
schoolSchema.virtual("trialStatus").get(function () {
  if (!this.trialEndsAt) return "none";
  const msLeft = this.trialEndsAt - Date.now();
  if (msLeft <= 0) return "expired";
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  return daysLeft <= 7 ? "expiring_soon" : "active";
});

schoolSchema.virtual("location").get(function () {
  return (
    [this.address?.city, this.address?.state].filter(Boolean).join(", ") || ""
  );
});

// ── Pre-save ───────────────────────────────────────────────────────────────
schoolSchema.pre("save", async function () {
  if (this.address) {
    if (this.address.city !== undefined) this.city = this.address.city;
    if (this.address.state !== undefined) this.state = this.address.state;
  }
  if (this.isNew && this.name && !this.slug) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let slug = base,
      attempts = 0;
    while (attempts < 10) {
      const exists = await mongoose.model("School").exists({ slug });
      if (!exists) break;
      slug = `${base}-${++attempts}`;
    }
    this.slug = slug;
  }
  if (this.isModified("subscription.plan") && this.subscription?.plan) {
    this.plan = this.subscription.plan;
  }
});

// ── Indexes ────────────────────────────────────────────────────────────────
schoolSchema.index({ status: 1, isActive: 1, createdAt: -1 });
schoolSchema.index({ plan: 1, status: 1 });
schoolSchema.index(
  { name: "text", "address.city": "text", schoolCode: "text" },
  {
    name: "school_text_search",
    weights: { name: 10, schoolCode: 5, "address.city": 3 },
  },
);
schoolSchema.index({ adminEmail: 1 });
schoolSchema.index({ adminUser: 1 });
schoolSchema.index({ slug: 1 }, { sparse: true });

// ── Instance methods ───────────────────────────────────────────────────────
schoolSchema.methods.generateSetupToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.setupToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.setupTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return rawToken;
};
schoolSchema.methods.approve = function (uid) {
  this.status = "approved";
  this.isActive = true;
  this.approvedBy = uid;
  this.approvedAt = new Date();
  this.rejectionReason = undefined;
};
schoolSchema.methods.reject = function (uid, reason) {
  this.status = "rejected";
  this.isActive = false;
  this.rejectedBy = uid;
  this.rejectedAt = new Date();
  this.rejectionReason = reason?.trim() || "No reason provided.";
};
schoolSchema.methods.suspend = function (uid, reason) {
  this.status = "suspended";
  this.isActive = false;
  this.suspendedBy = uid;
  this.suspendedAt = new Date();
  this.suspensionReason = reason?.trim() || undefined;
};
schoolSchema.methods.reactivate = function (uid) {
  this.status = "approved";
  this.isActive = true;
  this.suspendedBy = undefined;
  this.suspendedAt = undefined;
  this.suspensionReason = undefined;
};

// ── Static methods ─────────────────────────────────────────────────────────
schoolSchema.statics.getDashboardKPIs = async function () {
  const [counts] = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        suspended: {
          $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] },
        },
        students: { $sum: "$studentCount" },
        teachers: { $sum: "$teacherCount" },
      },
    },
    { $project: { _id: 0 } },
  ]);
  return (
    counts ?? {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
      students: 0,
      teachers: 0,
    }
  );
};

const School = mongoose.model("School", schoolSchema);

// =============================================================================
// Subject Schema  (merged from models/Subject.js)
// =============================================================================

module.exports = School;
