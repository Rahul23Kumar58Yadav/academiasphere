// src/pages/school-admin/ManageStudents.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, Download, Plus, Edit, Trash2, Eye, X, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw, Users, UserCheck,
  UserX, CheckCircle, Save, Loader2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => {
  const styles = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   ring: "ring-blue-100"   },
    green:  { bg: "bg-green-50",  text: "text-green-600",  ring: "ring-green-100"  },
    red:    { bg: "bg-red-50",    text: "text-red-600",    ring: "ring-red-100"    },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600", ring: "ring-yellow-100" },
  }[color] || { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${styles.bg} ring-1 ${styles.ring}`}>
        <Icon className={`w-5 h-5 ${styles.text}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
};

// ── Field helper ──────────────────────────────────────────────────────────────
const inp = (err) =>
  `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
    err ? "border-red-300 bg-red-50 focus:ring-red-400" : "border-gray-200 bg-white focus:ring-blue-500"
  }`;

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
  </div>
);

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditStudentModal({ student, onClose, onSaved, authFetch }) {
  const [form, setForm] = useState({
    firstName:   student.name?.split(" ")[0] || "",
    lastName:    student.name?.split(" ").slice(1).join(" ") || "",
    email:       student.email === "—" ? "" : student.email,
    phone:       student.phone === "—" ? "" : student.phone,
    gender:      student.gender === "—" ? "" : student.gender,
    bloodGroup:  student.bloodGroup === "—" ? "" : student.bloodGroup,
    grade:       student.grade   || "",
    section:     student.section || "",
    rollNo:      student.rollNo === "—" ? "" : student.rollNo,
    status:      student.status?.toLowerCase() || "active",
    parentName:  student.parentName === "—" ? "" : student.parentName,
    parentPhone: student.parentPhone === "—" ? "" : student.parentPhone,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState("");

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiErr("");
    try {
      const payload = {
        firstName:  form.firstName.trim(),
        lastName:   form.lastName.trim(),
        email:      form.email.trim()              || undefined,
        phone:      form.phone.trim()              || undefined,
        gender:     form.gender                    || undefined,
        bloodGroup: form.bloodGroup                || undefined,
        grade:      form.grade.trim()              || undefined,
        section:    form.section.trim().toUpperCase() || undefined,
        rollNo:     form.rollNo.trim()             || undefined,
        status:     form.status,
        guardians:  form.parentName?.trim()
          ? [{ name: form.parentName.trim(), relation: "guardian", phone: form.parentPhone?.trim() || "" }]
          : undefined,
      };
      // Remove undefined keys
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const res  = await authFetch(`/students/${student.id}`, {
        method: "PATCH",
        body:   JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      onSaved(data.student || payload);
    } catch (err) {
      setApiErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Student</h2>
            <p className="text-xs text-gray-400 mt-0.5">ID: {student.studentId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {apiErr && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {apiErr}
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required error={errors.firstName}>
              <input value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inp(errors.firstName)} placeholder="First name" />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inp(errors.lastName)} placeholder="Last name" />
            </Field>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inp()} placeholder="student@example.com" />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={inp()} placeholder="+91 98765 43210" />
            </Field>
          </div>

          {/* Personal */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gender">
              <select value={form.gender} onChange={e => set("gender", e.target.value)} className={inp()}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group">
              <select value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} className={inp()}>
                <option value="">Select</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
          </div>

          {/* Class details — grade + section + roll no */}
          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Class Details</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Grade" error={errors.grade}>
                <input
                  value={form.grade}
                  onChange={e => set("grade", e.target.value)}
                  className={inp(errors.grade)}
                  placeholder="e.g. 10"
                />
              </Field>
              <Field label="Section" error={errors.section}>
                <input
                  value={form.section}
                  onChange={e => set("section", e.target.value.toUpperCase())}
                  className={inp(errors.section) + " uppercase"}
                  placeholder="e.g. A"
                  maxLength={3}
                  style={{ textTransform: "uppercase" }}
                />
              </Field>
              <Field label="Roll No">
                <input
                  value={form.rollNo}
                  onChange={e => set("rollNo", e.target.value)}
                  className={inp()}
                  placeholder="e.g. 01"
                />
              </Field>
            </div>
            {/* Live preview chip */}
            {(form.grade || form.section || form.rollNo) && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span>
                  Will be saved as&nbsp;
                  <strong>
                    {form.grade  || "—"}{form.section ? `-${form.section}` : ""}
                    {form.rollNo ? `, Roll #${form.rollNo}` : ""}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <Field label="Status">
            <select value={form.status} onChange={e => set("status", e.target.value)} className={inp()}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
            </select>
          </Field>

          {/* Parent */}
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <input value={form.parentName} onChange={e => set("parentName", e.target.value)} className={inp()} placeholder="Parent name" />
              </Field>
              <Field label="Phone">
                <input type="tel" value={form.parentPhone} onChange={e => set("parentPhone", e.target.value)} className={inp()} placeholder="+91 …" />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3 justify-end bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 font-medium">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewStudentModal({ student, onClose }) {
  const badge = (v) => v === "Active"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Student Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-500">{student.studentId} · {student.class}</p>
              <span className={`mt-1 inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${badge(student.status)}`}>
                {student.status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Grade",        student.grade   || "—"],
              ["Section",      student.section || "—"],
              ["Roll No",      student.rollNo],
              ["DOB",          student.dob],
              ["Gender",       student.gender],
              ["Blood Group",  student.bloodGroup],
              ["Email",        student.email],
              ["Phone",        student.phone],
              ["Address",      student.address],
              ["Parent",       student.parentName],
              ["Parent Phone", student.parentPhone],
              ["Enrolled",     student.enrollmentDate],
              ["Attendance",   `${student.attendance}%`],
              ["Fees",         student.fees],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{l}</p>
                <p className="text-sm font-medium text-gray-800 break-words">{v || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ManageStudents() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const { authFetch } = useAuth();

  const [toast, setToast] = useState(location.state?.toast || null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── data ──────────────────────────────────────────────────────────────────
  const [students,         setStudents]         = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [totalCount,       setTotalCount]       = useState(0);
  const [stats,            setStats]            = useState({ totalActive: 0, totalInactive: 0 });
  const [isLoading,        setIsLoading]        = useState(false);
  const [apiError,         setApiError]         = useState(null);

  // ── ui state ──────────────────────────────────────────────────────────────
  const [searchTerm,       setSearchTerm]       = useState("");
  const [selectedClass,    setSelectedClass]    = useState("all");
  const [selectedStatus,   setSelectedStatus]   = useState("all");
  const [currentPage,      setCurrentPage]      = useState(1);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortConfig,       setSortConfig]       = useState({ key: "name", direction: "asc" });
  const [viewStudent,      setViewStudent]      = useState(null);
  const [editStudent,      setEditStudent]      = useState(null);
  const [deletingId,       setDeletingId]       = useState(null);

  const ITEMS_PER_PAGE = 10;
  const pendingFees    = students.filter(s => s.fees === "Pending").length;

  // ── fetch ─────────────────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res  = await authFetch(`/students?limit=200&status=all&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      const rawList = json.success ? (json.students || json.data || []) : [];
      const total   = json.total ?? rawList.length;

      const normalised = rawList.map(doc => {
        const grade   = doc.grade   || "";
        const section = doc.section || "";
        // Build class string; treat "N/A" grade as unassigned
        const isUnassigned = !grade || grade === "N/A" || grade === "Unknown";
        const classStr = isUnassigned
          ? null
          : section ? `${grade}-${section}` : grade;

        return {
          id:             doc.id || doc._id?.toString() || "",
          studentId:      doc.studentId || doc.admissionNo || doc._id?.toString() || "",
          name:           doc.name || `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || "Unnamed",
          email:          doc.email        || "—",
          phone:          doc.phone        || "—",
          class:          classStr         || "—",
          grade:          grade,
          section:        section,
          rollNo:         doc.rollNo       || "—",
          dob:            doc.dob          || "—",
          gender:         doc.gender       || "—",
          bloodGroup:     doc.bloodGroup   || "—",
          attendance:     doc.attendance   ?? 0,
          gpa:            doc.gpa          ?? 0,
          fees:           doc.fees         || "Pending",
          status:         doc.status       || "Inactive",
          address:        doc.address      || "—",
          parentName:     doc.parentName   || "—",
          parentPhone:    doc.parentPhone  || "—",
          enrollmentDate: doc.enrollmentDate || "—",
        };
      });

      setStudents(normalised);
      setTotalCount(total);
      setStats({
        totalActive:   normalised.filter(s => s.status === "Active").length,
        totalInactive: normalised.filter(s => s.status === "Inactive").length,
      });
    } catch (err) {
      console.error("Failed to load students:", err);
      setApiError("Could not load students from server. Please try refreshing.");
      setStudents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    if (location.state?.toast) {
      loadStudents();
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.toast]);

  // ── filter + sort ──────────────────────────────────────────────────────────
  useEffect(() => {
    let list = [...students];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      );
    }
    if (selectedClass !== "all")  list = list.filter(s => s.class === selectedClass);
    if (selectedStatus !== "all") list = list.filter(s => s.status === selectedStatus);
    list.sort((a, b) => {
      const d = sortConfig.direction === "asc" ? 1 : -1;
      return a[sortConfig.key] < b[sortConfig.key] ? -d : a[sortConfig.key] > b[sortConfig.key] ? d : 0;
    });
    setFilteredStudents(list);
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedStatus, students, sortConfig]);

  // Only non-"—" classes in the filter dropdown
  const classOptions = [...new Set(students.map(s => s.class).filter(c => c !== "—"))].sort();
  const totalPages   = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const idxFirst     = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated    = filteredStudents.slice(idxFirst, idxFirst + ITEMS_PER_PAGE);

  // ── handlers ──────────────────────────────────────────────────────────────
  const toggleSort   = key => setSortConfig(p => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
  const toggleSelect = id  => setSelectedStudents(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll    = ()  => setSelectedStudents(selectedStudents.length === paginated.length ? [] : paginated.map(s => s.id));
  const sortIcon     = k   => sortConfig.key !== k ? " ↕" : sortConfig.direction === "asc" ? " ↑" : " ↓";

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const deleteStudent = async (id) => {
    if (!window.confirm("Deactivate this student? They won't appear in active lists.")) return;
    setDeletingId(id);
    try {
      const res = await authFetch(`/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStudents(p => p.map(s => s.id === id ? { ...s, status: "Inactive" } : s));
        setTotalCount(p => Math.max(0, p - 1));
        setToast("Student deactivated successfully.");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete. Try again.");
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Deactivate ${selectedStudents.length} student(s)?`)) return;
    await Promise.allSettled(
      selectedStudents.map(id => authFetch(`/students/${id}`, { method: "DELETE" }))
    );
    setStudents(p => p.map(s => selectedStudents.includes(s.id) ? { ...s, status: "Inactive" } : s));
    setSelectedStudents([]);
    setToast(`${selectedStudents.length} student(s) deactivated.`);
  };

  // ── EDIT saved callback ────────────────────────────────────────────────────
  const handleEditSaved = (updated) => {
    setStudents(p => p.map(s => {
      if (s.id !== editStudent.id) return s;
      const newGrade   = updated.grade   || s.grade;
      const newSection = updated.section || s.section;
      const isUnassigned = !newGrade || newGrade === "N/A" || newGrade === "Unknown";
      const newClass = isUnassigned
        ? "—"
        : newSection ? `${newGrade}-${newSection}` : newGrade;
      return {
        ...s,
        name:        `${updated.firstName || ""} ${updated.lastName || ""}`.trim() || s.name,
        email:       updated.email      || s.email,
        phone:       updated.phone      || s.phone,
        gender:      updated.gender     || s.gender,
        bloodGroup:  updated.bloodGroup || s.bloodGroup,
        grade:       newGrade,
        section:     newSection,
        class:       newClass,
        rollNo:      updated.rollNo     || s.rollNo,
        status:      updated.status === "active" ? "Active" : updated.status === "inactive" ? "Inactive" : s.status,
        parentName:  updated.guardians?.[0]?.name  || s.parentName,
        parentPhone: updated.guardians?.[0]?.phone || s.parentPhone,
      };
    }));
    setEditStudent(null);
    setToast("Student updated successfully.");
  };

  const exportCSV = () => {
    const h = ["ID","Name","Email","Grade","Section","Roll No","Status","Attendance","GPA","Fees"];
    const rows = filteredStudents.map(s => [
      s.studentId, s.name, s.email,
      s.grade || "—", s.section || "—", s.rollNo,
      s.status, `${s.attendance}%`, s.gpa, s.fees,
    ]);
    const csv = [h, ...rows].map(r => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "students.csv",
    });
    a.click();
  };

  const badge     = v => v === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  const feesBadge = v => v === "Paid"   ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";

  // ── CLASS cell helper ──────────────────────────────────────────────────────
  const ClassCell = ({ student: s }) => {
    const assigned = s.class && s.class !== "—";
    const hasRoll  = s.rollNo && s.rollNo !== "—";
    return (
      <td className="px-5 py-3.5">
        {assigned ? (
          <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
            {s.class}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg">
            Not assigned
          </span>
        )}
        {hasRoll ? (
          <p className="text-xs text-gray-400 mt-1">
            Roll <span className="font-semibold text-gray-600">#{s.rollNo}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-300 mt-1">No roll no.</p>
        )}
      </td>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 shadow-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span className="font-medium">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isLoading ? "Loading…" : `${totalCount.toLocaleString()} student${totalCount !== 1 ? "s" : ""} enrolled`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadStudents} title="Refresh"
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => navigate("/school-admin/students/enroll")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {apiError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total Students" value={totalCount}         color="blue"   />
        <StatCard icon={UserCheck}   label="Active"         value={stats.totalActive}   color="green"  />
        <StatCard icon={UserX}       label="Inactive"       value={stats.totalInactive} color="red"    />
        <StatCard icon={AlertCircle} label="Fees Pending"   value={pendingFees}         color="yellow" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or email…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Classes</option>
            {classOptions.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {selectedStudents.length > 0 && (
          <div className="mt-3 flex items-center justify-between px-4 py-2.5 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{selectedStudents.length} selected</span>
            <div className="flex gap-2">
              <button onClick={bulkDelete} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              <button onClick={() => setSelectedStudents([])} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading students…</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Users className="w-12 h-12 text-gray-200" />
            <p className="text-gray-500 font-medium">No students found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || selectedClass !== "all" || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : 'Click "Add Student" to enroll the first student'}
            </p>
            {!searchTerm && selectedClass === "all" && selectedStatus === "all" && (
              <button onClick={() => navigate("/school-admin/students/enroll")}
                className="mt-1 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add First Student
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left w-10">
                      <input type="checkbox"
                        checked={paginated.length > 0 && selectedStudents.length === paginated.length}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-blue-600" />
                    </th>
                    {[
                      ["studentId", "ID"],
                      ["name",      "Student"],
                      ["class",     "Class"],
                      [null,        "Contact"],
                      ["attendance","Attendance"],
                      ["fees",      "Fees"],
                      ["status",    "Status"],
                      [null,        "Actions"],
                    ].map(([k, l]) => (
                      <th key={l} onClick={() => k && toggleSort(k)}
                        className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${k ? "cursor-pointer hover:text-gray-700 select-none" : ""}`}>
                        {l}{k && sortIcon(k)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selectedStudents.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded border-gray-300 text-blue-600" />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {s.studentId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* ── CLASS cell ── */}
                      <ClassCell student={s} />

                      <td className="px-5 py-3.5 text-xs text-gray-600">{s.phone}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${s.attendance >= 85 ? "bg-green-500" : s.attendance >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${s.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{s.attendance}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${feesBadge(s.fees)}`}>
                          {s.fees}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setViewStudent(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditStudent(s)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStudent(s.id)}
                            disabled={deletingId === s.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40" title="Delete">
                            {deletingId === s.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
              <p className="text-gray-500">
                Showing <span className="font-medium text-gray-700">{idxFirst + 1}</span>–
                <span className="font-medium text-gray-700">{Math.min(idxFirst + ITEMS_PER_PAGE, filteredStudents.length)}</span> of{" "}
                <span className="font-medium text-gray-700">{filteredStudents.length}</span>
                {filteredStudents.length !== totalCount && (
                  <span className="text-gray-400"> (filtered from {totalCount})</span>
                )}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 hover:bg-white text-gray-600"
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {viewStudent && (
        <ViewStudentModal student={viewStudent} onClose={() => setViewStudent(null)} />
      )}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={handleEditSaved}
          authFetch={authFetch}
        />
      )}
    </div>
  );
}