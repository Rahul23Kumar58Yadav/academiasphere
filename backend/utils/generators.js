const Student = require("../models/Student");
const Payment = require("../models/Fee");

// ── Admission Number ───────────────────────────────────────────────────────
// Format: ADM-2025-00001
// utils/generators.js  (or wherever you define it)
// At the top of studentRoutes.js
const generateAdmissionNo = async () => {
  const year = new Date().getFullYear();
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const admissionNo = `ADM-${year}-${randomNum}`;

    const exists = await Student.exists({ admissionNo });
    if (!exists) {
      return admissionNo;
    }
    attempts++;
  }

  throw new Error("Could not generate unique admission number");
};

// ── Employee ID ────────────────────────────────────────────────────────────
// Format: T20250001
const generateEmployeeId = async (schoolId) => {
  const Teacher = require("../models/Teacher"); // lazy to avoid circular deps
  const count   = await Teacher.countDocuments({ schoolId });
  return `T${new Date().getFullYear()}${String(count + 1).padStart(4, "0")}`;
};

// ── Invoice Number ─────────────────────────────────────────────────────────
// Format: INV-2025-0001
const generateInvoiceNo = async (schoolId) => {
  const year  = new Date().getFullYear();
  const count = await Payment.countDocuments({ schoolId });
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
};

// ── Receipt Number ─────────────────────────────────────────────────────────
// Format: RCP-2025-0001
const generateReceiptNo = async (schoolId) => {
  const year  = new Date().getFullYear();
  const count = await Payment.countDocuments({
    schoolId,
    "payments.0": { $exists: true }, // only docs that have at least one payment entry
  });
  return `RCP-${year}-${String(count + 1).padStart(4, "0")}`;
};

// ── Roll Number (sequential within grade-section) ─────────────────────────
const generateRollNo = async (schoolId, grade, section, academicYear) => {
  const count = await Student.countDocuments({
    schoolId, grade, section, academicYear, status: "active",
  });
  return String(count + 1).padStart(2, "0");
};

module.exports = {
  generateAdmissionNo,
  generateEmployeeId,
  generateInvoiceNo,
  generateReceiptNo,
  generateRollNo,
};