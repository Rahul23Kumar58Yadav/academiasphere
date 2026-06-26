// src/pages/teacher/Result.jsx
// Route: /teacher/result
// Teacher: picks class (admin-created) → exam (per-class) → subject → enters marks → saves.
// Classes are loaded from the Class model via /api/v1/classes — same source as admin.

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Save, CheckCircle, ChevronDown, Users, TrendingUp,
  Award, BarChart2, Info, AlertCircle, Send, X,
  GraduationCap, BookOpen, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  gradeOf, DEFAULT_SUBJECTS,
  getExamTypes, getStudentsByClass,
  getSheet, saveMarks, submitSheet, getSubjects,
} from "../../services/resultApi";
import api from "../../services/api"; // ← same axios instance used by ClassDashboard

// ─── Avatar palette ────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  ["#e0f2fe","#0369a1"], ["#dcfce7","#15803d"], ["#ede9fe","#6d28d9"],
  ["#fef3c7","#b45309"], ["#fee2e2","#b91c1c"], ["#fce7f3","#9d174d"],
  ["#ecfdf5","#065f46"], ["#fff7ed","#c2410c"],
];
const initials = (n = "") =>
  n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Spinner = ({ size = 20, color = "#7c3aed" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: "spin 0.8s linear infinite" }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity=".25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const KpiCard = ({ icon: Icon, label, value, accent = "#7c3aed" }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: accent + "20" }}>
      <Icon size={18} style={{ color: accent }} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className="text-lg font-black text-gray-900">{value}</p>
    </div>
  </div>
);

