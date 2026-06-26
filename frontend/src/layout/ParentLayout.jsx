// src/layouts/ParentLayout.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Home,
  Users,
  FileText,
  CalendarCheck,
  BarChart3,
  CreditCard,
  MessageSquare,
  Bell,
  User,
  CircleHelp,
  UserCircle,
  HelpCircle,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Building2,
  LogOut,
  Search,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";

const HomeIcon = Home;
const ChildrenIcon = Users;
const ResultsIcon = FileText;
const AttendIcon = CalendarCheck;
const ChartIcon = BarChart3;
const FeesIcon = CreditCard;
const MsgIcon = MessageSquare;
const BellIcon = Bell;
const ProfileIcon = User;
const HelpIcon = CircleHelp;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// ─── Navigation ───────────────────────────────────────────────────────────────
// FIX 1: Unified nav data — single structure used by both sidebar render and search.
//         Changed keys from {to, label, badge} → {path, name, badge} so every
//         consumer (isActive, search filter, render) reads the same fields.
const NAV = [
  {
    section: "Overview",
    items: [
      { path: "/parent/dashboard",  name: "Dashboard",    icon: HomeIcon    },
      { path: "/parent/children",   name: "My Children",  icon: ChildrenIcon },
    ],
  },
  {
    section: "Academics",
    items: [
      { path: "/parent/children/1/results",     name: "Results",     icon: ResultsIcon },
      { path: "/parent/children/1/attendance",  name: "Attendance",  icon: AttendIcon  },
      { path: "/parent/children/1/performance", name: "Performance", icon: ChartIcon   },
    ],
  },
  {
    section: "Finance",
    items: [
      { path: "/parent/fees/pay", name: "Pay Fees", icon: FeesIcon },
    ],
  },
  {
    section: "Communication",
    items: [
      { path: "/parent/messages",      name: "Messages",      icon: MsgIcon  },
      { path: "/parent/notifications", name: "Notifications", icon: BellIcon, badge: 3 },
    ],
  },
  
];

// FIX 2: BOTTOM_NAV also uses {path, name} to be consistent with NAV
const BOTTOM_NAV = [
  { name: "Profile",        icon: UserCircle, path: "/parent/profile" },
  { name: "Help & Support", icon: HelpCircle, path: "/parent/help"    },
];

