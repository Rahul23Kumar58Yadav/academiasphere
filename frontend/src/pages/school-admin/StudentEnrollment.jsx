// src/pages/school-admin/StudentEnrollment.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, MapPin, BookOpen, Users, Heart, DollarSign, CheckCircle,
  ChevronRight, ChevronLeft, AlertCircle, Check, X, Camera,
  Upload, RefreshCw, Send, Shield, FileText, Info, Hash, Loader2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

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
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
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
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
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
          <p className="text-xs text-gray-400">{accept || "PDF, JPG, PNG"} · Max 5 MB</p>
        </div>
      )}
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
    </div>
  );
};

// ─── STEPS ────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, name: "Personal",        icon: User,       desc: "Basic student details"   },
  { id: 2, name: "Contact",         icon: MapPin,      desc: "Address & contact"       },
  { id: 3, name: "Academic",        icon: BookOpen,    desc: "Class, section & roll no"},
  { id: 4, name: "Parent/Guardian", icon: Users,       desc: "Family information"      },
  { id: 5, name: "Medical",         icon: Heart,       desc: "Health information"      },
  { id: 6, name: "Documents",       icon: FileText,    desc: "Upload documents"        },
  { id: 7, name: "Fees",            icon: DollarSign,  desc: "Payment information"     },
  { id: 8, name: "Review",          icon: CheckCircle, desc: "Review & submit"         },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ACAD_YEARS   = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

// ─── INITIAL FORM STATE ───────────────────────────────────────────────────────
const INIT = {
  // Personal
  firstName: "", middleName: "", lastName: "",
  dateOfBirth: "", gender: "", bloodGroup: "",
  nationality: "", religion: "", photo: null,

  // Contact
  email: "", phone: "",
  address: "", city: "", state: "", zipCode: "", country: "",

  // Academic — grade & section come from the class selector separately
  grade: "",      // e.g. "10" or "Grade 10"  — sent to API as grade
  section: "",    // e.g. "A"                  — sent to API as section
  rollNo: "",
  admissionDate: "", academicYear: "", previousSchool: "", previousClass: "",

  // Parent / Guardian
  fatherName: "", fatherPhone: "", fatherEmail: "", fatherOccupation: "",
  motherName: "", motherPhone: "", motherEmail: "", motherOccupation: "",
  guardianName: "", guardianRelation: "", guardianPhone: "",
  emergencyContact: "",

  // Medical
  medicalConditions: "", allergies: "", medications: "",
  vaccinations: "", doctorName: "", doctorPhone: "",

  // Documents
  birthCertificate: null, addressProof: null,
  parentIdProof: null, previousSchoolRecords: null,

  // Fees
  feeStructure: "regular", paymentPlan: "quarterly",
  discountApplicable: false, discountType: "", discountAmount: "",
  scholarshipApplied: false, scholarshipDetails: "",
};

