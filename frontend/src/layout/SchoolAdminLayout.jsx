// src/layouts/SchoolAdminLayout.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard, Users, UserCheck, BookOpen, Calendar,
  DollarSign, BarChart3, Settings, Bell, Search, Menu,
  LogOut, ChevronDown, MessageSquare, Award, FileText,
  TrendingUp, Shield, UserCircle, Library, GraduationCap,
  ClipboardList, BrainCircuit, HelpCircle, X, Zap,
  ChevronRight, Sun, Moon, Sparkles, Command,
} from "lucide-react";

// ─── Navigation structure ─────────────────────────────────────────────────────
const NAV = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard",       icon: LayoutDashboard, path: "/school-admin/dashboard" },
      { name: "Grade Analytics", icon: BarChart3,        path: "/school-admin/results/analytics", badge: "New" },
    ],
  },
  {
    section: "People",
    items: [
      { name: "Students",  icon: Users,        path: "/school-admin/students" },
      { name: "Teachers",  icon: UserCheck,    path: "/school-admin/teachers" },
      { name: "Classes",   icon: GraduationCap,path: "/school-admin/classes"  },
      { name: "Subjects",  icon: Library,      path: "/school-admin/subjects" },
    ],
  },
  {
    section: "Attendance",
    items: [
      { name: "Mark Attendance", icon: ClipboardList, path: "/school-admin/attendance/mark"        },
      { name: "AI Predictions",  icon: BrainCircuit,  path: "/school-admin/attendance/predictions", badge: "AI" },
    ],
  },
  {
    section: "Academic",
    items: [
      { name: "Enter Results",      icon: Award,    path: "/school-admin/results/enter"     },
      { name: "Curriculum Builder", icon: BookOpen, path: "/school-admin/curriculum/builder" },
      { name: "Academic Calendar",  icon: Calendar, path: "/school-admin/curriculum/calendar"},
    ],
  },
  {
    section: "Financial",
    items: [
      { name: "Fee Structure", icon: DollarSign, path: "/school-admin/fees/structure" },
    ],
  },
];

const NOTIFICATIONS = [
  { id: 1, title: "New enrollment request",  desc: "Riya Sharma – Grade 8A",  time: "2m ago",  dot: "#6366f1", unread: true  },
  { id: 2, title: "Fee payment received",    desc: "₹12,500 from Arjun Mehta",time: "1h ago",  dot: "#10b981", unread: true  },
  { id: 3, title: "Teacher leave request",   desc: "Priya Nair – 3 days",     time: "3h ago",  dot: "#f59e0b", unread: false },
  { id: 4, title: "Exam schedule published", desc: "Mid-term finals — Nov 12", time: "1d ago",  dot: "#3b82f6", unread: false },
];

