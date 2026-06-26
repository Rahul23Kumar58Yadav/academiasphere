import { useState, useEffect, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
// Adjust BASE_URL to match your API. Token is read from localStorage.
const BASE_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:5000/api";
const getToken  = () => localStorage.getItem("token") ?? "";
const getSchoolId = () =>
  localStorage.getItem("schoolId") ??
  JSON.parse(localStorage.getItem("user") ?? "{}")?.schoolId ?? "";

// ─── Static options ───────────────────────────────────────────────────────────
const BOARDS  = ["CBSE","ICSE","IB","State","IGCSE","Other"];
const STATES  = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];
const MODULES = [
  { id:"attendance",   label:"Attendance Tracking",  icon:"📊", desc:"Mark & monitor daily attendance"      },
  { id:"fees",         label:"Fee Management",        icon:"💳", desc:"Track payments and fee structures"    },
  { id:"performance",  label:"Results Management",    icon:"📝", desc:"Enter grades and generate reports"    },
  { id:"ai",           label:"AI Predictions",        icon:"🤖", desc:"Attendance & performance forecasting" },
  { id:"blockchain",   label:"Blockchain Payments",   icon:"⛓️",  desc:"Immutable payment ledger"             },
  { id:"notifications",label:"SMS Notifications",     icon:"💬", desc:"Text alerts for parents and staff"   },
];
const PLANS = [
  { id:"free",       name:"Free",       price:"₹0",      period:"/mo", color:"#9ba8bf" },
  { id:"basic",      name:"Basic",      price:"₹4,999",  period:"/mo", color:"#4fd1c5" },
  { id:"pro",        name:"Pro",        price:"₹12,999", period:"/mo", color:"#9f7aea" },
  { id:"enterprise", name:"Enterprise", price:"Custom",  period:"",    color:"#e2b96a" },
];
const TABS = [
  { id:"overview",  label:"Overview",       icon:"🏠" },
  { id:"identity",  label:"School Info",    icon:"🏫" },
  { id:"contact",   label:"Contact",        icon:"📞" },
  { id:"stats",     label:"People & Stats", icon:"📊" },
  { id:"modules",   label:"Modules",        icon:"⚙️"  },
  { id:"plan",      label:"Subscription",   icon:"📋" },
];

// ─── API response → UI state mapper ──────────────────────────────────────────
const mapSchoolToState = (s) => ({
  _id:               s._id ?? "",
  // identity
  name:              s.name ?? "",
  affiliation:       s.affiliation ?? "",
  board:             s.type ?? "CBSE",
  established:       String(s.established ?? ""),
  type:              s.category ?? "Co-Ed",
  schoolType:        s.schoolType ?? "",
  medium:            s.medium ?? "English",
  accreditation:     s.accreditation ?? "",
  motto:             s.motto ?? "",
  logo:              s.logo ?? "",
  description:       s.description ?? "",
  // contact
  email:             s.email ?? "",
  phone:             s.phone ?? "",
  website:           s.website ?? "",
  address:           s.address?.street ?? "",
  city:              s.address?.city ?? s.city ?? "",
  state:             s.address?.state ?? s.state ?? "",
  pincode:           s.address?.pincode ?? "",
  // stats
  totalStudents:     String(s.studentCount ?? 0),
  totalTeachers:     String(s.teacherCount ?? 0),
  totalClasses:      String(s.totalClasses ?? 0),
  totalStaff:        String(s.totalStaff ?? 0),
  maleStudents:      String(s.maleStudents ?? 0),
  femaleStudents:    String(s.femaleStudents ?? 0),
  studentTeacherRatio: s.studentTeacherRatio ?? "",
  averageAttendance: String(s.averageAttendance ?? 0),
  passPercentage:    String(s.passPercentage ?? 0),
  feeCollectionRate: String(s.feeCollectionRate ?? 0),
  // plan + features
  planId:            s.plan ?? "free",
  features: {
    attendance:    s.features?.attendance    ?? true,
    fees:          s.features?.fees          ?? true,
    performance:   s.features?.performance   ?? true,
    ai:            s.features?.ai            ?? false,
    blockchain:    s.features?.blockchain    ?? false,
    notifications: s.features?.notifications ?? true,
  },
});

