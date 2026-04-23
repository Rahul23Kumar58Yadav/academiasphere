// pages/teacher/Attendance.jsx
// Teacher marks attendance → saved to backend → triggers real-time update
// for the student's MyAttendance view and Admin dashboard.

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ClipboardCheck, Users, CheckCircle, XCircle, Clock,
  Search, Save, RotateCcw, Calendar, BookOpen, AlertCircle,
  CheckSquare, Square, UserCheck, UserX, BarChart3, Eye, Edit3,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAttendance,
  markAttendance,
  editAttendance,
} from "../../services/attendanceApi";
import { attendanceBus } from "../../hooks/useAttendanceRealtime";

// ─── Avatar colour pool ───────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500","bg-indigo-500","bg-blue-500","bg-cyan-500",
  "bg-teal-500","bg-emerald-500","bg-pink-500","bg-rose-500",
];
const avatarColor = (id) => AVATAR_COLORS[String(id).charCodeAt(0) % AVATAR_COLORS.length];

// ─── StatPill ─────────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}>
    <Icon size={18} />
    <div>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold leading-none">{value}</p>
    </div>
  </div>
);

// ─── StudentRow ───────────────────────────────────────────────────────────────
const StudentRow = ({ student, status, onToggle }) => {
  const isPresent = status === "present";
  const isAbsent  = status === "absent";
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
      isPresent ? "bg-emerald-50 border-emerald-200"
      : isAbsent ? "bg-red-50 border-red-200"
      : "bg-white border-gray-200 hover:border-indigo-200"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(student._id)}`}>
          {student.firstName?.[0]}{student.lastName?.[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{student.firstName} {student.lastName}</p>
          <p className="text-xs text-gray-500">{student.rollNo}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(student._id, "present")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isPresent ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white text-gray-500 border border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
          }`}
        >
          <CheckCircle size={13} /> Present
        </button>
        <button
          onClick={() => onToggle(student._id, "absent")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isAbsent ? "bg-red-500 text-white shadow-sm"
            : "bg-white text-gray-500 border border-gray-200 hover:border-red-400 hover:text-red-600"
          }`}
        >
          <XCircle size={13} /> Absent
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Attendance = ({
  // Injected by your router/auth context
  teacherClasses = [], // [{ grade, section, subjects:[] }]
  user           = {},
}) => {
  const today = new Date().toISOString().split("T")[0];

  const [activeTab,       setActiveTab]       = useState("mark");
  const [selectedClass,   setSelectedClass]   = useState(teacherClasses[0] ?? null);
  const [selectedSubject, setSelectedSubject] = useState(teacherClasses[0]?.subjects?.[0] ?? "");
  const [selectedDate,    setSelectedDate]    = useState(today);
  const [students,        setStudents]        = useState([]);
  const [attendance,      setAttendance]      = useState({});
  const [pastRecords,     setPastRecords]     = useState([]);
  const [editingId,       setEditingId]       = useState(null);
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [saved,           setSaved]           = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving,          setSaving]          = useState(false);

  // ── Fetch students for selected class ─────────────────────────────────────
  useEffect(() => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    fetch(
      `/api/students?grade=${selectedClass.grade}&section=${selectedClass.section}&status=active`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    )
      .then((r) => r.json())
      .then((d) => { setStudents(d.data ?? []); setAttendance({}); setSaved(false); })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass]);

  // ── Fetch history tab ─────────────────────────────────────────────────────
  const loadHistory = useCallback(() => {
    if (!selectedClass) return;
    getAttendance({ grade: selectedClass.grade, section: selectedClass.section })
      .then((d) => setPastRecords(d.data ?? []))
      .catch(() => toast.error("Failed to load history"));
  }, [selectedClass]);

  useEffect(() => { if (activeTab === "history") loadHistory(); }, [activeTab, loadHistory]);

  // ── Toggle individual student ─────────────────────────────────────────────
  const handleToggle = (id, status) => {
    setAttendance((prev) => ({ ...prev, [id]: prev[id] === status ? undefined : status }));
    setSaved(false);
  };

  const markAll  = (status) => { const n={}; students.forEach(s=>{n[s._id]=status;}); setAttendance(n); setSaved(false); };
  const resetAll = () => { setAttendance({}); setSaved(false); };

  // ── Save attendance ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!allMarked) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status:    attendance[s._id],
      }));

      const payload = {
        grade:       selectedClass.grade,
        section:     selectedClass.section,
        date:        selectedDate,
        subject:     selectedSubject || null,
        records,
        academicYear: user.academicYear ?? `${new Date().getFullYear()}-${String(new Date().getFullYear()+1).slice(-2)}`,
      };

      if (editingId) {
        await editAttendance(editingId, { records, editReason: "Teacher correction" });
        toast.success("Attendance updated!");
      } else {
        await markAttendance(payload);
        toast.success("Attendance saved!");
      }

      setSaved(true);
      setEditingId(null);

      // ── Notify other components (same tab & other tabs) ──────────────────
      attendanceBus.emit({
        grade:   selectedClass.grade,
        section: selectedClass.section,
        date:    selectedDate,
      });

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      // 409 = already marked → switch to edit mode
      if (err.message?.includes("already marked")) {
        toast.error("Attendance already marked. Loading record to edit…");
        // Load existing record
        const existing = await getAttendance({
          grade:   selectedClass.grade,
          section: selectedClass.section,
          date:    selectedDate,
        });
        const rec = existing.data?.[0];
        if (rec) {
          setEditingId(rec._id);
          const map = {};
          rec.records.forEach((r) => { map[r.studentId] = r.status; });
          setAttendance(map);
        }
      } else {
        toast.error(err.message ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const presentCount  = students.filter((s) => attendance[s._id] === "present").length;
  const absentCount   = students.filter((s) => attendance[s._id] === "absent").length;
  const unmarkedCount = students.length - presentCount - absentCount;
  const allMarked     = unmarkedCount === 0 && students.length > 0;
  const pct           = students.length ? Math.round((presentCount / students.length) * 100) : 0;

  const visible = useMemo(() => {
    let list = students;
    if (search) list = list.filter((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterStatus === "present")  list = list.filter((s) => attendance[s._id] === "present");
    if (filterStatus === "absent")   list = list.filter((s) => attendance[s._id] === "absent");
    if (filterStatus === "unmarked") list = list.filter((s) => !attendance[s._id]);
    return list;
  }, [students, search, filterStatus, attendance]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <ClipboardCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Attendance</h1>
              <p className="text-indigo-200 text-sm">Mark and track student attendance</p>
            </div>
          </div>
          <div className="flex bg-white/15 rounded-xl p-1 gap-1 self-start sm:self-auto">
            {[["mark", ClipboardCheck, "Mark"], ["history", Eye, "History"]].map(([key, Icon, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === key ? "bg-white text-indigo-700 shadow" : "text-white hover:bg-white/10"
                }`}
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════ MARK TAB ══════════════════ */}
      {activeTab === "mark" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Class */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Class</label>
                <div className="relative">
                  <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={teacherClasses.indexOf(selectedClass)}
                    onChange={(e) => {
                      const cls = teacherClasses[e.target.value];
                      setSelectedClass(cls);
                      setSelectedSubject(cls?.subjects?.[0] ?? "");
                      setAttendance({});
                      setSaved(false);
                      setEditingId(null);
                    }}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 appearance-none"
                  >
                    {teacherClasses.map((cls, i) => (
                      <option key={i} value={i}>Grade {cls.grade}-{cls.section}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Subject</label>
                <div className="relative">
                  <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedSubject}
                    onChange={(e) => { setSelectedSubject(e.target.value); setSaved(false); }}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 appearance-none"
                  >
                    {(selectedClass?.subjects ?? []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Date</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={selectedDate} max={today}
                    onChange={(e) => { setSelectedDate(e.target.value); setSaved(false); setEditingId(null); }}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Edit mode banner */}
            {editingId && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <Edit3 size={14} />
                <span>Editing existing record — changes will overwrite the saved entry.</span>
                <button className="ml-auto text-xs underline" onClick={() => { setEditingId(null); resetAll(); }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill icon={Users}     label="Total"    value={students.length} color="border-gray-200 text-gray-700 bg-white" />
            <StatPill icon={UserCheck} label="Present"  value={presentCount}    color="border-emerald-200 text-emerald-700 bg-emerald-50" />
            <StatPill icon={UserX}     label="Absent"   value={absentCount}     color="border-red-200 text-red-700 bg-red-50" />
            <StatPill icon={Clock}     label="Unmarked" value={unmarkedCount}   color="border-amber-200 text-amber-700 bg-amber-50" />
          </div>

          {/* Progress bar */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
                <span className={`text-2xl font-bold ${pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>{pct}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-red-500 to-orange-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {!allMarked && students.length > 0 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> {unmarkedCount} student{unmarkedCount > 1 ? "s" : ""} not yet marked
                </p>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search name or roll no…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden text-xs font-semibold">
              {[["all","All"],["present","Present"],["absent","Absent"],["unmarked","Unmarked"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  className={`px-3 py-2.5 transition-colors ${filterStatus === val
                    ? val==="present" ? "bg-emerald-600 text-white"
                      : val==="absent" ? "bg-red-500 text-white"
                      : val==="unmarked" ? "bg-amber-500 text-white"
                      : "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => markAll("present")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
              <CheckSquare size={15} /> Mark All Present
            </button>
            <button onClick={() => markAll("absent")}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm">
              <Square size={15} /> Mark All Absent
            </button>
            <button onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
              <RotateCcw size={15} /> Reset
            </button>
            <div className="ml-auto">
              <button onClick={handleSave} disabled={!allMarked || saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
                  saved ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : allMarked && !saving ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {saving ? <><Clock size={15} className="animate-spin" /> Saving…</>
                 : saved ? <><CheckCircle size={15} /> Saved!</>
                 : <><Save size={15} /> {editingId ? "Update Attendance" : "Save Attendance"}</>}
              </button>
            </div>
          </div>

          {/* Student list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-indigo-600" />
                <span className="font-bold text-gray-800 text-sm">
                  {selectedClass ? `Grade ${selectedClass.grade}-${selectedClass.section}` : "—"}
                  {selectedSubject && ` — ${selectedSubject}`}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {loadingStudents ? "Loading…" : `Showing ${visible.length} of ${students.length}`}
              </span>
            </div>
            <div className="p-4 space-y-2">
              {loadingStudents ? (
                <div className="text-center py-10 text-gray-400">
                  <Clock size={40} className="mx-auto mb-3 opacity-30 animate-spin" />
                  <p className="font-medium">Loading students…</p>
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No students match the filter</p>
                </div>
              ) : (
                visible.map((student) => (
                  <StudentRow key={student._id} student={student}
                    status={attendance[student._id]} onToggle={handleToggle}
                  />
                ))
              )}
            </div>
          </div>

          {/* Present / Absent summary */}
          {(presentCount > 0 || absentCount > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-emerald-600 flex items-center gap-2">
                  <UserCheck size={16} className="text-white" />
                  <span className="font-bold text-white text-sm">Present ({presentCount})</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
                  {students.filter((s) => attendance[s._id] === "present").map((s) => (
                    <div key={s._id} className="flex items-center gap-2 text-sm text-emerald-800">
                      <div className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${avatarColor(s._id)}`}>
                        {s.firstName?.[0]}{s.lastName?.[0]}
                      </div>
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                      <span className="text-emerald-500 text-xs ml-auto">{s.rollNo}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-red-500 flex items-center gap-2">
                  <UserX size={16} className="text-white" />
                  <span className="font-bold text-white text-sm">Absent ({absentCount})</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
                  {students.filter((s) => attendance[s._id] === "absent").map((s) => (
                    <div key={s._id} className="flex items-center gap-2 text-sm text-red-800">
                      <div className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${avatarColor(s._id)}`}>
                        {s.firstName?.[0]}{s.lastName?.[0]}
                      </div>
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                      <span className="text-red-400 text-xs ml-auto">{s.rollNo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════ HISTORY TAB ══════════════════ */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            <span className="font-bold text-gray-800">Past Attendance Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pastRecords.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No records found</td></tr>
                )}
                {pastRecords.map((rec) => {
                  const present = rec.records?.filter((r) => r.status === "present").length ?? 0;
                  const total   = rec.records?.length ?? 0;
                  const rate    = total ? Math.round((present / total) * 100) : 0;
                  return (
                    <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {new Date(rec.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                      </td>
                      <td className="px-6 py-4 text-gray-700">Grade {rec.grade}-{rec.section}</td>
                      <td className="px-6 py-4 text-gray-700">{rec.subject ?? "General"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-xs">
                          <CheckCircle size={11} /> {present}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-lg font-semibold text-xs">
                          <XCircle size={11} /> {total - present}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${rate >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                              style={{ width: `${rate}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${rate >= 75 ? "text-emerald-600" : "text-red-500"}`}>{rate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setEditingId(rec._id);
                            const map = {};
                            rec.records.forEach((r) => { map[r.studentId] = r.status; });
                            setAttendance(map);
                            setActiveTab("mark");
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
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
      )}
    </div>
  );
};

export default Attendance;