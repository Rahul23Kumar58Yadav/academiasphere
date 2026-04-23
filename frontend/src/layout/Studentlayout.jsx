// src/layouts/StudentLayout.jsx
import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ClipboardList,
  UserCheck,
  Award,
  DollarSign,
  FileText,
  Library,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  User,
  ChevronDown,
  Sun,
  Moon,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const location = useLocation();
  const { user, logout } = useAuth();

  // ── Derived display values (safe fallbacks while user loads) ──────────────
  const displayName = user?.name || "Student";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const studentId = user?._id || user?.id || "";
  const email = user?.email || "";
  const role = user?.role
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
    : "Student";
  const schoolCode = user?.schoolCode || "";

  // ── Static notifications (replace with API call when ready) ───────────────
  const notifications = [
    {
      id: 1,
      title: "New Assignment Posted",
      message: "Mathematics Chapter 5 assignment",
      time: "10 mins ago",
      unread: true,
    },
    {
      id: 2,
      title: "Grade Published",
      message: "Physics Midterm results available",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "Fee Reminder",
      message: "Quarterly fees due in 5 days",
      time: "2 hours ago",
      unread: false,
    },
    {
      id: 4,
      title: "Library Book Due",
      message: 'Return "Advanced Mathematics" by Friday',
      time: "1 day ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const menuItems = [
    {
      path: "/student/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      path: "/student/courses",
      label: "My Courses",
      icon: BookOpen,
      badge: null,
    },
    {
      path: "/student/timetable",
      label: "Timetable",
      icon: Calendar,
      badge: null,
    },
    {
      path: "/student/assignments/pending",
      label: "Assignments",
      icon: ClipboardList,
      badge: 3,
    },
    {
      path: "/student/attendance",
      label: "My Attendance",
      icon: UserCheck,
      badge: null,
    },
    { path: "/student/results", label: "Results", icon: Award, badge: 2 },
    { path: "/student/fees/pay", label: "Fees", icon: DollarSign, badge: null },
    {
      path: "/student/certificates",
      label: "Certificates",
      icon: FileText,
      badge: null,
    },
    { path: "/student/library", label: "Library", icon: Library, badge: null },
  ];

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // ── Close dropdowns when clicking outside ─────────────────────────────────
  const closeDropdowns = () => {
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
  };

  const dm = darkMode; // shorthand

  return (
    <div
      className={`min-h-screen ${dm ? "dark bg-gray-900" : "bg-gray-50"}`}
      onClick={closeDropdowns}
    >
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b ${
          dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: hamburger + logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(!sidebarOpen);
                }}
                className={`p-2 rounded-lg lg:hidden ${dm ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-xl font-bold ${dm ? "text-white" : "text-gray-900"}`}
                  >
                    Student Portal
                  </h1>
                  <p
                    className={`text-xs ${dm ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Welcome back, {displayName.split(" ")[0]}!
                  </p>
                </div>
              </div>
            </div>

            {/* Center: search */}
            <div className="hidden md:block flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses, assignments..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    dm
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300"
                  }`}
                />
              </div>
            </div>

            {/* Right: dark-mode, help, notifications, profile */}
            <div className="flex items-center space-x-2">
              {/* Dark mode toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDarkMode(!dm);
                }}
                className={`p-2 rounded-lg ${dm ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                {dm ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Help */}
              <button
                className={`p-2 rounded-lg ${dm ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <HelpCircle
                  className={`w-5 h-5 ${dm ? "text-gray-400" : "text-gray-600"}`}
                />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className={`relative p-2 rounded-lg ${dm ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <Bell
                    className={`w-5 h-5 ${dm ? "text-gray-400" : "text-gray-600"}`}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl border z-50 ${
                      dm
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div
                      className={`p-4 border-b ${dm ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <h3
                        className={`font-semibold ${dm ? "text-white" : "text-gray-900"}`}
                      >
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 border-b cursor-pointer ${
                            dm
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-100 hover:bg-gray-50"
                          } ${n.unread && !dm ? "bg-blue-50" : ""}`}
                        >
                          <div className="flex items-start justify-between">
                            <p
                              className={`text-sm font-medium ${dm ? "text-white" : "text-gray-900"}`}
                            >
                              {n.title}
                            </p>
                            {n.unread && (
                              <span className="ml-2 mt-1 w-2 h-2 flex-shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p
                            className={`text-xs mt-1 ${dm ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`p-3 border-t ${dm ? "border-gray-700" : "border-gray-100"}`}
                    >
                      <button className="w-full text-sm text-blue-500 hover:text-blue-600 font-medium">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className={`flex items-center space-x-2 p-2 rounded-lg ${
                    dm ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {initials}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p
                      className={`text-sm font-semibold leading-tight ${dm ? "text-white" : "text-gray-900"}`}
                    >
                      {displayName}
                    </p>
                    <p
                      className={`text-xs leading-tight ${dm ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {role}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${dm ? "text-gray-400" : "text-gray-600"}`}
                  />
                </button>

                {profileDropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute right-0 mt-2 w-72 rounded-lg shadow-xl border z-50 ${
                      dm
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {/* Profile header */}
                    <div
                      className={`p-4 border-b ${dm ? "border-gray-700" : "border-gray-100"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {initials}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`font-semibold truncate ${dm ? "text-white" : "text-gray-900"}`}
                          >
                            {displayName}
                          </p>
                          <p
                            className={`text-xs truncate ${dm ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              {role}
                            </span>
                            {schoolCode && (
                              <span
                                className={`text-xs font-mono ${dm ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {schoolCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="p-2">
                      <Link
                        to="/student/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg ${
                          dm
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      <Link
                        to="/student/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg ${
                          dm
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <div
                        className={`my-1 border-t ${dm ? "border-gray-700" : "border-gray-100"}`}
                      />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-left text-red-500 ${
                          dm ? "hover:bg-gray-700" : "hover:bg-red-50"
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r z-40 overflow-y-auto transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                      : dm
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        active
                          ? "bg-white text-blue-600"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar user info card */}
          <div
            className={`mx-4 mb-4 p-4 rounded-xl border ${
              dm
                ? "bg-gray-700 border-gray-600"
                : "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100"
            }`}
          >
            <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-black/10">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${dm ? "text-white" : "text-gray-900"}`}
                >
                  {displayName}
                </p>
                <p
                  className={`text-xs truncate ${dm ? "text-gray-400" : "text-gray-500"}`}
                >
                  {email}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs ${dm ? "text-gray-400" : "text-gray-600"}`}
                >
                  Role
                </span>
                <span
                  className={`text-xs font-semibold ${dm ? "text-white" : "text-gray-800"}`}
                >
                  {role}
                </span>
              </div>
              {studentId && (
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs ${dm ? "text-gray-400" : "text-gray-600"}`}
                  >
                    ID
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold ${dm ? "text-white" : "text-gray-800"}`}
                  >
                    {String(studentId).slice(-8)}
                  </span>
                </div>
              )}
              {schoolCode && (
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs ${dm ? "text-gray-400" : "text-gray-600"}`}
                  >
                    School
                  </span>
                  <span
                    className={`text-xs font-mono font-bold tracking-wider ${dm ? "text-blue-300" : "text-blue-600"}`}
                  >
                    {schoolCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 lg:ml-64 p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default StudentLayout;
