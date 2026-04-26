const Student    = require("../models/Student");
const Attendance = require("../models/Attendance");
const Result     = require("../models/Result");
const Payment    = require("../models/Fee");
const asyncHandler       = require("../middleware/asyncHandler");
const { AppError }          = require("../middleware/errorHandler");
const { paginate }          = require("../utils/paginate");
const { generateAdmissionNo } = require("../utils/generators");

// ── GET /school-admin/students ─────────────────────────────────────────────
exports.getStudents = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20,
    grade, section, status = "active",
    search, gender, feeCategory,
    sortBy = "firstName", sortOrder = "asc",
    academicYear,
  } = req.query;

  const filter = {
    schoolId: req.user.schoolId,
    ...(status !== "all" && { status }),
    ...(grade        && { grade }),
    ...(section      && { section }),
    ...(gender       && { gender }),
    ...(feeCategory  && { feeCategory }),
    ...(academicYear && { academicYear }),
  };

  if (search) {
    filter.$text = { $search: search };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const result = await paginate(Student, filter, {
    page:  Number(page),
    limit: Number(limit),
    sort,
    populate: [{ path: "classTeacherId", select: "firstName lastName" }],
    select: "-documents -medicalConditions",
  });

  const [totalActive, totalInactive, gradeSummary] = await Promise.all([
    Student.countDocuments({ schoolId: req.user.schoolId, status: "active" }),
    Student.countDocuments({ schoolId: req.user.schoolId, status: "inactive" }),
    Student.aggregate([
      { $match: { schoolId: req.user.schoolId, status: "active" } },
      { $group: { _id: "$grade", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: result.docs,
    pagination: result.pagination,
    stats: { totalActive, totalInactive, gradeSummary },
  });
});

// ── GET /school-admin/students/:id ─────────────────────────────────────────
exports.getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId,
  }).populate("classTeacherId", "firstName lastName phone email");

  if (!student) throw new AppError("Student not found", 404);

  const [attendanceSummary, recentResults, pendingFees] = await Promise.all([
    Attendance.aggregate([
      { $match: { schoolId: req.user.schoolId } },
      { $unwind: "$records" },
      { $match: { "records.studentId": student._id } },
      { $group: { _id: "$records.status", count: { $sum: 1 } } },
    ]),
    Result.find({ studentId: student._id, isPublished: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("examName examType percentage overallGrade"),
    Payment.find({ studentId: student._id, status: { $in: ["pending", "overdue"] } })
      .select("term amount totalPaid status dueDate"),
  ]);

  res.json({
    success: true,
    data: { student, attendanceSummary, recentResults, pendingFees },
  });
});

// ── POST /school-admin/students/enroll ─────────────────────────────────────
exports.enrollStudent = asyncHandler(async (req, res) => {
  const {
    firstName, lastName, dob, gender, phone, email,
    grade, section, academicYear, guardians,
    address, bloodGroup, category, previousSchool,
    feeCategory, medicalConditions, religion,
  } = req.body;

  const existing = await Student.findOne({
    schoolId:  req.user.schoolId,
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    dob:       new Date(dob),
  });
  if (existing)
    throw new AppError("A student with the same name and date of birth already exists.", 409);

  const admissionNo = await generateAdmissionNo(req.user.schoolId);

  const student = await Student.create({
    firstName, lastName, dob, gender,
    phone, email, grade, section,
    academicYear: academicYear ||
      `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
    guardians, address, bloodGroup, category,
    previousSchool, feeCategory, medicalConditions, religion,
    schoolId: req.user.schoolId,
    admissionNo,
  });

  res.status(201).json({
    success: true,
    message: "Student enrolled successfully.",
    data: student,
  });
});

// ── PUT /school-admin/students/:id ─────────────────────────────────────────
exports.updateStudent = asyncHandler(async (req, res) => {
  ["rollNo", "admissionNo", "schoolId", "userId"].forEach(f => delete req.body[f]);

  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!student) throw new AppError("Student not found", 404);

  res.json({ success: true, message: "Student updated.", data: student });
});

// ── DELETE /school-admin/students/:id ──────────────────────────────────────
exports.deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: { status: "inactive" } },
    { new: true }
  );
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, message: "Student deactivated." });
});

// ── PATCH /school-admin/students/:id/transfer ──────────────────────────────
exports.transferStudent = asyncHandler(async (req, res) => {
  const { transferDate, transferCertNo } = req.body;
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: { status: "transferred", transferDate, transferCertNo } },
    { new: true }
  );
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, message: "Student marked as transferred.", data: student });
});

// ── POST /school-admin/students/bulk-import ────────────────────────────────
exports.bulkImportStudents = asyncHandler(async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || !students.length)
    throw new AppError("No students provided", 400);

  const results = { success: 0, failed: 0, errors: [] };

  for (const raw of students) {
    try {
      const admissionNo = await generateAdmissionNo(req.user.schoolId);
      await Student.create({ ...raw, schoolId: req.user.schoolId, admissionNo });
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ student: raw?.firstName, error: err.message });
    }
  }

  res.status(207).json({
    success: true,
    message: `Imported ${results.success} students. ${results.failed} failed.`,
    data: results,
  });
});

// ── GET /school-admin/students/grade-sections ──────────────────────────────
exports.getGradeSections = asyncHandler(async (req, res) => {
  const data = await Student.aggregate([
    { $match: { schoolId: req.user.schoolId, status: "active" } },
    { $group: {
      _id:   { grade: "$grade", section: "$section" },
      count: { $sum: 1 },
    }},
    { $sort: { "_id.grade": 1, "_id.section": 1 } },
  ]);
  res.json({ success: true, data });
});

// ── GET /school-admin/students/:id/full-report ─────────────────────────────
exports.getStudentFullReport = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId,
  });
  if (!student) throw new AppError("Student not found", 404);

  const [allResults, allAttendance, allPayments] = await Promise.all([
    Result.find({ studentId: student._id }).sort({ createdAt: -1 }),
    Attendance.find({ schoolId: req.user.schoolId, "records.studentId": student._id })
      .sort({ date: -1 })
      .limit(100)
      .select("date records.$ grade section"),
    Payment.find({ studentId: student._id }).sort({ createdAt: -1 }),
  ]);

  res.json({ success: true, data: { student, allResults, allAttendance, allPayments } });
});

// ── POST /school-admin/students/promote ────────────────────────────────────
exports.promoteStudents = asyncHandler(async (req, res) => {
  const { fromGrade, fromSection, toGrade, toSection, academicYear, studentIds } = req.body;

  const filter = { schoolId: req.user.schoolId, status: "active" };
  if (studentIds?.length) {
    filter._id = { $in: studentIds };
  } else {
    filter.grade   = fromGrade;
    filter.section = fromSection;
  }

  const result = await Student.updateMany(filter, {
    $set: { grade: toGrade, section: toSection, academicYear },
  });

  res.json({
    success: true,
    message: `${result.modifiedCount} students promoted to Grade ${toGrade}-${toSection}.`,
  });
});

// ── POST /school-admin/students/:id/documents ──────────────────────────────
exports.uploadStudentDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const { type, name } = req.body;

  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $push: { documents: { type, name, url: req.file.path, publicId: req.file.filename } } },
    { new: true }
  );
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, message: "Document uploaded.", data: student.documents });
});