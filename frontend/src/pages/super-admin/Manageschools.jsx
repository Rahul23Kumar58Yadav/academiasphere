import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const SCHOOLS_DATA = [
  { id: 1,  name: "Delhi Public School, R.K. Puram",       city: "New Delhi",    state: "Delhi",         students: 3241, teachers: 198, plan: "Enterprise", status: "active",   joined: "2023-04-12", revenue: 48.2, attendance: 91.4, aiScore: 94 },
  { id: 2,  name: "The Cathedral & John Connon School",     city: "Mumbai",       state: "Maharashtra",   students: 2876, teachers: 172, plan: "Pro",        status: "active",   joined: "2023-06-08", revenue: 38.7, attendance: 93.1, aiScore: 88 },
  { id: 3,  name: "Bangalore International Academy",        city: "Bengaluru",    state: "Karnataka",     students: 1943, teachers: 121, plan: "Trial",      status: "trial",    joined: "2025-02-01", revenue: 0,    attendance: 87.6, aiScore: 72 },
  { id: 4,  name: "La Martiniere Calcutta",                 city: "Kolkata",      state: "West Bengal",   students: 2102, teachers: 143, plan: "Pro",        status: "active",   joined: "2023-09-15", revenue: 28.4, attendance: 89.2, aiScore: 85 },
  { id: 5,  name: "Scindia School, Gwalior",                city: "Gwalior",      state: "Madhya Pradesh",students: 812,  teachers: 68,  plan: "Basic",      status: "pending",  joined: "2025-03-01", revenue: 0,    attendance: 84.3, aiScore: 61 },
  { id: 6,  name: "Mayo College",                           city: "Ajmer",        state: "Rajasthan",     students: 1024, teachers: 89,  plan: "Pro",        status: "active",   joined: "2024-01-20", revenue: 14.6, attendance: 88.9, aiScore: 81 },
  { id: 7,  name: "The Doon School",                        city: "Dehradun",     state: "Uttarakhand",   students: 608,  teachers: 74,  plan: "Enterprise", status: "active",   joined: "2023-11-05", revenue: 22.1, attendance: 95.2, aiScore: 97 },
  { id: 8,  name: "Rishi Valley School",                    city: "Madanapalle",  state: "Andhra Pradesh",students: 480,  teachers: 54,  plan: "Basic",      status: "active",   joined: "2024-03-18", revenue: 6.8,  attendance: 90.1, aiScore: 78 },
  { id: 9,  name: "Shreeram Global School",                 city: "Gurugram",     state: "Haryana",       students: 2680, teachers: 156, plan: "Pro",        status: "active",   joined: "2024-05-22", revenue: 31.2, attendance: 86.4, aiScore: 83 },
  { id: 10, name: "Campion School",                         city: "Mumbai",       state: "Maharashtra",   students: 1820, teachers: 110, plan: "Pro",        status: "active",   joined: "2024-07-11", revenue: 19.8, attendance: 92.7, aiScore: 86 },
  { id: 11, name: "St. Columba's School",                   city: "New Delhi",    state: "Delhi",         students: 2340, teachers: 148, plan: "Pro",        status: "active",   joined: "2024-02-28", revenue: 26.4, attendance: 88.3, aiScore: 82 },
  { id: 12, name: "Vidyashilp Academy",                     city: "Bengaluru",    state: "Karnataka",     students: 1560, teachers: 98,  plan: "Basic",      status: "suspended",joined: "2024-04-14", revenue: 0,    attendance: 72.1, aiScore: 54 },
];

const STATUS_META = {
  active:    { color: "#48bb78", bg: "rgba(72,187,120,0.12)",   label: "Active"    },
  trial:     { color: "#f6ad55", bg: "rgba(246,173,85,0.12)",   label: "Trial"     },
  pending:   { color: "#63b3ed", bg: "rgba(99,179,237,0.12)",   label: "Pending"   },
  suspended: { color: "#fc8181", bg: "rgba(252,129,129,0.12)",  label: "Suspended" },
};
const PLAN_META = {
  Enterprise: { color: "#e2b96a", bg: "rgba(226,185,106,0.12)" },
  Pro:        { color: "#9f7aea", bg: "rgba(159,122,234,0.12)" },
  Basic:      { color: "#4fd1c5", bg: "rgba(79,209,197,0.12)"  },
  Trial:      { color: "#6b7a99", bg: "rgba(107,122,153,0.12)" },
};

