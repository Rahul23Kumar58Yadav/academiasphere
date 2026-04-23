// src/pages/student/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Calendar, ClipboardList, CheckCircle, TrendingUp, Award,
  Clock, AlertCircle, BarChart3, DollarSign, Trophy, RefreshCw, Bell, ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading]           = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    // Replace this setTimeout block with a real API call, e.g.:
    // const res = await authFetch('/student/dashboard');
    // const data = await res.json();
    // setDashboardData(data);
    setTimeout(() => {
      setDashboardData({
        stats: {
          attendance: 92.5,
          gpa: 3.85,
          rank: 5,
          totalStudents: 120,
          pendingAssignments: 3,
          completedAssignments: 15,
          totalAssignments: 18,
        },
        upcomingClasses: [
          { id: 1, subject: "Mathematics", teacher: "Mr. Smith",    time: "09:00 AM", room: "Room 101", status: "next"     },
          { id: 2, subject: "Physics",     teacher: "Mrs. Johnson", time: "10:30 AM", room: "Lab 1",    status: "upcoming" },
          { id: 3, subject: "English",     teacher: "Ms. Brown",    time: "12:00 PM", room: "Room 203", status: "upcoming" },
        ],
        pendingAssignments: [
          { id: 1, subject: "Mathematics", title: "Chapter 5: Algebra Problems",   dueDate: "2024-04-15", points: 20, urgent: true  },
          { id: 2, subject: "Physics",     title: "Lab Report: Motion Experiment", dueDate: "2024-04-18", points: 30, urgent: false },
          { id: 3, subject: "English",     title: "Essay: Literary Analysis",      dueDate: "2024-04-20", points: 25, urgent: false },
        ],
        recentGrades: [
          { subject: "Mathematics", exam: "Midterm",  score: 92, grade: "A",  date: "2024-03-20" },
          { subject: "Physics",     exam: "Quiz 3",   score: 88, grade: "A-", date: "2024-03-18" },
          { subject: "English",     exam: "Essay 2",  score: 95, grade: "A+", date: "2024-03-15" },
          { subject: "History",     exam: "Test 2",   score: 85, grade: "B+", date: "2024-03-12" },
        ],
        subjectPerformance: [
          { subject: "Math",     score: 92 },
          { subject: "Physics",  score: 88 },
          { subject: "English",  score: 95 },
          { subject: "History",  score: 85 },
          { subject: "Comp Sci", score: 90 },
        ],
        attendanceTrend: [
          { month: "Sep", percentage: 95   },
          { month: "Oct", percentage: 93   },
          { month: "Nov", percentage: 94   },
          { month: "Dec", percentage: 90   },
          { month: "Jan", percentage: 91   },
          { month: "Feb", percentage: 92.5 },
        ],
        achievements: [
          { id: 1, title: "Perfect Attendance",  date: "Feb 2024", colorClass: "yellow" },
          { id: 2, title: "Top Scorer in Math",  date: "Jan 2024", colorClass: "blue"   },
          { id: 3, title: "Debate Champion",     date: "Dec 2023", colorClass: "purple" },
        ],
        announcements: [
          { id: 1, title: "Midterm Exams Schedule Released", message: "Check your timetable",              date: "2024-04-10", priority: "high"   },
          { id: 2, title: "Library New Books Available",     message: "Visit library to check new arrivals", date: "2024-04-08", priority: "normal" },
        ],
        fees: {
          total: 5000, paid: 3000, pending: 2000, dueDate: "2024-04-30",
        },
      });
      setLoading(false);
    }, 1000);
  };

  // ── Derived from AuthContext user ──────────────────────────────────────────
  const displayName = user?.name || "Student";
  const firstName   = displayName.split(" ")[0];
  // Academic fields — extend your User model + safeUser() to include these
  // when your backend returns them; they fall back gracefully until then.
  const studentClass  = user?.class   || user?.grade   || "";
  const section       = user?.section || "";
  const rollNo        = user?.rollNo  || user?.rollNumber || "";
  const schoolCode    = user?.schoolCode || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {firstName}! 👋
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-blue-100 text-sm">
              {studentClass && <span>{studentClass}</span>}
              {section      && <span>• Section {section}</span>}
              {rollNo       && <span>• Roll No: {rollNo}</span>}
              {schoolCode   && <span>• {schoolCode}</span>}
              {!studentClass && !rollNo && (
                <span>{user?.email}</span>
              )}
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm text-blue-100">Today's Date</p>
            <p className="text-xl font-semibold">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={CheckCircle} label="Attendance"  value={`${dashboardData.stats.attendance}%`} subtext="This semester"         color="green"  link="/student/attendance" />
        <StatCard icon={ClipboardList} label="Assignments" value={dashboardData.stats.pendingAssignments} subtext={`${dashboardData.stats.completedAssignments}/${dashboardData.stats.totalAssignments} completed`} color="blue" link="/student/assignments" />
        <StatCard icon={TrendingUp}  label="Current GPA" value={dashboardData.stats.gpa}              subtext="Excellent performance" color="purple" link="/student/results"    />
        <StatCard icon={Trophy}      label="Class Rank"  value={`#${dashboardData.stats.rank}`}       subtext={`of ${dashboardData.stats.totalStudents} students`} color="yellow" link="/student/results" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                Today's Schedule
              </h2>
              <Link to="/student/timetable" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                View Full <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.upcomingClasses.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    cls.status === "next"
                      ? "bg-blue-50 border-blue-500"
                      : "bg-gray-50 border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                        <p className="text-sm text-gray-600">{cls.teacher}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{cls.time}</p>
                      <p className="text-xs text-gray-600">{cls.room}</p>
                      {cls.status === "next" && (
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          Next Class
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Assignments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <ClipboardList className="w-6 h-6 mr-2 text-orange-600" />
                Pending Assignments
              </h2>
              <Link to="/student/assignments" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {assignment.subject}
                        </span>
                        {assignment.urgent && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" /> Due Soon
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" /> Due: {assignment.dueDate}
                        </span>
                        <span className="flex items-center">
                          <Award className="w-4 h-4 mr-1" /> {assignment.points} pts
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/student/assignments/submit"
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex-shrink-0"
                    >
                      Submit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={dashboardData.subjectPerformance}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dashboardData.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[80, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Sidebar column ──────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Recent Grades */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Recent Grades
              </h2>
              <Link to="/student/results" className="text-blue-600 hover:text-blue-700 text-sm">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.recentGrades.map((grade, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{grade.subject}</span>
                    <span
                      className={`px-2 py-1 rounded text-sm font-bold ${
                        grade.grade.startsWith("A")
                          ? "bg-green-100 text-green-700"
                          : grade.grade.startsWith("B")
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {grade.grade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{grade.exam}</span>
                    <span>{grade.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
              Achievements
            </h2>
            <div className="space-y-3">
              {dashboardData.achievements.map((achievement) => {
                const colorMap = {
                  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", icon: "text-yellow-600" },
                  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   icon: "text-blue-600"   },
                  purple: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-600" },
                };
                const c = colorMap[achievement.colorClass] || colorMap.blue;
                return (
                  <div key={achievement.id} className={`p-3 ${c.bg} rounded-lg border ${c.border}`}>
                    <div className="flex items-center space-x-3">
                      <Award className={`w-5 h-5 flex-shrink-0 ${c.icon}`} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.date}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fee Status */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Fee Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm opacity-90">Total:</span>
                <span className="font-semibold">${dashboardData.fees.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-90">Paid:</span>
                <span className="font-semibold">${dashboardData.fees.paid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-90">Pending:</span>
                <span className="font-bold text-xl">${dashboardData.fees.pending}</span>
              </div>

              {/* Payment progress bar */}
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${(dashboardData.fees.paid / dashboardData.fees.total) * 100}%` }}
                />
              </div>

              <div className="pt-2 border-t border-white/20">
                <p className="text-xs opacity-90 mb-2">Due: {dashboardData.fees.dueDate}</p>
                <Link
                  to="/student/fees"
                  className="block w-full py-2 bg-white text-orange-600 text-center rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Pay Now
                </Link>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Announcements
            </h2>
            <div className="space-y-3">
              {dashboardData.announcements.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg border ${
                    a.priority === "high"
                      ? "bg-red-50 border-red-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{a.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{a.message}</p>
                  <p className="text-xs text-gray-500">{a.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── StatCard helper ────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtext, color, link }) => {
  const colors = {
    green:  "from-green-500 to-emerald-600",
    blue:   "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    yellow: "from-yellow-500 to-orange-600",
  };
  return (
    <Link to={link} className="block">
      <div
        className={`bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Icon className="w-6 h-6" />
          </div>
          <ChevronRight className="w-5 h-5 opacity-75" />
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm opacity-90 font-medium">{label}</div>
        <div className="text-xs opacity-75 mt-1">{subtext}</div>
      </div>
    </Link>
  );
};

export default StudentDashboard;