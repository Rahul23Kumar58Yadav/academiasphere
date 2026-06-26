// src/pages/teacher/TeacherDashboard.jsx
// Fully dynamic — correct data fetching from backend APIs.
//
// FIXES applied (v3):
//
//  ATTENDANCE ROOT CAUSE (why v2 still showed 0%):
//  ─────────────────────────────────────────────────
//  Strategy A in v2 used /attendance/teacher/students which returns
//  `attendanceSummary.percentage` — a DENORMALIZED field on the Student
//  document. This field is only refreshed as a background side-effect
//  inside _updateStudentSummaries() after markAttendance / editAttendance.
//  If that background update hasn't run yet (new school, first-time teacher,
//  or the update failed silently), the field is 0 for every student → 0%.
//
//  THE CORRECT PRIMARY SOURCE is /attendance/admin/summary which runs a
//  LIVE aggregation directly against the Attendance collection — the same
//  logic the backend's getAdminSummary() uses. This route is authorized for
//  both SCHOOL_ADMIN and TEACHER (see attendanceRoutes.js line:
//    router.get("/admin/summary", authorize("SCHOOL_ADMIN", "TEACHER"), ...)
//  ).
//
//  NEW strategy order for attendance (fetchClassAttendance):
//  ──────────────────────────────────────────────────────────
//   Strategy A (PRIMARY):
//     GET /attendance/admin/summary?grade=&section=&month=&year=
//     → live aggregation, returns data.students[].percentage
//     Tried with BOTH the original grade string ("Grade 9") AND rawGrade ("9")
//     because the Attendance collection stores whichever format markAttendance
//     received — both must be tried.
//
//   Strategy B (FALLBACK 1):
//     GET /attendance/teacher/students?grade=&section=
//     → reads attendanceSummary.percentage from Student doc (stale but better
//     than nothing). Tried with original grade + rawGrade variants.
//
//   Strategy C (FALLBACK 2):
//     GET /students?grade=&section= — just get student count, att stays 0
//
//  RESULTS (unchanged from v2 — working):
//  ────────────────────────────────────────
//   Strategy A: /results/status/:cs → /results/analytics/:cs/:exam
//               tried with "9-A", "Grade 9-A", "Class 9-A"
//   Strategy B: /results/class/:cs
//   Strategy C: /results/student/:studentId (sample, mirrors ChildPerformance)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, ClipboardCheck, BookOpen, Calendar, TrendingUp,
  TrendingDown, Clock, BarChart3, Bell, RefreshCw,
  AlertCircle, ArrowRight, Award, Activity,
  CheckCircle, Timer, MapPin, ChevronRight,
  Zap, School, Sparkles, GraduationCap, Target,
  BookMarked, Flame, Star,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSchoolEvents } from "../../hooks/useSchoolEvents";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const statusMeta = {
  completed: { bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400",   label: "Done"    },
  ongoing:   { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    label: "Live"    },
  upcoming:  { bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  label: "Next"    },
};

const EVENT_CAT = {
  exam:     { bg: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-700",    icon: "📝", dot: "bg-rose-400"    },
  holiday:  { bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-700", icon: "🌴", dot: "bg-emerald-400" },
  meeting:  { bg: "bg-purple-50",  border: "border-purple-200", text: "text-purple-700",  icon: "👥", dot: "bg-purple-400"  },
  sports:   { bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-700",  icon: "🏆", dot: "bg-orange-400"  },
  academic: { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-700",    icon: "📚", dot: "bg-blue-400"    },
  event:    { bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-700",  icon: "🎯", dot: "bg-indigo-400"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip "Grade " / "Class " prefix so queries against the students collection
 * match the raw grade values stored there.
 * "Grade 9" → "9", "Class 10" → "10", "9" → "9"
 */
function parseRawGrade(grade) {
  return (grade || "").trim().replace(/^(grade|class)\s+/i, "").trim();
}

/**
 * Build all classSection variants to try against results endpoints.
 * Results may be stored with or without the "Grade " prefix.
 */
function classSectionVariants(rawGrade, section) {
  const variants = new Set([
    `${rawGrade}-${section}`,
    `Grade ${rawGrade}-${section}`,
    `Class ${rawGrade}-${section}`,
    `${rawGrade} ${section}`,
  ]);
  return [...variants];
}

const toMins    = (t) => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const nowMinsNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function deriveStatus(ev, nowMins) {
  if (!ev.startTime) return "upcoming";
  const s = toMins(ev.startTime), e = toMins(ev.endTime || ev.startTime);
  if (nowMins >= e) return "completed";
  if (nowMins >= s && nowMins < e) return "ongoing";
  return "upcoming";
}

function fmtTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const fmtDate = (str) => {
  if (!str) return "—";
  const d = new Date(str + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: "☀️" };
  if (h < 17) return { text: "Good afternoon", icon: "🌤️" };
  return { text: "Good evening", icon: "🌙" };
}

// ─── Score color ──────────────────────────────────────────────────────────────
const scoreColor = (pct) => {
  if (pct >= 80) return { bar: "from-emerald-400 to-teal-500",   text: "text-emerald-600", bg: "bg-emerald-50" };
  if (pct >= 65) return { bar: "from-blue-400 to-indigo-500",    text: "text-blue-600",    bg: "bg-blue-50"    };
  if (pct >= 50) return { bar: "from-amber-400 to-orange-500",   text: "text-amber-600",   bg: "bg-amber-50"   };
  return              { bar: "from-red-400 to-rose-500",         text: "text-red-600",     bg: "bg-red-50"     };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Skel = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 ${className}`} />
);

function LiveDot({ size = "sm" }) {
  const s = size === "lg" ? "h-3 w-3" : "h-2 w-2";
  return (
    <span className="relative flex">
      <span className={`animate-ping absolute inline-flex ${s} rounded-full bg-blue-400 opacity-75`} />
      <span className={`relative inline-flex rounded-full ${s} bg-blue-500`} />
    </span>
  );
}

function ScoreBar({ pct, label, animated = true }) {
  const c = scoreColor(pct);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className={`font-black tabular-nums ${c.text}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-1000`}
          style={{ width: animated ? `${Math.min(pct, 100)}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, gradient, badge, loading, onClick, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all text-left w-full overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${gradient}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {badge && (
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          )}
        </div>
        {loading ? (
          <>
            <Skel className="h-8 w-24 mb-2" />
            <Skel className="h-3.5 w-32" />
          </>
        ) : (
          <>
            <p className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">{value ?? "—"}</p>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{sub}</p>}
          </>
        )}
        <div className="flex items-center gap-1 mt-4 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-0.5">
          <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>View details</span>
          <ArrowRight className="w-3 h-3 text-indigo-400" />
        </div>
      </div>
    </button>
  );
}

function PeriodRow({ ev, nowMins }) {
  const status = deriveStatus(ev, nowMins);
  const meta   = statusMeta[status] || statusMeta.upcoming;
  const isLive = status === "ongoing";
  const isDone = status === "completed";

  return (
    <div className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
      isLive ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm"
      : isDone ? "border-gray-100 bg-gray-50/40 opacity-55"
      : "border-gray-100 bg-white hover:border-violet-200 hover:shadow-sm"
    }`}>
      {isLive && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-gradient-to-b from-blue-400 to-indigo-500" />
      )}
      <div className="flex flex-col items-center gap-0.5 w-12 shrink-0">
        {isLive ? <LiveDot /> : <span className={`w-2 h-2 rounded-full ${meta.dot}`} />}
        <span className="text-[10px] font-bold text-gray-500 mt-0.5">{fmtTime(ev.startTime)}</span>
        <span className="text-[9px] text-gray-300">{fmtTime(ev.endTime)}</span>
      </div>
      <div className={`w-px self-stretch ${isLive ? "bg-blue-200" : "bg-gray-100"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold truncate ${isDone ? "text-gray-400" : "text-gray-900"}`}>
            {ev.title}
          </span>
          {isLive && <LiveDot />}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {ev.students && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />{ev.students}
            </span>
          )}
          {ev.location && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />{ev.location}
            </span>
          )}
        </div>
      </div>
      <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
        {meta.label}
      </span>
    </div>
  );
}

function ClassCard({ cls, onClick }) {
  const isGood = cls.attendancePct >= 85;
  return (
    <div
      onClick={onClick}
      className="group p-4 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">{cls.section}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{cls.displayName}</h3>
            <p className="text-[11px] text-gray-400">{cls.studentCount} students</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
          isGood ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                 : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {isGood ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {isGood ? "On Track" : "At Risk"}
        </div>
      </div>
      <div className="space-y-2">
        <ScoreBar pct={cls.attendancePct} label="Attendance" />
        {cls.avgScore != null && <ScoreBar pct={cls.avgScore} label="Avg Score" />}
      </div>
      {cls.subjects?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {cls.subjects.slice(0, 3).map((s, i) => (
            <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-md">
              {s}
            </span>
          ))}
          {cls.subjects.length > 3 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-400 rounded-md">
              +{cls.subjects.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Attendance fetching — correct strategy order ────────────────────────────
//
// WHY admin/summary IS THE RIGHT PRIMARY SOURCE:
// ───────────────────────────────────────────────
// /attendance/teacher/students returns Student.attendanceSummary.percentage —
// a background-updated denormalized field. It is only refreshed AFTER
// markAttendance / editAttendance calls _updateStudentSummaries(). Fresh
// schools or first-time logins will always see 0% here.
//
// /attendance/admin/summary runs a LIVE aggregation on the Attendance
// collection itself (getAdminSummary in attendance.controller.js) and is
// authorized for TEACHER role per attendanceRoutes.js:
//   router.get("/admin/summary", authorize("SCHOOL_ADMIN", "TEACHER"), ...)
//
// It returns:
//   { success, data: { students: [{ percentage, present, absent, late, total }] } }
//
// We average the percentages across all students that have ≥1 attendance day.
// Students with total=0 are excluded (no data, not "absent all year").
//
// STRATEGY ORDER:
//  A (PRIMARY)  : /attendance/admin/summary  — live DB aggregation
//  B (FALLBACK1): /attendance/teacher/students — stale denormalized (better than nothing)
//  C (FALLBACK2): /students — student count only, attendance stays 0

async function fetchClassAttendance(authFetch, cls, rawGrade) {
  const section        = cls.section;
  const gradeOriginal  = cls.grade;                         // "Grade 9" as stored in Class model
  const gradeRaw       = rawGrade;                          // "9" — matches Student.grade
  const sectionEnc     = encodeURIComponent(section);

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  let stuCount      = 0;
  let attendancePct = 0;
  let studentIds    = [];

  // ── Strategy A (PRIMARY): /attendance/admin/summary ──────────────────
  //
  // getAdminSummary() in attendance.controller.js:
  //   - Queries Attendance with { grade, section } directly
  //   - Also queries Student with parseRawGrade(grade) for the student list
  //   - Returns data.students[].{ percentage, present, absent, late, total }
  //
  // We must try BOTH grade variants because Attendance records were stored
  // with whichever grade string the teacher used in markAttendance (could be
  // "Grade 9" or "9" depending on when the class was set up).
  //
  // The backend's parseRawGrade() strips the prefix for the Student lookup,
  // but the Attendance filter uses the grade AS-IS. So:
  //   - Try gradeOriginal first ("Grade 9") → finds records marked with that string
  //   - Try gradeRaw next ("9")             → finds records marked with raw grade
  //   - Merge results if both return data (rare but correct)

  const summaryGradesToTry = [
    ...new Set([gradeOriginal, gradeRaw, `Grade ${gradeRaw}`, `Class ${gradeRaw}`])
  ].filter(Boolean);

  let bestStudents = [];   // accumulate across grade variants
  let bestTotal    = 0;

  for (const g of summaryGradesToTry) {
    try {
      // No month/year filter → gives lifetime percentage (matches ChildAttendance behavior)
      const url = `/attendance/admin/summary?grade=${encodeURIComponent(g)}&section=${sectionEnc}`;
      const r   = await authFetch(url);
      if (!r.ok) continue;
      const j = await r.json();

      const students = j.data?.students ?? [];
      if (!students.length) continue;

      // Keep whichever grade variant returned more students
      if (students.length > bestTotal) {
        bestTotal    = students.length;
        bestStudents = students;
        // Collect student IDs for results fallback (Strategy C in fetchClassResults)
        studentIds = students
          .map((s) => String(s.studentId ?? s._id ?? ""))
          .filter(Boolean);
      }

      console.debug(
        `[TeacherDashboard] admin/summary OK for ${cls.displayName} (grade="${g}"):`,
        { students: students.length, url }
      );
    } catch (e) {
      console.warn(`[TeacherDashboard] admin/summary failed (grade="${g}"):`, e.message);
    }
  }

  if (bestStudents.length > 0) {
    stuCount = bestStudents.length;

    // Average percentage across students that have ≥1 attendance day.
    // Students with total=0 have no data yet — excluding them gives a
    // more accurate "current attendance rate" for students being tracked.
    const tracked = bestStudents.filter((s) => (s.total ?? 0) > 0);

    if (tracked.length > 0) {
      attendancePct = Math.round(
        tracked.reduce((acc, s) => acc + (s.percentage ?? 0), 0) / tracked.length
      );
    }
    // If tracked.length === 0, all students have total=0 → no data yet → 0%

    console.info(
      `[TeacherDashboard] Attendance for ${cls.displayName}:`,
      { stuCount, attendancePct, tracked: tracked.length, total: bestStudents.length }
    );
    return { stuCount, attendancePct, studentIds };
  }

  // ── Strategy B (FALLBACK 1): /attendance/teacher/students ────────────
  // Reads Student.attendanceSummary.percentage (denormalized, possibly stale).
  // Better than nothing — at least gives an approximation.
  for (const g of [gradeOriginal, gradeRaw]) {
    try {
      const url = `/attendance/teacher/students?grade=${encodeURIComponent(g)}&section=${sectionEnc}`;
      const r   = await authFetch(url);
      if (!r.ok) continue;
      const j   = await r.json();
      const students = j.data ?? j.students ?? [];
      if (!students.length) continue;

      stuCount   = students.length;
      studentIds = students.map((s) => String(s._id)).filter(Boolean);

      // Include all students with a non-null percentage in the average
      const withPct = students.filter((s) => s.attendancePercentage != null);
      if (withPct.length > 0) {
        attendancePct = Math.round(
          withPct.reduce((acc, s) => acc + (s.attendancePercentage ?? 0), 0) / withPct.length
        );
      }

      console.debug(
        `[TeacherDashboard] teacher/students fallback OK for ${cls.displayName} (grade="${g}"):`,
        { stuCount, attendancePct }
      );
      return { stuCount, attendancePct, studentIds };
    } catch (e) {
      console.warn(`[TeacherDashboard] teacher/students failed (grade="${g}"):`, e.message);
    }
  }

  // ── Strategy C (FALLBACK 2): /students — count only ──────────────────
  try {
    const r = await authFetch(
      `/students?grade=${encodeURIComponent(gradeRaw)}&section=${sectionEnc}&limit=200`
    );
    if (r.ok) {
      const j    = await r.json();
      stuCount   = j.data?.length ?? j.students?.length ?? j.total ?? 0;
      studentIds = (j.data ?? j.students ?? []).map((s) => String(s._id)).filter(Boolean);
      console.debug(`[TeacherDashboard] /students count fallback: ${stuCount} for ${cls.displayName}`);
    }
  } catch { /* non-fatal */ }

  console.warn(
    `[TeacherDashboard] All attendance strategies exhausted for ${cls.displayName}.`,
    { stuCount, attendancePct: 0 }
  );
  return { stuCount, attendancePct: 0, studentIds };
}

// ─── FIXED: Results fetching — multi-variant classSection + direct fallback ──
/**
 * Strategy A: /results/status/:classSection → /results/analytics/:cs/:examName
 *   Tries multiple classSection formats: "9-A", "Grade 9-A", "Class 9-A"
 *
 * Strategy B: /results/class/:classSection
 *   Some backends expose a direct class results endpoint.
 *
 * Strategy C: /results/student/:studentId for the first student in the class
 *   Uses the student IDs gathered during attendance fetch.
 *
 * Returns: avgScore (number | null)
 */
async function fetchClassResults(authFetch, rawGrade, section, studentIds) {
  const variants = classSectionVariants(rawGrade, section);

  // ── Strategy A: status → analytics chain ─────────────────────────────
  for (const cs of variants) {
    try {
      const statusR = await authFetch(`/results/status/${encodeURIComponent(cs)}`);
      if (!statusR.ok) continue;
      const statusJ = await statusR.json();
      if (!statusJ.success || !statusJ.data) continue;

      // Collect published exams; also accept submitted (to show in-progress avg)
      const publishedExams = Object.entries(statusJ.data)
        .filter(([, v]) => v.published === true)
        .map(([name]) => name);

      const submittedExams = Object.entries(statusJ.data)
        .filter(([, v]) => !v.published && (v.submittedSubjects?.length ?? 0) > 0)
        .map(([name]) => name);

      const examToQuery =
        publishedExams[publishedExams.length - 1] ??
        submittedExams[submittedExams.length - 1] ??
        null;

      if (!examToQuery) continue;

      const anaR = await authFetch(
        `/results/analytics/${encodeURIComponent(cs)}/${encodeURIComponent(examToQuery)}`
      );
      if (!anaR.ok) continue;
      const anaJ = await anaR.json();
      if (!anaJ.success || anaJ.data?.classAvg == null) continue;

      const avgScore = Math.round(anaJ.data.classAvg);
      console.debug(`[TeacherDashboard] Results Strategy A OK (${cs}):`, { avgScore, examToQuery });
      return avgScore;
    } catch (e) {
      console.warn(`[TeacherDashboard] Results Strategy A failed (${cs}):`, e.message);
    }
  }

  // ── Strategy B: /results/class/:classSection ─────────────────────────
  for (const cs of variants) {
    try {
      const r = await authFetch(`/results/class/${encodeURIComponent(cs)}`);
      if (!r.ok) continue;
      const j = await r.json();
      if (!j.success) continue;

      // Response might be { data: { classAvg } } or { data: [{score,max},...] }
      if (j.data?.classAvg != null) {
        console.debug(`[TeacherDashboard] Results Strategy B OK (${cs}):`, j.data.classAvg);
        return Math.round(j.data.classAvg);
      }

      // Compute avg from an array of student results
      const rows = Array.isArray(j.data) ? j.data : [];
      if (rows.length > 0) {
        const pcts = rows
          .map((r) => r.percentage ?? (r.score != null && r.max ? Math.round((r.score / r.max) * 100) : null))
          .filter((p) => p != null);
        if (pcts.length > 0) {
          const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
          console.debug(`[TeacherDashboard] Results Strategy B (computed avg) OK (${cs}):`, avg);
          return avg;
        }
      }
    } catch (e) {
      console.warn(`[TeacherDashboard] Results Strategy B failed (${cs}):`, e.message);
    }
  }

  // ── Strategy C: /results/student/:studentId (sample first student) ───
  // This mirrors ChildPerformance.jsx which reliably gets data this way.
  if (studentIds.length > 0) {
    // Try up to first 3 students to get a representative sample
    const sampleIds = studentIds.slice(0, Math.min(3, studentIds.length));
    const scores = [];

    for (const sid of sampleIds) {
      try {
        const r = await authFetch(`/results/student/${sid}`);
        if (!r.ok) continue;
        const j = await r.json();
        if (!j.success) continue;

        // j.examSummaries: [{ examName, pct }] or j.data: { [exam]: { [subject]: {score,max} } }
        const summaries = j.examSummaries ?? [];
        if (summaries.length > 0) {
          const latest = summaries[summaries.length - 1];
          if (latest.pct != null) scores.push(latest.pct);
        } else if (j.data) {
          // Compute from raw data map
          const examNames = Object.keys(j.data);
          if (examNames.length > 0) {
            const latestExam = j.data[examNames[examNames.length - 1]];
            const subjectEntries = Object.values(latestExam);
            const validScores = subjectEntries
              .map((s) => s.score != null && s.max ? Math.round((s.score / s.max) * 100) : null)
              .filter((p) => p != null);
            if (validScores.length > 0) {
              scores.push(Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length));
            }
          }
        }
      } catch (e) {
        console.warn(`[TeacherDashboard] Results Strategy C failed for student ${sid}:`, e.message);
      }
    }

    if (scores.length > 0) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      console.debug(`[TeacherDashboard] Results Strategy C OK (sample of ${scores.length} students):`, avg);
      return avg;
    }
  }

  console.warn(`[TeacherDashboard] All results strategies failed for ${rawGrade}-${section}`);
  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();

  const [nowMins, setNowMins] = useState(nowMinsNow);
  useEffect(() => {
    const id = setInterval(() => setNowMins(nowMinsNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  const [classes,    setClasses]    = useState([]);
  const [schedule,   setSchedule]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [lastFetch,  setLastFetch]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors,     setErrors]     = useState({});

  const { events: schoolEvents, loading: evLoading } = useSchoolEvents(30);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const errs     = {};
    const today    = new Date();
    const month    = today.getMonth() + 1;
    const year     = today.getFullYear();
    const todayStr = today.toISOString().split("T")[0];

    // ── 1. Teacher's classes ──────────────────────────────────────────────
    let teacherClasses = [];
    try {
      const r = await authFetch("/attendance/teacher/classes");
      const j = await r.json();
      if (j.success) teacherClasses = j.data || [];
      setClasses(teacherClasses);
    } catch (e) {
      console.error("[TeacherDashboard] Failed to fetch teacher classes:", e.message);
      errs.classes = true;
    }

    // ── 2. Today's schedule ───────────────────────────────────────────────
    try {
      const r = await authFetch(
        `/calendar/teacher/schedule?month=${month}&year=${year}`
      );
      if (r.ok) {
        const j = await r.json();
        if (j.success) {
          const todayEvents = (j.events || j.data || []).filter(
            (ev) => ev.date === todayStr
          );
          setSchedule(
            todayEvents.sort((a, b) =>
              (a.startTime || "").localeCompare(b.startTime || "")
            )
          );
        }
      }
    } catch { /* calendar endpoint optional */ }

    // ── 3. Per-class data (attendance + results) ──────────────────────────
    //
    // Each class is fetched in parallel (Promise.allSettled).
    // Attendance: fetchClassAttendance() tries 3 strategies with grade variants.
    // Results:    fetchClassResults()    tries 3 strategies with classSection variants.

    let totalStudents   = 0;
    let classesWithData = [];

    if (teacherClasses.length > 0) {
      const classResults = await Promise.allSettled(
        teacherClasses.slice(0, 6).map(async (cls) => {
          const rawGrade     = parseRawGrade(cls.grade);
          const section      = cls.section;

          // ── FIXED: Attendance — uses multi-strategy helper ────────────
          const { stuCount, attendancePct, studentIds } =
            await fetchClassAttendance(authFetch, cls, rawGrade);

          totalStudents += stuCount;

          // ── FIXED: Results — uses multi-strategy helper ───────────────
          const avgScore = await fetchClassResults(authFetch, rawGrade, section, studentIds);

          return {
            grade:         cls.grade,
            rawGrade,
            section,
            classSection:  `${rawGrade}-${section}`,
            displayName:   cls.displayName || `${cls.grade}-${section}`,
            subjects:      cls.subjects || [],
            studentCount:  stuCount,
            attendancePct,
            avgScore,
          };
        })
      );

      classesWithData = classResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
    }

    // ── 4. At-risk count ──────────────────────────────────────────────────
    let atRiskCount = 0;
    try {
      const r = await authFetch("/attendance/admin/predictions");
      if (r.ok) {
        const j = await r.json();
        if (j.success) atRiskCount = j.data?.length || 0;
      }
    } catch { /* optional */ }

    // ── 5. Overall stats ──────────────────────────────────────────────────
    // ── FIX: include ALL classes (even those with 0% att) in the average
    //    Old code filtered `attendancePct > 0`, masking missing data.
    //    Now we only exclude classes where stuCount === 0 (genuinely empty).
    const classesWithStudents  = classesWithData.filter((c) => c.studentCount > 0);
    const overallAttPct = classesWithStudents.length
      ? Math.round(
          classesWithStudents.reduce((a, c) => a + c.attendancePct, 0) /
            classesWithStudents.length
        )
      : 0;

    const classesWithScore = classesWithData.filter((c) => c.avgScore != null);
    const overallAvgScore  = classesWithScore.length
      ? Math.round(
          classesWithScore.reduce((a, c) => a + c.avgScore, 0) /
            classesWithScore.length
        )
      : null;

    console.info("[TeacherDashboard] Final stats:", {
      totalStudents,
      totalClasses: teacherClasses.length,
      overallAttPct,
      overallAvgScore,
      atRiskCount,
      classesWithData: classesWithData.map((c) => ({
        cls:      c.displayName,
        students: c.studentCount,
        att:      c.attendancePct,
        score:    c.avgScore,
      })),
    });

    setStats({
      totalStudents,
      totalClasses:  teacherClasses.length,
      atRiskCount,
      overallAttPct,
      overallAvgScore,
      classesWithData,
    });

    setErrors(errs);
    setLastFetch(Date.now());
    setLoading(false);
    setRefreshing(false);
  }, [authFetch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const today       = new Date();
  const todayStr    = today.toISOString().split("T")[0];
  const greeting    = getGreeting();
  const displayName = user?.name || user?.firstName || "Teacher";

  const currentPeriod = schedule.find((ev) => deriveStatus(ev, nowMins) === "ongoing");
  const nextPeriod    = schedule.find((ev) => deriveStatus(ev, nowMins) === "upcoming");
  const doneCount     = schedule.filter((ev) => deriveStatus(ev, nowMins) === "completed").length;

  const todaySchoolEvts    = schoolEvents.filter(
    (e) => e.startDate <= todayStr && e.endDate >= todayStr
  );
  const upcomingSchoolEvts = schoolEvents.filter((e) => e.startDate > todayStr).slice(0, 4);

  const attBadge = stats
    ? stats.atRiskCount > 0
      ? { label: `${stats.atRiskCount} at risk`, cls: "bg-red-50 text-red-600 border-red-200" }
      : { label: "On track", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : null;

  const scoreBadge = stats?.overallAvgScore != null
    ? {
        label:
          stats.overallAvgScore >= 75
            ? "Good"
            : stats.overallAvgScore >= 50
            ? "Average"
            : "Needs work",
        cls:
          stats.overallAvgScore >= 75
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : stats.overallAvgScore >= 50
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-red-50 text-red-600 border-red-200",
      }
    : null;

  const quickActions = [
    { label: "Mark Attendance",   icon: ClipboardCheck, path: "/school-admin/attendance/mark",        color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100", iconBg: "bg-emerald-500" },
    { label: "Enter Marks",       icon: Award,          path: "/teacher/result",                      color: "text-violet-600",  bg: "bg-violet-50 hover:bg-violet-100 border-violet-100",   iconBg: "bg-violet-500"  },
    { label: "My Schedule",       icon: Calendar,       path: "/teacher/schedule",                    color: "text-blue-600",    bg: "bg-blue-50 hover:bg-blue-100 border-blue-100",         iconBg: "bg-blue-500"    },
    { label: "My Timetable",      icon: Clock,          path: "/teacher/timetable",                   color: "text-indigo-600",  bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-100",   iconBg: "bg-indigo-500"  },
    { label: "Attendance Report", icon: BarChart3,      path: "/school-admin/attendance/mark",        color: "text-orange-600",  bg: "bg-orange-50 hover:bg-orange-100 border-orange-100",   iconBg: "bg-orange-500"  },
    { label: "At-Risk Students",  icon: AlertCircle,    path: "/school-admin/attendance/predictions", color: "text-rose-600",    bg: "bg-rose-50 hover:bg-rose-100 border-rose-100",         iconBg: "bg-rose-500"    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-200/50">
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute top-4 right-32 w-24 h-24 rounded-full bg-blue-400/10 blur-xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{greeting.icon}</span>
              <span className="text-indigo-200 text-sm font-semibold">{greeting.text}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{displayName}</h1>
            <p className="text-indigo-200 text-sm mt-1 flex items-center gap-2">
              {today.toLocaleDateString("en-IN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
              {lastFetch && (
                <span className="text-indigo-300/70 text-xs">· {timeAgo(lastFetch)}</span>
              )}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {schedule.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  <Calendar className="w-3 h-3" />
                  {schedule.length} classes today
                </div>
              )}
              {stats?.atRiskCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-400/30 rounded-full px-3 py-1 text-xs font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  {stats.atRiskCount} students at risk
                </div>
              )}
              {todaySchoolEvts.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  <Bell className="w-3 h-3" />
                  {todaySchoolEvts.length} school event{todaySchoolEvts.length > 1 ? "s" : ""} today
                </div>
              )}
              {Object.keys(errors).length > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-400/30 rounded-full px-3 py-1 text-xs font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  Some data unavailable
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Live "Now" class ──────────────────────────────────────────────── */}
      {currentPeriod && (() => {
        const s   = toMins(currentPeriod.startTime);
        const e   = toMins(currentPeriod.endTime);
        const pct = Math.min(100, Math.max(0, ((nowMins - s) / (e - s)) * 100));
        const rem = e - nowMins;
        return (
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-5 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400" />
            <div className="flex items-start gap-4 flex-wrap">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <span className="text-2xl">📖</span>
                </div>
                <div className="absolute -bottom-1 -right-1"><LiveDot size="sm" /></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Live Now
                  </span>
                </div>
                <h2 className="text-lg font-black text-gray-900 truncate">{currentPeriod.title}</h2>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {currentPeriod.students && (
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3 h-3 text-blue-400" />{currentPeriod.students}
                    </span>
                  )}
                  {currentPeriod.location && (
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-blue-400" />{currentPeriod.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {fmtTime(currentPeriod.startTime)} – {fmtTime(currentPeriod.endTime)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-semibold">
                    <span>{Math.round(pct)}% complete</span>
                    <span className="text-blue-600 font-black">{rem}m remaining</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
              {nextPeriod && (
                <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl px-4 py-3 shrink-0 min-w-[140px]">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Up next</p>
                  <p className="font-black text-gray-900 text-sm">{nextPeriod.title}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-violet-400" />
                    {fmtTime(nextPeriod.startTime)}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Total Students"
          value={loading ? null : stats?.totalStudents?.toLocaleString() ?? "0"}
          sub={`Across ${stats?.totalClasses ?? "—"} class${stats?.totalClasses !== 1 ? "es" : ""}`}
          gradient="from-blue-500 to-cyan-500"
          badge={{ label: "Active", cls: "bg-blue-50 text-blue-700 border-blue-200" }}
          loading={loading}
          onClick={() => navigate("/teacher/students")}
          delay={0}
        />
        <StatCard
          icon={Calendar}
          label="Classes Today"
          value={loading ? null : (schedule.length || "0")}
          sub={
            nextPeriod
              ? `Next: ${fmtTime(nextPeriod.startTime)}`
              : doneCount > 0
              ? "All wrapped up! 🎉"
              : "No classes scheduled"
          }
          gradient="from-violet-500 to-purple-600"
          badge={doneCount > 0 ? { label: `${doneCount} done`, cls: "bg-slate-50 text-slate-600 border-slate-200" } : null}
          loading={loading}
          onClick={() => navigate("/teacher/schedule")}
          delay={50}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Avg Attendance"
          value={loading ? null : (stats ? `${stats.overallAttPct}%` : "—")}
          sub={
            stats?.atRiskCount > 0
              ? `${stats.atRiskCount} student${stats.atRiskCount !== 1 ? "s" : ""} need attention`
              : stats?.overallAttPct > 0
              ? "All students on track"
              : "No attendance data yet"
          }
          gradient="from-emerald-500 to-teal-500"
          badge={attBadge}
          loading={loading}
          onClick={() => navigate("/school-admin/attendance/predictions")}
          delay={100}
        />
        <StatCard
          icon={Award}
          label="Avg Score"
          value={loading ? null : (stats?.overallAvgScore != null ? `${stats.overallAvgScore}%` : "—")}
          sub={stats?.overallAvgScore != null ? "Latest published exam" : "No published exams yet"}
          gradient="from-amber-500 to-orange-500"
          badge={scoreBadge}
          loading={loading}
          onClick={() => navigate("/teacher/result")}
          delay={150}
        />
      </div>

      {/* ── Row 1: Schedule + Performance ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-sm font-black text-gray-900">Today's Schedule</h2>
              {schedule.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-0.5 rounded-full">
                  {schedule.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/teacher/schedule")}
              className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
            >
              Full schedule <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skel key={i} className="h-16 w-full" />)}</div>
            ) : schedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-500">No classes today</p>
                  <p className="text-xs text-gray-400 mt-0.5">Enjoy your free day!</p>
                </div>
                <button
                  onClick={() => navigate("/teacher/schedule")}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Add to schedule →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {schedule.map((ev) => (
                  <PeriodRow key={ev._id || ev.id} ev={ev} nowMins={nowMins} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Class Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-sm font-black text-gray-900">Class Performance</h2>
              {stats?.classesWithData?.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full">
                  {stats.classesWithData.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/teacher/result")}
              className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
            >
              Enter marks <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skel key={i} className="h-28 w-full" />)}</div>
            ) : (stats?.classesWithData?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-500">No class data yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Start marking attendance to see stats</p>
                </div>
              </div>
            ) : (
              stats.classesWithData.map((cls, i) => (
                <ClassCard key={i} cls={cls} onClick={() => navigate("/teacher/result")} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: School Events + Quick Actions ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* School Events */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <School className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-sm font-black text-gray-900">School Events</h2>
              {!evLoading && schoolEvents.length > 0 && (
                <span className="bg-violet-100 text-violet-700 text-xs font-black px-2 py-0.5 rounded-full">
                  {schoolEvents.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/teacher/schedule")}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
            >
              My schedule →
            </button>
          </div>
          <div className="p-4">
            {evLoading && schoolEvents.length === 0 ? (
              <div className="space-y-2">{[1,2].map(i => <Skel key={i} className="h-16 w-full" />)}</div>
            ) : (
              <>
                {todaySchoolEvts.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Happening Today</p>
                    </div>
                    <div className="space-y-2">
                      {todaySchoolEvts.map((ev) => {
                        const cat = EVENT_CAT[ev.category] || EVENT_CAT.event;
                        return (
                          <div key={ev._id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border ${cat.bg} ${cat.border}`}>
                            <span className="text-xl shrink-0">{cat.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${cat.text}`}>{ev.title}</p>
                              {ev.location && (
                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" />{ev.location}
                                </p>
                              )}
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${cat.bg} ${cat.text} border ${cat.border}`}>
                              TODAY
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {upcomingSchoolEvts.length > 0 && (
                  <>
                    {todaySchoolEvts.length > 0 && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">
                        Coming Up
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {upcomingSchoolEvts.map((ev) => {
                        const cat   = EVENT_CAT[ev.category] || EVENT_CAT.event;
                        const start = new Date(ev.startDate + "T00:00:00");
                        const diff  = Math.round(
                          (start - new Date(todayStr + "T00:00:00")) / 86400000
                        );
                        return (
                          <div key={ev._id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${cat.bg} border ${cat.border}`}>
                              <span className={`text-sm font-black ${cat.text}`}>{start.getDate()}</span>
                              <span className={`text-[9px] font-bold ${cat.text}`}>{MONTHS[start.getMonth()]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{ev.title}</p>
                              <p className="text-xs text-gray-400 font-medium">
                                {diff === 1 ? "Tomorrow" : `In ${diff} days`}
                              </p>
                            </div>
                            <span className="text-lg shrink-0">{cat.icon}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {!evLoading && schoolEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">No upcoming school events</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Actions + My Classes */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-black text-gray-900">Quick Actions</h2>
              </div>
            </div>
            <div className="p-3 space-y-1">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${action.bg}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${action.iconBg} shrink-0`}>
                    <action.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 text-left flex-1 text-sm">{action.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* My Classes mini list */}
          {!loading && (stats?.classesWithData?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <BookMarked className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900">My Classes</h2>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {stats.classesWithData.map((cls, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                    onClick={() => navigate("/teacher/result")}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-black">{cls.section}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{cls.displayName}</p>
                        <p className="text-[10px] text-gray-400">{cls.studentCount} students</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${scoreColor(cls.attendancePct).text}`}>
                        {cls.attendancePct}%
                      </p>
                      <p className="text-[10px] text-gray-400">att.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}