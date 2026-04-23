import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";

// ─── Mock ─────────────────────────────────────────────────────────────────────
const SCHOOL = {
  id: 1,
  name: "Delhi Public School, R.K. Puram",
  city: "New Delhi", state: "Delhi",
  address: "Sector 12, R.K. Puram, New Delhi – 110022",
  email: "admin@dpsrkpuram.edu.in",
  phone: "+91 11 2617 8600",
  website: "www.dpsrkpuram.edu.in",
  principal: "Dr. Savita Chauhan",
  students: 3241, teachers: 198, classes: 64,
  plan: "Enterprise", status: "active",
  joined: "12 April 2023",
  revenue: 48.2, attendance: 91.4, aiScore: 94,
  pendingFees: 4.8, paidFees: 43.4,
  blockchainTx: 1284, certIssued: 312,
};

const MONTHLY_ATTENDANCE = [
  { m: "Apr", rate: 88 }, { m: "May", rate: 91 }, { m: "Jun", rate: 85 },
  { m: "Jul", rate: 90 }, { m: "Aug", rate: 93 }, { m: "Sep", rate: 92 },
  { m: "Oct", rate: 89 }, { m: "Nov", rate: 94 }, { m: "Dec", rate: 88 },
  { m: "Jan", rate: 91 }, { m: "Feb", rate: 93 }, { m: "Mar", rate: 91 },
];

const GRADE_DIST = [
  { grade: "A+", count: 680 }, { grade: "A", count: 920 }, { grade: "B+", count: 740 },
  { grade: "B", count: 540 }, { grade: "C", count: 280 }, { grade: "D", count: 81 },
];

const STUDENTS = [
  { id: "STU001", name: "Arjun Mehta",      class: "XII-A", attendance: 94, grade: "A+", fees: "paid"    },
  { id: "STU002", name: "Priya Sharma",     class: "X-B",  attendance: 88, grade: "A",  fees: "paid"    },
  { id: "STU003", name: "Rohan Verma",      class: "XI-C", attendance: 71, grade: "C",  fees: "pending" },
  { id: "STU004", name: "Ananya Singh",     class: "IX-A", attendance: 97, grade: "A+", fees: "paid"    },
  { id: "STU005", name: "Kabir Nair",       class: "XII-B",attendance: 83, grade: "B+", fees: "overdue" },
];

const TEACHERS = [
  { id: "T001", name: "Mrs. Sunita Kapoor", subject: "Mathematics",    classes: 8, experience: "18 yrs", rating: 4.8 },
  { id: "T002", name: "Mr. Rajesh Kumar",   subject: "Physics",        classes: 6, experience: "12 yrs", rating: 4.6 },
  { id: "T003", name: "Ms. Divya Nair",     subject: "English",        classes: 7, experience: "9 yrs",  rating: 4.9 },
  { id: "T004", name: "Mr. Anil Gupta",     subject: "Chemistry",      classes: 5, experience: "22 yrs", rating: 4.5 },
  { id: "T005", name: "Mrs. Kavita Singh",  subject: "Social Studies", classes: 6, experience: "15 yrs", rating: 4.7 },
];

const REVENUE_DATA = [
  { m: "Oct", collected: 4.2, pending: 0.6 }, { m: "Nov", collected: 3.8, pending: 0.4 },
  { m: "Dec", collected: 5.1, pending: 0.9 }, { m: "Jan", collected: 4.6, pending: 0.5 },
  { m: "Feb", collected: 4.9, pending: 0.6 }, { m: "Mar", collected: 5.2, pending: 0.8 },
];

const BLOCKCHAIN_TXS = [
  { hash: "0x7f4a…e291", type: "Fee Payment",    amount: "₹42,500", time: "2 min ago",   status: "confirmed" },
  { hash: "0x3b9c…8f14", type: "Certificate",    amount: "—",        time: "18 min ago",  status: "confirmed" },
  { hash: "0xa2d7…c043", type: "Fee Payment",    amount: "₹38,000", time: "1h ago",      status: "confirmed" },
  { hash: "0x18ef…6b22", type: "Audit Log",      amount: "—",        time: "2h ago",      status: "confirmed" },
  { hash: "0xc84f…1d59", type: "Fee Payment",    amount: "₹55,000", time: "3h ago",      status: "pending"   },
];

