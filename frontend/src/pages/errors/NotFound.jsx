import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const C = {
  bg: "#faf9f7", surface: "#ffffff", s2: "#f5f2ee", s3: "#ede9e3",
  border: "#ede9e3", text1: "#1a1612", text2: "#6b6057", text3: "#a89d93",
  accent: "#c96b2e", accentL: "#f4ede6", accentBg: "#c96b2e12",
  green: "#2d7d4a", amber: "#b8640a", blue: "#1d5fa6", violet: "#5b3fa6",
};

// Role-based quick links for smart navigation
const ROLE_LINKS = {
  SUPER_ADMIN:  { home: "/super-admin/dashboard",  links: [{ l: "Dashboard", p: "/super-admin/dashboard", i: "🏠" }, { l: "Manage Schools", p: "/super-admin/schools", i: "🏫" }, { l: "Users", p: "/super-admin/users", i: "👥" }] },
  SCHOOL_ADMIN: { home: "/school-admin/dashboard", links: [{ l: "Dashboard", p: "/school-admin/dashboard", i: "🏠" }, { l: "Students", p: "/school-admin/students", i: "🎓" }, { l: "Teachers", p: "/school-admin/teachers", i: "👩‍🏫" }] },
  TEACHER:      { home: "/teacher/dashboard",       links: [{ l: "Dashboard", p: "/teacher/dashboard", i: "🏠" }, { l: "My Classes", p: "/teacher/classes", i: "📚" }, { l: "Gradebook", p: "/teacher/results/gradebook", i: "📊" }] },
  STUDENT:      { home: "/student/dashboard",       links: [{ l: "Dashboard", p: "/student/dashboard", i: "🏠" }, { l: "My Courses", p: "/student/courses", i: "📖" }, { l: "Assignments", p: "/student/assignments/pending", i: "📝" }] },
  PARENT:       { home: "/parent/dashboard",        links: [{ l: "Dashboard", p: "/parent/dashboard", i: "🏠" }, { l: "My Children", p: "/parent/children", i: "👨‍👩‍👧" }, { l: "Fees", p: "/parent/fees/pay", i: "💳" }] },
  VENDOR:       { home: "/vendor/dashboard",        links: [{ l: "Dashboard", p: "/vendor/dashboard", i: "🏠" }, { l: "My Products", p: "/vendor/products", i: "📦" }, { l: "Orders", p: "/vendor/orders/new", i: "🛒" }] },
};

// Floating particle
function Particle({ x, y, size, color, delay }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity: 0.15,
      animation: `floatParticle ${3 + Math.random() * 4}s ${delay}s ease-in-out infinite alternate`,
    }} />
  );
}

// Animated 404 digits
function Digit({ char, color, delay = 0 }) {
  return (
    <span style={{
      display: "inline-block",
      color, fontWeight: 900,
      fontFamily: "Georgia, serif",
      lineHeight: 1,
      animation: `digitBounce 2s ${delay}s ease-in-out infinite`,
    }}>
      {char}
    </span>
  );
}

