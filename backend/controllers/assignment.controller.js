// controllers/assignment.controller.js
const mongoose = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const { AppError } = require("../middleware/errorHandler");
const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Student = require("../models/Student");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── TEACHER — ASSIGNMENTS ────────────────────────────────────────────────────

exports.getAll = asyncHandler(async (req, res) => {
  const { subject, grade, status, section } = req.query;
  const filter = { teacherId: req.user._id };
  if (subject) filter.subject = subject;
  if (grade) filter.grade = grade;
  if (status) filter.status = status;
  if (section) filter.sections = section;

  const assignments = await Assignment.find(filter)
    .populate("submissions")
    .populate("graded")
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });
  res.json({ success: true, data: { data: assignments } });
});

exports.getStats = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const now = new Date();

  const [total, published, drafts, overdue] = await Promise.all([
    Assignment.countDocuments({ teacherId }),
    Assignment.countDocuments({ teacherId, status: "published" }),
    Assignment.countDocuments({ teacherId, status: "draft" }),
    Assignment.countDocuments({
      teacherId,
      status: "published",
      dueDate: { $lt: now },
    }),
  ]);

  res.json({
    success: true,
    data: { data: { total, published, drafts, overdue } },
  });
});

exports.create = asyncHandler(async (req, res) => {
  const {
    title,
    subject,
    grade,
    sections,
    description,
    instructions,
    dueDate,
    maxMarks,
    passingMarks,
    assignmentType,
    submissionType,
    allowLateSubmission,
    latePenalty,
    priority,
    difficulty,
    estimatedTime,
    tags,
    learningObjectives,
    rubric,
    attachments,
    resources,
    notifyStudents,
    notifyParents,
    status = "draft",
  } = req.body;

  if (!title || !subject || !grade || !sections?.length || !dueDate)
    throw new AppError(
      "title, subject, grade, sections and dueDate are required",
      422,
    );

  if (Number(passingMarks) > Number(maxMarks))
    throw new AppError("passingMarks cannot exceed maxMarks", 422);

  const assignment = await Assignment.create({
    teacherId: req.user._id,
    teacherName: req.user.name,
    schoolId: req.user.schoolId,
    title,
    subject,
    grade,
    sections,
    description,
    instructions,
    dueDate: new Date(dueDate),
    maxMarks,
    passingMarks,
    assignmentType,
    submissionType,
    allowLateSubmission,
    latePenalty,
    priority,
    difficulty,
    estimatedTime,
    tags,
    learningObjectives,
    rubric,
    attachments,
    resources,
    notifyStudents,
    notifyParents,
    status,
  });

  res.status(201).json({ success: true, data: { data: assignment } });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new AppError("Invalid assignment id", 400);

  const assignment = await Assignment.findOne({
    _id: id,
    teacherId: req.user._id,
  });
  if (!assignment) throw new AppError("Assignment not found", 404);

  const {
    title,
    subject,
    grade,
    sections,
    description,
    instructions,
    dueDate,
    maxMarks,
    passingMarks,
    assignmentType,
    submissionType,
    allowLateSubmission,
    latePenalty,
    priority,
    difficulty,
    estimatedTime,
    tags,
    learningObjectives,
    rubric,
    attachments,
    resources,
    notifyStudents,
    notifyParents,
    status,
  } = req.body;

  if (
    passingMarks != null &&
    maxMarks != null &&
    Number(passingMarks) > Number(maxMarks)
  )
    throw new AppError("passingMarks cannot exceed maxMarks", 422);
  const allowed = [
    "title",
    "subject",
    "grade",
    "sections",
    "description",
    "instructions",
    "maxMarks",
    "passingMarks",
    "assignmentType",
    "submissionType",
    "allowLateSubmission",
    "latePenalty",
    "priority",
    "difficulty",
    "estimatedTime",
    "tags",
    "learningObjectives",
    "rubric",
    "attachments",
    "resources",
    "notifyStudents",
    "notifyParents",
    "status",
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) assignment[key] = req.body[key];
  }
  if (req.body.dueDate) assignment.dueDate = new Date(req.body.dueDate);

  await assignment.save();
  res.json({ success: true, data: { data: assignment } });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new AppError("Invalid assignment id", 400);

  const assignment = await Assignment.findOneAndDelete({
    _id: id,
    teacherId: req.user._id,
  });
  if (!assignment) throw new AppError("Assignment not found", 404);

  await Submission.deleteMany({ assignmentId: id });
  res.json({ success: true, message: "Assignment deleted" });
});

