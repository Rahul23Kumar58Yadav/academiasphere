import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Calendar,
  FileText,
  Award,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MessageSquare,
  BarChart3,
  PieChart,
  User,
  Mail,
   GraduationCap,  
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ─── Helper: derive initials from a full name ──────────────────────────────
function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notificationDropdown, setNotificationDropdown] = useState(false);

  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  // ── Derived display values ─────────────────────────────────────────────
  const displayName  = user?.name       || 'Teacher';
  const displayEmail = user?.email      || '';
  const displayRole  = user?.role
    ? user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Teacher';
  const initials     = getInitials(displayName);

  // subjects / classes can come from the auth user object or fall back to []
  const subjects = user?.subjects || (user?.subject ? [user.subject] : []);
  const classes  = user?.classes  || [];

  // ── Notifications (static for now — swap for API data when ready) ───────
  const notifications = [
    { id: 1, message: 'New assignment submission from Aarav Kumar', time: '5 min ago',  unread: true  },
    { id: 2, message: 'Parent-Teacher meeting scheduled for tomorrow', time: '1 hour ago', unread: true  },
    { id: 3, message: 'Grade 10-A attendance marked successfully',    time: '2 hours ago', unread: false },
    { id: 4, message: 'New message from Principal',                   time: '1 day ago',   unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  // ── Nav items ────────────────────────────────────────────────────────────
const menuItems = [
  { title: 'Dashboard',             icon: LayoutDashboard, path: '/teacher/dashboard',           badge: null },
  { title: 'My Students',           icon: Users,           path: '/teacher/students',            badge: null },
  { title: 'Attendance',            icon: ClipboardList,   path: '/teacher/attendance',          badge: null },
    { title: 'Create Assignments',           icon: BookOpen,        path: '/teacher/assignments/create', badge: '3'  },

  { title: 'Lesson Plans',          icon: FileText,        path: '/teacher/curriculum/lessons',  badge: null },
  { title: 'Grade Book',            icon: Award,           path: '/teacher/results/gradebook',   badge: null },
  { title: 'Schedule',              icon: Calendar,        path: '/teacher/schedule',            badge: null },
  { title: 'Messages',              icon: MessageSquare,   path: '/teacher/messages',            badge: '5'  },
  { title: 'Reports',               icon: BarChart3,       path: '/teacher/reports',             badge: null },
  { title: 'Performance Analytics', icon: PieChart,        path: '/teacher/classes/analytics',   badge: null },
  { title: 'My Classes',            icon: GraduationCap,   path: '/teacher/classes',              badge: null },
  { title: 'Result',                icon: ScrollText,      path: '/teacher/result',              badge: '5'  },
];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Left: Logo & Menu Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <Link to="/teacher/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  A
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">AcademySphere</h1>
                  <p className="text-xs text-gray-600">Teacher Portal</p>
                </div>
              </Link>
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-3">

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setNotificationDropdown(!notificationDropdown); setProfileDropdown(false); }}
                  className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {notificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${n.unread ? 'bg-blue-50' : ''}`}
                        >
                          <p className="text-sm text-gray-900">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200">
                      <Link to="/teacher/notifications" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setProfileDropdown(!profileDropdown); setNotificationDropdown(false); }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-600">{displayRole}</p>
                  </div>

                  {/* Avatar: profile image → initials */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold">{initials}</span>
                    )}
                  </div>

                  <ChevronDown size={16} className="text-gray-600" />
                </button>

                {profileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

                    {/* Profile header */}
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                          {user?.profileImage ? (
                            <img src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                          {displayEmail && (
                            <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                              <Mail size={11} />
                              {displayEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subject tags */}
                      {subjects.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {subjects.map((subject) => (
                            <span key={subject} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Extra meta (department / employee ID) */}
                      {(user?.department || user?.employeeId) && (
                        <p className="text-xs text-gray-500 mt-2">
                          {[user?.department, user?.employeeId ? `ID: ${user.employeeId}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>

                    <div className="py-2">
                      <Link
                        to="/teacher/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <User size={18} />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/teacher/settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <Settings size={18} />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full overflow-y-auto py-6 px-4">

          {/* Assigned classes info */}
          {classes.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-gray-600 mb-2">Assigned Classes</p>
              <div className="space-y-1">
                {classes.map((cls) => (
                  <div key={cls} className="text-sm font-semibold text-indigo-700">
                    {cls}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon   = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      active ? 'bg-white text-indigo-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/teacher/attendance')}
                className="w-full px-3 py-2 bg-white text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => navigate('/teacher/assignments/create')}
                className="w-full px-3 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
              >
                Create Assignment
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="lg:ml-64 bg-white border-t border-gray-200 py-4 px-6">
        <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-gray-600">
          <p>© 2025 AcademySphere. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/teacher/help"  className="hover:text-indigo-600">Help</Link>
            <Link to="/privacy"       className="hover:text-indigo-600">Privacy</Link>
            <Link to="/terms"         className="hover:text-indigo-600">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default TeacherLayout;