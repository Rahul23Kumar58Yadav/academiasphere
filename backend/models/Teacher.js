const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Schema
// ─────────────────────────────────────────────────────────────────────────────

const teacherSchema = new mongoose.Schema(
  {
    // ── School this teacher belongs to ──────────────────────────────────────
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School ID is required"],
      index: true,
    },

    // ── Auto-generated Teacher ID ───────────────────────────────────────────
    teacherId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    // ── Personal Information ────────────────────────────────────────────────
    firstName: { 
      type: String, 
      required: [true, "First name is required"], 
      trim: true 
    },
    middleName: { type: String, trim: true, default: "" },
    lastName: { 
      type: String, 
      required: [true, "Last name is required"], 
      trim: true 
    },
    dateOfBirth: { 
      type: Date, 
      required: [true, "Date of birth is required"] 
    },
    gender: { 
      type: String, 
      required: [true, "Gender is required"], 
      enum: ["Male", "Female", "Other"] 
    },
    bloodGroup: { 
      type: String, 
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] 
    },
    nationality: { type: String, trim: true, default: "" },
    religion: { type: String, trim: true, default: "" },
    maritalStatus: { 
      type: String, 
      enum: ["Single", "Married", "Divorced", "Widowed", ""], 
      default: "" 
    },
    photo: { type: String, default: "" },

    // ── Contact Information ─────────────────────────────────────────────────
    email: { 
      type: String, 
      required: [true, "Email is required"],
      lowercase: true, 
      trim: true, 
     
    },
    alternateEmail: { type: String, lowercase: true, trim: true, default: "" },
    phone: { 
      type: String, 
      required: [true, "Phone is required"], 
      trim: true 
    },
    alternatePhone: { type: String, trim: true, default: "" },

    address: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: { type: String, required: [true, "State is required"], trim: true },
      zipCode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
    },

    // ── Academic Qualifications ─────────────────────────────────────────────
    qualifications: {
      highestQualification: { 
        type: String, 
        required: [true, "Qualification is required"], 
        trim: true 
      },
      university: { 
        type: String, 
        required: [true, "University is required"], 
        trim: true 
      },
      yearOfPassing: { type: Number },
      specialization: { type: String, trim: true, default: "" },
      additionalCertifications: { type: String, trim: true, default: "" },
      teachingExperience: { 
        type: Number, 
        required: [true, "Teaching experience is required"], 
        min: 0 
      },
      previousSchools: { type: String, trim: true, default: "" },
    },

    // ── Employment Details ──────────────────────────────────────────────────
    employment: {
      department: { 
        type: String, 
        required: [true, "Department is required"] 
      },
      subjects: { 
        type: [String], 
        required: [true, "At least one subject is required"],
        validate: { 
          validator: (v) => v.length > 0,
          message: "At least one subject is required" 
        } 
      },
      designation: { 
        type: String, 
        required: [true, "Designation is required"],
        enum: ["Teacher", "Senior Teacher", "Department Head", "Subject Coordinator", "Vice Principal"] 
      },
      employmentType: { 
        type: String, 
        enum: ["Full-time", "Part-time", "Contract", "Temporary"],
        default: "Full-time" 
      },
      joinDate: { 
        type: Date, 
        required: [true, "Join date is required"] 
      },
      contractEndDate: { type: Date },
      probationPeriod: { type: Number, min: 0 }, // in months
      workingHours: { type: Number, min: 0 },    // per week
    },

    // ── Salary & Benefits ───────────────────────────────────────────────────
    salary: {
      basicSalary: { 
        type: Number, 
        required: [true, "Basic salary is required"], 
        min: 0 
      },
      allowances: { type: Number, default: 0, min: 0 },
      deductions: { type: Number, default: 0, min: 0 },
      netSalary: { type: Number },
      paymentMode: { 
        type: String, 
        enum: ["Bank Transfer", "Check", "Cash"], 
        default: "Bank Transfer" 
      },
      bankDetails: {
        accountNumber: { type: String, trim: true, default: "" },
        bankName: { type: String, trim: true, default: "" },
        ifscCode: { type: String, trim: true, default: "" },
      },
    },

    // ── Emergency Contact ───────────────────────────────────────────────────
    emergencyContact: {
      name: { 
        type: String, 
        required: [true, "Emergency contact name is required"], 
        trim: true 
      },
      relation: { type: String, trim: true, default: "" },
      phone: { 
        type: String, 
        required: [true, "Emergency contact phone is required"], 
        trim: true 
      },
      address: { type: String, trim: true, default: "" },
    },

    // ── Documents ───────────────────────────────────────────────────────────
    documents: {
      resume: { type: String, default: "" },
      idProof: { type: String, default: "" },
      addressProof: { type: String, default: "" },
      qualificationCertificates: { type: String, default: "" },
      experienceCertificates: { type: String, default: "" },
      policeVerification: { type: String, default: "" },
      medicalCertificate: { type: String, default: "" },
    },

    // ── Additional Information ──────────────────────────────────────────────
    additional: {
      skills: { type: [String], default: [] },
      languages: { type: [String], default: [] },
      hobbies: { type: String, default: "" },
      achievements: { type: String, default: "" },
      references: { type: String, default: "" },
      socialMedia: {
        linkedin: { type: String, default: "" },
        twitter: { type: String, default: "" },
        website: { type: String, default: "" },
      },
    },

    // ── Status & Links ──────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },   // linked login account
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who added this teacher
  },
  { timestamps: true }
);