// ─── Styles injected once ─────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --sidebar-w: 256px;
    --topbar-h: 60px;
    --ink:       #0f172a;
    --ink2:      #475569;
    --ink3:      #94a3b8;
    --canvas:    #f8fafc;
    --surface:   #ffffff;
    --border:    #e2e8f0;
    --accent:    #6366f1;
    --accent2:   #818cf8;
    --green:     #10b981;
    --amber:     #f59e0b;
    --red:       #ef4444;
    --side-bg:   #0f172a;
    --side-text: rgba(255,255,255,0.6);
    --side-active:#ffffff;
    --side-hover: rgba(255,255,255,0.06);
    --side-border: rgba(255,255,255,0.08);
    --font: 'Plus Jakarta Sans', sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --radius: 10px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
  }

  .dark-layout {
    --ink:    #f1f5f9;
    --ink2:   #94a3b8;
    --ink3:   #64748b;
    --canvas: #020617;
    --surface:#0f172a;
    --border: #1e293b;
  }

  * { box-sizing: border-box; }
  body { font-family: var(--font); }

  .sal-scrollbar::-webkit-scrollbar { width: 4px; }
  .sal-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .sal-scrollbar::-webkit-scrollbar-thumb { background: var(--side-border); border-radius: 4px; }

  /* Sidebar nav item */
  .sal-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: 8px;
    font-size: 13.5px; font-weight: 500;
    color: var(--side-text);
    cursor: pointer; transition: all 0.15s ease;
    position: relative; user-select: none;
    background: transparent; border: none; width: 100%; text-align: left;
  }
  .sal-nav-item:hover { background: var(--side-hover); color: #fff; }
  .sal-nav-item.active {
    background: rgba(99,102,241,0.18);
    color: var(--side-active);
    font-weight: 600;
  }
  .sal-nav-item.active::before {
    content: '';
    position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 18px; border-radius: 0 3px 3px 0;
    background: var(--accent2);
  }
  .sal-nav-item .sal-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.7; transition: opacity 0.15s; }
  .sal-nav-item:hover .sal-icon,
  .sal-nav-item.active .sal-icon { opacity: 1; }

  /* Top bar */
  .sal-topbar {
    position: fixed; top: 0; right: 0; left: 0; z-index: 40;
    height: var(--topbar-h);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 20px; gap: 12px;
    transition: left 0.25s ease;
    backdrop-filter: blur(8px);
  }

  /* Search */
  .sal-search-wrap { position: relative; flex: 1; max-width: 380px; }
  .sal-search-wrap input {
    width: 100%; height: 36px;
    padding: 0 12px 0 36px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--canvas);
    color: var(--ink);
    font-family: var(--font);
    font-size: 13px;
    outline: none; transition: all 0.15s;
  }
  .sal-search-wrap input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .sal-search-wrap input::placeholder { color: var(--ink3); }
  .sal-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink3); }

  /* Notif badge */
  .sal-notif-dot {
    position: absolute; top: 4px; right: 4px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--red); border: 1.5px solid var(--surface);
  }

  /* Dropdown */
  .sal-dropdown {
    position: absolute; right: 0; top: calc(100% + 8px);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    animation: sal-pop 0.15s ease;
    z-index: 60;
  }
  @keyframes sal-pop {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }

  /* Icon button */
  .sal-icon-btn {
    position: relative; width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; cursor: pointer;
    color: var(--ink2); transition: all 0.15s;
  }
  .sal-icon-btn:hover { background: var(--canvas); color: var(--ink); }

  /* Sidebar */
  .sal-sidebar {
    position: fixed; top: 0; left: 0; z-index: 50;
    width: var(--sidebar-w); height: 100vh;
    background: var(--side-bg);
    border-right: 1px solid var(--side-border);
    display: flex; flex-direction: column;
    transition: transform 0.25s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
  }
  .sal-sidebar.closed { transform: translateX(-100%); }

  .sal-sidebar-header {
    height: var(--topbar-h);
    display: flex; align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid var(--side-border);
    flex-shrink: 0;
  }

  .sal-section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: rgba(255,255,255,0.28);
    padding: 0 12px; margin-bottom: 4px;
  }

  /* Main */
  .sal-main {
    padding-top: var(--topbar-h);
    min-height: 100vh;
    background: var(--canvas);
    transition: margin-left 0.25s cubic-bezier(.4,0,.2,1);
  }

  /* Search results */
  .sal-search-results {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-lg);
    overflow: hidden; z-index: 100;
    animation: sal-pop 0.12s ease;
  }
  .sal-search-result-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; cursor: pointer;
    transition: background 0.1s;
    font-size: 13px; color: var(--ink);
    border: none; background: transparent; width: 100%; text-align: left;
  }
  .sal-search-result-item:hover { background: var(--canvas); }

  /* User avatar initials */
  .sal-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
    flex-shrink: 0;
  }

  /* Sidebar user card */
  .sal-sidebar-user {
    padding: 12px 14px;
    border-top: 1px solid var(--side-border);
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0;
  }
  .sal-sidebar-user-info { flex: 1; min-width: 0; }
  .sal-sidebar-user-name { font-size: 13px; font-weight: 600; color: #fff; truncate; }
  .sal-sidebar-user-role { font-size: 11px; color: var(--side-text); }

  /* Overlay */
  .sal-overlay {
    position: fixed; inset: 0; z-index: 45;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(2px);
    animation: sal-fade 0.2s ease;
  }
  @keyframes sal-fade { from { opacity: 0; } to { opacity: 1; } }

  /* Tooltip */
  .sal-kbd {
    font-family: var(--mono);
    font-size: 10px; padding: 2px 5px;
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: 4px; color: var(--ink3);
  }
`;

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavBadge({ label }) {
  const colors = {
    New: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
    AI:  { bg: "rgba(99,102,241,0.18)", color: "#818cf8" },
  };
  const c = colors[label] || { bg: "rgba(255,255,255,0.1)", color: "#fff" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "1px 6px",
      borderRadius: 5, background: c.bg, color: c.color,
      marginLeft: "auto", flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function NotifDot({ color }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      background: color, flexShrink: 0, marginTop: 4,
    }} />
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function SchoolAdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const [sideOpen,    setSideOpen]    = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [search,      setSearch]      = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const searchRef  = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const isActive = useCallback((path) =>
    location.pathname === path ||
    (path !== "/school-admin/dashboard" && location.pathname.startsWith(path))
  , [location.pathname]);

  const go = (path) => {
    navigate(path);
    setSearch("");
    setProfileOpen(false);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  // Search results
  const searchResults = search.trim()
    ? NAV.flatMap((s) => s.items).filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
  const userInitials = (user?.name || "A").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className={darkMode ? "dark-layout" : ""}
      style={{ fontFamily: "var(--font)" }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`sal-sidebar ${sideOpen ? "" : "closed"}`}>

        {/* Logo */}
        <div className="sal-sidebar-header">
          <button
            onClick={() => go("/school-admin/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
            }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                AcademySphere
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                School Management
              </div>
            </div>
          </button>
        </div>

        {/* Nav */}
        <div
          className="sal-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}
        >
          {NAV.map((group) => (
            <div key={group.section} style={{ marginBottom: 20 }}>
              <div className="sal-section-title">{group.section}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={`sal-nav-item ${isActive(item.path) ? "active" : ""}`}
                  >
                    <item.icon className="sal-icon" size={16} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {item.badge && <NavBadge label={item.badge} />}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom links */}
          <div style={{ borderTop: "1px solid var(--side-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              { name: "Settings",     icon: Settings,  path: "/school-admin/settings" },
              { name: "Help & Support", icon: HelpCircle, path: "/school-admin/help" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`sal-nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <item.icon className="sal-icon" size={16} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User card */}
        <div className="sal-sidebar-user">
          <div className="sal-avatar">{userInitials}</div>
          <div className="sal-sidebar-user-info">
            <div className="sal-sidebar-user-name" style={{
              fontSize: 13, fontWeight: 600, color: "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {user?.name || "School Admin"}
            </div>
            <div className="sal-sidebar-user-role">School Administrator</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, borderRadius: 6, color: "rgba(255,255,255,0.35)",
              transition: "color 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div
          className="sal-overlay"
          style={{ display: "none" }}  // shown via media query below
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header
        className="sal-topbar"
        style={{ left: sideOpen ? "var(--sidebar-w)" : 0 }}
      >
        {/* Hamburger */}
        <button
          className="sal-icon-btn"
          onClick={() => setSideOpen(!sideOpen)}
          title="Toggle sidebar"
        >
          {sideOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Search */}
        <div className="sal-search-wrap" ref={searchRef} style={{ position: "relative" }}>
          <Search className="sal-search-icon" size={14} />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            placeholder="Search pages…"
          />
          {!search && (
            <span className="sal-kbd" style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            }}>
              ⌘K
            </span>
          )}
          {searchFocus && searchResults.length > 0 && (
            <div className="sal-search-results">
              {searchResults.map((item) => (
                <button
                  key={item.path}
                  className="sal-search-result-item"
                  onMouseDown={() => go(item.path)}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: "rgba(99,102,241,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <item.icon size={14} color="#6366f1" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                    {item.name}
                  </span>
                  <ChevronRight size={13} color="var(--ink3)" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Dark mode */}
        <button
          className="sal-icon-btn"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle theme"
        >
          {darkMode
            ? <Sun size={16} color="#f59e0b" />
            : <Moon size={16} />
          }
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            className="sal-icon-btn"
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="sal-notif-dot" />}
          </button>

          {notifOpen && (
            <div className="sal-dropdown" style={{ width: 320 }}>
              {/* Header */}
              <div style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  Notifications
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px",
                  background: "rgba(99,102,241,0.1)", color: "#6366f1",
                  borderRadius: 20,
                }}>
                  {unreadCount} new
                </span>
              </div>

              {/* Items */}
              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex", gap: 10, padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    background: n.unread ? "rgba(99,102,241,0.03)" : "transparent",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.unread ? "rgba(99,102,241,0.03)" : "transparent"}
                >
                  <NotifDot color={n.dot} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {n.desc}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink3)", flexShrink: 0, marginTop: 2 }}>
                    {n.time}
                  </div>
                </div>
              ))}

              <button
                onClick={() => { go("/school-admin/notifications"); setNotifOpen(false); }}
                style={{
                  width: "100%", padding: "12px", textAlign: "center",
                  fontSize: 13, fontWeight: 600, color: "#6366f1",
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 8px 4px 4px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: profileOpen ? "var(--canvas)" : "transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas)"}
            onMouseLeave={(e) => e.currentTarget.style.background = profileOpen ? "var(--canvas)" : "transparent"}
          >
            <div className="sal-avatar">{userInitials}</div>
            <div style={{ textAlign: "left", display: "none" }} className="sal-profile-text">
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
                {user?.name || "Admin"}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink3)" }}>School Admin</div>
            </div>
            <ChevronDown
              size={14}
              color="var(--ink3)"
              style={{ transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
            />
          </button>

          {profileOpen && (
            <div className="sal-dropdown" style={{ width: 220 }}>
              <div style={{ padding: "14px 16px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                  {user?.name || "Admin"}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email || "admin@school.com"}
                </div>
              </div>

              <div style={{ padding: "4px 8px", borderTop: "1px solid var(--border)" }}>
                {[
                  { label: "My Profile",     path: "/school-admin/profile"       },
                  { label: "Notifications",  path: "/school-admin/notifications" },
                  { label: "Settings",       path: "/school-admin/settings"      },
                  { label: "Help & Support", path: "/school-admin/help"          },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    style={{
                      width: "100%", textAlign: "left", padding: "8px 8px",
                      borderRadius: 7, fontSize: 13, fontWeight: 500,
                      color: "var(--ink)", background: "none", border: "none",
                      cursor: "pointer", transition: "background 0.1s", display: "block",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    {item.label}
                  </button>
                ))}

                <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%", textAlign: "left", padding: "8px 8px",
                    borderRadius: 7, fontSize: 13, fontWeight: 500,
                    color: "#ef4444", background: "none", border: "none",
                    cursor: "pointer", transition: "background 0.1s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main
        className="sal-main"
        style={{ marginLeft: sideOpen ? "var(--sidebar-w)" : 0 }}
      >
        {/* Breadcrumb bar */}
        <div style={{
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Breadcrumbs path={location.pathname} go={go} />
        </div>

        {/* Page content */}
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      <style>{`
        @media (max-width: 768px) {
          .sal-sidebar { z-index: 50; }
          .sal-overlay { display: block !important; }
          .sal-topbar  { left: 0 !important; }
          .sal-main    { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .sal-overlay { display: none !important; }
          .sal-profile-text { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
function Breadcrumbs({ path, go }) {
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((seg, i, arr) => ({
      label: seg
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + arr.slice(0, i + 1).join("/"),
    }));

  return (
    <>
      {segments.map((seg, i) => (
        <React.Fragment key={seg.href}>
          {i > 0 && (
            <ChevronRight size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />
          )}
          {i === segments.length - 1 ? (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              {seg.label}
            </span>
          ) : (
            <button
              onClick={() => go(seg.href)}
              style={{
                fontSize: 13, fontWeight: 500, color: "var(--ink3)",
                background: "none", border: "none", cursor: "pointer",
                padding: 0, transition: "color 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink3)"}
            >
              {seg.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </>
  );
}