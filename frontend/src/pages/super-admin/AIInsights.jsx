import { useState, useEffect } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const PLATFORM_METRICS = {
  totalPredictions:  142840,
  accuracy:          91.4,
  modelsActive:      4,
  avgResponseMs:     128,
  predictionsChange: 18.2,
  accuracyChange:    2.1,
};

const ATTENDANCE_TREND = [
  { month: "Sep", predicted: 87, actual: 85, atRisk: 142 },
  { month: "Oct", predicted: 84, actual: 83, atRisk: 168 },
  { month: "Nov", predicted: 81, actual: 79, atRisk: 221 },
  { month: "Dec", predicted: 78, actual: 80, atRisk: 198 },
  { month: "Jan", predicted: 85, actual: 84, atRisk: 174 },
  { month: "Feb", predicted: 88, actual: 87, atRisk: 145 },
  { month: "Mar", predicted: 90, actual: null, atRisk: 128 },
];

const PERFORMANCE_DISTRIBUTION = [
  { label: "Excellent (90–100%)", value: 22, color: "#4ade80" },
  { label: "Good (75–89%)",       value: 38, color: "#60a5fa" },
  { label: "Average (60–74%)",    value: 27, color: "#fbbf24" },
  { label: "At-Risk (< 60%)",     value: 13, color: "#f87171" },
];

const AT_RISK_STUDENTS = [
  { id: 1,  name: "Rohit Das",      school: "Greenwood High",    subject: "Mathematics", score: 38, risk: "high",   trend: "down",  avatar: "RD", attendance: 62 },
  { id: 2,  name: "Kavya Iyer",     school: "Sunflower Academy", subject: "Science",     score: 44, risk: "high",   trend: "down",  avatar: "KI", attendance: 71 },
  { id: 3,  name: "Mohan Tripathi", school: "Bluebell School",   subject: "English",     score: 51, risk: "medium", trend: "flat",  avatar: "MT", attendance: 78 },
  { id: 4,  name: "Asha Nambiar",   school: "Riverside School",  subject: "History",     score: 55, risk: "medium", trend: "up",    avatar: "AN", attendance: 82 },
  { id: 5,  name: "Jayesh Thakkar", school: "Horizon Academy",   subject: "Physics",     score: 41, risk: "high",   trend: "down",  avatar: "JT", attendance: 58 },
];

const RECOMMENDATIONS_LOG = [
  { id: 1, student: "Ananya Rao",    type: "Study Material", content: "Algebra fundamentals worksheet series", accepted: true,  school: "Greenwood High",    time: "2h ago" },
  { id: 2, student: "Ravi Mishra",   type: "Remedial Class", content: "Extra physics coaching on Thursdays", accepted: true,  school: "Bluebell School",   time: "4h ago" },
  { id: 3, student: "Pooja Shetty",  type: "Counseling",     content: "Academic stress counselor session",   accepted: false, school: "Sunflower Academy", time: "6h ago" },
  { id: 4, student: "Aryan Mehta",   type: "Study Material", content: "English grammar interactive modules", accepted: true,  school: "Riverside School",  time: "8h ago" },
  { id: 5, student: "Simran Kaur",   type: "Peer Tutoring",  content: "Math peer group pairing with rank-1", accepted: false, school: "Horizon Academy",   time: "12h ago" },
  { id: 6, student: "Dev Agarwal",   type: "Remedial Class", content: "Science lab doubt sessions Friday",   accepted: true,  school: "Greenwood High",    time: "1d ago" },
];

const MODEL_STATUS = [
  { name: "Attendance Predictor",     status: "active",   accuracy: 91.4, lastTrained: "2 days ago", predictions: 48200, version: "v2.3.1", icon: "📋" },
  { name: "Performance Analyzer",     status: "active",   accuracy: 88.7, lastTrained: "4 days ago", predictions: 61400, version: "v1.8.4", icon: "📊" },
  { name: "Recommendation Engine",    status: "active",   accuracy: 84.2, lastTrained: "1 week ago", predictions: 29800, version: "v3.1.0", icon: "💡" },
  { name: "Dropout Risk Classifier",  status: "training", accuracy: 79.1, lastTrained: "Now",        predictions: 3440,  version: "v0.9.2", icon: "⚠️" },
];