exports.publish = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new AppError("Invalid assignment id", 400);

  const assignment = await Assignment.findOneAndUpdate(
    { _id: id, teacherId: req.user._id },
    { status: "published" },
    { new: true },
  );
  if (!assignment) throw new AppError("Assignment not found", 404);

  res.json({ success: true, data: { data: assignment } });
});

// ─── TEACHER — SUBMISSIONS ────────────────────────────────────────────────────

exports.getAllSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ teacherId: req.user._id })
    .populate("assignmentId", "title subject grade sections dueDate maxMarks")
    .populate("studentId", "name rollNumber")
    .sort({ submittedAt: -1 })
    .lean();

  res.json({ success: true, data: { data: submissions } });
});

exports.getSubmissionsByAssignment = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  if (!isValidId(assignmentId))
    throw new AppError("Invalid assignment id", 400);

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    teacherId: req.user._id,
  });
  if (!assignment) throw new AppError("Assignment not found", 404);

  const submissions = await Submission.find({ assignmentId })
    .populate("studentId", "name rollNumber email avatar")
    .sort({ submittedAt: -1 })
    .lean();

  res.json({ success: true, data: { data: submissions } });
});

exports.gradeSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  if (!isValidId(submissionId))
    throw new AppError("Invalid submission id", 400);

  const { marks, score, feedback } = req.body;
  if (marks == null) throw new AppError("marks is required", 422);

  await Submission.findOneAndUpdate(
    { _id: submissionId, teacherId: req.user._id },
    {
      $set: {
        marks,
        score: score ?? marks,
        feedback: feedback ?? "",
        status: "graded",
        gradedAt: new Date(),
        gradedBy: req.user._id,
      },
    },
    { new: true, runValidators: true },
  )
    .populate("assignmentId", "title maxMarks")
    .populate("studentId", "name rollNumber");

  if (!submission) throw new AppError("Submission not found", 404);
  res.json({ success: true, data: { data: submission } });
});

exports.returnSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  if (!isValidId(submissionId))
    throw new AppError("Invalid submission id", 400);

  const submission = await Submission.findOneAndUpdate(
    { _id: submissionId, teacherId: req.user._id },
    { status: "returned" },
    { new: true },
  );
  if (!submission) throw new AppError("Submission not found", 404);

  res.json({ success: true, data: { data: submission } });
});

