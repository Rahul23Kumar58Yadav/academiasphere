// src/pages/school-admin/StudentEnrollment.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  BookOpen,
  Users,
  Heart,
  DollarSign,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
  X,
  Camera,
  Upload,
  RefreshCw,
  Send,
  Shield,
  FileText,
  Info,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// ─── API base — matches your backend ─────────────────────────────────────────
const API_BASE = "/api/v1";
// ─── helpers ──────────────────────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
    err
      ? "border-red-300 bg-red-50 focus:ring-red-400"
      : "border-gray-200 bg-white focus:ring-blue-500"
  }`;

const FormField = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const FileUploadField = ({ file, progress, onUpload, accept }) => {
  const ref = useRef(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
        file
          ? "border-green-400 bg-green-50"
          : "border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
      }`}
    >
      {progress !== undefined ? (
        <div className="space-y-2">
          <RefreshCw className="w-7 h-7 mx-auto text-blue-500 animate-spin" />
          <p className="text-xs text-gray-500">Uploading… {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : file ? (
        <div className="space-y-1">
          <CheckCircle className="w-7 h-7 mx-auto text-green-500" />
          <p className="text-xs font-medium text-gray-800">{file.name}</p>
          <p className="text-xs text-gray-400">Click to replace</p>
        </div>
      ) : (
        <div className="space-y-1">
          <Upload className="w-7 h-7 mx-auto text-gray-300" />
          <p className="text-xs text-gray-500">Click to upload</p>
          <p className="text-xs text-gray-400">
            {accept || "PDF, JPG, PNG"} · Max 5 MB
          </p>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
    </div>
  );
};

// ─── STEPS ────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, name: "Personal", icon: User, desc: "Basic student details" },
  { id: 2, name: "Contact", icon: MapPin, desc: "Address & contact" },
  { id: 3, name: "Academic", icon: BookOpen, desc: "Class & admission" },
  { id: 4, name: "Parent/Guardian", icon: Users, desc: "Family information" },
  { id: 5, name: "Medical", icon: Heart, desc: "Health information" },
  { id: 6, name: "Documents", icon: FileText, desc: "Upload documents" },
  { id: 7, name: "Fees", icon: DollarSign, desc: "Payment information" },
  { id: 8, name: "Review", icon: CheckCircle, desc: "Review & submit" },
];

const CLASSES = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];
const SECTIONS = ["A", "B", "C", "D", "E"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ACAD_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

// ─── INITIAL FORM STATE ───────────────────────────────────────────────────────
const INIT = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  nationality: "",
  religion: "",
  photo: null,

  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",

  class: "",
  section: "",
  admissionDate: "",
  academicYear: "",
  previousSchool: "",
  previousClass: "",

  fatherName: "",
  fatherPhone: "",
  fatherEmail: "",
  fatherOccupation: "",
  motherName: "",
  motherPhone: "",
  motherEmail: "",
  motherOccupation: "",
  guardianName: "",
  guardianRelation: "",
  guardianPhone: "",
  emergencyContact: "",

  medicalConditions: "",
  allergies: "",
  medications: "",
  vaccinations: "",
  doctorName: "",
  doctorPhone: "",

  birthCertificate: null,
  addressProof: null,
  parentIdProof: null,
  previousSchoolRecords: null,
  transferCertificate: null,

  feeStructure: "regular",
  paymentPlan: "quarterly",
  discountApplicable: false,
  discountType: "",
  discountAmount: "",
  scholarshipApplied: false,
  scholarshipDetails: "",
};

