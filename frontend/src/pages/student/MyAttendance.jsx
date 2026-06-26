// src/pages/student/MyAttendance.jsx
// STUDENT — own attendance.
// subjects[] comes from backend (Subject model → Class model → Attendance fallback).
// subjectWise merges those subjects with actual attendance records, so all subjects
// show even if no attendance has been marked yet for some.

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
  Download, RefreshCw, BookOpen, ChevronDown, AlertCircle, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { getMyAttendance } from "../../services/attendanceApi";
import { attendanceBus } from "../../hooks/useAttendanceRealtime";

// ── helpers ───────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_STYLE = {
  present: "bg-green-500  text-white border-2 border-green-600",
  absent:  "bg-red-500    text-white border-2 border-red-600",
  late:    "bg-yellow-400 text-white border-2 border-yellow-500",
  holiday: "bg-gray-100   text-gray-400 border-2 border-gray-200",
};

const getLevel = (pct) => {
  if (pct >= 95) return { label:"Excellent", color:"text-green-700",  bg:"bg-green-100"  };
  if (pct >= 85) return { label:"Good",      color:"text-blue-700",   bg:"bg-blue-100"   };
  if (pct >= 75) return { label:"Average",   color:"text-yellow-700", bg:"bg-yellow-100" };
  return              { label:"Poor",      color:"text-red-700",    bg:"bg-red-100"    };
};

