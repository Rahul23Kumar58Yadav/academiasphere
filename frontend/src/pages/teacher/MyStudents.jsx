// src/pages/teacher/MyStudents.jsx
// Dynamic version — pulls real data from the backend APIs already in the codebase.
//
// FIXES (v2):
// ────────────────────────────────────────────────────────────────────────────
//
// 1. PERFORMANCE ALWAYS 0%
//    ROOT CAUSE: The student document returned by /attendance/teacher/students
//    (getStudentsForClass) only selects:
//      .select("_id firstName lastName rollNo attendanceSummary")
//    There is NO performancePercentage / performance field on Student docs.
//    Results live in a separate Results collection.
//
//    FIX: After loading the student list, fetch /results/student/:id for each
//    student in parallel (Promise.allSettled). Extract the latest exam's
//    percentage from examSummaries[last].pct, which mirrors how ChildPerformance
//    works and is confirmed reliable.
//
//    The batch is capped at 10 parallel requests (Promise.allSettled doesn't
//    throttle itself). For large classes we chunk to avoid overwhelming the
//    server.
//
// 2. ROLL NUMBER SHOWING "10" (the grade) INSTEAD OF ACTUAL ROLL NO
//    ROOT CAUSE: s.rollNumber was set but the backend field is s.rollNo.
//    When rollNo is undefined, the student.rollNumber fell through to "" and
//    the class display showed the raw grade string "10".
//    FIX: Use s.rollNo ?? s.rollNumber ?? "" and never fall back to grade.
//
// 3. ATTENDANCE: now uses /attendance/admin/summary (live aggregation) as
//    primary source — same fix as TeacherDashboard v3. Falls back to
//    attendanceSummary.percentage from the student doc.
//
// 4. PERFORMANCE FETCH STRATEGY (per student):
//    A) /results/student/:id → examSummaries[last].pct  (most reliable, mirrors ChildPerformance)
//    B) /results/student/:id → compute from data map    (raw score/max objects)
//    C) 0 (no results recorded yet — shown as "—" not "0%")

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, Filter, Download, RefreshCw, BarChart3,
  TrendingUp, TrendingDown, Mail, Phone, AlertCircle,
  CheckCircle, Clock, UserPlus, X, ChevronDown, Eye,
  BookOpen, Calendar, Award, Layers, Zap, AlertTriangle,
  ArrowUpRight, GraduationCap, Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { getTeacherClasses, getStudentsForClass } from "../../services/attendanceApi";
