import { useState, useMemo, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const COLLECTION_TREND = [
  { month: "Aug", collected: 24, target: 26, overdue: 2.1 },
  { month: "Sep", collected: 28, target: 30, overdue: 1.8 },
  { month: "Oct", collected: 31, target: 33, overdue: 3.2 },
  { month: "Nov", collected: 35, target: 37, overdue: 2.4 },
  { month: "Dec", collected: 38, target: 40, overdue: 2.8 },
  { month: "Jan", collected: 42, target: 44, overdue: 3.1 },
  { month: "Feb", collected: 45, target: 48, overdue: 3.6 },
  { month: "Mar", collected: 48, target: 52, overdue: 4.2 },
];

const CATEGORY_DATA = [
  { name: "Tuition", value: 58, color: "#5b8cff" },
  { name: "Transport", value: 20, color: "#38d9c0" },
  { name: "Hostel", value: 13, color: "#b57bee" },
  { name: "Activity", value: 9, color: "#ffb547" },
];

const REMINDER_PERF = [
  { week: "W1", sent: 1200, opened: 840, paid: 310 },
  { week: "W2", sent: 1400, opened: 1010, paid: 420 },
  { week: "W3", sent: 1100, opened: 820, paid: 380 },
  { week: "W4", sent: 1600, opened: 1180, paid: 560 },
  { week: "W5", sent: 1300, opened: 950, paid: 440 },
  { week: "W6", sent: 1800, opened: 1300, paid: 610 },
];

const WAIVER_DATA = [
  { name: "Merit", value: 42, color: "#5b8cff" },
  { name: "Financial Aid", value: 28, color: "#38d9c0" },
  { name: "Sports", value: 17, color: "#ffb547" },
  { name: "Sibling/Staff", value: 13, color: "#ff5f7e" },
];

const SCHOOLS_DATA = [
  { id: 1, name: "Delhi Public School, R.K. Puram", city: "New Delhi", due: 48.2, collected: 43.8, overdue: 4.4, next: "10 Apr", status: "active" },
  { id: 2, name: "The Cathedral & John Connon School", city: "Mumbai", due: 38.7, collected: 36.1, overdue: 2.6, next: "15 Apr", status: "active" },
  { id: 3, name: "Bangalore International Academy", city: "Bengaluru", due: 18.4, collected: 14.2, overdue: 4.2, next: "8 Apr", status: "critical" },
  { id: 4, name: "La Martiniere Calcutta", city: "Kolkata", due: 28.4, collected: 26.8, overdue: 1.6, next: "12 Apr", status: "active" },
  { id: 5, name: "Mayo College", city: "Ajmer", due: 14.6, collected: 13.1, overdue: 1.5, next: "20 Apr", status: "active" },
  { id: 6, name: "The Doon School", city: "Dehradun", due: 22.1, collected: 21.4, overdue: 0.7, next: "5 Apr", status: "active" },
  { id: 7, name: "Scindia School", city: "Gwalior", due: 8.2, collected: 5.1, overdue: 3.1, next: "1 Apr", status: "critical" },
  { id: 8, name: "Shreeram Global School", city: "Gurugram", due: 31.2, collected: 28.9, overdue: 2.3, next: "18 Apr", status: "active" },
];

const TRANSACTIONS = [
  { id: "TXN-28410", student: "Aarav Sharma", cls: "X-B", school: "DPS R.K. Puram", category: "Tuition", amount: 48000, method: "Blockchain", date: "2 Apr 2026", status: "success" },
  { id: "TXN-28409", student: "Priya Mehta", cls: "VIII-A", school: "The Cathedral School", category: "Hostel", amount: 120000, method: "Online", date: "2 Apr 2026", status: "success" },
  { id: "TXN-28408", student: "Rohan Gupta", cls: "XII-C", school: "La Martiniere", category: "Transport", amount: 18000, method: "Online", date: "1 Apr 2026", status: "pending" },
  { id: "TXN-28407", student: "Sneha Iyer", cls: "VI-A", school: "Rishi Valley", category: "Tuition", amount: 36000, method: "Cheque", date: "1 Apr 2026", status: "success" },
  { id: "TXN-28406", student: "Kartik Nair", cls: "XI-B", school: "Mayo College", category: "Tuition", amount: 62000, method: "Blockchain", date: "31 Mar 2026", status: "failed" },
  { id: "TXN-28405", student: "Ananya Das", cls: "IX-D", school: "The Doon School", category: "Hostel", amount: 95000, method: "Online", date: "30 Mar 2026", status: "success" },
  { id: "TXN-28404", student: "Vikram Singh", cls: "VII-B", school: "Shreeram Global", category: "Activity", amount: 8000, method: "Online", date: "29 Mar 2026", status: "success" },
  { id: "TXN-28403", student: "Riya Kapoor", cls: "X-A", school: "Bangalore Intl", category: "Tuition", amount: 52000, method: "Online", date: "28 Mar 2026", status: "pending" },
];

const FEE_STRUCTURES = {
  tuition: [
    { name: "Class I–V", detail: "CBSE · Annual", amount: "₹36,000", cycle: "per year" },
    { name: "Class VI–VIII", detail: "CBSE · Annual", amount: "₹48,000", cycle: "per year" },
    { name: "Class IX–X", detail: "CBSE · Annual", amount: "₹58,000", cycle: "per year" },
    { name: "Class XI–XII", detail: "CBSE · Annual", amount: "₹72,000", cycle: "per year" },
  ],
  transport: [
    { name: "Zone A — 0–5 km", detail: "Monthly · Auto-renew", amount: "₹1,200", cycle: "per month" },
    { name: "Zone B — 5–10 km", detail: "Monthly · Auto-renew", amount: "₹1,800", cycle: "per month" },
    { name: "Zone C — 10–20 km", detail: "Monthly · Auto-renew", amount: "₹2,400", cycle: "per month" },
    { name: "Zone D — 20+ km", detail: "Monthly · Auto-renew", amount: "₹3,200", cycle: "per month" },
  ],
  hostel: [
    { name: "Hostel — Dormitory", detail: "Quarterly · Per semester", amount: "₹45,000", cycle: "per quarter" },
    { name: "Hostel — Single Room", detail: "Quarterly · Premium", amount: "₹72,000", cycle: "per quarter" },
    { name: "Activity Fee", detail: "Annual · Mandatory", amount: "₹8,000", cycle: "per year" },
    { name: "Lab & Library", detail: "Annual · Science students", amount: "₹5,500", cycle: "per year" },
  ],
};

const LATE_FEE_RULES = [
  { name: "Standard Late Fee", grace: "7 days", penalty: "₹500 flat", applies: "All fee types", status: "active" },
  { name: "Monthly Penalty", grace: "30 days", penalty: "2% of outstanding", applies: "Tuition only", status: "active" },
  { name: "Hostel Late Checkout", grace: "3 days", penalty: "₹1,200/day", applies: "Hostel", status: "draft" },
];

const WAIVERS = [
  { initials: "AM", gradient: ["#5b8cff", "#38d9c0"], name: "Arjun Mishra", school: "DPS R.K. Puram", type: "Merit Scholarship", pct: 75, saved: "₹54,000" },
  { initials: "SK", gradient: ["#ff5f7e", "#b57bee"], name: "Sana Khan", school: "Bangalore Intl", type: "Financial Aid", pct: 50, saved: "₹24,000" },
  { initials: "DP", gradient: ["#ffb547", "#ff5f7e"], name: "Dev Patel", school: "Mayo College", type: "Sports Quota", pct: 30, saved: "₹17,400" },
  { initials: "NR", gradient: ["#3dd68c", "#38d9c0"], name: "Nisha Rao", school: "Cathedral School", type: "Sibling Discount", pct: 15, saved: "₹10,800" },
  { initials: "VT", gradient: ["#b57bee", "#5b8cff"], name: "Vivaan Tripathi", school: "Doon School", type: "Staff Ward", pct: 100, saved: "Full waiver" },
];

const REMINDERS = [
  { icon: "📧", bg: "rgba(91,140,255,0.12)", name: "Pre-Due Email Blast", meta: "3 days before due date · All schools · 4,218 recipients", status: "active" },
  { icon: "💬", bg: "rgba(255,181,71,0.12)", name: "SMS Day-Of Alert", meta: "On due date · Pro & Enterprise · 3,890 recipients", status: "active" },
  { icon: "🔔", bg: "rgba(255,95,126,0.12)", name: "Overdue Escalation", meta: "7 days after due · Critical only · Auto-escalate to principal", status: "active" },
  { icon: "📞", bg: "rgba(181,123,238,0.12)", name: "Call Queue Trigger", meta: "14 days overdue · Manual follow-up queue generated", status: "paused" },
  { icon: "🏫", bg: "rgba(61,214,140,0.12)", name: "Monthly Summary Report", meta: "1st of month · Super Admin + School Admins · PDF attached", status: "active" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  success: { bg: "rgba(61,214,140,0.12)", color: "#3dd68c", label: "Success" },
  pending: { bg: "rgba(255,181,71,0.12)", color: "#ffb547", label: "Pending" },
  failed:  { bg: "rgba(255,95,126,0.12)", color: "#ff5f7e", label: "Failed"  },
};
const METHOD_BADGE = {
  Blockchain: { bg: "rgba(61,214,140,0.12)", color: "#3dd68c" },
  Online:     { bg: "rgba(91,140,255,0.12)", color: "#5b8cff" },
  Cheque:     { bg: "rgba(255,95,126,0.12)", color: "#ff5f7e" },
  Cash:       { bg: "rgba(255,181,71,0.12)", color: "#ffb547" },
};
const CAT_BADGE = {
  Tuition:   { bg: "rgba(91,140,255,0.12)", color: "#5b8cff" },
  Hostel:    { bg: "rgba(181,123,238,0.12)", color: "#b57bee" },
  Transport: { bg: "rgba(255,181,71,0.12)", color: "#ffb547" },
  Activity:  { bg: "rgba(61,214,140,0.12)", color: "#3dd68c" },
};

const fmt = (n) => n.toLocaleString("en-IN");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#6b7a99", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#5b8cff", fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── Sub Components ───────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, dir, sub, accent }) {
  return (
    <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "#4a5168", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#eef0f8", letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: dir === "up" ? "rgba(61,214,140,0.12)" : "rgba(255,95,126,0.12)", color: dir === "up" ? "#3dd68c" : "#ff5f7e" }}>
          {dir === "up" ? "↑" : "↓"} {delta}
        </span>
        <span style={{ fontSize: 12, color: "#4a5168" }}>{sub}</span>
      </div>
    </div>
  );
}

function Badge({ bg, color, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: bg, color }}>
      {children}
    </span>
  );
}