export default function NotFound() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [search, setSearch]   = useState("");
  const [countdown, setCountdown] = useState(15);
  const [autoRedirect, setAutoRedirect] = useState(false);

  // Mock role — replace with useAuth()
  const role = "PARENT";
  const roleConf = ROLE_LINKS[role] || ROLE_LINKS.PARENT;

  useEffect(() => {
    if (!autoRedirect) return;
    if (countdown <= 0) { navigate(roleConf.home); return; }
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown, autoRedirect, navigate, roleConf.home]);

  const particles = Array.from({ length: 18 }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    size: 6 + Math.random() * 14,
    color: [C.accent, C.blue, C.violet, C.amber, C.green][i % 5],
    delay: Math.random() * 3,
  }));

  const SUGGESTIONS = [
    { path: roleConf.home, label: "Your Dashboard", icon: "🏠" },
    ...roleConf.links.slice(1),
    { path: "/login", label: "Log In Again", icon: "🔑" },
  ];

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) navigate(`${roleConf.home}?q=${encodeURIComponent(search)}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", fontFamily: "'Lato','Segoe UI',sans-serif", padding: "40px 24px" }}>

      {/* Background particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Grid texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, ${C.text3}15 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />

      {/* Soft radial glow */}
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}08, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 680 }}>

        {/* AcademySphere branding */}
        <div style={{ display: "inline-flex", gap: 10, alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 30, padding: "8px 18px", marginBottom: 36, boxShadow: "0 2px 12px #0000000a" }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 900, fontFamily: "Georgia,serif" }}>A</span>
          </div>
          <span style={{ color: C.text2, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.02em" }}>AcademySphere</span>
          <span style={{ width: 1, height: 14, background: C.border }} />
          <span style={{ color: C.text3, fontSize: 11.5 }}>Page Not Found</span>
        </div>

        {/* Giant 404 */}
        <div style={{ fontSize: "clamp(80px, 18vw, 160px)", letterSpacing: "-6px", marginBottom: 8, userSelect: "none" }}>
          <Digit char="4" color={C.accent}        delay={0}   />
          <Digit char="0" color={C.text3}         delay={0.15}/>
          <Digit char="4" color={C.accent + "cc"} delay={0.3} />
        </div>

        {/* Illustration — lost explorer */}
        <div style={{ fontSize: 64, marginBottom: 20, animation: "wobble 3s ease-in-out infinite", display: "inline-block", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.1))" }}>
          🧭
        </div>

        <h1 style={{ color: C.text1, fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "Georgia,serif", letterSpacing: "-0.02em" }}>
          Oops! This page has gone exploring.
        </h1>
        <p style={{ color: C.text2, fontSize: 15.5, margin: "0 0 8px", lineHeight: 1.6 }}>
          The page at <code style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 13.5, color: C.accent, fontFamily: "monospace" }}>{location.pathname}</code> doesn't exist.
        </p>
        <p style={{ color: C.text3, fontSize: 14, margin: "0 0 36px" }}>
          It may have been moved, deleted, or you may have mistyped the URL.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 420, margin: "0 auto 32px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search for what you need…"
              style={{ width: "100%", padding: "13px 14px 13px 40px", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.text1, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 2px 10px #0000000a" }}
            />
          </div>
          <button type="submit" style={{ background: C.accent, border: "none", borderRadius: 12, padding: "13px 20px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>Search</button>
        </form>

        {/* Quick nav suggestions */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ color: C.text3, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Quick Navigation</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {SUGGESTIONS.map(s => (
              <Link key={s.path} to={s.path} style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 30, color: C.text2, fontSize: 13.5, fontWeight: 700, textDecoration: "none", transition: "all 0.15s", boxShadow: "0 2px 8px #0000000a" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + "60"; e.currentTarget.style.color = C.accent; e.currentTarget.style.background = C.accentL; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; e.currentTarget.style.background = C.surface; }}
              >
                <span>{s.icon}</span>{s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          <button onClick={() => navigate(-1)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 24px", color: C.text1, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", gap: 8, alignItems: "center", boxShadow: "0 2px 8px #0000000a" }}>
            ← Go Back
          </button>
          <button onClick={() => navigate(roleConf.home)} style={{ background: C.accent, border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", gap: 8, alignItems: "center", boxShadow: `0 4px 16px ${C.accent}30` }}>
            🏠 Go to Dashboard
          </button>
          <Link to="/parent/help" style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 24px", color: C.text2, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", gap: 8, alignItems: "center", boxShadow: "0 2px 8px #0000000a" }}>
            💬 Get Help
          </Link>
        </div>

        {/* Auto-redirect toggle */}
        <div style={{ display: "inline-flex", gap: 10, alignItems: "center", padding: "10px 18px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 30, cursor: "pointer" }} onClick={() => setAutoRedirect(a => !a)}>
          <div style={{ width: 32, height: 18, borderRadius: 9, background: autoRedirect ? C.accent : C.s3, position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: autoRedirect ? 17 : 3, transition: "left 0.2s" }} />
          </div>
          <span style={{ color: C.text2, fontSize: 12.5, fontWeight: 600 }}>
            {autoRedirect ? `Auto-redirect in ${countdown}s…` : "Auto-redirect to dashboard"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: C.text3, fontSize: 12 }}>Error 404 · AcademySphere v2.4.1 ·</span>
        <Link to="/parent/help" style={{ color: C.accent, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Report this page</Link>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes floatParticle { from{transform:translateY(0) scale(1)} to{transform:translateY(-20px) scale(1.15)} }
        @keyframes digitBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes wobble { 0%,100%{transform:rotate(-5deg) scale(1)} 50%{transform:rotate(8deg) scale(1.08)} }
      `}</style>
    </div>
  );
}