// Build calendar grid from flat record list
function buildCalendar(records, month, year) {
  const firstDay    = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset      = (firstDay + 6) % 7; // Mon=0

  // Map date → status for this month
  const map = {};
  records.forEach((r) => {
    const d = new Date(r.date);
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      const day = d.getDate();
      // If multiple records per day (multiple subjects), prefer absent > late > present
      const priority = { absent: 3, late: 2, present: 1 };
      if (!map[day] || (priority[r.status] ?? 0) > (priority[map[day]] ?? 0)) {
        map[day] = r.status;
      }
    }
  });

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null); // empty leading cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (offset + d - 1) % 7;
    cells.push({
      date:   d,
      status: map[d] ?? (dow >= 5 ? "holiday" : null),
    });
  }
  return cells;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gradient, badge }) {
  return (
    <div className={`rounded-xl p-5 text-white shadow-md ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon size={20} />
        </div>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-xs opacity-80 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-65 mt-1">{sub}</p>}
    </div>
  );
}

// ── Subject card ──────────────────────────────────────────────────────────────
// Shows ALL subjects from the class (including those with 0 attendance yet).
function SubjectCard({ sub }) {
  const lv = getLevel(sub.percentage);
  const noData = sub.total === 0;

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen size={15} className="text-indigo-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{sub.subject}</h3>
        </div>
        {noData
          ? <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500">No data</span>
          : <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${lv.color} ${lv.bg}`}>{lv.label}</span>}
      </div>

      {noData ? (
        <p className="text-xs text-gray-400 italic mt-2">No attendance marked yet for this subject.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Attendance</span>
            <span className={`font-bold ${lv.color}`}>{sub.percentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                sub.percentage >= 85 ? "bg-gradient-to-r from-green-500 to-green-600"
                : sub.percentage >= 75 ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
              style={{ width: `${sub.percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100 text-center">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Present</p>
              <p className="text-sm font-bold text-green-600">{sub.present}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Absent</p>
              <p className="text-sm font-bold text-red-600">{sub.absent}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Late</p>
              <p className="text-sm font-bold text-yellow-600">{sub.late ?? 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MyAttendance() {
  const now = new Date();

  const [selMonth,   setSelMonth]   = useState(MONTHS[now.getMonth()]);
  const [selYear,    setSelYear]    = useState(String(now.getFullYear()));
  const [selSubject, setSelSubject] = useState(""); // "" = all subjects

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthIndex = MONTHS.indexOf(selMonth) + 1;
      const res = await getMyAttendance({
        month: monthIndex,
        year:  selYear,
        ...(selSubject ? { subject: selSubject } : {}),
      });
      setData(res.data ?? null);
    } catch (err) {
      toast.error("Failed to load attendance: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }, [selMonth, selYear, selSubject]);

  useEffect(() => { load(); }, [load]);

  // ── Real-time update from teacher ─────────────────────────────────────────
  useEffect(() => {
    const unsub = attendanceBus.on(() => {
      load();
      toast.success("Attendance updated by your teacher!", { icon: "📋" });
    });
    return unsub;
  }, [load]);

  // ── Build merged subjectWise list ─────────────────────────────────────────
  // subjects[] = all subjects in the class (from Subject/Class model)
  // subjectWise[] = only subjects with actual attendance records
  // Merge: show all subjects, fill zeros for those with no data
  const mergedSubjectWise = React.useMemo(() => {
    if (!data) return [];
    const allSubjects   = data.subjects ?? [];      // from Subject model
    const withData      = data.subjectWise ?? [];   // from Attendance records

    const dataMap = {};
    withData.forEach((s) => { dataMap[s.subject] = s; });

    // Include all subjects from Subject model
    const merged = allSubjects.map((name) =>
      dataMap[name] ?? { subject: name, present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 }
    );

    // Also include any subjects in attendance records that aren't in Subject model
    // (e.g. "General" or older subjects)
    withData.forEach((s) => {
      if (!allSubjects.includes(s.subject)) merged.push(s);
    });

    return merged;
  }, [data]);

  // ── Calendar ──────────────────────────────────────────────────────────────
  const monthNum      = MONTHS.indexOf(selMonth) + 1;
  const calendarCells = data ? buildCalendar(data.records, monthNum, Number(selYear)) : [];
  const overall       = data?.overall ?? { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
  const level         = getLevel(overall.percentage);
  const years         = [String(now.getFullYear() - 1), String(now.getFullYear()), String(now.getFullYear() + 1)];

  // ── CSV download ──────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!data?.records?.length) { toast.error("No records to download"); return; }
    const rows = [
      ["Date","Subject","Status"],
      ...data.records.map((r) => [
        new Date(r.date).toLocaleDateString("en-IN"),
        r.subject,
        r.status,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `attendance_${selMonth}_${selYear}${selSubject ? "_" + selSubject : ""}.csv`,
    }).click();
    toast.success("Downloaded!");
  };

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
            {data?.student && (
              <p className="text-sm text-gray-500 mt-0.5">
                {data.student.name} · {data.student.grade}-{data.student.section}
                {data.student.rollNo && ` · Roll ${data.student.rollNo}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw size={15} className={loading ? "animate-spin text-indigo-500" : "text-gray-500"} />
              Refresh
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
              <Download size={15} /> Download
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Subject — populated from Subject model */}
          <div className="relative">
            <BookOpen size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={selSubject}
              onChange={(e) => setSelSubject(e.target.value)}
              className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none"
            >
              <option value="">All Subjects</option>
              {(data?.subjects ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Month */}
          <div className="relative">
            <select
              value={selMonth}
              onChange={(e) => setSelMonth(e.target.value)}
              className="px-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none"
            >
              {MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Year */}
          <div className="relative">
            <select
              value={selYear}
              onChange={(e) => setSelYear(e.target.value)}
              className="px-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none"
            >
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Overall stats ─────────────────────────────────────────────────── */}
      {!loading && data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={CheckCircle}
            label="Overall Attendance"
            value={`${overall.percentage}%`}
            sub={`${overall.present}/${overall.total} sessions`}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
            badge={overall.percentage >= 75
              ? { label:"On track",        cls:"bg-green-700/40 text-white" }
              : { label:"Needs attention", cls:"bg-red-600/40   text-white" }}
          />
          <StatCard
            icon={Calendar}
            label="Present"
            value={overall.present}
            sub={`Out of ${overall.total} total`}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={XCircle}
            label="Absent"
            value={overall.absent}
            sub="Classes missed"
            gradient="bg-gradient-to-br from-red-500 to-red-600"
          />
          <StatCard
            icon={Clock}
            label="Late"
            value={overall.late}
            sub="Late arrivals"
            gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
          />
        </div>
      )}

      {/* ── Subject-wise ──────────────────────────────────────────────────── */}
      {/* Always shown if we have subject data — shows ALL class subjects,
          including those with 0 attendance (merged from Subject model) */}
      {!loading && mergedSubjectWise.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-500" />
              Subject-wise Attendance
            </h2>
            <span className="text-xs text-gray-400">{mergedSubjectWise.length} subject(s)</span>
          </div>
          {selSubject && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700">
              <Info size={13} />
              Showing only <strong>{selSubject}</strong>.
              <button onClick={() => setSelSubject("")} className="underline ml-1">Show all</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mergedSubjectWise.map((sub) => (
              <SubjectCard key={sub.subject} sub={sub} />
            ))}
          </div>
        </div>
      )}

      {/* ── No subjects yet ────────────────────────────────────────────────── */}
      {!loading && data && mergedSubjectWise.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <BookOpen size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-600">No subjects found</p>
          <p className="text-sm text-gray-400 mt-1">
            Your school admin hasn't assigned subjects to your class yet.
          </p>
        </div>
      )}

      {/* ── Calendar ──────────────────────────────────────────────────────── */}
      {!loading && data && data.records.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Attendance Calendar</h2>
            <span className="text-sm text-gray-400">{selMonth} {selYear}</span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[["bg-green-500","Present"],["bg-red-500","Absent"],["bg-yellow-400","Late"],["bg-gray-100 border border-gray-200","No class"]].map(([bg, lbl]) => (
              <div key={lbl} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 ${bg} rounded`} />
                <span className="text-xs text-gray-500">{lbl}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
            {calendarCells.map((cell, i) =>
              cell === null ? (
                <div key={i} />
              ) : (
                <div
                  key={i}
                  title={cell.status ?? "No class"}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all hover:opacity-80 cursor-default ${
                    STATUS_STYLE[cell.status] ?? "bg-gray-50 text-gray-300 border-2 border-transparent"
                  }`}
                >
                  {cell.date}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ── No records state ──────────────────────────────────────────────── */}
      {!loading && data && data.records.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-600">No attendance records</p>
          <p className="text-sm text-gray-400 mt-1">
            {selSubject ? `No records for "${selSubject}" in` : "No records in"} {selMonth} {selYear}.
          </p>
          {selSubject && (
            <button onClick={() => setSelSubject("")} className="mt-2 text-sm text-indigo-600 underline">
              Clear subject filter
            </button>
          )}
        </div>
      )}

      {/* ── Recent records ────────────────────────────────────────────────── */}
      {!loading && data && data.records.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Records</h2>
          <div className="space-y-2">
            {[...data.records]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((rec, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      rec.status === "present" ? "bg-green-100" :
                      rec.status === "absent"  ? "bg-red-100"   : "bg-yellow-100"
                    }`}>
                      {rec.status === "present" ? <CheckCircle size={18} className="text-green-600" />
                       : rec.status === "absent" ? <XCircle    size={18} className="text-red-600"   />
                       : <Clock size={18} className="text-yellow-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {new Date(rec.date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
                      </p>
                      <p className="text-xs text-gray-500">{rec.subject}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    rec.status === "present" ? "bg-green-100 text-green-800"
                    : rec.status === "absent" ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                  }`}>{rec.status}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Goal card ─────────────────────────────────────────────────────── */}
      {!loading && data && (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎯</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Attendance Goal</h3>
              <p className="text-purple-100 text-sm mb-3">
                {level.label === "Excellent" ? "Outstanding! Keep maintaining this record." :
                 level.label === "Good"      ? "Good work! A little more consistency helps." :
                 level.label === "Average"   ? "You're borderline. Improve to stay eligible." :
                                              "Warning! Below minimum. Attend regularly."}
              </p>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="flex justify-between text-xs mb-1.5 opacity-90">
                  <span>Current: {overall.percentage}%</span>
                  <span>Target: 75%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${overall.percentage >= 75 ? "bg-green-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(overall.percentage, 100)}%` }}
                  />
                </div>
                {overall.percentage < 75 && overall.total > 0 && (
                  <p className="text-xs mt-2 opacity-80">
                    Need to attend consistently to reach 75% minimum.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}