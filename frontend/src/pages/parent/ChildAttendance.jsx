// src/pages/parent/ChildAttendance.jsx
// Route: /parent/children/:childId/attendance
//   :childId = roll number (string) OR MongoDB _id — both accepted
//
// ── Navigate here from your parent children list like this: ──────────────────
//   navigate(`/parent/children/${child.rollNo}/attendance`, {
//     state: { grade: child.grade, section: child.section, name: child.name }
//   });
//   (navigation state is optional — component fetches children list anyway)
//
// ── Fetch order (sequential, no race conditions): ───────────────────────────
//   1. GET /attendance/parent/children  → resolve grade + section for this child
//   2. GET /attendance/parent/child/:rollNo?grade=&section=&month=&year=
//      → teacher-marked attendance records
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, AlertCircle, Calendar,
  CheckCircle, XCircle, Clock, BookOpen,
  Shield, ChevronDown, Download, Info, User,
} from "lucide-react";
import toast from "react-hot-toast";
import { getParentChildren, getChildAttendance } from "../../services/attendanceApi";
import { attendanceBus } from "../../hooks/useAttendanceRealtime";

// ── Constants ─────────────────────────────────────────────────────────────────
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

const pctColor = (p) => p >= 85 ? "text-green-700 bg-green-100" : p >= 75 ? "text-yellow-700 bg-yellow-100" : "text-red-700 bg-red-100";
const barColor = (p) => p >= 85 ? "bg-green-500"  : p >= 75 ? "bg-yellow-500" : "bg-red-500";
const getLevel = (p) => {
  if (p >= 95) return { label:"Excellent", color:"text-green-700",  bg:"bg-green-100"  };
  if (p >= 85) return { label:"Good",      color:"text-blue-700",   bg:"bg-blue-100"   };
  if (p >= 75) return { label:"Average",   color:"text-yellow-700", bg:"bg-yellow-100" };
  return              { label:"Poor",      color:"text-red-700",    bg:"bg-red-100"    };
};

const REQUIREMENT = 75;

// ── Calendar builder (Mon-first) ──────────────────────────────────────────────
function buildCalendar(records, month, year) {
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset      = (firstDay + 6) % 7;

  const map = {};
  records.forEach((r) => {
    const d = new Date(r.date);
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      const day = d.getDate();
      const pri = { absent:3, late:2, present:1 };
      if (!map[day] || (pri[r.status] ?? 0) > (pri[map[day]] ?? 0)) map[day] = r.status;
    }
  });

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (offset + d - 1) % 7;
    cells.push({ date: d, status: map[d] ?? (dow >= 5 ? "holiday" : null) });
  }
  return cells;
}

// ── Sub-components ────────────────────────────────────────────────────────────
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

