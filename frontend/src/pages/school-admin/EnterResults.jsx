// src/pages/school-admin/EnterResults.jsx
// Route: /school-admin/results
// Admin: browse classes → sections → exam types (per-class) → enter/override marks → publish/unpublish
// ALL data is fetched dynamically from MongoDB — no static constants.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Save, CheckCircle, ChevronDown, Eye, Edit3, Users, BarChart3,
  TrendingUp, Award, AlertCircle, Globe, EyeOff, Plus, Trash2,
  X, Settings, FileText, Lock, Unlock, ChevronRight, BookOpen,
  RefreshCw, Search, GraduationCap, Hash,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  gradeOf,
  DEFAULT_SUBJECTS,
  getStudentsByClass,
  getClassMarks,
  saveMarks,
  publishResults,
  unpublishResults,
  getClassExamStatus,
  getExamTypes,
  createExamType,
  deleteExamType,
  getSubjects,
} from "../../services/resultApi";
import api from "../../services/api"; // for /classes endpoint

// =============================================================================
// buildClassSection — SINGLE SOURCE OF TRUTH for classSection formatting.
//
// Handles all data shapes that /classes API may return:
//   Shape A (preferred): { name: "Grade 10",   section: "A"   } → "Grade 10-A"
//   Shape B (fallback):  { name: "Grade 10-A", section: ""    } → "Grade 10-A"
//   Shape C (fallback):  { displayName: "Grade 10-A", ... }     → "Grade 10-A"
//   Invalid:             { name: "",            section: ""   } → ""
//
// NEVER build classSection inline with template literals — that was the original
// bug that produced "undefined-undefined" corrupt records.
// =============================================================================
const buildClassSection = (classObj) => {
  if (!classObj) return "";

  const name        = (classObj.name        || "").trim();
  const section     = (classObj.section     || "").trim();
  const displayName = (classObj.displayName || "").trim();

  // Shape A: both name and section present → canonical "Name-Section"
  if (name && section) {
    return `${name}-${section}`;
  }

  // Shape B: name already contains the full "Grade X-Y" (section empty)
  // Only trust if it contains a dash — otherwise data is incomplete.
  if (name && name.includes("-")) {
    return name;
  }

  // Shape C: fall back to displayName if it looks like a complete classSection
  if (displayName && displayName.includes("-")) {
    return displayName;
  }

  console.warn("[buildClassSection] Cannot build a valid classSection from:", classObj);
  return "";
};

// ─── Avatar palette ────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  ["#e0f2fe", "#0369a1"], ["#dcfce7", "#15803d"], ["#ede9fe", "#6d28d9"],
  ["#fef3c7", "#b45309"], ["#fee2e2", "#b91c1c"], ["#fce7f3", "#9d174d"],
  ["#ecfdf5", "#065f46"], ["#fff7ed", "#c2410c"],
];
const initials = (n = "") =>
  n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

// ─── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = ({ size = 20, color = "#6366f1" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: "spin 0.8s linear infinite" }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity=".25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type = "success" }) =>
  msg ? (
    <div className={`fixed bottom-6 right-6 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 font-semibold animate-fade-in ${type === "error" ? "bg-red-600" : "bg-gray-900"}`}>
      {type === "error"
        ? <AlertCircle size={15} className="text-red-200 flex-shrink-0" />
        : <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />}
      {msg}
    </div>
  ) : null;

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, accent = "#6366f1" }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: accent + "18" }}>
      <Icon size={18} style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{label}</p>
      <p className="text-xl font-black text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Inline-editable mark cell ────────────────────────────────────────────────