// ─── UI state → API payload mapper ────────────────────────────────────────────
const mapStateToPayload = (d) => ({
  name:              d.name,
  affiliation:       d.affiliation,
  type:              d.board,
  category:          d.type,
  schoolType:        d.schoolType,
  medium:            d.medium,
  accreditation:     d.accreditation,
  motto:             d.motto,
  logo:              d.logo,
  description:       d.description,
  established:       Number(d.established) || undefined,
  email:             d.email,
  phone:             d.phone,
  website:           d.website,
  address: {
    street:  d.address,
    city:    d.city,
    state:   d.state,
    pincode: d.pincode,
  },
  totalStudents:       Number(d.totalStudents)    || 0,
  totalTeachers:       Number(d.totalTeachers)    || 0,
  totalClasses:        Number(d.totalClasses)     || 0,
  totalStaff:          Number(d.totalStaff)       || 0,
  maleStudents:        Number(d.maleStudents)     || 0,
  femaleStudents:      Number(d.femaleStudents)   || 0,
  studentTeacherRatio: d.studentTeacherRatio,
  averageAttendance:   Number(d.averageAttendance) || 0,
  passPercentage:      Number(d.passPercentage)    || 0,
  feeCollectionRate:   Number(d.feeCollectionRate) || 0,
  features:            d.features,
});

// ─── Tiny UI helpers ──────────────────────────────────────────────────────────
const inputCss = (err) => ({
  background: "#161b27",
  border: `1px solid ${err ? "rgba(252,129,129,.35)" : "rgba(255,255,255,.07)"}`,
  borderRadius: 8, padding: "10px 13px",
  color: "#e8edf5", fontSize: 13.5,
  fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%",
  boxSizing: "border-box", transition: "border-color .15s",
});

const Field = ({ label, name, value, onChange, type = "text", placeholder, options, error, colSpan, readOnly }) => (
  <div style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined, display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b7a99", textTransform: "uppercase", letterSpacing: ".6px" }}>
      {label}
    </label>
    {options
      ? <select name={name} value={value} onChange={onChange} disabled={readOnly}
          style={{ ...inputCss(error), appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: readOnly ? "default" : "pointer" }}>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      : <input type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder ?? label} readOnly={readOnly}
          style={{ ...inputCss(error), cursor: readOnly ? "default" : undefined }}
          onFocus={e => { if (!readOnly) e.target.style.borderColor = "rgba(99,179,237,.4)"; }}
          onBlur={e => { e.target.style.borderColor = error ? "rgba(252,129,129,.35)" : "rgba(255,255,255,.07)"; }}
        />
    }
    {error && <span style={{ fontSize: 11.5, color: "#fc8181" }}>{error}</span>}
  </div>
);

