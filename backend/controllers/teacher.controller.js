// controllers/teacher.controller.js
 
const { Teacher } = require("../models/Teacher");
const School = require("../models/School");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require('../utils/AppError');
const { sendEmail } = require("../utils/sendEmails");
 
// ── Safe email helper ────────────────────────────────────────────────────────
const trySendEmail = async (opts) => {
  try {
    await sendEmail(opts);
  } catch (err) {
    console.error(`[email] Failed to send to ${opts.to}:`, err.message);
  }
};
 
// ── Reshape flat formData → nested Teacher schema ───────────────────────────
const buildTeacherDoc = (body, schoolId, adminUserId) => ({
  schoolId,
  addedBy: adminUserId,
 
  // Personal
  firstName:    body.firstName?.trim(),
  middleName:   body.middleName?.trim() ?? "",
  lastName:     body.lastName?.trim(),
  dateOfBirth:  body.dateOfBirth,
  gender:       body.gender,
  bloodGroup:   body.bloodGroup,
  nationality:  body.nationality  ?? "",
  religion:     body.religion     ?? "",
  maritalStatus: body.maritalStatus ?? "",
  photo:        body.photo         ?? "",
 
  // Contact
  email:          body.email?.toLowerCase().trim(),
  alternateEmail: body.alternateEmail?.toLowerCase().trim() ?? "",
  phone:          body.phone?.trim(),
  alternatePhone: body.alternatePhone?.trim() ?? "",
 
  address: {
    street:  typeof body.address === "string" ? body.address.trim() : (body.address?.street ?? ""),
    city:    body.city    ?? "",
    state:   body.state   ?? "",
    zipCode: body.zipCode ?? "",
    country: body.country ?? "India",
  },
 
  // Qualifications
  qualifications: {
    highestQualification:     body.highestQualification ?? "",
    university:               body.university ?? "",
    yearOfPassing:            body.yearOfPassing ? Number(body.yearOfPassing) : undefined,
    specialization:           body.specialization ?? "",
    additionalCertifications: body.additionalCertifications ?? "",
    teachingExperience:       body.teachingExperience ? Number(body.teachingExperience) : 0,
    previousSchools:          body.previousSchools ?? "",
  },
 
  // Employment
  employment: {
    department:      body.department     ?? "",
    subjects:        Array.isArray(body.subjects) ? body.subjects : [],
    designation:     body.designation    ?? "",
    employmentType:  body.employmentType ?? "Full-time",
    joinDate:        body.joinDate,
    contractEndDate: body.contractEndDate  || undefined,
    probationPeriod: body.probationPeriod  ? Number(body.probationPeriod) : undefined,
    workingHours:    body.workingHours     ? Number(body.workingHours)    : undefined,
  },
 
  // Salary
  salary: {
    basicSalary:  Number(body.basicSalary) || 0,
    allowances:   Number(body.allowances)  || 0,
    deductions:   Number(body.deductions)  || 0,
    paymentMode:  body.paymentMode ?? "Bank Transfer",
    bankDetails: {
      accountNumber: body.accountNumber ?? "",
      bankName:      body.bankName      ?? "",
      ifscCode:      body.ifscCode      ?? "",
    },
  },
 
  // Emergency Contact
  emergencyContact: {
    name:     body.emergencyContactName     ?? "",
    relation: body.emergencyContactRelation ?? "",
    phone:    body.emergencyContactPhone    ?? "",
    address:  body.emergencyContactAddress  ?? "",
  },
 
  // Documents (frontend uploads files first → gets back URL strings)
  documents: {
    resume:                    body.resumeUrl                    ?? "",
    idProof:                   body.idProofUrl                   ?? "",
    addressProof:              body.addressProofUrl              ?? "",
    qualificationCertificates: body.qualificationCertificatesUrl ?? "",
    experienceCertificates:    body.experienceCertificatesUrl    ?? "",
    policeVerification:        body.policeVerificationUrl        ?? "",
    medicalCertificate:        body.medicalCertificateUrl        ?? "",
  },
 
  // Additional
  additional: {
    skills:       Array.isArray(body.skills)    ? body.skills    : [],
    languages:    Array.isArray(body.languages) ? body.languages : [],
    hobbies:      body.hobbies      ?? "",
    achievements: body.achievements ?? "",
    references:   body.references   ?? "",
    socialMedia: {
      linkedin: body.socialMediaLinks?.linkedin ?? "",
      twitter:  body.socialMediaLinks?.twitter  ?? "",
      website:  body.socialMediaLinks?.website  ?? "",
    },
  },
 
  isActive: true,
});
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/teachers
// ─────────────────────────────────────────────────────────────────────────────
exports.getTeachers = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, search,
    department, designation, employmentType, subject,
  } = req.query;
 
  const query = { schoolId: req.user.schoolId, isActive: true };
 
  if (department)     query["employment.department"]     = department;
  if (designation)    query["employment.designation"]    = designation;
  if (employmentType) query["employment.employmentType"] = employmentType;
  if (subject)        query["employment.subjects"]       = subject;
 
  if (search) {
    const re = { $regex: search, $options: "i" };
    query.$or = [
      { firstName: re }, { lastName: re }, { email: re },
      { teacherId: re }, { "employment.department": re },
    ];
  }
 
  const skip = (Number(page) - 1) * Number(limit);
 
  const [docs, total] = await Promise.all([
    Teacher.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-salary.bankDetails -additional.references")
      .lean(),
    Teacher.countDocuments(query),
  ]);
 
  const totalPages  = Math.ceil(total / Number(limit));
  const totalActive = await Teacher.countDocuments({ schoolId: req.user.schoolId, isActive: true });
 
  res.json({
    success: true,
    data: docs,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages },
    stats: { totalActive },
  });
});
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/teachers/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
  if (!teacher) throw new AppError("Teacher not found", 404);
  res.json({ success: true, data: teacher });
});
 
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/teachers  ← FIXED
// ─────────────────────────────────────────────────────────────────────────────
exports.addTeacher = asyncHandler(async (req, res) => {
  const schoolId    = req.user.schoolId;
  const adminUserId = req.user._id;
 
  // ✅ FIX 1: schoolId missing from admin user account
  // Previously this fell through to School.findById(undefined) → null → 403
  // with a misleading "School not found or inactive" message.
  if (!schoolId) {
    throw new AppError(
      "Your account is not linked to any school. " +
      "Ask a Super Admin to assign a schoolId to your account first.",
      403
    );
  }
 
  const school = await School.findById(schoolId);
 
  // ✅ FIX 2: school was deleted but user record still has old schoolId
  if (!school) {
    throw new AppError(
      "School record not found. Your account may be linked to a deleted school. " +
      "Contact a Super Admin to re-link your account.",
      403
    );
  }
 
  // ✅ FIX 3: school exists but isActive = false — clear actionable message
  if (!school.isActive) {
    throw new AppError(
      `School "${school.name}" is currently inactive. ` +
      "A Super Admin must activate it before teachers can be added.",
      403
    );
  }
 
  // Email uniqueness check within this school
  const existing = await Teacher.findOne({
    email: req.body.email?.toLowerCase().trim(),
    schoolId,
  });
  if (existing) {
    throw new AppError("A teacher with this email already exists in your school.", 409);
  }
 
  const teacherDoc = buildTeacherDoc(req.body, schoolId, adminUserId);
  const teacher    = await Teacher.create(teacherDoc);
 
  // Increment school teacher count
  await School.findByIdAndUpdate(schoolId, { $inc: { teacherCount: 1 } });
 
  // Send welcome email (non-blocking)
  await trySendEmail({
    to:      teacher.email,
    subject: `Welcome to ${school.name} — AcademiaSphere`,
    html: `
      <h2>Welcome, ${teacher.firstName}!</h2>
      <p>You have been added as a teacher at <strong>${school.name}</strong>.</p>
      <p><strong>Teacher ID:</strong> ${teacher.teacherId}</p>
      <p><strong>Department:</strong> ${teacher.employment?.department}</p>
      <p>Your login credentials will be shared separately.</p>
    `,
  });
 
  res.status(201).json({
  success: true,
  message: "Teacher added successfully",
  data: teacher,      // ← return full teacher doc
  teacher: teacher,   // ← keep both keys so frontend works either way
});
});
 
// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/teachers/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.updateTeacher = asyncHandler(async (req, res) => {
  ["employeeId", "schoolId", "userId", "teacherId"].forEach((f) => delete req.body[f]);
 
  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
 
  if (!teacher) throw new AppError("Teacher not found", 404);
 
  res.json({ success: true, message: "Teacher updated successfully", data: teacher });
});
 
// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/teachers/:id  (soft delete)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { isActive: false },
    { new: true }
  );
 
  if (!teacher) throw new AppError("Teacher not found", 404);
 
  await School.findByIdAndUpdate(req.user.schoolId, { $inc: { teacherCount: -1 } });
 
  res.json({ success: true, message: "Teacher deactivated successfully" });
});
 
// ── Additional Endpoints ─────────────────────────────────────────────────────
 
exports.getSubjectsList = asyncHandler(async (req, res) => {
  const subjects = await Teacher.distinct("employment.subjects", {
    schoolId: req.user.schoolId, isActive: true,
  });
  res.json({ success: true, data: subjects.sort() });
});
 
exports.getAvailableTeachers = asyncHandler(async (req, res) => {
  const { subject } = req.query;
  const teachers = await Teacher.find({
    schoolId: req.user.schoolId,
    isActive: true,
    ...(subject && { "employment.subjects": subject }),
  }).select("firstName lastName employment.subjects employment.designation");
  res.json({ success: true, data: teachers });
});
 
exports.getTeacherStats = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const [total, byDepartment, byDesignation] = await Promise.all([
    Teacher.countDocuments({ schoolId, isActive: true }),
    Teacher.aggregate([
      { $match: { schoolId, isActive: true } },
      { $group: { _id: "$employment.department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Teacher.aggregate([
      { $match: { schoolId, isActive: true } },
      { $group: { _id: "$employment.designation", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  res.json({ success: true, stats: { total, byDepartment, byDesignation } });
});
 
exports.getTeacherSchedule = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    _id: req.params.id, schoolId: req.user.schoolId, isActive: true,
  }).select("firstName lastName employment");
 
  if (!teacher) throw new AppError("Teacher not found", 404);
 
  res.json({
    success: true,
    data: { teacherId: teacher._id, name: `${teacher.firstName} ${teacher.lastName}`, schedule: [] },
  });
});
 
exports.assignClasses = asyncHandler(async (req, res) => {
  const { classIds } = req.body;
  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $addToSet: { "employment.subjects": { $each: classIds || [] } } },
    { new: true, runValidators: true }
  );
  if (!teacher) throw new AppError("Teacher not found", 404);
  res.json({ success: true, message: "Classes/subjects assigned successfully", data: teacher });
});
 
exports.uploadTeacherDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: { [`documents.${req.body.documentType || "resume"}`]: req.file.path || req.file.location } },
    { new: true }
  );
  if (!teacher) throw new AppError("Teacher not found", 404);
  res.json({ success: true, message: "Document uploaded successfully", data: { documentUrl: req.file.path || req.file.location } });
});
 