const SCHOOL_AI_USAGE = [
  { school: "Greenwood High",    predictions: 28400, accuracy: 92.1, students: 1240, color: "#6366f1" },
  { school: "Sunflower Academy", predictions: 19200, accuracy: 89.3, students: 980,  color: "#22c55e" },
  { school: "Bluebell School",   predictions: 14800, accuracy: 91.8, students: 760,  color: "#f59e0b" },
  { school: "Riverside School",  predictions: 11200, accuracy: 88.0, students: 620,  color: "#ec4899" },
  { school: "Horizon Academy",   predictions: 9600,  accuracy: 90.4, students: 540,  color: "#06b6d4" },
];

const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6"];

// ─── Sub-components ───────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, change, positive, icon, color, subtitle }) {
  return (
    <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: color + "15" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{label}</p>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <p style={{ color: "#f1f5f9", fontSize: 30, fontWeight: 800, margin: "0 0 4px 0", lineHeight: 1 }}>
        {value}<span style={{ color: "#64748b", fontSize: 16, fontWeight: 400, marginLeft: 2 }}>{unit}</span>
      </p>
      {subtitle && <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 6px 0" }}>{subtitle}</p>}
      <p style={{ color: (positive ? change > 0 : change < 0) ? "#4ade80" : "#f87171", fontSize: 12, margin: 0 }}>
        {change > 0 ? "▲" : "▼"} {Math.abs(change)}% vs last month
      </p>
    </div>
  );
}

function MiniBarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.predicted || d.value || 0));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {data.map((d, i) => {
        const h1 = ((d.predicted || d.value || 0) / max) * 100;
        const h2 = d.actual ? (d.actual / max) * 100 : null;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%", justifyContent: "flex-end" }}>
            <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: "calc(100% - 20px)" }}>
              <div style={{ flex: 1, background: "linear-gradient(180deg,#6366f1,#3b82f6)", borderRadius: "3px 3px 0 0", height: `${h1}%`, minHeight: 3, transition: "height 0.4s ease" }} title={`Predicted: ${d.predicted}%`} />
              {h2 !== null && (
                <div style={{ flex: 1, background: "linear-gradient(180deg,#4ade80,#22c55e)", borderRadius: "3px 3px 0 0", height: `${h2}%`, minHeight: 3 }} title={`Actual: ${d.actual}%`} />
              )}
              {h2 === null && (
                <div style={{ flex: 1, background: "#1e2d45", borderRadius: "3px 3px 0 0", height: "40%", minHeight: 3 }} title="Forecast" />
              )}
            </div>
            <span style={{ color: "#64748b", fontSize: 9, fontWeight: 600 }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  let offset = 0;
  const segments = data.map(d => {
    const pct = (d.value / total) * 100;
    const seg = { ...d, pct, offset };
    offset += pct;
    return seg;
  });
  const r = 40, cx = 60, cy = 60, stroke = 22;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={120} height={120} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2d45" strokeWidth={stroke} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
            strokeDashoffset={-((s.offset / 100) * circ) + circ * 0.25}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#f1f5f9" fontSize={14} fontWeight={800}>{total}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize={9}>coverage</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{d.label}</span>
            <span style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 700, marginLeft: "auto" }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const cfg = { high: { bg: "#ef444420", color: "#f87171", label: "High Risk" }, medium: { bg: "#f59e0b20", color: "#fbbf24", label: "Medium" }, low: { bg: "#22c55e20", color: "#4ade80", label: "Low" } };
  const c = cfg[level];
  return <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c.label}</span>;
}

function TrendIcon({ trend }) {
  return <span style={{ fontSize: 14 }}>{trend === "up" ? "📈" : trend === "down" ? "📉" : "➡️"}</span>;
}

function ScoreBar({ score }) {
  const color = score >= 75 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 6, background: "#1e2d45", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 700 }}>{score}%</span>
    </div>
  );
}