const StatCard = ({ icon, label, value, sub, color = "#63b3ed", trend }) => (
  <div style={{ background: "#161b27", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      {trend && (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: trend > 0 ? "rgba(72,187,120,.12)" : "rgba(252,129,129,.12)", color: trend > 0 ? "#48bb78" : "#fc8181" }}>
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", letterSpacing: "-.5px" }}>{value}</div>
    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#9ba8bf" }}>{label}</div>
    {sub && <div style={{ fontSize: 11.5, color: "#6b7a99" }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "#3d4a66", borderBottom: "1px solid rgba(255,255,255,.04)", paddingBottom: 10, marginBottom: 18 }}>{children}</div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SchoolAdminProfile() {
  const [tab,      setTab     ] = useState("overview");
  const [data,     setData    ] = useState(null);
  const [original, setOriginal] = useState(null);
  const [edit,     setEdit    ] = useState(false);
  const [loading,  setLoading ] = useState(true);
  const [saving,   setSaving  ] = useState(false);
  const [toast,    setToast   ] = useState(null); // { type: "success"|"error", msg }

  // ── Fetch school on mount ────────────────────────────────────────────────────
  const fetchSchool = useCallback(async () => {
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      if (!schoolId) throw new Error("School ID not found. Please log in again.");

      const res = await fetch(`${BASE_URL}/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();

      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Failed to load school profile.");

      const mapped = mapSchoolToState(json.school);
      setData(mapped);
      setOriginal(mapped);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchool(); }, [fetchSchool]);

  // ── Toast helper ──────────────────────────────────────────────────────────────
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Field change ──────────────────────────────────────────────────────────────
  const update = (e) => setData(d => ({ ...d, [e.target.name]: e.target.value }));
  const toggleMod = (id) => setData(d => ({ ...d, features: { ...d.features, [id]: !d.features[id] } }));

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = mapStateToPayload(data);
      const res = await fetch(`${BASE_URL}/schools/${data._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Update failed.");

      const updated = mapSchoolToState(json.school);
      setData(updated);
      setOriginal(updated);
      setEdit(false);
      showToast("success", "Profile updated successfully");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => { setData(original); setEdit(false); };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const selectedPlan   = PLANS.find(p => p.id === data?.planId);
  const enabledCount   = data ? Object.values(data.features).filter(Boolean).length : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Syne:wght@600;700;800&display=swap');
        .sp-wrap { font-family:'DM Sans',sans-serif; color:#e8edf5; }
        .sp-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:14px; }
        .sp-avatar { width:72px; height:72px; border-radius:14px; background:linear-gradient(135deg,#63b3ed22,#4fd1c522); border:1px solid rgba(99,179,237,.2); display:flex; align-items:center; justify-content:center; font-size:34px; flex-shrink:0; }
        .sp-meta h1 { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; letter-spacing:-.5px; margin:0 0 4px; }
        .sp-meta p  { font-size:13.5px; color:#9ba8bf; margin:0; }
        .sp-badges  { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
        .sp-tabs { display:flex; gap:4px; border-bottom:1px solid rgba(255,255,255,.06); margin-bottom:28px; overflow-x:auto; }
        .sp-tab { display:flex; align-items:center; gap:6px; padding:9px 14px; font-size:13px; font-weight:500; color:#6b7a99; border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; white-space:nowrap; font-family:'DM Sans',sans-serif; transition:all .15s; }
        .sp-tab:hover { color:#c8d3e8; }
        .sp-tab.active { color:#63b3ed; border-bottom-color:#63b3ed; font-weight:600; }
        .sp-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .sp-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
        .sp-section { background:#0d1117; border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:22px; margin-bottom:16px; }
        .mod-item { display:flex; align-items:center; gap:12px; padding:13px 15px; background:#161b27; border:1px solid rgba(255,255,255,.06); border-radius:10px; transition:all .15s; }
        .mod-item.on { background:rgba(99,179,237,.06); border-color:rgba(99,179,237,.2); }
        .mod-item.clickable { cursor:pointer; }
        .mod-item.clickable:hover { border-color:rgba(255,255,255,.12); }
        .sw { width:36px; height:20px; border-radius:10px; background:#1e2535; position:relative; flex-shrink:0; transition:background .2s; border:1px solid rgba(255,255,255,.08); }
        .sw.on { background:rgba(99,179,237,.3); border-color:rgba(99,179,237,.4); }
        .sw .knob { position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#6b7a99; transition:all .2s; }
        .sw.on .knob { left:18px; background:#63b3ed; }
        .plan-card { border:2px solid rgba(255,255,255,.06); border-radius:12px; padding:18px; position:relative; transition:all .18s; background:#161b27; }
        .plan-card.selectable { cursor:pointer; }
        .plan-card.selectable:hover { border-color:rgba(255,255,255,.15); }
        .ov-kpi { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:12px; margin-bottom:20px; }
        .toast { position:fixed; bottom:28px; right:28px; backdrop-filter:blur(12px); padding:12px 20px; border-radius:10px; font-size:13.5px; font-weight:600; z-index:999; display:flex; align-items:center; gap:8px; animation:slideIn .3s ease; }
        .toast.success { background:rgba(72,187,120,.15); border:1px solid rgba(72,187,120,.3); color:#48bb78; }
        .toast.error   { background:rgba(252,129,129,.15); border:1px solid rgba(252,129,129,.3); color:#fc8181; }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; border:1px solid transparent; transition:all .18s; }
        .btn:disabled { opacity:.5; cursor:not-allowed; }
        .btn-ghost   { background:#161b27; color:#9ba8bf; border-color:rgba(255,255,255,.07); }
        .btn-ghost:hover:not(:disabled)   { background:#1e2535; color:#e8edf5; }
        .btn-primary { background:linear-gradient(135deg,#63b3ed,#4fd1c5); color:#090c14; border:none; }
        .btn-primary:hover:not(:disabled) { filter:brightness(1.08); }
        .btn-edit    { background:rgba(99,179,237,.1); color:#63b3ed; border-color:rgba(99,179,237,.2); }
        .btn-edit:hover { background:rgba(99,179,237,.18); }
        .skeleton { background:linear-gradient(90deg,#161b27 25%,#1e2535 50%,#161b27 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media(max-width:780px){ .sp-grid2,.sp-grid3 { grid-template-columns:1fr; } .ov-kpi { grid-template-columns:1fr 1fr; } }
        @media(max-width:480px){ .ov-kpi { grid-template-columns:1fr; } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      <div className="sp-wrap">

        {/* ── Loading skeleton ── */}
        {loading && (
          <div>
            <div style={{ display:"flex", gap:18, marginBottom:28 }}>
              <div className="skeleton" style={{ width:72, height:72, borderRadius:14, flexShrink:0 }} />
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                <div className="skeleton" style={{ height:28, width:"40%" }} />
                <div className="skeleton" style={{ height:16, width:"60%" }} />
                <div className="skeleton" style={{ height:24, width:"50%" }} />
              </div>
            </div>
            <div className="ov-kpi">
              {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:120 }} />)}
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── Top header ── */}
            <div className="sp-top">
              <div style={{ display:"flex", gap:18, alignItems:"flex-start" }}>
                <div className="sp-avatar">🏫</div>
                <div className="sp-meta">
                  <h1>{data.name || "School Name"}</h1>
                  <p>{[data.affiliation, data.board, data.established && `Est. ${data.established}`].filter(Boolean).join(" · ")}</p>
                  <div className="sp-badges">
                    {[
                      { label: selectedPlan?.name + " Plan", color: selectedPlan?.color },
                      { label: `${enabledCount} Modules`,    color: "#63b3ed" },
                      { label: data.city || "Location",      color: "#9ba8bf" },
                      { label: data.accreditation,           color: "#48bb78" },
                    ].filter(b => b.label).map((b, i) => (
                      <span key={i} style={{ padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:`${b.color}18`, border:`1px solid ${b.color}33`, color:b.color }}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", gap:8 }}>
                {!edit
                  ? <button className="btn btn-edit" onClick={() => setEdit(true)}>✏️ Edit Profile</button>
                  : <>
                      <button className="btn btn-ghost" onClick={handleDiscard} disabled={saving}>Discard</button>
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? "⏳ Saving…" : "💾 Save Changes"}
                      </button>
                    </>
                }
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="sp-tabs">
              {TABS.map(t => (
                <button key={t.id} className={`sp-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {/* ══ OVERVIEW ══ */}
            {tab === "overview" && (
              <>
                <div className="ov-kpi">
                  <StatCard icon="🎓" label="Total Students"  value={data.totalStudents} color="#63b3ed" trend={4} sub={`${data.maleStudents} boys · ${data.femaleStudents} girls`} />
                  <StatCard icon="👩‍🏫" label="Teaching Staff"  value={data.totalTeachers} color="#9f7aea" trend={2} sub={data.studentTeacherRatio ? `Ratio ${data.studentTeacherRatio}` : undefined} />
                  <StatCard icon="🏛️" label="Classrooms"       value={data.totalClasses}  color="#4fd1c5" />
                  <StatCard icon="🧑‍💼" label="Support Staff"    value={data.totalStaff}    color="#e2b96a" />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
                  <StatCard icon="📅" label="Avg. Attendance"     value={`${data.averageAttendance}%`}  color="#48bb78" trend={1} />
                  <StatCard icon="🏆" label="Pass Percentage"     value={`${data.passPercentage}%`}     color="#63b3ed" />
                  <StatCard icon="💳" label="Fee Collection Rate" value={`${data.feeCollectionRate}%`}  color="#4fd1c5" trend={-2} />
                </div>

                <div className="sp-section">
                  <SectionTitle>School At a Glance</SectionTitle>
                  <div className="sp-grid3" style={{ gap:20 }}>
                    {[
                      ["🏫", "School",      data.name],
                      ["🎓", "Board",       data.board],
                      ["📅", "Established", data.established],
                      ["🌐", "Website",     data.website],
                      ["📍", "City",        data.city],
                      ["📋", "Plan",        selectedPlan?.name],
                    ].map(([ic, lbl, val]) => (
                      <div key={lbl} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                        <span style={{ fontSize:20, marginTop:1 }}>{ic}</span>
                        <div>
                          <div style={{ fontSize:11.5, color:"#6b7a99", marginBottom:2 }}>{lbl}</div>
                          <div style={{ fontSize:13.5, fontWeight:500, color:"#c8d3e8" }}>{val || "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sp-section">
                  <SectionTitle>Active Modules ({enabledCount})</SectionTitle>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {MODULES.filter(m => data.features[m.id]).map(m => (
                      <span key={m.id} style={{ padding:"5px 12px", borderRadius:6, fontSize:12.5, fontWeight:600, background:"rgba(99,179,237,.1)", border:"1px solid rgba(99,179,237,.2)", color:"#63b3ed" }}>
                        {m.icon} {m.label}
                      </span>
                    ))}
                    {enabledCount === 0 && (
                      <span style={{ fontSize:13, color:"#6b7a99" }}>No modules enabled. Go to <strong style={{ color:"#63b3ed" }}>Modules</strong> tab to enable.</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ══ IDENTITY ══ */}
            {tab === "identity" && (
              <div className="sp-section">
                <SectionTitle>School Identity</SectionTitle>
                <div className="sp-grid2" style={{ gap:14 }}>
                  <Field label="School Name"           name="name"         value={data.name}         onChange={update} readOnly={!edit} colSpan={2} />
                  <Field label="Affiliation / Chain"   name="affiliation"  value={data.affiliation}  onChange={update} placeholder="e.g. DPS Society"   readOnly={!edit} />
                  <Field label="Board"                 name="board"        value={data.board}        onChange={update} options={BOARDS.map(b=>({value:b,label:b}))} readOnly={!edit} />
                  <Field label="Year Established"      name="established"  value={data.established}  onChange={update} type="number" readOnly={!edit} />
                  <Field label="School Type"           name="type"         value={data.type}         onChange={update}
                    options={[{value:"Co-Ed",label:"Co-Educational"},{value:"Boys",label:"Boys Only"},{value:"Girls",label:"Girls Only"}]}
                    readOnly={!edit} />
                  <Field label="Medium of Instruction" name="medium"       value={data.medium}       onChange={update}
                    options={[{value:"English",label:"English"},{value:"Hindi",label:"Hindi"},{value:"Bilingual",label:"Bilingual"}]}
                    readOnly={!edit} />
                  <Field label="Accreditation"         name="accreditation" value={data.accreditation} onChange={update}
                    options={[{value:"",label:"None"},{value:"NAAC",label:"NAAC"},{value:"NABH",label:"NABH"},{value:"ISO",label:"ISO 9001"},{value:"Other",label:"Other"}]}
                    readOnly={!edit} />
                  <Field label="School Motto"          name="motto"        value={data.motto}        onChange={update} placeholder="Your school motto" readOnly={!edit} colSpan={2} />
                  <Field label="Description"           name="description"  value={data.description}  onChange={update} placeholder="Brief description of your school" readOnly={!edit} colSpan={2} />
                </div>
              </div>
            )}

            {/* ══ CONTACT ══ */}
            {tab === "contact" && (
              <>
                <div className="sp-section">
                  <SectionTitle>Contact Details</SectionTitle>
                  <div className="sp-grid2" style={{ gap:14 }}>
                    <Field label="School Email"  name="email"   type="email" value={data.email}   onChange={update} readOnly={!edit} />
                    <Field label="Phone Number"  name="phone"   type="tel"   value={data.phone}   onChange={update} readOnly={!edit} />
                    <Field label="Website"       name="website"              value={data.website}  onChange={update} placeholder="www.school.edu.in" readOnly={!edit} />
                    <Field label="City"          name="city"                 value={data.city}    onChange={update} readOnly={!edit} />
                    <Field label="State"         name="state"                value={data.state}   onChange={update} options={STATES} readOnly={!edit} />
                    <Field label="PIN Code"      name="pincode"              value={data.pincode} onChange={update} placeholder="110001" readOnly={!edit} />
                    <Field label="Full Address"  name="address"              value={data.address} onChange={update} placeholder="Building, Street, Locality" readOnly={!edit} colSpan={2} />
                  </div>
                </div>

                {/* Address preview */}
                <div className="sp-section" style={{ padding:0, overflow:"hidden" }}>
                  <div style={{ height:160, background:"#0d1117", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, color:"#3d4a66" }}>
                    <span style={{ fontSize:32 }}>🗺️</span>
                    <span style={{ fontSize:13 }}>
                      {[data.address, data.city, data.state, data.pincode].filter(Boolean).join(", ") || "No address set"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ══ PEOPLE & STATS ══ */}
            {tab === "stats" && (
              <>
                {edit && (
                  <div style={{ background:"rgba(99,179,237,.06)", border:"1px solid rgba(99,179,237,.15)", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#63b3ed" }}>
                    ℹ️ These statistics are self-reported and used for your school dashboard. They don't automatically sync with live attendance or results data.
                  </div>
                )}

                <div className="sp-section">
                  <SectionTitle>Student Enrollment</SectionTitle>
                  <div className="sp-grid2" style={{ gap:14 }}>
                    <Field label="Total Students"           name="totalStudents"   type="number" value={data.totalStudents}   onChange={update} readOnly={!edit} />
                    <Field label="Total Classes / Sections" name="totalClasses"    type="number" value={data.totalClasses}    onChange={update} readOnly={!edit} />
                    <Field label="Male Students"            name="maleStudents"    type="number" value={data.maleStudents}    onChange={update} readOnly={!edit} />
                    <Field label="Female Students"          name="femaleStudents"  type="number" value={data.femaleStudents}  onChange={update} readOnly={!edit} />
                  </div>
                </div>

                <div className="sp-section">
                  <SectionTitle>Staff</SectionTitle>
                  <div className="sp-grid2" style={{ gap:14 }}>
                    <Field label="Total Teachers"        name="totalTeachers"      type="number" value={data.totalTeachers}      onChange={update} readOnly={!edit} />
                    <Field label="Support Staff"         name="totalStaff"         type="number" value={data.totalStaff}         onChange={update} readOnly={!edit} />
                    <Field label="Student-Teacher Ratio" name="studentTeacherRatio"              value={data.studentTeacherRatio} onChange={update} placeholder="e.g. 17:1" readOnly={!edit} />
                  </div>
                </div>

                <div className="sp-section">
                  <SectionTitle>Academic Performance</SectionTitle>
                  <div className="sp-grid3" style={{ gap:14 }}>
                    <Field label="Avg. Attendance (%)"     name="averageAttendance"  type="number" value={data.averageAttendance}  onChange={update} readOnly={!edit} />
                    <Field label="Pass Percentage (%)"     name="passPercentage"     type="number" value={data.passPercentage}     onChange={update} readOnly={!edit} />
                    <Field label="Fee Collection Rate (%)" name="feeCollectionRate"  type="number" value={data.feeCollectionRate}  onChange={update} readOnly={!edit} />
                  </div>
                </div>

                {/* Mini progress bars */}
                <div className="sp-section">
                  <SectionTitle>Quick Metrics</SectionTitle>
                  {[
                    { label:"Attendance Rate",  value:Number(data.averageAttendance),  color:"#48bb78" },
                    { label:"Pass Percentage",  value:Number(data.passPercentage),     color:"#63b3ed" },
                    { label:"Fee Collection",   value:Number(data.feeCollectionRate),  color:"#4fd1c5" },
                    {
                      label:"Male Students %",
                      value: Number(data.totalStudents) > 0
                        ? Math.round(Number(data.maleStudents) / Number(data.totalStudents) * 100)
                        : 0,
                      color:"#9f7aea"
                    },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13, color:"#9ba8bf" }}>
                        <span>{m.label}</span>
                        <span style={{ color:m.color, fontWeight:700 }}>{m.value}%</span>
                      </div>
                      <div style={{ height:6, background:"#1e2535", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(m.value,100)}%`, background:m.color, borderRadius:3, transition:"width .6s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ══ MODULES ══ */}
            {tab === "modules" && (
              <div className="sp-section">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <SectionTitle>Platform Modules</SectionTitle>
                  <span style={{ fontSize:12.5, color:"#6b7a99" }}>{enabledCount} of {MODULES.length} active</span>
                </div>
                <div className="sp-grid2" style={{ gap:10 }}>
                  {MODULES.map(m => (
                    <div key={m.id}
                      className={`mod-item${data.features[m.id] ? " on" : ""}${edit ? " clickable" : ""}`}
                      onClick={() => edit && toggleMod(m.id)}
                    >
                      <div style={{ width:38, height:38, background:"#0d1117", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{m.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#c8d3e8" }}>{m.label}</div>
                        <div style={{ fontSize:11.5, color:"#6b7a99", marginTop:2 }}>{m.desc}</div>
                      </div>
                      <div className={`sw${data.features[m.id] ? " on" : ""}`}><div className="knob" /></div>
                    </div>
                  ))}
                </div>
                {!edit && (
                  <p style={{ marginTop:16, fontSize:12.5, color:"#6b7a99", textAlign:"center" }}>
                    Click <strong style={{ color:"#63b3ed" }}>Edit Profile</strong> to enable or disable modules.
                  </p>
                )}
              </div>
            )}

            {/* ══ SUBSCRIPTION ══ */}
            {tab === "plan" && (
              <>
                <div className="sp-section">
                  <SectionTitle>Current Subscription</SectionTitle>
                  <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:selectedPlan?.color }}>{selectedPlan?.name}</span>
                    <div>
                      <div style={{ fontSize:22, fontWeight:700, color:"#e8edf5" }}>
                        {selectedPlan?.price}<span style={{ fontSize:13, color:"#6b7a99", fontWeight:400 }}> {selectedPlan?.period}</span>
                      </div>
                      <div style={{ fontSize:12.5, color:"#9ba8bf" }}>Contact support to change plan</div>
                    </div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
                    {PLANS.map(p => {
                      const sel = data.planId === p.id;
                      return (
                        <div key={p.id} className="plan-card" style={{ borderColor: sel ? p.color : "rgba(255,255,255,.06)" }}>
                          {sel && (
                            <div style={{ position:"absolute", top:12, right:12, width:20, height:20, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#090c14", fontWeight:900 }}>✓</div>
                          )}
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:p.color, marginBottom:4 }}>{p.name}</div>
                          <div style={{ fontSize:20, fontWeight:700, color:"#e8edf5" }}>
                            {p.price}<span style={{ fontSize:12, color:"#6b7a99", fontWeight:400 }}> {p.period}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ marginTop:16, fontSize:12.5, color:"#6b7a99" }}>
                    To upgrade or change your plan, please contact <strong style={{ color:"#63b3ed" }}>support@academiasphere.in</strong>.
                  </p>
                </div>

                <div className="sp-section">
                  <SectionTitle>Billing Info</SectionTitle>
                  <div className="sp-grid2" style={{ gap:14 }}>
                    {[["Next Renewal","Auto-renews monthly"],["Payment Method","Manage via billing portal"],["Billing Email",data.email],["School Code",data._id?.slice(-8)?.toUpperCase() ?? "—"]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ fontSize:11.5, color:"#6b7a99", marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:13.5, fontWeight:500, color:"#c8d3e8" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Bottom action bar when editing */}
            {edit && (
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:24, paddingTop:20, borderTop:"1px solid rgba(255,255,255,.06)" }}>
                <button className="btn btn-ghost" onClick={handleDiscard} disabled={saving}>Discard Changes</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "⏳ Saving…" : "💾 Save All Changes"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Error / empty state */}
        {!loading && !data && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#6b7a99" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
            <div style={{ fontSize:16, fontWeight:600, color:"#c8d3e8", marginBottom:8 }}>Could not load school profile</div>
            <div style={{ fontSize:13, marginBottom:20 }}>Check your connection or log in again.</div>
            <button className="btn btn-edit" onClick={fetchSchool}>Retry</button>
          </div>
        )}
      </div>
    </>
  );
}