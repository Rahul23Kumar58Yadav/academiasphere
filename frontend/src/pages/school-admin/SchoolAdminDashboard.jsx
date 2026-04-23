// src/pages/school-admin/SchoolAdminDashboard.jsx
import React, { useState } from "react";
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
  MoreVertical,
  GraduationCap,
  Library,
  ClipboardList,
  BrainCircuit,
  FileText,
  ArrowRight,
  RefreshCw,
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

// ─── static data ─────────────────────────────────────────────────────────────
const attendanceData = [
  { day: "Mon", present: 1150, absent: 97, late: 20 },
  { day: "Tue", present: 1180, absent: 67, late: 15 },
  { day: "Wed", present: 1200, absent: 47, late: 10 },
  { day: "Thu", present: 1170, absent: 77, late: 18 },
  { day: "Fri", present: 1100, absent: 147, late: 25 },
];

const revenueData = [
  { month: "Jan", tuition: 45000, activities: 5000 },
  { month: "Feb", tuition: 52000, activities: 6000 },
  { month: "Mar", tuition: 48000, activities: 5500 },
  { month: "Apr", tuition: 61000, activities: 7000 },
  { month: "May", tuition: 55000, activities: 6500 },
  { month: "Jun", tuition: 67000, activities: 8000 },
];

const classDistribution = [
  { name: "Grade 1–3", value: 420, color: "#3b82f6" },
  { name: "Grade 4–6", value: 385, color: "#8b5cf6" },
  { name: "Grade 7–9", value: 280, color: "#ec4899" },
  { name: "Grade 10–12", value: 162, color: "#f59e0b" },
];

const performanceData = [
  { subject: "Math", average: 85, previous: 82 },
  { subject: "Science", average: 88, previous: 86 },
  { subject: "English", average: 82, previous: 84 },
  { subject: "History", average: 79, previous: 77 },
  { subject: "Geography", average: 83, previous: 81 },
];

const recentActivities = [
  {
    id: 1,
    type: "enrollment",
    title: "New Student Enrolled",
    detail: "John Doe",
    time: "10 min ago",
    icon: Users,
    color: "blue",
  },
  {
    id: 2,
    type: "payment",
    title: "Fee Payment Received",
    detail: "Sarah Smith",
    time: "25 min ago",
    icon: DollarSign,
    color: "green",
  },
  {
    id: 3,
    type: "alert",
    title: "Low Attendance Alert",
    detail: "Grade 10-A",
    time: "1 hour ago",
    icon: AlertCircle,
    color: "red",
  },
  {
    id: 4,
    type: "achievement",
    title: "Top Performer",
    detail: "Emma Wilson",
    time: "2 hours ago",
    icon: Award,
    color: "yellow",
  },
  {
    id: 5,
    type: "leave",
    title: "Teacher Leave Request",
    detail: "Mr. Anderson",
    time: "3 hours ago",
    icon: Calendar,
    color: "purple",
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Parent-Teacher Meeting",
    date: "Mar 25, 2024",
    time: "10:00 AM",
  },
  {
    id: 2,
    title: "Mid-term Examinations",
    date: "Mar 28, 2024",
    time: "All Day",
  },
  { id: 3, title: "Sports Day", date: "Apr 5, 2024", time: "9:00 AM" },
];

// colour utilities
const bgLight = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  purple: "bg-purple-100",
  yellow: "bg-yellow-100",
  red: "bg-red-100",
};
const textCol = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
};

// ─── component ────────────────────────────────────────────────────────────────
const SchoolAdminDashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("week");

  // ── stats cards ───────────────────────────────────────────────────────────
  const statsCards = [
    {
      title: "Total Students",
      value: "1,247",
      change: "+12%",
      positive: true,
      icon: Users,
      color: "blue",
      path: "/school-admin/students",
      sparkline: [30, 45, 35, 50, 49, 60, 70],
    },
    {
      title: "Total Teachers",
      value: "89",
      change: "+3%",
      positive: true,
      icon: UserCheck,
      color: "green",
      path: "/school-admin/teachers",
      sparkline: [20, 25, 22, 28, 30, 35, 38],
    },
    {
      title: "Active Classes",
      value: "42",
      change: "0%",
      positive: true,
      icon: GraduationCap,
      color: "purple",
      path: "/school-admin/classes",
      sparkline: [15, 18, 16, 20, 19, 21, 21],
    },
    {
      title: "Fee Collection",
      value: "$124.5K",
      change: "-2%",
      positive: false,
      icon: DollarSign,
      color: "yellow",
      path: "/school-admin/fees/structure",
      sparkline: [80, 85, 82, 90, 88, 86, 84],
    },
  ];

  // ── quick actions ─────────────────────────────────────────────────────────
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
      path: "/school-admin/teachers/add",
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
      path: "/school-admin/results/enter",
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
      title: "Curriculum Builder",
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

  // ── sparkline colours (inline svg stroke) ────────────────────────────────
  const strokeColor = {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    yellow: "#f59e0b",
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
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
            </div>

            <p className="text-2xl font-bold text-gray-900 mb-0.5">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 font-medium">{stat.title}</p>

            {/* FIXED SPARKLINE */}
            <div className="h-12 mt-4">
              {" "}
              {/* Increased height + better container */}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stat.sparkline.map((v, idx) => ({ x: idx, v }))}
                >
                  <defs>
                    <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
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
                    type="natural" // smoother curve
                    dataKey="v"
                    stroke={strokeColor[stat.color]}
                    strokeWidth={2.5}
                    fill={`url(#grad${i})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-1 mt-3 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              View details <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Weekly Attendance
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Present / Absent / Late
              </p>
            </div>
            <button
              onClick={() => navigate("/school-admin/attendance/mark")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              View full →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
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
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Revenue Trends
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Tuition & activity fees
              </p>
            </div>
            <button
              onClick={() => navigate("/school-admin/fees/structure")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Manage fees →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gTuition" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="tuition"
                name="Tuition"
                stroke="#3b82f6"
                fill="url(#gTuition)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="activities"
                name="Activities"
                stroke="#8b5cf6"
                fill="url(#gAct)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Class Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Class Distribution
            </h3>
            <button
              onClick={() => navigate("/school-admin/classes")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              All classes →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={classDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {classDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [`${v} students`, n]}
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {classDistribution.map((item, i) => (
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
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Subject Performance
            </h3>
            <button
              onClick={() => navigate("/school-admin/results/analytics")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Full report →
            </button>
          </div>
          <div className="space-y-3.5">
            {performanceData.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {item.subject}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold ${item.average >= item.previous ? "text-emerald-600" : "text-rose-500"}`}
                    >
                      {item.average >= item.previous ? "▲" : "▼"}{" "}
                      {Math.abs(item.average - item.previous)}%
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {item.average}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${item.average}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
                className={`group flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:shadow-md transition-all text-center`}
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

      {/* ── Bottom Row: Activities + Events ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activities (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Activities
            </h3>
            <button
              onClick={() => navigate("/school-admin/notifications")}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentActivities.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default"
              >
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${bgLight[a.color]}`}
                >
                  <a.icon className={`w-4 h-4 ${textCol[a.color]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {a.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{a.detail}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {a.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events (1/3) */}
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
          <div className="space-y-3">
            {upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-default"
              >
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ev.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{ev.date}</p>
                  <p className="text-xs text-gray-400">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation shortcuts */}
          <div className={`mt-4 pt-4 border-t border-gray-100 space-y-1`}>
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
                path: "/school-admin/results/enter",
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
    </div>
  );
};

export default SchoolAdminDashboard;