import { assignmentAPI } from "../../services/assignment";

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const perfBand = (p) => {
  if (p == null || p === 0) return { label: "No data", cls: "text-slate-500 bg-slate-50 border-slate-200" };
  if (p >= 85) return { label: "Excellent", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (p >= 70) return { label: "Good",      cls: "text-sky-700 bg-sky-50 border-sky-200" };
  if (p >= 60) return { label: "Average",   cls: "text-amber-700 bg-amber-50 border-amber-200" };
  return              { label: "Poor",      cls: "text-rose-700 bg-rose-50 border-rose-200" };
};

const attColor = (a) => {
  if (!a) return "text-slate-400";
  if (a >= 90) return "text-emerald-600";
  if (a >= 75) return "text-amber-600";
  return "text-rose-600";
};

const statusMeta = (status) => ({
  active:           { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "needs-attention":{ label: "Watch",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  critical:         { label: "Critical", cls: "bg-rose-50 text-rose-700 border-rose-200" },
}[status] || { label: "—", cls: "bg-gray-100 text-gray-600 border-gray-200" });

const derivedStatus = (attendance, performance, pending) => {
  // performance === null means no results yet — do NOT penalise
  const hasPerf = performance != null && performance > 0;
  if ((attendance > 0 && attendance < 75) || (hasPerf && performance < 55) || pending > 6) return "critical";
  if ((attendance > 0 && attendance < 85) || (hasPerf && performance < 68) || pending > 3) return "needs-attention";
  return "active";
};

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  ["#e0e7ff","#4338ca"],["#dcfce7","#15803d"],["#fef3c7","#b45309"],
  ["#fce7f3","#9d174d"],["#ecfdf5","#065f46"],["#ede9fe","#6d28d9"],
  ["#fee2e2","#991b1b"],["#e0f2fe","#0369a1"],
];

// ── Parse raw grade (mirrors backend parseRawGrade) ───────────────────────────
function parseRawGrade(grade) {
  return (grade || "").trim().replace(/^(grade|class)\s+/i, "").trim();
}

// ── Chunk array for batched parallel requests ─────────────────────────────────
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchStudentPerformance
//
// Fetches the latest exam percentage for a single student from the Results
// collection via /results/student/:id.
//
// This is the same endpoint ChildPerformance.jsx uses and is confirmed reliable.
// Returns a number (0-100) or null if no results exist yet.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchStudentPerformance(authFetch, studentId) {
  try {
    const r = await authFetch(`/results/student/${studentId}`);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.success) return null;

    // Strategy A: examSummaries array — most reliable shape
    // Shape: { examSummaries: [{ examName, pct, total, maxTotal }] }
    const summaries = j.examSummaries ?? j.data?.examSummaries ?? [];
    if (summaries.length > 0) {
      const latest = summaries[summaries.length - 1];
      if (latest.pct != null) return Math.round(latest.pct);
    }

    // Strategy B: raw data map — { data: { [examName]: { [subject]: { score, max } } } }
    const dataMap = j.data?.data ?? j.data ?? null;
    if (dataMap && typeof dataMap === "object" && !Array.isArray(dataMap)) {
      const examKeys = Object.keys(dataMap);
      if (examKeys.length > 0) {
        const latestExam = dataMap[examKeys[examKeys.length - 1]];
        const subjectEntries = Object.values(latestExam ?? {});
        const pcts = subjectEntries
          .map(s => (s.score != null && s.max) ? Math.round((s.score / s.max) * 100) : null)
          .filter(p => p != null);
        if (pcts.length > 0) {
          return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
        }
      }
    }

    return null; // no results recorded yet
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchClassAttendanceMap
//
// Uses /attendance/admin/summary (live aggregation, authorized for TEACHER)
// to get per-student attendance percentages. Falls back to the denormalized
// attendanceSummary.percentage on each student doc.
//
// Returns: Map<studentId(string), percentage(number)>
// ─────────────────────────────────────────────────────────────────────────────
async function fetchClassAttendanceMap(authFetch, cls) {
  const rawGrade = parseRawGrade(cls.grade);
  const section  = cls.section;
  const gradesToTry = [...new Set([cls.grade, rawGrade, `Grade ${rawGrade}`, `Class ${rawGrade}`])].filter(Boolean);

  for (const g of gradesToTry) {
    try {
      const r = await authFetch(
        `/attendance/admin/summary?grade=${encodeURIComponent(g)}&section=${encodeURIComponent(section)}`
      );
      if (!r.ok) continue;
      const j = await r.json();
      const students = j.data?.students ?? [];
      if (!students.length) continue;

      const map = new Map();
      students.forEach(s => {
        const key = String(s.studentId ?? s._id ?? "");
        if (key) map.set(key, s.percentage ?? 0);
      });

      console.debug(`[MyStudents] admin/summary attendance OK (grade="${g}"):`, map.size, "students");
      return map;
    } catch (e) {
      console.warn(`[MyStudents] admin/summary failed (grade="${g}"):`, e.message);
    }
  }

  return new Map(); // fallback: empty → will use student doc's attendanceSummary
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
const Spark = ({ value, max = 100, color = "#6366f1" }) => {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="relative h-1.5 rounded-full bg-black/5 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 44, idx = 0 }) => {
  const [bg, fg] = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 select-none"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.32 }}
    >
      {initials(name) || "?"}
    </div>
  );
};

// ── Stat pill ─────────────────────────────────────────────────────────────────
const Pill = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 border border-white/20"
    style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`, borderColor: `${accent}30` }}>
    <div className="flex items-center justify-between">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
        <Icon size={17} style={{ color: accent }} />
      </div>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${accent}15`, color: accent }}>
        {sub}
      </span>
    </div>
    <div>
      <p className="text-3xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </div>
  </div>
);

