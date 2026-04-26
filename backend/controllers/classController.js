// backend/controllers/classController.js
const Class  = require("../models/Class");
const School = require("../models/School");

// ── helpers ──────────────────────────────────────────────────────────────────
const notFound  = (res, msg = "Class not found") => res.status(404).json({ success: false, message: msg });
const serverErr = (res, err, ctx = "") => {
  console.error(`classController${ctx ? " [" + ctx + "]" : ""}:`, err);

  if (err.message?.includes("next is not a function")) {
    return res.status(500).json({ 
      success: false, 
      message: "Middleware error: Check your pre-save hooks in the schema" 
    });
  }

  if (err.name === "ValidationError") {
    const msg = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ success: false, message: msg });
  }

  if (err.code === 11000) {
    return res.status(400).json({ 
      success: false, 
      message: "A class with this name + section + academic year already exists." 
    });
  }

  return res.status(500).json({ 
    success: false, 
    message: "Server error", 
    error: err.message 
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASSES CRUD
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/classes
// backend/controllers/classController.js
exports.createClass = async (req, res) => {
  try {
    const { name, section, academicYear, classTeacherId, classTeacherName, room, capacity, notes } = req.body;

    // Basic validation
    if (!name?.trim() || !section?.trim() || !academicYear?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name, section, and academic year are required"
      });
    }

    const cls = await Class.create({
      schoolId: req.user.schoolId,                    // ← Must come from auth middleware
      name: name.trim(),
      section: section.trim().toUpperCase(),          // Normalize: "a" → "A"
      academicYear: academicYear.trim(),
      classTeacherId: classTeacherId || undefined,
      classTeacherName: (classTeacherName || "").trim(),
      room: (room || "").trim(),
      capacity: Number(capacity) || 40,
      notes: (notes || "").trim(),
    });

    // Update school counter
    await School.findByIdAndUpdate(req.user.schoolId, { $inc: { totalClasses: 1 } });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: cls
    });

  } catch (err) {
    // Enhanced logging
    console.error("=== CREATE CLASS ERROR ===", {
      name: err.name,
      code: err.code,
      message: err.message,
      keyPattern: err.keyPattern,   // Shows which fields conflicted
      keyValue: err.keyValue
    });

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A class with this **Name + Section + Academic Year** already exists in your school."
      });
    }

    // Reuse your existing helper for other errors
    return serverErr(res, err, "createClass");
  }
};

// GET /api/classes
exports.getClasses = async (req, res) => {
  try {
    const { search, academicYear, isArchived = false, page = 1, limit = 50 } = req.query;

    const query = { 
      schoolId: req.user.schoolId, 
      isArchived: isArchived === "true",
      isActive: true, 
    };

    console.log("=== getClasses Debug ===", {
      userSchoolId: req.user.schoolId,
      isArchived: query.isArchived,
      search,
      academicYear,
      query
    });

    if (academicYear) query.academicYear = academicYear;
    if (search) query.$or = [
      { name: { $regex: search, $options: "i" } },
      { section: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
    ];

    const total = await Class.countDocuments(query);
    const classes = await Class.find(query)
      .select("-timetable -assignments -exams -resources")
      .sort({ name: 1, section: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    console.log(`Found ${classes.length} classes (total ${total})`);

    return res.status(200).json({ success: true, total, classes });
  } catch (err) {
    return serverErr(res, err, "getClasses");
  }
};

// GET /api/classes/:id
exports.getClass = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    return res.status(200).json({ success: true, class: cls });
  } catch (err) { return serverErr(res, err, "getClass"); }
};

// PUT /api/classes/:id
exports.updateClass = async (req, res) => {
  try {
    const ALLOWED = ["name","section","academicYear","classTeacherId","classTeacherName","room","capacity","notes"];
    const updates = {};
    ALLOWED.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { $set: updates }, { new: true, runValidators: true }
    );
    if (!cls) return notFound(res);
    return res.status(200).json({ success: true, message: "Class updated", class: cls });
  } catch (err) { return serverErr(res, err, "updateClass"); }
};

// DELETE /api/classes/:id  (soft-delete)
exports.deleteClass = async (req, res) => {
  try {
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false, isArchived: true, archivedAt: new Date(), archivedBy: req.user._id },
      { new: true }
    );
    if (!cls) return notFound(res);
    await School.findByIdAndUpdate(req.user.schoolId, { $inc: { totalClasses: -1 } });
    return res.status(200).json({ success: true, message: "Class archived" });
  } catch (err) { return serverErr(res, err, "deleteClass"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/classes/:id/students
exports.addStudent = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);

    const { name, rollNo, gender, parentName, parentPhone, parentEmail,
            parentRelation, admissionNo, dob, address, note, photo } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, message: "Student name is required" });

    // Duplicate roll check within class
    if (rollNo && cls.students.some((s) => s.rollNo === rollNo.trim() && s.isActive)) {
      return res.status(400).json({ success: false, message: `Roll number ${rollNo} already exists in this class` });
    }

    cls.students.push({ name: name.trim(), rollNo: rollNo?.trim() || "", gender: gender || "Male",
      parentName: parentName || "", parentPhone: parentPhone || "", parentEmail: parentEmail || "",
      parentRelation: parentRelation || "", admissionNo: admissionNo || "", dob: dob || undefined,
      address: address || "", note: note || "", photo: photo || "", isActive: true });

    await cls.save();
    const added = cls.students[cls.students.length - 1];
    return res.status(201).json({ success: true, message: "Student added", student: added });
  } catch (err) { return serverErr(res, err, "addStudent"); }
};