const GRADE_SCALE = [
  { g: "A+", r: "90–100", c: "#15803d", bg: "#dcfce7" },
  { g: "A",  r: "80–89",  c: "#0369a1", bg: "#e0f2fe" },
  { g: "B+", r: "70–79",  c: "#6d28d9", bg: "#ede9fe" },
  { g: "B",  r: "60–69",  c: "#1d4ed8", bg: "#dbeafe" },
  { g: "C",  r: "50–59",  c: "#b45309", bg: "#fef3c7" },
  { g: "D",  r: "35–49",  c: "#c2410c", bg: "#ffedd5" },
  { g: "F",  r: "0–34",   c: "#b91c1c", bg: "#fee2e2" },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
const Result = () => {
  const { authFetch, loading: authLoading } = useAuth();

  // ── Class data (from Class model — admin-created) ─────────────────────────
  const [rawClasses,    setRawClasses]    = useState([]); // full class objects
  const [selectedClass, setSelectedClass] = useState(null);
  // classSection string derived from selected class: "Grade 9-C"
  const cls = selectedClass
    ? `${selectedClass.name}-${selectedClass.section}`
    : "";

  // ── Per-class data ────────────────────────────────────────────────────────
  const [exams,    setExams]    = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [students, setStudents] = useState([]);
  const [marks,    setMarks]    = useState({});

  // ── Selectors ─────────────────────────────────────────────────────────────
  const [exam, setExam] = useState(null);
  const [sub,  setSub]  = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loadingInit,     setLoadingInit]     = useState(true);
  const [loadingClassData, setLoadingClassData] = useState(false);
  const [loadingMarks,    setLoadingMarks]    = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [error,           setError]           = useState(null);
  const [toast,           setToast]           = useState(null);

  const maxMark = exam?.max || 100;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => { setToast(null); setSaved(false); }, 3500);
  };

  // ── Group classes by grade name for dropdown ───────────────────────────────
  const groupedClasses = useMemo(() => {
    const groups = {};
    rawClasses.forEach((c) => {
      if (!groups[c.name]) groups[c.name] = [];
      groups[c.name].push(c);
    });
    return groups;
  }, [rawClasses]);

  // ── 1. Bootstrap: load admin-created classes from /classes ────────────────
  useEffect(() => {
    if (authLoading) return;
    setLoadingInit(true);
    api.get("/classes")
      .then((r) => {
        const list = (r.data?.classes ?? r.data ?? [])
          .filter((c) => c.isActive && !c.isArchived)
          .sort((a, b) => a.name.localeCompare(b.name) || a.section.localeCompare(b.section));
        setRawClasses(list);
      })
      .catch(() => setError("Could not load classes. Check your connection."))
      .finally(() => setLoadingInit(false));
  }, [authLoading]);

  // ── 2. When class changes → load exams + subjects + students ─────────────
  useEffect(() => {
    if (!selectedClass) {
      setExams([]); setExam(null); setSubjects(DEFAULT_SUBJECTS);
      setStudents([]); setMarks({}); setSub("");
      return;
    }

    setLoadingClassData(true);
    setExam(null); setSub(""); setMarks({}); setSaved(false);

    const classSection = `${selectedClass.name}-${selectedClass.section}`;

    Promise.all([
      getExamTypes(authFetch, classSection).catch(() => ({ data: [] })),
      getSubjects(authFetch, classSection).catch(() => ({ data: DEFAULT_SUBJECTS })),
      getStudentsByClass(authFetch, classSection).catch(() => ({ data: [] })),
    ]).then(([examRes, subRes, stuRes]) => {
      const examList = (examRes.data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setExams(examList);
      setSubjects(subRes.data?.length ? subRes.data : DEFAULT_SUBJECTS);
      setStudents(stuRes.data || []);
    }).catch(() => setError("Could not load class data."))
    .finally(() => setLoadingClassData(false));
  }, [selectedClass, authFetch]);

  // ── 3. Load existing marks when exam + subject selected ───────────────────
  useEffect(() => {
    if (!cls || !exam || !sub) return;
    setLoadingMarks(true); setSaved(false);
    getSheet(authFetch, cls, exam.name, sub)
      .then((r) => setMarks(r.data?.marks || {}))
      .catch(() => setError("Could not load existing marks."))
      .finally(() => setLoadingMarks(false));
  }, [cls, exam, sub, authFetch]);

  // ── Mark editing ──────────────────────────────────────────────────────────
  const setMark = useCallback((id, raw) => {
    const v = raw === "" ? "" : Math.min(maxMark, Math.max(0, Number(raw)));
    setMarks((prev) => ({ ...prev, [id]: v }));
    setSaved(false);
  }, [maxMark]);

  const clearMark = useCallback((id) => {
    setMarks((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setSaved(false);
  }, []);

  // ── Save marks ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!cls || !exam || !sub) return;
    setSaving(true); setError(null);
    try {
      const clean = Object.fromEntries(
        Object.entries(marks).filter(([, v]) => v !== "" && v !== undefined)
      );
      await saveMarks(authFetch, { classSection: cls, examName: exam.name, subject: sub, marks: clean });
      setSaved(true);
      showToast("Marks saved! Students can now see their results.");
    } catch (e) { setError(e.message || "Failed to save marks."); }
    finally { setSaving(false); }
  };

  // ── Submit to admin ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!cls || !exam || !sub) return;
    if (!window.confirm(`Submit ${sub} marks for ${cls} — ${exam.name} to admin for review?`)) return;
    setSubmitting(true);
    try {
      await submitSheet(authFetch, { classSection: cls, examName: exam.name, subject: sub });
      showToast("Sheet submitted to admin for review.");
    } catch (e) { setError(e.message || "Submit failed."); }
    finally { setSubmitting(false); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const ready      = !!cls && !!exam && !!sub;
  const entered    = students.filter((s) => marks[s._id] !== "" && marks[s._id] !== undefined);
  const scores     = entered.map((s) => Number(marks[s._id]));
  const avg        = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highest    = scores.length ? Math.max(...scores) : 0;
  const passCount  = scores.filter((v) => (v / maxMark) * 100 >= 35).length;
  const progress   = students.length ? Math.round((entered.length / students.length) * 100) : 0;

  const gradeDist = useMemo(() => {
    const dist = { "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
    scores.forEach((v) => { const g = gradeOf(v, maxMark); if (g) dist[g.g] = (dist[g.g] || 0) + 1; });
    return dist;
  }, [scores, maxMark]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Enter Marks</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedClass
                ? <>Class: <span className="font-bold text-violet-600">{selectedClass.displayName || cls}</span> · {selectedClass.academicYear}</>
                : "Select a class to begin entering marks"}
            </p>
          </div>
          {ready && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleSubmit} disabled={submitting || !entered.length}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting ? <Spinner size={14} /> : <Send size={14} />}
                {submitting ? "Submitting…" : "Submit to Admin"}
              </button>
              <button onClick={handleSave} disabled={saving || !entered.length}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow transition disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{ background: saved ? "#15803d" : "#7c3aed" }}>
                {saving ? <Spinner size={15} color="#fff" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save Marks"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="hover:text-red-900"><X size={14} /></button>
          </div>
        )}

        {/* ── Selectors Panel ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {loadingInit ? (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Spinner size={16} /> Loading classes…
            </div>
          ) : rawClasses.length === 0 ? (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>No classes found. Ask your school admin to create classes first.</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* ── Class selector — grouped by grade ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Class &amp; Section
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClass?._id || ""}
                      onChange={(e) => {
                        const found = rawClasses.find((c) => c._id === e.target.value);
                        setSelectedClass(found || null);
                      }}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer transition"
                    >
                      <option value="">Select class…</option>
                      {Object.entries(groupedClasses).map(([gradeName, sections]) => (
                        <optgroup key={gradeName} label={gradeName}>
                          {sections
                            .sort((a, b) => a.section.localeCompare(b.section))
                            .map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.displayName || `${c.name} - ${c.section}`}
                                {c.classTeacherName ? ` (${c.classTeacherName})` : ""}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* ── Exam selector — per-class ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Exam
                  </label>
                  <div className="relative">
                    <select
                      value={exam?.name || ""}
                      onChange={(e) => {
                        const e_ = exams.find((x) => x.name === e.target.value);
                        setExam(e_ || null); setMarks({});
                      }}
                      disabled={!selectedClass || loadingClassData || exams.length === 0}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                    >
                      <option value="">
                        {!selectedClass
                          ? "Select class first"
                          : loadingClassData
                          ? "Loading…"
                          : exams.length === 0
                          ? "No exams configured"
                          : "Select exam…"}
                      </option>
                      {exams.map((e) => (
                        <option key={e.name} value={e.name}>
                          {e.name} (max {e.max})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* ── Subject selector ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={sub}
                      onChange={(e) => { setSub(e.target.value); setMarks({}); }}
                      disabled={!exam}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                    >
                      <option value="">Select subject…</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Exam quick-select pills */}
              {selectedClass && exams.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-gray-400">Quick select:</span>
                  {exams.map((ex) => (
                    <button key={ex.name}
                      onClick={() => { setExam(ex); setMarks({}); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        exam?.name === ex.name
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                      }`}>
                      {ex.shortName || ex.name}
                      <span className="opacity-60 ml-1">/{ex.max}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No exams warning */}
              {selectedClass && !loadingClassData && exams.length === 0 && (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg font-medium flex items-center gap-2">
                  <AlertCircle size={13} />
                  No exam types configured for <strong>{selectedClass.displayName || cls}</strong>.
                  Ask your school admin to create exam types for this class.
                </p>
              )}

              {/* Context banner */}
              {ready && (
                <div className="mt-4 flex items-start gap-2 text-xs text-violet-600 bg-violet-50 px-3 py-2 rounded-lg">
                  <Info size={13} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Entering marks for <strong>{sub}</strong> · <strong>{cls}</strong> ·{" "}
                    <strong>{exam.name}</strong> · max <strong>{maxMark}</strong>
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Empty / initial state ── */}
        {!ready && !loadingInit && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            {!selectedClass ? (
              <>
                <GraduationCap size={44} className="text-gray-200 mx-auto mb-4" />
                <p className="font-bold text-gray-400 text-sm">
                  {rawClasses.length === 0
                    ? "No classes available"
                    : "Select a class above to begin"}
                </p>
                {rawClasses.length > 0 && (
                  <p className="text-xs text-gray-300 mt-1">
                    {rawClasses.length} class{rawClasses.length !== 1 ? "es" : ""} available
                  </p>
                )}
              </>
            ) : !exam ? (
              <>
                <BookOpen size={44} className="text-gray-200 mx-auto mb-4" />
                <p className="font-bold text-gray-400 text-sm">Select an exam to continue</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">📝</p>
                <p className="font-bold text-gray-400 text-sm">Select a subject to begin entering marks</p>
              </>
            )}
          </div>
        )}

        {/* ── Loading state ── */}
        {ready && (loadingClassData || loadingMarks) && (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
            <Spinner size={28} />
            <p className="text-sm font-medium mt-3">Loading…</p>
          </div>
        )}

        {/* ── Main marks entry ── */}
        {ready && !loadingClassData && !loadingMarks && (
          <>
            {students.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                <p className="text-5xl mb-3">👥</p>
                <p className="font-bold text-gray-500">No students enrolled in <strong>{cls}</strong></p>
                <p className="text-xs text-gray-400 mt-1">Ask your admin to add students to this class.</p>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon={Users}      label="Entered"  value={`${entered.length}/${students.length}`}                accent="#7c3aed" />
                  <KpiCard icon={BarChart2}  label="Average"  value={scores.length ? `${avg}/${maxMark}` : "—"}             accent="#0891b2" />
                  <KpiCard icon={TrendingUp} label="Highest"  value={scores.length ? `${highest}/${maxMark}` : "—"}         accent="#15803d" />
                  <KpiCard icon={Award}      label="Passing"  value={scores.length ? `${passCount}/${entered.length}` : "—"} accent="#d97706" />
                </div>

                {/* Progress + Grade distribution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Entry progress */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                      <span>Entry progress</span>
                      <span>{entered.length} of {students.length} filled ({progress}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)" }} />
                    </div>
                    {progress === 100 && (
                      <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                        <CheckCircle size={12} /> All marks entered — ready to save!
                      </p>
                    )}
                  </div>

                  {/* Grade distribution bar chart */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                    <p className="text-xs font-bold text-gray-400 mb-2">Grade distribution</p>
                    <div className="flex items-end gap-1 h-10">
                      {Object.entries(gradeDist).map(([g, count]) => {
                        const scale    = GRADE_SCALE.find((s) => s.g === g);
                        const maxCount = Math.max(...Object.values(gradeDist), 1);
                        return (
                          <div key={g} className="flex flex-col items-center gap-1 flex-1" title={`${g}: ${count}`}>
                            <div className="w-full rounded-t" style={{
                              height:    `${(count / maxCount) * 32}px`,
                              background: scale?.c || "#e2e8f0",
                              minHeight:  count > 0 ? 4 : 0,
                            }} />
                            <span className="font-black" style={{ color: scale?.c || "#94a3b8", fontSize: 10 }}>{g}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Marks table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Roll", "Student Name", `Score (/${maxMark})`, "Percentage", "Grade", "Pass/Fail", ""].map((h, i) => (
                            <th key={i}
                              className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left"
                              style={{ paddingLeft: i === 0 ? 20 : undefined }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => {
                          const m   = marks[s._id];
                          const g   = (m !== "" && m !== undefined) ? gradeOf(m, maxMark) : null;
                          const [abg, atx] = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                          return (
                            <tr key={s._id} className="border-b border-gray-50 hover:bg-violet-50/30 transition-colors">
                              <td className="py-3 pl-5 pr-3 font-mono text-xs font-bold text-gray-400">
                                {s.rollNumber || String(i + 1).padStart(2, "0")}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                    style={{ background: abg, color: atx }}>
                                    {initials(s.name)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{s.name}</p>
                                    {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number" min={0} max={maxMark}
                                    value={m ?? ""} placeholder="—"
                                    onChange={(e) => setMark(s._id, e.target.value)}
                                    className="w-20 text-center py-1.5 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
                                  />
                                  <span className="text-xs text-gray-400">/ {maxMark}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {g ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${g.p}%`, background: g.c }} />
                                    </div>
                                    <span className="font-bold text-sm" style={{ color: g.c }}>{g.p}%</span>
                                  </div>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="py-3 px-4">
                                {g
                                  ? <span className="px-2.5 py-0.5 rounded-full text-xs font-black"
                                      style={{ background: g.bg, color: g.c }}>{g.g}</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="py-3 px-4">
                                {g && (
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    g.p >= 35 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                  }`}>
                                    {g.p >= 35 ? "PASS" : "FAIL"}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {m !== "" && m !== undefined && (
                                  <button onClick={() => clearMark(s._id)}
                                    className="text-gray-300 hover:text-red-400 transition" title="Clear mark">
                                    <X size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table footer */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100 flex-wrap gap-3">
                    <div className="text-xs text-gray-400 font-medium">
                      {entered.length} of {students.length} marks entered
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleSubmit} disabled={submitting || !entered.length}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        {submitting ? <Spinner size={13} /> : <Send size={13} />}
                        Submit to Admin
                      </button>
                      <button onClick={handleSave} disabled={saving || !entered.length}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed text-white"
                        style={{ background: saved ? "#15803d" : "#7c3aed" }}>
                        {saving ? <Spinner size={14} color="#fff" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
                        {saving ? "Saving…" : saved ? "Saved!" : "Save All Marks"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grading scale reference */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Grading Scale</p>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_SCALE.map((row) => (
                      <div key={row.g} className="px-3 py-1.5 rounded-lg border text-center"
                        style={{ background: row.bg, borderColor: row.c + "40" }}>
                        <p className="text-sm font-black" style={{ color: row.c }}>{row.g}</p>
                        <p className="text-xs" style={{ color: row.c + "99" }}>{row.r}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 font-semibold animate-bounce-in">
          <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
};

export default Result;