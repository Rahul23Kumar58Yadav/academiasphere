import { useState, useEffect, useCallback } from "react";
import {
  Award, Plus, Search, Filter, Shield, Download, Share2,
  Eye, Trash2, Edit2, X, Check, ChevronDown, RefreshCw,
  FileText, Trophy, Medal, Users, BookOpen, Calendar,
  AlertTriangle, Save, Copy, ExternalLink, CheckCircle,
  Clock, BarChart3, GraduationCap, Hash, Loader2,
} from "lucide-react";
import api from "../../services/api";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const CERT_TYPES = ["Academic", "Achievement", "Participation", "Sports", "Cultural", "Merit"];
const CERT_ICONS = {
  Academic: FileText,
  Achievement: Trophy,
  Participation: Medal,
  Sports: Award,
  Cultural: Award,
  Merit: GraduationCap,
};
const TYPE_COLORS = {
  Academic:      { bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
  Achievement:   { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  Participation: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Sports:        { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Cultural:      { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  Merit:         { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
};

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[92vh] flex flex-col`}
        style={{ fontFamily: "'DM Sans',sans-serif" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children, error }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inp = (err) =>
  `w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${
    err
      ? "border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
  }`;

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function Badge({ label, type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.Academic;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    verified: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Blockchain Verified", icon: Shield },
    pending:  { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Pending",             icon: Clock  },
    draft:    { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Draft",               icon: Edit2  },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <Icon size={10} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Certificates() {
  const [certificates,  setCertificates]  = useState([]);
  // classSections = ["9-A", "9-B", "10-A", …] from GET /students/classes
  const [classSections, setClassSections] = useState([]);
  const [students,      setStudents]      = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);

  // filters
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("all");
  const [filterClass,  setFilterClass]  = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // modals
  const [modal,    setModal]    = useState(null); // "create" | "view"
  const [selected, setSelected] = useState(null);

  // form
  const [form,   setForm]   = useState({});
  const [errors, setErrors] = useState({});

  // step in create modal
  const [step, setStep] = useState(1); // 1=details, 2=select students

  // selected students in create form
  const [pickedStudents, setPickedStudents] = useState([]);
  const [studentSearch,  setStudentSearch]  = useState("");

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/certificates");
      setCertificates(res.data.certificates ?? res.data ?? []);
    } catch (e) {
      // 404 means route not yet created on backend — show empty gracefully
      if (e.response?.status === 404) {
        setCertificates([]);
      } else {
        console.error("fetchCertificates:", e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Uses GET /api/v1/students/classes → returns ["9-A","10-B",…]
  const fetchClassSections = useCallback(async () => {
    try {
      const res = await api.get("/students/classes");
      // API returns { success, data: ["9-A", "10-B", ...] }
      const raw = res.data.data ?? res.data ?? [];
      setClassSections(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error("fetchClassSections:", e);
      setClassSections([]);
    }
  }, []);

  // Uses GET /api/v1/students?classSection=9-A → returns { data: [{_id, name, rollNumber,…}] }
  const fetchStudents = useCallback(async (classSection) => {
    if (!classSection || classSection === "all") { setStudents([]); return; }
    setStudentsLoading(true);
    try {
      const res = await api.get(`/students`, { params: { classSection } });
      // studentRoutes returns { success, data: [{_id, name, rollNumber, classSection}] }
      const list = res.data.data ?? res.data.students ?? res.data ?? [];
      // Normalise to a consistent shape { _id, name, rollNo, classSection }
      setStudents(
        list.map((s) => ({
          _id:          s._id,
          name:         s.name || `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
          rollNo:       s.rollNumber || s.rollNo || "—",
          classSection: s.classSection || classSection,
        }))
      );
    } catch (e) {
      console.error("fetchStudents:", e);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCertificates(); fetchClassSections(); }, [fetchCertificates, fetchClassSections]);

  // when classSection changes in form, reload student list
  useEffect(() => {
    if (form.classSection) fetchStudents(form.classSection);
    else setStudents([]);
    setPickedStudents([]);
  }, [form.classSection, fetchStudents]);

  // ── computed ───────────────────────────────────────────────────────────────
  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.title?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.certificateId?.toLowerCase().includes(q);
    const matchType   = filterType   === "all" || c.type   === filterType;
    const matchClass  = filterClass  === "all" || c.classSection === filterClass;
    const matchStatus = filterStatus === "all" || c.status  === filterStatus;
    return matchSearch && matchType && matchClass && matchStatus;
  });

  const stats = {
    total:    certificates.length,
    verified: certificates.filter((c) => c.status === "verified").length,
    pending:  certificates.filter((c) => c.status === "pending").length,
    students: [...new Set(certificates.map((c) => c.studentId))].length,
  };

  // ── handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ type: "Academic", academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1) });
    setErrors({});
    setStep(1);
    setPickedStudents([]);
    setStudentSearch("");
    setModal("create");
  };

  const openView = (cert) => { setSelected(cert); setModal("view"); };

  const validate = () => {
    const e = {};
    if (!form.title?.trim())       e.title       = "Title is required";
    if (!form.type)                e.type        = "Type is required";
    if (!form.classSection)        e.classSection = "Select a class";
    if (!form.academicYear?.trim())e.academicYear= "Academic year is required";
    if (!form.issuedDate)          e.issuedDate  = "Issue date is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    if (pickedStudents.length === 0) {
      alert("Select at least one student");
      return;
    }
    setSaving(true);
    try {
      // create one cert per student
      await Promise.all(
        pickedStudents.map((s) =>
          api.post("/certificates", {
            ...form,
            studentId:   s._id || s.studentId,
            studentName: s.name,
            rollNo:      s.rollNo,
            classSection: form.classSection,
            className:    form.classSection,
          })
        )
      );
      await fetchCertificates();
      setModal(null);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to create certificates");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this certificate?")) return;
    try {
      await api.delete(`/certificates/${id}`);
      await fetchCertificates();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const toggleStudent = (s) => {
    setPickedStudents((prev) =>
      prev.find((p) => (p._id || p.studentId) === (s._id || s.studentId))
        ? prev.filter((p) => (p._id || p.studentId) !== (s._id || s.studentId))
        : [...prev, s]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
  };

  // ── student list in modal ──────────────────────────────────────────────────
  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Award size={20} className="text-white" />
            </div>
            Certificate Management
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-14">Issue and manage blockchain-verified student certificates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCertificates}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={`text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={16} /> Issue Certificate
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Issued"    value={stats.total}    icon={Award}      color="#4f46e5" bg="#eef2ff" />
        <StatCard label="Verified"        value={stats.verified} icon={Shield}     color="#16a34a" bg="#f0fdf4" />
        <StatCard label="Pending"         value={stats.pending}  icon={Clock}      color="#d97706" bg="#fffbeb" />
        <StatCard label="Students Awarded"value={stats.students} icon={GraduationCap} color="#0284c7" bg="#eff6ff" />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search certificates, students…"
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          >
            <option value="all">All Types</option>
            {CERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          >
            <option value="all">All Classes</option>
            {classSections.map((cs) => (
              <option key={cs} value={cs}>{cs}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>
          <p className="text-xs text-slate-400 ml-auto">{filtered.length} records</p>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p className="text-slate-400 text-sm">Loading certificates…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-3">
          <Award size={44} className="text-slate-200" />
          <p className="text-slate-500 font-semibold">No certificates found</p>
          <p className="text-slate-400 text-sm">Issue your first certificate to get started</p>
          <button
            onClick={openCreate}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
          >
            <Plus size={14} /> Issue Certificate
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Certificate", "Student", "Class", "Type", "Issued", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((cert) => {
                const Icon = CERT_ICONS[cert.type] || Award;
                const c = TYPE_COLORS[cert.type] || TYPE_COLORS.Academic;
                return (
                  <tr key={cert._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
                          <Icon size={16} style={{ color: c.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 truncate max-w-[160px]">{cert.title}</p>
                          <p className="text-xs text-slate-400">{cert.certificateId || cert._id?.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                          {cert.studentName?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 text-xs">{cert.studentName || "—"}</p>
                          <p className="text-xs text-slate-400">Roll: {cert.rollNo || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">{cert.className || "—"}</td>
                    <td className="px-4 py-3"><Badge label={cert.type} type={cert.type} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmt(cert.issuedDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={cert.status || "pending"} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openView(cert)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CREATE MODAL ─────────────────────────────────────────────────── */}
      {modal === "create" && (
        <Modal title="Issue New Certificate" onClose={() => setModal(null)} wide>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step > s ? <Check size={12} /> : s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? "text-slate-700" : "text-slate-400"}`}>
                  {s === 1 ? "Certificate Details" : "Select Students"}
                </span>
                {s < 2 && <div className="flex-1 h-px bg-slate-200 w-8" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              {/* Certificate type */}
              <Field label="Certificate Type" required>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {CERT_TYPES.map((t) => {
                    const Icon = CERT_ICONS[t];
                    const c = TYPE_COLORS[t];
                    const active = form.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, type: t }))}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all"
                        style={
                          active
                            ? { borderColor: c.color, background: c.bg, color: c.color }
                            : { borderColor: "#e2e8f0", background: "#fff", color: "#64748b" }
                        }
                      >
                        <Icon size={14} />
                        {t}
                      </button>
                    );
                  })}
                </div>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Certificate Title" required error={errors.title}>
                  <input
                    value={form.title || ""}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className={inp(errors.title)}
                    placeholder="e.g. Annual Excellence Award"
                  />
                </Field>
                <Field label="Academic Year" required error={errors.academicYear}>
                  <input
                    value={form.academicYear || ""}
                    onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
                    className={inp(errors.academicYear)}
                    placeholder="2024-2025"
                  />
                </Field>

                <Field label="Select Class" required error={errors.classSection}>
                  <select
                    value={form.classSection || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, classSection: e.target.value }))
                    }
                    className={inp(errors.classSection)}
                  >
                    <option value="">— Select class —</option>
                    {classSections.map((cs) => (
                      <option key={cs} value={cs}>{cs}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Issue Date" required error={errors.issuedDate}>
                  <input
                    type="date"
                    value={form.issuedDate || ""}
                    onChange={(e) => setForm((p) => ({ ...p, issuedDate: e.target.value }))}
                    className={inp(errors.issuedDate)}
                  />
                </Field>

                <Field label="Grade / Score">
                  <input
                    value={form.grade || ""}
                    onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
                    className={inp(false)}
                    placeholder="e.g. A+ / 95%"
                  />
                </Field>

                <Field label="Issued By">
                  <input
                    value={form.issuedBy || ""}
                    onChange={(e) => setForm((p) => ({ ...p, issuedBy: e.target.value }))}
                    className={inp(false)}
                    placeholder="School / Authority name"
                  />
                </Field>
              </div>

              <Field label="Description / Achievement Details">
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                  placeholder="Describe the achievement or participation…"
                />
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  onClick={() => { if (validate()) setStep(2); }}
                  className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center gap-2"
                >
                  Next: Select Students →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  {(() => { const Icon = CERT_ICONS[form.type] || Award; return <Icon size={14} className="text-white" />; })()}
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-800">{form.title}</p>
                  <p className="text-xs text-indigo-500">{form.type} · {form.classSection} · {form.academicYear}</p>
                </div>
              </div>

              {!form.classSection ? (
                <div className="text-center py-10 text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a class in Step 1 to see students</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search students…"
                        className="pl-8 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPickedStudents(filteredStudents)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickedStudents([])}
                        className="text-xs text-slate-500 font-semibold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {studentsLoading ? (
                      <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Loading students…</span>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm">
                        {form.classSection ? "No active students in this class" : "No students found"}
                      </div>
                    ) : (
                      filteredStudents.map((s) => {
                        const picked = !!pickedStudents.find(
                          (p) => (p._id || p.studentId) === (s._id || s.studentId)
                        );
                        return (
                          <div
                            key={s._id || s.studentId}
                            onClick={() => toggleStudent(s)}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                              picked ? "bg-indigo-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                picked ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                              }`}
                            >
                              {picked && <Check size={11} className="text-white" />}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                              {s.name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${picked ? "text-indigo-700" : "text-slate-700"}`}>{s.name}</p>
                              <p className="text-xs text-slate-400">Roll: {s.rollNo || "—"}</p>
                            </div>
                            {picked && <Shield size={13} className="text-indigo-400" />}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    <span className="font-bold text-indigo-600">{pickedStudents.length}</span> student{pickedStudents.length !== 1 ? "s" : ""} selected
                    {pickedStudents.length > 0 && ` — ${pickedStudents.length} certificate${pickedStudents.length !== 1 ? "s" : ""} will be issued`}
                  </p>
                </>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">
                  ← Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || pickedStudents.length === 0}
                  className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                  {saving ? "Issuing…" : `Issue to ${pickedStudents.length} Student${pickedStudents.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ─── VIEW MODAL ───────────────────────────────────────────────────── */}
      {modal === "view" && selected && (
        <Modal title="Certificate Details" onClose={() => setModal(null)} wide>
          <div className="space-y-5">
            {/* Status banner */}
            {selected.status === "verified" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Blockchain Verified</p>
                  <p className="text-xs text-green-600">This certificate is authentic and tamper-proof</p>
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Certificate ID",  selected.certificateId || selected._id?.slice(-12).toUpperCase()],
                ["Title",           selected.title],
                ["Type",            selected.type],
                ["Student",         selected.studentName],
                ["Roll Number",     selected.rollNo || "—"],
                ["Class",           selected.className || "—"],
                ["Academic Year",   selected.academicYear],
                ["Issued Date",     fmt(selected.issuedDate)],
                ["Grade / Score",   selected.grade || "—"],
                ["Issued By",       selected.issuedBy || "—"],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-700">{val}</p>
                </div>
              ))}
            </div>

            {selected.description && (
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400 font-medium mb-1">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
              </div>
            )}

            {/* Blockchain */}
            {selected.blockchainHash && (
              <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={12} className="text-green-400" /> Blockchain Record
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-green-400 flex-1 truncate">{selected.blockchainHash}</code>
                  <button onClick={() => copyToClipboard(selected.blockchainHash)} className="p-1.5 rounded-lg hover:bg-slate-700">
                    <Copy size={12} className="text-slate-400" />
                  </button>
                </div>
                {selected.verificationUrl && (
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-blue-400 flex-1 truncate">{selected.verificationUrl}</code>
                    <button onClick={() => window.open(selected.verificationUrl, "_blank")} className="p-1.5 rounded-lg hover:bg-slate-700">
                      <ExternalLink size={12} className="text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-semibold">
                <Download size={14} /> Download PDF
              </button>
              {selected.verificationUrl && (
                <button
                  onClick={() => copyToClipboard(selected.verificationUrl)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-sm rounded-xl hover:bg-slate-50 font-semibold text-slate-600"
                >
                  <Share2 size={14} /> Share Link
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}