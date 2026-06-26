import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  BarChart3,
  Search,
  Eye,
  RefreshCw,
  GraduationCap,
  Clock,
  ChevronRight,
  LayoutGrid,
  List,
  AlertTriangle,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import api from "../../services/api";

// ── helpers ───────────────────────────────────────────────────────────────────
const toArr = (data, ...keys) => {
  if (Array.isArray(data)) return data;
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k];
  return [];
};

// strip prefix ("Grade", "Class", "Std", "Standard") → bare number+section
// "Grade 10 - B" → "10-B"  |  "Class 10" → "10"  |  "Class 9 C" → "9-C"
const stripPrefix = (s) =>
  (s || "")
    .replace(/^(grade|class|std|standard|form)\s*/i, "")
    .replace(/\s*[-–—,]\s*/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .trim();

// extract just the numeric grade from a string
// "Grade 10-B" → "10"  |  "Class 9" → "9"  |  "10-B" → "10"
const extractGradeNum = (s) => {
  const m = (s || "").match(/\d+/);
  return m ? m[0] : null;
};

// extract section letter if present
// "Grade 10-B" → "b"  |  "Class 9 C" → "c"  |  "Class 10" → null
const extractSection = (s) => {
  // Look for a standalone letter after a number (with optional separator)
  const m = (s || "").match(/\d+[\s\-–—,]*([a-zA-Z])(?:\b|$)/);
  return m ? m[1].toLowerCase() : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// subjectMatchesClass
//
// Strategy (in order of precision):
// 1. Exact match on any of the generated keys
// 2. Strip-prefix match (number+section): "Class 10-B" === "Grade 10-B" → "10-b" === "10-b"
// 3. Grade-number-only match WITH section match (when subject has no section)
//    e.g. subject assigned to "Class 10", class is "Grade 10 - B"
//    → gradeNum "10" matches AND class section is known
//    → count it (subject assigned to whole grade, visible in each section)
// ─────────────────────────────────────────────────────────────────────────────
function subjectMatchesClass(subj, cls) {
  const clsGradeNum = extractGradeNum(cls.name);
  const clsSection = (cls.section || "").toLowerCase();

  return (subj.assignedClasses ?? []).some(({ className }) => {
    if (!className) return false;

    // ── 1. exact string match ─────────────────────────────────────────────
    const clsCandidates = buildExactKeys(cls);
    if (clsCandidates.some((k) => k.toLowerCase() === className.toLowerCase()))
      return true;

    // ── 2. strip-prefix + normalise match ─────────────────────────────────
    const strippedSubj = stripPrefix(className); // "10-b" or "10"
    const strippedCls = stripPrefix(`${cls.name}-${cls.section}`); // "10-b"
    if (strippedSubj && strippedSubj === strippedCls) return true;

    // Also match just-name stripped (no section in cls)
    const strippedClsNoSection = stripPrefix(cls.name); // "10"
    if (strippedSubj && strippedSubj === strippedClsNoSection) return true;

    // ── 3. grade-number + section logic ───────────────────────────────────
    const subjGradeNum = extractGradeNum(className);
    const subjSection = extractSection(className); // null if not specified

    if (!subjGradeNum || !clsGradeNum) return false;
    if (subjGradeNum !== clsGradeNum) return false;

    // grade numbers match — now check section
    if (subjSection === null) {
      // subject assigned to whole grade (e.g. "Class 10") → matches all sections
      return true;
    }
    // subject assigned to specific section — must match class section
    return clsSection && subjSection === clsSection;
  });
}

// Generate exact string candidates for a class
function buildExactKeys(cls) {
  const name = (cls.name || "").trim();
  const section = (cls.section || "").trim();
  const keys = new Set();

  if (name && section) {
    keys.add(`${name}-${section}`);
    keys.add(`${name} - ${section}`);
    keys.add(`${name} ${section}`);
    keys.add(`${name}, ${section}`);
    keys.add(`${name}${section}`);

    const num = extractGradeNum(name);
    if (num) {
      keys.add(`Class ${num}-${section}`);
      keys.add(`Class ${num} - ${section}`);
      keys.add(`Class ${num} ${section}`);
      keys.add(`Class ${num}${section}`);
      keys.add(`Grade ${num}-${section}`);
      keys.add(`Grade ${num} - ${section}`);
      keys.add(`Grade ${num} ${section}`);
    }
  }
  if (name) {
    keys.add(name);
    const num = extractGradeNum(name);
    if (num) {
      keys.add(`Class ${num}`);
      keys.add(`Grade ${num}`);
      keys.add(num);
    }
  }
  if (cls.displayName) keys.add(cls.displayName);
  return [...keys];
}

// ─────────────────────────────────────────────────────────────────────────────
function normaliseClass(cls, studentCountMap, allSubjects, examTypeCountMap) {
  const cs = cls.section ? `${cls.name}-${cls.section}` : cls.name;

  // students
 const gradeNum = extractGradeNum(cls.name);
const totalStudents =
  studentCountMap[cs] ??
  (gradeNum && cls.section
    ? studentCountMap[`${gradeNum}-${cls.section}`]
    : undefined) ??
  (cls.students ?? []).filter(s => s.isActive !== false).length;

  // subjects — match using number-aware logic
  const matchedSubjects = allSubjects.filter((s) =>
    subjectMatchesClass(s, cls),
  );
  const embeddedSubjects = cls.subjects ?? [];
  const totalSubjects =
    matchedSubjects.length > 0
      ? matchedSubjects.length
      : embeddedSubjects.length;

  const subjectNames =
    matchedSubjects.length > 0
      ? matchedSubjects.map((s) => s.name)
      : embeddedSubjects.map((s) => s.subjectName).filter(Boolean);

  // exam types
  const totalExamTypes = examTypeCountMap[cs] ?? 0;

  // label
  const subjectLabel =
    totalSubjects === 0
      ? "No subjects yet"
      : subjectNames.length > 0
        ? subjectNames.length === 1
          ? subjectNames[0]
          : `${subjectNames[0]} +${subjectNames.length - 1} more`
        : `${totalSubjects} subject${totalSubjects !== 1 ? "s" : ""}`;

  return {
    _id: cls._id,
    className: cls.displayName || `${cls.name} — ${cls.section}`,
    name: cls.name || "",
    section: cls.section || "",
    academicYear: cls.academicYear || "—",
    classSection: cs,
    totalStudents,
    totalSubjects,
    totalExamTypes,
    subjectLabel,
    subjectNames,
    classTeacherName: cls.classTeacherName || "",
    room: cls.room || "—",
    capacity: cls.capacity || 0,
    occupancy: cls.capacity
      ? Math.round((totalStudents / cls.capacity) * 100)
      : 0,
    isArchived: cls.isArchived ?? false,
    isPromoted: cls.isPromoted ?? false,
  };
}

// ── UI atoms ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, from, to }) {
  return (
    <div
      className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white shadow-md`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon size={22} className="opacity-90" />
        <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
          {sub}
        </span>
      </div>
      <p className="text-3xl font-extrabold leading-none">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}

function ClassCard({ cls, onView, onAnalytics }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all overflow-hidden group">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle,white 1px,transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold leading-tight">
              {cls.className}
            </h3>
            <p className="text-indigo-200 text-xs mt-0.5 truncate">
              {cls.subjectLabel}
            </p>
            {cls.classTeacherName && (
              <p className="text-indigo-300 text-[10px] mt-0.5 truncate">
                👤 {cls.classTeacherName}
              </p>
            )}
          </div>
          <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full flex-shrink-0">
            {cls.academicYear}
          </span>
        </div>

        {/* 3 dynamic counts */}
        <div className="relative grid grid-cols-3 gap-2 pt-4 border-t border-white/20">
          <div>
            <p className="text-indigo-200 text-[10px] uppercase tracking-wide flex items-center gap-1 mb-1">
              <Users size={9} /> Students
            </p>
            <p className="text-2xl font-extrabold">{cls.totalStudents}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-[10px] uppercase tracking-wide flex items-center gap-1 mb-1">
              <BookOpen size={9} /> Subjects
            </p>
            <p className="text-2xl font-extrabold">{cls.totalSubjects}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-[10px] uppercase tracking-wide flex items-center gap-1 mb-1">
              <BarChart3 size={9} /> Exam Types
            </p>
            <p className="text-2xl font-extrabold">{cls.totalExamTypes}</p>
            <p className="text-indigo-300 text-[10px]">configured</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* capacity bar */}
        {cls.capacity > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">Capacity</span>
              <span
                className={`text-xs font-bold ${
                  cls.occupancy >= 90
                    ? "text-red-500"
                    : cls.occupancy >= 70
                      ? "text-amber-500"
                      : "text-emerald-600"
                }`}
              >
                {cls.totalStudents} / {cls.capacity} ({cls.occupancy}%)
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  cls.occupancy >= 90
                    ? "bg-red-400"
                    : cls.occupancy >= 70
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(cls.occupancy, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* subject chips */}
        {cls.subjectNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cls.subjectNames.slice(0, 4).map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100"
              >
                {name}
              </span>
            ))}
            {cls.subjectNames.length > 4 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded-full">
                +{cls.subjectNames.length - 4}
              </span>
            )}
          </div>
        )}

        {/* meta */}
        <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-50">
          {cls.room !== "—" && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> Room {cls.room}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <GraduationCap size={11} /> {cls.classSection}
          </span>
        </div>

        {/* actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onView(cls._id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-semibold transition-colors"
          >
            <Eye size={14} /> View Class
          </button>
          <button
            onClick={() => onAnalytics(cls._id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 text-white text-sm rounded-xl hover:bg-violet-700 font-semibold transition-colors"
          >
            <BarChart3 size={14} /> Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassRow({ cls, onView, onAnalytics }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all p-4 flex items-center gap-4 group">
      <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <GraduationCap size={20} className="text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">
          {cls.className}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {cls.subjectLabel} · {cls.academicYear}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-5">
        {[
          {
            icon: Users,
            val: cls.totalStudents,
            label: "Students",
            color: "text-indigo-600",
          },
          {
            icon: BookOpen,
            val: cls.totalSubjects,
            label: "Subjects",
            color: "text-blue-600",
          },
          {
            icon: BarChart3,
            val: cls.totalExamTypes,
            label: "Exam Types",
            color: "text-violet-600",
          },
        ].map(({ icon: Icon, val, label, color }) => (
          <div key={label} className="text-center min-w-[64px]">
            <div className="flex items-center justify-center gap-1">
              <Icon size={11} className={color} />
              <p className={`font-extrabold text-sm ${color}`}>{val}</p>
            </div>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onView(cls._id)}
          className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-500 transition-colors"
        >
          <Eye size={15} />
        </button>
        <button
          onClick={() => onAnalytics(cls._id)}
          className="p-2 rounded-xl hover:bg-violet-50 text-violet-500 transition-colors"
        >
          <BarChart3 size={15} />
        </button>
        <ChevronRight
          size={15}
          className="text-slate-300 group-hover:text-indigo-400 transition-colors ml-1"
        />
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function MyClasses() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [rawClasses, setRawClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [studentCountMap, setStudentCountMap] = useState({});
  const [examTypeCountMap, setExamTypeCountMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filter, setFilter] = useState("all");

  const fetchClasses = useCallback(async () => {
    const res = await api.get("/classes");
    return toArr(res.data, "classes", "data");
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get("/subjects", { params: { limit: 500 } });
      return toArr(res.data, "subjects", "data");
    } catch (e) {
      console.warn("fetchSubjects failed:", e.response?.data ?? e.message);
      return [];
    }
  }, []);

  const fetchStudentCounts = useCallback(async () => {
    try {
      const res = await api.get("/students", {
        params: { status: "active", limit: 2000 },
      });
      const students = toArr(res.data, "students", "data");
      const map = {};
      students.forEach((s) => {
        const grade = s.grade || "";
        const section = s.section || "";
        const raw = s.class || "";
        const keys = new Set();
        if (raw) keys.add(raw);
        if (grade && section) {
          keys.add(`${grade}-${section}`);
          keys.add(`Grade ${grade}-${section}`);
          keys.add(`Class ${grade}-${section}`);
          keys.add(`Grade ${grade} - ${section}`);
        }
        keys.forEach((k) => (map[k] = (map[k] ?? 0) + 1));
      });
      return map;
    } catch (e) {
      console.warn("fetchStudentCounts failed:", e.response?.data ?? e.message);
      return {};
    }
  }, []);

  const fetchExamTypeCounts = useCallback(async () => {
    try {
      const res = await api.get("/exams");
      const list = toArr(res.data, "data", "exams");
      const map = {};
      list.forEach((et) => {
        if (et.classSection)
          map[et.classSection] = (map[et.classSection] ?? 0) + 1;
      });
      return map;
    } catch (e) {
      console.warn(
        "fetchExamTypeCounts failed:",
        e.response?.data ?? e.message,
      );
      return {};
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [classes, subjects, studMap, examMap] = await Promise.all([
        fetchClasses(),
        fetchSubjects(),
        fetchStudentCounts(),
        fetchExamTypeCounts(),
      ]);

      // Compact debug — shows match result only
      console.group("🔍 MyClasses match results");
      classes.forEach((c) => {
        const matched = subjects.filter((s) => subjectMatchesClass(s, c));
        console.log(
          `"${c.name} ${c.section}" →`,
          matched.length ? matched.map((s) => s.name) : "no subjects matched",
          "| subj assignedClasses sample:",
          subjects.map((s) => ({
            name: s.name,
            classes: (s.assignedClasses ?? []).map((ac) => ac.className),
          })),
        );
      });
      console.groupEnd();

      setRawClasses(classes);
      setAllSubjects(subjects);
      setStudentCountMap(studMap);
      setExamTypeCountMap(examMap);
    } catch (e) {
      console.error("MyClasses loadAll error:", e.response ?? e);
      setError(
        e.response?.data?.message || e.message || "Failed to load data.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchClasses, fetchSubjects, fetchStudentCounts, fetchExamTypeCounts]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const classes = rawClasses.map((c) =>
    normaliseClass(c, studentCountMap, allSubjects, examTypeCountMap),
  );
  const active = classes.filter((c) => !c.isArchived);
  const uniqueNames = [
    "all",
    ...new Set(rawClasses.map((c) => c.name).filter(Boolean)),
  ];

  const filtered = active
    .filter((c) => filter === "all" || c.name === filter)
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.className.toLowerCase().includes(q) ||
        c.subjectLabel.toLowerCase().includes(q) ||
        c.classTeacherName.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q)
      );
    });

  const totalStudents = active.reduce((s, c) => s + c.totalStudents, 0);
  const totalSubjects = active.reduce((s, c) => s + c.totalSubjects, 0);
  const totalExamTypes = active.reduce((s, c) => s + c.totalExamTypes, 0);

  const goView = (id) => navigate(`/school-admin/classes/${id}`);
  const goAnalytics = (id) => navigate(`/school-admin/classes/${id}`);

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              My Classes
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading
                ? "Loading…"
                : `${active.length} active class${active.length !== 1 ? "es" : ""} · ${totalStudents} students`}
            </p>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 font-semibold disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Classes"
          value={active.length}
          sub="Total"
          icon={GraduationCap}
          from="from-blue-500"
          to="to-blue-600"
        />
        <StatCard
          label="Total Students"
          value={totalStudents}
          sub="Enrolled"
          icon={Users}
          from="from-emerald-500"
          to="to-emerald-600"
        />
        <StatCard
          label="Total Subjects"
          value={totalSubjects}
          sub="Assigned"
          icon={BookOpen}
          from="from-violet-500"
          to="to-violet-600"
        />
        <StatCard
          label="Exam Types"
          value={totalExamTypes}
          sub="Configured"
          icon={BarChart3}
          from="from-orange-500"
          to="to-orange-600"
        />
      </div>

      {/* filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search class, subject, teacher…"
              className="pl-9 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          >
            {uniqueNames.map((n) => (
              <option key={n} value={n}>
                {n === "all" ? "All Classes" : n}
              </option>
            ))}
          </select>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            {[
              ["grid", LayoutGrid],
              ["list", List],
            ].map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2.5 transition-colors ${viewMode === mode ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 hover:bg-slate-50"}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw size={32} className="text-indigo-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading classes…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
          <AlertTriangle size={40} className="text-red-400" />
          <div>
            <p className="font-semibold text-slate-700">{error}</p>
            <p className="text-sm text-slate-400 mt-1">
              Check your connection and try again.
            </p>
          </div>
          <button
            onClick={loadAll}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-semibold"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <BookOpen size={44} className="text-slate-300" />
          <p className="font-semibold text-slate-600">
            {search || filter !== "all"
              ? "No matching classes"
              : "No classes found"}
          </p>
          <p className="text-sm text-slate-400">
            {search || filter !== "all"
              ? "Try a different search or filter."
              : "Create a class from the Classes section."}
          </p>
          {(search || filter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="px-4 py-2 border border-slate-200 text-sm rounded-xl hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cls) => (
            <ClassCard
              key={cls._id}
              cls={cls}
              onView={goView}
              onAnalytics={goAnalytics}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cls) => (
            <ClassRow
              key={cls._id}
              cls={cls}
              onView={goView}
              onAnalytics={goAnalytics}
            />
          ))}
        </div>
      )}
    </div>
  );
}
