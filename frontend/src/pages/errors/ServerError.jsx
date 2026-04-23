import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const C = {
  bg: "#faf9f7", surface: "#ffffff", s2: "#f5f2ee", s3: "#ede9e3",
  border: "#ede9e3", text1: "#1a1612", text2: "#6b6057", text3: "#a89d93",
  accent: "#c96b2e", accentL: "#f4ede6", accentBg: "#c96b2e12",
  green: "#2d7d4a", greenL: "#e8f5ed", greenBg: "#2d7d4a0e",
  rose: "#c0392b", roseL: "#fdecea", roseBg: "#c0392b0e",
  amber: "#b8640a", amberL: "#fef3e2", amberBg: "#b8640a0e",
  blue: "#1d5fa6", blueL: "#e8f0fb", blueBg: "#1d5fa60e",
};

// ── Service health display ────────────────────────────────────────────────────
const SERVICES = [
  { name: "Web Application",   status: "operational",   latency: "142ms" },
  { name: "API Gateway",       status: "degraded",      latency: "1.4s"  },
  { name: "Database",          status: "incident",      latency: "—"     },
  { name: "Authentication",    status: "operational",   latency: "68ms"  },
  { name: "Payment Gateway",   status: "operational",   latency: "210ms" },
  { name: "AI Services",       status: "operational",   latency: "340ms" },
];

const SERVICE_CFG = {
  operational: { color: C.green, bg: C.greenL,  dot: "#22c55e", label: "Operational" },
  degraded:    { color: C.amber, bg: C.amberL,  dot: "#f59e0b", label: "Degraded"    },
  incident:    { color: C.rose,  bg: C.roseL,   dot: "#ef4444", label: "Incident"    },
};

// ── Countdown ring ────────────────────────────────────────────────────────────
function CountdownRing({ seconds, total, color }) {
  const r = 22, circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const offset   = circ - progress * circ;
  return (
    <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
      <svg width={56} height={56} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke={C.s3} strokeWidth={4} />
        <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{seconds}</span>
      </div>
    </div>
  );
}