const MarkCell = ({ value, max, onChange, readOnly }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value ?? ""));
  const g = value != null && value !== "" ? gradeOf(value, max) : null;

  const commit = () => {
    const v = Math.min(max, Math.max(0, Number(local) || 0));
    onChange(v);
    setLocal(String(v));
    setEditing(false);
  };

  if (readOnly) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="font-black text-sm" style={{ color: g?.c || "#cbd5e1" }}>
          {value != null && value !== "" ? value : <span className="text-gray-300">—</span>}
        </span>
        {g && (
          <span className="px-1.5 py-0.5 rounded text-xs font-black"
            style={{ background: g.bg, color: g.c }}>{g.g}</span>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <input autoFocus type="number" min={0} max={max} value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setLocal(String(value ?? "")); setEditing(false); }
        }}
        className="w-16 text-center py-1 border-2 border-indigo-400 rounded-lg text-sm font-bold focus:outline-none bg-indigo-50"
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)}
      className="flex flex-col items-center gap-1 group hover:bg-indigo-50 rounded-lg px-2 py-1 transition-colors"
      title="Click to edit">
      <span className="font-black text-sm group-hover:text-indigo-700"
        style={{ color: g?.c || "#94a3b8" }}>
        {value != null && value !== "" ? value : <span className="text-gray-300">—</span>}
      </span>
      {g
        ? <span className="px-1.5 py-0.5 rounded text-xs font-black"
            style={{ background: g.bg, color: g.c }}>{g.g}</span>
        : <Edit3 size={10} className="text-gray-300 group-hover:text-indigo-400" />}
    </button>
  );
};

