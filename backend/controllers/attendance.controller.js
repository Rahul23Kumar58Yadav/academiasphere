// controllers/attendance.controller.js
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const Attendance = require('../models/Attendance');
const { format } = require('date-fns');

// Lazy-loaded SSE broadcaster (prevents circular dependency)
let broadcastFn = null;

const getBroadcastAttendanceUpdate = () => {
  if (!broadcastFn) {
    try {
      const sse = require("../routes/attendanceSSE");
      broadcastFn = sse.broadcastAttendanceUpdate || sse.default?.broadcastAttendanceUpdate;
      if (!broadcastFn) {
        console.warn("[SSE] broadcastAttendanceUpdate not found in attendanceSSE.js");
        broadcastFn = () => {};
      }
    } catch (err) {
      console.warn("[SSE] Could not load attendanceSSE.js. Real-time updates disabled.");
      broadcastFn = () => {};
    }
  }
  return broadcastFn;
};

// Helper – update this with your real logic later
const updateStudentAttendanceSummary = async (schoolId, grade, section, records) => {
  console.log(`[Summary Updated] ${grade}-${section} | ${records.length} records`);
};

// ====================== ROUTE HANDLERS ======================

exports.getTodayStatus = asyncHandler(async (req, res) => {
  const { grade, section } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    schoolId: req.user.schoolId,
    grade,
    section,
    date: today,
  });

  res.json({
    success: true,
    data: attendance ? { marked: true, ...attendance.toObject() } : { marked: false },
  });
});

exports.getAttendanceSummary = asyncHandler(async (req, res) => {
  const { grade, section, month, year } = req.query;
  res.json({
    success: true,
    data: { grade, section, month, year, message: "Summary - implement logic" },
  });
});

exports.getAttendancePredictions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { message: "Predictions coming soon" },
  });
});

exports.getMonthlyReport = asyncHandler(async (req, res) => {
  const { grade, section } = req.params;
  const { month, year } = req.query;
  res.json({
    success: true,
    data: { grade, section, month, year, message: "Monthly report placeholder" },
  });
});

exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const records = await Attendance.find({
    schoolId: req.user.schoolId,
    "records.studentId": studentId,
  }).sort({ date: -1 });

  res.json({ success: true, data: records });
});

exports.getAttendance = asyncHandler(async (req, res) => {
  const { grade, section, date, period } = req.query;
  const query = { schoolId: req.user.schoolId };

  if (grade) query.grade = grade;
  if (section) query.section = section;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    query.date = d;
  }
  if (period) query.period = period;

  const data = await Attendance.find(query).sort({ date: -1 });
  res.json({ success: true, data });
});

// MARK ATTENDANCE
exports.markAttendance = asyncHandler(async (req, res) => {
  const { grade, section, date, records, period, subject, academicYear } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    throw new AppError("Attendance records are required", 400);
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({
    schoolId: req.user.schoolId,
    grade,
    section,
    date: attendanceDate,
    ...(period ? { period } : { period: null }),
  });

  if (existing) {
    throw new AppError("Attendance already marked. Use edit endpoint.", 409);
  }

  const attendance = await Attendance.create({
    schoolId: req.user.schoolId,
    teacherId: req.user.teacherId || req.user._id,
    grade,
    section,
    date: attendanceDate,
    period,
    subject,
    academicYear: academicYear || `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
    records,
  });

  await updateStudentAttendanceSummary(req.user.schoolId, grade, section, records);

  getBroadcastAttendanceUpdate()({ grade, section, date: attendanceDate, subject, period });

  res.status(201).json({
    success: true,
    message: `Attendance marked for Grade ${grade}-${section} on ${format(attendanceDate, "dd MMM yyyy")}`,
    data: attendance,
  });
});

// EDIT ATTENDANCE
exports.editAttendance = asyncHandler(async (req, res) => {
  const { records, editReason } = req.body;

  const attendance = await Attendance.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId,
  });

  if (!attendance) throw new AppError("Attendance record not found", 404);

  attendance.records = records;
  attendance.editedAt = new Date();
  attendance.editReason = editReason || "Manual correction";
  await attendance.save();

  await updateStudentAttendanceSummary(req.user.schoolId, attendance.grade, attendance.section, records);

  getBroadcastAttendanceUpdate()({
    grade: attendance.grade,
    section: attendance.section,
    date: attendance.date,
  });

  res.json({
    success: true,
    message: "Attendance updated successfully.",
    data: attendance,
  });
});

exports.deleteAttendanceRecord = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findOneAndDelete({
    _id: req.params.id,
    schoolId: req.user.schoolId,
  });

  if (!attendance) throw new AppError("Attendance record not found", 404);

  res.json({ success: true, message: "Attendance record deleted successfully" });
});

// ====================== FINAL EXPORT ======================
module.exports = {
  getTodayStatus,
  getAttendanceSummary,
  getAttendancePredictions,
  getMonthlyReport,
  getStudentAttendance,
  getAttendance,
  markAttendance,
  editAttendance,
  deleteAttendanceRecord,
};