// PUT /api/classes/:id/students/:studentId
exports.updateStudent = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);

    const student = cls.students.id(req.params.studentId);
    if (!student) return notFound(res, "Student not found");

    const FIELDS = ["name","rollNo","gender","parentName","parentPhone","parentEmail",
                    "parentRelation","admissionNo","dob","address","note","photo","isActive"];
    FIELDS.forEach((k) => { if (req.body[k] !== undefined) student[k] = req.body[k]; });

    await cls.save();
    return res.status(200).json({ success: true, message: "Student updated", student });
  } catch (err) { return serverErr(res, err, "updateStudent"); }
};

// DELETE /api/classes/:id/students/:studentId
exports.removeStudent = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const student = cls.students.id(req.params.studentId);
    if (!student) return notFound(res, "Student not found");
    student.isActive = false;
    await cls.save();
    return res.status(200).json({ success: true, message: "Student removed" });
  } catch (err) { return serverErr(res, err, "removeStudent"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────

// PUT /api/classes/:id/subjects  (replace full list)
exports.updateSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;
    if (!Array.isArray(subjects)) return res.status(400).json({ success: false, message: "subjects must be an array" });

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { $set: { subjects } }, { new: true, runValidators: true }
    );
    if (!cls) return notFound(res);
    return res.status(200).json({ success: true, message: "Subjects updated", subjects: cls.subjects });
  } catch (err) { return serverErr(res, err, "updateSubjects"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────────────────────────────────────

// PUT /api/classes/:id/timetable  (replace full timetable)
exports.updateTimetable = async (req, res) => {
  try {
    const { timetable } = req.body;
    if (!Array.isArray(timetable)) return res.status(400).json({ success: false, message: "timetable must be an array" });

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { $set: { timetable } }, { new: true }
    );
    if (!cls) return notFound(res);
    return res.status(200).json({ success: true, message: "Timetable updated", timetable: cls.timetable });
  } catch (err) { return serverErr(res, err, "updateTimetable"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────

exports.addAssignment = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const { title, description, subjectId, subjectName, teacherId, teacherName, dueDate, maxMarks, attachmentUrl } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: "Title is required" });
    cls.assignments.push({ title: title.trim(), description: description || "", subjectId, subjectName,
      teacherId, teacherName, dueDate, maxMarks: maxMarks || 10, attachmentUrl: attachmentUrl || "" });
    await cls.save();
    return res.status(201).json({ success: true, message: "Assignment added", assignment: cls.assignments[cls.assignments.length - 1] });
  } catch (err) { return serverErr(res, err, "addAssignment"); }
};

exports.updateAssignment = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const a = cls.assignments.id(req.params.assignmentId);
    if (!a) return notFound(res, "Assignment not found");
    const FIELDS = ["title","description","subjectId","subjectName","dueDate","maxMarks","status","attachmentUrl"];
    FIELDS.forEach((k) => { if (req.body[k] !== undefined) a[k] = req.body[k]; });
    await cls.save();
    return res.status(200).json({ success: true, message: "Assignment updated", assignment: a });
  } catch (err) { return serverErr(res, err, "updateAssignment"); }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    cls.assignments.pull({ _id: req.params.assignmentId });
    await cls.save();
    return res.status(200).json({ success: true, message: "Assignment deleted" });
  } catch (err) { return serverErr(res, err, "deleteAssignment"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMS & RESULTS
// ─────────────────────────────────────────────────────────────────────────────

exports.addExam = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const { name, type, subjectId, subjectName, date, maxMarks, passMarks } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Exam name is required" });
    // Pre-populate results for all active students
    const results = cls.students.filter((s) => s.isActive).map((s) => ({
      studentId: s.studentId, studentName: s.name, rollNo: s.rollNo,
      marksObtained: 0, grade: "", remarks: "", isAbsent: false,
    }));
    cls.exams.push({ name: name.trim(), type, subjectId, subjectName, date, maxMarks: maxMarks || 100,
      passMarks: passMarks || 33, results, status: "Scheduled" });
    await cls.save();
    return res.status(201).json({ success: true, message: "Exam created", exam: cls.exams[cls.exams.length - 1] });
  } catch (err) { return serverErr(res, err, "addExam"); }
};

