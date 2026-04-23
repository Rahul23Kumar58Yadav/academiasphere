// src/pages/auth/Register.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  School,
  UserPlus,
  BookOpen,
  MapPin,
  GraduationCap,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Layers,
  Hash,
  ShieldCheck,
  Users,
  Crown,
} from "lucide-react";

// ─── Role config ──────────────────────────────────────────────────────────────
const ALL_ROLES = [
  {
    key: "super_admin",
    label: "Super Admin",
    icon: Crown,
    color: "rose",
    desc: "Platform-level administrator access",
  },
  {
    key: "school",
    label: "School Admin",
    icon: Building2,
    color: "amber",
    desc: "Register & manage your institution",
  },
  {
    key: "teacher",
    label: "Teacher",
    icon: BookOpen,
    color: "emerald",
    desc: "Manage classes & student progress",
  },
  {
    key: "parent",
    label: "Parent",
    icon: Users,
    color: "violet",
    desc: "Track your child's performance",
  },
  {
    key: "student",
    label: "Student",
    icon: GraduationCap,
    color: "blue",
    desc: "Join your school's learning platform",
  },
];

const BOARDS = ["CBSE", "ICSE", "State", "IB", "IGCSE"];
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Chandigarh",
  "Jammu & Kashmir",
  "Ladakh",
];

// ─── Color map ────────────────────────────────────────────────────────────────
const COLOR = {
  rose: {
    ring: "ring-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-500",
    text: "text-rose-700",
    btn: "bg-rose-600 hover:bg-rose-700",
    icon: "text-rose-600",
  },
  amber: {
    ring: "ring-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-500",
    text: "text-amber-700",
    btn: "bg-amber-600 hover:bg-amber-700",
    icon: "text-amber-600",
  },
  emerald: {
    ring: "ring-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-500",
    text: "text-emerald-700",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    icon: "text-emerald-600",
  },
  violet: {
    ring: "ring-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-500",
    text: "text-violet-700",
    btn: "bg-violet-600 hover:bg-violet-700",
    icon: "text-violet-600",
  },
  blue: {
    ring: "ring-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    icon: "text-blue-600",
  },
};