function PulsingDot() {
  return (
    <span style={{ display: "inline-block", position: "relative", width: 10, height: 10 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#4ade80", animation: "ping 1.5s infinite", opacity: 0.6 }} />
      <span style={{ position: "absolute", inset: "2px", borderRadius: "50%", background: "#4ade80" }} />
      <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.8);opacity:0} }`}</style>
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AIInsights() {
  const [activeSection, setActiveSection] = useState("overview");
  const [chatInput, setChatInput]         = useState("");
  const [chatMessages, setChatMessages]   = useState([
    { role: "assistant", text: "Hi! I'm the AcademySphere AI assistant. Ask me anything about student performance, attendance trends, or school analytics." }
  ]);
  const [isTyping, setIsTyping]           = useState(false);
  const [animCount, setAnimCount]         = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimCount(142840), 600);
    return () => clearTimeout(t);
  }, []);

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(p => [...p, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI response (replace with actual API call to academysphere-ai service)
    setTimeout(() => {
      const responses = {
        attendance: "Based on current data, attendance across all schools averages 86.4%. Greenwood High leads at 91.2%. I predict a dip in November — recommend proactive parent outreach in October.",
        performance: "22% of students are performing excellently. However, 13% are at risk (below 60%). Mathematics and Physics show the highest at-risk concentrations. I recommend targeted remedial sessions.",
        risk: "Currently 128 students are flagged as high-risk for the next 30 days. Top risk factors: attendance below 65%, 3+ consecutive assignment failures, parental disengagement.",
      };
      const key = userMsg.toLowerCase().includes("attend") ? "attendance" : userMsg.toLowerCase().includes("perform") ? "performance" : "risk";
      setChatMessages(p => [...p, { role: "assistant", text: responses[key] || "I can analyze attendance trends, student performance, at-risk identification, and generate actionable insights. What would you like to explore?" }]);
      setIsTyping(false);
    }, 1800);
  };

  const sections = [
    { key: "overview",   label: "Overview",       icon: "🧠" },
    { key: "attendance", label: "Attendance AI",  icon: "📋" },
    { key: "students",   label: "At-Risk Students",icon: "⚠️" },
    { key: "models",     label: "Model Health",   icon: "⚙️" },
    { key: "chatbot",    label: "AI Assistant",   icon: "💬" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", padding: "28px 32px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 800, margin: 0 }}>AI Insights</h1>
            <div style={{ background: "#14532d", border: "1px solid #4ade8050", borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <PulsingDot />
              <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>Live</span>
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>AI-powered analytics across all schools and student cohorts</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 2px 0" }}>Last model update</p>
          <p style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700, margin: 0 }}>Today, 03:00 AM</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#131929", border: "1px solid #1e2d45", borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 28 }}>
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              background: activeSection === s.key ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "transparent",
              border: "none", borderRadius: 9, padding: "8px 16px",
              color: activeSection === s.key ? "#fff" : "#64748b",
              fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
            }}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ────────────────────────────────────── */}
      {activeSection === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <MetricCard label="Total Predictions"  value={PLATFORM_METRICS.totalPredictions.toLocaleString()} unit="" change={PLATFORM_METRICS.predictionsChange} positive icon="🔮" color="#6366f1" subtitle="Last 90 days" />
            <MetricCard label="Model Accuracy"     value={PLATFORM_METRICS.accuracy}                         unit="%"  change={PLATFORM_METRICS.accuracyChange}    positive icon="🎯" color="#22c55e" subtitle="Avg across all models" />
            <MetricCard label="Active Models"      value={PLATFORM_METRICS.modelsActive}                     unit=""   change={0}                                   positive icon="🤖" color="#f59e0b" subtitle="1 currently retraining" />
            <MetricCard label="Avg Response Time"  value={PLATFORM_METRICS.avgResponseMs}                    unit="ms" change={-12.4}                               positive={false} icon="⚡" color="#06b6d4" subtitle="P99 latency" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Attendance Chart */}
            <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: 0 }}>Attendance Prediction vs Actual</p>
                  <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0 0" }}>Sep 2024 – Mar 2025</p>
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  {[{ c: "#6366f1", l: "Predicted" }, { c: "#4ade80", l: "Actual" }].map(x => (
                    <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: x.c }} />
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <MiniBarChart data={ATTENDANCE_TREND} maxVal={100} />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#0f172a", borderRadius: 8, border: "1px solid #6366f120" }}>
                <p style={{ color: "#a5b4fc", fontSize: 12, margin: 0 }}>
                  <strong>🔮 March Forecast:</strong> 90% attendance expected. Model confidence: 94.2%
                </p>
              </div>
            </div>

            {/* Performance Distribution */}
            <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "20px 24px" }}>
              <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: "0 0 4px 0" }}>Student Performance Distribution</p>
              <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 20px 0" }}>Across all active schools</p>
              <DonutChart data={PERFORMANCE_DISTRIBUTION} />
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#ef444410", borderRadius: 8, border: "1px solid #ef444430" }}>
                <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>
                  <strong>⚠️ Action Required:</strong> 13% of students (approx. 626) are performing below 60% and need intervention.
                </p>
              </div>
            </div>
          </div>

          {/* School Usage */}
          <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "20px 24px" }}>
            <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: "0 0 16px 0" }}>AI Usage by School</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SCHOOL_AI_USAGE.map(s => (
                <div key={s.school} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px 100px", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 32, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                    <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{s.school}</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${(s.predictions / 30000) * 100}%`, height: "100%", background: `linear-gradient(90deg,${s.color}80,${s.color})`, borderRadius: 6 }} />
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 12, textAlign: "right" }}>{s.predictions.toLocaleString()} calls</span>
                  <span style={{ color: "#4ade80", fontSize: 12, textAlign: "right", fontWeight: 700 }}>{s.accuracy}% acc.</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── AT-RISK STUDENTS ────────────────────────────── */}
      {activeSection === "students" && (
        <>
          <div style={{ background: "#1a0f0f", border: "1px solid #ef444430", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ color: "#fca5a5", fontWeight: 700, fontSize: 14, margin: 0 }}>128 Students Flagged as High-Risk</p>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "2px 0 0 0" }}>AI has identified these students based on attendance, grade trends, and engagement patterns. Immediate intervention recommended.</p>
            </div>
          </div>

          <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e2d45" }}>
                  {["Student", "School", "Weak Subject", "Score", "Attendance", "Risk Level", "Trend", "Action"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AT_RISK_STUDENTS.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>{s.avatar}</div>
                        <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 13 }}>{s.school}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: "#1e2d45", color: "#94a3b8", padding: "3px 10px", borderRadius: 6, fontSize: 12 }}>{s.subject}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}><ScoreBar score={s.score} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: "#1e2d45", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${s.attendance}%`, height: "100%", background: s.attendance >= 75 ? "#4ade80" : "#f87171", borderRadius: 3 }} />
                        </div>
                        <span style={{ color: s.attendance >= 75 ? "#4ade80" : "#f87171", fontSize: 12 }}>{s.attendance}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}><RiskBadge level={s.risk} /></td>
                    <td style={{ padding: "14px 16px" }}><TrendIcon trend={s.trend} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <button style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", border: "none", borderRadius: 7, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Intervene
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendations Log */}
          <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "20px 24px", marginTop: 20 }}>
            <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, margin: "0 0 16px 0" }}>Recent AI Recommendations</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RECOMMENDATIONS_LOG.map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#0f172a", borderRadius: 10, border: "1px solid #1e2d45" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.accepted ? "#4ade80" : "#f87171", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, margin: 0 }}>{r.student}</p>
                    <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0 0" }}>{r.content}</p>
                  </div>
                  <span style={{ background: "#1e2d45", color: "#94a3b8", padding: "3px 10px", borderRadius: 6, fontSize: 11 }}>{r.type}</span>
                  <span style={{ color: r.accepted ? "#4ade80" : "#f87171", fontSize: 11, fontWeight: 700 }}>{r.accepted ? "✓ Accepted" : "✗ Declined"}</span>
                  <span style={{ color: "#334155", fontSize: 11 }}>{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── MODEL HEALTH ────────────────────────────────── */}
      {activeSection === "models" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {MODEL_STATUS.map(m => (
            <div key={m.name} style={{ background: "#131929", border: `1px solid ${m.status === "training" ? "#fbbf2440" : "#1e2d45"}`, borderRadius: 14, padding: "22px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>{m.icon}</span>
                  <div>
                    <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, margin: 0 }}>{m.name}</p>
                    <p style={{ color: "#64748b", fontSize: 11, margin: "2px 0 0 0" }}>{m.version} · Last trained {m.lastTrained}</p>
                  </div>
                </div>
                {m.status === "training" ? (
                  <span style={{ background: "#fbbf2420", color: "#fbbf24", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    <PulsingDot /> Training
                  </span>
                ) : (
                  <span style={{ background: "#22c55e20", color: "#4ade80", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>● Active</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#0f172a", borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 4px 0" }}>Accuracy</p>
                  <p style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, margin: 0 }}>{m.accuracy}<span style={{ color: "#64748b", fontSize: 13 }}>%</span></p>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 4px 0" }}>Total Predictions</p>
                  <p style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, margin: 0 }}>{(m.predictions / 1000).toFixed(1)}<span style={{ color: "#64748b", fontSize: 13 }}>k</span></p>
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 11 }}>Accuracy Score</span>
                  <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>{m.accuracy}%</span>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${m.accuracy}%`, height: "100%", background: `linear-gradient(90deg,#6366f1,#4ade80)`, borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button style={{ flex: 1, padding: "8px", background: "#1e2d45", border: "none", borderRadius: 7, color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View Logs</button>
                <button style={{ flex: 1, padding: "8px", background: m.status === "training" ? "#1e2d45" : "linear-gradient(135deg,#6366f1,#3b82f6)", border: "none", borderRadius: 7, color: m.status === "training" ? "#64748b" : "#fff", fontSize: 12, fontWeight: 600, cursor: m.status === "training" ? "not-allowed" : "pointer" }}>
                  {m.status === "training" ? "Training…" : "Retrain"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI CHATBOT ──────────────────────────────────── */}
      {activeSection === "chatbot" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, display: "flex", flexDirection: "column", height: 580 }}>
            {/* Chat Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #1e2d45", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
              <div>
                <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, margin: 0 }}>AcademySphere AI Assistant</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><PulsingDot /><span style={{ color: "#4ade80", fontSize: 11 }}>Online · Powered by Claude</span></div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10 }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                  )}
                  <div style={{ maxWidth: "72%", background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "#0f172a", borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "2px 14px 14px 14px", padding: "11px 15px", border: m.role === "assistant" ? "1px solid #1e2d45" : "none" }}>
                    <p style={{ color: "#e2e8f0", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{m.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
                  <div style={{ background: "#0f172a", borderRadius: "2px 14px 14px 14px", padding: "14px 18px", border: "1px solid #1e2d45" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: `bounce 1.2s ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                    <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "14px 18px", borderTop: "1px solid #1e2d45", display: "flex", gap: 10 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleChat()}
                placeholder="Ask about attendance, performance, at-risk students…"
                style={{ flex: 1, background: "#0f172a", border: "1px solid #1e2d45", borderRadius: 10, padding: "11px 16px", color: "#f1f5f9", fontSize: 13, outline: "none" }}
              />
              <button
                onClick={handleChat}
                style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Send →
              </button>
            </div>
          </div>

          {/* Suggested Queries */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Suggested Queries</p>
            {[
              { icon: "📋", q: "Which schools have lowest attendance this month?" },
              { icon: "⚠️", q: "Show me students at risk of failing" },
              { icon: "📈", q: "What is the performance trend for Grade 10?" },
              { icon: "🔮", q: "Predict next month's attendance rate" },
              { icon: "💡", q: "Which subjects need remedial intervention?" },
              { icon: "🏆", q: "Top performing schools this quarter" },
            ].map(s => (
              <button
                key={s.q}
                onClick={() => { setChatInput(s.q); }}
                style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 10, padding: "12px 14px", color: "#94a3b8", fontSize: 12, cursor: "pointer", textAlign: "left", display: "flex", gap: 8, alignItems: "flex-start", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1e2d45"}
              >
                <span>{s.icon}</span> {s.q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attendance tab placeholder */}
      {activeSection === "attendance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {SCHOOL_AI_USAGE.map((s, i) => (
            <div key={s.school} style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, margin: 0 }}>{s.school}</p>
                  <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0 0" }}>{s.students} students tracked</p>
                </div>
                <span style={{ background: s.color + "20", color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.accuracy}% acc</span>
              </div>
              <MiniBarChart data={ATTENDANCE_TREND.map(d => ({ ...d, predicted: d.predicted - (i * 1.2), actual: d.actual ? d.actual - (i * 0.8) : null }))} maxVal={100} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
                  <p style={{ color: "#64748b", fontSize: 10, margin: "0 0 2px 0", textTransform: "uppercase" }}>At-Risk Students</p>
                  <p style={{ color: "#f87171", fontSize: 18, fontWeight: 800, margin: 0 }}>{Math.round(ATTENDANCE_TREND[5].atRisk * (0.8 + i * 0.15))}</p>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
                  <p style={{ color: "#64748b", fontSize: 10, margin: "0 0 2px 0", textTransform: "uppercase" }}>Forecast (Mar)</p>
                  <p style={{ color: "#4ade80", fontSize: 18, fontWeight: 800, margin: 0 }}>{(90 - i * 1.5).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}