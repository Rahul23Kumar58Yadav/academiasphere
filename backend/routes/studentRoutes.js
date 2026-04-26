// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const { protect, authorize } = require("../middleware/authMiddleware");
const { generateAdmissionNo } = require("../utils/generators");

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v1/students
// ═════════════════════════════════════════════════════════════════════════════
router.get(
  "/",
  protect,
  authorize("SCHOOL_ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      console.log("🔍 req.user.schoolId:", req.user.schoolId);
      console.log("🔍 req.user:", JSON.stringify(req.user, null, 2));

      const totalInDB = await Student.countDocuments({});
      const totalForSchool = await Student.countDocuments({
        schoolId: req.user.schoolId,
      });
      console.log(
        `🔍 Total students in DB: ${totalInDB}, For this school: ${totalForSchool}`,
      );
      const {
        page = 1,
        limit = 200,
        search = "",
        grade,
        status = "all", // frontend sends "all" — never pass to MongoDB directly
      } = req.query;

      // ── Build filter ──────────────────────────────────────────────────────
      const query = { schoolId: req.user.schoolId };

      // Only filter by status when a real value is given
      if (status && status !== "all") {
        // Normalise "Active" → "active" in case frontend sends capitalised
        query.status = status.toLowerCase();
      }

      if (grade) query.grade = grade;

      if (search && search.trim()) {
        query.$or = [
          { firstName: { $regex: search.trim(), $options: "i" } },
          { lastName: { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
          { admissionNo: { $regex: search.trim(), $options: "i" } },
          { phone: { $regex: search.trim(), $options: "i" } },
        ];
      }

      // ── Query DB ──────────────────────────────────────────────────────────
      const skip = (Number(page) - 1) * Number(limit);
      const total = await Student.countDocuments(query);
      const students = await Student.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-__v -documents")
        .lean();

      // ── Map to frontend shape ─────────────────────────────────────────────
      const mapped = students.map((s) => ({
        id: s._id.toString(),
        studentId: s.admissionNo || s._id.toString(),
        name: `${s.firstName} ${s.lastName}`.trim() || "Unnamed",
        email: s.email || "—",
        phone: s.phone || "—",
        class: s.section ? `${s.grade}-${s.section}` : s.grade || "—",
        rollNo: s.rollNo || "—",
        dob: s.dob ? new Date(s.dob).toISOString().split("T")[0] : "—",
        gender: s.gender || "—",
        bloodGroup: s.bloodGroup || "—",
        attendance: s.attendanceSummary?.percentage ?? 0,
        gpa: 0,
        fees: "Pending",
        status: s.status === "active" ? "Active" : "Inactive",
        address:
          [s.address?.street, s.address?.city, s.address?.state]
            .filter(Boolean)
            .join(", ") || "—",
        parentName: s.guardians?.[0]?.name || "—",
        parentPhone: s.guardians?.[0]?.phone || "—",
        enrollmentDate: s.admissionDate
          ? new Date(s.admissionDate).toLocaleDateString()
          : "—",
      }));

      // ── No-cache headers ──────────────────────────────────────────────────
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      return res.json({
        success: true,
        total,
        students: mapped, // frontend reads json.students
      });
    } catch (err) {
      console.error("GET /students error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/v1/students  (enroll)
// ═════════════════════════════════════════════════════════════════════════════
router.post(
  "/",
  protect,
  authorize("SCHOOL_ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodGroup,
        nationality,
        religion,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        class: classFromForm,
        grade: gradeFromForm,
        section = "A",
        admissionDate,
        academicYear,
        previousSchool,
        guardians = [],
        medicalConditions = [],
        feeStructure,
        discountApplicable = false,
        discountType,
        scholarshipApplied = false,
      } = req.body;

      const grade = gradeFromForm || classFromForm;

      if (!firstName?.trim() || !lastName?.trim() || !grade || !dateOfBirth) {
        return res.status(400).json({
          success: false,
          message:
            "First name, last name, class, and date of birth are required.",
        });
      }

      // ── Duplicate check ───────────────────────────────────────────────────
      const duplicateQuery = { schoolId: req.user.schoolId };
      if (email?.trim()) {
        duplicateQuery.email = email.trim().toLowerCase();
      } else {
        duplicateQuery.$and = [
          { firstName: firstName.trim() },
          { lastName: lastName.trim() },
          { dob: new Date(dateOfBirth) },
        ];
      }

      const existing = await Student.findOne(duplicateQuery);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: email
            ? `A student with email "${email}" already exists.`
            : "A student with the same name and date of birth already exists.",
        });
      }

      // ── Medical array ─────────────────────────────────────────────────────
      const medicalArr = Array.isArray(medicalConditions)
        ? medicalConditions.filter(Boolean).map((m) => String(m).trim())
        : [];

      // ── Fee category ──────────────────────────────────────────────────────
      let feeCategory = "regular";
      if (scholarshipApplied) feeCategory = "scholarship";
      else if (discountApplicable && discountType === "merit")
        feeCategory = "concession";
      else if (["free", "concession", "scholarship"].includes(feeStructure))
        feeCategory = feeStructure;

      // ── Create ────────────────────────────────────────────────────────────
      const student = await Student.create({
        schoolId: req.user.schoolId,
        admissionNo: await generateAdmissionNo(),

        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: new Date(dateOfBirth),
        gender: gender?.toLowerCase() || "other",
        bloodGroup: bloodGroup || undefined,

        email: email ? email.trim().toLowerCase() : undefined,
        phone: phone?.trim() || undefined,

        grade: grade.trim(),
        section: section.trim(),
        academicYear: academicYear || "2024-2025",
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),

        previousSchool: previousSchool?.trim() || undefined,
        guardians: Array.isArray(guardians) ? guardians : [],

        address: {
          street: address?.trim() || "",
          city: city?.trim() || "",
          state: state?.trim() || "",
          pincode: zipCode?.trim() || "",
        },

        religion: religion?.trim() || undefined,
        category: nationality?.trim() || undefined,
        medicalConditions: medicalArr,
        feeCategory,
        status: "active",
      });

      return res.status(201).json({
        success: true,
        message: `${student.firstName} ${student.lastName} enrolled successfully.`,
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNo: student.admissionNo,
          email: student.email,
        },
      });
    } catch (err) {
      console.error("POST /students error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to enroll student",
      });
    }
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/students/:id
// ═════════════════════════════════════════════════════════════════════════════
router.patch(
  "/:id",
  protect,
  authorize("SCHOOL_ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      // Protect immutable fields
      ["admissionNo", "schoolId", "userId"].forEach((f) => delete req.body[f]);

      const student = await Student.findOneAndUpdate(
        { _id: req.params.id, schoolId: req.user.schoolId },
        { $set: req.body },
        { new: true, runValidators: true },
      );

      if (!student)
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });

      return res.json({ success: true, student });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/students/:id
// ═════════════════════════════════════════════════════════════════════════════
router.delete(
  "/:id",
  protect,
  authorize("SCHOOL_ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const student = await Student.findOneAndUpdate(
        { _id: req.params.id, schoolId: req.user.schoolId },
        { $set: { status: "inactive" } }, // soft delete
        { new: true },
      );

      if (!student)
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });

      return res.json({
        success: true,
        message: "Student deactivated successfully.",
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = router;
