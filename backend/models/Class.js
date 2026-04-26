// backend/models/Class.js
const mongoose = require("mongoose");

// ── Timetable slot sub-schema ────────────────────────────────────────────────
const slotSchema = new mongoose.Schema(
  {
    day:       { type: String, required: true, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] },
    period:    { type: Number, required: true, min: 1, max: 12 },
    startTime: { type: String, required: true },  // "09:00"
    endTime:   { type: String, required: true },  // "09:45"
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, trim: true },
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    teacherName: { type: String, trim: true },
    room:        { type: String, trim: true, default: "" },
    type:        { type: String, enum: ["Regular","Lab","PT","Library","Free"], default: "Regular" },
  },
  { _id: true }
);

// ── Subject-teacher assignment sub-schema ────────────────────────────────────
const classSubjectSchema = new mongoose.Schema(
  {
    subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, trim: true, required: true },
    subjectCode: { type: String, trim: true },
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    teacherName: { type: String, trim: true, default: "" },
    maxMarks:    { type: Number, default: 100 },
    passMarks:   { type: Number, default: 33 },
    isElective:  { type: Boolean, default: false },
  },
  { _id: true }
);

// ── Announcement sub-schema ──────────────────────────────────────────────────
const announcementSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    content:   { type: String, required: true, trim: true },
    priority:  { type: String, enum: ["Low","Normal","High","Urgent"], default: "Normal" },
    author:    { type: String, trim: true },
    authorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isPinned:  { type: Boolean, default: false },
  },
  { _id: true }
);

// ── Resource sub-schema ──────────────────────────────────────────────────────
const resourceSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    type:        { type: String, enum: ["Document","Video","Link","Image","Other"], default: "Document" },
    url:         { type: String, trim: true, default: "" },
    subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, trim: true, default: "" },
    uploadedBy:  { type: String, trim: true },
    uploadedAt:  { type: Date, default: Date.now },
    size:        { type: String, default: "" },
  },
  { _id: true }
);

// ── Assignment sub-schema ────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, trim: true },
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    teacherName: { type: String, trim: true },
    dueDate:     { type: Date, required: true },
    maxMarks:    { type: Number, default: 10 },
    status:      { type: String, enum: ["Active","Submitted","Graded","Overdue"], default: "Active" },
    attachmentUrl: { type: String, default: "" },
    createdAt:   { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Exam sub-schema ──────────────────────────────────────────────────────────
const examSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },  // "Unit Test 1"
    type:        { type: String, enum: ["Unit Test","Mid Term","Final","Practical","Assignment","Quiz"], default: "Unit Test" },
    subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, trim: true },
    date:        { type: Date },
    maxMarks:    { type: Number, default: 100 },
    passMarks:   { type: Number, default: 33 },
    results: [
      {
        studentId:   { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        studentName: { type: String, trim: true },
        rollNo:      { type: String, trim: true },
        marksObtained: { type: Number, default: 0 },
        grade:         { type: String, default: "" },
        remarks:       { type: String, default: "" },
        isAbsent:      { type: Boolean, default: false },
      }
    ],
    status: { type: String, enum: ["Scheduled","Ongoing","Completed","Cancelled"], default: "Scheduled" },
  },
  { _id: true }
);

// ── Main Class Schema ────────────────────────────────────────────────────────
const classSchema = new mongoose.Schema(
  {
    schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name:         { type: String, required: [true,"Class name is required"], trim: true },  // "Grade 10", "Class 5"
    section:      { type: String, required: [true,"Section is required"], trim: true, uppercase: true },  // "A","B"
    academicYear: { type: String, required: [true,"Academic year is required"], trim: true },  // "2024-25"
    displayName:  { type: String, trim: true },  // auto: "Grade 10 - A"

    // Class teacher
    classTeacherId:   { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    classTeacherName: { type: String, trim: true, default: "" },

    // Room & capacity
    room:     { type: String, trim: true, default: "" },
    capacity: { type: Number, default: 40, min: 1 },

    // Students (lightweight refs — full details fetched from Student model)
    students: [
      {
        studentId:  { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        name:       { type: String, trim: true },
        rollNo:     { type: String, trim: true },
        gender:     { type: String, enum: ["Male","Female","Other"], default: "Male" },
        photo:      { type: String, default: "" },
        parentName: { type: String, default: "" },
        parentPhone:{ type: String, default: "" },
        parentEmail:{ type: String, default: "" },
        parentRelation: { type: String, default: "" },
        admissionNo:{ type: String, default: "" },
        dob:        { type: Date },
        address:    { type: String, default: "" },
        isActive:   { type: Boolean, default: true },
        note:       { type: String, default: "" },  // internal admin note
      }
    ],

    subjects:      { type: [classSubjectSchema], default: [] },
    timetable:     { type: [slotSchema], default: [] },
    assignments:   { type: [assignmentSchema], default: [] },
    exams:         { type: [examSchema], default: [] },
    announcements: { type: [announcementSchema], default: [] },
    resources:     { type: [resourceSchema], default: [] },

    // System controls
    isActive:   { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    isPromoted: { type: Boolean, default: false },
    promotedTo: { type: String, trim: true, default: "" },
    promotedAt: { type: Date },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    notes: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Auto-generate displayName
classSchema.pre("save", function () {
  if (this.name && this.section) {
    this.displayName = `${this.name.trim()} - ${this.section.trim()}`;
  }
});
// Virtual: student count
classSchema.virtual("studentCount").get(function () {
  return this.students.filter((s) => s.isActive).length;
});

// Compound index — one class+section per school per year
classSchema.index({ schoolId: 1, name: 1, section: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);