const AI_PREDICTIONS = [
  { student: "Rohan Verma",   risk: "high",   score: 28, issue: "Attendance drop — 71% this term", action: "Parent meeting recommended" },
  { student: "Kabir Nair",    risk: "medium", score: 52, issue: "Grade regression — B → C trend",   action: "Remedial sessions advised"  },
  { student: "Meera Joshi",   risk: "medium", score: 48, issue: "Fee overdue 2 months",              action: "Finance department alert"   },
  { student: "Aman Tiwari",   risk: "low",    score: 74, issue: "Minor attendance dip last month",  action: "Monitor closely"            },
];

const FEE_STATUS_PIE = [
  { name: "Paid",    value: 2841, color: "#48bb78" },
  { name: "Pending", value: 280,  color: "#f6ad55" },
  { name: "Overdue", value: 120,  color: "#fc8181" },
];

const TABS = ["Overview", "Students", "Teachers", "Finance", "Blockchain", "AI Insights"];

// ─── Utils ────────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ color: "#6b7a99", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color || "#63b3ed", fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const BackIcon    = () => <Icon d="M19 12H5M12 5l-7 7 7 7" size={16} />;
const EditIcon    = () => <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={15} />;
const ChainIcon   = () => <Icon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" size={15} />;
const RiskDot = ({ level }) => {
  const c = level === "high" ? "#fc8181" : level === "medium" ? "#f6ad55" : "#48bb78";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c, marginRight: 6 }} />;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SchoolDetails() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);
  useEffect(() => { setLoaded(false); setTimeout(() => setLoaded(true), 50); }, [tab]);

  const s = SCHOOL;
  const sm = { active: { color: "#48bb78", bg: "rgba(72,187,120,.12)" } };
  const pm = { Enterprise: { color: "#e2b96a", bg: "rgba(226,185,106,.12)" } };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sd-root {
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          min-height: 100%;
        }

        /* Hero */
        .sd-hero {
          background: #0d1117;
          border-bottom: 1px solid rgba(255,255,255,.06);
          padding: 24px 28px 0;
          position: relative;
          overflow: hidden;
        }
        .hero-glow {
          position: absolute;
          top: -60px; left: -60px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(99,179,237,.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .sd-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: #6b7a99;
          cursor: pointer;
          margin-bottom: 18px;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          transition: color .15s;
          padding: 0;
        }
        .sd-back:hover { color: #63b3ed; }

        .hero-main { display: flex; align-items: flex-start; gap: 18px; flex-wrap: wrap; }
        .school-logo {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #1e2535, #2a3347);
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: #63b3ed;
          flex-shrink: 0;
        }
        .hero-info { flex: 1; min-width: 200px; }
        .hero-name {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #e8edf5;
          letter-spacing: -.5px;
          line-height: 1.1;
        }
        .hero-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .hero-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: #6b7a99; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; }

        .hero-actions { display: flex; gap: 8px; margin-top: 4px; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: 1px solid transparent; transition: all .18s; }
        .btn-ghost { background: #161b27; color: #9ba8bf; border-color: rgba(255,255,255,.07); }
        .btn-ghost:hover { background: #1e2535; color: #e8edf5; }
        .btn-primary { background: linear-gradient(135deg,#63b3ed,#4fd1c5); color: #090c14; }
        .btn-primary:hover { filter: brightness(1.08); }

        /* KPI strip */
        .kpi-strip {
          display: flex;
          gap: 0;
          margin-top: 20px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .kpi-strip::-webkit-scrollbar { display: none; }
        .kpi-tab {
          flex: 1;
          min-width: 110px;
          padding: 14px 20px;
          text-align: center;
          border-top: 2px solid transparent;
          transition: all .15s;
          cursor: default;
        }
        .kpi-tab-val { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #e8edf5; letter-spacing: -.5px; }
        .kpi-tab-lbl { font-size: 11px; color: #6b7a99; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }

        /* Tabs */
        .tab-nav { display: flex; border-bottom: 1px solid rgba(255,255,255,.06); padding: 0 28px; background: #0d1117; overflow-x: auto; scrollbar-width: none; }
        .tab-nav::-webkit-scrollbar { display: none; }
        .tab-btn { padding: 12px 18px; font-size: 13.5px; font-weight: 500; color: #6b7a99; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .18s; white-space: nowrap; }
        .tab-btn:hover { color: #c8d3e8; }
        .tab-btn.active { color: #63b3ed; border-bottom-color: #63b3ed; }

        /* Content */
        .sd-content {
          padding: 24px 28px;
          flex: 1;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity .3s, transform .3s;
        }
        .sd-content.vis { opacity: 1; transform: none; }

        /* Section card */
        .card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          padding: 20px;
        }
        .card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #e8edf5; margin-bottom: 16px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

        /* Info grid */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
        .info-row { display: flex; flex-direction: column; gap: 3px; }
        .info-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #3d4a66; font-weight: 600; }
        .info-val { font-size: 13.5px; color: #c8d3e8; font-weight: 500; }

        /* Mini stat */
        .mini-stat { background: #161b27; border-radius: 9px; padding: 14px 16px; }
        .mini-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #e8edf5; }
        .mini-lbl { font-size: 11px; color: #6b7a99; text-transform: uppercase; letter-spacing: .4px; margin-top: 3px; }
        .mini-delta { font-size: 12px; margin-top: 4px; }

        /* Table */
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { font-size: 11px; font-weight: 600; letter-spacing: .7px; text-transform: uppercase; color: #3d4a66; text-align: left; padding: 0 0 10px; border-bottom: 1px solid rgba(255,255,255,.05); white-space: nowrap; }
        .data-table td { font-size: 13px; color: #9ba8bf; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,.04); vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tbody tr { transition: all .12s; }
        .data-table tbody tr:hover td { color: #c8d3e8; }

        /* Score bar */
        .score-wrap { display: flex; align-items: center; gap: 7px; }
        .score-bar-bg { width: 60px; height: 4px; background: #1e2535; border-radius: 2px; overflow: hidden; }
        .score-bar-fill { height: 100%; border-radius: 2px; }

        /* Stars */
        .stars { color: #f6ad55; font-size: 13px; }

        /* AI risk card */
        .risk-card { background: #161b27; border-radius: 10px; padding: 14px 16px; border-left: 3px solid; }
        .risk-card.high   { border-color: #fc8181; }
        .risk-card.medium { border-color: #f6ad55; }
        .risk-card.low    { border-color: #48bb78; }
        .risk-name { font-size: 13.5px; font-weight: 600; color: #c8d3e8; margin-bottom: 4px; }
        .risk-issue { font-size: 12.5px; color: #9ba8bf; }
        .risk-action { font-size: 12px; color: #6b7a99; margin-top: 6px; font-style: italic; }

        /* TX row */
        .tx-hash { font-family: monospace; font-size: 12px; color: #63b3ed; }
        .tx-status { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }

        @media (max-width: 900px) { .two-col, .three-col, .info-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px) { .sd-content, .sd-hero { padding-left: 16px; padding-right: 16px; } }
      `}</style>

      <div className="sd-root">

        {/* Hero */}
        <div className="sd-hero">
          <div className="hero-glow" />
          <button className="sd-back" onClick={() => navigate("/super-admin/schools")}>
            <BackIcon /> Back to Schools
          </button>
          <div className="hero-main">
            <div className="school-logo">DP</div>
            <div className="hero-info">
              <h1 className="hero-name">{s.name}</h1>
              <div className="hero-meta">
                <div className="hero-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {s.city}, {s.state}
                </div>
                <div className="hero-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Joined {s.joined}
                </div>
                <span className="badge" style={{ background: pm.Enterprise.bg, color: pm.Enterprise.color }}>{s.plan}</span>
                <span className="badge" style={{ background: sm.active.bg, color: sm.active.color }}>
                  <span className="badge-dot" style={{ background: "#48bb78" }} /> Active
                </span>
              </div>
            </div>
            <div className="hero-actions">
              <button className="btn btn-ghost"><EditIcon /> Edit School</button>
              <button className="btn btn-ghost"><ChainIcon /> View on Chain</button>
              <button className="btn btn-primary">Send Notification</button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="kpi-strip">
            {[
              { val: s.students.toLocaleString(), lbl: "Students"       },
              { val: s.teachers,                  lbl: "Teachers"        },
              { val: s.classes,                   lbl: "Classes"         },
              { val: `${s.attendance}%`,          lbl: "Attendance"      },
              { val: `₹${s.revenue}L`,            lbl: "Revenue"         },
              { val: s.aiScore,                   lbl: "AI Score"        },
              { val: s.blockchainTx.toLocaleString(), lbl: "Blockchain TXs" },
            ].map(k => (
              <div key={k.lbl} className="kpi-tab">
                <div className="kpi-tab-val">{k.val}</div>
                <div className="kpi-tab-lbl">{k.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav">
          {TABS.map(t => (
            <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className={`sd-content${loaded ? " vis" : ""}`}>

          {/* ── OVERVIEW ── */}
          {tab === "Overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="two-col">
                <div className="card">
                  <div className="card-title">School Information</div>
                  <div className="info-grid">
                    {[
                      ["Principal",  s.principal  ],
                      ["Email",      s.email       ],
                      ["Phone",      s.phone       ],
                      ["Website",    s.website     ],
                      ["Address",    s.address     ],
                      ["Plan",       s.plan        ],
                    ].map(([l, v]) => (
                      <div key={l} className="info-row">
                        <span className="info-lbl">{l}</span>
                        <span className="info-val">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">Monthly Attendance Trend</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={MONTHLY_ATTENDANCE} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                      <defs>
                        <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#63b3ed" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#63b3ed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                      <XAxis dataKey="m" tick={{ fill: "#6b7a99", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[75, 100]} tick={{ fill: "#6b7a99", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="rate" stroke="#63b3ed" strokeWidth={2} fill="url(#attGrad)" name="Attendance %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Grade Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={GRADE_DIST} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                    <XAxis dataKey="grade" tick={{ fill: "#6b7a99", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7a99", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" name="Students" radius={[5, 5, 0, 0]} maxBarSize={48}>
                      {GRADE_DIST.map((_, i) => (
                        <Cell key={i} fill={["#48bb78","#4fd1c5","#63b3ed","#9f7aea","#f6ad55","#fc8181"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── STUDENTS ── */}
          {tab === "Students" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="three-col">
                {[
                  { val: s.students.toLocaleString(), lbl: "Enrolled",        delta: "↑ 84 this term",  cls: "up"   },
                  { val: `${s.attendance}%`,          lbl: "Avg Attendance",  delta: "↑ 2.1% vs last",  cls: "up"   },
                  { val: "3",                         lbl: "At-Risk Students", delta: "Needs attention", cls: "down" },
                ].map(m => (
                  <div key={m.lbl} className="mini-stat">
                    <div className="mini-val">{m.val}</div>
                    <div className="mini-lbl">{m.lbl}</div>
                    <div className={`mini-delta ${m.cls === "up" ? "" : ""}` } style={{ color: m.cls === "up" ? "#48bb78" : "#fc8181" }}>{m.delta}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">Student Records</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th><th>Class</th><th>Attendance</th><th>Grade</th><th>Fees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STUDENTS.map(st => {
                      const feeColor = st.fees === "paid" ? "#48bb78" : st.fees === "pending" ? "#f6ad55" : "#fc8181";
                      const attColor = st.attendance >= 90 ? "#48bb78" : st.attendance >= 75 ? "#f6ad55" : "#fc8181";
                      return (
                        <tr key={st.id}>
                          <td><span style={{ fontWeight: 500, color: "#c8d3e8" }}>{st.name}</span><br /><span style={{ fontSize: 11, color: "#6b7a99" }}>{st.id}</span></td>
                          <td>{st.class}</td>
                          <td>
                            <div className="score-wrap">
                              <div className="score-bar-bg">
                                <div className="score-bar-fill" style={{ width: `${st.attendance}%`, background: attColor }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: attColor }}>{st.attendance}%</span>
                            </div>
                          </td>
                          <td><span style={{ fontWeight: 600, color: "#c8d3e8" }}>{st.grade}</span></td>
                          <td>
                            <span className="badge" style={{ background: `${feeColor}18`, color: feeColor, padding: "2px 8px", borderRadius: 4 }}>
                              {st.fees}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TEACHERS ── */}
          {tab === "Teachers" && (
            <div className="card">
              <div className="card-title">Teaching Staff</div>
              <table className="data-table">
                <thead>
                  <tr><th>Teacher</th><th>Subject</th><th>Classes</th><th>Experience</th><th>Rating</th></tr>
                </thead>
                <tbody>
                  {TEACHERS.map(t => (
                    <tr key={t.id}>
                      <td><span style={{ fontWeight: 500, color: "#c8d3e8" }}>{t.name}</span><br /><span style={{ fontSize: 11, color: "#6b7a99" }}>{t.id}</span></td>
                      <td>{t.subject}</td>
                      <td>{t.classes}</td>
                      <td>{t.experience}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="stars">{"★".repeat(Math.round(t.rating))}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#c8d3e8" }}>{t.rating}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── FINANCE ── */}
          {tab === "Finance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="three-col">
                {[
                  { val: `₹${s.paidFees}L`,    lbl: "Collected",   color: "#48bb78" },
                  { val: `₹${s.pendingFees}L`, lbl: "Pending",     color: "#f6ad55" },
                  { val: `₹${s.revenue}L`,     lbl: "Total",       color: "#63b3ed" },
                ].map(m => (
                  <div key={m.lbl} className="mini-stat" style={{ borderTop: `2px solid ${m.color}` }}>
                    <div className="mini-val" style={{ color: m.color }}>{m.val}</div>
                    <div className="mini-lbl">{m.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="two-col">
                <div className="card">
                  <div className="card-title">Monthly Collections (₹L)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={REVENUE_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                      <XAxis dataKey="m" tick={{ fill: "#6b7a99", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#6b7a99", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="collected" fill="#48bb78" stackId="a" name="Collected" radius={[0,0,0,0]} />
                      <Bar dataKey="pending"   fill="#f6ad55" stackId="a" name="Pending"   radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <div className="card-title">Fee Status</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={FEE_STATUS_PIE} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                          {FEE_STATUS_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {FEE_STATUS_PIE.map(p => (
                        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0, display: "inline-block" }} />
                          <span style={{ fontSize: 13, color: "#9ba8bf", flex: 1 }}>{p.name}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#c8d3e8" }}>{p.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BLOCKCHAIN ── */}
          {tab === "Blockchain" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="three-col">
                {[
                  { val: s.blockchainTx.toLocaleString(), lbl: "Total Transactions" },
                  { val: s.certIssued,                    lbl: "Certificates Minted" },
                  { val: "₹1.24",                         lbl: "Avg Gas Cost" },
                ].map(m => (
                  <div key={m.lbl} className="mini-stat">
                    <div className="mini-val">{m.val}</div>
                    <div className="mini-lbl">{m.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">Recent Blockchain Transactions</div>
                <table className="data-table">
                  <thead>
                    <tr><th>Tx Hash</th><th>Type</th><th>Amount</th><th>Time</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {BLOCKCHAIN_TXS.map((tx, i) => (
                      <tr key={i}>
                        <td><span className="tx-hash">{tx.hash}</span></td>
                        <td>{tx.type}</td>
                        <td style={{ color: "#4fd1c5", fontWeight: 500 }}>{tx.amount}</td>
                        <td style={{ color: "#6b7a99", fontSize: 12 }}>{tx.time}</td>
                        <td>
                          <span className="tx-status" style={{
                            background: tx.status === "confirmed" ? "rgba(72,187,120,.12)" : "rgba(246,173,85,.12)",
                            color: tx.status === "confirmed" ? "#48bb78" : "#f6ad55",
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AI INSIGHTS ── */}
          {tab === "AI Insights" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="two-col">
                <div className="card">
                  <div className="card-title">AI Health Score: {s.aiScore}/100</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 8, background: "#1e2535", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${s.aiScore}%`, height: "100%", background: "linear-gradient(90deg,#63b3ed,#4fd1c5)", borderRadius: 4 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#6b7a99" }}>
                      <span>At Risk</span><span>Healthy</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#9ba8bf", lineHeight: 1.6 }}>
                    This school is performing above platform average across attendance prediction, grade forecasting, and engagement metrics. AI models are calibrated and up to date.
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Model Accuracy</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { name: "Attendance Predictor", acc: 96, color: "#63b3ed" },
                      { name: "Grade Predictor",      acc: 91, color: "#4fd1c5" },
                      { name: "Dropout Risk",         acc: 94, color: "#9f7aea" },
                    ].map(m => (
                      <div key={m.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#9ba8bf", marginBottom: 5 }}>
                          <span>{m.name}</span>
                          <span style={{ fontWeight: 600, color: m.color }}>{m.acc}%</span>
                        </div>
                        <div style={{ height: 5, background: "#1e2535", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${m.acc}%`, height: "100%", background: m.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-title">At-Risk Students — AI Flagged</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {AI_PREDICTIONS.map((p, i) => (
                    <div key={i} className={`risk-card ${p.risk}`}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div className="risk-name"><RiskDot level={p.risk} />{p.student}</div>
                        <span className="badge" style={{
                          background: p.risk === "high" ? "rgba(252,129,129,.12)" : p.risk === "medium" ? "rgba(246,173,85,.12)" : "rgba(72,187,120,.12)",
                          color: p.risk === "high" ? "#fc8181" : p.risk === "medium" ? "#f6ad55" : "#48bb78",
                          fontSize: 11,
                        }}>{p.risk} risk</span>
                      </div>
                      <div className="risk-issue">{p.issue}</div>
                      <div className="risk-action">→ {p.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}