// ═════════════════════════════════════════════════════════════════════════════
export default function StudentEnrollment({ onClose }) {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const photoRef = useRef(null);

  // ── input helpers ──────────────────────────────────────────────────────────
  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: null }));
  };

  const handleFileUpload = (field, file) => {
    setUploadProgress((p) => ({ ...p, [field]: 0 }));
    let pct = 0;
    const iv = setInterval(() => {
      pct += 25;
      setUploadProgress((p) => ({ ...p, [field]: pct }));
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          setForm((p) => ({ ...p, [field]: file }));
          setUploadProgress((p) => {
            const n = { ...p };
            delete n[field];
            return n;
          });
        }, 300);
      }
    }, 120);
  };

  const handlePhoto = (files) => {
    if (!files?.length) return;
    const reader = new FileReader();
    reader.onloadend = () => set("photo", reader.result);
    reader.readAsDataURL(files[0]);
  };

  const age = (dob) => {
    if (!dob) return "";
    const t = new Date(),
      b = new Date(dob);
    let a = t.getFullYear() - b.getFullYear();
    if (
      t.getMonth() - b.getMonth() < 0 ||
      (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())
    )
      a--;
    return a;
  };

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = "Required";
      if (!form.lastName.trim()) e.lastName = "Required";
      if (!form.dateOfBirth) e.dateOfBirth = "Required";
      if (!form.gender) e.gender = "Required";
      if (!form.bloodGroup) e.bloodGroup = "Required";
    }
    if (s === 2) {
      if (!form.email.trim()) e.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "Invalid email";
      if (!form.phone.trim()) e.phone = "Required";
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim()) e.city = "Required";
      if (!form.state.trim()) e.state = "Required";
      if (!form.zipCode.trim()) e.zipCode = "Required";
    }
    if (s === 3) {
      if (!form.class) e.class = "Required";
      if (!form.section) e.section = "Required";
      if (!form.admissionDate) e.admissionDate = "Required";
      if (!form.academicYear) e.academicYear = "Required";
    }
    if (s === 4) {
      if (
        !form.fatherName.trim() &&
        !form.motherName.trim() &&
        !form.guardianName.trim()
      )
        e.guardianName = "At least one parent / guardian is required";
      if (!form.emergencyContact.trim()) e.emergencyContact = "Required";
    }
    if (s === 6) {
      if (!form.birthCertificate)
        e.birthCertificate = "Birth certificate is required";
      if (!form.addressProof) e.addressProof = "Address proof is required";
      if (!form.parentIdProof) e.parentIdProof = "Parent ID is required";
    }
    if (s === 7) {
      if (!form.feeStructure) e.feeStructure = "Required";
      if (!form.paymentPlan) e.paymentPlan = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (validate(step)) setStep((p) => Math.min(p + 1, STEPS.length));
  };
  const goPrev = () => setStep((p) => Math.max(p - 1, 1));

  // ── SUBMIT — sends to your enrollStudent controller ────────────────────────