// Unique email per school, not globally
teacherSchema.index({ email: 1, schoolId: 1 }, { unique: true });

// ── Pre-save Hooks ───────────────────────────────────────────────────────────
teacherSchema.pre("save", async function () {   // ← remove (next) parameter
  if (!this.isNew || this.teacherId) return;     // ← return instead of next()

  // Collision-resistant: count + timestamp fragment
  const count = await this.constructor.countDocuments({ schoolId: this.schoolId });
  const seq   = String(count + 1).padStart(4, "0");
  const rand  = Math.random().toString(36).slice(2, 5).toUpperCase();
  this.teacherId = `TCH-${seq}-${rand}`;

  if (this.salary) {
    this.salary.netSalary =
      (this.salary.basicSalary || 0) +
      (this.salary.allowances  || 0) -
      (this.salary.deductions  || 0);
  }
  // ← no next() call needed — async hooks resolve automatically
});

// Recalculate netSalary on update
teacherSchema.pre("findOneAndUpdate", function(next) {  // ← this one is sync, keep next()
  const update = this.getUpdate();
  const salaryUpdate = update?.$set?.salary || update?.salary;

  if (salaryUpdate) {
    const net = 
      (salaryUpdate.basicSalary || 0) + 
      (salaryUpdate.allowances || 0) - 
      (salaryUpdate.deductions || 0);

    if (update.$set) {
      update.$set["salary.netSalary"] = net;
    } else {
      update.salary.netSalary = net;
    }
  }
  next();  // ← fine here because this is NOT async
});

// ── Virtuals ────────────────────────────────────────────────────────────────
teacherSchema.virtual("fullName").get(function () {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(" ");
});

teacherSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - new Date(this.dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

teacherSchema.set("toJSON", { virtuals: true });
teacherSchema.set("toObject", { virtuals: true });

// ─────────────────────────────────────────────────────────────────────────────
// Curriculum Schema (Merged)
// ─────────────────────────────────────────────────────────────────────────────

const lessonSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  objectives:  [String],
  duration:    { type: Number },
  resources:   [String],
  status: {
    type: String,
    enum: ["planned", "ongoing", "completed"],
    default: "planned",
  },
  completedAt: { type: Date },
  order:       { type: Number },
}, { _id: true });

const chapterSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  startDate:   { type: Date },
  endDate:     { type: Date },
  lessons:     [lessonSchema],
  order:       { type: Number },
}, { _id: true });

const curriculumSchema = new mongoose.Schema({
  schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  academicYear: { type: String, required: true },
  grade:        { type: String, required: true },
  section:      { type: String },
  subject:      { type: String, required: true },
  board: {
    type: String,
    enum: ["CBSE", "ICSE", "State", "IB", "IGCSE"],
    default: "CBSE",
  },
  chapters:         [chapterSchema],
  totalLessons:     { type: Number, default: 0 },
  completedLessons: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

curriculumSchema.index({ schoolId: 1, grade: 1, subject: 1, academicYear: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// Export Models
// ─────────────────────────────────────────────────────────────────────────────

const Teacher = mongoose.model("Teacher", teacherSchema);
const Curriculum = mongoose.model("Curriculum", curriculumSchema);

module.exports = { Teacher, Curriculum };