function SubjectCard({ sub }) {
  const lv     = getLevel(sub.percentage);
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
        <p className="text-xs text-gray-400 italic mt-2">No attendance marked yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Attendance</span>
            <span className={`font-bold ${lv.color}`}>{sub.percentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(sub.percentage)}`}
              style={{ width:`${sub.percentage}%` }} />
          </div>
          {sub.percentage < REQUIREMENT && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle size={10} />{REQUIREMENT - sub.percentage}% below minimum — risk of exam bar
            </p>
          )}
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100 text-center">
            {[["Present","text-green-600",sub.present],["Absent","text-red-600",sub.absent],["Late","text-yellow-600",sub.late??0]].map(([l,c,v])=>(
              <div key={l}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p>
                <p className={`text-sm font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ChildAttendance() {
  const { childId }   = useParams();   // roll number OR MongoDB _id from URL
  const navigate      = useNavigate();
  const { state }     = useLocation(); // optional nav state: { grade, section, name }
  const now           = new Date();

  const [selMonth,   setSelMonth]   = useState(MONTHS[now.getMonth()]);
  const [selYear,    setSelYear]    = useState(String(now.getFullYear()));
  const [selSubject, setSelSubject] = useState("");

  // ── resolvedChild: set immediately from nav state when available.
  //    Stored in both a ref (for stable closure access in load()) and state (for render).
  const resolvedChildRef = React.useRef(
    state?.grade && state?.section
      ? { grade: state.grade, section: state.section, name: state.name || "", rollNo: childId }
      : null
  );
  const [resolvedChild, setResolvedChild] = useState(resolvedChildRef.current);

  // ── resolvedId: the MongoDB _id of the child once resolved.
  //    We use this (instead of URL param) for the attendance API call
  //    so the backend can always do a fast _id lookup.
  const resolvedIdRef = React.useRef(null);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Persist the subject list across re-fetches so the <select> is stable.
  const [knownSubjects, setKnownSubjects] = useState([]);

  // ── resolveChild: fetches the children list and resolves this child ────────
  //    Returns the resolved child object or null.
  //    Matching order (most → least specific):
  //      1. Exact _id match
  //      2. Exact rollNo match (string comparison)
  //      3. Numeric rollNo match  ← handles "1" vs 1 edge cases
  //      4. Single-child fallback  ← common case: parent has exactly one child
  const resolveChild = useCallback(async () => {
    let res;
    try {
      res = await getParentChildren();
    } catch (err) {
      throw new Error(`Could not load children list: ${err.message}`);
    }

    const list = res?.data ?? [];

    // Debug: log what came back so issues are visible in the console
    console.debug("[ChildAttendance] children list:", list.map((c) => ({
      id: c._id, rollNo: c.rollNo, grade: c.grade, section: c.section, name: c.name,
    })));

    if (!list.length) {
      throw new Error("No children linked to your account. Please contact your school admin.");
    }

    // 1. Exact _id match
    let found = list.find((c) => String(c._id) === String(childId));

    // 2. Exact rollNo match
    if (!found) {
      found = list.find((c) => String(c.rollNo) === String(childId));
    }

    // 3. Numeric rollNo match — handles cases where rollNo is stored as number
    if (!found) {
      const numId = Number(childId);
      if (!isNaN(numId)) {
        found = list.find((c) => Number(c.rollNo) === numId);
      }
    }

    // 4. Single-child fallback — if the parent has exactly one child, use it
    //    regardless of the URL param (safest assumption)
    if (!found && list.length === 1) {
      console.warn(
        `[ChildAttendance] Could not match childId "${childId}" in list. ` +
        `Falling back to the only child: ${list[0].name} (rollNo: ${list[0].rollNo}).`
      );
      found = list[0];
    }

    if (!found) {
      console.warn(
        `[ChildAttendance] childId "${childId}" not matched. List rollNos:`,
        list.map((c) => c.rollNo)
      );
      throw new Error(
        `Student not found for this account. ` +
        `Please go back and tap the child's name directly.`
      );
    }

    return found;
  }, [childId]);

  // ── Single load function ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: resolve child (grade + section + _id)
      let child = resolvedChildRef.current;

      if (!child) {
        const found = await resolveChild();
        child = found;
        resolvedChildRef.current = found;
        resolvedIdRef.current    = found._id;   // store real _id for API call
        setResolvedChild(found);
      } else if (!resolvedIdRef.current) {
        // State was passed but we don't have the real _id yet.
        // Try to get it from the children list quietly (no error if it fails).
        try {
          const res  = await getParentChildren();
          const list = res?.data ?? [];
          const found = list.find(
            (c) => String(c._id) === String(childId) ||
                   String(c.rollNo) === String(childId) ||
                   (!isNaN(Number(childId)) && Number(c.rollNo) === Number(childId))
          );
          if (found) {
            resolvedIdRef.current = found._id;
            // Merge any extra fields (e.g. real rollNo) into resolvedChild
            resolvedChildRef.current = { ...child, ...found };
            setResolvedChild((prev) => ({ ...prev, ...found }));
          }
        } catch (_) {
          // Non-fatal — we'll use the URL childId as identifier
        }
      }

      // Step 2: choose the best identifier for the API call.
      //   Prefer the real MongoDB _id (fast, unambiguous backend lookup).
      //   Fall back to the URL param (roll number).
      const apiIdentifier = resolvedIdRef.current || childId;

      const monthIndex = MONTHS.indexOf(selMonth) + 1;
      const res = await getChildAttendance(apiIdentifier, {
        grade:   child.grade,
        section: (child.section || "").toUpperCase(),
        month:   monthIndex,
        year:    selYear,
        ...(selSubject ? { subject: selSubject } : {}),
      });

      const responseData = res?.data ?? null;
      setData(responseData);

      // Persist subjects list across re-fetches
      if (responseData?.subjects?.length) {
        setKnownSubjects((prev) => {
          const merged = [...new Set([...prev, ...responseData.subjects])].sort();
          return merged;
        });
      }
    } catch (err) {
      const msg = err.message || "Could not load attendance";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [childId, selMonth, selYear, selSubject, resolveChild]);

  // Initial fetch + re-fetch when filters change
  useEffect(() => { load(); }, [load]);

  // Real-time: teacher marks → parent page refreshes
  useEffect(() => {
    const unsub = attendanceBus.on(() => {
      load();
      toast.success("Attendance updated by teacher!", { icon: "📋" });
    });
    return unsub;
  }, [load]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const overall     = data?.overall    ?? { present:0, absent:0, late:0, total:0, percentage:0 };
  const records     = data?.records    ?? [];
  const subjectWise = data?.subjectWise ?? [];
  const allSubjects = knownSubjects.length ? knownSubjects : (data?.subjects ?? []);

  const mergedSubjectWise = useMemo(() => {
    const dataMap = {};
    subjectWise.forEach((s) => { dataMap[s.subject] = s; });
    const merged = allSubjects.map(
      (name) => dataMap[name] ?? { subject:name, present:0, absent:0, late:0, excused:0, total:0, percentage:0 }
    );
    subjectWise.forEach((s) => { if (!allSubjects.includes(s.subject)) merged.push(s); });
    return merged;
  }, [allSubjects, subjectWise]);

  const studentName  = data?.student?.name || resolvedChild?.name || state?.name || `Roll ${childId}`;
  const studentClass = resolvedChild ? `${resolvedChild.grade}-${resolvedChild.section}` : "";
  const studentRoll  = data?.student?.rollNo || resolvedChild?.rollNo || childId;
  const initials     = studentName.split(" ").slice(0,2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  const overallPct = overall.percentage ?? 0;
  const level      = getLevel(overallPct);
  const safe       = overallPct >= REQUIREMENT;
  const years      = [String(now.getFullYear()-1), String(now.getFullYear()), String(now.getFullYear()+1)];
  const monthNum   = MONTHS.indexOf(selMonth) + 1;
  const calCells   = data ? buildCalendar(records, monthNum, Number(selYear)) : [];

  const handleDownload = () => {
    if (!records.length) { toast.error("No records to download"); return; }
    const rows = [
      ["Date","Subject","Status"],
      ...records.map((r) => [new Date(r.date).toLocaleDateString("en-IN"), r.subject, r.status]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type:"text/csv" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `attendance_roll${studentRoll}_${selMonth}_${selYear}.csv`,
    }).click();
    toast.success("Downloaded!");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                {initials || <User size={16} />}
              </div>
              <div>
                <p className="font-semibold text-gray-900 leading-tight">{studentName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {studentClass && `Class ${studentClass}`}
                  {studentRoll  && ` · Roll No. ${studentRoll}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => load()} disabled={loading}
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
          {allSubjects.length > 0 && (
            <div className="relative">
              <BookOpen size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={selSubject} onChange={(e) => setSelSubject(e.target.value)}
                className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none">
                <option value="">All Subjects</option>
                {allSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          {[
            [selMonth, setSelMonth, MONTHS],
            [selYear,  setSelYear,  years],
          ].map(([val, setter, opts], i) => (
            <div key={i} className="relative">
              <select value={val} onChange={(e) => setter(e.target.value)}
                className="px-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none">
                {opts.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* ── Loading skeleton ────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_,i) => <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
          <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CheckCircle} label="Overall Attendance" value={`${overallPct}%`}
              sub={`${overall.present}/${overall.total} sessions`}
              gradient="bg-gradient-to-br from-green-500 to-green-600"
              badge={safe ? { label:"On track", cls:"bg-green-700/40 text-white" } : { label:"Needs attention", cls:"bg-red-600/40 text-white" }} />
            <StatCard icon={Calendar}    label="Present" value={overall.present} sub={`Out of ${overall.total} total`} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
            <StatCard icon={XCircle}     label="Absent"  value={overall.absent}  sub="Classes missed"                  gradient="bg-gradient-to-br from-red-500 to-red-600" />
            <StatCard icon={Clock}       label="Late"    value={overall.late}    sub="Late arrivals"                   gradient="bg-gradient-to-br from-yellow-500 to-yellow-600" />
          </div>

          {/* Compliance banner */}
          <div className={`flex items-start gap-4 px-5 py-4 rounded-xl border ${safe ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <Shield size={20} className={`flex-shrink-0 mt-0.5 ${safe ? "text-green-600" : "text-red-600"}`} />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${safe ? "text-green-700" : "text-red-700"}`}>
                {safe ? "Attendance requirement met" : "Attendance below requirement"}
              </p>
              <p className={`text-xs mt-0.5 ${safe ? "text-green-600" : "text-red-600"}`}>
                {safe
                  ? `${studentName.split(" ")[0]} is at ${overallPct}% — above the ${REQUIREMENT}% minimum.`
                  : `Current attendance is ${overallPct}%. Must reach ${REQUIREMENT}% to remain eligible.`}
              </p>
              <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${safe ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width:`${Math.min(overallPct,100)}%` }} />
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${pctColor(overallPct)}`}>
              {overallPct}%
            </span>
          </div>

          {/* Subject-wise */}
          {mergedSubjectWise.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-500" /> Subject-wise Attendance
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
                {mergedSubjectWise.map((sub) => <SubjectCard key={sub.subject} sub={sub} />)}
              </div>
            </div>
          )}

          {mergedSubjectWise.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <BookOpen size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="font-semibold text-gray-600">No subjects found</p>
              <p className="text-sm text-gray-400 mt-1">The school admin hasn't assigned subjects to this class yet.</p>
            </div>
          )}

          {/* Calendar */}
          {records.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Attendance Calendar</h2>
                <span className="text-sm text-gray-400">{selMonth} {selYear}</span>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                {[["bg-green-500","Present"],["bg-red-500","Absent"],["bg-yellow-400","Late"],["bg-gray-100 border border-gray-200","No class"]].map(([bg,lbl]) => (
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
                {calCells.map((cell,i) =>
                  cell === null ? <div key={i} /> : (
                    <div key={i} title={cell.status ?? "No class"}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all hover:opacity-80 cursor-default ${STATUS_STYLE[cell.status] ?? "bg-gray-50 text-gray-300 border-2 border-transparent"}`}>
                      {cell.date}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* No records */}
          {records.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-semibold text-gray-600">No attendance records</p>
              <p className="text-sm text-gray-400 mt-1">
                {selSubject ? `No records for "${selSubject}" in ` : "No records in "}
                {selMonth} {selYear}.
              </p>
              {selSubject && (
                <button onClick={() => setSelSubject("")} className="mt-2 text-sm text-indigo-600 underline">
                  Clear subject filter
                </button>
              )}
            </div>
          )}

          {/* Recent records */}
          {records.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Records</h2>
              <div className="space-y-2">
                {[...records].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,10).map((rec,i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rec.status==="present"?"bg-green-100":rec.status==="absent"?"bg-red-100":"bg-yellow-100"}`}>
                        {rec.status==="present" ? <CheckCircle size={18} className="text-green-600" /> :
                         rec.status==="absent"  ? <XCircle    size={18} className="text-red-600"   /> :
                                                  <Clock      size={18} className="text-yellow-600" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {new Date(rec.date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
                        </p>
                        <p className="text-xs text-gray-500">{rec.subject || "General"}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${rec.status==="present"?"bg-green-100 text-green-800":rec.status==="absent"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goal card */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Attendance Goal</h3>
                <p className="text-purple-100 text-sm mb-3">
                  {level.label==="Excellent" ? "Outstanding! Keep maintaining this record." :
                   level.label==="Good"      ? "Good work! A little more consistency helps." :
                   level.label==="Average"   ? "Borderline. Improving ensures exam eligibility." :
                                               "Warning! Below minimum. Must attend regularly."}
                </p>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1.5 opacity-90">
                    <span>Current: {overallPct}%</span>
                    <span>Target: {REQUIREMENT}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${overallPct>=REQUIREMENT?"bg-green-400":"bg-red-400"}`}
                      style={{ width:`${Math.min(overallPct,100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No data state */}
      {!loading && !data && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-600">No attendance data yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">The teacher hasn't recorded attendance for this period.</p>
          <button onClick={() => load()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )}
    </div>
  );
}