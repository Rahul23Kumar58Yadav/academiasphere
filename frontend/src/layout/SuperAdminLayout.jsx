// src/layouts/SuperAdminLayout.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchApplications,
} from "../services/superAdminApi";

// ─── Nav structure ────────────────────────────────────────────────────────────
const NAV = [
  {
    section: "OVERVIEW",
    items: [
      { to: "/super-admin/dashboard",            icon: "▣", label: "Dashboard",        badge: null             },
      { to: "/super-admin/analytics",            icon: "◈", label: "Analytics",        badge: null             },
    ],
  },
  {
    section: "INSTITUTIONS",
    items: [
      { to: "/super-admin/schools/applications", icon: "◎", label: "Applications",     badge: "applications"   },
      { to: "/super-admin/schools",              icon: "⬡", label: "Schools",          badge: null             },
      { to: "/super-admin/profile",      icon: "+", label: "School Profile",   badge: null             },
    ],
  },
  {
    section: "PEOPLE",
    items: [
      { to: "/super-admin/users",                icon: "⊞", label: "Manage Users",     badge: null             },
      { to: "/super-admin/users/roles",          icon: "◉", label: "Roles & Perms",    badge: null             },
    ],
  },
  {
    section: "PLATFORM",
    items: [
      { to: "/super-admin/fees",                 icon: "◈", label: "Fee Management",   badge: null             },
      { to: "/super-admin/ai/insights",          icon: "⟳", label: "AI Insights",      badge: null             },
      { to: "/super-admin/blockchain",           icon: "⬡", label: "Blockchain",       badge: null             },
      { to: "/super-admin/notifications",        icon: "◎", label: "Notifications",    badge: "notifications"  },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { to: "/super-admin/settings",             icon: "⊙", label: "Settings",         badge: null             },
      { to: "/super-admin/logs",                 icon: "≡", label: "System Logs",      badge: null             },
    ],
  },
];

const ALL_COMMANDS = NAV.flatMap((s) =>
  s.items.map((i) => ({ label: i.label, to: i.to, category: "Navigate" }))
).concat([
  { label: "My Profile",    to: "/super-admin/profile", category: "Navigate" },
  { label: "Help & Support",to: "/super-admin/help",    category: "Navigate" },
]);