// ── Terminal-style error log ──────────────────────────────────────────────────
function ErrorTerminal({ lines }) {
  const endRef = useRef();
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);
  return (
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 12, overflow: "hidden" }}>
      {/* Terminal header bar */}
      <div style={{ background: "#161b22", padding: "8px 14px", display: "flex", gap: 6, alignItems: "center", borderBottom: "1px solid #21262d" }}>
        {["#ff5f56","#ffbd2e","#27c93f"].map(col => (
          <div key={col} style={{ width: 12, height: 12, borderRadius: "50%", background: col }} />
        ))}
        <span style={{ color: "#8b949e", fontSize: 11.5, fontFamily: "monospace", marginLeft: 8 }}>error_trace.log — read only</span>
      </div>
      <div style={{ padding: "14px 18px", fontFamily: "'Courier New', monospace", fontSize: 12, maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <span style={{ color: "#6e7681", flexShrink: 0 }}>{String(i + 1).padStart(3, "0")}</span>
            <span style={{ color: l.type === "error" ? "#ff7b72" : l.type === "warn" ? "#e3b341" : l.type === "success" ? "#3fb950" : "#c9d1d9" }}>{l.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ServerError() {
  const navigate   = useNavigate();
  const location   = useLocation();

  const errorCode    = location.state?.code    || 500;
  const errorMessage = location.state?.message || "Internal Server Error";
  const errorId      = location.state?.errorId || `ERR-${Date.now().toString(36).toUpperCase()}`;

  const ERROR_LABELS = {
    500: { title: "Internal Server Error",     desc: "Something went wrong on our end. Our engineers have been automatically notified.",               emoji: "💥" },
    502: { title: "Bad Gateway",               desc: "Our server received an invalid response from an upstream service. We're looking into it.",       emoji: "🌐" },
    503: { title: "Service Unavailable",        desc: "The server is temporarily unable to handle your request. This is usually due to maintenance.",  emoji: "🔧" },
    504: { title: "Gateway Timeout",            desc: "The server took too long to respond. This may be due to heavy load or a connectivity issue.",   emoji: "⏱" },
  };
  const errConf = ERROR_LABELS[errorCode] || ERROR_LABELS[500];

  // Retry logic
  const RETRY_TOTAL = 30;
  const [retryCount, setRetryCount]   = useState(0);
  const [retrying, setRetrying]       = useState(false);
  const [retryTimer, setRetryTimer]   = useState(RETRY_TOTAL);
  const [autoRetry, setAutoRetry]     = useState(true);
  const [retryStatus, setRetryStatus] = useState(null); // null | "checking" | "success" | "fail"
  const [copied, setCopied]           = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  const [logLines, setLogLines] = useState([
    { type: "info",    text: `[${new Date().toISOString()}] Request to ${location.pathname}` },
    { type: "warn",    text: "[server] Upstream service timeout after 30000ms" },
    { type: "error",   text: `[http] ${errorCode} ${errorMessage}` },
    { type: "error",   text: `[trace] Error ID: ${errorId}` },
    { type: "info",    text: "[monitor] Alert dispatched to on-call engineer" },
    { type: "info",    text: "[system] Automatic recovery procedure initiated" },
  ]);

  // Auto-retry countdown
  useEffect(() => {
    if (!autoRetry || retryStatus === "success") return;
    if (retryTimer <= 0) {
      attemptRetry();
      return;
    }
    const t = setInterval(() => setRetryTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [retryTimer, autoRetry, retryStatus]);

  const attemptRetry = useCallback(() => {
    setRetrying(true);
    setRetryStatus("checking");
    setLogLines(prev => [...prev,
      { type: "info", text: `[retry] Attempt #${retryCount + 1} — checking server health…` }
    ]);
    setTimeout(() => {
      const success = retryCount >= 2; // succeed on 3rd try for demo
      setRetrying(false);
      setRetryCount(n => n + 1);
      if (success) {
        setRetryStatus("success");
        setLogLines(prev => [...prev, { type: "success", text: "[server] Connection restored! Redirecting…" }]);
        setTimeout(() => navigate(-1), 2000);
      } else {
        setRetryStatus("fail");
        setRetryTimer(RETRY_TOTAL);
        setLogLines(prev => [...prev, { type: "error", text: `[retry] Attempt #${retryCount + 1} failed. Retrying in ${RETRY_TOTAL}s…` }]);
      }
    }, 2200);
  }, [retryCount, navigate]);

  const copyErrorId = () => {
    navigator.clipboard?.writeText(errorId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const degradedCount = SERVICES.filter(s => s.status !== "operational").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", fontFamily: "'Lato','Segoe UI',sans-serif", padding: "40px 24px" }}>

      {/* Background noise texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, ${C.rose}04 1px, transparent 1px)`, backgroundSize: "28px 28px", pointerEvents: "none" }} />

      {/* Amber glow */}
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: `radial-gradient(ellipse, ${C.amber}07, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 660, width: "100%", textAlign: "center" }}>

        {/* Branding */}
        <div style={{ display: "inline-flex", gap: 10, alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 30, padding: "8px 18px", marginBottom: 30, boxShadow: "0 2px 12px #0000000a" }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 900, fontFamily: "Georgia,serif" }}>A</span>
          </div>
          <span style={{ color: C.text2, fontSize: 12.5, fontWeight: 700 }}>AcademySphere</span>
          <span style={{ width: 1, height: 14, background: C.border }} />
          <span style={{ background: C.amberL, color: C.amber, fontSize: 11.5, fontWeight: 800, padding: "1px 8px", borderRadius: 20 }}>Error {errorCode}</span>
        </div>

        {/* Hero emoji + error code */}
        <div style={{ fontSize: 64, marginBottom: 10, display: "inline-block", animation: "errorBob 3s ease-in-out infinite", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.1))" }}>
          {errConf.emoji}
        </div>

        <div style={{ fontSize: "clamp(72px, 16vw, 130px)", fontWeight: 900, fontFamily: "Georgia,serif", letterSpacing: "-4px", lineHeight: 1, marginBottom: 12, background: `linear-gradient(135deg, ${C.amber}, ${C.rose})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", userSelect: "none" }}>
          {errorCode}
        </div>

        <h1 style={{ color: C.text1, fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 900, margin: "0 0 10px", fontFamily: "Georgia,serif" }}>
          {errConf.title}
        </h1>
        <p style={{ color: C.text2, fontSize: 14.5, margin: "0 0 24px", lineHeight: 1.65, maxWidth: 480, display: "inline-block" }}>
          {errConf.desc}
        </p>

        {/* Error ID + copy */}
        <div style={{ display: "inline-flex", gap: 10, alignItems: "center", padding: "10px 18px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 24 }}>
          <span style={{ color: C.text3, fontSize: 12 }}>Error ID:</span>
          <code style={{ color: C.amber, fontSize: 12.5, fontWeight: 800, fontFamily: "monospace" }}>{errorId}</code>
          <button onClick={copyErrorId} style={{ background: copied ? C.greenL : C.surface, border: `1px solid ${copied ? C.green + "40" : C.border}`, borderRadius: 7, padding: "4px 10px", color: copied ? C.green : C.text3, fontSize: 11.5, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        </div>

        {/* Retry status card */}
        <div style={{ background: C.surface, border: `1.5px solid ${retryStatus === "success" ? C.green : retryStatus === "fail" ? C.rose : C.border}30`, borderRadius: 16, padding: "18px 22px", marginBottom: 20, textAlign: "left", boxShadow: "0 2px 14px #0000000a" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {retryStatus === "success" ? (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenL, border: `2px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>✅</div>
            ) : retryStatus === "checking" ? (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.amberL, border: `2px solid ${C.amber}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, animation: "spin 1.5s linear infinite" }}>⚙️</div>
            ) : autoRetry ? (
              <CountdownRing seconds={retryTimer} total={RETRY_TOTAL} color={C.accent} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.s2, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⏸</div>
            )}

            <div style={{ flex: 1 }}>
              <p style={{ color: retryStatus === "success" ? C.green : retryStatus === "checking" ? C.amber : C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 3px" }}>
                {retryStatus === "success"  ? "✓ Server recovered — redirecting you back…"
                  : retryStatus === "checking" ? "Checking server health…"
                  : retryStatus === "fail"     ? `Retry attempt ${retryCount} failed`
                  : autoRetry                  ? `Auto-retrying in ${retryTimer}s (attempt ${retryCount + 1})`
                  : "Auto-retry paused"}
              </p>
              <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>
                {retryStatus === "success"  ? "The server is back online. You'll be redirected momentarily."
                  : retryStatus === "checking" ? "Please wait while we check if the server has recovered…"
                  : `${retryCount} retry attempt${retryCount !== 1 ? "s" : ""} made · Our engineers have been notified`}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {retryStatus !== "success" && retryStatus !== "checking" && (
                <button onClick={attemptRetry} style={{ background: C.accent, border: "none", borderRadius: 10, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  🔄 Retry Now
                </button>
              )}
              {autoRetry && retryStatus !== "success" && retryStatus !== "checking" && (
                <button onClick={() => setAutoRetry(false)} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ⏸
                </button>
              )}
              {!autoRetry && retryStatus !== "success" && (
                <button onClick={() => { setAutoRetry(true); setRetryTimer(RETRY_TOTAL); }} style={{ background: C.greenL, border: `1px solid ${C.green}30`, borderRadius: 10, padding: "9px 12px", color: C.green, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ▶ Resume
                </button>
              )}
            </div>
          </div>

          {/* Progress bar for countdown */}
          {autoRetry && retryStatus !== "success" && retryStatus !== "checking" && (
            <div style={{ marginTop: 12, height: 3, background: C.s3, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${(retryTimer / RETRY_TOTAL) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.amber})`, borderRadius: 2, transition: "width 1s linear" }} />
            </div>
          )}
        </div>

        {/* System status */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", marginBottom: 20, textAlign: "left", boxShadow: "0 2px 12px #0000000a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: 0 }}>System Status</p>
            {degradedCount > 0
              ? <span style={{ background: C.amberL, color: C.amber, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>⚠ {degradedCount} service{degradedCount > 1 ? "s" : ""} affected</span>
              : <span style={{ background: C.greenL, color: C.green, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>✓ All systems operational</span>
            }
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {SERVICES.map(s => {
              const cfg = SERVICE_CFG[s.status];
              return (
                <div key={s.name} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 12px", background: s.status === "operational" ? C.s2 : cfg.bg, border: `1px solid ${s.status === "operational" ? C.border : cfg.color + "30"}`, borderRadius: 9 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0, boxShadow: s.status !== "operational" ? `0 0 6px ${cfg.dot}80` : "none", animation: s.status === "incident" ? "blink 1s ease-in-out infinite" : "none" }} />
                  <span style={{ color: C.text1, fontSize: 12.5, flex: 1, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ color: cfg.color, fontSize: 11, fontWeight: 800 }}>{s.latency}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal toggle */}
        <button onClick={() => setShowTerminal(s => !s)} style={{ background: showTerminal ? "#0d1117" : C.s2, border: `1px solid ${showTerminal ? "#21262d" : C.border}`, borderRadius: 10, padding: "8px 18px", color: showTerminal ? "#c9d1d9" : C.text2, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginBottom: showTerminal ? 10 : 20, display: "flex", gap: 6, alignItems: "center", margin: "0 auto", marginBottom: 10 }}>
          <span style={{ fontFamily: "monospace", fontSize: 13 }}>&gt;_</span>
          {showTerminal ? "Hide" : "Show"} Error Trace
        </button>

        {showTerminal && (
          <div style={{ marginBottom: 20, textAlign: "left" }}>
            <ErrorTerminal lines={logLines} />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 22, flexWrap: "wrap" }}>
          <button onClick={() => navigate(-1)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 22px", color: C.text1, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px #0000000a" }}>
            ← Go Back
          </button>
          <button onClick={() => window.location.reload()} style={{ background: C.amber, border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${C.amber}30` }}>
            🔄 Reload Page
          </button>
          <Link to="/parent/help" style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 22px", color: C.text2, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", gap: 7, alignItems: "center", boxShadow: "0 2px 8px #0000000a" }}>
            💬 Get Support
          </Link>
        </div>

        {/* What to do section */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", textAlign: "left", boxShadow: "0 2px 12px #0000000a" }}>
          <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: "0 0 12px" }}>💡 While you wait, you can try:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: "🔄", l: "Reload the page",         d: "The issue may resolve itself" },
              { icon: "📶", l: "Check your connection",    d: "Ensure you have internet access" },
              { icon: "🕐", l: "Wait a few minutes",       d: "We're working on a fix" },
              { icon: "📧", l: "Contact support",          d: `Quote error ID: ${errorId}` },
            ].map(t => (
              <div key={t.l} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.s2, borderRadius: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 700, margin: "0 0 2px" }}>{t.l}</p>
                  <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>{t.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: C.text3, fontSize: 12 }}>Error {errorCode} · AcademySphere ·</span>
        <Link to="/parent/help" style={{ color: C.accent, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Report Issue</Link>
        <span style={{ color: C.text3, fontSize: 12 }}>·</span>
        <a href="https://status.academysphere.in" target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>System Status ↗</a>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes errorBob { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-10px) rotate(5deg)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}