// =============================================================================
// CreateExamModal
//
// FIXES vs original:
//   1. isValidClassSection derived from prop — single validation source.
//   2. useEffect clears/sets error when classSection changes.
//   3. handleSave hard-guards against invalid classSection before any API call.
//   4. Preset buttons and form inputs disabled when classSection invalid.
//   5. Save button disabled when classSection invalid.
//   6. classSection is always read from prop, never from form state.
// =============================================================================
const CreateExamModal = ({ onClose, onCreated, authFetch, classSection }) => {
  const [form, setForm] = useState({ name: "", shortName: "", max: 100, order: 1 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Derived once; re-evaluated whenever classSection prop changes.
  // Must be "Something-Something" format — catches "", "undefined", "Grade-undefined", etc.
  const isValidClassSection =
    !!classSection &&
    classSection.trim() !== "" &&
    !classSection.includes("undefined") &&
    classSection.trim().includes("-");

  useEffect(() => {
    if (!isValidClassSection) {
      setErr(
        `Invalid class selection ("${classSection}"). ` +
        "Please close this modal, re-select your class, and try again."
      );
    } else {
      setErr("");
    }
  }, [classSection, isValidClassSection]);

  const PRESETS = [
    { name: "Unit Test 1", shortName: "UT1", max: 25,  order: 1 },
    { name: "Midterm",     shortName: "MID", max: 50,  order: 2 },
    { name: "Unit Test 2", shortName: "UT2", max: 25,  order: 3 },
    { name: "Final Exam",  shortName: "FIN", max: 100, order: 4 },
    { name: "Quarterly",   shortName: "QTR", max: 50,  order: 2 },
    { name: "Pre-Board",   shortName: "PRE", max: 100, order: 5 },
  ];

  const handleSave = async () => {
    // Hard guard — never send if classSection is invalid
    if (!isValidClassSection) {
      setErr(
        "Cannot create exam type: class is not properly selected. " +
        "Please close and re-select your class."
      );
      return;
    }
    if (!form.name.trim())      { setErr("Exam name is required.");       return; }
    if (!form.shortName.trim()) { setErr("Short name is required.");      return; }
    if (!form.max || Number(form.max) < 1) { setErr("Max marks must be at least 1."); return; }

    const payload = {
      name:         form.name.trim(),
      shortName:    form.shortName.trim().toUpperCase(),
      max:          Number(form.max),
      order:        Number(form.order) || 1,
      classSection: classSection.trim(), // always from prop — NEVER from form state
    };

    console.log("[CreateExamModal] payload →", payload);

    setSaving(true);
    setErr("");
    try {
      const res = await createExamType(authFetch, payload);
      onCreated(res.data);
    } catch (e) {
      setErr(e.message || "Failed to create exam type.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">Create Exam Type</h2>
            {isValidClassSection ? (
              <p className="text-xs text-indigo-500 font-semibold mt-0.5">
                for class: {classSection}
              </p>
            ) : (
              <p className="text-xs text-red-500 font-semibold mt-0.5">
                ⚠ No valid class selected — please close and re-select
              </p>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Quick presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.shortName}
                  onClick={() => setForm(p)}
                  disabled={!isValidClassSection}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Exam Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Unit Test 1"
                disabled={!isValidClassSection}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Short Name *</label>
              <input
                value={form.shortName}
                onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value.toUpperCase() }))}
                placeholder="UT1"
                maxLength={5}
                disabled={!isValidClassSection}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Max Marks *</label>
              <input
                type="number" min={1} max={500}
                value={form.max}
                onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
                disabled={!isValidClassSection}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Display Order</label>
              <input
                type="number" min={1}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                disabled={!isValidClassSection}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
              />
            </div>
          </div>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} /> {err}
            </p>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isValidClassSection}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Spinner size={14} color="#fff" /> : <Plus size={14} />}
            {saving ? "Creating…" : "Create Exam"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const EnterResults = () => {
  const { authFetch, loading: authLoading } = useAuth();

  // ── Class/section picker ───────────────────────────────────────────────────
  const [rawClasses,    setRawClasses]    = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classSearch,   setClassSearch]   = useState("");

  // ── Exam types (per selected class) ──────────────────────────────────────
  const [exams,       setExams]       = useState([]);
  const [exam,        setExam]        = useState(null);
  const [examStatus,  setExamStatus]  = useState({});

  // ── Subjects & Students ────────────────────────────────────────────────────
  const [subjects,  setSubjects]  = useState(DEFAULT_SUBJECTS);
  const [students,  setStudents]  = useState([]);
  const [marks,     setMarks]     = useState({});

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState("marks");
  const [mode,        setMode]        = useState("view");
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [toast,       setToast]       = useState(null);
  const [toastType,   setToastType]   = useState("success");
  const [showCreate,  setShowCreate]  = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // ── SINGLE SOURCE OF TRUTH for classSection ──────────────────────────────
  // Always derived from selectedClass via buildClassSection().
  // Never built inline with template literals anywhere in this file.
  const cls = buildClassSection(selectedClass);

  const maxMark = exam?.max || 100;

  const showToast = useCallback((msg, type = "success") => {
    setToast(msg); setToastType(type);
    setTimeout(() => { setToast(null); setSaved(false); }, 3500);
  }, []);

  // ── 1. Bootstrap: load all classes for this school ────────────────────────
  useEffect(() => {
    if (authLoading) return;
    setInitLoading(true);
    api.get("/classes")
      .then((r) => {
        const list = (r.data?.classes ?? r.data ?? [])
          .filter((c) => c.isActive && !c.isArchived)
          // Only keep classes where buildClassSection produces a valid result.
          // This prevents classSection bugs from invalid data propagating downstream.
          .filter((c) => {
            const cs = buildClassSection(c);
            if (!cs) {
              console.warn("[EnterResults] Skipping class — cannot build classSection:", c);
            }
            return !!cs;
          });
        setRawClasses(list);
      })
      .catch(() => setError("Could not load classes."))
      .finally(() => setInitLoading(false));
  }, [authLoading]);

  // ── 2. When a class is selected → load exam types + subjects + students ───
  useEffect(() => {
    if (!selectedClass) return;

    // Build and validate classSection before any API call
    const classSection = buildClassSection(selectedClass);
    if (!classSection) {
      console.error("[EnterResults] selectedClass produced invalid classSection:", selectedClass);
      setError("Selected class has invalid data (missing name or section). Please contact support.");
      setSelectedClass(null);
      return;
    }

    // Reset all dependent state
    setExams([]); setExam(null); setMarks({}); setStudents([]);
    setExamStatus({}); setSaved(false); setError(null);

    Promise.all([
      getExamTypes(authFetch, classSection).catch(() => ({ data: [] })),
      getSubjects(authFetch, classSection).catch(() => ({ data: DEFAULT_SUBJECTS })),
      getStudentsByClass(authFetch, classSection).catch(() => ({ data: [] })),
      getClassExamStatus(authFetch, classSection).catch(() => ({ data: {} })),
    ]).then(([examRes, subRes, stuRes, statusRes]) => {
      const examList = (examRes.data ?? []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setExams(examList);
      if (examList.length) setExam(examList[0]);
      setSubjects(subRes.data ?? DEFAULT_SUBJECTS);
      setStudents(stuRes.data ?? []);
      setExamStatus(statusRes.data ?? {});
    }).catch(() => setError("Could not load class data."));
  }, [selectedClass, authFetch]);

  // ── 3. Load marks when exam changes ───────────────────────────────────────
  useEffect(() => {
    if (!cls || !exam) return;
    setLoading(true); setSaved(false); setMarks({});
    getClassMarks(authFetch, cls, exam.name)
      .then((r) => {
        const m = {};
        for (const [sub, sheet] of Object.entries(r.data || {})) {
          m[sub] = sheet.marks || {};
        }
        setMarks(m);
      })
      .catch(() => setError("Could not load marks."))
      .finally(() => setLoading(false));
  }, [cls, exam, authFetch]);

  // ── Edit a cell ────────────────────────────────────────────────────────────
  const setMark = useCallback((sub, sid, raw) => {
    const v = raw === "" ? "" : Math.min(maxMark, Math.max(0, Number(raw)));
    setMarks((prev) => ({ ...prev, [sub]: { ...(prev[sub] || {}), [sid]: v } }));
    setSaved(false);
  }, [maxMark]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!cls || !exam) return;
    setSaving(true); setError(null);
    try {
      await Promise.all(
        subjects.map((sub) => {
          const clean = Object.fromEntries(
            Object.entries(marks[sub] || {}).filter(([, v]) => v !== "" && v !== undefined)
          );
          return saveMarks(authFetch, { classSection: cls, examName: exam.name, subject: sub, marks: clean });
        })
      );
      setSaved(true); setMode("view");
      showToast("All marks saved successfully!");
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally { setSaving(false); }
  };

  // ── Publish / Unpublish ────────────────────────────────────────────────────
  const isPublished = examStatus[exam?.name]?.published;

  const handlePublish = async () => {
    if (!cls || !exam) return;
    if (!window.confirm(`${isPublished ? "Unpublish" : "Publish"} ${cls} — ${exam.name} results?`)) return;
    setPublishing(true);
    try {
      if (isPublished) {
        await unpublishResults(authFetch, { classSection: cls, examName: exam.name });
        showToast("Results hidden from students.");
      } else {
        await publishResults(authFetch, { classSection: cls, examName: exam.name });
        showToast(`${cls} ${exam.name} results published!`);
      }
      const r = await getClassExamStatus(authFetch, cls);
      setExamStatus(r.data || {});
    } catch (e) { setError(e.message); }
    finally { setPublishing(false); }
  };

  // ── Student stats ──────────────────────────────────────────────────────────
  const studentStats = useMemo(() => {
    return students
      .map((s) => {
        let total = 0, entered = 0;
        subjects.forEach((sub) => {
          const v = marks[sub]?.[s._id];
          if (v != null && v !== "") { total += Number(v); entered++; }
        });
        const maxTotal = maxMark * subjects.length;
        const pct = entered > 0 ? Math.round((total / maxTotal) * 100) : 0;
        const grade = entered > 0 ? gradeOf(total, maxTotal) : null;
        return { ...s, total, maxTotal, pct, grade, entered };
      })
      .sort((a, b) => b.pct - a.pct)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [marks, students, maxMark, subjects]);

  const kpi = useMemo(() => {
    const valid = studentStats.filter((s) => s.grade);
    if (!valid.length) return { avg: 0, pass: 0, highest: 0, total: 0 };
    const avg = Math.round(valid.reduce((a, s) => a + s.pct, 0) / valid.length);
    const pass = valid.filter((s) => s.pct >= 35).length;
    const highest = Math.max(...valid.map((s) => s.pct));
    return { avg, pass, highest, total: valid.length };
  }, [studentStats]);

  // ── Delete exam type ────────────────────────────────────────────────────────
  const handleDeleteExam = async (examId, examName) => {
    if (!window.confirm(`Delete exam type "${examName}"? Existing marks are NOT deleted.`)) return;
    try {
      await deleteExamType(authFetch, examId);
      const updated = exams.filter((e) => e._id !== examId);
      setExams(updated);
      if (exam?._id === examId) setExam(updated[0] || null);
      showToast(`Exam "${examName}" deleted.`);
    } catch (e) { setError(e.message); }
  };

  // ── Filtered class list for picker ─────────────────────────────────────────
  const filteredClasses = useMemo(() => {
    if (!classSearch.trim()) return rawClasses;
    const q = classSearch.toLowerCase();
    return rawClasses.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.section?.toLowerCase().includes(q) ||
      c.displayName?.toLowerCase().includes(q)
    );
  }, [rawClasses, classSearch]);

  // ── Group classes by name (grade) for display ──────────────────────────────
  const groupedClasses = useMemo(() => {
    const groups = {};
    filteredClasses.forEach((c) => {
      const key = c.name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return groups;
  }, [filteredClasses]);

  // ── Safe class display label ───────────────────────────────────────────────
  const classDisplayLabel = (c) =>
    c.displayName?.trim() || buildClassSection(c) || "Unknown Class";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .animate-fade-in{animation:fadeIn .25s ease}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manage Results</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-medium flex items-center gap-1.5">
              {selectedClass && cls
                ? <><GraduationCap size={11} className="text-indigo-400" />
                    <span className="text-indigo-600 font-bold">{classDisplayLabel(selectedClass)}</span>
                    <ChevronRight size={11} className="text-gray-300" />
                    <span>Class-wise · Exam-wise · Subject-wise</span>
                  </>
                : "Select a class to begin"}
            </p>
          </div>

          {selectedClass && cls && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tab switcher */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {[
                  { id: "marks", label: "Mark Sheet", icon: FileText },
                  { id: "exams", label: "Exam Types", icon: Settings },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === id ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
                    }`}>
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>

              {activeTab === "marks" && (
                <>
                  <button onClick={() => setMode((m) => m === "view" ? "edit" : "view")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${
                      mode === "edit"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}>
                    {mode === "edit" ? <Edit3 size={14} /> : <Eye size={14} />}
                    {mode === "edit" ? "Editing" : "Viewing"}
                  </button>

                  {mode === "edit" && (
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow text-white transition disabled:opacity-40"
                      style={{ background: saved ? "#15803d" : "#4f46e5" }}>
                      {saving ? <Spinner size={14} color="#fff" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
                      {saving ? "Saving…" : saved ? "Saved!" : "Save All"}
                    </button>
                  )}

                  <button onClick={handlePublish} disabled={publishing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 ${
                      isPublished ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}>
                    {publishing ? <Spinner size={14} color="#fff" /> : isPublished ? <EyeOff size={14} /> : <Globe size={14} />}
                    {isPublished ? "Unpublish" : "Publish"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 flex gap-6">

        {/* ════ LEFT SIDEBAR — Class Picker ════ */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Classes</p>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={classSearch} onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Filter classes…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {initLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size={20} color="#6366f1" />
                </div>
              ) : rawClasses.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <GraduationCap size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No classes found</p>
                  <p className="text-xs text-gray-300 mt-1">Create classes in Manage Classes first</p>
                </div>
              ) : Object.keys(groupedClasses).length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-gray-400">No results for "{classSearch}"</p>
                </div>
              ) : (
                Object.entries(groupedClasses).map(([gradeName, sections]) => (
                  <div key={gradeName}>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-50">
                      <p className="text-xs font-bold text-gray-400">{gradeName}</p>
                    </div>
                    {sections
                      .sort((a, b) => (a.section || "").localeCompare(b.section || ""))
                      .map((c) => {
                        const isSelected = selectedClass?._id === c._id;
                        return (
                          <button key={c._id}
                            onClick={() => {
                              setSelectedClass(c);
                              setMode("view");
                              setSaved(false);
                              setActiveTab("marks");
                            }}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition border-b border-gray-50 last:border-0 ${
                              isSelected
                                ? "bg-indigo-50 border-l-2 border-l-indigo-500"
                                : "hover:bg-gray-50 border-l-2 border-l-transparent"
                            }`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                              isSelected ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"
                            }`}>
                              {(c.section || buildClassSection(c).split("-")[1] || "?").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold truncate ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>
                                {classDisplayLabel(c)}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{c.academicYear}</p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ════ MAIN CONTENT ════ */}
        <div className="flex-1 min-w-0 space-y-5">

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="font-bold hover:text-red-900"><X size={14} /></button>
            </div>
          )}

          {/* No class selected */}
          {!selectedClass && !initLoading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
              <GraduationCap size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="font-black text-gray-400 text-lg">Select a class from the left panel</p>
              <p className="text-sm text-gray-300 mt-2">
                {rawClasses.length === 0
                  ? "No classes found — create classes in Manage Classes first"
                  : `${rawClasses.length} class${rawClasses.length !== 1 ? "es" : ""} available`}
              </p>
            </div>
          )}

          {/* Safety fallback: selectedClass exists but cls is still invalid */}
          {selectedClass && !cls && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-red-200 py-24 text-center">
              <AlertCircle size={48} className="text-red-200 mx-auto mb-4" />
              <p className="font-black text-red-400 text-lg">Invalid class data</p>
              <p className="text-sm text-gray-400 mt-2">
                This class is missing a name or section. Please go to Manage Classes and fix it.
              </p>
              <button onClick={() => setSelectedClass(null)}
                className="mt-4 px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition">
                Back to class list
              </button>
            </div>
          )}

          {selectedClass && cls && (
            <>
              {/* ════ EXAM TYPES TAB ════ */}
              {activeTab === "exams" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        Exam Types — <span className="text-indigo-600">{classDisplayLabel(selectedClass)}</span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        These exam types are specific to <strong>{cls}</strong>
                      </p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition">
                      <Plus size={14} /> New Exam Type
                    </button>
                  </div>

                  {exams.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-4xl mb-3">📋</p>
                      <p className="font-bold text-gray-500">No exam types for <strong>{cls}</strong> yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Create exam types to start managing results.
                      </p>
                      <button onClick={() => setShowCreate(true)}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition">
                        <Plus size={14} /> Create First Exam Type
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...exams].sort((a, b) => (a.order || 0) - (b.order || 0)).map((ex) => (
                        <div key={ex._id}
                          className="border border-gray-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-sm transition group">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-black text-xs mb-1">
                                {ex.shortName}
                              </span>
                              <h4 className="font-bold text-gray-800">{ex.name}</h4>
                            </div>
                            <button onClick={() => handleDeleteExam(ex._id, ex.name)}
                              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition text-red-400">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500">Max:</span>
                            <span className="font-black text-gray-900">{ex.max} marks</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm mt-1">
                            <span className="text-gray-500">Order:</span>
                            <span className="font-semibold text-gray-600">#{ex.order || "—"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm mt-1">
                            <span className="text-gray-500">Class:</span>
                            <span className="font-semibold text-indigo-600 text-xs">{ex.classSection}</span>
                          </div>
                          {examStatus[ex.name]?.published && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <Globe size={11} /> Published
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Add card */}
                      <button onClick={() => setShowCreate(true)}
                        className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/50 transition min-h-[100px]">
                        <Plus size={20} className="text-gray-300" />
                        <span className="text-sm font-bold text-gray-400">Add Exam Type</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ════ MARKS TAB ════ */}
              {activeTab === "marks" && (
                <>
                  {/* Exam selector bar */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
                        Select Exam
                      </p>
                      <button onClick={() => setActiveTab("exams")}
                        className="text-xs text-indigo-500 font-semibold hover:underline flex items-center gap-1">
                        <Settings size={11} /> Manage Exams
                      </button>
                    </div>

                    {exams.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        No exam types for <strong>{cls}</strong>.{" "}
                        <button onClick={() => setActiveTab("exams")} className="font-bold underline">
                          Create one →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {[...exams].sort((a, b) => (a.order || 0) - (b.order || 0)).map((ex) => {
                          const st = examStatus[ex.name];
                          const isSel = exam?.name === ex.name;
                          return (
                            <button key={ex.name}
                              onClick={() => { setExam(ex); setMarks({}); }}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition ${
                                isSel
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                              }`}>
                              {st?.published
                                ? <Unlock size={11} className={isSel ? "text-white" : "text-emerald-500"} />
                                : <Lock size={11} className={isSel ? "text-white" : "text-gray-400"} />}
                              {ex.shortName || ex.name}
                              <span className="text-xs opacity-60">/{ex.max}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {mode === "edit" && (
                      <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg mt-4 font-medium">
                        ✏️ Edit mode — click any score cell to modify it. Hit <strong>Save All</strong> when done.
                      </p>
                    )}
                    {isPublished && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg mt-3 font-medium flex items-center gap-2">
                        <CheckCircle size={13} /> Results are <strong>published</strong> — students can see their marks.
                      </p>
                    )}
                  </div>

                  {/* Content area */}
                  {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
                      <Spinner size={32} color="#6366f1" />
                      <p className="text-sm text-gray-400 mt-3">Loading marks…</p>
                    </div>
                  ) : !exam ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                      <p className="text-4xl mb-3">📊</p>
                      <p className="font-bold text-gray-500">
                        {exams.length === 0
                          ? "Create exam types first to start entering marks"
                          : "Select an exam above to view the mark sheet"}
                      </p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                      <p className="text-4xl mb-3">👥</p>
                      <p className="font-bold text-gray-500">No students found in <strong>{cls}</strong></p>
                    </div>
                  ) : (
                    <>
                      {/* KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <KpiCard icon={Users}     label="Students" value={students.length} accent="#4f46e5" />
                        <KpiCard icon={BarChart3}  label="Class Avg" value={`${kpi.avg || 0}%`} accent="#0891b2" />
                        <KpiCard icon={TrendingUp} label="Highest" value={kpi.highest ? `${kpi.highest}%` : "—"} accent="#15803d" />
                        <KpiCard icon={Award}      label="Pass Rate"
                          value={kpi.total ? `${Math.round((kpi.pass / kpi.total) * 100)}%` : "—"}
                          sub={`${kpi.pass || 0} of ${kpi.total || 0} students`}
                          accent="#d97706" />
                      </div>

                      {/* Mark sheet */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h3 className="font-bold text-gray-800">
                              Mark Sheet — <span className="text-indigo-600">{cls}</span> · <span className="text-indigo-600">{exam.name}</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Max per subject: {maxMark}</p>
                          </div>
                          {isPublished && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <Globe size={11} /> Published
                            </span>
                          )}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm min-w-max">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-3 px-4 pl-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                                  Student
                                </th>
                                {subjects.map((sub) => (
                                  <th key={sub}
                                    className="py-3 px-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                                    style={{ color: "#4f46e5", minWidth: 90 }}>
                                    {sub.length > 8 ? sub.substring(0, 7) + "…" : sub}
                                    <div className="text-gray-400 font-normal normal-case tracking-normal">/{maxMark}</div>
                                  </th>
                                ))}
                                {["Total", "Pct", "Grade", "Rank"].map((h) => (
                                  <th key={h} className="py-3 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {studentStats.map((s, i) => {
                                const [abg, atx] = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                                return (
                                  <tr key={s._id}
                                    className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors group">
                                    <td className="py-3 px-4 pl-5 sticky left-0 bg-white group-hover:bg-indigo-50/20 z-10">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                          style={{ background: abg, color: atx }}>
                                          {initials(s.name)}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                                          <p className="text-xs text-gray-400">
                                            {s.rollNumber ? `Roll ${s.rollNumber}` : s.email || ""}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    {subjects.map((sub) => (
                                      <td key={sub} className="py-2 px-3 text-center">
                                        <MarkCell
                                          value={marks[sub]?.[s._id]}
                                          max={maxMark}
                                          onChange={(v) => setMark(sub, s._id, v)}
                                          readOnly={mode === "view"}
                                        />
                                      </td>
                                    ))}
                                    <td className="py-3 px-4 text-center">
                                      <span className="font-black text-gray-900">{s.total}</span>
                                      <span className="text-gray-400 text-xs">/{s.maxTotal}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="font-black text-sm"
                                        style={{ color: s.grade?.c || "#94a3b8" }}>
                                        {s.grade ? `${s.pct}%` : "—"}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      {s.grade
                                        ? <span className="px-2 py-0.5 rounded-full text-xs font-black"
                                            style={{ background: s.grade.bg, color: s.grade.c }}>
                                            {s.grade.g}
                                          </span>
                                        : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="font-bold text-sm"
                                        style={{ color: s.rank <= 3 ? "#d97706" : "#94a3b8" }}>
                                        {s.rank <= 3 ? ["🥇", "🥈", "🥉"][s.rank - 1] : `#${s.rank}`}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {mode === "edit" && (
                          <div className="flex justify-end px-5 py-3 bg-gray-50 border-t border-gray-100">
                            <button onClick={handleSave} disabled={saving}
                              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow text-white transition disabled:opacity-40"
                              style={{ background: saved ? "#15803d" : "#4f46e5" }}>
                              {saving ? <Spinner size={14} color="#fff" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
                              {saving ? "Saving…" : saved ? "Saved!" : "Save All Marks"}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Exam Modal — only opened when cls is valid */}
      {showCreate && cls && (
        <CreateExamModal
          authFetch={authFetch}
          classSection={cls}
          onClose={() => setShowCreate(false)}
          onCreated={(newExam) => {
            setExams((prev) =>
              [...prev, newExam].sort((a, b) => (a.order || 0) - (b.order || 0))
            );
            setShowCreate(false);
            showToast(`Exam "${newExam.name}" created for ${cls}!`);
          }}
        />
      )}

      <Toast msg={toast} type={toastType} />
    </div>
  );
};

export default EnterResults;