// ═════════════════════════════════════════════════════════════════════════════
export default function StudentEnrollment({ onClose }) {
  const navigate      = useNavigate();
  const { authFetch } = useAuth();

  const [step,           setStep]           = useState(1);
  const [form,           setForm]           = useState(INIT);
  const [errors,         setErrors]         = useState({});
  const [submitError,    setSubmitError]    = useState(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const photoRef = useRef(null);

  // ── Distinct grades & sections from /students/classes API ─────────────────
  // We build two dropdowns: Grade then Section (filtered by grade).
  const [availableGrades,   setAvailableGrades]   = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [loadingClasses,    setLoadingClasses]     = useState(true);

  // ── Roll number auto-suggest ───────────────────────────────────────────────
  const [rollNoLoading,     setRollNoLoading]     = useState(false);
  const [rollNoSuggestion,  setRollNoSuggestion]  = useState("");

  // Fetch distinct grade-section combos from the server
  useEffect(() => {
    (async () => {
      try {
        // /students/classes returns ["10-A","10-B","11-A"…]
        const res  = await authFetch("/students/classes");
        const data = await res.json();
        const list = data.data ?? [];

        // Build unique grade list
        const gradeSet = new Set(list.map(cs => cs.split("-")[0]));
        setAvailableGrades([...gradeSet].sort());

        // Store the full list for section filtering
        setAvailableSections(list); // e.g. ["10-A","10-B"]
      } catch {
        setAvailableGrades([]);
        setAvailableSections([]);
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, [authFetch]);

  // Sections available for the currently selected grade
  const sectionsForGrade = form.grade
    ? availableSections
        .filter(cs => cs.startsWith(`${form.grade}-`))
        .map(cs => cs.split("-").slice(1).join("-"))
        .sort()
    : [];

  // Auto-suggest next roll number whenever grade + section are both set
  const suggestRollNo = useCallback(async (grade, section) => {
    if (!grade || !section) { setRollNoSuggestion(""); return; }
    setRollNoLoading(true);
    try {
      const params = new URLSearchParams({ grade, section, limit: 200, status: "all" });
      const res    = await authFetch(`/students?${params}`);
      const data   = await res.json();
      const list   = data.students ?? data.data ?? [];

      const nums = list
        .map(s => parseInt(s.rollNo, 10))
        .filter(n => !isNaN(n));

      const next      = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      const suggested = String(next).padStart(2, "0");
      setRollNoSuggestion(suggested);

      // Only auto-fill if the field is still empty
      setForm(p => ({ ...p, rollNo: p.rollNo || suggested }));
    } catch {
      setRollNoSuggestion("");
    } finally {
      setRollNoLoading(false);
    }
  }, [authFetch]);

  // Trigger suggestion when grade OR section changes
  useEffect(() => {
    suggestRollNo(form.grade, form.section);
  }, [form.grade, form.section]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── input helpers ──────────────────────────────────────────────────────────
  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: null }));
  };

  // When grade changes, reset section and rollNo
  const handleGradeChange = (grade) => {
    setForm(p => ({ ...p, grade, section: "", rollNo: "" }));
    setErrors(p => ({ ...p, grade: null, section: null, rollNo: null }));
    setRollNoSuggestion("");
  };

  // When section changes, reset rollNo
  const handleSectionChange = (section) => {
    setForm(p => ({ ...p, section, rollNo: "" }));
    setErrors(p => ({ ...p, section: null, rollNo: null }));
  };

  const handleFileUpload = (field, file) => {
    setUploadProgress(p => ({ ...p, [field]: 0 }));
    let pct = 0;
    const iv = setInterval(() => {
      pct += 25;
      setUploadProgress(p => ({ ...p, [field]: pct }));
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          setForm(p => ({ ...p, [field]: file }));
          setUploadProgress(p => { const n = { ...p }; delete n[field]; return n; });
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
    const t = new Date(), b = new Date(dob);
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() - b.getMonth() < 0 ||
       (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  };

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName  = "Required";
      if (!form.lastName.trim())  e.lastName   = "Required";
      if (!form.dateOfBirth)      e.dateOfBirth = "Required";
      if (!form.gender)           e.gender      = "Required";
      if (!form.bloodGroup)       e.bloodGroup  = "Required";
    }
    if (s === 2) {
      if (!form.email.trim())   e.email   = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
      if (!form.phone.trim())   e.phone   = "Required";
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim())    e.city    = "Required";
      if (!form.state.trim())   e.state   = "Required";
      if (!form.zipCode.trim()) e.zipCode = "Required";
    }
    if (s === 3) {
      if (!form.grade)          e.grade         = "Required — select a grade";
      if (!form.section)        e.section       = "Required — select a section";
      if (!form.rollNo?.trim()) e.rollNo        = "Required — enter roll number";
      if (!form.admissionDate)  e.admissionDate = "Required";
      if (!form.academicYear)   e.academicYear  = "Required";
    }
    if (s === 4) {
      if (!form.fatherName.trim() && !form.motherName.trim() && !form.guardianName.trim())
        e.guardianName = "At least one parent / guardian is required";
      if (!form.emergencyContact.trim()) e.emergencyContact = "Required";
    }
    if (s === 6) {
      if (!form.birthCertificate) e.birthCertificate = "Birth certificate is required";
      if (!form.addressProof)     e.addressProof     = "Address proof is required";
      if (!form.parentIdProof)    e.parentIdProof    = "Parent ID is required";
    }
    if (s === 7) {
      if (!form.feeStructure) e.feeStructure = "Required";
      if (!form.paymentPlan)  e.paymentPlan  = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => { if (validate(step)) setStep(p => Math.min(p + 1, STEPS.length)); };
  const goPrev = () => setStep(p => Math.max(p - 1, 1));

  // ── SUBMIT ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate(step)) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build guardians array
      const guardians = [];
      if (form.fatherName?.trim() && form.fatherPhone?.trim())
        guardians.push({
          name: form.fatherName.trim(), relation: "father",
          phone: form.fatherPhone.trim(),
          ...(form.fatherEmail?.trim() && { email: form.fatherEmail.trim() }),
          occupation: form.fatherOccupation?.trim() || undefined,
        });
      if (form.motherName?.trim() && form.motherPhone?.trim())
        guardians.push({
          name: form.motherName.trim(), relation: "mother",
          phone: form.motherPhone.trim(),
          ...(form.motherEmail?.trim() && { email: form.motherEmail.trim() }),
          occupation: form.motherOccupation?.trim() || undefined,
        });
      if (form.guardianName?.trim() && form.guardianPhone?.trim())
        guardians.push({
          name: form.guardianName.trim(), relation: form.guardianRelation?.trim() || "guardian",
          phone: form.guardianPhone.trim(),
        });
      // FIX: Always include emergency contact as a guardian if no other guardian exists
      if (guardians.length === 0 && form.emergencyContact?.trim())
        guardians.push({ name: "Emergency Contact", relation: "guardian", phone: form.emergencyContact.trim() });

      // Build medicalConditions array
      const medicalArr = [];
      const addMedical = (value, prefix = "") => {
        if (typeof value !== "string") return;
        const val = value.trim();
        if (val && !["none", "n/a", ""].includes(val.toLowerCase()))
          medicalArr.push(prefix ? `${prefix}: ${val}` : val);
      };
      addMedical(form.medicalConditions);
      addMedical(form.allergies,    "Allergies");
      addMedical(form.medications,  "Medications");
      if (form.vaccinations?.trim()) medicalArr.push(`Vaccinations: ${form.vaccinations.trim()}`);

      let feeCategory = "regular";
      if (form.scholarshipApplied) feeCategory = "scholarship";
      else if (form.discountApplicable && form.discountType === "merit") feeCategory = "concession";

      // FIX: send grade and section as separate fields (not a combined className string)
      const payload = {
        firstName:     form.firstName.trim(),
        lastName:      form.lastName.trim(),
        dateOfBirth:   form.dateOfBirth,
        gender:        form.gender?.toLowerCase()         || undefined,
        bloodGroup:    form.bloodGroup                    || undefined,
        nationality:   form.nationality?.trim()           || undefined,
        religion:      form.religion?.trim()              || undefined,
        email:         form.email?.trim().toLowerCase()   || undefined,
        phone:         form.phone?.trim()                 || undefined,
        address:       form.address?.trim()               || undefined,
        city:          form.city?.trim()                  || undefined,
        state:         form.state?.trim()                 || undefined,
        zipCode:       form.zipCode?.trim()               || undefined,
        grade:         form.grade.trim(),       // ← correct: separate grade field
        section:       form.section.trim().toUpperCase(), // ← correct: separate section field
        rollNo:        form.rollNo?.trim()                || undefined,
        admissionDate: form.admissionDate                 || undefined,
        academicYear:  form.academicYear                  || undefined,
        previousSchool: form.previousSchool?.trim()       || undefined,
        guardians,
        medicalConditions:  medicalArr,
        emergencyContact:   form.emergencyContact?.trim() || undefined, // FIX: was missing
        feeCategory,
        discountApplicable: !!form.discountApplicable,
        discountType:       form.discountType             || undefined,
        scholarshipApplied: !!form.scholarshipApplied,
      };

      // Remove undefined keys so Mongoose validators don't complain
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const res  = await authFetch("/students", { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);

      navigate("/school-admin/students", {
        replace: true,
        state: { toast: `${data.student?.firstName || form.firstName} ${data.student?.lastName || form.lastName} enrolled successfully!` },
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
                  {form.photo
                    ? <img src={form.photo} alt="Student" className="w-full h-full object-cover" />
                    : <User className="w-12 h-12 text-gray-300" />}
                </div>
                <button type="button" onClick={() => photoRef.current?.click()}
                  className="absolute bottom-1 right-1 p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-700 shadow">
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handlePhoto(e.target.files)} />
              </div>
              <p className="text-xs text-gray-400 mt-2">Student photo (optional)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="First Name" required error={errors.firstName}>
                <input type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inputCls(errors.firstName)} placeholder="First name" />
              </FormField>
              <FormField label="Middle Name">
                <input type="text" value={form.middleName} onChange={e => set("middleName", e.target.value)} className={inputCls()} placeholder="Middle name" />
              </FormField>
              <FormField label="Last Name" required error={errors.lastName}>
                <input type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inputCls(errors.lastName)} placeholder="Last name" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Date of Birth" required error={errors.dateOfBirth}>
                <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} className={inputCls(errors.dateOfBirth)} />
                {form.dateOfBirth && <p className="text-xs text-gray-400 mt-1">Age: {age(form.dateOfBirth)} yrs</p>}
              </FormField>
              <FormField label="Gender" required error={errors.gender}>
                <select value={form.gender} onChange={e => set("gender", e.target.value)} className={inputCls(errors.gender)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
              <FormField label="Blood Group" required error={errors.bloodGroup}>
                <select value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} className={inputCls(errors.bloodGroup)}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nationality">
                <input type="text" value={form.nationality} onChange={e => set("nationality", e.target.value)} className={inputCls()} placeholder="e.g. Indian" />
              </FormField>
              <FormField label="Religion">
                <input type="text" value={form.religion} onChange={e => set("religion", e.target.value)} className={inputCls()} placeholder="Optional" />
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
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls(errors.email)} placeholder="student@example.com" />
              </FormField>
              <FormField label="Phone Number" required error={errors.phone}>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls(errors.phone)} placeholder="+91 98765 43210" />
              </FormField>
            </div>
            <FormField label="Street Address" required error={errors.address}>
              <textarea value={form.address} onChange={e => set("address", e.target.value)} className={inputCls(errors.address)} rows={3} placeholder="Full address" />
            </FormField>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="City"    required error={errors.city}>
                <input type="text" value={form.city}    onChange={e => set("city",    e.target.value)} className={inputCls(errors.city)}    placeholder="City" />
              </FormField>
              <FormField label="State"   required error={errors.state}>
                <input type="text" value={form.state}   onChange={e => set("state",   e.target.value)} className={inputCls(errors.state)}   placeholder="State" />
              </FormField>
              <FormField label="PIN / ZIP" required error={errors.zipCode}>
                <input type="text" value={form.zipCode} onChange={e => set("zipCode", e.target.value)} className={inputCls(errors.zipCode)} placeholder="PIN code" />
              </FormField>
              <FormField label="Country">
                <input type="text" value={form.country} onChange={e => set("country", e.target.value)} className={inputCls()} placeholder="India" />
              </FormField>
            </div>
          </div>
        );

      // ── 3: Academic ──────────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Select the <strong>Grade</strong> first — the available sections will filter automatically.
                The <strong>Roll Number</strong> is auto-suggested based on existing students in that class.
              </span>
            </div>

            {/* Grade → Section → Roll No in one row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* GRADE */}
              <FormField label="Grade / Class" required error={errors.grade}>
                {loadingClasses ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <select
                    value={form.grade}
                    onChange={e => handleGradeChange(e.target.value)}
                    className={inputCls(errors.grade)}
                  >
                    <option value="">Select grade…</option>
                    {availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                )}
                {availableGrades.length === 0 && !loadingClasses && (
                  <p className="text-xs text-amber-600 mt-1">No classes found. Enroll students or create classes first.</p>
                )}
              </FormField>

              {/* SECTION — filtered by selected grade */}
              <FormField label="Section" required error={errors.section}>
                <select
                  value={form.section}
                  onChange={e => handleSectionChange(e.target.value)}
                  disabled={!form.grade}
                  className={`${inputCls(errors.section)} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {form.grade ? "Select section…" : "Select grade first"}
                  </option>
                  {sectionsForGrade.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {form.grade && sectionsForGrade.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No sections for this grade yet.</p>
                )}
              </FormField>

              {/* ROLL NUMBER — auto-suggested, editable */}
              <FormField label="Roll Number" required error={errors.rollNo}>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.rollNo}
                    onChange={e => set("rollNo", e.target.value)}
                    disabled={!form.section}
                    className={`${inputCls(errors.rollNo)} pl-9 pr-9 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                    placeholder={
                      !form.grade   ? "Select grade first"   :
                      !form.section ? "Select section first" :
                      rollNoLoading ? "Fetching…"            : "e.g. 01"
                    }
                  />
                  {rollNoLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                  )}
                </div>
                {rollNoSuggestion && !rollNoLoading && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 flex-wrap">
                    <CheckCircle className="w-3 h-3" />
                    Next available: <strong>{rollNoSuggestion}</strong>
                    {form.rollNo !== rollNoSuggestion && (
                      <button type="button" onClick={() => set("rollNo", rollNoSuggestion)}
                        className="ml-1 underline hover:no-underline font-semibold">
                        Use this
                      </button>
                    )}
                  </p>
                )}
              </FormField>
            </div>

            {/* Summary chip when all three are filled */}
            {form.grade && form.section && form.rollNo && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                Student will be placed in <strong>Grade {form.grade} — Section {form.section}</strong>, Roll No <strong>{form.rollNo}</strong>.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Admission Date" required error={errors.admissionDate}>
                <input type="date" value={form.admissionDate} onChange={e => set("admissionDate", e.target.value)} className={inputCls(errors.admissionDate)} />
              </FormField>
              <FormField label="Academic Year" required error={errors.academicYear}>
                <select value={form.academicYear} onChange={e => set("academicYear", e.target.value)} className={inputCls(errors.academicYear)}>
                  <option value="">Select year</option>
                  {ACAD_YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </FormField>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Previous School (optional)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="School Name">
                  <input type="text" value={form.previousSchool} onChange={e => set("previousSchool", e.target.value)} className={inputCls()} placeholder="Previous school name" />
                </FormField>
                <FormField label="Previous Class">
                  <input type="text" value={form.previousClass} onChange={e => set("previousClass", e.target.value)} className={inputCls()} placeholder="Class / Grade" />
                </FormField>
              </div>
            </div>
          </div>
        );

      // ── 4: Parents ───────────────────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Fill in at least one parent/guardian. Their <strong>email</strong> will be used to link
                their parent login account to this student automatically.
              </span>
            </div>

            {/* Father */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Father's Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[["fatherName","Full Name","text"],["fatherPhone","Phone","tel"],["fatherEmail","Email","email"],["fatherOccupation","Occupation","text"]].map(([f, l, t]) => (
                  <FormField key={f} label={l}>
                    <input type={t} value={form[f]} onChange={e => set(f, e.target.value)} className={inputCls()} placeholder={l} />
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
                {[["motherName","Full Name","text"],["motherPhone","Phone","tel"],["motherEmail","Email","email"],["motherOccupation","Occupation","text"]].map(([f, l, t]) => (
                  <FormField key={f} label={l}>
                    <input type={t} value={form[f]} onChange={e => set(f, e.target.value)} className={inputCls()} placeholder={l} />
                  </FormField>
                ))}
              </div>
            </div>

            {/* Guardian */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Guardian (if different from parents)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField label="Guardian Name" error={errors.guardianName}>
                  <input type="text" value={form.guardianName} onChange={e => set("guardianName", e.target.value)} className={inputCls(errors.guardianName)} placeholder="Name" />
                </FormField>
                <FormField label="Relation">
                  <input type="text" value={form.guardianRelation} onChange={e => set("guardianRelation", e.target.value)} className={inputCls()} placeholder="e.g. Uncle" />
                </FormField>
                <FormField label="Phone">
                  <input type="tel" value={form.guardianPhone} onChange={e => set("guardianPhone", e.target.value)} className={inputCls()} placeholder="+91 …" />
                </FormField>
              </div>
              {errors.guardianName && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.guardianName}
                </p>
              )}
            </div>

            {/* Emergency */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Emergency Contact
              </p>
              <FormField label="Contact Number" required error={errors.emergencyContact}>
                <input type="tel" value={form.emergencyContact} onChange={e => set("emergencyContact", e.target.value)} className={inputCls(errors.emergencyContact)} placeholder="+91 98765 43210" />
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
                ["medicalConditions", "Known Medical Conditions", "conditions or 'None'"],
                ["allergies",         "Allergies",                "allergies or 'None'"  ],
                ["medications",       "Current Medications",      "medications or 'None'"],
                ["vaccinations",      "Vaccination Status",       "e.g. Up to date"      ],
              ].map(([f, l, ph]) => (
                <FormField key={f} label={l}>
                  <textarea value={form[f]} onChange={e => set(f, e.target.value)}
                    className={inputCls()} rows={3} placeholder={`Enter ${ph}`} />
                </FormField>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Healthcare Provider</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Doctor's Name">
                  <input type="text" value={form.doctorName} onChange={e => set("doctorName", e.target.value)} className={inputCls()} placeholder="Doctor name" />
                </FormField>
                <FormField label="Doctor's Phone">
                  <input type="tel" value={form.doctorPhone} onChange={e => set("doctorPhone", e.target.value)} className={inputCls()} placeholder="+91 …" />
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
              <span>Upload clear copies. Accepted: PDF, JPG, PNG — max 5 MB each.</span>
            </div>
            {[
              ["birthCertificate",     "Birth Certificate",                 true ],
              ["addressProof",         "Address Proof",                     true ],
              ["parentIdProof",        "Parent ID Proof",                   true ],
              ["previousSchoolRecords","Previous School Records (optional)", false],
            ].map(([field, label, required]) => (
              <FormField key={field} label={label} required={required} error={errors[field]}>
                <FileUploadField
                  file={form[field]}
                  progress={uploadProgress[field]}
                  onUpload={f => handleFileUpload(field, f)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </FormField>
            ))}
          </div>
        );

      // ── 7: Fees ──────────────────────────────────────────────────────────────
      case 7:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Fee Structure" required error={errors.feeStructure}>
                <select value={form.feeStructure} onChange={e => set("feeStructure", e.target.value)} className={inputCls(errors.feeStructure)}>
                  <option value="">Select</option>
                  <option value="regular">Regular</option>
                  <option value="concession">Concession</option>
                  <option value="free">Free / RTE</option>
                  <option value="scholarship">Scholarship</option>
                </select>
              </FormField>
              <FormField label="Payment Plan" required error={errors.paymentPlan}>
                <select value={form.paymentPlan} onChange={e => set("paymentPlan", e.target.value)} className={inputCls(errors.paymentPlan)}>
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
                <input type="checkbox" checked={form.discountApplicable}
                  onChange={e => set("discountApplicable", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Apply Discount</span>
              </label>
              {form.discountApplicable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <FormField label="Discount Type">
                    <select value={form.discountType} onChange={e => set("discountType", e.target.value)} className={inputCls()}>
                      <option value="">Select type</option>
                      <option value="sibling">Sibling (10%)</option>
                      <option value="merit">Merit (15%)</option>
                      <option value="staff">Staff Child (20%)</option>
                      <option value="earlybird">Early Bird (5%)</option>
                    </select>
                  </FormField>
                  <FormField label="Discount Amount (₹)">
                    <input type="number" min="0" value={form.discountAmount} onChange={e => set("discountAmount", e.target.value)} className={inputCls()} placeholder="0" />
                  </FormField>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.scholarshipApplied}
                  onChange={e => set("scholarshipApplied", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Apply for Scholarship</span>
              </label>
              {form.scholarshipApplied && (
                <FormField label="Scholarship Details">
                  <textarea value={form.scholarshipDetails} onChange={e => set("scholarshipDetails", e.target.value)}
                    className={inputCls()} rows={3} placeholder="Describe eligibility / scholarship name" />
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
              <h3 className="text-lg font-bold text-gray-900">Review Your Application</h3>
              <p className="text-sm text-gray-400">Verify all details before submitting</p>
            </div>

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
                title: "Personal", icon: User,
                rows: [
                  ["Name",        `${form.firstName} ${form.middleName} ${form.lastName}`.trim()],
                  ["DOB / Gender", `${form.dateOfBirth} · ${form.gender}`],
                  ["Blood Group",  form.bloodGroup],
                ],
              },
              {
                title: "Contact", icon: MapPin,
                rows: [
                  ["Email",   form.email],
                  ["Phone",   form.phone],
                  ["Address", `${form.address}, ${form.city}, ${form.state} ${form.zipCode}`],
                ],
              },
              {
                title: "Academic", icon: BookOpen,
                rows: [
                  ["Grade",         form.grade],
                  ["Section",       form.section],
                  ["Roll Number",   form.rollNo],
                  ["Academic Year", form.academicYear],
                  ["Admission Date",form.admissionDate],
                ],
              },
              {
                title: "Parents", icon: Users,
                rows: [
                  ...(form.fatherName ? [["Father", `${form.fatherName} · ${form.fatherPhone}`]] : []),
                  ...(form.motherName ? [["Mother", `${form.motherName} · ${form.motherPhone}`]] : []),
                  ["Emergency", form.emergencyContact],
                ],
              },
              {
                title: "Fees", icon: DollarSign,
                rows: [
                  ["Structure", form.feeStructure],
                  ["Plan",      form.paymentPlan],
                ],
              },
            ].map(({ title, icon: Icon, rows }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-blue-500" />{title}
                </p>
                <div className="space-y-1.5">
                  {rows.map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-gray-400 w-1/3 flex-shrink-0">{l}</span>
                      <span className="font-medium text-gray-800 text-right">{v || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 text-center pt-2">
              By submitting you confirm all information is accurate and agree to the school's enrollment policy.
            </p>
          </div>
        );

      default: return null;
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-0">
        {/* Header + progress */}
        <div className="bg-white rounded-t-2xl border border-gray-100 shadow-sm px-6 pt-6 pb-5">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Enrollment</h1>
              <p className="text-gray-400 text-sm mt-0.5">Complete all steps to save to the database</p>
            </div>
            <button onClick={() => onClose ? onClose() : navigate("/school-admin/students")}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step bar */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <button type="button" onClick={() => step > s.id && setStep(s.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step === s.id
                        ? "bg-blue-600 text-white shadow-md scale-110"
                        : step > s.id
                          ? "bg-green-500 text-white cursor-pointer hover:bg-green-600"
                          : "bg-gray-100 text-gray-400"
                    }`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </button>
                  <p className={`text-[10px] mt-1 font-medium hidden sm:block text-center leading-tight max-w-[56px] ${step >= s.id ? "text-gray-700" : "text-gray-400"}`}>
                    {s.name}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${step > s.id ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="bg-white border-x border-gray-100 shadow-sm px-6 py-7">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900">{STEPS[step - 1].name}</h2>
            <p className="text-xs text-gray-400">{STEPS[step - 1].desc}</p>
          </div>
          {renderStep()}
        </div>

        {/* Footer nav */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
          <button onClick={goPrev} disabled={step === 1}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm rounded-lg transition-all ${
              step === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-gray-400">Step {step} / {STEPS.length}</span>

          {step < STEPS.length ? (
            <button onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSubmitting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving to Database…</>
                : <><Send className="w-4 h-4" /> Enroll Student</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}