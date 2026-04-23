import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const C = {
  bg: "#faf9f7", surface: "#ffffff", s2: "#f5f2ee", s3: "#ede9e3",
  border: "#ede9e3", text1: "#1a1612", text2: "#6b6057", text3: "#a89d93",
  accent: "#c96b2e", accentL: "#f4ede6", accentBg: "#c96b2e12",
  green: "#2d7d4a", greenL: "#e8f5ed",
  rose: "#c0392b", roseL: "#fdecea", roseBg: "#c0392b08",
  amber: "#b8640a", amberL: "#fef3e2", amberBg: "#b8640a08",
  blue: "#1d5fa6", blueL: "#e8f0fb",
  violet: "#5b3fa6", violetL: "#eeebfb",
};

const ROLE_META = {
  SUPER_ADMIN:  { label: "Super Admin",  color: C.rose,   home: "/super-admin/dashboard",  icon: "👑" },
  SCHOOL_ADMIN: { label: "School Admin", color: C.violet, home: "/school-admin/dashboard", icon: "🏫" },
  TEACHER:      { label: "Teacher",      color: C.blue,   home: "/teacher/dashboard",       icon: "📚" },
  STUDENT:      { label: "Student",      color: C.green,  home: "/student/dashboard",       icon: "🎓" },
  PARENT:       { label: "Parent",       color: C.accent, home: "/parent/dashboard",        icon: "👨‍👩‍👧" },
  VENDOR:       { label: "Vendor",       color: C.amber,  home: "/vendor/dashboard",        icon: "🛒" },
};

// Radial lock animation
function AnimatedLock({ pulse }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
      {/* Pulsing rings */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: 80 + i * 40, height: 80 + i * 40,
          borderRadius: "50%",
          border: `2px solid ${C.rose}`,
          opacity: pulse ? 0.08 * (4 - i) : 0,
          animation: pulse ? `ripple ${1 + i * 0.3}s ${i * 0.2}s ease-out infinite` : "none",
        }} />
      ))}
      {/* Lock icon */}
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.roseL, border: `2.5px solid ${C.rose}30`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, animation: "lockShake 4s 1.5s ease-in-out infinite" }}>
        <span style={{ fontSize: 36 }}>🔒</span>
      </div>
    </div>
  );
}

