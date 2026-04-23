// src/pages/super-admin/SuperAdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { fetchDashboard, fetchAnalytics } from "../../services/superAdminApi";

// ── Month label helper ────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildEnrollmentTrend(recentRegistrations = []) {
  return recentRegistrations.map((r) => ({
    month: MONTHS[(r._id.month || 1) - 1],
    schools: r.count,
    students: r.count * 220, // estimated until you add student-per-month aggregation
  }));
}

function buildPlanData(schoolsByPlan = []) {
  const COLOR_MAP = {
    enterprise: "#5b8cff",
    pro:        "#38d9c0",
    basic:      "#ffb547",
    free:       "#8b93b0",
    trial:      "#ff5f7e",
  };
  return schoolsByPlan.map((p) => ({
    name: (p._id || "unknown").toUpperCase(),
    value: p.count,
    color: COLOR_MAP[p._id?.toLowerCase()] || "#8b93b0",
  }));
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0c0f1a",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: "#8b93b0", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#5b8cff", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" && p.value > 999
            ? p.value.toLocaleString("en-IN")
            : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 20, radius = 6, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    background: "linear-gradient(90deg, #111520 25%, #181d2e 50%, #111520 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    ...style,
  }} />
);

// ── Error card ─────────────────────────────────────────────────────────────────
const ErrorCard = ({ message, onRetry }) => (
  <div style={{
    background: "rgba(255,95,126,0.08)", border: "1px solid rgba(255,95,126,0.2)",
    borderRadius: 10, padding: "20px 24px", display: "flex",
    alignItems: "center", justifyContent: "space-between", gap: 12,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#ff5f7e" }}>Failed to load dashboard</div>
        <div style={{ fontSize: 12, color: "#8b93b0", marginTop: 2 }}>{message}</div>
      </div>
    </div>
    <button onClick={onRetry} style={{
      padding: "7px 16px", borderRadius: 7, border: "1px solid rgba(255,95,126,0.3)",
      background: "rgba(255,95,126,0.12)", color: "#ff5f7e", cursor: "pointer",
      fontSize: 12, fontWeight: 600, fontFamily: "inherit",
    }}>
      Retry
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading  ] = useState(true);
  const [error,     setError    ] = useState(null);
  const [loaded,    setLoaded   ] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [dash, anl] = await Promise.all([fetchDashboard(), fetchAnalytics()]);
      setDashboard(dash.data);
      setAnalytics(anl.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + mount animation
  useEffect(() => {
    loadAll();
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, [loadAll]);

  // Auto-refresh every 60 seconds (silent)
  useEffect(() => {
    const id = setInterval(() => loadAll(true), 60_000);
    return () => clearInterval(id);
  }, [loadAll]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const kpis = dashboard?.kpis ?? {};
  const recentSchools = dashboard?.recentSchools ?? [];
  const summary = analytics?.summary ?? {};
  const enrollmentTrend = buildEnrollmentTrend(analytics?.recentRegistrations ?? []);
  const planData = buildPlanData(analytics?.schoolsByPlan ?? []);
  const stateData = (analytics?.schoolsByState ?? [])
    .slice(0, 6)
    .map((s) => ({ state: (s._id || "Unknown").slice(0, 10), schools: s.schools }));

  const statusData = (analytics?.schoolsByStatus ?? []).map((s) => ({
    name: (s._id || "unknown").toUpperCase(),
    value: s.count,
    color: s._id === "active" ? "#3dd68c" : s._id === "pending" ? "#ffb547" : "#ff5f7e",
  }));

  const topMetrics = [
    {
      label: "Total Schools",
      value: (kpis.totalSchools ?? summary.totalSchools ?? 0).toLocaleString("en-IN"),
      sub: `${kpis.activeSchools ?? summary.activeSchools ?? 0} active`,
      color: "#5b8cff",
      icon: "🏫",
      to: "/super-admin/schools",
    },
    {
      label: "Total Students",
      value: (kpis.totalStudents ?? summary.totalStudents ?? 0).toLocaleString("en-IN"),
      sub: "enrolled platform-wide",
      color: "#38d9c0",
      icon: "🎓",
      to: "/super-admin/users?role=STUDENT",
    },
    {
      label: "Total Teachers",
      value: (kpis.totalTeachers ?? summary.totalTeachers ?? 0).toLocaleString("en-IN"),
      sub: "active educators",
      color: "#9f7aea",
      icon: "👨‍🏫",
      to: "/super-admin/users?role=TEACHER",
    },
    {
      label: "Platform Users",
      value: (kpis.totalUsers ?? summary.totalUsers ?? 0).toLocaleString("en-IN"),
      sub: "all roles combined",
      color: "#f6ad55",
      icon: "👥",
      to: "/super-admin/users",
    },
  ];

  const STATUS_COLOR = { active: "#3dd68c", approved: "#3dd68c", trial: "#ffb547", pending: "#ffb547", rejected: "#ff5f7e", suspended: "#ff5f7e" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .dash-root {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          min-height: 100%;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.4s ease, transform 0.4s ease;
          padding-bottom: 48px;
        }
        .dash-root.visible { opacity:1; transform:none; }

        .dash-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .dash-title {
          font-size: 26px;
          font-weight: 800;
          color: #eef0f8;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .dash-subtitle {
          font-size: 13px;
          color: #8b93b0;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3dd68c;
          animation: pulse 2s infinite;
          display: inline-block;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .header-actions { display:flex; gap:8px; align-items:center; }
        .btn-sm {
          padding: 7px 16px; border-radius: 7px;
          font-size: 12.5px; font-weight: 600;
          font-family: 'Outfit', sans-serif; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.18s;
        }
        .btn-ghost { background: #0c0f1a; color: #8b93b0; }
        .btn-ghost:hover { background: #111520; color: #eef0f8; }
        .btn-primary {
          background: linear-gradient(135deg,#5b8cff,#38d9c0);
          color: #060810; border-color: transparent;
        }
        .btn-primary:hover { filter:brightness(1.08); }
        .btn-refresh {
          width: 32px; height: 32px; border-radius: 7px;
          background: #0c0f1a; border: 1px solid rgba(255,255,255,0.07);
          color: #8b93b0; cursor: pointer; display:flex;
          align-items:center; justify-content:center; font-size:14px;
          transition: all 0.18s;
        }
        .btn-refresh:hover { color:#eef0f8; background:#111520; }
        .btn-refresh.spinning span { animation: spin 0.8s linear infinite; display:inline-block; }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 14px;
        }
        .kpi-card {
          background: #0c0f1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 18px 20px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
          animation: fadeUp 0.4s ease both;
        }
        .kpi-card:hover {
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .kpi-accent-bar {
          position:absolute; top:0; left:0; right:0;
          height:2px; border-radius:12px 12px 0 0;
        }
        .kpi-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
        .kpi-label { font-size:11.5px; font-weight:500; color:#8b93b0; letter-spacing:0.3px; text-transform:uppercase; }
        .kpi-icon { font-size:18px; opacity:0.8; }
        .kpi-value { font-size:30px; font-weight:800; color:#eef0f8; line-height:1; letter-spacing:-1.5px; }
        .kpi-footer { display:flex; align-items:center; gap:6px; margin-top:8px; }
        .kpi-sub { font-size:11.5px; color:#4a5168; }
        .kpi-arrow { font-size:11px; color:#8b93b0; margin-left:auto; }

        /* Panel */
        .panel {
          background: #0c0f1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 22px;
          animation: fadeUp 0.45s ease both;
        }
        .panel-header {
          display:flex; align-items:center;
          justify-content:space-between; margin-bottom:20px;
        }
        .panel-title { font-size:14px; font-weight:700; color:#eef0f8; }
        .panel-meta { font-size:12px; color:#8b93b0; }
        .legend { display:flex; gap:14px; margin-bottom:14px; flex-wrap:wrap; }
        .legend-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#8b93b0; }
        .legend-dot { width:8px; height:8px; border-radius:50%; }

        /* Charts layout */
        .charts-row { display:grid; grid-template-columns:2fr 1fr; gap:16px; }
        .charts-row-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .bottom-row { display:grid; grid-template-columns:1.4fr 1fr; gap:16px; }

        /* Table */
        .data-table { width:100%; border-collapse:collapse; }
        .data-table th {
          font-size:10.5px; font-weight:600; letter-spacing:0.8px;
          text-transform:uppercase; color:#4a5168; text-align:left;
          padding:0 0 10px; border-bottom:1px solid rgba(255,255,255,0.05);
        }
        .data-table td {
          font-size:13px; color:#8b93b0; padding:10px 0;
          border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle;
        }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:hover td { color:#eef0f8; cursor:pointer; }
        .school-name { font-weight:500; color:#c8d3e8; font-size:13px; }
        .city-tag { font-size:11px; color:#8b93b0; display:block; margin-top:1px; }
        .status-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:3px 8px; border-radius:20px;
          font-size:11px; font-weight:600;
        }
        .status-dot-sm { width:5px; height:5px; border-radius:50%; }
        .plan-tag {
          font-size:11px; font-weight:600; color:#8b93b0;
          background:#111520; padding:2px 8px; border-radius:4px;
        }

        /* Stat row */
        .stat-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04);
        }
        .stat-row:last-child { border-bottom:none; }
        .stat-label { font-size:13px; color:#8b93b0; display:flex; align-items:center; gap:8px; }
        .stat-value { font-size:14px; font-weight:700; color:#eef0f8; font-family:'DM Mono', monospace; }

        /* Empty state */
        .empty-state {
          text-align:center; padding:40px 20px;
          color:#4a5168; font-size:13px;
        }
        .empty-icon { font-size:32px; margin-bottom:10px; opacity:0.5; }

        /* Timestamp */
        .timestamp {
          font-size:11px; color:#4a5168;
          font-family:'DM Mono', monospace;
          display:flex; align-items:center; gap:5px;
        }

        @media (max-width:1100px) { .charts-row,.charts-row-3 { grid-template-columns:1fr; } }
        @media (max-width:800px)  { .bottom-row { grid-template-columns:1fr; } .kpi-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:500px)  { .dash-root { padding:16px; } .kpi-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className={`dash-root${loaded ? " visible" : ""}`}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Platform Dashboard</h1>
            <p className="dash-subtitle">
              <span className="live-dot" />
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}`
                : "Loading data…"}
            </p>
          </div>
          <div className="header-actions">
            <button
              className={`btn-refresh${loading ? " spinning" : ""}`}
              onClick={() => loadAll()}
              title="Refresh"
            >
              <span>↻</span>
            </button>
            <button className="btn-sm btn-ghost" onClick={() => navigate("/super-admin/analytics")}>
              Analytics →
            </button>
            <button className="btn-sm btn-primary" onClick={() => navigate("/super-admin/schools/onboard")}>
              + Onboard School
            </button>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && <ErrorCard message={error} onRetry={() => loadAll()} />}

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="kpi-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div className="kpi-card" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="kpi-accent-bar" style={{ background: "#1e2540" }} />
                  <Skeleton h={11} w="60%" style={{ marginBottom: 12 }} />
                  <Skeleton h={32} w="50%" style={{ marginBottom: 8 }} />
                  <Skeleton h={11} w="40%" />
                </div>
              ))
            : topMetrics.map((m, i) => (
                <div
                  className="kpi-card"
                  key={m.label}
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => navigate(m.to)}
                >
                  <div className="kpi-accent-bar" style={{ background: m.color }} />
                  <div className="kpi-top">
                    <div className="kpi-label">{m.label}</div>
                    <div className="kpi-icon">{m.icon}</div>
                  </div>
                  <div className="kpi-value">{m.value}</div>
                  <div className="kpi-footer">
                    <span className="kpi-sub">{m.sub}</span>
                    <span className="kpi-arrow">↗</span>
                  </div>
                </div>
              ))}
        </div>

        {/* ── Enrollment + Status ─────────────────────────────────────────── */}
        <div className="charts-row">

          {/* Enrollment trend */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Enrollment Growth</div>
                <div className="panel-meta">New school registrations over time</div>
              </div>
            </div>
            {loading ? (
              <Skeleton h={200} radius={8} />
            ) : enrollmentTrend.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📈</div>
                No registration data yet
              </div>
            ) : (
              <>
                <div className="legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background:"#5b8cff" }} />Schools</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background:"#38d9c0" }} />Est. Students</div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={enrollmentTrend} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                    <defs>
                      <linearGradient id="gSchools" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5b8cff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#5b8cff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38d9c0" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#38d9c0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill:"#8b93b0", fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#8b93b0", fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="schools"  stroke="#5b8cff" strokeWidth={2} fill="url(#gSchools)"  name="Schools"  />
                    <Area type="monotone" dataKey="students" stroke="#38d9c0" strokeWidth={2} fill="url(#gStudents)" name="Est. Students" />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* Status breakdown */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">School Status</div>
              <div className="panel-meta">Live</div>
            </div>
            {loading ? (
              <Skeleton h={200} radius={8} />
            ) : statusData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏫</div>
                No schools yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%" innerRadius={46} outerRadius={72}
                      paddingAngle={3} dataKey="value"
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", flexDirection:"column", gap:0, marginTop:4 }}>
                  {statusData.map((s) => (
                    <div className="stat-row" key={s.name}>
                      <div className="stat-label">
                        <span style={{ width:8, height:8, borderRadius:"50%", background:s.color, display:"inline-block" }} />
                        {s.name}
                      </div>
                      <div className="stat-value">{s.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Plan distribution + Top states ─────────────────────────────── */}
        <div className="charts-row">

          {/* Plan distribution */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Subscription Plans</div>
            </div>
            {loading ? (
              <Skeleton h={160} radius={8} />
            ) : planData.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💎</div>No plan data</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={planData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill:"#8b93b0", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#8b93b0", fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[5,5,0,0]} name="Schools" maxBarSize={40}>
                    {planData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top states */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Top States</div>
              <div className="panel-meta">by school count</div>
            </div>
            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={16} />)}
              </div>
            ) : stateData.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🗺️</div>No state data yet</div>
            ) : (
              stateData.map((s, i) => {
                const maxSchools = stateData[0]?.schools || 1;
                const pct = Math.round((s.schools / maxSchools) * 100);
                return (
                  <div key={s.state} style={{ marginBottom: 10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#8b93b0", marginBottom:4 }}>
                      <span>{i + 1}. {s.state}</span>
                      <span style={{ color:"#eef0f8", fontWeight:600, fontFamily:"'DM Mono', monospace" }}>{s.schools}</span>
                    </div>
                    <div style={{ height:4, background:"rgba(255,255,255,0.05)", borderRadius:3 }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, #5b8cff, #38d9c0)`, borderRadius:3 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Bottom row: Recent schools + Quick stats ────────────────────── */}
        <div className="bottom-row">

          {/* Recent schools */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Recent Schools</div>
              <button className="btn-sm btn-ghost" onClick={() => navigate("/super-admin/schools")}>
                View all →
              </button>
            </div>
            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={44} radius={8} />)}
              </div>
            ) : recentSchools.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏫</div>
                No schools onboarded yet.{" "}
                <span
                  style={{ color:"#5b8cff", cursor:"pointer" }}
                  onClick={() => navigate("/super-admin/schools/onboard")}
                >
                  Onboard one →
                </span>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSchools.map((s) => {
                    const sc = STATUS_COLOR[s.status] || "#8b93b0";
                    return (
                      <tr
                        key={s._id}
                        onClick={() => navigate(`/super-admin/schools/${s._id}`)}
                      >
                        <td>
                          <span className="school-name">{s.name}</span>
                          <span className="city-tag">{s.city || s.state}</span>
                        </td>
                        <td style={{ fontFamily:"'DM Mono', monospace" }}>
                          {(s.students || 0).toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span className="status-badge" style={{ background:`${sc}18`, color:sc }}>
                            <span className="status-dot-sm" style={{ background:sc }} />
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <span className="plan-tag">{s.plan ?? "—"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick stats */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Quick Stats</div>
              <span className="panel-meta">from live DB</span>
            </div>
            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={20} />)}
              </div>
            ) : (
              [
                { label:"Total Schools",    value:(kpis.totalSchools ?? 0).toLocaleString("en-IN"),   icon:"🏫" },
                { label:"Active Schools",   value:(kpis.activeSchools ?? 0).toLocaleString("en-IN"),  icon:"✅" },
                { label:"Total Students",   value:(kpis.totalStudents ?? 0).toLocaleString("en-IN"),  icon:"🎓" },
                { label:"Total Teachers",   value:(kpis.totalTeachers ?? 0).toLocaleString("en-IN"),  icon:"👨‍🏫" },
                { label:"Platform Users",   value:(kpis.totalUsers ?? 0).toLocaleString("en-IN"),     icon:"👥" },
                { label:"Pending Apps",     value:(analytics?.summary?.pendingApps ?? "—"),           icon:"📋" },
              ].map((s) => (
                <div className="stat-row" key={s.label}>
                  <div className="stat-label">
                    <span>{s.icon}</span>
                    {s.label}
                  </div>
                  <div className="stat-value">{s.value}</div>
                </div>
              ))
            )}

            {/* Last updated */}
            {lastUpdated && (
              <div className="timestamp" style={{ marginTop:16, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <span className="live-dot" />
                Auto-refresh every 60s · {lastUpdated.toLocaleTimeString("en-IN")}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}