function ProgressBar({ pct }) {
  const color = pct >= 90 ? "#3dd68c" : pct >= 75 ? "#ffb547" : "#ff5f7e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 70, height: 4, background: "#1e2540", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
    </div>
  );
}

function Btn({ children, variant = "ghost", onClick, style = {} }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid transparent", transition: "all .15s", ...style };
  const variants = {
    ghost:   { background: "none", borderColor: "rgba(255,255,255,0.10)", color: "#8b93b0" },
    primary: { background: "linear-gradient(135deg,#5b8cff,#38d9c0)", color: "#090c14", border: "none" },
    danger:  { background: "rgba(255,95,126,0.12)", borderColor: "rgba(255,95,126,0.2)", color: "#ff5f7e" },
    sm:      { padding: "5px 10px", fontSize: 11.5 },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,8,16,.85)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: 28, width: 500, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#eef0f8", marginBottom: 20 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "#4a5168" }}>{label}</label>
      {children}
    </div>
  );
}

const inputSty = { background: "#111520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "9px 12px", color: "#eef0f8", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };

// ─── TAB: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ onRecordPay }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => SCHOOLS_DATA.filter(s => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  }), [search, statusFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        <KpiCard label="Total Collected"    value="₹38.7Cr" delta="24%"    dir="up"   sub="vs last month" accent="#3dd68c" />
        <KpiCard label="Overdue Amount"     value="₹4.2Cr"  delta="8%"     dir="down" sub="vs last month" accent="#ff5f7e" />
        <KpiCard label="Pending This Month" value="₹11.4Cr" delta="3%"     dir="up"   sub="on target"     accent="#5b8cff" />
        <KpiCard label="Waivers Granted"    value="₹1.8Cr"  delta="312"    dir="up"   sub="students"      accent="#ffb547" />
        <KpiCard label="Collection Rate"    value="89.7%"   delta="1.2%"   dir="up"   sub="platform avg"  accent="#b57bee" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Trend */}
        <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8" }}>Monthly Collection Trend</div>
              <div style={{ fontSize: 12, color: "#4a5168", marginTop: 3 }}>Collected vs target vs overdue (₹ Lakhs)</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ c: "#5b8cff", l: "Collected" }, { c: "#38d9c0", l: "Target" }, { c: "#ff5f7e", l: "Overdue" }].map(x => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#8b93b0" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: x.c }} />{x.l}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={COLLECTION_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#4a5168", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a5168", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="collected" fill="#5b8cff" radius={[4, 4, 0, 0]} name="Collected" maxBarSize={28} />
              <Bar dataKey="overdue"   fill="#ff5f7e" radius={[4, 4, 0, 0]} name="Overdue"   maxBarSize={28} />
              <Line type="monotone" dataKey="target" stroke="#38d9c0" strokeWidth={2} dot={false} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8", marginBottom: 14 }}>By Category</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {CATEGORY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {CATEGORY_DATA.map(c => (
              <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }} />
                  <span style={{ color: "#8b93b0" }}>{c.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: "#eef0f8", fontFamily: "'DM Mono',monospace" }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* School Table */}
      <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8" }}>School-wise Collection Status</div>
            <div style={{ fontSize: 12, color: "#4a5168", marginTop: 2 }}>Top 8 schools by outstanding amount</div>
          </div>
          <Btn variant="ghost" style={{ fontSize: 12, padding: "6px 12px" }}>Export CSV</Btn>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            style={{ ...inputSty, flex: 1, maxWidth: 240 }}
            placeholder="Search schools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={{ ...inputSty, width: 140, cursor: "pointer" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">On Track</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111520" }}>
                {["School", "Total Due", "Collected", "Collection %", "Overdue", "Next Due", "Status", "Action"].map(h => (
                  <th key={h} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase", color: "#4a5168", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const pct = Math.round((s.collected / s.due) * 100);
                const isCritical = s.status === "critical";
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "#eef0f8", fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: "#4a5168", marginTop: 2 }}>{s.city}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "#eef0f8" }}>₹{s.due}L</td>
                    <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "#3dd68c" }}>₹{s.collected}L</td>
                    <td style={{ padding: "12px 14px" }}><ProgressBar pct={pct} /></td>
                    <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "#ff5f7e" }}>₹{s.overdue}L</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#4a5168" }}>{s.next}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge bg={isCritical ? "rgba(255,95,126,0.12)" : "rgba(61,214,140,0.12)"} color={isCritical ? "#ff5f7e" : "#3dd68c"}>
                        ● {isCritical ? "Critical" : "On Track"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Btn variant="ghost" style={{ padding: "5px 10px", fontSize: 11.5 }} onClick={onRecordPay}>Send Reminder</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Transactions ────────────────────────────────────────────────────────
function TransactionsTab({ onRecordPay }) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const filtered = useMemo(() => TRANSACTIONS.filter(t => {
    const q = search.toLowerCase();
    if (q && !t.id.toLowerCase().includes(q) && !t.student.toLowerCase().includes(q) && !t.school.toLowerCase().includes(q)) return false;
    if (methodFilter !== "all" && t.method !== methodFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    return true;
  }), [search, methodFilter, statusFilter, catFilter]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8" }}>Transaction Ledger</div>
          <div style={{ fontSize: 12, color: "#4a5168", marginTop: 2 }}>All fee payments — real-time</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" style={{ fontSize: 12, padding: "6px 12px" }}>Export</Btn>
          <Btn variant="primary" style={{ fontSize: 12, padding: "7px 14px" }} onClick={onRecordPay}>+ Record Payment</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input style={{ ...inputSty, flex: 1, minWidth: 180, maxWidth: 280 }} placeholder="Search TXN ID, student, school..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        {[
          { val: catFilter, set: setCatFilter, opts: [["all","All Categories"],["Tuition","Tuition"],["Transport","Transport"],["Hostel","Hostel"],["Activity","Activity"]] },
          { val: methodFilter, set: setMethodFilter, opts: [["all","All Methods"],["Online","Online"],["Blockchain","Blockchain"],["Cheque","Cheque"],["Cash","Cash"]] },
          { val: statusFilter, set: setStatusFilter, opts: [["all","All Status"],["success","Success"],["pending","Pending"],["failed","Failed"]] },
        ].map((f, i) => (
          <select key={i} style={{ ...inputSty, width: 150, cursor: "pointer" }} value={f.val} onChange={e => { f.set(e.target.value); setPage(1); }}>
            {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111520" }}>
              {["TXN ID", "Student", "School", "Category", "Amount", "Method", "Date", "Status"].map(h => (
                <th key={h} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase", color: "#4a5168", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(t => {
              const st = STATUS_BADGE[t.status];
              const mt = METHOD_BADGE[t.method] || { bg: "rgba(255,255,255,0.06)", color: "#8b93b0" };
              const ct = CAT_BADGE[t.category] || { bg: "rgba(255,255,255,0.06)", color: "#8b93b0" };
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#4a5168" }}>{t.id}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, color: "#eef0f8", fontSize: 13 }}>{t.student}</div>
                    <div style={{ fontSize: 11.5, color: "#4a5168" }}>Class {t.cls}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12.5, color: "#8b93b0" }}>{t.school}</td>
                  <td style={{ padding: "12px 14px" }}><Badge bg={ct.bg} color={ct.color}>{t.category}</Badge></td>
                  <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "#eef0f8" }}>₹{fmt(t.amount)}</td>
                  <td style={{ padding: "12px 14px" }}><Badge bg={mt.bg} color={mt.color}>{t.method}</Badge></td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#4a5168" }}>{t.date}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge bg={st.bg} color={st.color}>● {st.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 14 }}>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ ...inputSty, width: 32, height: 32, padding: 0, textAlign: "center", cursor: "pointer", opacity: page === 1 ? .3 : 1 }}>‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ ...inputSty, width: 32, height: 32, padding: 0, textAlign: "center", cursor: "pointer", background: page === p ? "rgba(91,140,255,0.15)" : "#111520", color: page === p ? "#5b8cff" : "#8b93b0", border: page === p ? "1px solid rgba(91,140,255,0.3)" : "1px solid rgba(255,255,255,0.07)", fontWeight: page === p ? 700 : 400 }}>{p}</button>
          ))}
          <button onClick={() => setPage(p => p + 1)} disabled={page === pages} style={{ ...inputSty, width: 32, height: 32, padding: 0, textAlign: "center", cursor: "pointer", opacity: page === pages ? .3 : 1 }}>›</button>
          <span style={{ fontSize: 12, color: "#4a5168", marginLeft: 8 }}>{filtered.length} transactions</span>
        </div>
      )}
    </div>
  );
}