const NOTIF_ICON = {
  application: "🏫",
  alert:       "⚠️",
  payment:     "💳",
  user:        "👤",
  system:      "📊",
  default:     "🔔",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  // ── Sidebar / UI state ─────────────────────────────────────────────────────
  const [sidebarMini,  setSidebarMini ] = useState(false);
  const [sidebarOpen,  setSidebarOpen ] = useState(false);
  const [cmdOpen,      setCmdOpen     ] = useState(false);
  const [cmdQuery,     setCmdQuery    ] = useState("");
  const [cmdIndex,     setCmdIndex    ] = useState(0);
  const [notifOpen,    setNotifOpen   ] = useState(false);
  const [profileOpen,  setProfileOpen ] = useState(false);
  const [collapsed,    setCollapsed   ] = useState({});
  const [theme,        setTheme       ] = useState(() => localStorage.getItem("sa-theme") || "dark");

  // ── Dynamic data ───────────────────────────────────────────────────────────
  const [notifs,       setNotifs      ] = useState([]);
  const [notifsLoading,setNotifsLoading]=useState(false);
  const [pendingApps,  setPendingApps ] = useState(0);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  const unread = notifs.filter((n) => !n.read).length;

  // ── Load notifications ─────────────────────────────────────────────────────
  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setNotifsLoading(true);
    try {
      const data = await fetchNotifications();
      if (data?.notifications?.length) {
        setNotifs(data.notifications);
      }
    } catch (_) {
      // notifications endpoint may not exist yet — fail silently
    } finally {
      if (!silent) setNotifsLoading(false);
    }
  }, []);

  // ── Load pending applications count ───────────────────────────────────────
  const loadPendingApps = useCallback(async () => {
    try {
      const data = await fetchApplications({ status: "pending", limit: 1 });
      setPendingApps(data?.total ?? 0);
    } catch (_) {}
  }, []);

  // ── Initial + polling (every 30 s) ────────────────────────────────────────
  useEffect(() => {
    loadNotifications();
    loadPendingApps();
    const id = setInterval(() => {
      loadNotifications(true);
      loadPendingApps();
    }, 30_000);
    return () => clearInterval(id);
  }, [loadNotifications, loadPendingApps]);

  // ── Theme persistence ──────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("sa-theme", theme);
  }, [theme]);

  // ── Command palette filtered results ──────────────────────────────────────
  const cmdResults = cmdQuery.trim()
    ? ALL_COMMANDS.filter((c) => c.label.toLowerCase().includes(cmdQuery.toLowerCase()))
    : ALL_COMMANDS.slice(0, 10);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        setCmdQuery("");
        setCmdIndex(0);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
      if (cmdOpen) {
        if (e.key === "ArrowDown") { e.preventDefault(); setCmdIndex((i) => Math.min(i + 1, cmdResults.length - 1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setCmdIndex((i) => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && cmdResults[cmdIndex]) {
          navigate(cmdResults[cmdIndex].to);
          setCmdOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cmdOpen, cmdIndex, cmdResults, navigate]);

  // ── Outside-click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close on navigation ────────────────────────────────────────────────────
  useEffect(() => {
    setCmdOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  // ── Notification actions ───────────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n)));
    await markNotificationRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead().catch(() => {});
  };

  const toggleSection = (s) => setCollapsed((p) => ({ ...p, [s]: !p[s] }));

  const getBadgeCount = (badge) => {
    if (badge === "applications")  return pendingApps;
    if (badge === "notifications") return unread;
    return null;
  };

  const getPageTitle = () => {
    const flat  = NAV.flatMap((s) => s.items);
    const match = flat
      .filter((i) => location.pathname.startsWith(i.to))
      .sort((a, b) => b.to.length - a.to.length)[0];
    return match?.label ?? "Dashboard";
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        :root {
          --bg-base:    #060810;
          --bg-surface: #0c0f1a;
          --bg-raised:  #111520;
          --bg-hover:   #181d2e;
          --bg-active:  #1e2540;
          --border:     rgba(255,255,255,0.06);
          --border-md:  rgba(255,255,255,0.10);
          --text-1:     #eef0f8;
          --text-2:     #8b93b0;
          --text-3:     #4a5168;
          --accent:     #5b8cff;
          --accent-dim: rgba(91,140,255,0.12);
          --accent-glow:rgba(91,140,255,0.25);
          --teal:       #38d9c0;
          --rose:       #ff5f7e;
          --amber:      #ffb547;
          --green:      #3dd68c;
          --sidebar-w:  240px;
          --sidebar-mini:64px;
          --topbar-h:   56px;
          --radius:     10px;
          --font:       'Outfit', sans-serif;
          --mono:       'DM Mono', monospace;
        }

        html, body, #root { height:100%; background:var(--bg-base); color:var(--text-1); font-family:var(--font); }

        /* Shell */
        .sa-shell {
          display:grid;
          grid-template-columns: var(--sidebar-w) 1fr;
          grid-template-rows: var(--topbar-h) 1fr;
          grid-template-areas: "sidebar topbar" "sidebar content";
          height:100vh; overflow:hidden;
          transition: grid-template-columns 0.3s cubic-bezier(.4,0,.2,1);
        }
        .sa-shell.mini { grid-template-columns: var(--sidebar-mini) 1fr; }

        /* Sidebar */
        .sa-sidebar {
          grid-area:sidebar; background:var(--bg-surface);
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          overflow:hidden; position:relative; z-index:50;
          transition: width 0.3s cubic-bezier(.4,0,.2,1);
        }
        .sb-head {
          height:var(--topbar-h); display:flex; align-items:center;
          padding:0 16px; gap:10px; border-bottom:1px solid var(--border); flex-shrink:0;
        }
        .sb-logo { display:flex; align-items:center; gap:9px; flex:1; overflow:hidden; text-decoration:none; }
        .sb-logo-mark {
          width:30px; height:30px;
          background: linear-gradient(135deg,var(--accent) 0%,var(--teal) 100%);
          border-radius:8px; display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:900; color:#fff; flex-shrink:0; letter-spacing:-1px;
        }
        .sb-logo-text { font-size:15px; font-weight:800; color:var(--text-1); white-space:nowrap; overflow:hidden; letter-spacing:-0.3px; }
        .sb-logo-text span { color:var(--accent); }
        .sb-collapse {
          width:26px; height:26px; border-radius:6px; background:none;
          border:1px solid var(--border); cursor:pointer; display:flex;
          align-items:center; justify-content:center; color:var(--text-3);
          flex-shrink:0; transition:all 0.15s;
        }
        .sb-collapse:hover { background:var(--bg-hover); color:var(--text-1); }

        .sb-nav { flex:1; overflow-y:auto; overflow-x:hidden; padding:12px 0 8px; scrollbar-width:none; }
        .sb-nav::-webkit-scrollbar { display:none; }

        .sb-section { margin-bottom:4px; }
        .sb-section-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:0 14px 0 16px; margin-bottom:2px; height:28px;
          cursor:pointer; user-select:none;
        }
        .sb-section-label { font-size:9.5px; font-weight:700; letter-spacing:1.2px; color:var(--text-3); text-transform:uppercase; white-space:nowrap; overflow:hidden; }
        .sb-section-chevron { color:var(--text-3); font-size:10px; transition:transform 0.2s; flex-shrink:0; }
        .sb-section-chevron.open { transform:rotate(180deg); }

        .sb-item {
          display:flex; align-items:center; gap:10px;
          padding:0 10px 0 12px; height:36px; margin:1px 8px;
          border-radius:8px; text-decoration:none; color:var(--text-2);
          font-size:13.5px; font-weight:500; transition:all 0.15s;
          position:relative; overflow:hidden; white-space:nowrap;
        }
        .sb-item:hover { background:var(--bg-hover); color:var(--text-1); }
        .sb-item.active { background:var(--accent-dim); color:var(--accent); }
        .sb-item.active::before {
          content:""; position:absolute; left:0; top:20%; bottom:20%;
          width:3px; background:var(--accent); border-radius:0 3px 3px 0;
        }
        .sb-item-icon { font-size:14px; width:20px; text-align:center; flex-shrink:0; font-style:normal; }
        .sb-item-label { flex:1; overflow:hidden; }
        .sb-item-badge {
          min-width:18px; height:18px; padding:0 5px; border-radius:9px;
          background:var(--rose); color:#fff; font-size:10px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; font-family:var(--mono);
          animation: badgePop 0.3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes badgePop {
          0%   { transform:scale(0); }
          70%  { transform:scale(1.2); }
          100% { transform:scale(1); }
        }

        /* Mini mode */
        .mini .sb-item-label, .mini .sb-section-label, .mini .sb-section-chevron,
        .mini .sb-item-badge, .mini .sb-logo-text { display:none; }
        .mini .sb-item { justify-content:center; padding:0; }
        .mini .sb-item-icon { width:auto; }
        .mini .sb-section-header { justify-content:center; padding:0 8px; }

        /* Sidebar bottom */
        .sb-bottom { padding:10px 8px; border-top:1px solid var(--border); flex-shrink:0; }
        .sb-user {
          display:flex; align-items:center; gap:9px; padding:8px;
          border-radius:8px; cursor:pointer; transition:background 0.15s;
        }
        .sb-user:hover { background:var(--bg-hover); }
        .sb-avatar {
          width:30px; height:30px; border-radius:8px;
          background:linear-gradient(135deg,var(--accent),var(--teal));
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:700; color:#fff; flex-shrink:0;
        }
        .sb-user-info { flex:1; overflow:hidden; min-width:0; }
        .sb-user-name { font-size:13px; font-weight:600; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-user-role { font-size:11px; color:var(--accent); font-weight:500; }
        .mini .sb-user-info { display:none; }

        /* Topbar */
        .sa-topbar {
          grid-area:topbar; background:var(--bg-surface);
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; padding:0 20px; gap:12px; z-index:40;
        }
        .topbar-hamburger {
          display:none; width:32px; height:32px; border-radius:8px;
          background:var(--bg-raised); border:1px solid var(--border);
          cursor:pointer; align-items:center; justify-content:center;
          color:var(--text-2); font-size:16px;
        }
        .topbar-breadcrumb { display:flex; align-items:center; gap:6px; flex:1; min-width:0; }
        .tb-page-title { font-size:15px; font-weight:700; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tb-sep { color:var(--text-3); font-size:13px; }
        .tb-sub { font-size:13px; color:var(--text-3); white-space:nowrap; }

        .topbar-cmd {
          display:flex; align-items:center; gap:8px;
          background:var(--bg-raised); border:1px solid var(--border);
          border-radius:8px; padding:6px 10px; cursor:pointer;
          transition:all 0.15s; min-width:180px; max-width:240px;
        }
        .topbar-cmd:hover { border-color:var(--border-md); background:var(--bg-hover); }
        .topbar-cmd-text { font-size:12.5px; color:var(--text-3); flex:1; }
        .topbar-cmd-kbd { display:flex; gap:3px; }
        .kbd { background:var(--bg-active); border:1px solid var(--border-md); border-radius:4px; padding:1px 5px; font-size:10px; font-family:var(--mono); color:var(--text-3); }

        .topbar-actions { display:flex; align-items:center; gap:6px; }
        .tb-icon-btn {
          width:34px; height:34px; border-radius:8px; background:none;
          border:1px solid transparent; cursor:pointer; display:flex;
          align-items:center; justify-content:center; color:var(--text-2);
          font-size:16px; position:relative; transition:all 0.15s;
        }
        .tb-icon-btn:hover { background:var(--bg-raised); border-color:var(--border); color:var(--text-1); }
        .tb-badge-dot {
          position:absolute; top:5px; right:5px; width:8px; height:8px;
          border-radius:50%; background:var(--rose); border:2px solid var(--bg-surface);
          animation: badgePop 0.3s cubic-bezier(.4,0,.2,1);
        }

        /* Command Palette */
        .cmd-overlay {
          position:fixed; inset:0; background:rgba(6,8,16,0.7); z-index:1000;
          display:flex; align-items:flex-start; justify-content:center;
          padding-top:12vh; backdrop-filter:blur(4px);
          animation:fadeIn 0.12s ease;
        }
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        .cmd-box {
          width:100%; max-width:520px; background:var(--bg-raised);
          border:1px solid var(--border-md); border-radius:14px; overflow:hidden;
          box-shadow:0 24px 80px rgba(0,0,0,0.6);
          animation:slideDown 0.15s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideDown {
          from{opacity:0;transform:translateY(-10px) scale(0.98);}
          to{opacity:1;transform:none;}
        }
        .cmd-input-wrap { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--border); }
        .cmd-search-icon { color:var(--text-3); font-size:16px; flex-shrink:0; }
        .cmd-input { flex:1; background:none; border:none; outline:none; color:var(--text-1); font-size:15px; font-family:var(--font); caret-color:var(--accent); }
        .cmd-input::placeholder { color:var(--text-3); }
        .cmd-esc { background:var(--bg-active); border:1px solid var(--border-md); border-radius:5px; padding:2px 7px; font-size:10px; font-family:var(--mono); color:var(--text-3); cursor:pointer; }
        .cmd-results { max-height:320px; overflow-y:auto; padding:6px; }
        .cmd-results::-webkit-scrollbar { width:4px; }
        .cmd-results::-webkit-scrollbar-thumb { background:var(--border-md); border-radius:2px; }
        .cmd-category { font-size:10px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:var(--text-3); padding:6px 10px 4px; }
        .cmd-item { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:7px; cursor:pointer; transition:background 0.1s; font-size:13.5px; color:var(--text-2); }
        .cmd-item:hover, .cmd-item.focused { background:var(--accent-dim); color:var(--accent); }
        .cmd-footer { border-top:1px solid var(--border); padding:8px 14px; display:flex; gap:14px; align-items:center; }
        .cmd-hint { font-size:11px; color:var(--text-3); display:flex; align-items:center; gap:5px; }

        /* Notification panel */
        .notif-panel {
          position:absolute; top:calc(var(--topbar-h) + 6px); right:0;
          width:360px; background:var(--bg-raised); border:1px solid var(--border-md);
          border-radius:14px; box-shadow:0 20px 60px rgba(0,0,0,0.5);
          z-index:200; overflow:hidden; animation:slideDown 0.15s ease;
        }
        .notif-head { padding:14px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        .notif-title { font-size:14px; font-weight:700; color:var(--text-1); }
        .notif-mark-all { font-size:12px; color:var(--accent); cursor:pointer; background:none; border:none; font-family:var(--font); font-weight:500; }
        .notif-mark-all:hover { opacity:0.75; }
        .notif-list { max-height:380px; overflow-y:auto; }
        .notif-list::-webkit-scrollbar { width:4px; }
        .notif-list::-webkit-scrollbar-thumb { background:var(--border-md); border-radius:2px; }
        .notif-item { display:flex; gap:11px; padding:12px 14px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; position:relative; }
        .notif-item:last-child { border-bottom:none; }
        .notif-item:hover { background:var(--bg-hover); }
        .notif-item.unread { background:rgba(91,140,255,0.04); }
        .notif-item-icon { width:34px; height:34px; border-radius:8px; background:var(--bg-active); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .notif-item-body { flex:1; min-width:0; }
        .notif-item-title { font-size:13px; font-weight:600; color:var(--text-1); margin-bottom:2px; }
        .notif-item-desc { font-size:12px; color:var(--text-2); line-height:1.4; }
        .notif-item-time { font-size:11px; color:var(--text-3); margin-top:4px; }
        .notif-unread-dot { position:absolute; top:14px; right:14px; width:7px; height:7px; border-radius:50%; background:var(--accent); }
        .notif-empty { padding:32px 16px; text-align:center; color:var(--text-3); font-size:13px; }
        .notif-footer { padding:10px 14px; border-top:1px solid var(--border); text-align:center; }
        .notif-view-all { font-size:12.5px; color:var(--accent); cursor:pointer; background:none; border:none; font-family:var(--font); font-weight:600; }

        /* Profile dropdown */
        .profile-panel {
          position:absolute; top:calc(var(--topbar-h) + 6px); right:0;
          width:220px; background:var(--bg-raised); border:1px solid var(--border-md);
          border-radius:12px; box-shadow:0 16px 50px rgba(0,0,0,0.4);
          z-index:200; overflow:hidden; animation:slideDown 0.15s ease;
        }
        .profile-head { padding:14px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
        .profile-avatar { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,var(--accent),var(--teal)); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; }
        .profile-name { font-size:13.5px; font-weight:700; color:var(--text-1); }
        .profile-email { font-size:11.5px; color:var(--text-3); margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px; }
        .profile-menu { padding:6px; }
        .profile-item { display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:7px; cursor:pointer; font-size:13px; color:var(--text-2); transition:all 0.12s; background:none; border:none; width:100%; font-family:var(--font); text-align:left; }
        .profile-item:hover { background:var(--bg-hover); color:var(--text-1); }
        .profile-item.danger:hover { background:rgba(255,95,126,0.1); color:var(--rose); }
        .profile-divider { height:1px; background:var(--border); margin:4px 0; }
        .profile-item-icon { font-size:15px; width:18px; text-align:center; }

        /* Content */
        .sa-content {
          grid-area:content; overflow-y:auto; overflow-x:hidden;
          background:var(--bg-base); scrollbar-width:thin;
          scrollbar-color:var(--border-md) transparent;
        }
        .sa-content::-webkit-scrollbar { width:5px; }
        .sa-content::-webkit-scrollbar-thumb { background:var(--border-md); border-radius:3px; }

        /* Status bar */
        .sa-statusbar {
          position:fixed; bottom:0; right:0;
          height:24px; background:var(--bg-surface);
          border-top:1px solid var(--border); display:flex;
          align-items:center; padding:0 16px; gap:16px; z-index:30; transition:left 0.3s;
        }
        .status-item { display:flex; align-items:center; gap:5px; font-size:10.5px; color:var(--text-3); font-family:var(--mono); white-space:nowrap; }
        .status-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }
        .status-badge-count { background:var(--rose); color:#fff; border-radius:4px; padding:0 4px; font-size:9px; font-weight:700; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

        /* Mobile */
        .mobile-overlay { position:fixed; inset:0; background:rgba(6,8,16,0.7); z-index:45; backdrop-filter:blur(2px); }

        @media (max-width:900px) {
          .sa-shell { grid-template-columns:0 1fr !important; }
          .sa-sidebar {
            position:fixed; top:0; left:0; height:100vh;
            width:var(--sidebar-w) !important;
            transform:translateX(-100%);
            transition:transform 0.3s cubic-bezier(.4,0,.2,1); z-index:60;
          }
          .sa-sidebar.mobile-open { transform:translateX(0); }
          .topbar-hamburger { display:flex !important; }
          .topbar-cmd { min-width:120px; }
          .sa-statusbar { left:0 !important; }
        }
        @media (max-width:480px) {
          .topbar-cmd { display:none; }
          .tb-page-title { font-size:14px; }
          .notif-panel { width:calc(100vw - 20px); }
        }
      `}</style>

      {/* ── Command Palette ──────────────────────────────────────────────────── */}
      {cmdOpen && (
        <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
          <div className="cmd-box" onClick={(e) => e.stopPropagation()}>
            <div className="cmd-input-wrap">
              <span className="cmd-search-icon">⌕</span>
              <input
                autoFocus
                className="cmd-input"
                placeholder="Search pages, actions, schools…"
                value={cmdQuery}
                onChange={(e) => { setCmdQuery(e.target.value); setCmdIndex(0); }}
              />
              <span className="cmd-esc" onClick={() => setCmdOpen(false)}>ESC</span>
            </div>
            <div className="cmd-results">
              {cmdResults.length === 0 ? (
                <div style={{ padding:"20px", textAlign:"center", color:"var(--text-3)", fontSize:13 }}>
                  No results for "{cmdQuery}"
                </div>
              ) : (
                <>
                  <div className="cmd-category">Navigate</div>
                  {cmdResults.map((c, i) => (
                    <div
                      key={c.to}
                      className={`cmd-item${i === cmdIndex ? " focused" : ""}`}
                      onMouseEnter={() => setCmdIndex(i)}
                      onClick={() => { navigate(c.to); setCmdOpen(false); }}
                    >
                      <span style={{ fontSize:14, width:20, textAlign:"center" }}>→</span>
                      {c.label}
                      {c.to === "/super-admin/schools/applications" && pendingApps > 0 && (
                        <span style={{ marginLeft:"auto", background:"var(--rose)", color:"#fff", borderRadius:4, padding:"1px 6px", fontSize:10, fontWeight:700 }}>
                          {pendingApps}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="cmd-footer">
              <div className="cmd-hint"><span className="kbd">↑↓</span> navigate</div>
              <div className="cmd-hint"><span className="kbd">↵</span> open</div>
              <div className="cmd-hint"><span className="kbd">ESC</span> close</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Shell ────────────────────────────────────────────────────────────── */}
      <div className={`sa-shell${sidebarMini ? " mini" : ""}`}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className={`sa-sidebar${sidebarOpen ? " mobile-open" : ""}`}>
          <div className="sb-head">
            <a href="/super-admin/dashboard" className="sb-logo">
              <div className="sb-logo-mark">AS</div>
              <span className="sb-logo-text">Academia<span>Sphere</span></span>
            </a>
            <button
              className="sb-collapse"
              onClick={() => setSidebarMini((v) => !v)}
              title={sidebarMini ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarMini ? "›" : "‹"}
            </button>
          </div>

          <nav className="sb-nav">
            {NAV.map(({ section, items }) => {
              const isCollapsed = collapsed[section];
              return (
                <div key={section} className="sb-section">
                  <div className="sb-section-header" onClick={() => toggleSection(section)}>
                    <span className="sb-section-label">{section}</span>
                    <span className={`sb-section-chevron${isCollapsed ? "" : " open"}`}>▾</span>
                  </div>
                  {!isCollapsed && items.map((item) => {
                    const badgeCount = item.badge ? getBadgeCount(item.badge) : null;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/super-admin/dashboard"}
                        className={({ isActive }) => `sb-item${isActive ? " active" : ""}`}
                        title={sidebarMini ? item.label : undefined}
                      >
                        <i className="sb-item-icon">{item.icon}</i>
                        <span className="sb-item-label">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className="sb-item-badge">{badgeCount}</span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="sb-bottom">
            <div className="sb-user" onClick={() => setProfileOpen((v) => !v)}>
              <div className="sb-avatar">{initials}</div>
              <div className="sb-user-info">
                <div className="sb-user-name">{user?.name || "Super Admin"}</div>
                <div className="sb-user-role">SUPER_ADMIN</div>
              </div>
              <span style={{ color:"var(--text-3)", fontSize:11 }}>⋯</span>
            </div>
          </div>
        </aside>

        {/* ── Topbar ───────────────────────────────────────────────────────── */}
        <header className="sa-topbar">
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen((v) => !v)}
            style={{ display:"none" }}
          >
            ☰
          </button>

          <div className="topbar-breadcrumb">
            {sidebarMini && (
              <><span className="tb-sub">AcademiaSphere</span><span className="tb-sep">›</span></>
            )}
            <span className="tb-page-title">{getPageTitle()}</span>
          </div>

          <div className="topbar-cmd" onClick={() => { setCmdOpen(true); setCmdQuery(""); }}>
            <span style={{ color:"var(--text-3)", fontSize:14 }}>⌕</span>
            <span className="topbar-cmd-text">Search or navigate…</span>
            <div className="topbar-cmd-kbd">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
            </div>
          </div>

          <div className="topbar-actions" style={{ position:"relative" }}>

            {/* Notifications */}
            <div ref={notifRef} style={{ position:"relative" }}>
              <button
                className="tb-icon-btn"
                onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
                title="Notifications"
              >
                🔔
                {unread > 0 && <span className="tb-badge-dot" />}
              </button>

              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-head">
                    <span className="notif-title">
                      Notifications
                      {unread > 0 && (
                        <span style={{ background:"var(--rose)", color:"#fff", borderRadius:20, padding:"1px 7px", fontSize:10, fontWeight:700, marginLeft:6, verticalAlign:"middle" }}>
                          {unread}
                        </span>
                      )}
                    </span>
                    {unread > 0 && (
                      <button className="notif-mark-all" onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notif-list">
                    {notifsLoading ? (
                      <div style={{ padding:"24px 16px", textAlign:"center", color:"var(--text-3)", fontSize:13 }}>
                        Loading…
                      </div>
                    ) : notifs.length === 0 ? (
                      <div className="notif-empty">
                        <div style={{ fontSize:28, marginBottom:8 }}>🔔</div>
                        No notifications yet
                      </div>
                    ) : (
                      notifs.map((n) => {
                        const nid = n.id ?? n._id;
                        return (
                          <div
                            key={nid}
                            className={`notif-item${n.read ? "" : " unread"}`}
                            onClick={() => markRead(nid)}
                          >
                            <div className="notif-item-icon">
                              {NOTIF_ICON[n.type] ?? NOTIF_ICON.default}
                            </div>
                            <div className="notif-item-body">
                              <div className="notif-item-title">{n.title}</div>
                              <div className="notif-item-desc">{n.body ?? n.message}</div>
                              <div className="notif-item-time">
                                {n.time ?? (n.createdAt
                                  ? new Date(n.createdAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
                                  : "")}
                              </div>
                            </div>
                            {!n.read && <div className="notif-unread-dot" />}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="notif-footer">
                    <button
                      className="notif-view-all"
                      onClick={() => { navigate("/super-admin/notifications"); setNotifOpen(false); }}
                    >
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              className="tb-icon-btn"
              onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? "◑" : "☀"}
            </button>

            {/* Profile */}
            <div ref={profileRef} style={{ position:"relative" }}>
              <button
                className="tb-icon-btn"
                style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,var(--accent),var(--teal))", color:"#fff", fontSize:12, fontWeight:700, border:"none" }}
                onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
                title="Profile"
              >
                {initials}
              </button>

              {profileOpen && (
                <div className="profile-panel">
                  <div className="profile-head">
                    <div className="profile-avatar">{initials}</div>
                    <div>
                      <div className="profile-name">{user?.name || "Super Admin"}</div>
                      <div className="profile-email">{user?.email || "admin@platform.com"}</div>
                    </div>
                  </div>
                  <div className="profile-menu">
                    {[
                      { icon:"👤", label:"My Profile",      to:"/super-admin/profile"  },
                      { icon:"⚙️", label:"Settings",        to:"/super-admin/settings" },
                      { icon:"🔑", label:"Change Password", to:"/super-admin/profile"  },
                      { icon:"📊", label:"System Logs",     to:"/super-admin/logs"     },
                    ].map((item) => (
                      <button
                        key={item.to + item.label}
                        className="profile-item"
                        onClick={() => { navigate(item.to); setProfileOpen(false); }}
                      >
                        <span className="profile-item-icon">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                    <div className="profile-divider" />
                    <button className="profile-item danger" onClick={() => logout()}>
                      <span className="profile-item-icon">↪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <main className="sa-content" style={{ paddingBottom: 32 }}>
          <Outlet />
        </main>

        {/* ── Status bar ───────────────────────────────────────────────────── */}
        <div
          className="sa-statusbar"
          style={{ left: sidebarMini ? "var(--sidebar-mini)" : "var(--sidebar-w)" }}
        >
          <div className="status-item">
            <span className="status-dot" />API online
          </div>
          <div className="status-item">DB connected</div>
          {pendingApps > 0 && (
            <div
              className="status-item"
              style={{ color:"var(--amber)", cursor:"pointer" }}
              onClick={() => navigate("/super-admin/schools/applications")}
            >
              ⚠ <span className="status-badge-count">{pendingApps}</span> pending app{pendingApps !== 1 ? "s" : ""}
            </div>
          )}
          <div className="status-item" style={{ marginLeft:"auto" }}>
            v2.0.0 · AcademiaSphere
          </div>
        </div>
      </div>

      {/* ── Mobile overlay ───────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
}