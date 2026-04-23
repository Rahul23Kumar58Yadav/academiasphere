import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

// ── API (matches your superAdminApi.js) ───────────────────────────────────────
import { fetchAnalytics } from "../../services/superAdminApi";

// ── Static mock data (Revenue / AI / Blockchain — no backend endpoint yet) ───
const MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];

const REVENUE_MONTHLY = MONTHS.map((m, i) => ({
  month: m,
  fees:        +(1.8 + i * 0.38).toFixed(2),
  vendor:      +(0.4 + i * 0.13).toFixed(2),
  blockchain:  +(0.2 + i * 0.08).toFixed(2),
}));

const AI_PERFORMANCE = [
  { name: "Attendance Prediction", accuracy: 94, precision: 91, recall: 89, f1: 90 },
  { name: "Grade Prediction",      accuracy: 87, precision: 85, recall: 83, f1: 84 },
  { name: "Dropout Risk",          accuracy: 91, precision: 88, recall: 86, f1: 87 },
  { name: "Recommendation",        accuracy: 82, precision: 80, recall: 84, f1: 82 },
];

const BLOCKCHAIN_METRICS = MONTHS.map((m, i) => ({
  month: m,
  transactions: 2800 + i * 340,
  certificates: 180  + i * 28,
}));

// ── Colour palette ────────────────────────────────────────────────────────────
const PLAN_COLORS   = { enterprise:"#63b3ed", pro:"#9f7aea", basic:"#4fd1c5", free:"#48bb78", trial:"#f6ad55" };
const REGION_COLORS = ["#63b3ed","#4fd1c5","#9f7aea","#f6ad55","#fc8181",
                       "#68d391","#fbb6ce","#b794f4","#90cdf4","#fbd38d"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Convert {year, month} + count from recentRegistrations → chart row */
function buildGrowthData(recentRegistrations = []) {
  if (!recentRegistrations.length) return [];
  return recentRegistrations.map(r => ({
    month:   `${MONTH_NAMES[r._id.month]} ${String(r._id.year).slice(2)}`,
    schools: r.count,
  }));
}

/** schoolsByPlan → pie data */
function buildPlanDist(schoolsByPlan = []) {
  return schoolsByPlan.map(p => ({
    name:  p._id ? capitalise(p._id) : "Unknown",
    value: p.count,
    color: PLAN_COLORS[p._id?.toLowerCase()] || "#a0aec0",
  }));
}

/** schoolsByState → regional rows (top 5) */
function buildRegionData(schoolsByState = []) {
  return schoolsByState.slice(0, 5).map(s => ({
    region:   s._id || "Unknown",
    schools:  s.schools,
  }));
}

function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ── Sub-components ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#0d1117", border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:8, padding:"10px 14px", fontSize:12, minWidth:130,
    }}>
      <p style={{ color:"#6b7a99", marginBottom:6, fontWeight:600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:p.color||"#63b3ed", fontWeight:500, marginBottom:2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const SkeletonBlock = ({ h = 20, w = "100%", radius = 6, mb = 0 }) => (
  <div style={{
    height:h, width:w, borderRadius:radius, marginBottom:mb,
    background:"linear-gradient(90deg,#1a2035 25%,#232d45 50%,#1a2035 75%)",
    backgroundSize:"200% 100%",
    animation:"shimmer 1.4s infinite",
  }} />
);

const ErrorBanner = ({ message, onRetry }) => (
  <div style={{
    background:"rgba(252,129,129,0.08)", border:"1px solid rgba(252,129,129,0.2)",
    borderRadius:10, padding:"16px 20px", display:"flex",
    alignItems:"center", justifyContent:"space-between", gap:12,
  }}>
    <span style={{ color:"#fc8181", fontSize:13 }}>⚠ {message}</span>
    <button onClick={onRetry} style={{
      background:"rgba(252,129,129,0.15)", border:"1px solid rgba(252,129,129,0.3)",
      borderRadius:6, color:"#fc8181", fontSize:12, fontWeight:600,
      padding:"5px 14px", cursor:"pointer", fontFamily:"inherit",
    }}>Retry</button>
  </div>
);

const MockBadge = () => (
  <span style={{
    fontSize:10, fontWeight:700, letterSpacing:"0.6px",
    background:"rgba(246,173,85,0.12)", color:"#f6ad55",
    border:"1px solid rgba(246,173,85,0.25)",
    borderRadius:4, padding:"2px 7px", textTransform:"uppercase",
  }}>Sample Data</span>
);

const TABS = ["Overview","Revenue","AI & ML","Blockchain","Regional"];

// ══════════════════════════════════════════════════════════════════════════════
export default function PlatformAnalytics() {
  const [activeTab,  setActiveTab]  = useState("Overview");
  const [loaded,     setLoaded]     = useState(false);
  const [dateRange,  setDateRange]  = useState("12M");

  // ── Real data state ─────────────────────────────────────────────────────────
  const [apiData,    setApiData]    = useState(null);
  const [fetching,   setFetching]   = useState(true);
  const [apiError,   setApiError]   = useState(null);

  const loadAnalytics = useCallback(async () => {
    setFetching(true);
    setApiError(null);
    try {
      const res  = await fetchAnalytics();
      setApiData(res.data);
    } catch (err) {
      setApiError(err.message || "Failed to load analytics.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Tab-change fade animation
  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, [activeTab]);

  // ── Derived data from API ───────────────────────────────────────────────────
  const summary        = apiData?.summary            || {};
  const planDist       = buildPlanDist(apiData?.schoolsByPlan);
  const growthData     = buildGrowthData(apiData?.recentRegistrations);
  const regionData     = buildRegionData(apiData?.schoolsByState);
  const totalPlanCount = planDist.reduce((s, p) => s + p.value, 0) || 1;
  const maxRegionSchools = regionData[0]?.schools || 1;

  const radarData = AI_PERFORMANCE.map(d => ({
    subject:  d.name,
    accuracy: d.accuracy,
    fullMark: 100,
  }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pa-root {
          padding:28px; display:flex; flex-direction:column; gap:22px;
          min-height:100%; font-family:'DM Sans',sans-serif;
          background:#070c14;
        }
        .page-header  { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:14px; }
        .page-title   { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#e8edf5; letter-spacing:-0.5px; }
        .page-sub     { font-size:13px; color:#6b7a99; margin-top:4px; }

        .range-tabs   { display:flex; background:#0d1117; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:3px; gap:2px; }
        .range-tab    { padding:5px 12px; border-radius:5px; font-size:12px; font-weight:600; cursor:pointer; color:#6b7a99; border:none; background:none; font-family:'DM Sans',sans-serif; transition:all .15s; }
        .range-tab.active { background:#1e2535; color:#e8edf5; }
        .range-tab:hover:not(.active) { color:#9ba8bf; }

        .tab-nav  { display:flex; border-bottom:1px solid rgba(255,255,255,0.06); overflow-x:auto; scrollbar-width:none; }
        .tab-nav::-webkit-scrollbar { display:none; }
        .tab-btn  { padding:10px 20px; font-size:13.5px; font-weight:500; color:#6b7a99; border:none; background:none; cursor:pointer; font-family:'DM Sans',sans-serif; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .18s; white-space:nowrap; }
        .tab-btn:hover  { color:#c8d3e8; }
        .tab-btn.active { color:#63b3ed; border-bottom-color:#63b3ed; }

        .pa-card  { background:#0d1117; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:22px; opacity:0; transform:translateY(10px); transition:opacity .35s ease,transform .35s ease; }
        .pa-card.vis { opacity:1; transform:translateY(0); }

        .card-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:12px; flex-wrap:wrap; }
        .card-title  { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#e8edf5; }
        .card-sub    { font-size:12px; color:#6b7a99; margin-top:3px; }

        .summary-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
        .summary-item { background:#161b27; border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:14px 16px; }
        .summary-label { font-size:11px; color:#6b7a99; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
        .summary-val   { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#e8edf5; letter-spacing:-.5px; }
        .summary-delta { font-size:12px; margin-top:4px; }
        .up   { color:#48bb78; }
        .down { color:#fc8181; }

        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

        .chart-legend { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:14px; }
        .cl-item  { display:flex; align-items:center; gap:6px; font-size:12px; color:#6b7a99; }
        .cl-swatch { width:10px; height:10px; border-radius:2px; }

        /* Plan pie */
        .pie-legend { display:flex; flex-direction:column; gap:10px; justify-content:center; }
        .pie-row  { display:flex; align-items:center; gap:10px; }
        .pie-dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .pie-label { font-size:13px; color:#9ba8bf; flex:1; }
        .pie-count { font-size:13px; font-weight:600; color:#c8d3e8; }
        .pie-pct  { font-size:11px; color:#6b7a99; min-width:32px; text-align:right; }

        /* AI table */
        .model-table { width:100%; border-collapse:collapse; }
        .model-table th { font-size:11px; font-weight:600; letter-spacing:.8px; text-transform:uppercase; color:#3d4a66; text-align:left; padding:0 0 10px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .model-table td { font-size:13px; color:#9ba8bf; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .model-table tr:last-child td { border-bottom:none; }
        .metric-bar-wrap { display:flex; align-items:center; gap:8px; width:120px; }
        .metric-bar-bg   { flex:1; height:5px; background:#1e2535; border-radius:3px; overflow:hidden; }
        .metric-bar-fill { height:100%; border-radius:3px; }
        .metric-num { font-size:12px; font-weight:600; color:#c8d3e8; min-width:30px; text-align:right; }

        /* Regional */
        .region-row  { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .region-row:last-child { border-bottom:none; }
        .region-name { font-size:13px; font-weight:500; color:#c8d3e8; min-width:100px; }
        .region-bar-wrap { flex:1; }
        .region-bar-bg   { height:6px; background:#1e2535; border-radius:3px; overflow:hidden; }
        .region-bar-fill { height:100%; border-radius:3px; }
        .region-nums { display:flex; gap:16px; }
        .region-stat { font-size:12px; color:#6b7a99; text-align:right; min-width:56px; }
        .region-stat strong { color:#c8d3e8; font-weight:600; display:block; }

        /* Loading spinner */
        .spinner { width:32px; height:32px; border:3px solid rgba(255,255,255,0.06); border-top-color:#63b3ed; border-radius:50%; animation:spin .8s linear infinite; }

        @media (max-width:900px) { .two-col { grid-template-columns:1fr; } }
        @media (max-width:500px) { .pa-root { padding:14px; } }
      `}</style>

      <div className="pa-root">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Platform Analytics</h1>
            <p className="page-sub">Live insights across schools, students, revenue, and AI systems</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {fetching && <div className="spinner" />}
            <div className="range-tabs">
              {["3M","6M","12M","YTD"].map(r => (
                <button key={r} className={`range-tab${dateRange===r?" active":""}`} onClick={() => setDateRange(r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {apiError && <ErrorBanner message={apiError} onRetry={loadAnalytics} />}

        {/* ── Tab nav ── */}
        <div className="tab-nav">
          {TABS.map(t => (
            <button key={t} className={`tab-btn${activeTab===t?" active":""}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab === "Overview" && (
          <>
            {/* KPI Cards — real data */}
            <div className="summary-row">
              {fetching ? (
                Array.from({length:5}).map((_,i) => (
                  <div key={i} className={`summary-item pa-card${loaded?" vis":""}`} style={{ transitionDelay:`${i*.06}s` }}>
                    <SkeletonBlock h={11} w="60%" mb={10} />
                    <SkeletonBlock h={28} w="80%" mb={8} />
                    <SkeletonBlock h={11} w="50%" />
                  </div>
                ))
              ) : [
                { label:"Active Schools",  val: summary.activeSchools?.toLocaleString("en-IN") || "—",  delta:`${summary.totalSchools||0} total registered`,  cls:"up" },
                { label:"Total Students",  val: summary.totalStudents?.toLocaleString("en-IN") || "—",  delta:"All enrolled students",  cls:"up" },
                { label:"Total Teachers",  val: summary.totalTeachers?.toLocaleString("en-IN") || "—",  delta:"Across all schools",     cls:"up" },
                { label:"Total Users",     val: summary.totalUsers?.toLocaleString("en-IN")    || "—",  delta:"Platform-wide accounts", cls:"up" },
                { label:"Inactive Schools",val: ((summary.totalSchools||0)-(summary.activeSchools||0)).toLocaleString("en-IN"), delta:"Pending or suspended", cls:"down" },
              ].map((s, i) => (
                <div key={s.label} className={`summary-item pa-card${loaded?" vis":""}`} style={{ transitionDelay:`${i*.06}s` }}>
                  <div className="summary-label">{s.label}</div>
                  <div className="summary-val">{s.val}</div>
                  <div className={`summary-delta ${s.cls}`}>{s.delta}</div>
                </div>
              ))}
            </div>

            {/* School Registrations Trend — real data */}
            <div className={`pa-card${loaded?" vis":""}`} style={{ transitionDelay:"0.3s" }}>
              <div className="card-header">
                <div>
                  <div className="card-title">New School Registrations — 12 Month Trend</div>
                  <div className="card-sub">Month-over-month new school registrations on the platform</div>
                </div>
              </div>
              {fetching ? (
                <SkeletonBlock h={240} radius={8} />
              ) : growthData.length === 0 ? (
                <p style={{ color:"#6b7a99", fontSize:13, textAlign:"center", padding:"40px 0" }}>No registration data available yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={growthData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                    <defs>
                      <linearGradient id="gSchools" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#63b3ed" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#63b3ed" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill:"#6b7a99", fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#6b7a99", fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="schools" stroke="#63b3ed" strokeWidth={2} fill="url(#gSchools)" name="New Schools" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan distribution (real) + AI Radar (mock) */}
            <div className="two-col">
              <div className={`pa-card${loaded?" vis":""}`} style={{ transitionDelay:"0.38s" }}>
                <div className="card-header">
                  <div>
                    <div className="card-title">Schools by Subscription Plan</div>
                    <div className="card-sub">Live plan distribution</div>
                  </div>
                </div>
                {fetching ? <SkeletonBlock h={160} radius={8} /> : (
                  planDist.length === 0 ? (
                    <p style={{ color:"#6b7a99", fontSize:13 }}>No plan data available.</p>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={planDist} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                            {planDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-legend">
                        {planDist.map(p => (
                          <div key={p.name} className="pie-row">
                            <div className="pie-dot" style={{ background:p.color }} />
                            <span className="pie-label">{p.name}</span>
                            <span className="pie-count">{p.value}</span>
                            <span className="pie-pct">{Math.round(p.value/totalPlanCount*100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className={`pa-card${loaded?" vis":""}`} style={{ transitionDelay:"0.44s" }}>
                <div className="card-header">
                  <div><div className="card-title">AI Model Accuracy</div><div className="card-sub">Radar across all models</div></div>
                  <MockBadge />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill:"#6b7a99", fontSize:10 }} />
                    <PolarRadiusAxis angle={90} domain={[75,100]} tick={false} axisLine={false} />
                    <Radar name="Accuracy" dataKey="accuracy" stroke="#63b3ed" fill="#63b3ed" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ════════════ REVENUE (mock — no backend endpoint yet) ════════════ */}
        {activeTab === "Revenue" && (
          <>
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              background:"rgba(246,173,85,0.06)", border:"1px solid rgba(246,173,85,0.15)",
              borderRadius:8, padding:"10px 16px",
            }}>
              <span style={{ fontSize:16 }}>⚠</span>
              <span style={{ color:"#f6ad55", fontSize:13 }}>
                Revenue data is currently sample data. To make it live, add a <code style={{ background:"rgba(255,255,255,0.06)", padding:"1px 6px", borderRadius:4 }}>/analytics/revenue</code> endpoint to your backend.
              </span>
            </div>

            <div className="summary-row">
              {[
                { label:"Total Revenue (12M)", val:"₹38.7Cr", delta:"↑ 24% YoY", cls:"up" },
                { label:"Fee Collections",     val:"₹29.4Cr", delta:"↑ 21% YoY", cls:"up" },
                { label:"Vendor Commission",   val:"₹7.8Cr",  delta:"↑ 38% YoY", cls:"up" },
                { label:"Blockchain Fees",     val:"₹1.5Cr",  delta:"↑ 62% YoY", cls:"up" },
              ].map((s,i) => (
                <div key={s.label} className={`summary-item pa-card${loaded?" vis":""}`} style={{ transitionDelay:`${i*.06}s` }}>
                  <div className="summary-label">{s.label}</div>
                  <div className="summary-val">{s.val}</div>
                  <div className={`summary-delta ${s.cls}`}>{s.delta}</div>
                </div>
              ))}
            </div>

            <div className={`pa-card${loaded?" vis":""}`} style={{ transitionDelay:"0.26s" }}>
              <div className="card-header">
                <div><div className="card-title">Monthly Revenue Breakdown (₹ Crores)</div></div>
                <MockBadge />
              </div>
              <div className="chart-legend">
                {[["#9f7aea","Fee Revenue"],["#f6ad55","Vendor Commission"],["#4fd1c5","Blockchain Fees"]].map(([c,l]) => (
                  <div key={l} className="cl-item"><div className="cl-swatch" style={{ background:c }} />{l}</div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={REVENUE_MONTHLY} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill:"#6b7a99", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#6b7a99", fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="fees"       stackId="a" fill="#9f7aea" name="Fee Revenue" />
                  <Bar dataKey="vendor"     stackId="a" fill="#f6ad55" name="Vendor Commission" />
                  <Bar dataKey="blockchain" stackId="a" fill="#4fd1c5" name="Blockchain Fees" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ════════════ AI & ML (mock) ════════════ */}
        {activeTab === "AI & ML" && (
          <>
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              background:"rgba(246,173,85,0.06)", border:"1px solid rgba(246,173,85,0.15)",
              borderRadius:8, padding:"10px 16px",
            }}>
              <span style={{ fontSize:16 }}>⚠</span>
              <span style={{ color:"#f6ad55", fontSize:13 }}>
                AI metrics are sample data. Connect your ML pipeline to make this live.
              </span>
            </div>

            <div className="summary-row">
              {[
                { label:"Predictions Run (12M)", val:"15.2M",  delta:"↑ 340% YoY",       cls:"up"   },
                { label:"Avg Model Accuracy",    val:"88.5%",  delta:"↑ 3.2% vs last qtr",cls:"up"   },
                { label:"Active Models",         val:"4",      delta:"Attend, Grade, Risk, Reco.", cls:"" },
                { label:"Drift Alerts",          val:"2",      delta:"Requires retraining",cls:"down" },
              ].map((s,i) => (
                <div key={s.label} className={`summary-item pa-card${loaded?" vis":""}`} style={{ transitionDelay:`${i*.06}s` }}>
                  <div className="summary-label">{s.label}</div>
                  <div className="summary-val">{s.val}</div>
                  <div className={`summary-delta ${s.cls}`}>{s.delta}</div>
                </div>
              ))}
            </div>

            <div className={`pa-card${loaded?" vis":""}`} style={{ transitionDelay:"0.26s" }}>
              <div className="card-header">
                <div><div className="card-title">Model Performance Metrics</div><div className="card-sub">Accuracy, Precision, Recall, F1</div></div>
                <MockBadge />
              </div>
              <table className="model-table">
                <thead>
                  <tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1 Score</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {AI_PERFORMANCE.map(m => (
                    <tr key={m.name}>
                      <td style={{ fontWeight:500, color:"#c8d3e8" }}>{m.name}</td>
                      {[m.accuracy, m.precision, m.recall, m.f1].map((val, vi) => (
                        <td key={vi}>
                          <div className="metric-bar-wrap">
                            <div className="metric-bar-bg">
                              <div className="metric-bar-fill" style={{ width:`${val}%`, background:["linear-gradient(90deg,#63b3ed,#4fd1c5)","linear-gradient(90deg,#9f7aea,#63b3ed)","linear-gradient(90deg,#4fd1c5,#48bb78)","linear-gradient(90deg,#f6ad55,#fc8181)"][vi] }} />
                            </div>
                            <span className="metric-num">{val}%</span>
                          </div>
                        </td>
                      ))}
                      <td>
                        <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:4, background:m.accuracy>90?"rgba(72,187,120,0.12)":"rgba(246,173,85,0.12)", color:m.accuracy>90?"#48bb78":"#f6ad55" }}>
                          {m.accuracy > 90 ? "Healthy" : "Review"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ════════════ BLOCKCHAIN (mock) ════════════ */}
        {activeTab === "Blockchain" && (
          <>
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              background:"rgba(246,173,85,0.06)", border:"1px solid rgba(246,173,85,0.15)",
              borderRadius:8, padding:"10px 16px",
            }}>
              <span style={{ fontSize:16 }}>⚠</span>
              <span style={{ color:"#f6ad55", fontSize:13 }}>
                Blockchain metrics are sample data. Wire your on-chain data source to make this live.
              </span>
            </div>

            <div className="summary-row">
              {[
                { label:"Total Transactions", val:"48,291", delta:"↑ 5,200 this month", cls:"up"  },
                { label:"Certificates Issued",val:"6,840",  delta:"↑ 840 new",          cls:"up"  },
                { label:"Smart Contracts",    val:"3",      delta:"Payments, Certs, Audit", cls:"" },
                { label:"Avg Gas Cost",       val:"₹1.24",  delta:"↓ 8% vs last month", cls:"up"  },
              ].map((s,i) => (
                <div key={s.label} className={`summary-item pa-card${loaded?" vis":""}`} style={{ transitionDelay:`${i*.06}s` }}>
                  <div className="summary-label">{s.label}</div>
                  <div className="summary-val">{s.val}</div>
                  <div className={`summary-delta ${s.cls}`}>{s.delta}</div>
                </div>
              ))}
            </div>

            <div className={`pa-card${loaded?" vis":""}`} style={{ transitionDelay:"0.26s" }}>
              <div className="card-header">
                <div><div className="card-title">Blockchain Activity — 12 Months</div></div>
                <MockBadge />
              </div>
              <div className="chart-legend">
                {[["#63b3ed","Transactions"],["#9f7aea","Certificates"]].map(([c,l]) => (
                  <div key={l} className="cl-item"><div className="cl-swatch" style={{ background:c }} />{l}</div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={BLOCKCHAIN_METRICS} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                  <defs>
                    <linearGradient id="gTx"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#63b3ed" stopOpacity={0.25}/><stop offset="100%" stopColor="#63b3ed" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gCert" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9f7aea" stopOpacity={0.2} /><stop offset="100%" stopColor="#9f7aea" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill:"#6b7a99", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#6b7a99", fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="transactions" stroke="#63b3ed" strokeWidth={2} fill="url(#gTx)"   name="Transactions" />
                  <Area type="monotone" dataKey="certificates" stroke="#9f7aea" strokeWidth={2} fill="url(#gCert)" name="Certificates"  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ════════════ REGIONAL — real data from schoolsByState ════════════ */}
        {activeTab === "Regional" && (
          <>
            <div className={`pa-card${loaded?" vis":""}`}>
              <div className="card-header">
                <div>
                  <div className="card-title">Schools by State — Top 10</div>
                  <div className="card-sub">Live data from platform registrations</div>
                </div>
              </div>
              {fetching ? (
                Array.from({length:5}).map((_,i) => <SkeletonBlock key={i} h={30} mb={8} radius={6} />)
              ) : regionData.length === 0 ? (
                <p style={{ color:"#6b7a99", fontSize:13, textAlign:"center", padding:"40px 0" }}>No regional data available.</p>
              ) : (
                regionData.map((r, i) => (
                  <div key={r.region} className="region-row">
                    <div className="region-name">{r.region}</div>
                    <div className="region-bar-wrap">
                      <div className="region-bar-bg">
                        <div className="region-bar-fill" style={{ width:`${(r.schools/maxRegionSchools)*100}%`, background:REGION_COLORS[i] }} />
                      </div>
                    </div>
                    <div className="region-nums">
                      <div className="region-stat"><strong>{r.schools}</strong>schools</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* State bar chart */}
            {!fetching && regionData.length > 0 && (
              <div className={`pa-card${loaded?" vis":""}`} style={{ transitionDelay:"0.14s" }}>
                <div className="card-header">
                  <div><div className="card-title">State-wise School Count</div></div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={regionData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="region" tick={{ fill:"#6b7a99", fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#6b7a99", fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="schools" name="Schools" radius={[6,6,0,0]} maxBarSize={52}>
                      {regionData.map((_,i) => <Cell key={i} fill={REGION_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

      </div>
    </>
  );
}