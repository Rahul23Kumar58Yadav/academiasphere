// models/Attendance.js
const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Student',
    required: true,
  },
  status: {
    type:     String,
    enum:     ['present', 'absent', 'late', 'excused', 'holiday'],
    required: true,
  },
  note: { type: String, trim: true },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  schoolId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'School',
    required: true,
  },
  teacherId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Teacher',
    required: true,
  },
  grade:   { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String },              // null = daily general attendance
  date: {
    type:     Date,
    required: true,
  },
  period:       { type: Number, min: 1, max: 9 }, // null = full-day
  academicYear: { type: String, required: true },
  records:      [attendanceRecordSchema],
  isHoliday:    { type: Boolean, default: false },
  holidayName:  { type: String },
  markedAt:     { type: Date, default: Date.now },
  editedAt:     { type: Date },
  editReason:   { type: String },
  editedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// ── Indexes ───────────────────────────────────────────────────────────────
attendanceSchema.index({ schoolId: 1, date: 1, grade: 1, section: 1 });
attendanceSchema.index({ schoolId: 1, date: 1, period: 1, grade: 1, section: 1 }, { unique: true, sparse: true });
attendanceSchema.index({ 'records.studentId': 1, date: 1 });
attendanceSchema.index({ schoolId: 1, academicYear: 1, grade: 1 });
attendanceSchema.index({ teacherId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);