// ── SUBMIT — FINAL CLEAN VERSION (Replace your entire handleSubmit) ────────
const handleSubmit = async () => {
  if (!validate(step)) return;

  setIsSubmitting(true);
  setSubmitError(null);

  try {
    // 1. Build Guardians
    const guardians = [];
    if (form.fatherName?.trim() && form.fatherPhone?.trim()) {
      guardians.push({
        name: form.fatherName.trim(),
        relation: "father",
        phone: form.fatherPhone.trim(),
        ...(form.fatherEmail?.trim() && { email: form.fatherEmail.trim() }),
      });
    }
    if (form.motherName?.trim() && form.motherPhone?.trim()) {
      guardians.push({
        name: form.motherName.trim(),
        relation: "mother",
        phone: form.motherPhone.trim(),
        ...(form.motherEmail?.trim() && { email: form.motherEmail.trim() }),
      });
    }
    if (form.guardianName?.trim() && form.guardianPhone?.trim()) {
      guardians.push({
        name: form.guardianName.trim(),
        relation: "guardian",
        phone: form.guardianPhone.trim(),
      });
    }
    if (guardians.length === 0 && form.emergencyContact?.trim()) {
      guardians.push({
        name: "Emergency Contact",
        relation: "guardian",
        phone: form.emergencyContact.trim(),
      });
    }

    // 2. Build Medical Conditions — SAFE (no toLowerCase error)
    const medicalArr = [];
    const addMedical = (value, prefix = "") => {
  if (typeof value !== "string") return;
  const val = value.trim();
  if (val && !["none", "n/a", ""].includes(val.toLowerCase())) {
    medicalArr.push(prefix ? `${prefix}: ${val}` : val);
  }
};

addMedical(form.medicalConditions);
addMedical(form.allergies, "Allergies");
addMedical(form.medications, "Medications");
if (form.vaccinations?.trim()) {
  medicalArr.push(`Vaccinations: ${form.vaccinations.trim()}`);
}

    // 3. Fee Category
    let feeCategory = "regular";
    if (form.scholarshipApplied) feeCategory = "scholarship";
    else if (form.discountApplicable && form.discountType === "merit") 
      feeCategory = "concession";

    // 4. Final Payload
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender?.toLowerCase() || undefined,
      bloodGroup: form.bloodGroup || undefined,
      nationality: form.nationality?.trim() || undefined,
      religion: form.religion?.trim() || undefined,

      email: form.email?.trim().toLowerCase() || undefined,
      phone: form.phone?.trim() || undefined,

      address: form.address?.trim() || undefined,
      city: form.city?.trim() || undefined,
      state: form.state?.trim() || undefined,
      zipCode: form.zipCode?.trim() || undefined,

      // Send both to satisfy backend
      class: form.class?.trim(),
      grade: form.class?.trim(),

      section: form.section?.trim() || "A",
      admissionDate: form.admissionDate || undefined,
      academicYear: form.academicYear || undefined,
      previousSchool: form.previousSchool?.trim() || undefined,

      guardians,
      medicalConditions: medicalArr,        // ← Always an array

      feeCategory,
      discountApplicable: !!form.discountApplicable,
      discountType: form.discountType || undefined,
      scholarshipApplied: !!form.scholarshipApplied,
    };

    console.log("✅ Final Payload being sent:", payload);

    const res = await authFetch("/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Server error ${res.status}`);
    }

    // Success
    navigate("/school-admin/students", {
      replace: true,
      state: { toast: `${data.student?.firstName || form.firstName} enrolled successfully!` },
      forceRefresh: true,
    });

  } catch (err) {
    console.error("Enrollment failed:", err);
    setSubmitError(err.message || "Failed to enroll student. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
  // ── step content ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── 1: Personal ─────────────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-5">
            {/* Photo */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-28 h-28 mx-auto bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {form.photo ? (
                    <img
                      src={form.photo}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="absolute bottom-1 right-1 p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-700 shadow"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhoto(e.target.files)}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Student photo (optional)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="First Name" required error={errors.firstName}>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className={inputCls(errors.firstName)}
                  placeholder="First name"
                />
              </FormField>
              <FormField label="Middle Name">
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(e) => set("middleName", e.target.value)}
                  className={inputCls()}
                  placeholder="Middle name"
                />
              </FormField>
              <FormField label="Last Name" required error={errors.lastName}>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className={inputCls(errors.lastName)}
                  placeholder="Last name"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Date of Birth"
                required
                error={errors.dateOfBirth}
              >
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                  className={inputCls(errors.dateOfBirth)}
                />
                {form.dateOfBirth && (
                  <p className="text-xs text-gray-400 mt-1">
                    Age: {age(form.dateOfBirth)} yrs
                  </p>
                )}
              </FormField>
              <FormField label="Gender" required error={errors.gender}>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className={inputCls(errors.gender)}
                >
                  <option value="">Select</option>
                  {/* lowercase to match schema enum */}
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
              <FormField label="Blood Group" required error={errors.bloodGroup}>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                  className={inputCls(errors.bloodGroup)}
                >
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nationality">
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                  className={inputCls()}
                  placeholder="e.g. Indian"
                />
              </FormField>
              <FormField label="Religion">
                <input
                  type="text"
                  value={form.religion}
                  onChange={(e) => set("religion", e.target.value)}
                  className={inputCls()}
                  placeholder="Optional"
                />
              </FormField>
            </div>
          </div>
        );

      // ── 2: Contact ───────────────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email Address" required error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls(errors.email)}
                  placeholder="student@example.com"
                />
              </FormField>
              <FormField label="Phone Number" required error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputCls(errors.phone)}
                  placeholder="+91 98765 43210"
                />
              </FormField>
            </div>
            <FormField label="Street Address" required error={errors.address}>
              <textarea
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={inputCls(errors.address)}
                rows={3}
                placeholder="Full address"
              />
            </FormField>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="City" required error={errors.city}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className={inputCls(errors.city)}
                  placeholder="City"
                />
              </FormField>
              <FormField label="State" required error={errors.state}>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className={inputCls(errors.state)}
                  placeholder="State"
                />
              </FormField>
              <FormField label="PIN / ZIP" required error={errors.zipCode}>
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={(e) => set("zipCode", e.target.value)}
                  className={inputCls(errors.zipCode)}
                  placeholder="PIN code"
                />
              </FormField>
              <FormField label="Country">
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className={inputCls()}
                  placeholder="India"
                />
              </FormField>
            </div>
          </div>
        );

      // ── 3: Academic ──────────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Class / Grade" required error={errors.class}>
                <select
                  value={form.class}
                  onChange={(e) => set("class", e.target.value)}
                  className={inputCls(errors.class)}
                >
                  <option value="">Select class</option>
                  {CLASSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Section" required error={errors.section}>
                <select
                  value={form.section}
                  onChange={(e) => set("section", e.target.value)}
                  className={inputCls(errors.section)}
                >
                  <option value="">Select section</option>
                  {SECTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Admission Date"
                required
                error={errors.admissionDate}
              >
                <input
                  type="date"
                  value={form.admissionDate}
                  onChange={(e) => set("admissionDate", e.target.value)}
                  className={inputCls(errors.admissionDate)}
                />
              </FormField>
              <FormField
                label="Academic Year"
                required
                error={errors.academicYear}
              >
                <select
                  value={form.academicYear}
                  onChange={(e) => set("academicYear", e.target.value)}
                  className={inputCls(errors.academicYear)}
                >
                  <option value="">Select year</option>
                  {ACAD_YEARS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Previous School (optional)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="School Name">
                  <input
                    type="text"
                    value={form.previousSchool}
                    onChange={(e) => set("previousSchool", e.target.value)}
                    className={inputCls()}
                    placeholder="Previous school name"
                  />
                </FormField>
                <FormField label="Previous Class">
                  <input
                    type="text"
                    value={form.previousClass}
                    onChange={(e) => set("previousClass", e.target.value)}
                    className={inputCls()}
                    placeholder="Class / Grade"
                  />
                </FormField>
              </div>
            </div>
          </div>
        );

      // ── 4: Parents ───────────────────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            {/* Father */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Father's Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ["fatherName", "Full Name", "text"],
                  ["fatherPhone", "Phone", "tel"],
                  ["fatherEmail", "Email", "email"],
                  ["fatherOccupation", "Occupation", "text"],
                ].map(([f, l, t]) => (
                  <FormField key={f} label={l}>
                    <input
                      type={t}
                      value={form[f]}
                      onChange={(e) => set(f, e.target.value)}
                      className={inputCls()}
                      placeholder={l}
                    />
                  </FormField>
                ))}
              </div>
            </div>

            {/* Mother */}
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Mother's Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ["motherName", "Full Name", "text"],
                  ["motherPhone", "Phone", "tel"],
                  ["motherEmail", "Email", "email"],
                  ["motherOccupation", "Occupation", "text"],
                ].map(([f, l, t]) => (
                  <FormField key={f} label={l}>
                    <input
                      type={t}
                      value={form[f]}
                      onChange={(e) => set(f, e.target.value)}
                      className={inputCls()}
                      placeholder={l}
                    />
                  </FormField>
                ))}
              </div>
            </div>

            {/* Guardian */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Guardian (if different from
                parents)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField label="Guardian Name" error={errors.guardianName}>
                  <input
                    type="text"
                    value={form.guardianName}
                    onChange={(e) => set("guardianName", e.target.value)}
                    className={inputCls(errors.guardianName)}
                    placeholder="Name"
                  />
                </FormField>
                <FormField label="Relation">
                  <input
                    type="text"
                    value={form.guardianRelation}
                    onChange={(e) => set("guardianRelation", e.target.value)}
                    className={inputCls()}
                    placeholder="e.g. Uncle"
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    type="tel"
                    value={form.guardianPhone}
                    onChange={(e) => set("guardianPhone", e.target.value)}
                    className={inputCls()}
                    placeholder="+91 …"
                  />
                </FormField>
              </div>
              {errors.guardianName && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.guardianName}
                </p>
              )}
            </div>

            {/* Emergency */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Emergency Contact
              </p>
              <FormField
                label="Contact Number"
                required
                error={errors.emergencyContact}
              >
                <input
                  type="tel"
                  value={form.emergencyContact}
                  onChange={(e) => set("emergencyContact", e.target.value)}
                  className={inputCls(errors.emergencyContact)}
                  placeholder="+91 98765 43210"
                />
              </FormField>
            </div>
          </div>
        );

      // ── 5: Medical ───────────────────────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                [
                  "medicalConditions",
                  "Known Medical Conditions",
                  "conditions or 'None'",
                ],
                ["allergies", "Allergies", "allergies or 'None'"],
                ["medications", "Current Medications", "medications or 'None'"],
                ["vaccinations", "Vaccination Status", "e.g. Up to date"],
              ].map(([f, l, ph]) => (
                <FormField key={f} label={l}>
                  <textarea
                    value={form[f]}
                    onChange={(e) => set(f, e.target.value)}
                    className={inputCls()}
                    rows={3}
                    placeholder={`Enter ${ph}`}
                  />
                </FormField>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Healthcare Provider
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Doctor's Name">
                  <input
                    type="text"
                    value={form.doctorName}
                    onChange={(e) => set("doctorName", e.target.value)}
                    className={inputCls()}
                    placeholder="Doctor name"
                  />
                </FormField>
                <FormField label="Doctor's Phone">
                  <input
                    type="tel"
                    value={form.doctorPhone}
                    onChange={(e) => set("doctorPhone", e.target.value)}
                    className={inputCls()}
                    placeholder="+91 …"
                  />
                </FormField>
              </div>
            </div>
          </div>
        );

      // ── 6: Documents ─────────────────────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Upload clear copies. Accepted: PDF, JPG, PNG — max 5 MB each.
              </span>
            </div>
            <FormField
              label="Birth Certificate"
              required
              error={errors.birthCertificate}
            >
              <FileUploadField
                file={form.birthCertificate}
                progress={uploadProgress.birthCertificate}
                onUpload={(f) => handleFileUpload("birthCertificate", f)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </FormField>
            <FormField
              label="Address Proof"
              required
              error={errors.addressProof}
            >
              <FileUploadField
                file={form.addressProof}
                progress={uploadProgress.addressProof}
                onUpload={(f) => handleFileUpload("addressProof", f)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </FormField>
            <FormField
              label="Parent ID Proof"
              required
              error={errors.parentIdProof}
            >
              <FileUploadField
                file={form.parentIdProof}
                progress={uploadProgress.parentIdProof}
                onUpload={(f) => handleFileUpload("parentIdProof", f)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </FormField>
            <FormField label="Previous School Records (optional)">
              <FileUploadField
                file={form.previousSchoolRecords}
                progress={uploadProgress.previousSchoolRecords}
                onUpload={(f) => handleFileUpload("previousSchoolRecords", f)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </FormField>
          </div>
        );

      // ── 7: Fees ──────────────────────────────────────────────────────────────
      case 7:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Fee Structure"
                required
                error={errors.feeStructure}
              >
                <select
                  value={form.feeStructure}
                  onChange={(e) => set("feeStructure", e.target.value)}
                  className={inputCls(errors.feeStructure)}
                >
                  <option value="">Select</option>
                  <option value="regular">Regular</option>
                  <option value="concession">Concession</option>
                  <option value="free">Free / RTE</option>
                  <option value="scholarship">Scholarship</option>
                </select>
              </FormField>
              <FormField
                label="Payment Plan"
                required
                error={errors.paymentPlan}
              >
                <select
                  value={form.paymentPlan}
                  onChange={(e) => set("paymentPlan", e.target.value)}
                  className={inputCls(errors.paymentPlan)}
                >
                  <option value="">Select</option>
                  <option value="annual">Annual</option>
                  <option value="semester">Semester</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </FormField>
            </div>

            <div className="border-t pt-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.discountApplicable}
                  onChange={(e) => set("discountApplicable", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Apply Discount
                </span>
              </label>
              {form.discountApplicable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <FormField label="Discount Type">
                    <select
                      value={form.discountType}
                      onChange={(e) => set("discountType", e.target.value)}
                      className={inputCls()}
                    >
                      <option value="">Select type</option>
                      <option value="sibling">Sibling (10%)</option>
                      <option value="merit">Merit (15%)</option>
                      <option value="staff">Staff Child (20%)</option>
                      <option value="earlybird">Early Bird (5%)</option>
                    </select>
                  </FormField>
                  <FormField label="Discount Amount (₹)">
                    <input
                      type="number"
                      min="0"
                      value={form.discountAmount}
                      onChange={(e) => set("discountAmount", e.target.value)}
                      className={inputCls()}
                      placeholder="0"
                    />
                  </FormField>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.scholarshipApplied}
                  onChange={(e) => set("scholarshipApplied", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Apply for Scholarship
                </span>
              </label>
              {form.scholarshipApplied && (
                <FormField label="Scholarship Details">
                  <textarea
                    value={form.scholarshipDetails}
                    onChange={(e) => set("scholarshipDetails", e.target.value)}
                    className={inputCls()}
                    rows={3}
                    placeholder="Describe eligibility / scholarship name"
                  />
                </FormField>
              )}
            </div>
          </div>
        );

      // ── 8: Review ────────────────────────────────────────────────────────────
      case 8:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Review Your Application
              </h3>
              <p className="text-sm text-gray-400">
                Verify all details before submitting
              </p>
            </div>

            {/* API error shown here */}
            {submitError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Submission Failed</p>
                  <p className="mt-0.5">{submitError}</p>
                </div>
              </div>
            )}

            {[
              {
                title: "Personal",
                icon: User,
                rows: [
                  [
                    "Name",
                    `${form.firstName} ${form.middleName} ${form.lastName}`.trim(),
                  ],
                  ["DOB / Gender", `${form.dateOfBirth} · ${form.gender}`],
                  ["Blood Group", form.bloodGroup],
                ],
              },
              {
                title: "Contact",
                icon: MapPin,
                rows: [
                  ["Email", form.email],
                  ["Phone", form.phone],
                  [
                    "Address",
                    `${form.address}, ${form.city}, ${form.state} ${form.zipCode}`,
                  ],
                ],
              },
              {
                title: "Academic",
                icon: BookOpen,
                rows: [
                  ["Class", `${form.class} — Section ${form.section}`],
                  ["Year", form.academicYear],
                  ["Admission Date", form.admissionDate],
                ],
              },
              {
                title: "Parents",
                icon: Users,
                rows: [
                  ...(form.fatherName
                    ? [["Father", `${form.fatherName} · ${form.fatherPhone}`]]
                    : []),
                  ...(form.motherName
                    ? [["Mother", `${form.motherName} · ${form.motherPhone}`]]
                    : []),
                  ["Emergency", form.emergencyContact],
                ],
              },
              {
                title: "Fees",
                icon: DollarSign,
                rows: [
                  ["Structure", form.feeStructure],
                  ["Plan", form.paymentPlan],
                ],
              },
            ].map(({ title, icon: Icon, rows }) => (
              <div
                key={title}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
              >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                  {title}
                </p>
                <div className="space-y-1.5">
                  {rows.map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-gray-400 w-1/3 flex-shrink-0">
                        {l}
                      </span>
                      <span className="font-medium text-gray-800 text-right">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 text-center pt-2">
              By submitting you confirm all information is accurate and agree to
              the school's enrollment policy.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-0">
        {/* ── Header + progress ─────────────────────────────────────────── */}
        <div className="bg-white rounded-t-2xl border border-gray-100 shadow-sm px-6 pt-6 pb-5">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Student Enrollment
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Complete all steps to save to the database
              </p>
            </div>
            <button
              onClick={() =>
                onClose ? onClose() : navigate("/school-admin/students")
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step bar */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => step > s.id && setStep(s.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step === s.id
                        ? "bg-blue-600 text-white shadow-md scale-110"
                        : step > s.id
                          ? "bg-green-500 text-white cursor-pointer hover:bg-green-600"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > s.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                  </button>
                  <p
                    className={`text-[10px] mt-1 font-medium hidden sm:block text-center leading-tight max-w-[56px] ${
                      step >= s.id ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {s.name}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${step > s.id ? "bg-green-400" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Step body ─────────────────────────────────────────────────── */}
        <div className="bg-white border-x border-gray-100 shadow-sm px-6 py-7">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {STEPS[step - 1].name}
            </h2>
            <p className="text-xs text-gray-400">{STEPS[step - 1].desc}</p>
          </div>

          {/* Top error on review step */}
          {submitError && step === 8 && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          {renderStep()}
        </div>

        {/* ── Footer nav ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={step === 1}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm rounded-lg transition-all ${
              step === 1
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-gray-400">
            Step {step} / {STEPS.length}
          </span>

          {step < STEPS.length ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving to
                  Database…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Enroll Student
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
