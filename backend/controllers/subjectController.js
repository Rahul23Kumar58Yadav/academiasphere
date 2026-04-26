const Subject = require("../models/Subject");
const Student = require("../models/Student"); // adjust path if needed
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");

const createError = (status, message) => {
  const err = new Error(message);
  err.statusCode = status;
  return err;
};

const normalizeAssignedClasses = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item != null)
    .map((item) => ({
      classId: item.classId || undefined,
      className: (typeof item === "string" ? item : item.className || "").trim(),
    }))
    .filter((cls) => cls.className.length > 0);
};

// ─── helper: resolve schoolId for ANY role ────────────────────────────────────
/**
 * School admins and teachers have schoolId directly on req.user.
 * Students may have it on their Student profile document instead.
 * This helper resolves whichever is available.
 */
const resolveSchoolId = async (req) => {
  // Already on the user object → fastest path
  if (req.user.schoolId) return req.user.schoolId;

  // Try to find it from the Student collection
  const role = (req.user.role || "").toUpperCase();
  if (role === "STUDENT") {
    const student = await Student.findOne({ userId: req.user._id })
      .select("schoolId")
      .lean();
    if (student?.schoolId) return student.schoolId;

    // Some schemas store it as 'school' instead of 'schoolId'
    if (student?.school) return student.school;
  }

  return null; // caller must handle null
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
exports.createSubject = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw createError(400, errors.array()[0].msg);

  const { name, code, description, type, assignedClasses, maxMarks, passMarks } = req.body;
  const schoolId = req.user.schoolId;

  if (!name?.trim() || !code?.trim()) throw createError(400, "Subject name and code are required");

  const normalizedCode = code.toUpperCase().replace(/\s+/g, "").trim();
  const existing = await Subject.findOne({ schoolId, code: normalizedCode });
  if (existing) throw createError(409, `Subject code "${normalizedCode}" already exists`);

  const subject = await Subject.create({
    name: name.trim(),
    code: normalizedCode,
    description: description?.trim() || "",
    type: type || "Core",
    schoolId,
    assignedClasses: normalizeAssignedClasses(assignedClasses),
    maxMarks: Number(maxMarks) || 100,
    passMarks: Number(passMarks) || 33,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: "Subject created successfully", subject });
});

// ─── GET ALL ─────────────────────────────────────────────────────────────────
exports.getSubjects = asyncHandler(async (req, res) => {
  // ── Resolve schoolId for any role (fixes Student 403/empty-result bug) ──
  const schoolId = await resolveSchoolId(req);

  if (!schoolId) {
    // Return empty list rather than a hard error — student may not be enrolled yet
    console.warn(`[getSubjects] Could not resolve schoolId for user ${req.user._id} (role: ${req.user.role})`);
    return res.json({ success: true, total: 0, subjects: [] });
  }

  const { type, classId, search, page = 1, limit = 50 } = req.query;

  const query = { schoolId, isActive: true };
  if (type)    query.type = type;
  if (classId) query["assignedClasses.classId"] = classId;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const total    = await Subject.countDocuments(query);
  const subjects = await Subject.find(query)
    .sort({ name: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, total, subjects });
});

// ─── GET ONE ─────────────────────────────────────────────────────────────────
exports.getSubject = asyncHandler(async (req, res) => {
  const schoolId = await resolveSchoolId(req);
  if (!schoolId) throw createError(403, "Cannot determine school for this user");

  const subject = await Subject.findOne({ _id: req.params.id, schoolId });
  if (!subject) throw createError(404, "Subject not found");

  res.json({ success: true, subject });
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────
exports.updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = req.user.schoolId;

  const subject = await Subject.findOne({ _id: id, schoolId });
  if (!subject) throw createError(404, "Subject not found or access denied");

  const ALLOWED_FIELDS = ["name", "description", "type", "assignedClasses", "maxMarks", "passMarks", "isActive"];
  const updates = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.body.code && req.body.code !== subject.code) {
    const newCode = req.body.code.toUpperCase().replace(/\s+/g, "").trim();
    if (newCode.length < 2) throw createError(400, "Subject code must be at least 2 characters");
    const duplicate = await Subject.findOne({ schoolId, code: newCode, _id: { $ne: subject._id } });
    if (duplicate) throw createError(409, `Subject code "${newCode}" is already in use`);
    updates.code = newCode;
  }

  if (updates.assignedClasses !== undefined) {
    if (!Array.isArray(updates.assignedClasses)) throw createError(400, "assignedClasses must be an array");
    updates.assignedClasses = normalizeAssignedClasses(updates.assignedClasses);
  }

  const updatedSubject = await Subject.findByIdAndUpdate(
    id, { $set: updates }, { new: true, runValidators: true }
  ).populate("createdBy", "name email");

  res.json({ success: true, message: "Subject updated successfully", subject: updatedSubject });
});

// ─── DELETE (soft) ───────────────────────────────────────────────────────────
exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
  if (!subject) throw createError(404, "Subject not found");
  subject.isActive = false;
  await subject.save();
  res.json({ success: true, message: "Subject deleted successfully" });
});

// ─── ASSIGN CLASSES ──────────────────────────────────────────────────────────
exports.assignClasses = asyncHandler(async (req, res) => {
  const { assignedClasses } = req.body;
  if (!Array.isArray(assignedClasses)) throw createError(400, "assignedClasses must be an array");

  const normalized = normalizeAssignedClasses(assignedClasses);
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: { assignedClasses: normalized } },
    { new: true, runValidators: true }
  );
  if (!subject) throw createError(404, "Subject not found");
  res.json({ success: true, subject });
});