// ─── Field wrappers ───────────────────────────────────────────────────────────
const Field = ({ label, error, icon: Icon, children, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      {children}
    </div>
    {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const SaField = ({ label, error, icon: Icon, children, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
      )}
      {children}
    </div>
    {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const SectionLabel = ({ icon: Icon, children }) => (
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
    <Icon className="w-3.5 h-3.5" />
    {children}
  </p>
);

const inputCls = (error, hasIcon = true) =>
  `block w-full ${hasIcon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm border ${
    error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
  } rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300`;

const saInputCls = (error) =>
  `block w-full pl-9 pr-3 py-2.5 text-sm border ${
    error
      ? "border-red-500/50 bg-red-950/30 text-red-300"
      : "border-slate-600 bg-slate-700/60 text-slate-200"
  } rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-600`;

// ─── Initial states ───────────────────────────────────────────────────────────
const INIT_USER = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  schoolCode: "",
  agreeToTerms: false,
};
const INIT_SUPER = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
};
const INIT_SCHOOL = {
  schoolName: "",
  schoolCode: "",
  city: "",
  state: "",
  board: "CBSE",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  password: "",
  confirmPassword: "",
};

// ═════════════════════════════════════════════════════════════════════════════
export default function Register() {
  const {
    register,
    registerSchool,
    setupSuperAdmin,
    superAdminExists,
    error: authError,
  } = useAuth();

  // Hide the Super Admin tab once a SA already exists in the DB
  const ROLES =
    superAdminExists === true
      ? ALL_ROLES.filter((r) => r.key !== "super_admin")
      : ALL_ROLES;

  const [role, setRole] = useState("student");
  const [user, setUser] = useState(INIT_USER);
  const [superAdmin, setSuperAdmin] = useState(INIT_SUPER);
  const [school, setSchool] = useState(INIT_SCHOOL);

  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false); // school success
  const [saSuccess, setSaSuccess] = useState(false); // sa success

  // If the currently selected role was hidden (SA tab removed), fall back to student
  const safeRole = ROLES.find((r) => r.key === role) ? role : "student";
  const activeRole = ROLES.find((r) => r.key === safeRole) || ROLES[0];
  const c = COLOR[activeRole.color];
  const isSchool = safeRole === "school";
  const isSA = safeRole === "super_admin";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUser = (e) => {
    const { name, value, type, checked } = e.target;
    setUser((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };
  const handleSA = (e) => {
    const { name, value, type, checked } = e.target;
    setSuperAdmin((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };
  const handleSchool = (e) => {
    const { name, value } = e.target;
    const sanitized =
      name === "schoolCode"
        ? value.toUpperCase().replace(/[^A-Z0-9]/g, "")
        : value;
    setSchool((p) => ({ ...p, [name]: sanitized }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const baseValidate = (src, requireSchoolCode = false) => {
    const e = {};
    if (!src.name.trim() || src.name.trim().length < 3)
      e.name = "Full name must be at least 3 characters";
    if (!src.email || !/\S+@\S+\.\S+/.test(src.email))
      e.email = "Valid email required";
    if (!src.phone || !/^\d{10}$/.test(src.phone.replace(/[-\s]/g, "")))
      e.phone = "10-digit phone number required";
    if (!src.password || src.password.length < 8)
      e.password = "Minimum 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(src.password))
      e.password = "Include uppercase, lowercase, and a number";
    if (src.password !== src.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (requireSchoolCode && !src.schoolCode?.trim())
      e.schoolCode = "School code is required";
    if (!src.agreeToTerms)
      e.agreeToTerms = "Please accept the terms to continue";
    return e;
  };

  const validateSA = () => {
    const e = baseValidate(superAdmin, false);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateUser = () => {
    const e = baseValidate(user, ["student", "teacher"].includes(safeRole));
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSchool = () => {
    const e = {};
    if (!school.schoolName.trim()) e.schoolName = "School name is required";
    if (!school.schoolCode.trim()) e.schoolCode = "School code is required";
    else if (school.schoolCode.length < 4)
      e.schoolCode = "Code must be at least 4 characters";
    else if (school.schoolCode.length > 10)
      e.schoolCode = "Code must be 10 characters or fewer";
    if (!school.city.trim()) e.city = "City is required";
    if (!school.state) e.state = "State is required";
    if (!school.board) e.board = "Board is required";
    if (!school.adminName.trim()) e.adminName = "Admin name is required";
    if (!school.adminEmail || !/\S+@\S+\.\S+/.test(school.adminEmail))
      e.adminEmail = "Valid admin email required";
    if (
      !school.adminPhone ||
      !/^\d{10}$/.test(school.adminPhone.replace(/[-\s]/g, ""))
    )
      e.adminPhone = "10-digit phone number required";

    // ← add these
    if (!school.password || school.password.length < 8)
      e.password = "Minimum 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(school.password))
      e.password = "Include uppercase, lowercase, and a number";
    if (school.password !== school.confirmPassword)
      e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSchool) {
      if (!validateSchool()) return;
      setLoading(true);
      try {
        const result = await registerSchool({
          schoolName: school.schoolName,
          schoolCode: school.schoolCode,
          city: school.city,
          state: school.state,
          type: school.board,
          adminName: school.adminName,
          adminEmail: school.adminEmail,
          adminPhone: school.adminPhone,
          password: school.password, // ← add this
        });
        if (result.success) setSubmitted(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSA) {
      if (!validateSA()) return;
      setLoading(true);
      try {
        // Uses the dedicated /setup-super-admin endpoint (not /register)
        const result = await setupSuperAdmin({
          name: superAdmin.name,
          email: superAdmin.email,
          phone: superAdmin.phone,
          password: superAdmin.password,
        });
        if (result?.success) setSaSuccess(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!validateUser()) return;
    setLoading(true);
    try {
      await register({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password,
        role: safeRole.toUpperCase(),
        schoolCode: user.schoolCode,
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Super Admin already exists — show info instead of form ──────────────
  if (superAdminExists === true && safeRole === "super_admin") {
    // fallback — shouldn't normally reach here since tab is hidden
    return null;
  }

  // ─── Super Admin success ──────────────────────────────────────────────────
  if (saSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-slate-800 border border-rose-500/30 rounded-2xl shadow-2xl p-10">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-rose-500/40">
              <ShieldCheck className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Super Admin Created
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Account for{" "}
              <strong className="text-white">{superAdmin.name}</strong>{" "}
              registered successfully. You're being redirected to your
              dashboard…
            </p>
            <Link
              to="/super-admin/dashboard"
              className="inline-block w-full py-3 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── School application success ───────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Application Submitted!
            </h2>
            <div className="bg-amber-600 text-white rounded-xl px-5 py-4 mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-1">
                Your School Code
              </p>
              <p className="text-3xl font-extrabold tracking-widest">
                {school.schoolCode}
              </p>
              <p className="text-xs opacity-75 mt-1">
                Share with teachers, students & parents after approval
              </p>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Registration for{" "}
              <strong className="text-gray-700">{school.schoolName}</strong>{" "}
              received. Reviewed within{" "}
              <strong className="text-gray-700">2–3 business days</strong> —
              confirmation sent to{" "}
              <strong className="text-gray-700">{school.adminEmail}</strong>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-800 mb-6">
              <p className="font-semibold mb-1">What happens next?</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700">
                <li>Super Admin reviews your application</li>
                <li>On approval you receive a setup link via email</li>
                <li>Set your password — school code is already reserved</li>
                <li>
                  Share <strong>{school.schoolCode}</strong> so staff &amp;
                  students can register
                </li>
              </ol>
            </div>
            <Link
              to="/login"
              className="inline-block w-full py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Super Admin dark-theme shell ─────────────────────────────────────────
  if (isSA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/15 rounded-2xl mb-4 ring-2 ring-rose-500/30">
              <Crown className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              Super Admin Registration
            </h1>
            <p className="text-slate-400 text-sm">
              One-time setup · Restricted to platform owner
            </p>
          </div>

          {/* Role tabs */}
          <div className="grid grid-cols-5 mb-0 bg-slate-800/60 rounded-t-2xl border border-slate-700/50 border-b-0 overflow-hidden">
            {ROLES.map((r) => {
              const active = safeRole === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setRole(r.key);
                    setErrors({});
                  }}
                  className={`flex flex-col items-center gap-1 py-3 px-1 text-xs font-medium transition-all border-b-2 ${
                    active
                      ? "border-rose-500 text-rose-400 bg-rose-500/10"
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  {React.createElement(r.icon, { className: "w-4 h-4" })}
                  <span className="hidden sm:block leading-tight text-center">
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/50 rounded-b-2xl rounded-tr-2xl shadow-2xl overflow-hidden">
            <div className="bg-rose-950/60 border-b border-rose-500/20 px-6 py-3 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300">
                <strong>One-time setup.</strong> This endpoint is permanently
                disabled after the first Super Admin is created.
              </p>
            </div>

            {/* Auth context error */}
            {authError && (
              <div className="mx-7 mt-5 bg-red-950/50 border border-red-500/40 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <SaField label="Full Name" error={errors.name} icon={User}>
                  <input
                    type="text"
                    name="name"
                    value={superAdmin.name}
                    onChange={handleSA}
                    placeholder="Admin full name"
                    className={saInputCls(errors.name)}
                  />
                </SaField>

                <SaField label="Email Address" error={errors.email} icon={Mail}>
                  <input
                    type="email"
                    name="email"
                    value={superAdmin.email}
                    onChange={handleSA}
                    placeholder="admin@platform.com"
                    className={saInputCls(errors.email)}
                  />
                </SaField>

                <SaField label="Phone Number" error={errors.phone} icon={Phone}>
                  <input
                    type="tel"
                    name="phone"
                    value={superAdmin.phone}
                    onChange={handleSA}
                    placeholder="10-digit number"
                    className={saInputCls(errors.phone)}
                  />
                </SaField>

                <SaField label="Password" error={errors.password} icon={Lock}>
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    value={superAdmin.password}
                    onChange={handleSA}
                    placeholder="Min. 8 characters"
                    className={`${saInputCls(errors.password)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </SaField>

                <SaField
                  label="Confirm Password"
                  error={errors.confirmPassword}
                  icon={Lock}
                >
                  <input
                    type={showCPwd ? "text" : "password"}
                    name="confirmPassword"
                    value={superAdmin.confirmPassword}
                    onChange={handleSA}
                    placeholder="Repeat password"
                    className={`${saInputCls(errors.confirmPassword)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCPwd((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showCPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </SaField>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <input
                    id="saTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={superAdmin.agreeToTerms}
                    onChange={handleSA}
                    className="h-4 w-4 mt-0.5 rounded border-slate-600 bg-slate-700 text-rose-500 focus:ring-rose-500"
                  />
                  <label
                    htmlFor="saTerms"
                    className="text-sm text-slate-400 leading-relaxed"
                  >
                    I accept the{" "}
                    <Link
                      to="/terms"
                      className="font-medium text-rose-400 hover:underline"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="font-medium text-rose-400 hover:underline"
                    >
                      Privacy Policy
                    </Link>{" "}
                    and acknowledge this account has full platform access.
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating Super Admin…
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Create Super Admin Account
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-rose-400 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">
            © {new Date().getFullYear()} School Management System · All rights
            reserved
          </p>
        </div>
      </div>
    );
  }

  // ─── Standard light form (School Admin / Teacher / Parent / Student) ──────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-7">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 ${c.bg} rounded-2xl mb-4 ring-1 ${c.ring} ring-opacity-30`}
          >
            {React.createElement(activeRole.icon, {
              className: `w-7 h-7 ${c.icon}`,
            })}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            {isSchool ? "Register Your School" : "Create Account"}
          </h1>
          <p className="text-gray-400 text-sm">{activeRole.desc}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Role tabs */}
          <div
            className={`grid grid-cols-${ROLES.length} border-b border-gray-100`}
          >
            {ROLES.map((r) => {
              const rc = COLOR[r.color];
              const active = safeRole === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setRole(r.key);
                    setErrors({});
                  }}
                  className={`flex flex-col items-center gap-1 py-4 px-1 text-xs font-medium transition-all border-b-2 ${
                    active
                      ? `${rc.border} ${rc.text} ${rc.bg}`
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {React.createElement(r.icon, { className: "w-5 h-5" })}
                  <span className="hidden sm:block leading-tight text-center">
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Auth context error banner */}
          {authError && (
            <div className="mx-7 mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-7 space-y-5">
            {/* ── SCHOOL ADMIN form ──────────────────────────────────────── */}
            {isSchool && (
              <>
                <div>
                  <SectionLabel icon={Building2}>
                    School Information
                  </SectionLabel>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Field
                        label="School Name"
                        error={errors.schoolName}
                        icon={Building2}
                      >
                        <input
                          type="text"
                          name="schoolName"
                          value={school.schoolName}
                          onChange={handleSchool}
                          placeholder="e.g. Delhi Public School"
                          className={inputCls(errors.schoolName)}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field
                        label="School Code"
                        error={errors.schoolCode}
                        icon={Hash}
                        hint="4–10 uppercase letters/numbers. Teachers, students & parents use this to join."
                      >
                        <input
                          type="text"
                          name="schoolCode"
                          value={school.schoolCode}
                          onChange={handleSchool}
                          placeholder="e.g. DPS2024"
                          maxLength={10}
                          className={`${inputCls(errors.schoolCode)} uppercase tracking-widest font-mono font-semibold`}
                          style={{
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                          }}
                        />
                        {school.schoolCode && !errors.schoolCode && (
                          <span className="absolute inset-y-0 right-3 flex items-center">
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md tracking-widest">
                              {school.schoolCode}
                            </span>
                          </span>
                        )}
                      </Field>
                    </div>
                    <Field label="City" error={errors.city} icon={MapPin}>
                      <input
                        type="text"
                        name="city"
                        value={school.city}
                        onChange={handleSchool}
                        placeholder="e.g. Mumbai"
                        className={inputCls(errors.city)}
                      />
                    </Field>
                    <Field label="State" error={errors.state} icon={MapPin}>
                      <select
                        name="state"
                        value={school.state}
                        onChange={handleSchool}
                        className={
                          inputCls(errors.state) +
                          " appearance-none cursor-pointer"
                        }
                      >
                        <option value="">Select state…</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Board / Affiliation"
                      error={errors.board}
                      icon={Layers}
                    >
                      <select
                        name="board"
                        value={school.board}
                        onChange={handleSchool}
                        className={`${inputCls(errors.board)} appearance-none cursor-pointer`}
                      >
                        {BOARDS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-5">
                  <SectionLabel icon={User}>Admin Contact Details</SectionLabel>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      label="Admin Full Name"
                      error={errors.adminName}
                      icon={User}
                    >
                      <input
                        type="text"
                        name="adminName"
                        value={school.adminName}
                        onChange={handleSchool}
                        placeholder="Full name"
                        className={inputCls(errors.adminName)}
                      />
                    </Field>
                    <Field
                      label="Admin Phone"
                      error={errors.adminPhone}
                      icon={Phone}
                    >
                      <input
                        type="tel"
                        name="adminPhone"
                        value={school.adminPhone}
                        onChange={handleSchool}
                        placeholder="10-digit number"
                        className={inputCls(errors.adminPhone)}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field
                        label="Admin Email ID"
                        error={errors.adminEmail}
                        icon={Mail}
                      >
                        <input
                          type="email"
                          name="adminEmail"
                          value={school.adminEmail}
                          onChange={handleSchool}
                          placeholder="admin@school.edu.in"
                          className={inputCls(errors.adminEmail)}
                        />
                      </Field>
                      <Field
                        label="Password"
                        error={errors.password}
                        icon={Lock}
                      >
                        <input
                          type={showPwd ? "text" : "password"}
                          name="password"
                          value={school.password}
                          onChange={handleSchool}
                          placeholder="Min. 8 characters"
                          className={`${inputCls(errors.password)} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPwd ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </Field>
                      <Field
                        label="Confirm Password"
                        error={errors.confirmPassword}
                        icon={Lock}
                      >
                        <input
                          type={showCPwd ? "text" : "password"}
                          name="confirmPassword"
                          value={school.confirmPassword}
                          onChange={handleSchool}
                          placeholder="Repeat password"
                          className={`${inputCls(errors.confirmPassword)} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCPwd((v) => !v)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showCPwd ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </Field>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
                  <strong>After submission:</strong> Our team reviews within 2–3
                  business days. On approval you'll receive a setup link. Your
                  school code is reserved immediately.
                </div>
              </>
            )}

            {/* ── Teacher / Parent / Student form ───────────────────────── */}
            {!isSchool && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Full Name" error={errors.name} icon={User}>
                    <input
                      type="text"
                      name="name"
                      value={user.name}
                      onChange={handleUser}
                      placeholder="Your full name"
                      className={inputCls(errors.name)}
                    />
                  </Field>
                  <Field label="Email Address" error={errors.email} icon={Mail}>
                    <input
                      type="email"
                      name="email"
                      value={user.email}
                      onChange={handleUser}
                      placeholder="you@example.com"
                      className={inputCls(errors.email)}
                    />
                  </Field>
                  <Field label="Phone Number" error={errors.phone} icon={Phone}>
                    <input
                      type="tel"
                      name="phone"
                      value={user.phone}
                      onChange={handleUser}
                      placeholder="10-digit number"
                      className={inputCls(errors.phone)}
                    />
                  </Field>
                  {["student", "teacher"].includes(safeRole) && (
                    <Field
                      label="School Code"
                      error={errors.schoolCode}
                      icon={School}
                    >
                      <input
                        type="text"
                        name="schoolCode"
                        value={user.schoolCode}
                        onChange={handleUser}
                        placeholder="e.g. DPS2024"
                        className={
                          inputCls(errors.schoolCode) + " uppercase font-mono"
                        }
                        style={{ textTransform: "uppercase" }}
                      />
                    </Field>
                  )}
                  <Field label="Password" error={errors.password} icon={Lock}>
                    <input
                      type={showPwd ? "text" : "password"}
                      name="password"
                      value={user.password}
                      onChange={handleUser}
                      placeholder="Min. 8 characters"
                      className={`${inputCls(errors.password)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </Field>
                  <Field
                    label="Confirm Password"
                    error={errors.confirmPassword}
                    icon={Lock}
                  >
                    <input
                      type={showCPwd ? "text" : "password"}
                      name="confirmPassword"
                      value={user.confirmPassword}
                      onChange={handleUser}
                      placeholder="Repeat password"
                      className={`${inputCls(errors.confirmPassword)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCPwd((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showCPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </Field>
                </div>

                {["student", "teacher"].includes(safeRole) && (
                  <div
                    className={`${c.bg} border ${c.border} border-opacity-40 rounded-xl px-4 py-3 text-xs ${c.text} leading-relaxed`}
                  >
                    <strong>How to find your School Code?</strong> Ask your
                    school administrator. It links your account to the correct
                    school automatically.
                  </div>
                )}
                {safeRole === "parent" && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-xs text-violet-700">
                    After registration, link your child's student ID from your
                    parent dashboard.
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-2">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={user.agreeToTerms}
                      onChange={handleUser}
                      className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="agreeToTerms"
                      className="text-sm text-gray-500 leading-relaxed"
                    >
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        className={`font-medium ${c.icon} hover:underline`}
                      >
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy"
                        className={`font-medium ${c.icon} hover:underline`}
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {errors.agreeToTerms}
                    </p>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 ${c.btn} text-white py-3 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${c.ring} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {isSchool ? "Submitting Application…" : "Creating Account…"}
                </>
              ) : (
                <>
                  {isSchool ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isSchool ? "Submit School Application" : "Create Account"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className={`font-semibold ${c.icon} hover:underline`}
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} School Management System · All rights
          reserved
        </p>
      </div>
    </div>
  );
}
