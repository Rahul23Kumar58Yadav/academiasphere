// src/pages/school-admin/attendance/MarkAttendance.jsx
// SCHOOL ADMIN — READ-ONLY attendance viewer.
// Classes pulled from Class model (only what admin created).
// Subjects pulled from Subject model (only what admin assigned to that class).

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle,
  Search, Download, RefreshCw, ChevronDown, BookOpen,
  TrendingUp, Eye, Filter, BarChart3, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getSchoolClasses,
  getSubjectsForClass,
  getAdminSummary,
  getAdminDailyView,
} from "../../services/attendanceApi";

// ── helpers ───────────────────────────────────────────────────────────────────
const pctColor = (p) =>
  p >= 85 ? "text-green-700 bg-green-100" :
  p >= 75 ? "text-yellow-700 bg-yellow-100" :
            "text-red-700 bg-red-100";

const statusPill = {
  present: "bg-green-100 text-green-700 border border-green-200",
  absent:  "bg-red-100   text-red-700   border border-red-200",
  late:    "bg-yellow-100 text-yellow-700 border border-yellow-200",
  excused: "bg-blue-100  text-blue-700  border border-blue-200",
};

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const now = new Date();

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  const cls = { blue:"bg-blue-50 text-blue-600", green:"bg-green-50 text-green-600",
                red:"bg-red-50 text-red-600", yellow:"bg-yellow-50 text-yellow-600",
                purple:"bg-purple-50 text-purple-600" }[color];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Sel({ label, value, onChange, children, icon: Icon, disabled }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MarkAttendance() {
  // ── state ──────────────────────────────────────────────────────────────────
  const [allClasses,  setAllClasses]  = useState([]);  // [{grade, section, displayName}]
  const [subjects,    setSubjects]    = useState([]);  // string[]

  const [selGrade,    setSelGrade]    = useState("");
  const [selSection,  setSelSection]  = useState("");
  const [selSubject,  setSelSubject]  = useState("");
  const [selMonth,    setSelMonth]    = useState(String(now.getMonth() + 1));
  const [selYear,     setSelYear]     = useState(String(now.getFullYear()));
  const [viewMode,    setViewMode]    = useState("summary"); // "summary" | "daily"
  const [selDate,     setSelDate]     = useState(now.toISOString().split("T")[0]);
  const [search,      setSearch]      = useState("");

  const [summary,     setSummary]     = useState(null);
  const [dailyData,   setDailyData]   = useState([]);
  const [loadingCls,  setLoadingCls]  = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Derived: unique grades and sections from allClasses
  const grades    = [...new Set(allClasses.map((c) => c.grade))].sort();
  const sections  = [...new Set(allClasses.filter((c) => c.grade === selGrade).map((c) => c.section))].sort();

  // ── 1. Load all classes (from Class model) ─────────────────────────────────
  useEffect(() => {
    setLoadingCls(true);
    getSchoolClasses()
      .then((d) => {
        const list = d.data ?? [];
        setAllClasses(list);
        if (list.length) {
          setSelGrade(list[0].grade);
          setSelSection(list[0].section);
        }
      })
      .catch(() => toast.error("Failed to load classes"))
      .finally(() => setLoadingCls(false));
  }, []);

  // ── 2. When grade changes, reset section to first available ────────────────
  useEffect(() => {
    const secs = [...new Set(allClasses.filter((c) => c.grade === selGrade).map((c) => c.section))].sort();
    setSelSection(secs[0] || "");
  }, [selGrade, allClasses]);

  // ── 3. Load subjects whenever grade+section changes ────────────────────────
  useEffect(() => {
    if (!selGrade || !selSection) { setSubjects([]); return; }
    setSelSubject("");
    getSubjectsForClass(selGrade, selSection)
      .then((d) => setSubjects(d.data ?? []))
      .catch(() => setSubjects([]));
  }, [selGrade, selSection]);

  // ── 4. Load attendance data ────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!selGrade || !selSection) return;
    setLoadingData(true);
    try {
      if (viewMode === "summary") {
        const res = await getAdminSummary({
          grade:   selGrade,
          section: selSection,
          month:   selMonth,
          year:    selYear,
          ...(selSubject ? { subject: selSubject } : {}),
        });
        setSummary(res.data ?? null);
      } else {
        const res = await getAdminDailyView({
          grade:   selGrade,
          section: selSection,
          date:    selDate,
          ...(selSubject ? { subject: selSubject } : {}),
        });
        setDailyData(res.data ?? []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load attendance");
    } finally {
      setLoadingData(false);
    }
  }, [selGrade, selSection, selSubject, selMonth, selYear, viewMode, selDate]);

  useEffect(() => { load(); }, [load]);

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!summary?.students?.length) return;
    const rows = [
      ["Roll No","Student","Present","Absent","Late","Excused","Total","%"],
      ...summary.students.map((s) => [s.rollNo, s.name, s.present, s.absent, s.late, s.excused, s.total, `${s.percentage}%`]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `attendance_${selGrade}-${selSection}_${MONTHS[Number(selMonth)-1]}_${selYear}.csv`,
    }).click();
    toast.success("Exported!");
  };

  // ── filter by search ───────────────────────────────────────────────────────
  const displayStudents = (summary?.students ?? []).filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const overallPresent = (summary?.students ?? []).reduce((a, s) => a + s.present, 0);
  const overallTotal   = (summary?.students ?? []).reduce((a, s) => a + s.total, 0);
  const overallPct     = overallTotal ? Math.round((overallPresent / overallTotal) * 100) : 0;
  const years = [String(now.getFullYear() - 1), String(now.getFullYear())];

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header + Filters ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-3 items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Read-only · Classes and subjects reflect what you have created
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-blue-500" : "text-gray-500"}`} />
              Refresh
            </button>
            <button onClick={exportCSV} disabled={!summary?.students?.length}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">
              <Download className="w-4 h-4 text-gray-500" /> Export CSV
            </button>
          </div>
        </div>

        {loadingCls ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading classes…
          </div>
        ) : allClasses.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            No classes found. Create classes first via Manage Classes.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

            {/* Grade */}
            <Sel label="Grade" value={selGrade} onChange={setSelGrade} icon={Users}>
              {grades.map((g) => <option key={g} value={g}>{g}</option>)}
            </Sel>

            {/* Section */}
            <Sel label="Section" value={selSection} onChange={setSelSection} disabled={!selGrade}>
              {sections.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </Sel>

            {/* Subject — from Subject model */}
            <Sel label="Subject" value={selSubject} onChange={setSelSubject} icon={BookOpen}
              disabled={!selGrade || !selSection}>
              <option value="">All Subjects</option>
              {subjects.length === 0
                ? <option disabled>No subjects found</option>
                : subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </Sel>

            {/* Month / Date */}
            {viewMode === "summary" ? (
              <>
                <Sel label="Month" value={selMonth} onChange={setSelMonth} icon={Calendar}>
                  {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </Sel>
                <Sel label="Year" value={selYear} onChange={setSelYear}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </Sel>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={selDate}
                  max={now.toISOString().split("T")[0]}
                  onChange={(e) => setSelDate(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            {/* View mode toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View</label>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold h-[42px]">
                {[["summary","Summary"],["daily","Daily"]].map(([v, l]) => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={`flex-1 transition-colors ${viewMode === v ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── No selection prompt ───────────────────────────────────────────── */}
      {(!selGrade || !selSection) && !loadingCls && allClasses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Filter className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Select a class to view attendance</p>
          <p className="text-sm text-gray-400 mt-1">Choose grade and section above</p>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loadingData && selGrade && selSection && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* ══════════ SUMMARY VIEW ══════════════════════════════════════════ */}
      {!loadingData && viewMode === "summary" && summary && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Users}       label="Students"       value={summary.students?.length ?? 0}                          color="blue" />
            <StatCard icon={BarChart3}   label="Sessions"       value={summary.totalDays ?? 0}                                 color="purple" sub="total records" />
            <StatCard icon={CheckCircle} label="Avg Attendance" value={`${overallPct}%`}                                      color="green" />
            <StatCard icon={TrendingUp}  label="Above 85%"      value={(summary.students ?? []).filter(s=>s.percentage>=85).length} color="green" />
            <StatCard icon={AlertCircle} label="Below 75%"      value={(summary.students ?? []).filter(s=>s.percentage<75).length}  color="red" />
          </div>

          {/* Student table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selGrade} — Section {selSection}
                  {selSubject && <span className="ml-2 text-blue-600">· {selSubject}</span>}
                  <span className="ml-2 text-gray-400 font-normal text-sm">
                    {MONTHS[Number(selMonth)-1]} {selYear}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  View-only. Teachers mark and edit records.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student…"
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-52" />
              </div>
            </div>

            {displayStudents.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{summary.students?.length === 0 ? "No attendance data for this period." : "No students match search."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Roll","Student","Present","Absent","Late","Excused","Total","Attendance"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayStudents.map((s) => (
                      <tr key={s.studentId?.toString()} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.rollNo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-green-600 font-semibold">{s.present}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">{s.absent}</td>
                        <td className="px-4 py-3 text-yellow-600 font-semibold">{s.late}</td>
                        <td className="px-4 py-3 text-blue-600 font-semibold">{s.excused}</td>
                        <td className="px-4 py-3 text-gray-700 font-semibold">{s.total}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[48px]">
                              <div
                                className={`h-1.5 rounded-full ${s.percentage>=85?"bg-green-500":s.percentage>=75?"bg-yellow-500":"bg-red-500"}`}
                                style={{ width:`${s.percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${pctColor(s.percentage)}`}>
                              {s.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Date-wise session records */}
          {summary.dateWise?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Session Records</h3>
                <p className="text-xs text-gray-400 mt-0.5">{summary.dateWise.length} sessions this period</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Date","Subject","Present","Absent","Late","Total"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summary.dateWise.map((d) => (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {new Date(d.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{d.subject || <span className="text-gray-400 italic">General</span>}</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">{d.totalPresent}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">{d.totalAbsent}</td>
                        <td className="px-4 py-3 text-yellow-600 font-semibold">{d.totalLate}</td>
                        <td className="px-4 py-3 text-gray-700 font-semibold">{d.totalStudents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ DAILY VIEW ════════════════════════════════════════════ */}
      {!loadingData && viewMode === "daily" && selGrade && selSection && (
        <>
          {dailyData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">No attendance marked for {selDate}</p>
              <p className="text-sm text-gray-400 mt-1">
                {selSubject ? `Subject: ${selSubject} · ` : ""}Try another date or clear the subject filter.
              </p>
            </div>
          ) : (
            dailyData.map((session) => (
              <div key={session._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {session.subject || <span className="text-gray-400 italic">General Attendance</span>}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(session.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
                      {session.period && ` · Period ${session.period}`}
                    </p>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-600 font-semibold">
                      ✓ {session.records.filter(r=>r.status==="present").length} Present
                    </span>
                    <span className="text-red-600 font-semibold">
                      ✗ {session.records.filter(r=>r.status==="absent").length} Absent
                    </span>
                    {session.records.filter(r=>r.status==="late").length > 0 && (
                      <span className="text-yellow-600 font-semibold">
                        ⏰ {session.records.filter(r=>r.status==="late").length} Late
                      </span>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Roll","Student","Status","Note"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {session.records.map((r) => (
                        <tr key={r.studentId?.toString()} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.rollNo}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusPill[r.status] || "bg-gray-100 text-gray-600"}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{r.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}