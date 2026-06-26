import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  ClipboardCheck, Users, CheckCircle, XCircle, Clock,
  Search, Save, RotateCcw, AlertCircle,
  CheckSquare, Square, UserCheck, UserX, BarChart3,
  Eye, Edit3, RefreshCw, ChevronDown, BookOpen,
  Database, BookMarked, Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getTeacherClasses,
  getStudentsForClass,
  getSubjectsForClass,
  getTeacherHistory,
  getTodayStatus,
  markAttendance,
  editAttendance,
} from "../../services/attendanceApi";
import { attendanceBus } from "../../hooks/useAttendanceRealtime";

// ── Shared axios instance ─────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

// ── Avatar colours ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500","bg-indigo-500","bg-blue-500","bg-cyan-500",
  "bg-teal-500","bg-emerald-500","bg-pink-500","bg-rose-500",
];
const avatarColor = (id) =>
  AVATAR_COLORS[String(id).charCodeAt(0) % AVATAR_COLORS.length];

// ─────────────────────────────────────────────────────────────────────────────
// parseRawGrade  — mirrors the same helper in attendance.controller.js
// "Grade 10" → "10",  "Class 9" → "9",  "10" → "10"
// ─────────────────────────────────────────────────────────────────────────────
function parseRawGrade(grade) {
  return (grade || "").trim().replace(/^(grade|class)\s+/i, "").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// buildGradeVariants
// Returns every format the grade might exist as in the DB so we cast a wide net.
// ─────────────────────────────────────────────────────────────────────────────
function buildGradeVariants(grade) {
  const raw       = parseRawGrade(grade);      // "10"
  const withGrade = `Grade ${raw}`;            // "Grade 10"
  const withClass = `Class ${raw}`;            // "Class 10"
  return [...new Set([grade, raw, withGrade, withClass])].filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchSubjectsForClassFull
//
// Four-pass strategy, collecting into a deduped Set:
//
//  Pass 1  /subjects  (Subject model) — tried with EVERY grade variant + className
//  Pass 2  /attendance/subjects-for-class — tried with EVERY grade variant
//  Pass 3  Class-embedded subjects from getTeacherClasses response
//  Pass 4  (implicit) — if all else empty, caller falls back to class defaults
//
// Returns { subjects: string[], source: string }
// ─────────────────────────────────────────────────────────────────────────────
async function fetchSubjectsForClassFull(cls) {
  const results    = new Set();
  const sourceTags = [];   // track which passes contributed

  const gradeVariants = buildGradeVariants(cls.grade);
  const section       = (cls.section || "").trim().toUpperCase();

  // ── Pass 1: Subject model endpoint (/subjects) ────────────────────────────
  // Build every className variant the admin might have used when assigning subjects.
  const classNameVariants = [
    cls.displayName,
    ...gradeVariants.map((g) => `${g}-${section}`),
    ...gradeVariants.map((g) => `${g} ${section}`),
    ...gradeVariants.map((g) => `${g} - ${section}`),
    ...gradeVariants,
  ].filter(Boolean);

  for (const className of classNameVariants) {
    try {
      const res = await api.get("/subjects", {
        params: { className, isActive: true, limit: 100 },
      });
      const subs = res.data?.subjects ?? res.data?.data ?? [];
      if (subs.length > 0) {
        subs.forEach((s) => {
          const name = typeof s === "string" ? s : s?.name;
          if (name) results.add(name);
        });
        sourceTags.push("Subject model");
        break;   // found something — no need to try more variants
      }
    } catch (_) {
      // silent — try next variant
    }
  }

  // ── Pass 2: Attendance subjects endpoint — try EVERY grade variant ────────
  // This endpoint does its own variant matching on the server, but we also try
  // raw/prefixed grades client-side to maximise hit rate.
  const prevSize = results.size;
  for (const g of gradeVariants) {
    try {
      const res = await api.get("/attendance/subjects-for-class", {
        params: { grade: g, section: cls.section },
      });
      const names = res.data?.data ?? [];
      names.forEach((n) => n && results.add(n));
    } catch (_) {
      // silent
    }
  }
  if (results.size > prevSize) sourceTags.push("Attendance history");

  // ── Pass 3: Subjects embedded in the Class document ───────────────────────
  if (Array.isArray(cls.subjects) && cls.subjects.length > 0) {
    const prevSize2 = results.size;
    cls.subjects.forEach((s) => {
      const name = typeof s === "string" ? s : (s?.subjectName ?? s?.name);
      if (name) results.add(name);
    });
    if (results.size > prevSize2) sourceTags.push("Class defaults");
  }

  const unique = [...results].filter(Boolean).sort();
  const source = sourceTags.length
    ? sourceTags.join(" + ")
    : unique.length
    ? "Loaded"
    : "none";

  return { subjects: unique, source };
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, color, sub }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${color}`}>
    <Icon size={18} className="flex-shrink-0" />
    <div>
      <p className="text-xs font-medium opacity-60">{label}</p>
      <p className="text-xl font-bold leading-none">{value}</p>
      {sub && <p className="text-xs opacity-50 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Student row ───────────────────────────────────────────────────────────────
const StudentRow = React.memo(({ student, status, onToggle }) => {
  const isPresent = status === "present";
  const isAbsent  = status === "absent";
  const isLate    = status === "late";
  const lowAttendance = (student.attendancePercentage ?? 100) < 75;

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150 ${
      isPresent ? "bg-emerald-50 border-emerald-200 shadow-sm"
      : isAbsent  ? "bg-red-50 border-red-200 shadow-sm"
      : isLate    ? "bg-amber-50 border-amber-200 shadow-sm"
      : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm"
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(student._id)}`}>
          {student.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{student.name}</p>
          <p className="text-xs text-gray-400">Roll #{student.rollNo || student.rollNumber || "—"}</p>
        </div>
        {lowAttendance && (
          <span className="ml-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 border border-red-200">
            {student.attendancePercentage}% ⚠
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        {[
          ["present", CheckCircle, "emerald", "P"],
          ["absent",  XCircle,    "red",     "A"],
          ["late",    Clock,      "amber",   "L"],
        ].map(([s, Icon, c, short]) => (
          <button key={s} onClick={() => onToggle(student._id, s)}
            title={s.charAt(0).toUpperCase() + s.slice(1)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === s
                ? c === "emerald" ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200"
                  : c === "red"   ? "bg-red-500    text-white shadow-sm ring-2 ring-red-200"
                  :                  "bg-amber-500  text-white shadow-sm ring-2 ring-amber-200"
                : "bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600"
            }`}>
            <Icon size={12} />
            <span className="capitalize hidden sm:inline">{s}</span>
            <span className="sm:hidden">{short}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Select wrapper ────────────────────────────────────────────────────────────
function Sel({ label, value, onChange, children, disabled, loading, icon: Icon }) {
  return (
    <div>
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          {Icon && <Icon size={11} className="text-gray-400" />}
          {label}
          {loading && <RefreshCw size={10} className="animate-spin text-indigo-400 ml-auto" />}
        </label>
      )}
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {children}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Source badge icon helper ──────────────────────────────────────────────────
const SOURCE_ICON = {
  "Subject model":      Database,
  "Attendance history": BookMarked,
  "Class defaults":     Layers,
};

// ── Subject pill ──────────────────────────────────────────────────────────────
const SubjectPill = ({ subject, selected, onClick }) => (
  <button
    onClick={() => onClick(subject)}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap ${
      selected
        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
    }`}>
    {subject || "General"}
  </button>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function TeacherAttendance({ user = {} }) {
  const today = new Date().toISOString().split("T")[0];

  const [activeTab,   setActiveTab]   = useState("mark");

  // class + subject
  const [classes,     setClasses]     = useState([]);
  const [selClassIdx, setSelClassIdx] = useState(0);
  const [selSubject,  setSelSubject]  = useState("");
  const [selDate,     setSelDate]     = useState(today);

  // subjects
  const [subjects,        setSubjects]        = useState([]);
  const [subjectSource,   setSubjectSource]   = useState("");   // e.g. "Subject model + Class defaults"
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectError,    setSubjectError]    = useState(false);
  const subjectFetchRef = useRef(0);

  // mark tab
  const [students,        setStudents]        = useState([]);
  const [attendance,      setAttendance]      = useState({});
  const [editingId,       setEditingId]       = useState(null);
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [saved,           setSaved]           = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [alreadyMarked,   setAlreadyMarked]   = useState(false);
  const [studentError,    setStudentError]    = useState(null);

  // history tab
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySubject, setHistorySubject] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);

  const cls = classes[selClassIdx] ?? null;

  // ── 1. Load teacher's classes ─────────────────────────────────────────────
  useEffect(() => {
    setLoadingClasses(true);
    getTeacherClasses()
      .then((d) => {
        const list = d.data ?? [];
        setClasses(list);
        setSelClassIdx(0);
      })
      .catch(() => toast.error("Failed to load your classes"))
      .finally(() => setLoadingClasses(false));
  }, []);

  // ── 2. Fetch subjects whenever the selected class changes ─────────────────
  const loadSubjects = useCallback(async (targetCls) => {
    if (!targetCls) return;
    const fetchId = ++subjectFetchRef.current;

    setLoadingSubjects(true);
    setSubjectError(false);
    setSubjects([]);
    setSubjectSource("");
    setSelSubject("");

    try {
      const { subjects: names, source } = await fetchSubjectsForClassFull(targetCls);

      if (fetchId !== subjectFetchRef.current) return; // stale — another fetch started

      setSubjects(names);
      setSubjectSource(source);

      if (names.length > 0) {
        setSelSubject(names[0]);
      } else {
        setSubjectError(true);
      }
    } catch {
      if (fetchId !== subjectFetchRef.current) return;
      setSubjectError(true);
      setSubjectSource("Failed to load");
    } finally {
      if (fetchId === subjectFetchRef.current) setLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    setEditingId(null);
    setSaved(false);
    setAlreadyMarked(false);
    setAttendance({});
    if (cls) loadSubjects(cls);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selClassIdx]);

  // ── 3. Load students when class changes ───────────────────────────────────
  useEffect(() => {
    if (!cls) return;
    setLoadingStudents(true);
    setStudentError(null);
    setStudents([]);

    getStudentsForClass(cls.grade, cls.section)
      .then((d) => {
        const list = d.data ?? d.students ?? [];
        if (list.length === 0) {
          // Fallback: hit /students directly with grade variants
          const rawGrade = parseRawGrade(cls.grade);
          return api.get("/students", {
            params: {
              classSection: `${rawGrade}-${cls.section}`,
              grade:        rawGrade,
              section:      cls.section,
              limit:        200,
              status:       "active",
            },
          }).then((res) => {
            const fb = res.data?.data ?? res.data?.students ?? [];
            setStudents(fb.map((s) => ({
              _id:                  s._id || s.id,
              name:                 s.name || `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
              rollNo:               s.rollNo || s.rollNumber || "—",
              attendancePercentage: s.attendanceSummary?.percentage ?? s.attendance ?? 100,
            })));
          });
        }
        setStudents(list);
      })
      .catch((err) => {
        console.error("getStudentsForClass failed:", err);
        setStudentError("Could not load students. Check the class assignment.");
        toast.error("Failed to load students");
      })
      .finally(() => {
        setAttendance({});
        setSaved(false);
        setEditingId(null);
        setLoadingStudents(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selClassIdx, cls?.grade, cls?.section]);

  // ── 4. Check today-status ─────────────────────────────────────────────────
  useEffect(() => {
    if (!cls) return;
    setAlreadyMarked(false);
    getTodayStatus({
      grade:   cls.grade,
      section: cls.section,
      subject: selSubject || undefined,
      date:    selDate,
    })
      .then((d) => { if (d.data?.marked) setAlreadyMarked(true); })
      .catch(() => {});
  }, [selClassIdx, selSubject, selDate, cls?.grade, cls?.section]);

  // ── 5. Load history ───────────────────────────────────────────────────────
  const loadHistory = useCallback(() => {
    if (!cls) return;
    setLoadingHistory(true);
    getTeacherHistory({
      grade:   cls.grade,
      section: cls.section,
      ...(historySubject ? { subject: historySubject } : {}),
    })
      .then((d) => setHistory(d.data ?? []))
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoadingHistory(false));
  }, [cls, historySubject]);

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab, loadHistory]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggle = useCallback((id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === status ? undefined : status,
    }));
    setSaved(false);
  }, []);

  const markAll  = (s) => { const n = {}; students.forEach((st) => { n[st._id] = s; }); setAttendance(n); setSaved(false); };
  const resetAll = ()  => { setAttendance({}); setSaved(false); };

  const retryLoadStudents = () => {
    if (!cls) return;
    setStudentError(null);
    setLoadingStudents(true);
    getStudentsForClass(cls.grade, cls.section)
      .then((d) => setStudents(d.data ?? d.students ?? []))
      .catch(() => setStudentError("Still failing. Check class setup."))
      .finally(() => setLoadingStudents(false));
  };

  const enterEditMode = async () => {
    try {
      const d = await getTodayStatus({
        grade:   cls.grade,
        section: cls.section,
        subject: selSubject || undefined,
        date:    selDate,
      });
      if (d.data?.record) {
        setEditingId(d.data.record._id);
        const map = {};
        d.data.record.records.forEach((r) => { map[r.studentId] = r.status; });
        setAttendance(map);
        toast.success("Edit mode — make your changes then save.");
      }
    } catch { toast.error("Could not load existing record."); }
  };

  const handleSave = async () => {
    if (!allMarked) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status:    attendance[s._id] || "absent",
      }));
      const payload = {
        grade:        cls.grade,
        section:      cls.section,
        date:         selDate,
        subject:      selSubject || undefined,
        records,
        academicYear: user.academicYear ||
          `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
      };
      if (editingId) {
        await editAttendance(editingId, { records, editReason: "Teacher correction" });
        toast.success("Attendance updated!");
      } else {
        await markAttendance(payload);
        toast.success("Attendance saved!");
        setAlreadyMarked(true);
      }
      setSaved(true);
      setEditingId(null);
      attendanceBus.emit({ grade: cls.grade, section: cls.section, date: selDate });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err.message?.includes("already marked")) {
        toast.error("Already marked. Click 'Edit' to correct it.");
        setAlreadyMarked(true);
      } else {
        toast.error(err.message || "Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const presentCount  = students.filter((s) => attendance[s._id] === "present").length;
  const absentCount   = students.filter((s) => attendance[s._id] === "absent").length;
  const lateCount     = students.filter((s) => attendance[s._id] === "late").length;
  const unmarkedCount = students.length - presentCount - absentCount - lateCount;
  const allMarked     = unmarkedCount === 0 && students.length > 0;
  const pct           = students.length ? Math.round(((presentCount + lateCount) / students.length) * 100) : 0;

  const visible = useMemo(() => {
    let list = students;
    const q = search.toLowerCase();
    if (q) list = list.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      String(s.rollNo).toLowerCase().includes(q)
    );
    if (filterStatus === "present")  list = list.filter((s) => attendance[s._id] === "present");
    if (filterStatus === "absent")   list = list.filter((s) => attendance[s._id] === "absent");
    if (filterStatus === "late")     list = list.filter((s) => attendance[s._id] === "late");
    if (filterStatus === "unmarked") list = list.filter((s) => !attendance[s._id]);
    return list;
  }, [students, search, filterStatus, attendance]);

  // ── Loading / empty guards ────────────────────────────────────────────────
  if (loadingClasses) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your classes…</p>
        </div>
      </div>
    );
  }

  if (!classes.length) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center text-gray-400">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No classes assigned yet</p>
          <p className="text-sm mt-1">Contact your school admin to assign classes.</p>
        </div>
      </div>
    );
  }

  // ── Subject panel (reusable in both tabs) ─────────────────────────────────
  const renderSubjectPanel = (onPick, currentPick) => (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <BookOpen size={11} className="text-gray-400" />
          Subject
          {subjects.length > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {subjects.length}
            </span>
          )}
          {loadingSubjects && (
            <RefreshCw size={10} className="animate-spin text-indigo-400 ml-1" />
          )}
        </label>

        {/* Source tag */}
        {!loadingSubjects && subjectSource && subjectSource !== "none" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {subjectSource.split(" + ").map((tag) => {
              const Icon = SOURCE_ICON[tag] ?? Database;
              return (
                <span key={tag}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  <Icon size={9} />
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Retry button when nothing found */}
        {!loadingSubjects && subjectError && (
          <button
            onClick={() => cls && loadSubjects(cls)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-800">
            <RefreshCw size={10} /> Retry
          </button>
        )}
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-2 min-h-[34px]">
        {/* "General" pill — always shown */}
        <SubjectPill
          subject=""
          selected={currentPick === ""}
          onClick={() => {
            onPick("");
            setEditingId(null);
            setSaved(false);
            setAlreadyMarked(false);
          }}
        />

        {loadingSubjects ? (
          // Skeleton shimmer pills
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-gray-100 animate-pulse"
              style={{ width: `${60 + i * 14}px` }} />
          ))
        ) : subjectError && subjects.length === 0 ? (
          // Empty-state — actionable message
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <AlertCircle size={12} className="flex-shrink-0" />
            <span>
              No subjects found for{" "}
              <strong>{cls?.displayName || `${cls?.grade}-${cls?.section}`}</strong>.
              {" "}Go to <strong>Manage Subjects</strong> and assign this class.
            </span>
          </div>
        ) : (
          subjects.map((s) => (
            <SubjectPill
              key={s}
              subject={s}
              selected={currentPick === s}
              onClick={(v) => {
                onPick(v);
                setEditingId(null);
                setSaved(false);
                setAlreadyMarked(false);
              }}
            />
          ))
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Attendance</h1>
              <p className="text-indigo-200 text-xs mt-0.5">
                {cls ? `${cls.displayName || `${cls.grade}-${cls.section}`}` : "Mark & manage class attendance"}
                {selSubject && <span className="text-indigo-300"> · {selSubject}</span>}
              </p>
            </div>
          </div>
          <div className="flex bg-white/15 rounded-xl p-1 gap-1 self-start sm:self-auto">
            {[["mark", ClipboardCheck, "Mark"], ["history", Eye, "History"]].map(([key, Icon, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === key ? "bg-white text-indigo-700 shadow" : "text-white hover:bg-white/10"
                }`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ MARK TAB ══════════════════════════════════════════════ */}
      {activeTab === "mark" && (
        <>
          {/* ── Filter card ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">

            {/* Row 1: Class + Date + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Sel label="Class" icon={Users} value={selClassIdx}
                onChange={(v) => setSelClassIdx(Number(v))}>
                {classes.map((c, i) => (
                  <option key={i} value={i}>
                    {c.displayName || `${c.grade}-${c.section}`}
                  </option>
                ))}
              </Sel>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  Date
                </label>
                <input type="date" value={selDate} max={today}
                  onChange={(e) => {
                    setSelDate(e.target.value);
                    setEditingId(null);
                    setSaved(false);
                    setAlreadyMarked(false);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white transition-colors" />
              </div>

              <div className="flex items-end">
                {alreadyMarked && !editingId ? (
                  <div className="w-full flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
                    <span className="font-semibold text-xs text-amber-700">Already marked</span>
                    <button onClick={enterEditMode}
                      className="ml-auto text-xs font-bold text-amber-700 underline underline-offset-2 whitespace-nowrap hover:text-amber-900">
                      Edit ›
                    </button>
                  </div>
                ) : editingId ? (
                  <div className="w-full flex items-center gap-2 px-3 py-2.5 bg-violet-50 border border-violet-200 rounded-lg">
                    <Edit3 size={14} className="text-violet-600 flex-shrink-0" />
                    <span className="font-semibold text-xs text-violet-700">Editing record</span>
                    <button onClick={() => { setEditingId(null); resetAll(); }}
                      className="ml-auto text-xs font-bold text-violet-600 underline underline-offset-2 hover:text-violet-900">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span className="text-xs text-emerald-700 font-medium">Ready to mark</span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Subject panel */}
            {renderSubjectPanel(setSelSubject, selSubject)}
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill icon={Users}     label="Total"    value={students.length}
              color="border-gray-200 text-gray-700 bg-white" />
            <StatPill icon={UserCheck} label="Present"  value={presentCount}
              sub={students.length ? `${Math.round((presentCount/students.length)*100)}%` : ""}
              color="border-emerald-200 text-emerald-700 bg-emerald-50" />
            <StatPill icon={UserX}     label="Absent"   value={absentCount}
              sub={students.length ? `${Math.round((absentCount/students.length)*100)}%` : ""}
              color="border-red-200 text-red-700 bg-red-50" />
            <StatPill icon={Clock}     label="Unmarked" value={unmarkedCount}
              color={unmarkedCount > 0 ? "border-amber-200 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-400 bg-gray-50"} />
          </div>

          {/* Progress bar */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
                <div className="flex items-center gap-2">
                  {!allMarked && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle size={11} /> {unmarkedCount} unmarked
                    </span>
                  )}
                  <span className={`text-2xl font-bold ${pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  pct >= 75
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-red-500 to-orange-400"
                }`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {/* Student error */}
          {studentError && !loadingStudents && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{studentError}</span>
              <button onClick={retryLoadStudents} className="ml-auto text-xs underline font-semibold">
                Retry
              </button>
            </div>
          )}

          {/* Search + filter + bulk actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search name or roll number…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <XCircle size={14} />
                </button>
              )}
            </div>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden text-xs font-semibold flex-shrink-0 shadow-sm">
              {[
                ["all",      "All",  null],
                ["present",  "✓",    "emerald"],
                ["absent",   "✗",    "red"],
                ["late",     "⏱",    "amber"],
                ["unmarked", "?",    "gray"],
              ].map(([val, lbl, c]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  className={`px-3 py-2.5 transition-colors border-r border-gray-100 last:border-r-0 ${
                    filterStatus === val
                      ? c === "emerald" ? "bg-emerald-600 text-white"
                        : c === "red"   ? "bg-red-500 text-white"
                        : c === "amber" ? "bg-amber-500 text-white"
                        : c === "gray"  ? "bg-gray-500 text-white"
                        : "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk actions + save */}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => markAll("present")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors">
              <CheckSquare size={14} /> All Present
            </button>
            <button onClick={() => markAll("absent")}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 shadow-sm transition-colors">
              <Square size={14} /> All Absent
            </button>
            <button onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
              <RotateCcw size={14} /> Reset
            </button>
            <div className="ml-auto">
              <button onClick={handleSave}
                disabled={!allMarked || saving || (alreadyMarked && !editingId)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
                  saved ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : allMarked && !saving && !(alreadyMarked && !editingId)
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-md"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}>
                {saving
                  ? <><Clock size={14} className="animate-spin" /> Saving…</>
                  : saved
                  ? <><CheckCircle size={14} /> Saved!</>
                  : <><Save size={14} />{editingId ? "Update" : "Save Attendance"}</>}
              </button>
            </div>
          </div>

          {/* Student list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} className="text-indigo-600" />
                <span className="font-bold text-gray-800 text-sm">
                  {cls ? `${cls.grade}-${cls.section}` : "—"}
                </span>
                {selSubject
                  ? <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold">{selSubject}</span>
                  : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs font-medium">General</span>}
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {loadingStudents ? "Loading…" : `${visible.length} / ${students.length}`}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {loadingStudents ? (
                <div className="space-y-2 py-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse border border-gray-100" />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Users size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {students.length === 0
                      ? "No active students found in this class."
                      : "No students match the current filter."}
                  </p>
                  {students.length === 0 && (
                    <p className="text-xs mt-1 text-gray-400">
                      Make sure students are enrolled and linked to{" "}
                      {cls?.grade}-{cls?.section}.
                    </p>
                  )}
                </div>
              ) : (
                visible.map((student) => (
                  <StudentRow key={student._id} student={student}
                    status={attendance[student._id]} onToggle={handleToggle} />
                ))
              )}
            </div>
          </div>

          {/* Present / Absent summary */}
          {(presentCount > 0 || absentCount > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-emerald-600 flex items-center gap-2">
                  <UserCheck size={15} className="text-white" />
                  <span className="font-bold text-white text-sm">Present ({presentCount})</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {students.filter((s) => attendance[s._id] === "present").map((s) => (
                    <div key={s._id} className="flex items-center gap-2 text-sm text-emerald-800">
                      <div className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${avatarColor(s._id)}`}>
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium truncate">{s.name}</span>
                      <span className="text-emerald-500 text-xs ml-auto flex-shrink-0">{s.rollNo}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-red-500 flex items-center gap-2">
                  <UserX size={15} className="text-white" />
                  <span className="font-bold text-white text-sm">Absent ({absentCount})</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {students.filter((s) => attendance[s._id] === "absent").map((s) => (
                    <div key={s._id} className="flex items-center gap-2 text-sm text-red-800">
                      <div className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${avatarColor(s._id)}`}>
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium truncate">{s.name}</span>
                      <span className="text-red-400 text-xs ml-auto flex-shrink-0">{s.rollNo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ HISTORY TAB ═════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Sel label="Class" icon={Users} value={selClassIdx}
                onChange={(v) => setSelClassIdx(Number(v))}>
                {classes.map((c, i) => (
                  <option key={i} value={i}>{c.displayName || `${c.grade}-${c.section}`}</option>
                ))}
              </Sel>

              {/* Subject filter for history — reuses the same subjects[] state */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={11} className="text-gray-400" />
                  Filter by Subject
                  {loadingSubjects && <RefreshCw size={10} className="animate-spin text-indigo-400 ml-1" />}
                </label>
                <div className="relative">
                  <select value={historySubject} onChange={(e) => setHistorySubject(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white appearance-none">
                    <option value="">All Subjects</option>
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-end">
                <button onClick={loadHistory}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                  <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
                  Load History
                </button>
              </div>
            </div>

            {/* Subject pills in history tab too */}
            {renderSubjectPanel((v) => setHistorySubject(v), historySubject)}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              <span className="font-bold text-gray-800">Past Records</span>
              {history.length > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold ml-1">
                  {history.length}
                </span>
              )}
              {loadingHistory && <RefreshCw size={14} className="text-gray-400 animate-spin ml-2" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {["Date","Class","Subject","Present","Absent","Late","Rate","Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.length === 0 && !loadingHistory && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        <BarChart3 size={28} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No records found</p>
                      </td>
                    </tr>
                  )}
                  {history.map((rec) => {
                    const present = rec.records?.filter((r) => r.status === "present").length ?? 0;
                    const absent  = rec.records?.filter((r) => r.status === "absent").length  ?? 0;
                    const late    = rec.records?.filter((r) => r.status === "late").length    ?? 0;
                    const total   = rec.records?.length ?? 0;
                    const rate    = total ? Math.round(((present + late) / total) * 100) : 0;
                    return (
                      <tr key={rec._id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                          {new Date(rec.date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 font-medium">
                          {rec.grade}-{rec.section}
                        </td>
                        <td className="px-4 py-3.5">
                          {rec.subject
                            ? <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold">{rec.subject}</span>
                            : <span className="text-gray-400 italic text-xs">General</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-xs">
                            <CheckCircle size={10} />{present}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-lg font-semibold text-xs">
                            <XCircle size={10} />{absent}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs">
                            <Clock size={10} />{late}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${rate >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                                style={{ width: `${rate}%` }} />
                            </div>
                            <span className={`text-xs font-bold tabular-nums ${rate >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => {
                            setEditingId(rec._id);
                            const map = {};
                            rec.records.forEach((r) => { map[r.studentId] = r.status; });
                            setAttendance(map);
                            setActiveTab("mark");
                            const idx = classes.findIndex((c) => c.grade === rec.grade && c.section === rec.section);
                            if (idx >= 0) setSelClassIdx(idx);
                            setSelSubject(rec.subject || "");
                            setSelDate(new Date(rec.date).toISOString().split("T")[0]);
                          }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                            <Edit3 size={11} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}