// ── Student Card (grid) ───────────────────────────────────────────────────────
const StudentCard = ({ student, idx, onView }) => {
  const sm = statusMeta(student.status);
  const pb = perfBand(student.performance);

  // Show "—" when no results yet; show actual % when available
  const perfDisplay  = student.performance != null ? `${student.performance}%` : "—";
  const perfHasData  = student.performance != null && student.performance > 0;

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent strip */}
      <div className="h-1 w-full" style={{
        background: student.status === "critical"
          ? "linear-gradient(90deg,#f43f5e,#fb923c)"
          : student.status === "needs-attention"
          ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
          : "linear-gradient(90deg,#6366f1,#8b5cf6)"
      }} />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <Avatar name={student.name} size={48} idx={idx} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 truncate text-sm">{student.name}</p>
            {/* FIX: show rollNo — never the grade string */}
            <p className="text-xs text-slate-400 font-mono">
              {student.rollNumber ? `Roll #${student.rollNumber}` : "—"}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <GraduationCap size={11} className="text-indigo-400" />
              <span className="text-xs text-indigo-600 font-semibold">{student.class}</span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.cls} whitespace-nowrap`}>
            {sm.label}
          </span>
        </div>

        {/* Performance + Attendance */}
        <div className="grid grid-cols-2 gap-3">
          {/* Performance */}
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Performance</span>
              {perfHasData && (
                <div className="flex items-center gap-0.5">
                  {student.trend === "up"
                    ? <TrendingUp size={11} className="text-emerald-500" />
                    : <TrendingDown size={11} className="text-rose-500" />}
                </div>
              )}
            </div>
            {student.loadingPerf ? (
              <div className="h-6 bg-slate-200 rounded animate-pulse w-2/3" />
            ) : (
              <>
                <p className={`text-xl font-black ${perfHasData ? "text-slate-800" : "text-slate-300"}`}>
                  {perfDisplay}
                </p>
                {perfHasData
                  ? <Spark value={student.performance} color="#6366f1" />
                  : <p className="text-[10px] text-slate-400 mt-1">No results yet</p>
                }
              </>
            )}
          </div>

          {/* Attendance */}
          <div className="bg-slate-50 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold block mb-2">Attendance</span>
            {student.attendance > 0 ? (
              <>
                <p className={`text-xl font-black ${attColor(student.attendance)}`}>{student.attendance}%</p>
                <Spark value={student.attendance}
                  color={student.attendance >= 90 ? "#10b981" : student.attendance >= 75 ? "#f59e0b" : "#f43f5e"} />
              </>
            ) : (
              <>
                <p className="text-xl font-black text-slate-300">—</p>
                <p className="text-[10px] text-slate-400 mt-1">No records yet</p>
              </>
            )}
          </div>
        </div>

        {/* Assignments */}
        <div className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-semibold">Pending</p>
            <p className="text-lg font-black text-orange-600">{student.pendingAssignments}</p>
          </div>
          <div className="w-px h-6 bg-orange-200" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-semibold">Done</p>
            <p className="text-lg font-black text-emerald-600">{student.completedAssignments}</p>
          </div>
          <div className="w-px h-6 bg-orange-200" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-semibold">Rate</p>
            <p className="text-lg font-black text-slate-700">
              {student.completedAssignments + student.pendingAssignments > 0
                ? Math.round((student.completedAssignments / (student.completedAssignments + student.pendingAssignments)) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1">
          {student.email && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Mail size={11} className="flex-shrink-0" />
              <span className="truncate">{student.email}</span>
            </div>
          )}
          {student.parentName && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Phone size={11} className="flex-shrink-0" />
              <span className="truncate">Parent: {student.parentName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={() => onView(student.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          <BarChart3 size={15} />
          View Insights
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ── Table Row ─────────────────────────────────────────────────────────────────
const TableRow = ({ student, idx, onView }) => {
  const sm = statusMeta(student.status);
  const pb = perfBand(student.performance);

  return (
    <tr className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-100 last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size={36} idx={idx} />
          <div>
            <p className="text-sm font-bold text-slate-800">{student.name}</p>
            {/* FIX: display actual roll number */}
            <p className="text-xs text-slate-400 font-mono">
              {student.rollNumber ? `Roll #${student.rollNumber}` : "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{student.class}</span>
      </td>
      <td className="px-5 py-3.5">
        {student.loadingPerf ? (
          <div className="h-5 bg-slate-200 rounded animate-pulse w-12" />
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${pb.cls}`}>
              {student.performance != null ? `${student.performance}%` : "—"}
            </span>
            {student.performance != null && student.performance > 0 && (
              student.trend === "up"
                ? <TrendingUp size={13} className="text-emerald-500" />
                : <TrendingDown size={13} className="text-rose-500" />
            )}
          </div>
        )}
      </td>
      <td className="px-5 py-3.5">
        <span className={`text-sm font-bold ${attColor(student.attendance)}`}>
          {student.attendance > 0 ? `${student.attendance}%` : "—"}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="font-bold text-orange-600">{student.pendingAssignments}</span>
          <span className="text-slate-400">pending /</span>
          <span className="font-bold text-emerald-600">{student.completedAssignments}</span>
          <span className="text-slate-400">done</span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${sm.cls}`}>{sm.label}</span>
      </td>
      <td className="px-5 py-3.5">
        <button
          onClick={() => onView(student.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          <Eye size={13} /> View
        </button>
      </td>
    </tr>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const MyStudents = () => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [students,      setStudents]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);

  const [myClasses,     setMyClasses]     = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const [searchTerm,    setSearchTerm]    = useState("");
  const [filterPerf,    setFilterPerf]    = useState("all");
  const [filterAtt,     setFilterAtt]     = useState("all");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [showFilters,   setShowFilters]   = useState(false);
  const [viewMode,      setViewMode]      = useState("grid");

  // ── Safe array extractor ───────────────────────────────────────────────────
  const safeArray = (res, ...keys) => {
    const body = res?.data ?? res ?? {};
    for (const k of keys) {
      if (Array.isArray(body[k]))        return body[k];
      if (Array.isArray(body?.data?.[k])) return body.data[k];
    }
    if (Array.isArray(body))        return body;
    if (Array.isArray(body?.data))  return body.data;
    return [];
  };

  // ── 1. Load teacher's classes ──────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      const res  = await getTeacherClasses();
      const list = safeArray(res, "data", "classes");
      setMyClasses(list);
      if (list.length && !selectedClass) setSelectedClass(list[0]);
    } catch (e) {
      setError("Could not load your classes. " + (e.message || ""));
    }
  }, []); // eslint-disable-line

  // ── 2. Load students + enrich with attendance + performance ────────────────
  const loadStudents = useCallback(async (cls, isRefresh = false) => {
    if (!cls) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      // ── a) Student list ──────────────────────────────────────────────────
      const stuRes      = await getStudentsForClass(cls.grade, cls.section);
      const rawStudents = safeArray(stuRes, "data", "students");

      if (!rawStudents.length) {
        setStudents([]);
        return;
      }

      // ── b) Attendance map (live aggregation from Attendance collection) ──
      // Returns Map<studentId, percentage>.
      // Falls back to student doc's attendanceSummary.percentage inside the
      // merge step below if the map is empty.
      const attendanceMap = await fetchClassAttendanceMap(authFetch, cls);

      // ── c) Assignment submissions (best-effort) ──────────────────────────
      const subMap = {};
      try {
        const aRes = await assignmentAPI.getAllSubmissions();
        const raw  = aRes?.data;
        const list =
          Array.isArray(raw)             ? raw       :
          Array.isArray(raw?.data)       ? raw.data  :
          Array.isArray(raw?.data?.data) ? raw.data.data :
          [];
        list.forEach(sub => {
          const sid =
            (typeof sub.studentId === "object"
              ? sub.studentId?._id?.toString()
              : sub.studentId?.toString()) ?? "";
          if (!sid) return;
          if (!subMap[sid]) subMap[sid] = { pending: 0, completed: 0 };
          if (sub.status === "submitted" || sub.status === "graded") subMap[sid].completed++;
          else subMap[sid].pending++;
        });
      } catch { /* non-critical */ }

      // ── d) Build initial student list (performance = null = loading) ─────
      const initialStudents = rawStudents.map((s, idx) => {
        const sid = String(s._id ?? "");
        const att = attendanceMap.get(sid)
                 ?? (s.attendancePercentage != null ? s.attendancePercentage : (s.attendanceSummary?.percentage ?? 0));
        const pending = subMap[sid]?.pending    ?? 0;
        const done    = subMap[sid]?.completed  ?? 0;

        return {
          id:                   sid,
          // FIX: use rollNo (backend field) — never fall through to grade
          name:                 s.name ?? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
          rollNumber:           s.rollNo ?? s.rollNumber ?? "",
          class:                cls.displayName || `${cls.grade}-${cls.section}`,
          grade:                cls.grade,
          section:              cls.section,
          email:                s.email        || "",
          parentName:           s.parentName   || s.guardians?.[0]?.name  || "",
          parentPhone:          s.parentPhone  || s.guardians?.[0]?.phone || "",
          attendance:           att,
          performance:          null,   // filled in after per-student fetch
          loadingPerf:          true,   // show skeleton until fetch completes
          trend:                "up",
          pendingAssignments:   pending,
          completedAssignments: done,
          status:               derivedStatus(att, null, pending),
        };
      });

      // Render immediately with attendance data; performance comes in shortly
      setStudents(initialStudents);

      // ── e) Fetch per-student performance in parallel (chunked) ──────────
      //
      // /results/student/:id is the same endpoint ChildPerformance uses.
      // We fetch all students at once via Promise.allSettled (no failure
      // propagation). Chunked to 8 parallel requests to be polite to the server.
      //
      // After each chunk resolves we update the students state in one batch
      // so the UI fills in progressively (no jarring re-render per student).

      const studentIds = initialStudents.map(s => s.id).filter(Boolean);
      const chunks     = chunk(studentIds, 8);

      // Build a performance map from all chunks
      const perfMap = new Map();

      for (const batch of chunks) {
        const results = await Promise.allSettled(
          batch.map(async sid => {
            const pct = await fetchStudentPerformance(authFetch, sid);
            return { sid, pct };
          })
        );
        results.forEach(r => {
          if (r.status === "fulfilled") {
            perfMap.set(r.value.sid, r.value.pct); // null = no results, number = actual %
          }
        });
      }

      // ── f) Merge performance into students and compute final status ──────
      setStudents(prev =>
        prev.map(s => {
          const perf = perfMap.has(s.id) ? perfMap.get(s.id) : null;
          return {
            ...s,
            performance:  perf,
            loadingPerf:  false,
            trend:        (perf != null && perf >= 70) || s.attendance >= 85 ? "up" : "down",
            status:       derivedStatus(s.attendance, perf, s.pendingAssignments),
          };
        })
      );

      console.info(`[MyStudents] Loaded ${initialStudents.length} students for ${cls.displayName}`, {
        withAttendance: [...attendanceMap.values()].filter(v => v > 0).length,
        withResults:    [...perfMap.values()].filter(v => v != null).length,
      });

    } catch (e) {
      setError("Failed to load students: " + (e.message || ""));
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { if (selectedClass) loadStudents(selectedClass); }, [selectedClass, loadStudents]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...students];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      r = r.filter(s =>
        s.name.toLowerCase().includes(q) ||
        String(s.rollNumber).toLowerCase().includes(q)
      );
    }
    if (filterPerf !== "all") {
      r = r.filter(s => {
        const p = s.performance;
        if (filterPerf === "excellent") return p != null && p >= 85;
        if (filterPerf === "good")      return p != null && p >= 70 && p < 85;
        if (filterPerf === "average")   return p != null && p >= 60 && p < 70;
        if (filterPerf === "poor")      return p != null && p < 60;
        if (filterPerf === "no-data")   return p == null || p === 0;
        return true;
      });
    }
    if (filterAtt !== "all") {
      r = r.filter(s => {
        if (filterAtt === "above-90") return s.attendance >= 90;
        if (filterAtt === "75-90")    return s.attendance >= 75 && s.attendance < 90;
        if (filterAtt === "below-75") return s.attendance > 0 && s.attendance < 75;
        return true;
      });
    }
    if (filterStatus !== "all") r = r.filter(s => s.status === filterStatus);
    return r;
  }, [students, searchTerm, filterPerf, filterAtt, filterStatus]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    students.length,
    active:   students.filter(s => s.status === "active").length,
    watch:    students.filter(s => s.status === "needs-attention").length,
    critical: students.filter(s => s.status === "critical").length,
  }), [students]);

  const activeFilters = [filterPerf, filterAtt, filterStatus].filter(v => v !== "all").length;

  const handleRefresh = async () => {
    if (selectedClass) await loadStudents(selectedClass, true);
    toast.success("Refreshed!");
  };

  const handleExport = () => {
    if (!filtered.length) { toast.error("Nothing to export"); return; }
    const rows = [
      ["Name","Roll No","Class","Performance","Attendance","Pending","Done","Status"],
      ...filtered.map(s => [
        s.name, s.rollNumber, s.class,
        s.performance != null ? s.performance : "—",
        s.attendance > 0 ? s.attendance : "—",
        s.pendingAssignments, s.completedAssignments, s.status,
      ]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `students_${selectedClass?.grade ?? "all"}_${selectedClass?.section ?? ""}.csv`,
    }).click();
    toast.success("Exported!");
  };

  const viewInsights = (id) => navigate(`/teacher/students/${id}/insights`);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .my-students * { font-family: 'Sora', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
        .card-in { animation: fadeSlide 0.35s ease both; }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(244,63,94,0.3); }
          50%      { box-shadow: 0 0 0 6px rgba(244,63,94,0); }
        }
        .pulse-red { animation: pulse-ring 2s infinite; }
      `}</style>

      <div className="my-students max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Students</h1>
            <p className="text-sm text-slate-500 mt-1">
              {selectedClass
                ? `${selectedClass.displayName || selectedClass.grade + "-" + selectedClass.section} · ${students.length} enrolled`
                : "Select a class to view students"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50">
              <RefreshCw size={15} className={refreshing ? "animate-spin text-indigo-500" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all">
              <Download size={15} /> Export CSV
            </button>
            <button onClick={() => navigate("/teacher/students/new")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <UserPlus size={15} /> Add Student
            </button>
          </div>
        </div>

        {/* ── Class Selector tabs ────────────────────────────────────────── */}
        {myClasses.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {myClasses.map((cls, i) => {
              const label    = cls.displayName || `${cls.grade}-${cls.section}`;
              const isActive = selectedClass?.grade === cls.grade && selectedClass?.section === cls.section;
              return (
                <button key={i} onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold border transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}>
                  <GraduationCap size={13} className="inline mr-1.5 mb-0.5" />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Stat Pills ────────────────────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Pill icon={Users}         label="Total Enrolled"    value={stats.total}    accent="#6366f1" sub="All" />
            <Pill icon={CheckCircle}   label="Active & On Track" value={stats.active}   accent="#10b981" sub="Good" />
            <Pill icon={AlertCircle}   label="Needs Attention"   value={stats.watch}    accent="#f59e0b" sub="Watch" />
            <Pill icon={AlertTriangle} label="Critical Cases"    value={stats.critical} accent="#f43f5e" sub="Urgent" />
          </div>
        )}

        {/* ── Error banner ───────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* ── Search / Filter bar ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-56">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or roll number…"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                showFilters ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
              }`}>
              <Filter size={14} />
              Filters
              {activeFilters > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${showFilters ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"}`}>
                  {activeFilters}
                </span>
              )}
            </button>

            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {["grid","table"].map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    viewMode === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {v}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-medium ml-auto hidden sm:block">
              {filtered.length} / {students.length} students
            </span>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
              {[
                { label: "Performance", value: filterPerf, set: setFilterPerf, options: [
                  ["all","All Performance"],["excellent","Excellent ≥85%"],["good","Good 70–84%"],["average","Average 60–69%"],["poor","Poor <60%"],["no-data","No Results Yet"]
                ]},
                { label: "Attendance", value: filterAtt, set: setFilterAtt, options: [
                  ["all","All Attendance"],["above-90","Above 90%"],["75-90","75–90%"],["below-75","Below 75%"]
                ]},
                { label: "Status", value: filterStatus, set: setFilterStatus, options: [
                  ["all","All Status"],["active","Active"],["needs-attention","Needs Attention"],["critical","Critical"]
                ]},
              ].map(({ label, value, set, options }) => (
                <div key={label} className="relative">
                  <select value={value} onChange={e => set(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white appearance-none focus:outline-none focus:border-indigo-400 cursor-pointer">
                    {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ))}
              {activeFilters > 0 && (
                <button onClick={() => { setFilterPerf("all"); setFilterAtt("all"); setFilterStatus("all"); }}
                  className="text-xs text-rose-600 font-bold hover:underline px-2">
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                    <div className="h-2 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 bg-slate-100 rounded-xl" />
                  <div className="h-20 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl" />
                <div className="h-9 bg-slate-200 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : !selectedClass ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 text-center">
            <GraduationCap size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-400 text-lg">No class selected</p>
            <p className="text-sm text-slate-300 mt-1">Your classes will appear above once loaded</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center shadow-sm">
            <Users size={44} className="mx-auto mb-4 text-slate-200" />
            <p className="font-bold text-slate-500 text-lg">No students match your filters</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter criteria</p>
            <button onClick={() => { setSearchTerm(""); setFilterPerf("all"); setFilterAtt("all"); setFilterStatus("all"); }}
              className="mt-4 text-sm text-indigo-600 font-bold hover:underline">
              Clear all filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s, i) => (
              <div key={s.id} className="card-in" style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}>
                <StudentCard student={s} idx={i} onView={viewInsights} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Student","Class","Performance","Attendance","Assignments","Status",""].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <TableRow key={s.id} student={s} idx={i} onView={viewInsights} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
              Showing {filtered.length} of {students.length} students
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyStudents;