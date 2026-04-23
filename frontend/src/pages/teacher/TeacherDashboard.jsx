// src/pages/teacher/TeacherDashboard.jsx
import React, { useState } from "react";
import {
  Users,
  ClipboardCheck,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  FileText,
  Bell,
} from "lucide-react";

// ─── Helper: status badge colour ──────────────────────────────────────────
function statusClass(status) {
  const map = {
    completed: "bg-green-100 text-green-800 border-green-200",
    ongoing:   "bg-blue-100 text-blue-800 border-blue-200",
    upcoming:  "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending:   "bg-orange-100 text-orange-800 border-orange-200",
    graded:    "bg-green-100 text-green-800 border-green-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function eventIcon(type) {
  return { meeting: "👥", exam: "📝", event: "🎯" }[type] ?? "📅";
}

function priorityClass(priority) {
  return (
    {
      high:   "border-l-4 border-red-500 bg-red-50",
      medium: "border-l-4 border-yellow-500 bg-yellow-50",
      low:    "border-l-4 border-blue-500 bg-blue-50",
    }[priority] ?? "border-l-4 border-gray-500 bg-gray-50"
  );
}

// ──────────────────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  // ── Stats ────────────────────────────────────────────────────────────────
  const [stats] = useState({
    totalStudents:       85,
    classesAssigned:      3,
    pendingAssignments:  12,
    todayClasses:         4,
    avgAttendance:     92.5,
    avgPerformance:    78.3,
  });

  // ── Schedule ─────────────────────────────────────────────────────────────
  const [todaySchedule] = useState([
    {
      id: 1,
      time: "08:00 AM - 08:45 AM",
      subject: "Mathematics",
      class: "Grade 10-A",
      room: "201",
      topic: "Quadratic Equations",
      status: "completed",
    },
    {
      id: 2,
      time: "09:00 AM - 09:45 AM",
      subject: "Science",
      class: "Grade 9-B",
      room: "305",
      topic: "Chemical Reactions",
      status: "ongoing",
    },
    {
      id: 3,
      time: "11:00 AM - 11:45 AM",
      subject: "Mathematics",
      class: "Grade 10-A",
      room: "201",
      topic: "Problem Solving",
      status: "upcoming",
    },
    {
      id: 4,
      time: "02:00 PM - 02:45 PM",
      subject: "Science",
      class: "Grade 9-B",
      room: "305",
      topic: "Lab Session",
      status: "upcoming",
    },
  ]);

  // ── Submissions ───────────────────────────────────────────────────────────
  const [recentSubmissions] = useState([
    {
      id: 1,
      studentName: "Aarav Kumar",
      class: "Grade 10-A",
      assignment: "Quadratic Equations - Chapter 4",
      subject: "Mathematics",
      submittedAt: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      studentName: "Diya Sharma",
      class: "Grade 9-B",
      assignment: "Chemical Reactions Lab Report",
      subject: "Science",
      submittedAt: "5 hours ago",
      status: "pending",
    },
    {
      id: 3,
      studentName: "Rohan Patel",
      class: "Grade 10-A",
      assignment: "Algebraic Expressions",
      subject: "Mathematics",
      submittedAt: "1 day ago",
      status: "graded",
    },
  ]);

  // ── Class Performance ─────────────────────────────────────────────────────
  const [classPerformance] = useState([
    {
      class: "Grade 10-A",
      subject: "Mathematics",
      students: 42,
      avgScore: 82.5,
      attendance: 94.2,
      trend: "up",
    },
    {
      class: "Grade 9-B",
      subject: "Science",
      students: 38,
      avgScore: 76.8,
      attendance: 91.5,
      trend: "up",
    },
    {
      class: "Grade 8-C",
      subject: "Mathematics",
      students: 35,
      avgScore: 74.2,
      attendance: 89.8,
      trend: "down",
    },
  ]);

  // ── Upcoming Events ───────────────────────────────────────────────────────
  const [upcomingEvents] = useState([
    {
      id: 1,
      title: "Parent-Teacher Meeting",
      date: "2025-12-22",
      time: "10:00 AM",
      type: "meeting",
      class: "Grade 10-A",
    },
    {
      id: 2,
      title: "Final Exam - Mathematics",
      date: "2025-12-28",
      time: "09:00 AM",
      type: "exam",
      class: "Grade 10-A",
    },
    {
      id: 3,
      title: "Science Fair Preparation",
      date: "2025-12-25",
      time: "02:00 PM",
      type: "event",
      class: "Grade 9-B",
    },
    {
      id: 4,
      title: "Staff Meeting",
      date: "2025-12-20",
      time: "04:00 PM",
      type: "meeting",
      class: "All",
    },
  ]);

  // ── Announcements ─────────────────────────────────────────────────────────
  const [announcements] = useState([
    {
      id: 1,
      title: "Winter Break Schedule",
      message: "School will be closed from Dec 25th to Jan 5th",
      date: "2025-12-15",
      priority: "high",
    },
    {
      id: 2,
      title: "Grade Submission Deadline",
      message: "All grades must be submitted by Dec 30th",
      date: "2025-12-14",
      priority: "medium",
    },
    {
      id: 3,
      title: "New Library Books",
      message: "Latest mathematics reference books available",
      date: "2025-12-10",
      priority: "low",
    },
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
          <p className="text-xs text-gray-500 mt-2">Across {stats.classesAssigned} classes</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Today
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Classes Today</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.todayClasses}</p>
          <p className="text-xs text-gray-500 mt-2">
            Next at{" "}
            {todaySchedule.find((s) => s.status === "upcoming")?.time.split(" - ")[0]}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              {stats.pendingAssignments}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Reviews</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingAssignments}</p>
          <p className="text-xs text-gray-500 mt-2">Assignments to grade</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck size={24} className="text-green-600" />
            </div>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Attendance</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.avgAttendance}%</p>
          <p className="text-xs text-green-600 mt-2">+2.3% from last month</p>
        </div>

      </div>

      {/* ── Schedule + Events ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-indigo-600" size={24} />
              Today's Schedule
            </h2>
            <button className="text-sm text-indigo-600 font-semibold hover:underline">
              View Full Schedule
            </button>
          </div>
          <div className="p-6 space-y-3">
            {todaySchedule.map((s) => (
              <div
                key={s.id}
                className={`p-4 rounded-xl border-2 hover:shadow-md transition-all ${statusClass(s.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.subject}</h3>
                    <p className="text-sm text-gray-600">
                      {s.class} · Room {s.room}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusClass(s.status)}`}>
                    {s.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">🕐 {s.time}</span>
                  <span className="text-gray-700 font-medium">{s.topic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} />
              Upcoming Events
            </h2>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex gap-3">
                  <div className="text-2xl">{eventIcon(ev.type)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{ev.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{ev.class}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      <span>
                        📅{" "}
                        {new Date(ev.date).toLocaleDateString("en-IN")}
                      </span>
                      <span>·</span>
                      <span>🕐 {ev.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Class Performance + Recent Submissions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Class Performance */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-green-600" size={24} />
              Class Performance
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {classPerformance.map((cls, i) => (
              <div
                key={i}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{cls.class}</h3>
                    <p className="text-sm text-gray-600">
                      {cls.subject} · {cls.students} students
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      cls.trend === "up"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cls.trend === "up" ? "↑ Improving" : "↓ Declining"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Average Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                          style={{ width: `${cls.avgScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {cls.avgScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Attendance</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                          style={{ width: `${cls.attendance}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {cls.attendance}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-orange-600" size={24} />
              Recent Submissions
            </h2>
            <button className="text-sm text-indigo-600 font-semibold hover:underline">
              View All
            </button>
          </div>
          <div className="p-6 space-y-3">
            {recentSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.studentName}</h3>
                    <p className="text-xs text-gray-600">{sub.class}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${statusClass(sub.status)}`}
                  >
                    {sub.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{sub.assignment}</p>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{sub.subject}</span>
                  <span>{sub.submittedAt}</span>
                </div>
                {sub.status === "pending" && (
                  <button className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    Grade Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Announcements ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-yellow-600" size={24} />
            Announcements
          </h2>
        </div>
        <div className="p-6 space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-xl ${priorityClass(a.priority)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <span className="text-xs text-gray-600">
                  {new Date(a.date).toLocaleDateString("en-IN")}
                </span>
              </div>
              <p className="text-sm text-gray-700">{a.message}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default TeacherDashboard;