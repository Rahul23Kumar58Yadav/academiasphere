
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Users, UserCheck, BookOpen, Calendar,
  ClipboardList, BarChart3, Bell, FolderOpen, Settings,
  Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp,
  Search, Filter, Download, Upload, Eye, EyeOff, AlertTriangle,
  Archive, TrendingUp, Phone, Mail, MapPin, User, Star,
  Clock, BookMarked, FileText, Link, Video, Image, Paperclip,
  RefreshCw, ArrowLeft, MoreVertical, Shield, Award, Zap,
  ChevronRight, GraduationCap, Home, Hash, Save,
} from "lucide-react";

// ✅ consistent with classRoutes / ManageClasses
import api from "../../services/api";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const pct = (n, t) => t ? Math.round((n / t) * 100) : 0;
const gradeColor = { "A+": "#10b981", "A": "#34d399", "B+": "#60a5fa", "B": "#93c5fd", "C": "#fbbf24", "D": "#f97316", "F": "#ef4444" };

const TABS = [
  { id: "overview",      label: "Overview",       icon: LayoutDashboard },
  { id: "students",      label: "Students",        icon: Users           },
  { id: "parents",       label: "Parents",         icon: Home            },
  { id: "subjects",      label: "Subjects",        icon: BookOpen        },
  { id: "timetable",     label: "Timetable",       icon: Clock           },
  { id: "assignments",   label: "Assignments",     icon: ClipboardList   },
  { id: "attendance",    label: "Attendance",      icon: Calendar        },
  { id: "exams",         label: "Exams & Results", icon: BarChart3       },
  { id: "announcements", label: "Announcements",   icon: Bell            },
  { id: "resources",     label: "Resources",       icon: FolderOpen      },
  { id: "settings",      label: "Settings",        icon: Settings        },
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PRIORITY_COLOR = { Low: "#64748b", Normal: "#3b82f6", High: "#f97316", Urgent: "#ef4444" };

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)" }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[92vh] flex flex-col`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children, error }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
const inp = (err) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${err
    ? "border-red-400 focus:ring-2 focus:ring-red-100"
    : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"}`;

function Badge({ label, color = "#6366f1" }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: color + "22", color }}>{label}</span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "18" }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Confirm({ message, onConfirm, onCancel, danger }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex gap-3 items-start mb-4">
          <AlertTriangle size={24} className={danger ? "text-red-500" : "text-amber-500"} />
          <p className="text-slate-700 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm text-white ${danger ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ClassDashboard() {
  const { classId } = useParams();
  const navigate    = useNavigate();

  const [cls,     setCls]     = useState(null);
  const [stats,   setStats]   = useState(null);
  const [tab,     setTab]     = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [confirm, setConfirm] = useState(null);

  // ── GUARD: no classId in URL ───────────────────────────────────────────────
  // Must be checked BEFORE any hooks that depend on classId
  // (hooks can't be conditional, but the early-return below is safe because
  //  classId doesn't change mid-render)

  const fetchClass = useCallback(async () => {
    if (!classId) return;               // handled by early-return below
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/classes/${classId}/stats`),
      ]);
      setCls(r1.data.class ?? r1.data);
      setStats(r2.data.stats ?? r2.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load class");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetchClass(); }, [fetchClass]);

  const refresh = fetchClass;

  const patch = async (endpoint, payload) => {
    setSaving(true);
    try {
      await api.put(`/classes/${classId}${endpoint ? "/" + endpoint : ""}`, payload);
      await refresh();
      return true;
    } catch (e) { alert(e.response?.data?.message || "Save failed"); return false; }
    finally { setSaving(false); }
  };

  const post = async (endpoint, payload) => {
    setSaving(true);
    try {
      const r = await api.post(`/classes/${classId}/${endpoint}`, payload);
      await refresh();
      return r.data;
    } catch (e) { alert(e.response?.data?.message || "Save failed"); return null; }
    finally { setSaving(false); }
  };

  const del = async (endpoint) => {
    setSaving(true);
    try {
      await api.delete(`/classes/${classId}/${endpoint}`);
      await refresh();
      return true;
    } catch (e) { alert(e.response?.data?.message || "Delete failed"); return false; }
    finally { setSaving(false); }
  };

  // ── GUARD: no classId ──────────────────────────────────────────────────────
  if (!classId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertTriangle size={44} className="text-red-400" />
        <div>
          <p className="text-slate-700 font-semibold text-lg">No class selected</p>
          <p className="text-slate-400 text-sm mt-1">Please select a class from the list.</p>
        </div>
        {/* ✅ FIXED: was /classes — now points to the correct route */}
        <button
          onClick={() => navigate("/school-admin/classes")}
          className="mt-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Go to Classes List
        </button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw size={36} className="text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading class data…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !cls) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertTriangle size={44} className="text-red-400" />
        <div>
          <p className="text-slate-700 font-semibold text-lg">{error || "Class not found"}</p>
          <p className="text-slate-400 text-sm mt-1">The class may have been deleted or you may not have access.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh}
            className="px-4 py-2 border border-slate-200 text-sm rounded-xl hover:bg-slate-50">
            Retry
          </button>
          <button onClick={() => navigate("/school-admin/classes")}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  const activeStudents = cls.students?.filter((s) => s.isActive) ?? [];

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={() => navigate("/school-admin/classes")}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Back to Classes">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 leading-tight">
              {cls.displayName || `${cls.name} — ${cls.section}`}
            </h1>
            <p className="text-xs text-slate-400">
              {cls.academicYear} · {cls.classTeacherName || "No class teacher assigned"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cls.isArchived && <Badge label="Archived" color="#94a3b8" />}
          {cls.isPromoted && <Badge label="Promoted" color="#8b5cf6" />}
          {saving && <RefreshCw size={16} className="text-indigo-400 animate-spin" />}
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm border-b-2 transition-all whitespace-nowrap
                ${tab === t.id
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200 font-medium"}`}>
              <t.icon size={15} />
              {t.label}
              {t.id === "students" && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">
                  {activeStudents.length}
                </span>
              )}
              {t.id === "announcements" && cls.announcements?.filter((a) => a.isPinned).length > 0 && (
                <span className="ml-1 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                  {cls.announcements.filter((a) => a.isPinned).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="p-6 max-w-7xl mx-auto">
        {tab === "overview"      && <TabOverview      cls={cls} stats={stats} />}
        {tab === "students"      && <TabStudents      cls={cls} post={post} patch={patch} del={del} refresh={refresh} />}
        {tab === "parents"       && <TabParents       students={activeStudents} />}
        {tab === "subjects"      && <TabSubjects      cls={cls} patch={patch} />}
        {tab === "timetable"     && <TabTimetable     cls={cls} patch={patch} />}
        {tab === "assignments"   && <TabAssignments   cls={cls} post={post} patch={patch} del={del} />}
        {tab === "attendance"    && <TabAttendance    cls={cls} students={activeStudents} />}
        {tab === "exams"         && <TabExams         cls={cls} students={activeStudents} post={post} patch={patch} del={del} />}
        {tab === "announcements" && <TabAnnouncements cls={cls} post={post} patch={patch} del={del} />}
        {tab === "resources"     && <TabResources     cls={cls} post={post} del={del} />}
        {tab === "settings"      && <TabSettings      cls={cls} patch={patch} del={del} navigate={navigate} classId={classId} api={api} refresh={refresh} />}
      </div>

      {confirm && (
        <Confirm
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
function TabOverview({ cls, stats }) {
  const s = stats ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={s.totalStudents ?? 0}  icon={Users}      color="#6366f1" sub={`${s.boys ?? 0} boys · ${s.girls ?? 0} girls`} />
        <StatCard label="Subjects"       value={s.totalSubjects ?? 0}  icon={BookOpen}   color="#0ea5e9" />
        <StatCard label="Exams Held"     value={s.completedExams ?? 0} icon={BarChart3}  color="#10b981" sub={`${s.totalExams ?? 0} total`} />
        <StatCard label="Occupancy"      value={`${s.occupancy ?? 0}%`} icon={TrendingUp} color="#f59e0b" sub={`Capacity: ${s.capacity ?? 0}`} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Hash size={14} className="text-indigo-400" /> Class Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
          {[
            ["Class Name",    cls.name],
            ["Section",       cls.section],
            ["Academic Year", cls.academicYear],
            ["Class Teacher", cls.classTeacherName || "Not assigned"],
            ["Room",          cls.room || "Not assigned"],
            ["Capacity",      cls.capacity],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <p className="text-xs text-slate-400 font-medium mb-0.5">{lbl}</p>
              <p className="text-sm text-slate-700 font-semibold">{val}</p>
            </div>
          ))}
        </div>
        {cls.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">Notes</p>
            <p className="text-sm text-slate-600">{cls.notes}</p>
          </div>
        )}
      </div>

      {cls.announcements?.filter((a) => a.isPinned).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Bell size={14} className="text-red-400" /> Pinned Announcements
          </h3>
          <div className="space-y-3">
            {cls.announcements.filter((a) => a.isPinned).map((a) => (
              <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: PRIORITY_COLOR[a.priority] }} />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.author} · {fmt(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cls.assignments?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ClipboardList size={14} className="text-indigo-400" /> Recent Assignments
          </h3>
          <div className="space-y-2">
            {cls.assignments.slice(-5).reverse().map((a) => (
              <div key={a._id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.subjectName} · Due: {fmt(a.dueDate)}</p>
                </div>
                <Badge label={a.status} color={a.status === "Active" ? "#6366f1" : a.status === "Graded" ? "#10b981" : "#94a3b8"} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: STUDENTS
// ─────────────────────────────────────────────────────────────────────────────
function TabStudents({ cls, post, patch, del, refresh }) {
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [form,     setForm]     = useState({});
  const [errors,   setErrors]   = useState({});

  const students = cls.students?.filter((s) => s.isActive) ?? [];
  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm({}); setErrors({}); setModal("add"); };
  const openEdit = (s) => { setSelected(s); setForm({ ...s, dob: s.dob ? s.dob.split("T")[0] : "" }); setErrors({}); setModal("edit"); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Name is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (modal === "add") { const r = await post("students", form); if (r) setModal(null); }
    else { const ok = await patch(`students/${selected._id}`, form); if (ok) setModal(null); }
  };

  const F = (k, lbl, req, type = "text", opts) => (
    <Field label={lbl} required={req} error={errors[k]}>
      {opts ? (
        <select value={form[k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className={inp(errors[k])}>
          <option value="">Select…</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
          className={inp(errors[k])} placeholder={`Enter ${lbl.toLowerCase()}`} />
      )}
    </Field>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…"
            className="pl-9 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-semibold">
          <Plus size={15} /> Add Student
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No students found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["#", "Roll No", "Name", "Gender", "Admission No", "DOB", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s, i) => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-600">{s.rollNo || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge label={s.gender} color={s.gender === "Female" ? "#ec4899" : "#6366f1"} /></td>
                  <td className="px-4 py-3 text-slate-500">{s.admissionNo || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{fmt(s.dob)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"><Edit2 size={14} /></button>
                      <button onClick={() => del(`students/${s._id}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? "Add Student" : "Edit Student"} onClose={() => setModal(null)} wide>
          <div className="grid grid-cols-2 gap-4">
            {F("name", "Full Name", true)}
            {F("rollNo", "Roll Number", false)}
            {F("gender", "Gender", false, "text", ["Male", "Female", "Other"])}
            {F("admissionNo", "Admission No", false)}
            {F("dob", "Date of Birth", false, "date")}
            {F("address", "Address", false)}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-2 gap-4">
              {F("parentName", "Parent Name", false)}
              {F("parentRelation", "Relation", false, "text", ["Father", "Mother", "Guardian", "Other"])}
              {F("parentPhone", "Phone", false, "tel")}
              {F("parentEmail", "Email", false, "email")}
            </div>
          </div>
          <div className="mt-4">
            <Field label="Internal Notes">
              <textarea value={form.note ?? ""} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400"
                placeholder="Private notes visible to admin only…" />
            </Field>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold flex items-center gap-2">
              <Save size={14} />{modal === "add" ? "Add Student" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PARENTS
// ─────────────────────────────────────────────────────────────────────────────
function TabParents({ students }) {
  const [search, setSearch] = useState("");
  const withParents = students.filter((s) => s.parentName || s.parentPhone);
  const filtered = withParents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.parentName?.toLowerCase().includes(search.toLowerCase()) ||
    s.parentPhone?.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or parent name…"
            className="pl-9 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <p className="text-xs text-slate-400">{withParents.length} parent records</p>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Home size={40} className="mx-auto mb-3 opacity-30" /><p>No parent data found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Student</p>
                  <p className="text-sm font-bold text-slate-800">{s.name}</p>
                  <p className="text-xs text-indigo-500">Roll #{s.rollNo || "N/A"}</p>
                </div>
                <Badge label={s.gender} color={s.gender === "Female" ? "#ec4899" : "#6366f1"} />
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{s.parentRelation || "Parent"} / Guardian</p>
                <p className="text-sm font-semibold text-slate-700">{s.parentName || "—"}</p>
                {s.parentPhone && (
                  <a href={`tel:${s.parentPhone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
                    <Phone size={13} className="text-slate-400" />{s.parentPhone}
                  </a>
                )}
                {s.parentEmail && (
                  <a href={`mailto:${s.parentEmail}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
                    <Mail size={13} className="text-slate-400" />{s.parentEmail}
                  </a>
                )}
                {s.address && (
                  <div className="flex items-start gap-2 text-xs text-slate-400">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />{s.address}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────
function TabSubjects({ cls, patch }) {
  const [subjects, setSubjects] = useState(cls.subjects ?? []);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({});
  const [editIdx,  setEditIdx]  = useState(null);
  const [saving,   setSaving]   = useState(false);

  const openAdd  = ()  => { setForm({}); setEditIdx(null); setModal(true); };
  const openEdit = (i) => { setForm({ ...subjects[i] }); setEditIdx(i); setModal(true); };

  const handleSave = () => {
    if (!form.subjectName?.trim()) return alert("Subject name is required");
    const updated = [...subjects];
    if (editIdx !== null) updated[editIdx] = { ...subjects[editIdx], ...form };
    else updated.push({ ...form });
    setSubjects(updated);
    setModal(false);
  };
  const handleDelete   = (i) => setSubjects(subjects.filter((_, idx) => idx !== i));
  const handleSaveAll  = async () => { setSaving(true); await patch("subjects", { subjects }); setSaving(false); };

  const F = (k, lbl, req, type = "text") => (
    <Field label={lbl} required={req}>
      <input type={type} value={form[k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
        className={inp(false)} placeholder={`Enter ${lbl.toLowerCase()}`} />
    </Field>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600">Subjects & Teachers ({subjects.length})</h3>
        <div className="flex gap-2">
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-semibold">
            <Plus size={14} /> Add Subject
          </button>
          <button onClick={handleSaveAll} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 font-semibold disabled:opacity-50">
            <Save size={14} />{saving ? "Saving…" : "Save All"}
          </button>
        </div>
      </div>
      {subjects.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><BookOpen size={40} className="mx-auto mb-3 opacity-30" /><p>No subjects assigned yet</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Subject", "Code", "Teacher", "Max Marks", "Pass Marks", "Type", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subjects.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-700">{s.subjectName}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{s.subjectCode || "—"}</span></td>
                  <td className="px-4 py-3 text-slate-500">{s.teacherName || <span className="text-slate-300 italic">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-600">{s.maxMarks ?? 100}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-600">{s.passMarks ?? 33}</td>
                  <td className="px-4 py-3"><Badge label={s.isElective ? "Elective" : "Core"} color={s.isElective ? "#f59e0b" : "#6366f1"} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title={editIdx !== null ? "Edit Subject" : "Add Subject"} onClose={() => setModal(false)}>
          <div className="space-y-4">
            {F("subjectName", "Subject Name", true)}
            {F("subjectCode", "Subject Code", false)}
            {F("teacherName", "Assigned Teacher", false)}
            <div className="grid grid-cols-2 gap-4">
              {F("maxMarks",  "Max Marks",  false, "number")}
              {F("passMarks", "Pass Marks", false, "number")}
            </div>
            <Field label="Type">
              <select value={form.isElective || false} onChange={(e) => setForm((p) => ({ ...p, isElective: e.target.value === "true" }))} className={inp(false)}>
                <option value="false">Core</option>
                <option value="true">Elective</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold">
              {editIdx !== null ? "Save" : "Add"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: TIMETABLE
// ─────────────────────────────────────────────────────────────────────────────
function TabTimetable({ cls, patch }) {
  const [timetable, setTimetable] = useState(cls.timetable ?? []);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState({});
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);

  const slotsForDay = (day) => timetable.filter((s) => s.day === day).sort((a, b) => a.period - b.period);
  const openAdd     = (day) => { setForm({ day, type: "Regular" }); setEditId(null); setModal(true); };
  const openEdit    = (s)   => { setForm({ ...s }); setEditId(s._id || s.tempId); setModal(true); };

  const handleSave = () => {
    if (!form.day || !form.startTime || !form.endTime) return alert("Day, start and end time are required");
    const updated = editId
      ? timetable.map((s) => (s._id === editId || s.tempId === editId) ? { ...s, ...form } : s)
      : [...timetable, { ...form, tempId: Date.now() }];
    setTimetable(updated);
    setModal(false);
  };
  const handleDelete   = (s)  => setTimetable(timetable.filter((t) => (t._id || t.tempId) !== (s._id || s.tempId)));
  const handleSaveAll  = async () => { setSaving(true); await patch("timetable", { timetable }); setSaving(false); };

  const TYPE_COLOR = { Regular: "#6366f1", Lab: "#0ea5e9", PT: "#10b981", Library: "#f59e0b", Free: "#94a3b8" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600">Weekly Timetable</h3>
        <button onClick={handleSaveAll} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 font-semibold disabled:opacity-50">
          <Save size={14} />{saving ? "Saving…" : "Save Timetable"}
        </button>
      </div>
      <div className="space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-700">{day}</p>
              <button onClick={() => openAdd(day)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                <Plus size={13} /> Add Period
              </button>
            </div>
            {slotsForDay(day).length === 0 ? (
              <p className="text-xs text-slate-300 px-5 py-4 italic">No periods scheduled</p>
            ) : (
              <div className="flex flex-wrap gap-2 p-4">
                {slotsForDay(day).map((s, i) => (
                  <div key={s._id || s.tempId || i}
                    className="group relative flex items-start gap-3 border border-slate-100 rounded-xl px-3 py-2.5 bg-white hover:border-indigo-200 hover:shadow-sm transition-all min-w-[160px]">
                    <div className="w-1.5 h-full rounded-full absolute left-0 top-0 bottom-0" style={{ background: TYPE_COLOR[s.type] || "#6366f1" }} />
                    <div className="ml-2">
                      <p className="text-xs font-bold text-slate-700">{s.subjectName || "Free"}</p>
                      <p className="text-xs text-slate-400">{s.startTime}–{s.endTime}</p>
                      {s.teacherName && <p className="text-xs text-indigo-500 truncate max-w-[120px]">{s.teacherName}</p>}
                      {s.room && <p className="text-xs text-slate-400">Room {s.room}</p>}
                    </div>
                    <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
                      <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-slate-100"><Edit2 size={11} className="text-slate-500" /></button>
                      <button onClick={() => handleDelete(s)} className="p-1 rounded hover:bg-red-50"><X size={11} className="text-red-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {modal && (
        <Modal title="Add / Edit Period" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Day">
              <select value={form.day || ""} onChange={(e) => setForm((p) => ({ ...p, day: e.target.value }))} className={inp(false)}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time" required><input type="time" value={form.startTime || ""} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className={inp(false)} /></Field>
              <Field label="End Time"   required><input type="time" value={form.endTime   || ""} onChange={(e) => setForm((p) => ({ ...p, endTime:   e.target.value }))} className={inp(false)} /></Field>
            </div>
            <Field label="Subject"><input value={form.subjectName || ""} onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))} className={inp(false)} placeholder="Subject name" /></Field>
            <Field label="Teacher"><input value={form.teacherName || ""} onChange={(e) => setForm((p) => ({ ...p, teacherName: e.target.value }))} className={inp(false)} placeholder="Teacher name" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Room"><input value={form.room || ""} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} className={inp(false)} placeholder="Room no" /></Field>
              <Field label="Type">
                <select value={form.type || "Regular"} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={inp(false)}>
                  {["Regular", "Lab", "PT", "Library", "Free"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
function TabAssignments({ cls, post, patch, del }) {
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({});
  const [editId, setEditId] = useState(null);

  const openAdd  = ()  => { setForm({ status: "Active" }); setEditId(null); setModal(true); };
  const openEdit = (a) => { setForm({ ...a, dueDate: a.dueDate?.split("T")[0] }); setEditId(a._id); setModal(true); };

  const handleSave = async () => {
    if (!form.title?.trim()) return alert("Title is required");
    if (!form.dueDate)       return alert("Due date is required");
    if (editId) await patch(`assignments/${editId}`, form);
    else        await post("assignments", form);
    setModal(false);
  };

  const STATUS_COLOR = { Active: "#6366f1", Submitted: "#0ea5e9", Graded: "#10b981", Overdue: "#ef4444" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600">Assignments ({cls.assignments?.length ?? 0})</h3>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-semibold">
          <Plus size={14} /> New Assignment
        </button>
      </div>
      {!cls.assignments?.length ? (
        <div className="text-center py-16 text-slate-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-30" /><p>No assignments yet</p></div>
      ) : (
        <div className="grid gap-4">
          {cls.assignments.map((a) => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group hover:border-indigo-100 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-800">{a.title}</h4>
                    <Badge label={a.status} color={STATUS_COLOR[a.status] || "#94a3b8"} />
                  </div>
                  {a.description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a.description}</p>}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {a.subjectName && <span className="text-xs text-indigo-500 flex items-center gap-1"><BookOpen size={11} />{a.subjectName}</span>}
                    {a.teacherName && <span className="text-xs text-slate-400 flex items-center gap-1"><User size={11} />{a.teacherName}</span>}
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} />Due: {fmt(a.dueDate)}</span>
                    <span className="text-xs text-slate-400">Max Marks: {a.maxMarks}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"><Edit2 size={14} /></button>
                  <button onClick={() => del(`assignments/${a._id}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={editId ? "Edit Assignment" : "New Assignment"} onClose={() => setModal(false)} wide>
          <div className="space-y-4">
            <Field label="Title" required><input value={form.title || ""} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inp(false)} placeholder="Assignment title" /></Field>
            <Field label="Description"><textarea value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400" placeholder="Instructions…" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subject"><input value={form.subjectName || ""} onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))} className={inp(false)} placeholder="Subject" /></Field>
              <Field label="Teacher"><input value={form.teacherName || ""} onChange={(e) => setForm((p) => ({ ...p, teacherName: e.target.value }))} className={inp(false)} placeholder="Teacher name" /></Field>
              <Field label="Due Date" required><input type="date" value={form.dueDate || ""} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className={inp(false)} /></Field>
              <Field label="Max Marks"><input type="number" value={form.maxMarks || 10} onChange={(e) => setForm((p) => ({ ...p, maxMarks: e.target.value }))} className={inp(false)} /></Field>
              <Field label="Status">
                <select value={form.status || "Active"} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inp(false)}>
                  {["Active", "Submitted", "Graded", "Overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold">
              <Save size={14} className="inline mr-1.5" />{editId ? "Save" : "Create"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
function TabAttendance({ students }) {
  const today = new Date().toISOString().split("T")[0];
  const [date,    setDate]    = useState(today);
  const [records, setRecords] = useState({});
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    const init = {};
    students.forEach((s) => { init[s._id] = "present"; });
    setRecords(init);
    setSaved(false);
  }, [date, students]);

  const toggle  = (id) => { setRecords((r) => ({ ...r, [id]: r[id] === "present" ? "absent" : "present" })); setSaved(false); };
  const markAll = (val) => { const r = {}; students.forEach((s) => { r[s._id] = val; }); setRecords(r); };

  const presentCount = Object.values(records).filter((v) => v === "present").length;
  const absentCount  = students.length - presentCount;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
              <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{presentCount}</p>
                <p className="text-xs text-slate-400">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-red-500">{absentCount}</p>
                <p className="text-xs text-slate-400">Absent</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => markAll("present")} className="px-3 py-2 text-xs border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 font-semibold">All Present</button>
            <button onClick={() => markAll("absent")}  className="px-3 py-2 text-xs border border-red-200   text-red-500   rounded-lg hover:bg-red-50   font-semibold">All Absent</button>
            <button onClick={() => setSaved(true)} className="px-4 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-1.5">
              {saved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save</>}
            </button>
          </div>
        </div>
      </div>
      {students.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Calendar size={40} className="mx-auto mb-3 opacity-30" /><p>No students in this class</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Roll No", "Name", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((s) => {
                const isPresent = records[s._id] !== "absent";
                return (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-indigo-500 font-semibold text-xs">{s.rollNo || "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{s.name}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(s._id)}
                        className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${isPresent
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-red-100    text-red-600    hover:bg-red-200"}`}>
                        {isPresent ? "✓ Present" : "✗ Absent"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: EXAMS & RESULTS  (unchanged from original — omitted for brevity)
// TAB: ANNOUNCEMENTS    (unchanged)
// TAB: RESOURCES        (unchanged)
// TAB: SETTINGS         (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
// Copy these four tabs verbatim from your original Class.jsx file.
// Only the three fixes above (guards + navigate path) matter for the 404 bug.

// ─────────────────────────────────────────────────────────────────────────────
// TAB: EXAMS & RESULTS
// ─────────────────────────────────────────────────────────────────────────────
function TabExams({ cls, students, post, patch, del }) {
  const [modal,     setModal]     = useState(false); // "add" | "results" | null
  const [selExam,   setSelExam]   = useState(null);
  const [form,      setForm]      = useState({});
  const [results,   setResults]   = useState([]);
  const [status,    setStatus]    = useState("");

  const openAdd = () => { setForm({ type:"Unit Test", maxMarks:100, passMarks:33 }); setModal("add"); };
  const openResults = (exam) => {
    setSelExam(exam);
    setResults(exam.results?.map(r => ({ ...r })) ?? []);
    setStatus(exam.status);
    setModal("results");
  };

  const createExam = async () => {
    if (!form.name?.trim()) return alert("Exam name is required");
    await post("exams", form);
    setModal(false);
  };

  const saveResults = async () => {
    await patch(`exams/${selExam._id}`, { results, status });
    setModal(false);
  };

  const updateResult = (idx, field, value) => {
    setResults(r => r.map((res,i) => i===idx ? { ...res, [field]: value } : res));
  };

  const calcGrade = (marks, max, pass) => {
    const pct = (marks / max) * 100;
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= pass) return "C";
    if (pct >= pass - 10) return "D";
    return "F";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-700 text-slate-600" style={{ fontWeight:700 }}>Exams ({cls.exams?.length ?? 0})</h3>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-600" style={{ fontWeight:600 }}>
          <Plus size={14} /> Create Exam
        </button>
      </div>

      {!cls.exams?.length ? (
        <div className="text-center py-16 text-slate-400"><BarChart3 size={40} className="mx-auto mb-3 opacity-30" /><p>No exams created yet</p></div>
      ) : (
        <div className="grid gap-4">
          {cls.exams.map(exam => {
            const completed = exam.results?.filter(r => !r.isAbsent).length ?? 0;
            const passed    = exam.results?.filter(r => !r.isAbsent && r.marksObtained >= exam.passMarks).length ?? 0;
            return (
              <div key={exam._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group hover:border-indigo-100 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h4 className="text-sm font-700 text-slate-800" style={{ fontWeight:700 }}>{exam.name}</h4>
                      <Badge label={exam.type} color="#6366f1" />
                      <Badge label={exam.status} color={exam.status==="Completed"?"#10b981":exam.status==="Scheduled"?"#f59e0b":"#94a3b8"} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {exam.subjectName && <span><BookOpen size={11} className="inline mr-1"/>{exam.subjectName}</span>}
                      {exam.date && <span><Calendar size={11} className="inline mr-1"/>{fmt(exam.date)}</span>}
                      <span>Max: {exam.maxMarks} · Pass: {exam.passMarks}</span>
                      {exam.status==="Completed" && (
                        <span className="text-emerald-500">{passed}/{completed} passed ({pct(passed,completed)}%)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => openResults(exam)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 text-xs font-600" style={{ fontWeight:600 }}>
                      <Edit2 size={12} /> Results
                    </button>
                    <button onClick={() => del(`exams/${exam._id}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Exam Modal */}
      {modal === "add" && (
        <Modal title="Create Exam" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Exam Name" required><input value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className={inp(false)} placeholder="e.g. Unit Test 1" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select value={form.type||"Unit Test"} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className={inp(false)}>
                  {["Unit Test","Mid Term","Final","Practical","Assignment","Quiz"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Date"><input type="date" value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className={inp(false)} /></Field>
              <Field label="Subject"><input value={form.subjectName||""} onChange={e=>setForm(p=>({...p,subjectName:e.target.value}))} className={inp(false)} placeholder="Subject" /></Field>
              <Field label="Max Marks"><input type="number" value={form.maxMarks||100} onChange={e=>setForm(p=>({...p,maxMarks:Number(e.target.value)}))} className={inp(false)} /></Field>
              <Field label="Pass Marks"><input type="number" value={form.passMarks||33} onChange={e=>setForm(p=>({...p,passMarks:Number(e.target.value)}))} className={inp(false)} /></Field>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={createExam} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-600" style={{ fontWeight:600 }}>Create</button>
          </div>
        </Modal>
      )}

      {/* Results Entry Modal */}
      {modal === "results" && selExam && (
        <Modal title={`Results — ${selExam.name}`} onClose={() => setModal(false)} wide>
          <div className="flex items-center gap-3 mb-4">
            <Field label="Status" half>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inp(false)}>
                {["Scheduled","Ongoing","Completed","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Roll","Student","Marks / "+selExam.maxMarks,"Grade","Absent","Remarks"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-700 text-slate-500 whitespace-nowrap" style={{ fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((r, i) => (
                  <tr key={i} className={r.isAbsent ? "opacity-40" : ""}>
                    <td className="px-3 py-2 text-xs text-slate-400">{r.rollNo}</td>
                    <td className="px-3 py-2 text-sm font-500 text-slate-700" style={{ fontWeight:500 }}>{r.studentName}</td>
                    <td className="px-3 py-2">
                      <input type="number" value={r.marksObtained||0} disabled={r.isAbsent}
                        onChange={e => {
                          const m = Number(e.target.value);
                          const grade = calcGrade(m, selExam.maxMarks, selExam.passMarks);
                          updateResult(i, "marksObtained", m);
                          updateResult(i, "grade", grade);
                        }}
                        className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-indigo-400 disabled:bg-slate-50" />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm font-700" style={{ fontWeight:700, color: gradeColor[r.grade]||"#94a3b8" }}>{r.grade || "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={r.isAbsent||false} onChange={e => updateResult(i,"isAbsent",e.target.checked)} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={r.remarks||""} onChange={e => updateResult(i,"remarks",e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" placeholder="Remarks…" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={saveResults} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-600" style={{ fontWeight:600 }}><Save size={14} className="inline mr-1.5"/>Save Results</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function TabAnnouncements({ cls, post, patch, del }) {
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({});
  const [editId, setEditId] = useState(null);

  const openAdd  = () => { setForm({ priority:"Normal", isPinned:false }); setEditId(null); setModal(true); };
  const openEdit = (a) => { setForm({ ...a }); setEditId(a._id); setModal(true); };

  const handleSave = async () => {
    if (!form.title?.trim() || !form.content?.trim()) return alert("Title and content are required");
    if (editId) await patch(`announcements/${editId}`, form);
    else        await post("announcements", form);
    setModal(false);
  };

  const sorted = [...(cls.announcements ?? [])].sort((a,b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-700 text-slate-600" style={{ fontWeight:700 }}>Announcements ({sorted.length})</h3>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-600" style={{ fontWeight:600 }}>
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Bell size={40} className="mx-auto mb-3 opacity-30" /><p>No announcements yet</p></div>
      ) : (
        <div className="space-y-3">
          {sorted.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group hover:border-indigo-100 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: PRIORITY_COLOR[a.priority] }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-700 text-slate-800" style={{ fontWeight:700 }}>{a.title}</h4>
                    {a.isPinned && <Badge label="📌 Pinned" color="#f59e0b" />}
                    <Badge label={a.priority} color={PRIORITY_COLOR[a.priority]} />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{a.author} · {fmt(a.createdAt)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"><Edit2 size={13}/></button>
                  <button onClick={() => del(`announcements/${a._id}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editId ? "Edit Announcement" : "New Announcement"} onClose={() => setModal(false)} wide>
          <div className="space-y-4">
            <Field label="Title" required><input value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inp(false)} placeholder="Announcement title" /></Field>
            <Field label="Content" required><textarea value={form.content||""} onChange={e=>setForm(p=>({...p,content:e.target.value}))} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400" placeholder="Write your announcement…" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority">
                <select value={form.priority||"Normal"} onChange={e=>setForm(p=>({...p,priority:e.target.value}))} className={inp(false)}>
                  {["Low","Normal","High","Urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Expires On"><input type="date" value={form.expiresAt?.split("T")[0]||""} onChange={e=>setForm(p=>({...p,expiresAt:e.target.value}))} className={inp(false)} /></Field>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={!!form.isPinned} onChange={e=>setForm(p=>({...p,isPinned:e.target.checked}))} className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-slate-600 font-500" style={{ fontWeight:500 }}>Pin this announcement</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-600" style={{ fontWeight:600 }}><Save size={14} className="inline mr-1.5"/>{editId?"Save":"Post"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: RESOURCES
// ─────────────────────────────────────────────────────────────────────────────
function TabResources({ cls, post, del }) {
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});

  const ICON = { Document: FileText, Video, Link, Image, Other: Paperclip };
  const TYPE_COLOR = { Document:"#6366f1", Video:"#ef4444", Link:"#0ea5e9", Image:"#10b981", Other:"#94a3b8" };

  const handleSave = async () => {
    if (!form.title?.trim()) return alert("Title is required");
    await post("resources", form);
    setModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-700 text-slate-600" style={{ fontWeight:700 }}>Resources ({cls.resources?.length ?? 0})</h3>
        <button onClick={() => { setForm({ type:"Document" }); setModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-600" style={{ fontWeight:600 }}>
          <Plus size={14} /> Add Resource
        </button>
      </div>

      {!cls.resources?.length ? (
        <div className="text-center py-16 text-slate-400"><FolderOpen size={40} className="mx-auto mb-3 opacity-30" /><p>No resources added yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cls.resources.map(r => {
            const Icon = ICON[r.type] ?? FileText;
            return (
              <div key={r._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group hover:border-indigo-100 transition-all flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (TYPE_COLOR[r.type]||"#94a3b8") + "18" }}>
                  <Icon size={18} style={{ color: TYPE_COLOR[r.type]||"#94a3b8" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-700 text-slate-800 truncate" style={{ fontWeight:700 }}>{r.title}</p>
                  {r.subjectName && <p className="text-xs text-indigo-500">{r.subjectName}</p>}
                  {r.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">{r.uploadedBy} · {fmt(r.uploadedAt)}</span>
                    {r.size && <span className="text-xs text-slate-400">{r.size}</span>}
                  </div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 flex items-center gap-1">
                      <Link size={11} /> Open Resource
                    </a>
                  )}
                </div>
                <button onClick={() => del(`resources/${r._id}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Trash2 size={13}/>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Add Resource" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Title" required><input value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inp(false)} placeholder="Resource title" /></Field>
            <Field label="Type">
              <select value={form.type||"Document"} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className={inp(false)}>
                {["Document","Video","Link","Image","Other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="URL / Link"><input value={form.url||""} onChange={e=>setForm(p=>({...p,url:e.target.value}))} className={inp(false)} placeholder="https://…" /></Field>
            <Field label="Subject"><input value={form.subjectName||""} onChange={e=>setForm(p=>({...p,subjectName:e.target.value}))} className={inp(false)} placeholder="Subject" /></Field>
            <Field label="Description"><textarea value={form.description||""} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400" placeholder="Brief description…" /></Field>
            <Field label="File Size"><input value={form.size||""} onChange={e=>setForm(p=>({...p,size:e.target.value}))} className={inp(false)} placeholder="e.g. 2.4 MB" /></Field>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-600" style={{ fontWeight:600 }}>Add</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SETTINGS (Promote / Archive / Edit class)
// ─────────────────────────────────────────────────────────────────────────────
function TabSettings({ cls, patch, navigate, classId, api, refresh }) {
  const [editForm,   setEditForm]   = useState({ name: cls.name, section: cls.section, academicYear: cls.academicYear, classTeacherName: cls.classTeacherName, room: cls.room, capacity: cls.capacity, notes: cls.notes });
  const [promoteTo,  setPromoteTo]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [actionDone, setActionDone] = useState("");

  const saveInfo = async () => {
    setSaving(true);
    await patch("", editForm);  // PUT /api/classes/:id
    setSaving(false);
    setActionDone("Class info updated!");
  };

  const doPromote = async () => {
    if (!promoteTo.trim()) return alert("Enter the class to promote to");
    setSaving(true);
    try {
      await api.put(`/classes/${classId}/promote`, { promotedTo: promoteTo });
      await refresh();
      setActionDone(`Class promoted to ${promoteTo}`);
    } catch(e) { alert(e.response?.data?.message||"Error"); }
    setSaving(false);
  };

  const doArchive = async () => {
    setSaving(true);
    try {
      await api.put(`/classes/${classId}/archive`);
      await refresh();
      setActionDone("Class archived");
    } catch(e) { alert(e.response?.data?.message||"Error"); }
    setSaving(false);
  };

  const doRestore = async () => {
    setSaving(true);
    try {
      await api.put(`/classes/${classId}/restore`);
      await refresh();
      setActionDone("Class restored");
    } catch(e) { alert(e.response?.data?.message||"Error"); }
    setSaving(false);
  };

  const F = (k, lbl, type="text") => (
    <Field label={lbl}>
      <input type={type} value={editForm[k]??""} onChange={e=>setEditForm(p=>({...p,[k]:e.target.value}))} className={inp(false)} />
    </Field>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {actionDone && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
          <Check size={16}/>{actionDone}
        </div>
      )}

      {/* Edit class info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-700 text-slate-700 mb-5 flex items-center gap-2" style={{ fontWeight:700 }}>
          <Edit2 size={15} className="text-indigo-400"/> Edit Class Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {F("name","Class Name")} {F("section","Section")}
          {F("academicYear","Academic Year")} {F("classTeacherName","Class Teacher")}
          {F("room","Room")} {F("capacity","Capacity","number")}
        </div>
        <div className="mt-4">
          <Field label="Notes"><textarea value={editForm.notes||""} onChange={e=>setEditForm(p=>({...p,notes:e.target.value}))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400" /></Field>
        </div>
        <button onClick={saveInfo} disabled={saving} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-600" style={{ fontWeight:600 }}>
          <Save size={14}/>{saving?"Saving…":"Save Changes"}
        </button>
      </div>

      {/* Promote class */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-700 text-slate-700 mb-2 flex items-center gap-2" style={{ fontWeight:700 }}>
          <TrendingUp size={15} className="text-violet-500"/> Promote Class
        </h3>
        <p className="text-xs text-slate-400 mb-4">Move all students to the next academic class. This marks the class as promoted.</p>
        <div className="flex gap-3">
          <input value={promoteTo} onChange={e=>setPromoteTo(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400" placeholder="Promote to (e.g. Grade 11)" />
          <button onClick={doPromote} disabled={saving || cls.isPromoted} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 font-600" style={{ fontWeight:600 }}>
            {cls.isPromoted ? "Already Promoted" : "Promote"}
          </button>
        </div>
        {cls.isPromoted && <p className="text-xs text-violet-500 mt-2">Promoted to: <strong>{cls.promotedTo}</strong> on {fmt(cls.promotedAt)}</p>}
      </div>

      {/* Archive / Restore */}
      <div className={`bg-white rounded-2xl border shadow-sm p-6 ${cls.isArchived ? "border-amber-100" : "border-red-100"}`}>
        <h3 className="text-sm font-700 text-slate-700 mb-2 flex items-center gap-2" style={{ fontWeight:700 }}>
          <Archive size={15} className={cls.isArchived ? "text-amber-500" : "text-red-400"}/>
          {cls.isArchived ? "Restore Class" : "Archive Class"}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {cls.isArchived
            ? "This class is archived. Restore it to make it active again."
            : "Archiving hides this class from active view. All data is retained."}
        </p>
        {cls.isArchived ? (
          <button onClick={doRestore} disabled={saving} className="px-5 py-2.5 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 font-600" style={{ fontWeight:600 }}>
            Restore Class
          </button>
        ) : (
          <button onClick={doArchive} disabled={saving} className="px-5 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 font-600" style={{ fontWeight:600 }}>
            Archive Class
          </button>
        )}
      </div>
    </div>
  );
}