// ─── TAB: Fee Structures ──────────────────────────────────────────────────────
function StructuresTab({ onAddFee }) {
  const StructCard = ({ title, items }) => (
    <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8" }}>{title}</div>
        <Btn variant="ghost" style={{ fontSize: 11.5, padding: "5px 10px" }} onClick={onAddFee}>+ Add</Btn>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#eef0f8" }}>{item.name}</div>
            <div style={{ fontSize: 11.5, color: "#4a5168", marginTop: 1 }}>{item.detail}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8", fontFamily: "'DM Mono',monospace" }}>{item.amount}</div>
            <div style={{ fontSize: 11, color: "#4a5168" }}>{item.cycle}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <StructCard title="Tuition Fees"    items={FEE_STRUCTURES.tuition}   />
        <StructCard title="Transport Fees"  items={FEE_STRUCTURES.transport}  />
        <StructCard title="Hostel & Others" items={FEE_STRUCTURES.hostel}     />
      </div>

      <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8" }}>Late Fee & Penalty Rules</div>
          <Btn variant="primary" style={{ fontSize: 12, padding: "7px 14px" }} onClick={onAddFee}>+ New Rule</Btn>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111520" }}>
              {["Rule Name", "Grace Period", "Penalty", "Applies To", "Status", ""].map(h => (
                <th key={h} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase", color: "#4a5168", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LATE_FEE_RULES.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "#eef0f8", fontSize: 13 }}>{r.name}</td>
                <td style={{ padding: "12px 14px", color: "#8b93b0", fontSize: 13 }}>{r.grace}</td>
                <td style={{ padding: "12px 14px", color: "#8b93b0", fontSize: 13 }}>{r.penalty}</td>
                <td style={{ padding: "12px 14px", color: "#8b93b0", fontSize: 13 }}>{r.applies}</td>
                <td style={{ padding: "12px 14px" }}>
                  <Badge bg={r.status === "active" ? "rgba(61,214,140,0.12)" : "rgba(255,181,71,0.12)"} color={r.status === "active" ? "#3dd68c" : "#ffb547"}>
                    ● {r.status === "active" ? "Active" : "Draft"}
                  </Badge>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Btn variant="ghost" style={{ fontSize: 11.5, padding: "5px 10px" }}>Edit</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB: Waivers ─────────────────────────────────────────────────────────────
function WaiversTab({ onAddWaiver }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
      <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8" }}>Active Waivers & Scholarships</div>
            <div style={{ fontSize: 12, color: "#4a5168", marginTop: 2 }}>₹1.8Cr waived · 312 students</div>
          </div>
          <Btn variant="primary" style={{ fontSize: 12, padding: "7px 14px" }} onClick={onAddWaiver}>+ Grant Waiver</Btn>
        </div>
        {WAIVERS.map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < WAIVERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg,${w.gradient[0]},${w.gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{w.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#eef0f8" }}>{w.name}</div>
              <div style={{ fontSize: 11.5, color: "#4a5168" }}>{w.school} · {w.type}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#ffb547", fontFamily: "'DM Mono',monospace" }}>{w.pct}%</div>
              <div style={{ fontSize: 11, color: "#4a5168" }}>{w.saved} saved</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8", marginBottom: 14 }}>Waiver Categories</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={WAIVER_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
              {WAIVER_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {WAIVER_DATA.map(w => (
            <div key={w.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8b93b0" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: w.color }} />{w.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80, height: 4, background: "#1e2540", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${w.value}%`, height: "100%", background: w.color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#eef0f8", minWidth: 30, textAlign: "right" }}>{w.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Reminders ───────────────────────────────────────────────────────────
function RemindersTab({ onAddReminder }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
      <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8" }}>Automated Reminders</div>
            <div style={{ fontSize: 12, color: "#4a5168", marginTop: 2 }}>Scheduled fee reminder campaigns</div>
          </div>
          <Btn variant="primary" style={{ fontSize: 12, padding: "7px 14px" }} onClick={onAddReminder}>+ New Reminder</Btn>
        </div>
        {REMINDERS.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < REMINDERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#eef0f8" }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: "#4a5168", marginTop: 2 }}>{r.meta}</div>
            </div>
            <Badge
              bg={r.status === "active" ? "rgba(61,214,140,0.12)" : "rgba(255,181,71,0.12)"}
              color={r.status === "active" ? "#3dd68c" : "#ffb547"}
            >● {r.status === "active" ? "Active" : "Paused"}</Badge>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#eef0f8", marginBottom: 14 }}>Reminder Performance</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={REMINDER_PERF} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "#4a5168", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a5168", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="sent"   stroke="#5b8cff" strokeWidth={2} dot={false} name="Sent"   />
              <Line type="monotone" dataKey="opened" stroke="#38d9c0" strokeWidth={2} dot={false} name="Opened" />
              <Line type="monotone" dataKey="paid"   stroke="#3dd68c" strokeWidth={2} dot={false} name="Paid after" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {[{ c: "#5b8cff", l: "Sent" }, { c: "#38d9c0", l: "Opened" }, { c: "#3dd68c", l: "Paid after" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#8b93b0" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: x.c }} />{x.l}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Open Rate", value: "72.4%" },
            { label: "Pay-after-reminder", value: "48.1%" },
            { label: "SMS Delivered", value: "98.3%" },
            { label: "Avg Response Time", value: "2.4 days" },
          ].map(s => (
            <div key={s.label} style={{ background: "#111520", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", color: "#4a5168", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#eef0f8" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function RecordPaymentModal({ open, onClose }) {
  const [form, setForm] = useState({ student: "", cls: "", school: "DPS R.K. Puram", category: "Tuition", amount: "", method: "Online", date: "", note: "" });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={onClose} title="Record Fee Payment">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Student Name"><input style={inputSty} placeholder="e.g. Aarav Sharma" value={form.student} onChange={set("student")} /></Field>
        <Field label="Class / Section"><input style={inputSty} placeholder="e.g. X-B" value={form.cls} onChange={set("cls")} /></Field>
      </div>
      <Field label="School">
        <select style={{ ...inputSty, cursor: "pointer" }} value={form.school} onChange={set("school")}>
          {["DPS R.K. Puram", "The Cathedral School", "La Martiniere", "Mayo College", "The Doon School"].map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Fee Category">
          <select style={{ ...inputSty, cursor: "pointer" }} value={form.category} onChange={set("category")}>
            {["Tuition", "Transport", "Hostel", "Activity", "Lab", "Library"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)"><input style={inputSty} type="number" placeholder="e.g. 48000" value={form.amount} onChange={set("amount")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Payment Method">
          <select style={{ ...inputSty, cursor: "pointer" }} value={form.method} onChange={set("method")}>
            {["Online", "Blockchain", "Cheque", "Cash"].map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Payment Date"><input style={inputSty} type="date" value={form.date} onChange={set("date")} /></Field>
      </div>
      <Field label="Reference / Note"><input style={inputSty} placeholder="Optional reference number" value={form.note} onChange={set("note")} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={onClose}>Record Payment</Btn>
      </div>
    </Modal>
  );
}

function AddFeeModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Fee Structure">
      <Field label="Fee Name"><input style={inputSty} placeholder="e.g. Class XI Tuition Fee" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category">
          <select style={{ ...inputSty, cursor: "pointer" }}>
            {["Tuition", "Transport", "Hostel", "Activity", "Lab", "Library"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)"><input style={inputSty} type="number" placeholder="e.g. 72000" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Billing Cycle">
          <select style={{ ...inputSty, cursor: "pointer" }}>
            <option>Monthly</option><option>Quarterly</option><option>Annual</option>
          </select>
        </Field>
        <Field label="Applicable Classes"><input style={inputSty} placeholder="e.g. XI–XII" /></Field>
      </div>
      <Field label="Applies To">
        <select style={{ ...inputSty, cursor: "pointer" }}>
          <option>All Schools</option><option>DPS R.K. Puram</option><option>Custom selection...</option>
        </select>
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={onClose}>Save Structure</Btn>
      </div>
    </Modal>
  );
}

function AddWaiverModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Grant Waiver / Scholarship">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Student Name"><input style={inputSty} placeholder="Full name" /></Field>
        <Field label="Roll / Student ID"><input style={inputSty} placeholder="e.g. DPS-2024-1042" /></Field>
      </div>
      <Field label="School">
        <select style={{ ...inputSty, cursor: "pointer" }}>
          {["DPS R.K. Puram", "The Cathedral School", "Bangalore International", "Mayo College"].map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Waiver Type">
          <select style={{ ...inputSty, cursor: "pointer" }}>
            {["Merit Scholarship", "Financial Aid", "Sports Quota", "Staff Ward", "Sibling Discount"].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Discount %"><input style={inputSty} type="number" placeholder="e.g. 50" min={0} max={100} /></Field>
      </div>
      <Field label="Applicable Fees">
        <select style={{ ...inputSty, cursor: "pointer" }}>
          <option>All Fees</option><option>Tuition Only</option><option>Custom</option>
        </select>
      </Field>
      <Field label="Reason / Notes"><textarea style={{ ...inputSty, resize: "vertical", minHeight: 70 }} placeholder="Brief justification..." /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={onClose}>Grant Waiver</Btn>
      </div>
    </Modal>
  );
}

function AddReminderModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="New Reminder Campaign">
      <Field label="Campaign Name"><input style={inputSty} placeholder="e.g. Q1 Fee Reminder" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Channel">
          <select style={{ ...inputSty, cursor: "pointer" }}><option>Email</option><option>SMS</option><option>Both</option></select>
        </Field>
        <Field label="Trigger">
          <select style={{ ...inputSty, cursor: "pointer" }}>
            <option>3 days before due</option><option>Due date</option><option>7 days overdue</option><option>Custom</option>
          </select>
        </Field>
      </div>
      <Field label="Target Schools">
        <select style={{ ...inputSty, cursor: "pointer" }}>
          <option>All Schools</option><option>Enterprise only</option><option>Pro only</option><option>Custom</option>
        </select>
      </Field>
      <Field label="Message Template">
        <textarea style={{ ...inputSty, resize: "vertical", minHeight: 80 }} placeholder="Dear {parent_name}, your fee of ₹{amount} is due on {due_date}..." />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={onClose}>Create Campaign</Btn>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",      label: "Overview"          },
  { key: "transactions",  label: "Transactions"      },
  { key: "structures",    label: "Fee Structures"    },
  { key: "waivers",       label: "Waivers & Discounts" },
  { key: "reminders",     label: "Reminders"         },
];

export default function FeeManagement() {
  const [tab, setTab]                 = useState("overview");
  const [loaded, setLoaded]           = useState(false);
  const [showRecordPay, setRecordPay] = useState(false);
  const [showAddFee, setAddFee]       = useState(false);
  const [showAddWaiver, setAddWaiver] = useState(false);
  const [showAddReminder, setAddReminder] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        .fm-root { font-family:'Outfit',sans-serif; }
        .fm-root * { box-sizing:border-box; }
        .fm-root input, .fm-root select, .fm-root textarea, .fm-root button { font-family:'Outfit',sans-serif; }
        .fm-root input:focus, .fm-root select:focus, .fm-root textarea:focus { border-color:rgba(91,140,255,0.4) !important; outline:none; }
        .fm-root tbody tr:hover td { background:rgba(255,255,255,0.015); }
        .fm-root .tab-btn:hover:not(.active-tab) { color:#eef0f8; }
        .fm-btn-ghost:hover { background:#111520 !important; color:#eef0f8 !important; }
        .fm-btn-prim:hover  { filter:brightness(1.08); }
        .fm-school-row:hover td { background:rgba(255,255,255,0.015) !important; color:#eef0f8 !important; }
      `}</style>

      <div className="fm-root" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(10px)", transition: "opacity .35s, transform .35s", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: "#eef0f8", letterSpacing: "-.5px", lineHeight: 1 }}>Fee Management</h1>
            <p style={{ fontSize: 13, color: "#4a5168", marginTop: 5 }}>Platform-wide fee collection, structures, waivers &amp; reminders</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setAddFee(true)}>+ Fee Structure</Btn>
            <Btn variant="primary" onClick={() => setRecordPay(true)}>Record Payment</Btn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, background: "#0c0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? "active-tab" : ""}`}
              onClick={() => setTab(t.key)}
              style={{
                padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: "none", fontFamily: "inherit", transition: "all .15s",
                background: tab === t.key ? "#1e2540" : "none",
                color: tab === t.key ? "#eef0f8" : "#8b93b0",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview"     && <OverviewTab     onRecordPay={() => setRecordPay(true)} />}
        {tab === "transactions" && <TransactionsTab onRecordPay={() => setRecordPay(true)} />}
        {tab === "structures"   && <StructuresTab   onAddFee={() => setAddFee(true)} />}
        {tab === "waivers"      && <WaiversTab      onAddWaiver={() => setAddWaiver(true)} />}
        {tab === "reminders"    && <RemindersTab    onAddReminder={() => setAddReminder(true)} />}
      </div>

      <RecordPaymentModal open={showRecordPay} onClose={() => setRecordPay(false)} />
      <AddFeeModal        open={showAddFee}    onClose={() => setAddFee(false)}    />
      <AddWaiverModal     open={showAddWaiver} onClose={() => setAddWaiver(false)} />
      <AddReminderModal   open={showAddReminder} onClose={() => setAddReminder(false)} />
    </>
  );
}