// src/pages/school-admin/SchoolAdminDashboard.jsx
// Fully dynamic — pulls real data from all existing backend APIs.
// Every stat, chart, and activity reflects live MongoDB data.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Award,
  AlertCircle,
  GraduationCap,
  Library,
  ClipboardList,
  BrainCircuit,
  FileText,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  UserX,
  BarChart3,
  Activity,
  Clock,
  Bell,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";

// ─── colour maps ──────────────────────────────────────────────────────────────
const bgLight = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  purple: "bg-purple-100",
  yellow: "bg-yellow-100",
  red: "bg-red-100",
  indigo: "bg-indigo-100",
};
const textCol = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  indigo: "text-indigo-600",
};
const strokeColor = {
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  yellow: "#f59e0b",
};

// Pie chart colours
const PIE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── tiny helpers ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000
    ? `₹${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `₹${(n / 1_000).toFixed(1)}K`
      : `₹${n}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const pctChange = (curr, prev) => {
  if (!prev) return { val: "—", pos: true };
  const d = Math.round(((curr - prev) / prev) * 100);
  return { val: `${d >= 0 ? "+" : ""}${d}%`, pos: d >= 0 };
};

// ─── Skeleton pulse ───────────────────────────────────────────────────────────
const Skel = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  // ── raw data state ────────────────────────────────────────────────────────
  const [studentCount, setStudentCount] = useState(null);
  const [teacherStats, setTeacherStats] = useState(null);
  const [classCount, setClassCount] = useState(null);
  const [feeDashboard, setFeeDashboard] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  // ── ui ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [errors, setErrors] = useState({});

  // ─── Fetch all dashboard data ─────────────────────────────────────────────
  const loadAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const errs = {};

      // 1. Student counts  — GET /api/v1/students/count
      try {
        const r = await authFetch("/students/count");
        const j = await r.json();
        if (j.success) setStudentCount(j.data);
      } catch {
        errs.students = true;
      }

      // 2. Teacher stats  — GET /api/v1/teachers/stats
      try {
        const r = await authFetch("/teachers/stats");
        const j = await r.json();
        if (j.success) setTeacherStats(j.stats);
      } catch {
        errs.teachers = true;
      }

      // 3. Classes  — GET /api/v1/classes
      try {
        const r = await authFetch("/classes?limit=200");
        const j = await r.json();
        if (j.success) setClassCount({ total: j.total, classes: j.classes });
      } catch {
        errs.classes = true;
      }

      // 4. Fee dashboard  — GET /api/v1/fees/dashboard
      try {
        const r = await authFetch("/fees/dashboard");
        const j = await r.json();
        if (j.success) setFeeDashboard(j.data);
      } catch {
        errs.fees = true;
      }

      // 5. Fee structures (for grade distribution)  — GET /api/v1/fees/structures
      try {
        const r = await authFetch("/fees/structures?isActive=true&limit=50");
        const j = await r.json();
        if (j.success) setFeeStructures(j.data || []);
      } catch {
        errs.feeStructures = true;
      }

      // 6. Attendance predictions (at-risk)  — GET /api/v1/attendance/admin/predictions
      try {
        const r = await authFetch("/attendance/admin/predictions");
        const j = await r.json();
        if (j.success) setAtRisk(j.data || []);
      } catch {
        errs.atRisk = true;
      }

      // 7. Attendance summary for the current month (today's date)
      //    Uses admin daily view for today  — GET /api/v1/attendance/admin/summary
      try {
        const now = new Date();
        const r = await authFetch(
          `/attendance/admin/overview?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
        );
        const j = await r.json();
        if (j.success && j.data?.dateWise?.length) {
          // Build last-7-days bar data
          const last7 = j.data.dateWise.slice(-7).map((d) => ({
            day: new Date(d.date).toLocaleDateString("en-IN", {
              weekday: "short",
            }),
            present: d.totalPresent || d.present,
            absent: d.totalAbsent || d.absent,
            late: d.totalLate || d.late,
          }));
          setAttendanceData(last7);
        }
      } catch {
        errs.attendance = true;
      }

      // 8. Upcoming calendar events  — GET /api/v1/calendar/upcoming?days=30
      try {
        const r = await authFetch("/calendar/upcoming?days=30");
        const j = await r.json();
        if (j.success) setRecentEvents((j.events || []).slice(0, 5));
      } catch {
        errs.events = true;
      }

      setErrors(errs);
      setLastFetched(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [authFetch],
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── derived stats ─────────────────────────────────────────────────────────
  const totalStudents = studentCount?.total ?? 0;
  const activeStudents = studentCount?.active ?? 0;
  const totalTeachers = teacherStats?.total ?? 0;
  const totalClasses = classCount?.total ?? 0;

  const totalCollected = feeDashboard?.totalCollected ?? 0;
  const totalPending = feeDashboard?.totalPending ?? 0;
  const totalDue = feeDashboard?.totalDue ?? 0;
  const collectionRate = feeDashboard?.collectionRate ?? 0;

  // Grade distribution from class list
  const gradeGroups = (() => {
    if (!classCount?.classes?.length) return [];
    const g = {};
    classCount.classes.forEach((c) => {
      const key = c.name;
      g[key] = (g[key] || 0) + 1; // count sections per grade
    });
    return Object.entries(g)
      .map(([name, value], i) => ({
        name,
        value,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
      .slice(0, 8);
  })();

  // Monthly fee collection trend from feeDashboard.monthlyTrend
  const monthlyTrend = (() => {
    if (!feeDashboard?.monthlyTrend?.length) return [];
    return feeDashboard.monthlyTrend.map((m) => ({
      month: MONTHS[m._id.month - 1] || `M${m._id.month}`,
      collected: m.amount,
      count: m.count,
    }));
  })();

  // Stats cards config (dynamic values)
  const statsCards = [
    {
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      sub: `${activeStudents.toLocaleString()} active`,
      change: studentCount?.newThisMonth
        ? `+${studentCount.newThisMonth} this month`
        : null,
      positive: true,
      icon: Users,
      color: "blue",
      path: "/school-admin/students",
      sparkline: studentCount?.gradeBreakdown?.map((g) => g.count) || [],
    },
    {
      title: "Total Teachers",
      value: totalTeachers.toLocaleString(),
      sub: teacherStats?.byDepartment?.length
        ? `${teacherStats.byDepartment.length} departments`
        : "across all depts",
      change: null,
      positive: true,
      icon: UserCheck,
      color: "green",
      path: "/school-admin/teachers",
      sparkline: teacherStats?.byDepartment?.map((d) => d.count) || [],
    },
    {
      title: "Active Classes",
      value: totalClasses.toLocaleString(),
      sub: classCount?.classes
        ? `${new Set(classCount.classes.map((c) => c.name)).size} grades`
        : "",
      change: null,
      positive: true,
      icon: GraduationCap,
      color: "purple",
      path: "/school-admin/classes",
      sparkline: gradeGroups.map((g) => g.value),
    },
    {
      title: "Fee Collection",
      value: fmt(totalCollected),
      sub: `${collectionRate}% collection rate`,
      change: totalPending > 0 ? `${fmt(totalPending)} pending` : null,
      positive: collectionRate >= 70,
      icon: DollarSign,
      color: "yellow",
      path: "/school-admin/fees/structure",
      sparkline: monthlyTrend.map((m) => m.collected / 1000),
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: "Enroll Student",
      icon: Users,
      color: "blue",
      path: "/school-admin/students/enroll",
    },
    {
      title: "Add Teacher",
      icon: UserCheck,
      color: "green",
      path: "/school-admin/teachers",
    },
    {
      title: "Mark Attendance",
      icon: ClipboardList,
      color: "purple",
      path: "/school-admin/attendance/mark",
    },
    {
      title: "Enter Results",
      icon: Award,
      color: "yellow",
      path: "/school-admin/results",
    },
    {
      title: "Manage Subjects",
      icon: Library,
      color: "red",
      path: "/school-admin/subjects",
    },
    {
      title: "Fee Structure",
      icon: DollarSign,
      color: "green",
      path: "/school-admin/fees/structure",
    },
    {
      title: "Curriculum",
      icon: BookOpen,
      color: "purple",
      path: "/school-admin/curriculum/builder",
    },
    {
      title: "AI Predictions",
      icon: BrainCircuit,
      color: "blue",
      path: "/school-admin/attendance/predictions",
    },
  ];

  // Fee status breakdown for a mini summary bar
  const feeStatusCounts = feeDashboard?.statusCounts ?? [];
  const paid = feeStatusCounts.find((s) => s._id === "paid")?.count ?? 0;
  const partial = feeStatusCounts.find((s) => s._id === "partial")?.count ?? 0;
  const pending = feeStatusCounts.find((s) => s._id === "pending")?.count ?? 0;
  const overdue = feeStatusCounts.find((s) => s._id === "overdue")?.count ?? 0;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
            Live school data
            {lastFetched && (
              <span className="text-gray-400">
                · updated{" "}
                {lastFetched.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {Object.keys(errors).length > 0 && (
              <span className="text-amber-500 flex items-center gap-1 text-xs">
                <AlertCircle className="w-3 h-3" />
                Some data unavailable
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => loadAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statsCards.map((stat, i) => (
          <button
            key={i}
            onClick={() => navigate(stat.path)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${bgLight[stat.color]}`}>
                <stat.icon className={`w-5 h-5 ${textCol[stat.color]}`} />
              </div>
              {stat.change && (
                <span
                  className={`flex items-center text-xs font-semibold ${stat.positive ? "text-emerald-600" : "text-rose-500"}`}
                >
                  {stat.positive ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  )}
                  {stat.change}
                </span>
              )}
            </div>

            {loading ? (
              <>
                <Skel className="h-8 w-24 mb-1" />
                <Skel className="h-4 w-32" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {stat.title}
                </p>
                {stat.sub && (
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                )}
              </>
            )}

            {/* Sparkline */}
            {stat.sparkline?.length > 1 && (
              <div className="h-12 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stat.sparkline.map((v, idx) => ({ x: idx, v }))}
                  >
                    <defs>
                      <linearGradient
                        id={`grad${i}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={strokeColor[stat.color]}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor={strokeColor[stat.color]}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="natural"
                      dataKey="v"
                      stroke={strokeColor[stat.color]}
                      strokeWidth={2.5}
                      fill={`url(#grad${i})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex items-center gap-1 mt-3 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              View details <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {/* ── Charts Row 1 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance — real data from /attendance/admin/summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Attendance Trend
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {attendanceData.length
                  ? `Last ${attendanceData.length} sessions (this month)`
                  : "No attendance records this month"}
              </p>
            </div>
            <button
              onClick={() => navigate("/school-admin/attendance/mark")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              View full →
            </button>
          </div>
          {loading ? (
            <Skel className="h-52 w-full" />
          ) : attendanceData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-gray-300 gap-2">
              <BarChart3 className="w-10 h-10" />
              <p className="text-sm">No attendance data yet</p>
              <button
                onClick={() => navigate("/school-admin/attendance/mark")}
                className="text-xs text-blue-500 hover:underline mt-1"
              >
                Mark attendance →
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                  }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="present"
                  name="Present"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="absent"
                  name="Absent"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="late"
                  name="Late"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fee Collection Trend — real data from /fees/dashboard monthlyTrend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Fee Collection Trend
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Monthly payments (last 6 months)
              </p>
            </div>
            <button
              onClick={() => navigate("/school-admin/fees/structure")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Manage fees →
            </button>
          </div>
          {loading ? (
            <Skel className="h-52 w-full" />
          ) : monthlyTrend.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-gray-300 gap-2">
              <DollarSign className="w-10 h-10" />
              <p className="text-sm">No payments recorded yet</p>
              <button
                onClick={() => navigate("/school-admin/fees/structure")}
                className="text-xs text-blue-500 hover:underline mt-1"
              >
                Set up fee structures →
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(v) => [`₹${(v / 1000).toFixed(1)}K`, "Collected"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                  }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="Collected"
                  stroke="#3b82f6"
                  fill="url(#gCollected)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Charts Row 2 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Class / Grade Distribution — from /classes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Grade Distribution
            </h3>
            <button
              onClick={() => navigate("/school-admin/classes")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              All classes →
            </button>
          </div>
          {loading ? (
            <Skel className="h-48 w-full" />
          ) : gradeGroups.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300 gap-2">
              <GraduationCap className="w-10 h-10" />
              <p className="text-sm">No classes created yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={gradeGroups}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {gradeGroups.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [
                      `${v} section${v !== 1 ? "s" : ""}`,
                      n,
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "none",
                      boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {gradeGroups.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] text-gray-500 truncate">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fee Status Summary — from /fees/dashboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Fee Payment Status
            </h3>
            <button
              onClick={() => navigate("/school-admin/fees/structure")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Manage →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skel key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Big collection rate ring */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke={
                        collectionRate >= 70
                          ? "#10b981"
                          : collectionRate >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${collectionRate} ${100 - collectionRate}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">
                      {collectionRate}%
                    </span>
                    <span className="text-[10px] text-gray-400">collected</span>
                  </div>
                </div>
              </div>

              {/* Status chips */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Paid",
                    count: paid,
                    cls: "bg-emerald-50 text-emerald-700",
                  },
                  {
                    label: "Partial",
                    count: partial,
                    cls: "bg-amber-50  text-amber-700",
                  },
                  {
                    label: "Pending",
                    count: pending,
                    cls: "bg-slate-100  text-slate-600",
                  },
                  {
                    label: "Overdue",
                    count: overdue,
                    cls: "bg-red-50    text-red-700",
                  },
                ].map(({ label, count, cls }) => (
                  <div
                    key={label}
                    className={`rounded-xl p-3 text-center ${cls}`}
                  >
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs font-semibold">{label}</p>
                  </div>
                ))}
              </div>

              {/* Total summary */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                <span>
                  Due:{" "}
                  <strong className="text-gray-700">{fmt(totalDue)}</strong>
                </span>
                <span>
                  Collected:{" "}
                  <strong className="text-emerald-700">
                    {fmt(totalCollected)}
                  </strong>
                </span>
                <span>
                  Pending:{" "}
                  <strong className="text-red-600">{fmt(totalPending)}</strong>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:shadow-md transition-all text-center"
              >
                <div
                  className={`p-2 rounded-lg ${bgLight[action.color]} group-hover:scale-110 transition-transform`}
                >
                  <action.icon className={`w-4 h-4 ${textCol[action.color]}`} />
                </div>
                <span className="text-[10px] font-semibold text-gray-600 group-hover:text-blue-600 leading-tight">
                  {action.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* At-Risk Students — from /attendance/admin/predictions */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                At-Risk Students
                {atRisk.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-semibold">
                    {atRisk.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Students with attendance below 85%
              </p>
            </div>
            <button
              onClick={() => navigate("/school-admin/attendance/predictions")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skel key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : atRisk.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300 gap-2">
              <CheckCircle className="w-12 h-12 text-emerald-300" />
              <p className="text-sm text-emerald-600 font-medium">
                All students above 85% attendance!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Student",
                      "Grade",
                      "Attendance",
                      "Risk",
                      "Days Needed",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atRisk.slice(0, 6).map((s) => {
                    const pct = s.attendanceSummary?.percentage ?? 0;
                    const riskCls =
                      s.riskLevel === "critical"
                        ? "bg-red-100 text-red-700"
                        : s.riskLevel === "high"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700";
                    return (
                      <tr
                        key={s._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
                              {`${s.firstName} ${s.lastName}`.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900 text-xs">
                              {s.firstName} {s.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {s.grade}
                          {s.section ? `-${s.section}` : ""}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-red-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-red-600">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${riskCls}`}
                          >
                            {s.riskLevel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">
                          {s.daysNeededFor75 > 0
                            ? `${s.daysNeededFor75} days for 75%`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Events — from /calendar/upcoming */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Upcoming Events
            </h3>
            <button
              onClick={() => navigate("/school-admin/curriculum/calendar")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Calendar →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skel key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
              <Calendar className="w-10 h-10" />
              <p className="text-sm">No upcoming events</p>
              <button
                onClick={() => navigate("/school-admin/curriculum/calendar")}
                className="text-xs text-blue-500 hover:underline mt-1"
              >
                Add event →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((ev) => {
                const catColorMap = {
                  exam: "bg-red-100 text-red-600",
                  holiday: "bg-green-100 text-green-600",
                  meeting: "bg-purple-100 text-purple-600",
                  sports: "bg-orange-100 text-orange-600",
                  academic: "bg-indigo-100 text-indigo-600",
                  event: "bg-blue-100 text-blue-600",
                };
                const cls =
                  catColorMap[ev.category] || "bg-blue-100 text-blue-600";
                return (
                  <div
                    key={ev._id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-default"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${cls}`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ev.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ev.startDate}
                      </p>
                      {ev.location && (
                        <p className="text-xs text-gray-400 truncate">
                          {ev.location}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${cls}`}
                    >
                      {ev.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Nav shortcuts */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Jump to
            </p>
            {[
              {
                label: "Subjects",
                path: "/school-admin/subjects",
                icon: Library,
              },
              {
                label: "AI Predictions",
                path: "/school-admin/attendance/predictions",
                icon: BrainCircuit,
              },
              {
                label: "Enter Results",
                path: "/school-admin/results",
                icon: FileText,
              },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
                <ArrowRight className="w-3 h-3 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Teacher Dept Breakdown ────────────────────────────────────────── */}
      {teacherStats?.byDepartment?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Teachers by Department
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Headcount across all active departments
              </p>
            </div>
            <button
              onClick={() => navigate("/school-admin/teachers")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              View all →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={teacherStats.byDepartment.slice(0, 10)}
              layout="vertical"
              barSize={12}
              margin={{ left: 90, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f5f5f5"
                horizontal={false}
              />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="_id"
                tick={{ fontSize: 11 }}
                width={85}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                }}
                itemStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="count"
                name="Teachers"
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