// Permission row
function PermRow({ icon, label, allowed, yours }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: yours === allowed ? C.greenL + "80" : C.roseL + "80", border: `1px solid ${yours === allowed ? C.green : C.rose}22`, borderRadius: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: C.text1, fontSize: 13, flex: 1, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.text3, fontSize: 9, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>Required</p>
          <span style={{ background: C.violet + "18", color: C.violet, fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{allowed}</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.text3, fontSize: 9, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>Your Role</p>
          <span style={{ background: C.accent + "18", color: C.accent, fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{yours}</span>
        </div>
        <span style={{ fontSize: 16, display: "flex", alignItems: "center" }}>{yours === allowed ? "✅" : "❌"}</span>
      </div>
    </div>
  );
}

export default function Unauthorized() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [reported, setReported]       = useState(false);

  // Mock — replace with useAuth()
  const role = "PARENT";
  const user = { name: "Sunita Reddy", email: "sunita.reddy@gmail.com" };
  const roleMeta = ROLE_META[role] || ROLE_META.PARENT;

  // Parse what role was needed from state (or guess from path)
  const requiredRole = location.state?.requiredRole || "SUPER_ADMIN";
  const requiredMeta = ROLE_META[requiredRole] || ROLE_META.SUPER_ADMIN;
  const attemptedPath = location.state?.from || location.pathname;

  // Determine 401 vs 403
  const errorCode = location.state?.code || 403;
  const isNotLoggedIn = errorCode === 401;

  const handleReport = () => {
    setReported(true);
    setTimeout(() => setReported(false), 4000);
  };

  // Floating blocked icons
  const floaters = ["🚫","🔐","⛔","🛑","🔒"].map((icon, i) => ({
    icon, x: 5 + i * 20, y: 10 + (i % 3) * 28, delay: i * 0.6,
  }));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", fontFamily: "'Lato','Segoe UI',sans-serif", padding: "40px 24px" }}>

      {/* Background: subtle diagonal stripes */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, ${C.rose}04 40px, ${C.rose}04 41px)`, pointerEvents: "none" }} />

      {/* Floating icons */}
      {floaters.map((f, i) => (
        <div key={i} style={{ position: "absolute", left: `${f.x}%`, top: `${f.y}%`, fontSize: 28, opacity: 0.07, animation: `floatIcon 4s ${f.delay}s ease-in-out infinite alternate`, userSelect: "none", pointerEvents: "none" }}>
          {f.icon}
        </div>
      ))}

      {/* Radial warning glow */}
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.rose}07, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 600, width: "100%", textAlign: "center" }}>

        {/* Branding pill */}
        <div style={{ display: "inline-flex", gap: 10, alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 30, padding: "8px 18px", marginBottom: 32, boxShadow: "0 2px 12px #0000000a" }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 900, fontFamily: "Georgia,serif" }}>A</span>
          </div>
          <span style={{ color: C.text2, fontSize: 12.5, fontWeight: 700 }}>AcademySphere</span>
          <span style={{ width: 1, height: 14, background: C.border }} />
          <span style={{ background: C.roseL, color: C.rose, fontSize: 11.5, fontWeight: 800, padding: "1px 8px", borderRadius: 20 }}>Error {errorCode}</span>
        </div>

        {/* Animated lock */}
        <AnimatedLock pulse={true} />

        {/* Error code */}
        <div style={{ fontSize: "clamp(64px, 16vw, 120px)", fontWeight: 900, fontFamily: "Georgia,serif", letterSpacing: "-4px", lineHeight: 1, marginBottom: 12, background: `linear-gradient(135deg, ${C.rose}, ${C.rose}88)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", userSelect: "none" }}>
          {errorCode}
        </div>

        <h1 style={{ color: C.text1, fontSize: "clamp(20px, 3.5vw, 28px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "Georgia,serif" }}>
          {isNotLoggedIn ? "You're Not Logged In" : "Access Denied"}
        </h1>

        <p style={{ color: C.text2, fontSize: 15, margin: "0 0 6px", lineHeight: 1.6 }}>
          {isNotLoggedIn
            ? "You need to be logged in to access this page. Please sign in to continue."
            : <>You don't have permission to access <code style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 13, color: C.rose, fontFamily: "monospace" }}>{attemptedPath}</code>.</>
          }
        </p>
        <p style={{ color: C.text3, fontSize: 13.5, margin: "0 0 28px" }}>
          {isNotLoggedIn
            ? "Your session may have expired or you haven't logged in yet."
            : `This resource requires the ${requiredMeta.label} role. You are logged in as ${roleMeta.label}.`
          }
        </p>

        {/* Who you are card */}
        {!isNotLoggedIn && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", marginBottom: 20, textAlign: "left", boxShadow: "0 2px 12px #0000000a" }}>
            <p style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Your Account</p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: roleMeta.color + "18", border: `2px solid ${roleMeta.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{roleMeta.icon}</div>
              <div>
                <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>{user.name}</p>
                <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{user.email}</p>
              </div>
              <div style={{ marginLeft: "auto", background: roleMeta.color + "18", color: roleMeta.color, fontSize: 11.5, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>
                {roleMeta.icon} {roleMeta.label}
              </div>
            </div>

            {/* Permission comparison */}
            <div style={{ padding: "12px 14px", background: C.roseL, border: `1px solid ${C.rose}25`, borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⛔</span>
              <div>
                <p style={{ color: C.rose, fontSize: 13, fontWeight: 800, margin: "0 0 3px" }}>Insufficient Permissions</p>
                <p style={{ color: C.text2, fontSize: 12.5, margin: 0 }}>
                  This area requires <strong style={{ color: requiredMeta.color }}>{requiredMeta.icon} {requiredMeta.label}</strong> access. Your current role <strong style={{ color: roleMeta.color }}>({roleMeta.label})</strong> does not have access to this resource.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permission details toggle */}
        {!isNotLoggedIn && (
          <button onClick={() => setShowDetails(s => !s)} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 18px", color: C.text2, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginBottom: 20, display: "flex", gap: 6, alignItems: "center", margin: "0 auto 20px" }}>
            <span style={{ transition: "transform 0.2s", display: "inline-block", transform: showDetails ? "rotate(90deg)" : "none" }}>›</span>
            {showDetails ? "Hide" : "Show"} Permission Details
          </button>
        )}

        {showDetails && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", marginBottom: 20, textAlign: "left", boxShadow: "0 2px 12px #0000000a" }}>
            <p style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Access Requirements</p>
            <PermRow icon="👑" label="Required Role"           allowed={requiredMeta.label} yours={roleMeta.label} />
            <PermRow icon="🔑" label="Admin Panel Access"      allowed="SUPER_ADMIN"       yours={role} />
            <PermRow icon="📊" label="Platform Analytics"      allowed="SUPER_ADMIN"       yours={role} />
            <PermRow icon="🏫" label="School Management"       allowed="SCHOOL_ADMIN"      yours={role} />
            <PermRow icon="📚" label="Class Management"        allowed="TEACHER"           yours={role} />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
          {isNotLoggedIn ? (
            <>
              <button onClick={() => navigate("/login")} style={{ background: C.accent, border: "none", borderRadius: 12, padding: "13px 30px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${C.accent}30` }}>
                🔑 Log In
              </button>
              <button onClick={() => navigate("/register")} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "13px 24px", color: C.text1, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Create Account
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate(-1)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 22px", color: C.text1, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ← Go Back
              </button>
              <button onClick={() => navigate(roleMeta.home)} style={{ background: C.accent, border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${C.accent}30` }}>
                🏠 My Dashboard
              </button>
              <button onClick={() => navigate("/login")} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 22px", color: C.text2, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                🔄 Switch Account
              </button>
            </>
          )}
        </div>

        {/* Report false positive */}
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 2px 12px #0000000a" }}>
          <p style={{ color: C.text3, fontSize: 12.5, margin: 0 }}>Think this is a mistake?</p>
          <div style={{ display: "flex", gap: 10 }}>
            {!reported ? (
              <>
                <button onClick={handleReport} style={{ background: C.roseL, border: `1px solid ${C.rose}30`, borderRadius: 8, padding: "7px 16px", color: C.rose, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  🚩 Report Access Issue
                </button>
                <Link to="/parent/help" style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 16px", color: C.text2, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                  💬 Contact Support
                </Link>
              </>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.green, fontSize: 13, fontWeight: 700 }}>
                <span>✓</span> Report submitted — our team will review it within 24 hours.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: C.text3, fontSize: 12 }}>Error {errorCode} · AcademySphere ·</span>
        <span style={{ color: C.text3, fontSize: 12 }}>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes ripple { 0%{transform:scale(0.8);opacity:0.3} 100%{transform:scale(1.6);opacity:0} }
        @keyframes lockShake { 0%,90%,100%{transform:rotate(0)} 92%{transform:rotate(-6deg)} 94%{transform:rotate(6deg)} 96%{transform:rotate(-3deg)} 98%{transform:rotate(3deg)} }
        @keyframes floatIcon { from{transform:translateY(0) rotate(-5deg)} to{transform:translateY(-16px) rotate(8deg)} }
      `}</style>
    </div>
  );
}