exports.bulkDownload = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  if (!isValidId(assignmentId))
    throw new AppError("Invalid assignment id", 400);

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    teacherId: req.user._id,
  });
  if (!assignment) throw new AppError("Assignment not found", 404);

  const submissions = await Submission.find({ assignmentId })
    .populate("studentId", "name rollNumber")
    .lean();

  const files = submissions.flatMap((s) =>
    (s.files ?? []).map((f) => ({
      studentName: s.studentId?.name,
      rollNumber: s.studentId?.rollNumber,
      submittedAt: s.submittedAt,
      fileName: f.name,
      fileUrl: f.url,
      fileType: f.type,
    })),
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="submissions-${assignmentId}.json"`,
  );
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ success: true, data: files });
});

// ─── SCHOOL helpers ───────────────────────────────────────────────────────────

exports.getTeacherSubjects = asyncHandler(async (req, res) => {
  const subjects = await Assignment.distinct("subject", {
    teacherId: req.params.teacherId,
  });
  if (!isValidId(req.params.teacherId))
  throw new AppError('Invalid teacher id', 400);
  res.json({ success: true, data: { data: { subjects } } });
});

exports.getSchoolClasses = asyncHandler(async (req, res) => {
  const [classes, sectionArrays] = await Promise.all([
    Assignment.distinct("grade", { schoolId: req.params.schoolId }),
    Assignment.distinct("sections", { schoolId: req.params.schoolId }),
  ]);
  const sections = [...new Set(sectionArrays.flat())].sort();
  res.json({ success: true, data: { data: { classes, sections } } });
});

// ─── STUDENT — ASSIGNMENTS ────────────────────────────────────────────────────

exports.getAssignments = asyncHandler(async (req, res) => {
  // Look up the student profile to get grade + section
  const studentProfile = await Student.findOne({
    userId: req.user._id,
    schoolId: req.user.schoolId,
    status: "active",
  })
    .select("grade section")
    .lean();

  if (!studentProfile) {
    return res.status(404).json({
      success: false,
      message: "Student profile not found. Contact your school admin.",
    });
  }

  const assignments = await Assignment.find({
    schoolId: req.user.schoolId,
    status: "published",
    grade: studentProfile.grade, // "Grade 9"
    sections: studentProfile.section, // "C"
  })
    .sort({ dueDate: 1 })
    .lean();

  res.json({ success: true, data: { data: assignments } });
});
/**
 * GET /api/v1/student/assignments/:id
 */
exports.getAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new AppError("Invalid id", 400);

  if (req.user.role === "STUDENT") {
    const studentProfile = await Student.findOne({
      userId: req.user._id,
      schoolId: req.user.schoolId,
    })
      .select("grade section")
      .lean();

    if (!studentProfile) throw new AppError("Student profile not found", 404);

    const assignment = await Assignment.findOne({
      _id: id,
      schoolId: req.user.schoolId,
      status: "published",
      grade: studentProfile.grade,
      sections: studentProfile.section,
    }).lean();

    if (!assignment) throw new AppError("Assignment not found", 404);
    return res.json({ success: true, data: { data: assignment } });
  }

  // Teacher / admin fallback
  const assignment = await Assignment.findById(id).lean();
  if (!assignment) throw new AppError("Not found", 404);
  res.json({ success: true, data: { data: assignment } });
});

/**
 * GET /api/v1/student/assignments/:id/submission
 */
exports.getMySubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new AppError("Invalid id", 400);

  const submission = await Submission.findOne({
    assignmentId: id,
    studentId: req.user._id,
  }).lean();

  // Return null gracefully — the SubmitAssignment UI uses null to render the blank form
  res.json({ success: true, data: { data: submission ?? null } });
});

exports.submitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new AppError("Invalid id", 400);

  const studentProfile = await Student.findOne({
    userId: req.user._id,
    schoolId: req.user.schoolId,
  })
    .select("grade section")
    .lean();

  const assignment = await Assignment.findOne({
    _id: id,
    status: "published",
    grade: studentProfile.grade,
    sections: studentProfile.section,
  });
  if (!assignment) throw new AppError("Assignment not found", 404);

  const now = new Date();
  const isLate = now > new Date(assignment.dueDate);
  if (isLate && !assignment.allowLateSubmission)
    throw new AppError(
      "Late submissions are not allowed for this assignment",
      403,
    );

  // Guard: already submitted (not a draft)?
  const existing = await Submission.findOne({
    assignmentId: id,
    studentId: req.user._id,
  });
  if (existing && existing.status !== "draft") {
    throw new AppError("You have already submitted this assignment", 409);
  }

  const { textContent = "", linkUrl = "", comments = "" } = req.body;

  const files = (req.files ?? []).map((f) => ({
    name: f.originalname,
    size: `${(f.size / 1024).toFixed(1)} KB`,
    url: f.path ?? f.location ?? "#",
    type: f.mimetype,
  }));

  const submission = await Submission.findOneAndUpdate(
    { assignmentId: id, studentId: req.user._id },
    {
      $set: {
        files: files.length ? files : (existing?.files ?? []),
        textContent: textContent || (existing?.textContent ?? ""),
        linkUrl: linkUrl || (existing?.linkUrl ?? ""),
        comments: comments || (existing?.comments ?? ""),
        teacherId: assignment.teacherId,
        schoolId: assignment.schoolId,
        submissionType: assignment.submissionType,
        studentName: req.user.name ?? "",
        rollNumber: req.user.rollNumber ?? "",
        isLate,
        status: raw.status === 'submitted' ? 'pending' : (raw.status ?? 'pending'),
 
        submittedAt: now,
      },
      $setOnInsert: { assignmentId: id, studentId: req.user._id },
    },
    { upsert: true, new: true, runValidators: true },
  );

  res.status(201).json({ success: true, data: { data: submission } });
});

exports.saveDraft = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new AppError("Invalid id", 400);

  const { textContent = "", linkUrl = "", comments = "" } = req.body;

  const assignment = await Assignment.findById(id).select("teacherId").lean();
  if (!assignment) throw new AppError("Assignment not found", 404);

  // Don't overwrite a submitted/graded submission with a draft
  if (existing && existing.status !== "draft") {
    return res.json({ success: true, data: { data: existing } });
  }

  const draft = await Submission.findOneAndUpdate(
    // FIX C: filter on natural key only
    { assignmentId: id, studentId: req.user._id },
    {
      $set: {
        textContent,
        linkUrl,
        comments,
        status: "draft",
        schoolId: req.user.schoolId,
        teacherId: existing?.teacherId ?? assignment.teacherId,
      },
      $setOnInsert: {
        // Only written on INSERT (upsert creates new doc)
        assignmentId: id,
        studentId: req.user._id,
        schoolId: req.user.schoolId,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  res.json({ success: true, data: { data: draft } });
});