const STATES = [...new Set(SCHOOLS_DATA.map(s => s.state))].sort();

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const SearchIcon = () => <Icon size={15} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />;
const FilterIcon = () => <Icon size={15} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const PlusIcon   = () => <Icon size={15} d="M12 5v14M5 12h14" />;
const ChevronIcon = ({ dir = "down" }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points={dir === "down" ? "6 9 12 15 18 9" : dir === "up" ? "18 15 12 9 6 15" : dir === "right" ? "9 6 15 12 9 18" : "15 18 9 12 15 6"} />
  </svg>
);
const EyeIcon    = () => <Icon size={14} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z" />;
const EditIcon   = () => <Icon size={14} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
const TrashIcon  = () => <Icon size={14} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />;
const SortIcon   = () => <Icon size={13} d="M3 6h18M7 12h10M11 18h2" />;
const ExportIcon = () => <Icon size={14} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />;

// ─── Sub-components ───────────────────────────────────────────────────────────
const ScorePill = ({ score }) => {
  const color = score >= 90 ? "#48bb78" : score >= 75 ? "#f6ad55" : "#fc8181";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 4, background: "#1e2535", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{score}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManageSchools() {
  const navigate = useNavigate();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [planFilter, setPlan]       = useState("all");
  const [stateFilter, setState]     = useState("all");
  const [sortBy, setSortBy]         = useState("name");
  const [sortDir, setSortDir]       = useState("asc");
  const [selected, setSelected]     = useState(new Set());
  const [page, setPage]             = useState(1);
  const [viewMode, setViewMode]     = useState("table"); // table | card
  const [loaded, setLoaded]         = useState(false);
  const PER_PAGE = 8;

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  const filtered = useMemo(() => {
    let d = SCHOOLS_DATA.filter(s => {
      const q = search.toLowerCase();
      if (q && !s.name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q) && !s.state.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (planFilter   !== "all" && s.plan   !== planFilter)   return false;
      if (stateFilter  !== "all" && s.state  !== stateFilter)  return false;
      return true;
    });
    d.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === "string") av = av.toLowerCase(), bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return d;
  }, [search, statusFilter, planFilter, stateFilter, sortBy, sortDir]);

  const pages    = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map(s => s.id)));
  };
  const toggleRow = (id) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const TH = ({ label, col, align = "left" }) => (
    <th onClick={() => toggleSort(col)} style={{ textAlign: align, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        {label}
        {sortBy === col ? <ChevronIcon dir={sortDir === "asc" ? "up" : "down"} /> : <SortIcon />}
      </span>
    </th>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ms-root {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'DM Sans', sans-serif;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity .35s, transform .35s;
        }
        .ms-root.vis { opacity: 1; transform: none; }

        /* Header */
        .ms-header { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
        .ms-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #e8edf5; letter-spacing: -.5px; }
        .ms-sub   { font-size: 13px; color: #6b7a99; margin-top: 4px; }
        .ms-actions { display: flex; gap: 8px; align-items: center; }

        /* Stat bar */
        .stat-bar {
          display: flex;
          gap: 1px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .stat-cell {
          flex: 1;
          padding: 14px 20px;
          background: #0d1117;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-cell:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.04); }
        .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #e8edf5; letter-spacing: -.5px; }
        .stat-lbl { font-size: 11px; color: #6b7a99; text-transform: uppercase; letter-spacing: .5px; font-weight: 500; }

        /* Toolbar */
        .toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 340px;
        }
        .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #6b7a99; pointer-events: none; display: flex; }
        .search-inp {
          width: 100%;
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 8px 12px 8px 34px;
          color: #e8edf5;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color .18s;
        }
        .search-inp::placeholder { color: #3d4a66; }
        .search-inp:focus { border-color: rgba(99,179,237,.4); }

        .filter-sel {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 8px 12px;
          color: #9ba8bf;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
          transition: border-color .18s;
        }
        .filter-sel:focus { border-color: rgba(99,179,237,.4); }
        .toolbar-spacer { flex: 1; }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all .18s;
          white-space: nowrap;
        }
        .btn-ghost { background: #0d1117; color: #9ba8bf; border-color: rgba(255,255,255,.07); }
        .btn-ghost:hover { background: #161b27; color: #e8edf5; }
        .btn-primary { background: linear-gradient(135deg,#63b3ed,#4fd1c5); color: #090c14; }
        .btn-primary:hover { filter: brightness(1.08); }
        .btn-danger { background: rgba(252,129,129,.12); color: #fc8181; border-color: rgba(252,129,129,.2); }
        .btn-danger:hover { background: rgba(252,129,129,.2); }

        /* View toggle */
        .view-toggle { display: flex; background: #0d1117; border: 1px solid rgba(255,255,255,.07); border-radius: 8px; overflow: hidden; }
        .vt-btn { padding: 7px 11px; background: none; border: none; cursor: pointer; color: #6b7a99; display: flex; transition: all .15s; }
        .vt-btn.active { background: #1e2535; color: #e8edf5; }
        .vt-btn:hover:not(.active) { color: #9ba8bf; }

        /* Bulk bar */
        .bulk-bar {
          background: rgba(99,179,237,.08);
          border: 1px solid rgba(99,179,237,.2);
          border-radius: 8px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #63b3ed;
          animation: slideIn .2s ease;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .bulk-sep { width: 1px; height: 16px; background: rgba(99,179,237,.3); }

        /* Table */
        .table-wrap {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #0a0e18; }
        th {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .7px;
          text-transform: uppercase;
          color: #3d4a66;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,.05);
          white-space: nowrap;
        }
        td {
          padding: 13px 16px;
          font-size: 13px;
          color: #9ba8bf;
          border-bottom: 1px solid rgba(255,255,255,.04);
          vertical-align: middle;
        }
        tr:last-child td { border-bottom: none; }
        tbody tr { transition: background .15s; cursor: pointer; }
        tbody tr:hover td { background: rgba(255,255,255,.02); color: #c8d3e8; }
        tbody tr.row-selected td { background: rgba(99,179,237,.05); }

        .school-name-cell { font-weight: 500; color: #c8d3e8; }
        .school-loc { font-size: 11.5px; color: #6b7a99; margin-top: 1px; }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; }

        .row-actions { display: flex; gap: 4px; opacity: 0; transition: opacity .15s; }
        tbody tr:hover .row-actions { opacity: 1; }
        .ra-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #161b27;
          border: 1px solid rgba(255,255,255,.06);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7a99;
          transition: all .15s;
        }
        .ra-btn:hover { color: #63b3ed; border-color: rgba(99,179,237,.3); background: rgba(99,179,237,.08); }
        .ra-btn.danger:hover { color: #fc8181; border-color: rgba(252,129,129,.3); background: rgba(252,129,129,.08); }

        input[type="checkbox"] {
          width: 15px; height: 15px;
          accent-color: #63b3ed;
          cursor: pointer;
          border-radius: 4px;
        }

        /* Card grid */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }
        .school-card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          padding: 18px;
          cursor: pointer;
          transition: border-color .18s, transform .18s;
          animation: fadeUp .35s ease both;
        }
        .school-card:hover { border-color: rgba(99,179,237,.3); transform: translateY(-2px); }
        .sc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .sc-initials {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #1e2535, #2a3347);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: #63b3ed;
          letter-spacing: -.5px;
          flex-shrink: 0;
        }
        .sc-name { font-size: 13.5px; font-weight: 600; color: #c8d3e8; line-height: 1.3; margin: 10px 0 3px; }
        .sc-loc  { font-size: 12px; color: #6b7a99; margin-bottom: 12px; }
        .sc-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .sc-stat-item { background: #161b27; border-radius: 7px; padding: 8px 10px; }
        .sc-stat-val { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #e8edf5; }
        .sc-stat-lbl { font-size: 10px; color: #6b7a99; text-transform: uppercase; letter-spacing: .4px; margin-top: 2px; }

        /* Pagination */
        .pagination { display: flex; align-items: center; gap: 6px; justify-content: center; padding: 16px 0 4px; }
        .pg-btn {
          width: 32px; height: 32px;
          border-radius: 7px;
          background: #0d1117;
          border: 1px solid rgba(255,255,255,.06);
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #6b7a99;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all .15s;
        }
        .pg-btn:hover:not(:disabled) { background: #161b27; color: #e8edf5; }
        .pg-btn.active { background: rgba(99,179,237,.15); color: #63b3ed; border-color: rgba(99,179,237,.3); font-weight: 700; }
        .pg-btn:disabled { opacity: .3; cursor: default; }
        .pg-info { font-size: 12px; color: #6b7a99; padding: 0 8px; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @media (max-width:900px) { .stat-bar { display: none; } }
        @media (max-width:700px) { .ms-root { padding:16px; } th:nth-child(n+6), td:nth-child(n+6) { display:none; } }
      `}</style>

      <div className={`ms-root${loaded ? " vis" : ""}`}>

        {/* Header */}
        <div className="ms-header">
          <div>
            <h1 className="ms-title">Manage Schools</h1>
            <p className="ms-sub">{SCHOOLS_DATA.length} institutions onboarded · {SCHOOLS_DATA.filter(s => s.status === "active").length} active</p>
          </div>
          <div className="ms-actions">
            <button className="btn btn-ghost" onClick={() => {}}>
              <ExportIcon /> Export CSV
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/super-admin/schools/onboard")}>
              <PlusIcon /> Onboard School
            </button>
          </div>
        </div>

        {/* Stat bar */}
        <div className="stat-bar">
          {[
            { val: "291",    lbl: "Total Schools"    },
            { val: "64,800", lbl: "Total Students"   },
            { val: "5,380",  lbl: "Total Teachers"   },
            { val: "87.4%",  lbl: "Avg Attendance"   },
            { val: "₹38.7Cr",lbl: "Platform Revenue" },
          ].map(s => (
            <div key={s.lbl} className="stat-cell">
              <span className="stat-val">{s.val}</span>
              <span className="stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon"><SearchIcon /></span>
            <input
              className="search-inp"
              placeholder="Search schools, cities, states…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="filter-sel" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            {Object.keys(STATUS_META).map(k => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
          </select>
          <select className="filter-sel" value={planFilter} onChange={e => { setPlan(e.target.value); setPage(1); }}>
            <option value="all">All Plans</option>
            {["Enterprise","Pro","Basic","Trial"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="filter-sel" value={stateFilter} onChange={e => { setState(e.target.value); setPage(1); }}>
            <option value="all">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="toolbar-spacer" />
          <span style={{ fontSize: 12, color: "#6b7a99" }}>{filtered.length} results</span>
          <div className="view-toggle">
            <button className={`vt-btn${viewMode === "table" ? " active" : ""}`} onClick={() => setViewMode("table")} title="Table view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </button>
            <button className={`vt-btn${viewMode === "card" ? " active" : ""}`} onClick={() => setViewMode("card")} title="Card view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="bulk-bar">
            <strong>{selected.size}</strong> school{selected.size > 1 ? "s" : ""} selected
            <div className="bulk-sep" />
            <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }}>Send Email</button>
            <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }}>Change Plan</button>
            <button className="btn btn-danger" style={{ padding: "5px 12px", fontSize: 12 }}>
              <TrashIcon /> Delete
            </button>
            <div style={{ marginLeft: "auto" }}>
              <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          </div>
        )}

        {/* Table view */}
        {viewMode === "table" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.size === pageData.length && pageData.length > 0} onChange={toggleAll} />
                  </th>
                  <TH label="School"     col="name"       />
                  <TH label="Students"   col="students"   align="right" />
                  <TH label="Teachers"   col="teachers"   align="right" />
                  <TH label="Plan"       col="plan"       />
                  <TH label="Status"     col="status"     />
                  <TH label="AI Score"   col="aiScore"    />
                  <TH label="Revenue"    col="revenue"    align="right" />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((s, i) => {
                  const sm = STATUS_META[s.status];
                  const pm = PLAN_META[s.plan];
                  return (
                    <tr
                      key={s.id}
                      className={selected.has(s.id) ? "row-selected" : ""}
                      style={{ animationDelay: `${i * 0.04}s` }}
                      onClick={() => navigate(`/super-admin/schools/${s.id}`)}
                    >
                      <td onClick={e => { e.stopPropagation(); toggleRow(s.id); }}>
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleRow(s.id)} />
                      </td>
                      <td>
                        <div className="school-name-cell">{s.name}</div>
                        <div className="school-loc">{s.city}, {s.state}</div>
                      </td>
                      <td style={{ textAlign: "right" }}>{s.students.toLocaleString()}</td>
                      <td style={{ textAlign: "right" }}>{s.teachers}</td>
                      <td>
                        <span className="badge" style={{ background: pm.bg, color: pm.color }}>{s.plan}</span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: sm.bg, color: sm.color }}>
                          <span className="badge-dot" style={{ background: sm.color }} />
                          {sm.label}
                        </span>
                      </td>
                      <td><ScorePill score={s.aiScore} /></td>
                      <td style={{ textAlign: "right", fontWeight: 500, color: s.revenue > 0 ? "#4fd1c5" : "#3d4a66" }}>
                        {s.revenue > 0 ? `₹${s.revenue}L` : "—"}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button className="ra-btn" title="View" onClick={() => navigate(`/super-admin/schools/${s.id}`)}><EyeIcon /></button>
                          <button className="ra-btn" title="Edit"><EditIcon /></button>
                          <button className="ra-btn danger" title="Delete"><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Card view */}
        {viewMode === "card" && (
          <div className="card-grid">
            {pageData.map((s, i) => {
              const sm = STATUS_META[s.status];
              const pm = PLAN_META[s.plan];
              const initials = s.name.split(" ").slice(0, 2).map(w => w[0]).join("");
              return (
                <div key={s.id} className="school-card" style={{ animationDelay: `${i * 0.05}s` }}
                     onClick={() => navigate(`/super-admin/schools/${s.id}`)}>
                  <div className="sc-top">
                    <div className="sc-initials">{initials}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="badge" style={{ background: pm.bg, color: pm.color }}>{s.plan}</span>
                      <span className="badge" style={{ background: sm.bg, color: sm.color }}>
                        <span className="badge-dot" style={{ background: sm.color }} />
                        {sm.label}
                      </span>
                    </div>
                  </div>
                  <div className="sc-name">{s.name}</div>
                  <div className="sc-loc">{s.city}, {s.state}</div>
                  <div className="sc-stats">
                    <div className="sc-stat-item">
                      <div className="sc-stat-val">{(s.students / 1000).toFixed(1)}K</div>
                      <div className="sc-stat-lbl">Students</div>
                    </div>
                    <div className="sc-stat-item">
                      <div className="sc-stat-val">{s.teachers}</div>
                      <div className="sc-stat-lbl">Teachers</div>
                    </div>
                    <div className="sc-stat-item">
                      <div className="sc-stat-val" style={{ color: s.aiScore >= 90 ? "#48bb78" : s.aiScore >= 75 ? "#f6ad55" : "#fc8181" }}>{s.aiScore}</div>
                      <div className="sc-stat-lbl">AI Score</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pg-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="pg-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
            <span className="pg-info">of {filtered.length} schools</span>
          </div>
        )}

      </div>
    </>
  );
}