exports.updateExamResults = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const exam = cls.exams.id(req.params.examId);
    if (!exam) return notFound(res, "Exam not found");

    const { results, status } = req.body;
    if (Array.isArray(results)) exam.results = results;
    if (status) exam.status = status;

    await cls.save();
    return res.status(200).json({ success: true, message: "Results updated", exam });
  } catch (err) { return serverErr(res, err, "updateExamResults"); }
};

exports.deleteExam = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    cls.exams.pull({ _id: req.params.examId });
    await cls.save();
    return res.status(200).json({ success: true, message: "Exam deleted" });
  } catch (err) { return serverErr(res, err, "deleteExam"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

exports.addAnnouncement = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const { title, content, priority, expiresAt, isPinned } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ success: false, message: "Title and content required" });
    cls.announcements.push({ title: title.trim(), content: content.trim(), priority: priority || "Normal",
      author: req.user?.name || "Admin", authorId: req.user._id,
      expiresAt: expiresAt || undefined, isPinned: isPinned || false });
    await cls.save();
    return res.status(201).json({ success: true, message: "Announcement added", announcement: cls.announcements[cls.announcements.length - 1] });
  } catch (err) { return serverErr(res, err, "addAnnouncement"); }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const ann = cls.announcements.id(req.params.announcementId);
    if (!ann) return notFound(res, "Announcement not found");
    ["title","content","priority","expiresAt","isPinned"].forEach((k) => { if (req.body[k] !== undefined) ann[k] = req.body[k]; });
    await cls.save();
    return res.status(200).json({ success: true, message: "Announcement updated", announcement: ann });
  } catch (err) { return serverErr(res, err, "updateAnnouncement"); }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    cls.announcements.pull({ _id: req.params.announcementId });
    await cls.save();
    return res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (err) { return serverErr(res, err, "deleteAnnouncement"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCES
// ─────────────────────────────────────────────────────────────────────────────

exports.addResource = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    const { title, description, type, url, subjectId, subjectName, size } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: "Title is required" });
    cls.resources.push({ title: title.trim(), description: description || "", type: type || "Document",
      url: url || "", subjectId, subjectName: subjectName || "", size: size || "",
      uploadedBy: req.user?.name || "Admin" });
    await cls.save();
    return res.status(201).json({ success: true, message: "Resource added", resource: cls.resources[cls.resources.length - 1] });
  } catch (err) { return serverErr(res, err, "addResource"); }
};

exports.deleteResource = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);
    cls.resources.pull({ _id: req.params.resourceId });
    await cls.save();
    return res.status(200).json({ success: true, message: "Resource deleted" });
  } catch (err) { return serverErr(res, err, "deleteResource"); }
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM CONTROLS
// ─────────────────────────────────────────────────────────────────────────────

// PUT /api/classes/:id/promote
exports.promoteClass = async (req, res) => {
  try {
    const { promotedTo } = req.body;
    if (!promotedTo?.trim()) return res.status(400).json({ success: false, message: "promotedTo class name is required" });

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { $set: { isPromoted: true, promotedTo: promotedTo.trim(), promotedAt: new Date() } },
      { new: true }
    );
    if (!cls) return notFound(res);
    return res.status(200).json({ success: true, message: `Class promoted to ${promotedTo}`, class: cls });
  } catch (err) { return serverErr(res, err, "promoteClass"); }
};

// PUT /api/classes/:id/archive
exports.archiveClass = async (req, res) => {
  try {
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { $set: { isArchived: true, isActive: false, archivedAt: new Date(), archivedBy: req.user._id } },
      { new: true }
    );
    if (!cls) return notFound(res);
    return res.status(200).json({ success: true, message: "Class archived", class: cls });
  } catch (err) { return serverErr(res, err, "archiveClass"); }
};

// PUT /api/classes/:id/restore
exports.restoreClass = async (req, res) => {
  try {
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { $set: { isArchived: false, isActive: true, archivedAt: undefined, archivedBy: undefined } },
      { new: true }
    );
    if (!cls) return notFound(res);
    return res.status(200).json({ success: true, message: "Class restored", class: cls });
  } catch (err) { return serverErr(res, err, "restoreClass"); }
};

// GET /api/classes/:id/stats
exports.getClassStats = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!cls) return notFound(res);

    const activeStudents = cls.students.filter((s) => s.isActive);
    const boys   = activeStudents.filter((s) => s.gender === "Male").length;
    const girls  = activeStudents.filter((s) => s.gender === "Female").length;
    const completedExams = cls.exams.filter((e) => e.status === "Completed").length;
    const pendingAssignments = cls.assignments.filter((a) => a.status === "Active").length;
    const pinnedAnnouncements = cls.announcements.filter((a) => a.isPinned).length;

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: activeStudents.length,
        boys, girls,
        totalSubjects: cls.subjects.length,
        totalExams: cls.exams.length,
        completedExams,
        pendingAssignments,
        totalResources: cls.resources.length,
        pinnedAnnouncements,
        capacity: cls.capacity,
        occupancy: Math.round((activeStudents.length / cls.capacity) * 100),
      },
    });
  } catch (err) { return serverErr(res, err, "getClassStats"); }
};