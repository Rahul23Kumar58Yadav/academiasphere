// pages/student/MyAttendance.jsx
// Fetches real data from /api/attendance/student/:studentId
// Re-fetches automatically when teacher marks attendance (via attendanceBus).

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
  Download, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { getStudentAttendance, getAttendanceSummary } from "../../services/attendanceApi";
import { attendanceBus } from "../../hooks/useAttendanceRealtime";

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_STYLE = {
  present: "bg-green-500  text-white border-green-600",
  absent:  "bg-red-500    text-white border-red-600",
  late:    "bg-yellow-500 text-white border-yellow-600",
  holiday: "bg-gray-200   text-gray-600 border-gray-300",
};

const getLevel = (pct) => {
  if (pct >= 95) return { label:"Excellent", color:"text-green-600",  bg:"bg-green-100"  };
  if (pct >= 85) return { label:"Good",      color:"text-blue-600",   bg:"bg-blue-100"   };
  if (pct >= 75) return { label:"Average",   color:"text-yellow-600", bg:"bg-yellow-100" };
  return              { label:"Poor",      color:"text-red-600",    bg:"bg-red-100"    };
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });

// Build a calendar grid from flat record list
function buildCalendar(records, month, year) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  // Shift so Mon=0
  const offset = (firstDay + 6) % 7;

  const map = {};
  records.forEach((r) => {
    const key = new Date(r.date).getDate();
    map[key] = r.status;
  });

  const cells = [];
  // empty leading cells
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (offset + d - 1) % 7;
    cells.push({
      date:   d,
      status: map[d] ?? (dow >= 5 ? "holiday" : "no-school"),
      day:    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][dow],
    });
  }
  return cells;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MyAttendance = ({
  studentId,  // from auth context
  user = {},  // { academicYear, grade, section }
}) => {
  const now  = new Date();
  const [selMonth, setSelMonth] = useState(MONTHS[now.getMonth()]);
  const [selYear,  setSelYear]  = useState(String(now.getFullYear()));

  const [overall,     setOverall]     = useState(null);
  const [subjectWise, setSubjectWise] = useState([]);
  const [calRecords,  setCalRecords]  = useState([]);
  const [recent,      setRecent]      = useState([]);
  const [loading,     setLoading]     = useState(true);

  // ── Fetch everything ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const monthIndex = MONTHS.indexOf(selMonth) + 1;

      const [calRes, summaryRes] = await Promise.all([
        getStudentAttendance(studentId, { month: monthIndex, year: selYear }),
        // Summary for subject-wise breakdown
        getAttendanceSummary({ studentId, month: monthIndex, year: selYear }),
      ]);

      const calData     = calRes.data  ?? [];
      const summaryData = summaryRes.data ?? [];

      setCalRecords(calData);

      // Derive overall stats from calendar data
      const present = calData.filter((r) => r.status === "present").length;
      const absent  = calData.filter((r) => r.status === "absent").length;
      const late    = calData.filter((r) => r.status === "late").length;
      const total   = present + absent + late;
      const pct     = total ? Math.round((present / total) * 1000) / 10 : 0;
      setOverall({ present, absent, late, total, pct });

      // Subject-wise — the summary endpoint groups by subject for this student
      setSubjectWise(summaryData);

      // Recent: last 5 days that had records
      const sorted = [...calData]
        .filter((r) => ["present","absent","late"].includes(r.status))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecent(sorted);
    } catch (err) {
      toast.error("Failed to load attendance: " + (err.message ?? ""));
    } finally {
      setLoading(false);
    }
  }, [studentId, selMonth, selYear]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Listen for real-time updates from teacher ────────────────────────────────
  useEffect(() => {
    const unsub = attendanceBus.on(() => {
      loadAll();
      toast.success("Attendance updated by your teacher!", { icon:"📋" });
    });
    return unsub;
  }, [loadAll]);

  // ── Download CSV ─────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const rows = [
      ["Date", "Status", "Subject"],
      ...calRecords.map((r) => [
        new Date(r.date).toLocaleDateString("en-IN"),
        r.status,
        r.subject ?? "General",
      ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `attendance_${selMonth}_${selYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const monthNum     = MONTHS.indexOf(selMonth) + 1;
  const calendarCells = buildCalendar(calRecords, monthNum, Number(selYear));
  const level         = getLevel(overall?.pct ?? 0);

  const years = [String(now.getFullYear() - 1), String(now.getFullYear()), String(now.getFullYear() + 1)];

  // Classes needed to reach 95%
  const toReach95 = overall
    ? Math.max(0, Math.ceil(0.95 * (overall.total + 20) - overall.present))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-gray-600 mt-1">Track your attendance and maintain consistency</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadAll} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              <Download size={18} /> Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats overview */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                (overall?.pct ?? 0) >= 75 ? "bg-green-600 bg-opacity-40" : "bg-red-500 bg-opacity-40"}`}>
                {(overall?.pct ?? 0) >= 75 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {(overall?.pct ?? 0) >= 75 ? "On track" : "Needs attention"}
              </div>
            </div>
            <p className="text-sm opacity-90 mb-1">Overall Attendance</p>
            <p className="text-4xl font-bold">{overall?.pct ?? 0}%</p>
            <p className="text-xs opacity-75 mt-2">{overall?.present ?? 0}/{overall?.total ?? 0} classes</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center mb-3">
              <Calendar size={24} />
            </div>
            <p className="text-sm opacity-90 mb-1">Present Days</p>
            <p className="text-4xl font-bold">{overall?.present ?? 0}</p>
            <p className="text-xs opacity-75 mt-2">Out of {overall?.total ?? 0} total</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center mb-3">
              <XCircle size={24} />
            </div>
            <p className="text-sm opacity-90 mb-1">Absent Days</p>
            <p className="text-4xl font-bold">{overall?.absent ?? 0}</p>
            <p className="text-xs opacity-75 mt-2">Maintain good attendance</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center mb-3">
              <Clock size={24} />
            </div>
            <p className="text-sm opacity-90 mb-1">Late / Leave</p>
            <p className="text-4xl font-bold">{overall?.late ?? 0}</p>
            <p className="text-xs opacity-75 mt-2">Late marks this month</p>
          </div>
        </div>
      )}

      {/* Subject-wise */}
      {subjectWise.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Subject-wise Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectWise.map((sub, i) => {
              const lv = getLevel(sub.percentage);
              return (
                <div key={i} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900">{sub.subject ?? sub.student?.firstName}</h3>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${lv.color} ${lv.bg}`}>{lv.label}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Attendance</span>
                      <span className={`font-bold ${lv.color}`}>{sub.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${
                        sub.percentage >= 95 ? "bg-gradient-to-r from-green-500 to-green-600"
                        : sub.percentage >= 85 ? "bg-gradient-to-r from-blue-500 to-blue-600"
                        : sub.percentage >= 75 ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                      }`} style={{ width:`${sub.percentage}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                      <div className="text-center"><p className="text-xs text-gray-600">Present</p><p className="text-sm font-bold text-green-700">{sub.present}</p></div>
                      <div className="text-center"><p className="text-xs text-gray-600">Absent</p><p className="text-sm font-bold text-red-700">{sub.absent}</p></div>
                      <div className="text-center"><p className="text-xs text-gray-600">Late</p><p className="text-sm font-bold text-yellow-700">{sub.late ?? 0}</p></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Attendance Calendar</h2>
          <div className="flex gap-3">
            <select value={selMonth} onChange={(e) => setSelMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              {MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <select value={selYear} onChange={(e) => setSelYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {[["bg-green-500","Present"],["bg-red-500","Absent"],["bg-yellow-500","Late"],["bg-gray-300","Holiday/No school"]].map(([bg, lbl]) => (
            <div key={lbl} className="flex items-center gap-2">
              <div className={`w-6 h-6 ${bg} rounded`} />
              <span className="text-sm text-gray-700">{lbl}</span>
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="text-center text-sm font-semibold text-gray-700 py-2">{d}</div>
          ))}
          {calendarCells.map((cell, i) =>
            cell === null ? (
              <div key={i} />
            ) : (
              <div key={i}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all hover:shadow-md ${
                  STATUS_STYLE[cell.status] ?? "bg-gray-100 text-gray-400 border-gray-200"
                }`}
              >
                <span className="text-lg font-bold">{cell.date}</span>
                <span className="text-xs opacity-90">{cell.day}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Recent records */}
      {recent.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Attendance Records</h2>
          <div className="space-y-3">
            {recent.map((rec, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      rec.status==="present" ? "bg-green-100"
                      : rec.status==="absent" ? "bg-red-100" : "bg-yellow-100"
                    }`}>
                      {rec.status==="present" ? <CheckCircle size={20} className="text-green-600" />
                       : rec.status==="absent"  ? <XCircle size={20}    className="text-red-600"   />
                       : <Clock size={20} className="text-yellow-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{fmtDate(rec.date)}</h3>
                      <p className="text-sm text-gray-600">{rec.subject ?? "General"}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-bold border-2 capitalize ${
                    rec.status==="present" ? "bg-green-100 text-green-800 border-green-300"
                    : rec.status==="absent" ? "bg-red-100 text-red-800 border-red-300"
                    : "bg-yellow-100 text-yellow-800 border-yellow-300"
                  }`}>{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal card */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white bg-opacity-30 rounded-xl flex items-center justify-center text-3xl">🎯</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">Attendance Goal</h3>
            <p className="text-purple-100 mb-4">{level.label === "Excellent"
              ? "Outstanding! You're maintaining excellent attendance!"
              : level.label === "Good"
              ? "Good work! Keep attending regularly."
              : level.label === "Average"
              ? "You need to improve to stay on track."
              : "Warning! Your attendance is below acceptable levels."
            }</p>
            {overall && overall.pct < 95 && toReach95 > 0 && (
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm mb-2">Classes needed to reach 95%:</p>
                <p className="text-3xl font-bold">{toReach95}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;