// Mock notifications — replace with real API later
const NOTIFICATIONS = [
  { id: 1, title: "Exam schedule released",  desc: "Mid-term: Nov 14–20",          time: "10m ago", dot: "#6366f1", unread: true  },
  { id: 2, title: "Fee payment due",         desc: "₹8,500 due by Nov 30",         time: "2h ago",  dot: "#ef4444", unread: true  },
  { id: 3, title: "Attendance alert",        desc: "Arjun below 75% threshold",    time: "1d ago",  dot: "#f59e0b", unread: false },
  { id: 4, title: "Result published",        desc: "Unit Test 2 marks available",  time: "2d ago",  dot: "#10b981", unread: false },
];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --sidebar-w:   256px;
    --topbar-h:    60px;
    --ink:         #0f172a;
    --ink2:        #475569;
    --ink3:        #94a3b8;
    --canvas:      #f8fafc;
    --surface:     #ffffff;
    --border:      #e2e8f0;
    --accent:      #c96b2e;
    --accent2:     #e8865a;
    --accent-glow: rgba(201,107,46,0.35);
    --green:       #10b981;
    --amber:       #f59e0b;
    --red:         #ef4444;
    --side-bg:     #0f172a;
    --side-text:   rgba(255,255,255,0.55);
    --side-active: #ffffff;
    --side-hover:  rgba(255,255,255,0.06);
    --side-border: rgba(255,255,255,0.08);
    --font:        'Plus Jakarta Sans', sans-serif;
    --mono:        'JetBrains Mono', monospace;
    --radius:      10px;
    --shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
    --shadow-md:   0 4px 16px rgba(0,0,0,0.08);
    --shadow-lg:   0 8px 32px rgba(0,0,0,0.14);
  }

  .pl-dark {
    --ink:     #f1f5f9;
    --ink2:    #94a3b8;
    --ink3:    #64748b;
    --canvas:  #020617;
    --surface: #0f172a;
    --border:  #1e293b;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); }

  /* ── Scrollbar ── */
  .pl-scroll::-webkit-scrollbar        { width: 4px; }
  .pl-scroll::-webkit-scrollbar-track  { background: transparent; }
  .pl-scroll::-webkit-scrollbar-thumb  { background: var(--side-border); border-radius: 4px; }

  /* ── Sidebar ── */
  .pl-sidebar {
    position: fixed; top: 0; left: 0; z-index: 50;
    width: var(--sidebar-w); height: 100vh;
    background: var(--side-bg);
    border-right: 1px solid var(--side-border);
    display: flex; flex-direction: column;
    transition: transform 0.25s cubic-bezier(.4,0,.2,1);
  }
  .pl-sidebar.closed { transform: translateX(-100%); }

  /* ── Sidebar header ── */
  .pl-side-header {
    height: var(--topbar-h);
    display: flex; align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid var(--side-border);
    flex-shrink: 0;
  }

  /* ── Nav item ── */
  .pl-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: 8px;
    font-size: 13.5px; font-weight: 500;
    color: var(--side-text);
    background: transparent; border: none;
    width: 100%; text-align: left;
    cursor: pointer; transition: all 0.15s ease;
    position: relative; user-select: none;
  }
  .pl-nav-item:hover { background: var(--side-hover); color: #fff; }
  .pl-nav-item.active {
    background: rgba(201,107,46,0.18);
    color: var(--side-active);
    font-weight: 600;
  }
  .pl-nav-item.active::before {
    content: '';
    position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 18px; border-radius: 0 3px 3px 0;
    background: var(--accent2);
  }
  .pl-nav-item .pl-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.65; transition: opacity 0.15s; }
  .pl-nav-item:hover .pl-icon,
  .pl-nav-item.active .pl-icon { opacity: 1; }

  .pl-section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: rgba(255,255,255,0.25);
    padding: 0 12px; margin-bottom: 4px;
  }

  /* ── Top bar ── */
  .pl-topbar {
    position: fixed; top: 0; right: 0; z-index: 40;
    height: var(--topbar-h);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 20px; gap: 12px;
    transition: left 0.25s cubic-bezier(.4,0,.2,1);
    backdrop-filter: blur(8px);
  }

  /* ── Search ── */
  .pl-search-wrap { position: relative; flex: 1; max-width: 340px; }
  .pl-search-wrap input {
    width: 100%; height: 36px;
    padding: 0 12px 0 36px;
    border: 1px solid var(--border); border-radius: 8px;
    background: var(--canvas); color: var(--ink);
    font-family: var(--font); font-size: 13px;
    outline: none; transition: all 0.15s;
  }
  .pl-search-wrap input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(201,107,46,0.12);
  }
  .pl-search-wrap input::placeholder { color: var(--ink3); }
  .pl-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink3); }

  /* ── Search results ── */
  .pl-search-results {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; box-shadow: var(--shadow-lg);
    overflow: hidden; z-index: 100;
    animation: pl-pop 0.12s ease;
  }
  .pl-search-result-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; cursor: pointer;
    font-size: 13px; color: var(--ink);
    border: none; background: transparent; width: 100%; text-align: left;
    transition: background 0.1s;
  }
  .pl-search-result-item:hover { background: var(--canvas); }

  /* ── Icon button ── */
  .pl-icon-btn {
    position: relative; width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; cursor: pointer;
    color: var(--ink2); transition: all 0.15s;
  }
  .pl-icon-btn:hover { background: var(--canvas); color: var(--ink); }

  .pl-notif-dot {
    position: absolute; top: 4px; right: 4px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--red); border: 1.5px solid var(--surface);
  }

  /* ── Dropdown ── */
  .pl-dropdown {
    position: absolute; right: 0; top: calc(100% + 8px);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; box-shadow: var(--shadow-lg);
    overflow: hidden; animation: pl-pop 0.15s ease; z-index: 60;
  }
  @keyframes pl-pop {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Avatar ── */
  .pl-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #c96b2e, #e8865a);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .pl-avatar-lg {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #c96b2e, #e8865a);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: white;
    flex-shrink: 0;
  }

  /* ── Sidebar user card ── */
  .pl-side-user {
    padding: 12px 14px;
    border-top: 1px solid var(--side-border);
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0;
  }

  /* ── Overlay ── */
  .pl-overlay {
    position: fixed; inset: 0; z-index: 45;
    background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);
    animation: pl-fade 0.2s ease;
  }
  @keyframes pl-fade { from { opacity: 0; } to { opacity: 1; } }

  /* ── Kbd hint ── */
  .pl-kbd {
    font-family: var(--mono); font-size: 10px;
    padding: 2px 5px; background: var(--canvas);
    border: 1px solid var(--border); border-radius: 4px; color: var(--ink3);
  }

  /* ── Main ── */
  .pl-main {
    padding-top: var(--topbar-h);
    min-height: 100vh;
    background: var(--canvas);
    transition: margin-left 0.25s cubic-bezier(.4,0,.2,1);
  }

  /* ── Breadcrumb bar ── */
  .pl-breadcrumb {
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    display: flex; align-items: center; gap: 6px;
  }

  /* ── Badge ── */
  .pl-badge-due  { background: rgba(239,68,68,0.12);  color: #ef4444; }
  .pl-badge-num  { background: rgba(201,107,46,0.15); color: #c96b2e; }
  .pl-badge-new  { background: rgba(16,185,129,0.12); color: #10b981; }
  .pl-badge {
    font-size: 10px; font-weight: 700;
    padding: 1px 6px; border-radius: 5px;
    margin-left: auto; flex-shrink: 0;
  }

  /* ── School loading shimmer ── */
  @keyframes pl-shimmer {
    0%   { opacity: 0.4; }
    50%  { opacity: 0.9; }
    100% { opacity: 0.4; }
  }
  .pl-shimmer { animation: pl-shimmer 1.4s ease-in-out infinite; }

  @media (max-width: 768px) {
    .pl-sidebar  { z-index: 50; }
    .pl-topbar   { left: 0 !important; }
    .pl-main     { margin-left: 0 !important; }
    .pl-profile-text { display: none !important; }
  }
  @media (min-width: 769px) {
    .pl-overlay  { display: none !important; }
    .pl-profile-text { display: block !important; }
  }
`;

// ─── NavBadge ─────────────────────────────────────────────────────────────────
function NavBadge({ label }) {
  const cls =
    label === "Due" ? "pl-badge pl-badge-due"
    : !isNaN(Number(label)) ? "pl-badge pl-badge-num"
    : "pl-badge pl-badge-new";
  return <span className={cls}>{label}</span>;
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
function Breadcrumbs({ path, onNavigate }) {
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((seg, i, arr) => ({
      label: seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + arr.slice(0, i + 1).join("/"),
    }));

  return (
    <>
      {segments.map((seg, i) => (
        <React.Fragment key={seg.href}>
          {i > 0 && <ChevronRight size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />}
          {i === segments.length - 1 ? (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              {seg.label}
            </span>
          ) : (
            <button
              onClick={() => onNavigate(seg.href)}
              style={{
                fontSize: 13, fontWeight: 500, color: "var(--ink3)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink3)")}
            >
              {seg.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function ParentLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  // ── Derived user values ────────────────────────────────────────────────────
  const userName     = user?.name || "Parent";
  const userEmail    = user?.email || "";
  const userInitials = userName
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // ── School name state ──────────────────────────────────────────────────────
  const [schoolName,    setSchoolName]    = useState(
    user?.schoolId?.name || user?.school?.name || null
  );
  const [schoolLoading, setSchoolLoading] = useState(!schoolName);

  useEffect(() => {
    if (schoolName) { setSchoolLoading(false); return; }

    const code =
      user?.schoolCode ||
      (typeof user?.schoolId === "string" ? user.schoolId : null);

    if (!code) { setSchoolName("Parent Portal"); setSchoolLoading(false); return; }

    setSchoolLoading(true);
    fetch(`${API_BASE}/schools/by-code/${encodeURIComponent(code)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const name = data?.school?.name || data?.name;
        setSchoolName(name || "Parent Portal");
      })
      .catch(() => setSchoolName("Parent Portal"))
      .finally(() => setSchoolLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolCode, user?.schoolId]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [sideOpen,    setSideOpen]    = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [search,      setSearch]      = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  const profileRef     = useRef(null);
  const notifRef       = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (window.innerWidth < 769) setSideOpen(false);
  }, [location.pathname]);

  // FIX 3: isActive now reads item.path (consistent with unified NAV structure)
  const isActive = useCallback(
    (path) =>
      location.pathname === path ||
      (path !== "/parent/dashboard" && location.pathname.startsWith(path)),
    [location.pathname]
  );

  const go = (path) => {
    navigate(path);
    setSearch("");
    setProfileOpen(false);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  // FIX 4: Search now uses NAV (correct variable name) and item.name (correct key)
  const searchResults = search.trim()
    ? NAV.flatMap((s) => s.items).filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className={darkMode ? "pl-dark" : ""} style={{ fontFamily: "var(--font)" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`pl-sidebar ${sideOpen ? "" : "closed"}`}>

        {/* Logo / School */}
        <div className="pl-side-header">
          <button
            onClick={() => go("/parent/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", width: "100%" }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #c96b2e, #e8865a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(201,107,46,0.45)",
            }}>
              <GraduationCap size={15} color="#fff" />
            </div>

            <div style={{ lineHeight: 1.2, minWidth: 0 }}>
              {schoolLoading ? (
                <div className="pl-shimmer" style={{ height: 13, width: 110, borderRadius: 4, background: "rgba(255,255,255,0.15)" }} />
              ) : (
                <div style={{
                  fontSize: 13, fontWeight: 800, color: "#fff",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: 160,
                }}>
                  {schoolName}
                </div>
              )}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                Parent Portal
              </div>
            </div>
          </button>
        </div>

        {/* Nav sections */}
        {/* FIX 5: Uses NAV (correct variable) and group.items / item.path / item.name (correct keys) */}
        <div className="pl-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          {NAV.map((group) => (
            <div key={group.section} style={{ marginBottom: 20 }}>
              <div className="pl-section-title">{group.section}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={`pl-nav-item ${isActive(item.path) ? "active" : ""}`}
                  >
                    <item.icon className="pl-icon" size={16} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {item.badge != null && <NavBadge label={String(item.badge)} />}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom links */}
          <div style={{ borderTop: "1px solid var(--side-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 1 }}>
            {BOTTOM_NAV.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`pl-nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <item.icon className="pl-icon" size={16} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User card */}
        <div className="pl-side-user">
          <div className="pl-avatar-lg">{userInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: "var(--side-text)" }}>Parent</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "rgba(255,255,255,0.3)", transition: "color 0.15s", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div className="pl-overlay" onClick={() => setSideOpen(false)} />
      )}

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header
        className="pl-topbar"
        style={{ left: sideOpen ? "var(--sidebar-w)" : 0 }}
      >
        {/* Hamburger */}
        <button
          className="pl-icon-btn"
          onClick={() => setSideOpen(!sideOpen)}
          title="Toggle sidebar"
        >
          {sideOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Search */}
        <div className="pl-search-wrap" style={{ position: "relative" }}>
          <Search className="pl-search-icon" size={14} />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            placeholder="Search pages…"
          />
          {!search && (
            <span className="pl-kbd" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
              ⌘K
            </span>
          )}
          {/* FIX 6: Search results now correctly use item.name and item.path */}
          {searchFocus && searchResults.length > 0 && (
            <div className="pl-search-results">
              {searchResults.map((item) => (
                <button
                  key={item.path}
                  className="pl-search-result-item"
                  onMouseDown={() => go(item.path)}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(201,107,46,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.icon size={14} color="#c96b2e" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{item.name}</span>
                  <ChevronRight size={13} color="var(--ink3)" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Dark mode toggle */}
        <button
          className="pl-icon-btn"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle theme"
        >
          {darkMode
            ? <Sun size={16} color="#f59e0b" />
            : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            className="pl-icon-btn"
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="pl-notif-dot" />}
          </button>

          {notifOpen && (
            <div className="pl-dropdown" style={{ width: 316 }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Notifications</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", background: "rgba(201,107,46,0.1)", color: "#c96b2e", borderRadius: 20 }}>
                  {unreadCount} new
                </span>
              </div>

              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)", background: n.unread ? "rgba(201,107,46,0.03)" : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--canvas)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.unread ? "rgba(201,107,46,0.03)" : "transparent")}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.dot, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.desc}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink3)", flexShrink: 0, marginTop: 2 }}>{n.time}</div>
                </div>
              ))}

              <button
                onClick={() => { go("/parent/notifications"); setNotifOpen(false); }}
                style={{ width: "100%", padding: 12, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#c96b2e", background: "none", border: "none", cursor: "pointer" }}
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 8px 4px 4px",
              border: "1px solid var(--border)", borderRadius: 10,
              background: profileOpen ? "var(--canvas)" : "transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--canvas)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = profileOpen ? "var(--canvas)" : "transparent")}
          >
            <div className="pl-avatar">{userInitials}</div>
            <div className="pl-profile-text" style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>{userName}</div>
              <div style={{ fontSize: 11, color: "var(--ink3)" }}>Parent</div>
            </div>
            <ChevronDown
              size={14} color="var(--ink3)"
              style={{ transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
            />
          </button>

          {profileOpen && (
            <div className="pl-dropdown" style={{ width: 220 }}>
              <div style={{ padding: "14px 16px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{userName}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userEmail}
                </div>
                {schoolName && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, padding: "4px 8px", background: "rgba(201,107,46,0.08)", borderRadius: 6 }}>
                    <Building2 size={11} color="#c96b2e" />
                    <span style={{ fontSize: 11, color: "#c96b2e", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {schoolLoading ? "Loading…" : schoolName}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ padding: "4px 8px", borderTop: "1px solid var(--border)" }}>
                {[
                  { name: "My Profile",    path: "/parent/profile"       },
                  { name: "Notifications", path: "/parent/notifications" },
                  { name: "Help & Support",path: "/parent/help"          },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    style={{ width: "100%", textAlign: "left", padding: "8px 8px", borderRadius: 7, fontSize: 13, fontWeight: 500, color: "var(--ink)", background: "none", border: "none", cursor: "pointer", transition: "background 0.1s", display: "block" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--canvas)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {item.name}
                  </button>
                ))}

                <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />

                <button
                  onClick={handleLogout}
                  style={{ width: "100%", textAlign: "left", padding: "8px 8px", borderRadius: 7, fontSize: 13, fontWeight: 500, color: "#ef4444", background: "none", border: "none", cursor: "pointer", transition: "background 0.1s", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main
        className="pl-main"
        style={{ marginLeft: sideOpen ? "var(--sidebar-w)" : 0 }}
      >
        {/* Breadcrumb */}
        <div className="pl-breadcrumb">
          <Breadcrumbs path={location.pathname} onNavigate={go} />
        </div>

        {/* Page content */}
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}