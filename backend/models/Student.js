// models/Student.js
const mongoose = require("mongoose");

const guardianSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  relation: { type: String, enum: ["father", "mother", "guardian"], default: "guardian" },
  phone:    { type: String, required: true },
  email:    { type: String },
}, { _id: false });

const studentSchema = new mongoose.Schema({
  schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  admissionNo: { 
    type: String, 
    unique: true, 
    sparse: true 
  },

  rollNo: { type: String },        // ← No unique here

  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  dob:        { type: Date,   required: true },
  gender:     { type: String, enum: ["male", "female", "other"] },
  photo:      { type: String },
  phone:      { type: String },
  email:      { type: String },

  grade:        { type: String, required: true },
  section:      { type: String, required: true },
  academicYear: { type: String },

  guardians:    [guardianSchema],
  address: {
    street: String, 
    city: String, 
    state: String, 
    pincode: String,
  },

  bloodGroup:     { type: String },
  category:       { type: String },
  religion:       { type: String },
  previousSchool: { type: String },

  feeCategory: {
    type:    String,
    enum:    ["regular", "concession", "free", "scholarship"],
    default: "regular",
  },

  status: {
    type:    String,
    enum:    ["active", "inactive", "transferred", "alumni"],
    default: "active",
  },

  classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },

  attendanceSummary: {
    present:    { type: Number, default: 0 },
    absent:     { type: Number, default: 0 },
    late:       { type: Number, default: 0 },
    total:      { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
  },

  medicalConditions: {
    type: [String],
    default: [],
  },

  documents: [{
    type: String,
    name: String,
    url: String,
    publicId: String,
  }],

  transferDate:    { type: Date },
  transferCertNo:  { type: String },
  admissionDate:   { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Indexes ───────────────────────────────────────────────────────────────
studentSchema.index({ schoolId: 1, grade: 1, section: 1}); 
studentSchema.index({ schoolId: 1, rollNo: 1 }, {
  unique: true,
  sparse: true,   // sparse = ignore documents where rollNo is null/undefined
});
studentSchema.index({ schoolId: 1, status: 1 });
studentSchema.index({ schoolId: 1, academicYear: 1 });
studentSchema.index({ firstName: "text", lastName: "text" });

module.exports = mongoose.model("Student", studentSchema);