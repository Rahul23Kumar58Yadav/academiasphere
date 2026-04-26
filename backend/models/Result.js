// models/Result.js
const mongoose = require('mongoose');

const GRADE_SCALE = [
  { min: 91, grade: 'A+', points: 10 },
  { min: 81, grade: 'A',  points: 9  },
  { min: 76, grade: 'A-', points: 8  },
  { min: 71, grade: 'B+', points: 7  },
  { min: 61, grade: 'B',  points: 6  },
  { min: 51, grade: 'C+', points: 5  },
  { min: 41, grade: 'C',  points: 4  },
  { min: 0,  grade: 'F',  points: 0  },
];

function computeGrade(pct) {
  return GRADE_SCALE.find(g => pct >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

const subjectResultSchema = new mongoose.Schema({
  subject:     { type: String, required: true },
  subjectCode: { type: String },
  maxMarks:    { type: Number, required: true, min: 0 },
  written:     { type: Number, required: true, min: 0, default: 0 },
  practical:   { type: Number, min: 0, default: 0 },
  oral:        { type: Number, min: 0, default: 0 },
  total:       { type: Number, min: 0 },         // auto-computed
  grade:       { type: String },                  // auto-computed
  remarks:     { type: String },
  isPassed:    { type: Boolean, default: true },  // auto-computed
}, { _id: false });

const resultSchema = new mongoose.Schema({
  // ── Relations ──────────────────────────────────────────────────────────
  schoolId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'School',
    required: true,
  },
  studentId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Student',
    required: true,
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },

  // ── Exam info ───────────────────────────────────────────────────────────
  academicYear: { type: String, required: true },
  examType: {
    type:     String,
    enum:     ['unit_test', 'half_yearly', 'annual', 'quarterly', 'mock', 'internal'],
    required: true,
  },
  examName: { type: String, required: true, trim: true },
  grade:    { type: String, required: true },
  section:  { type: String, required: true },
  examDate: { type: Date },

  // ── Marks ───────────────────────────────────────────────────────────────
  subjects:      [subjectResultSchema],
  totalMarks:    { type: Number, default: 0 },
  maxTotalMarks: { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  overallGrade:  { type: String },
  rank:          { type: Number },
  isPassed:      { type: Boolean, default: true },
  isAbsent:      { type: Boolean, default: false },

  // ── Remarks ─────────────────────────────────────────────────────────────
  teacherRemarks:   { type: String },
  principalRemarks: { type: String },

  // ── Publishing ──────────────────────────────────────────────────────────
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, {
  timestamps: true,
});

// ── Pre-save: auto-compute totals, grades, pass/fail ─────────────────────
resultSchema.pre('save', function (next) {
  if (!this.subjects || !this.subjects.length) return next();

  let totalObtained = 0;
  let totalMax      = 0;

  this.subjects.forEach(s => {
    s.total    = (s.written || 0) + (s.practical || 0) + (s.oral || 0);
    const pct  = s.maxMarks > 0 ? (s.total / s.maxMarks) * 100 : 0;
    const g    = computeGrade(pct);
    s.grade    = g.grade;
    s.isPassed = g.grade !== 'F';
    totalObtained += s.total;
    totalMax      += s.maxMarks;
  });

  this.totalMarks    = totalObtained;
  this.maxTotalMarks = totalMax;
  this.percentage    = totalMax > 0
    ? Math.round((totalObtained / totalMax) * 1000) / 10
    : 0;

  const overall    = computeGrade(this.percentage);
  this.overallGrade = overall.grade;
  this.isPassed     = this.subjects.every(s => s.isPassed);

  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────
resultSchema.index({ schoolId: 1, academicYear: 1, examType: 1 });
resultSchema.index({ studentId: 1, academicYear: 1 });
resultSchema.index({ schoolId: 1, grade: 1, section: 1, examType: 1, academicYear: 1 });
resultSchema.index({ schoolId: 1, isPublished: 1, publishedAt: -1 });
// Prevent duplicate entry for same student + exam
resultSchema.index(
  { schoolId: 1, studentId: 1, examType: 1, academicYear: 1, grade: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model('Result', resultSchema);