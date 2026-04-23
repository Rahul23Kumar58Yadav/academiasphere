import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#faf9f7",
  sidebar:  "#ffffff",
  surface:  "#ffffff",
  border:   "#ede9e3",
  borderHov:"#d4c9b8",
  text1:    "#1a1612",
  text2:    "#6b6057",
  text3:    "#a89d93",
  accent:   "#c96b2e",
  accentBg: "#c96b2e12",
  accentL:  "#f4ede6",
  green:    "#2d7d4a",
  greenBg:  "#2d7d4a10",
  rose:     "#c0392b",
  roseBg:   "#c0392b0d",
  amber:    "#b8640a",
  amberBg:  "#b8640a10",
  blue:     "#1d5fa6",
  blueBg:   "#1d5fa610",
};

const NAV_ITEMS = [
  {
    section: "Overview",
    links: [
      { to: "/parent/dashboard",    label: "Dashboard",    icon: HomeIcon    },
      { to: "/parent/children",     label: "My Children",  icon: ChildrenIcon },
    ],
  },
  {
    section: "Academics",
    links: [
      { to: "/parent/children/1/results",    label: "Results",    icon: ResultsIcon    },
      { to: "/parent/children/1/attendance", label: "Attendance", icon: AttendIcon     },
      { to: "/parent/children/1/performance",label: "Performance",icon: ChartIcon      },
    ],
  },
  {
    section: "Finance",
    links: [
      { to: "/parent/fees/pay",   label: "Pay Fees",    icon: FeesIcon   },
    ],
  },
  {
    section: "Communication",
    links: [
      { to: "/parent/messages",       label: "Messages",       icon: MsgIcon         },
      { to: "/parent/notifications",  label: "Notifications",  icon: BellIcon,  badge: 3 },
    ],
  },
  {
    section: "Account",
    links: [
      { to: "/parent/profile", label: "Profile",      icon: ProfileIcon },
      { to: "/parent/help",    label: "Help & Support",icon: HelpIcon   },
    ],
  },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function Ic({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
function HomeIcon()     { return <Ic d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />; }
function ChildrenIcon() { return <Ic d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />; }
function ResultsIcon()  { return <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />; }
function AttendIcon()   { return <Ic d="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01" />; }
function ChartIcon()    { return <Ic d="M18 20V10 M12 20V4 M6 20v-6" />; }
function FeesIcon()     { return <Ic d="M12 2a10 10 0 100 20A10 10 0 0012 2z M12 6v6l4 2" />; }
function MsgIcon()      { return <Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />; }
function BellIcon()     { return <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" />; }
function ProfileIcon()  { return <Ic d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8" />; }
function HelpIcon()     { return <Ic d="M12 22a10 10 0 100-20 10 10 0 000 20z M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01" />; }
function MenuIcon()     { return <Ic d="M3 12h18 M3 6h18 M3 18h18" />; }
function LogoutIcon()   { return <Ic d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />; }
function SunIcon()      { return <Ic d="M12 7a5 5 0 100 10A5 5 0 0012 7z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42" size={16} />; }

// ─── Sidebar NavLink ──────────────────────────────────────────────────────────
function SideLink({ to, label, Icon, badge, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "10px 0" : "9px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 10,
        marginBottom: 2,
        color: isActive ? C.accent : C.text2,
        background: isActive ? C.accentBg : "transparent",
        border: `1px solid ${isActive ? C.accent + "30" : "transparent"}`,
        textDecoration: "none",
        fontSize: 13.5,
        fontWeight: isActive ? 700 : 500,
        transition: "all 0.15s",
        position: "relative",
        cursor: "pointer",
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{ color: isActive ? C.accent : C.text3, flexShrink: 0 }}>
            <Icon />
          </span>
          {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
          {!collapsed && badge > 0 && (
            <span style={{ background: C.accent, color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 20, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
              {badge}
            </span>
          )}
          {collapsed && badge > 0 && (
            <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, background: C.accent, borderRadius: "50%", border: "1.5px solid #fff" }} />
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function ParentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarW = collapsed ? 68 : 240;

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo + Toggle */}
      <div style={{ padding: collapsed ? "20px 0" : "20px 18px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, fontFamily: "Georgia, serif" }}>A</span>
            </div>
            <div>
              <p style={{ color: C.text1, fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>AcademySphere</p>
              <p style={{ color: C.text3, fontSize: 10, margin: 0 }}>Parent Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, fontFamily: "Georgia, serif" }}>A</span>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(p => !p)}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: 5, cursor: "pointer", color: C.text3, display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <MenuIcon />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? "0 8px" : "0 12px", overflowY: "auto" }}>
        {NAV_ITEMS.map(section => (
          <div key={section.section} style={{ marginBottom: 20 }}>
            {!collapsed && (
              <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 4px 6px", padding: "0 10px" }}>
                {section.section}
              </p>
            )}
            {collapsed && <div style={{ height: 1, background: C.border, margin: "8px 4px 10px" }} />}
            {section.links.map(link => (
              <SideLink key={link.to} to={link.to} label={link.label} Icon={link.icon} badge={link.badge} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Parent Profile Footer */}
      <div style={{ padding: collapsed ? "12px 8px" : "12px 14px", borderTop: `1px solid ${C.border}` }}>
        {!collapsed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accentL, border: `2px solid ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: C.accent, fontWeight: 800, fontSize: 13 }}>SR</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Sunita Reddy</p>
              <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>Parent · 2 children</p>
            </div>
            <button
              onClick={() => navigate("/login")}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, padding: 4, display: "flex", alignItems: "center" }}
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accentL, border: `2px solid ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: C.accent, fontWeight: 800, fontSize: 13 }}>SR</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Lato', 'Segoe UI', sans-serif" }}>

      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <aside style={{
          width: sidebarW,
          minHeight: "100vh",
          background: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          flexShrink: 0,
          transition: "width 0.22s ease",
          overflowX: "hidden",
          zIndex: 20,
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── Mobile Overlay ── */}
      {isMobile && mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "#00000050", zIndex: 40 }}
          />
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 256,
            background: C.sidebar, borderRight: `1px solid ${C.border}`,
            zIndex: 50, overflowY: "auto",
          }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top Bar */}
        <header style={{
          height: 56,
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text2, padding: 4, display: "flex" }}>
                <MenuIcon />
              </button>
            )}
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.text3, fontSize: 13 }}>Parent</span>
              <span style={{ color: C.text3, fontSize: 13 }}>/</span>
              <span style={{ color: C.text1, fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                {location.pathname.split("/").pop() || "Dashboard"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Date */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.accentBg, border: `1px solid ${C.accent}25`, borderRadius: 8, padding: "5px 12px" }}>
              <SunIcon />
              <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>

            {/* Notification Bell */}
            <button style={{ position: "relative", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: C.text2, display: "flex" }}>
              <BellIcon />
              <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, background: C.accent, borderRadius: "50%", border: "1.5px solid #fff" }} />
            </button>

            {/* Avatar */}
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accentL, border: `2px solid ${C.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span style={{ color: C.accent, fontWeight: 800, fontSize: 12 }}>SR</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4c9b8; border-radius: 4px; }
        a:hover { opacity: 0.88; }
      `}</style>
    </div>
  );
}