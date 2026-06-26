// src/pages/parent/ParentDashboard.jsx
//
// APIs used (all PARENT-authorised):
//   GET /attendance/parent/children          → children list + attendance summaries
//   GET /attendance/parent/child/:id         → per-child detailed attendance
//   GET /results/student/:studentId          → per-child exam results (submitted + published)
//   GET /calendar/upcoming?days=30           → school events
//   GET /fees/my-children                    → children fee status (via fee.controller)
//   GET /fees/child-fees?rollNo=&grade=...   → per-child fee record
//
// Auth: cookie-based JWT via authFetch from useAuth hook.
// Falls back gracefully on every API failure.
//
// FIX: All navigate() calls to /attendance and /results now pass
//      state: { grade, section, name } so ChildAttendance resolves
//      the child immediately without a fallback getParentChildren lookup.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  RefreshCw, AlertCircle, X, ChevronRight, BookOpen,
  CalendarDays, TrendingUp, TrendingDown, Minus,
  Users, BarChart3, IndianRupee, ClipboardList,
  Clock, CheckCircle2, XCircle, Award, Flame,
  MapPin, Megaphone,
} from "lucide-react";

// ─── Design tokens (matching MyAttendance / ViewResults palette) ──────────────
const AVATAR_COLORS = [
  { bg: "#dbeafe", text: "#1d4ed8", ring: "#93c5fd" },
  { bg: "#ede9fe", text: "#6d28d9", ring: "#c4b5fd" },
  { bg: "#dcfce7", text: "#15803d", ring: "#86efac" },
  { bg: "#fef3c7", text: "#b45309", ring: "#fcd34d" },
  { bg: "#fce7f3", text: "#be185d", ring: "#f9a8d4" },
  { bg: "#e0f2fe", text: "#0369a1", ring: "#7dd3fc" },
];

const GRADE_META = {
  "A+": { emoji: "🏆", label: "Outstanding",   bg: "#dcfce7", c: "#15803d", bar: "#22c55e" },
  "A":  { emoji: "⭐", label: "Excellent",     bg: "#dbeafe", c: "#1d4ed8", bar: "#3b82f6" },
  "B+": { emoji: "✨", label: "Very Good",     bg: "#ede9fe", c: "#6d28d9", bar: "#8b5cf6" },
  "B":  { emoji: "👍", label: "Good",          bg: "#e0f2fe", c: "#0369a1", bar: "#0ea5e9" },
  "C":  { emoji: "📚", label: "Average",       bg: "#fef3c7", c: "#b45309", bar: "#f59e0b" },
  "D":  { emoji: "⚠️",  label: "Below Average", bg: "#ffedd5", c: "#c2410c", bar: "#f97316" },
  "F":  { emoji: "❌", label: "Fail",          bg: "#fee2e2", c: "#b91c1c", bar: "#ef4444" },
};

const EVT_CFG = {
  exam:     { icon: ClipboardList, color: "#e24b4a", bg: "#fcebeb" },
  holiday:  { icon: CalendarDays,  color: "#0f6e56", bg: "#e1f5ee" },
  event:    { icon: Megaphone,     color: "#185fa5", bg: "#e6f1fb" },
  meeting:  { icon: Users,         color: "#534ab7", bg: "#eeedfe" },
  sports:   { icon: Flame,         color: "#854f0b", bg: "#faeeda" },
  academic: { icon: BookOpen,      color: "#185fa5", bg: "#e6f1fb" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function gradeOf(score, max) {
  if (score == null || isNaN(score)) return null;
  const p = Math.round((Number(score) / Number(max)) * 100);
  if (p >= 90) return { p, g: "A+" };
  if (p >= 80) return { p, g: "A"  };
  if (p >= 70) return { p, g: "B+" };
  if (p >= 60) return { p, g: "B"  };
  if (p >= 50) return { p, g: "C"  };
  if (p >= 35) return { p, g: "D"  };
  return             { p, g: "F"  };
}

function attendColor(pct) {
  if (pct >= 85) return "#15803d";
  if (pct >= 75) return "#b45309";
  return "#b91c1c";
}

function attendBg(pct) {
  if (pct >= 85) return "#dcfce7";
  if (pct >= 75) return "#fef3c7";
  return "#fee2e2";
}

async function apiFetch(authFetch, path) {
  const res = await authFetch(path);
  if (!res) throw new Error("Session expired");
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 60, r = 12, className = "" }) {
  return (
    <div
      className={className}
      style={{
        height: h, borderRadius: r,
        background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

// ─── Radial attendance ring ───────────────────────────────────────────────────
function AttendRing({ pct = 0, size = 56, stroke = 5 }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(100, pct) / 100) * circ;
  const col  = attendColor(pct);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: col, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 80, h = 24 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / rng) * (h - 4)}
        r="3" fill={color} />
    </svg>
  );
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accentColor, accentBg }) {
  return (
    <div style={{
      background: "#fff", border: "0.5px solid #e2e8f0",
      borderRadius: 14, padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: accentBg, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={20} style={{ color: accentColor }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: accentColor, margin: "0 0 1px", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Child Detail Card ────────────────────────────────────────────────────────
// FIX: navigate prop now receives a navState helper so all navigate calls
//      include { state: { grade, section, name } }.
function ChildDetailCard({ child, pal, results, attendance, fees, navigate, attPctFallback }) {
  const att    = attendance?.overall ?? {};
  const attPct = att.percentage ?? attPctFallback ?? (child.attendanceSummary?.percentage ?? 0);

  // ── FIX: helper that always includes navigation state ──────────────────────
  const navTo = (path) =>
    navigate(path, {
      state: { grade: child.grade, section: child.section, name: child.name },
    });

  const latestExamData = useMemo(() => {
    if (!results?.data) return null;
    const examNames = Object.keys(results.data);
    if (!examNames.length) return null;
    const last = examNames[examNames.length - 1];
    return { examName: last, subjects: results.data[last] };
  }, [results]);

  const avgPct = useMemo(() => {
    const sums = results?.examSummaries ?? [];
    if (!sums.length) return null;
    return Math.round(sums.reduce((a, s) => a + (s.pct || 0), 0) / sums.length);
  }, [results]);

  const overallGrade = avgPct != null ? gradeOf(avgPct, 100) : null;
  const gradeMeta = overallGrade ? (GRADE_META[overallGrade.g] || {}) : {};

  const scoreTrend = useMemo(() => {
    const sums = (results?.examSummaries ?? []).map((s) => s.pct || 0);
    return sums.length >= 2 ? sums : null;
  }, [results]);

  const subjects = useMemo(() => {
    if (!latestExamData?.subjects) return [];
    return Object.entries(latestExamData.subjects)
      .map(([name, d]) => ({
        name,
        pct: d?.score != null && d?.max ? Math.round((d.score / d.max) * 100) : null,
        score: d?.score,
        max: d?.max,
      }))
      .filter((s) => s.pct != null)
      .sort((a, b) => b.pct - a.pct);
  }, [latestExamData]);

  const months = useMemo(() => {
    if (!attendance?.records?.length) return [];
    const map = {};
    attendance.records.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { month: d.toLocaleString("en-IN", { month: "short" }), present: 0, total: 0 };
      map[key].total++;
      if (r.status === "present" || r.status === "late") map[key].present++;
    });
    return Object.values(map)
      .map((m) => ({ ...m, pct: m.total ? Math.round((m.present / m.total) * 100) : 0 }))
      .slice(-5);
  }, [attendance]);

  const feeBalance = fees?.summary?.totalBalance ?? child.feesDue ?? null;
  const feePaid    = fees?.summary?.totalPaid    ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Header strip ── */}
      <div style={{
        background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)",
        borderRadius: 16, padding: "20px 22px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: "50%",
          background: pal.bg, border: `2.5px solid ${pal.ring}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: pal.text, fontWeight: 900, fontSize: 18 }}>{initials(child.name)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: "0 0 2px" }}>{child.name}</p>
          <p style={{ color: "#a5b4fc", fontSize: 12, margin: 0 }}>
            {child.grade}{child.section ? `-${child.section}` : ""}
            {child.rollNo ? ` · Roll ${child.rollNo}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* FIX: pass state via navTo helper */}
          <button
            onClick={() => navTo(`/parent/children/${child._id}/attendance`)}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Attendance
          </button>
          <button
            onClick={() => navTo(`/parent/children/${child._id}/results`)}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Results
          </button>
        </div>
      </div>

      {/* ── Quick metrics ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Attendance", value: `${attPct}%`, color: attendColor(attPct), bg: attendBg(attPct) },
          { label: "Avg Score",  value: avgPct != null ? `${avgPct}%` : "—",
            color: overallGrade ? gradeMeta.c : "#94a3b8",
            bg: overallGrade ? gradeMeta.bg : "#f8fafc" },
          { label: "Absent",     value: att.absent ?? (child.attendanceSummary?.absent ?? "—"),
            color: "#b91c1c", bg: "#fee2e2" },
        ].map((m) => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, color: m.color, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>{m.label}</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: m.color, margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Score trend sparkline ── */}
      {scoreTrend && (
        <div style={{ background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: 0 }}>Score Trend</p>
            {overallGrade && (
              <span style={{ background: gradeMeta.bg, color: gradeMeta.c, fontSize: 11, fontWeight: 800, padding: "2px 9px", borderRadius: 6 }}>
                {gradeMeta.emoji} {overallGrade.g}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Sparkline data={scoreTrend} color={pal.text} w={120} h={28} />
            <div style={{ display: "flex", gap: 6 }}>
              {(results?.examSummaries ?? []).map((es) => (
                <div key={es.examName} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: pal.text, margin: 0 }}>{es.pct}%</p>
                  <p style={{ fontSize: 9, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 40, textOverflow: "ellipsis" }}>{es.examName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Latest exam subjects ── */}
      {subjects.length > 0 && (
        <div style={{ background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: 0 }}>
              {latestExamData?.examName ?? "Latest Exam"}
            </p>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{subjects.length} subjects</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subjects.slice(0, 5).map((s) => {
              const g = gradeOf(s.pct, 100);
              const m = g ? (GRADE_META[g.g] || {}) : {};
              return (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  <div style={{ width: 80, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${s.pct}%`, height: "100%", background: m.bar || "#94a3b8", borderRadius: 2, transition: "width 0.8s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.c || "#94a3b8", minWidth: 32, textAlign: "right" }}>{s.pct}%</span>
                  <span style={{ background: (m.bg || "#f1f5f9"), color: (m.c || "#94a3b8"), fontSize: 9.5, fontWeight: 800, padding: "1px 6px", borderRadius: 4, minWidth: 26, textAlign: "center" }}>
                    {g?.g ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Attendance bar chart ── */}
      {months.length > 0 && (
        <div style={{ background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: 0 }}>Monthly Attendance</p>
            <span style={{ background: attendBg(attPct), color: attendColor(attPct), fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>{attPct}% overall</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 50 }}>
            {months.map((m) => (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                  <div style={{ width: "100%", background: `${pal.ring}44`, borderRadius: "3px 3px 0 0", height: `${m.pct}%`, minHeight: 3 }}>
                    <div style={{ width: "100%", height: "100%", background: pal.text, borderRadius: "3px 3px 0 0" }} />
                  </div>
                </div>
                <span style={{ color: "#94a3b8", fontSize: 9, fontWeight: 700 }}>{m.month}</span>
                <span style={{ color: attendColor(m.pct), fontSize: 9.5, fontWeight: 700 }}>{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fee status ── */}
      {(feeBalance !== null || feePaid !== null) && (
        <div style={{
          background: feeBalance > 0 ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${feeBalance > 0 ? "#fecaca" : "#bbf7d0"}`,
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <IndianRupee size={18} style={{ color: feeBalance > 0 ? "#b91c1c" : "#15803d", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: feeBalance > 0 ? "#b91c1c" : "#15803d", margin: "0 0 1px" }}>
              {feeBalance > 0 ? `₹${feeBalance.toLocaleString("en-IN")} due` : "All fees cleared ✓"}
            </p>
            {feePaid != null && <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Paid: ₹{feePaid.toLocaleString("en-IN")}</p>}
          </div>
          <button
            onClick={() => navigate(`/parent/children/${child._id}/fees`)}
            style={{ background: "none", border: `1px solid ${feeBalance > 0 ? "#fca5a5" : "#86efac"}`, borderRadius: 7, padding: "4px 10px", color: feeBalance > 0 ? "#b91c1c" : "#15803d", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            View
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {subjects.length === 0 && months.length === 0 && !scoreTrend && (
        <div style={{ background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 12, padding: "28px 20px", textAlign: "center" }}>
          <BookOpen size={28} style={{ color: "#cbd5e1", marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px", fontWeight: 600 }}>No data yet</p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Data appears once teachers enter marks & attendance.</p>
        </div>
      )}
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ ev, open, onToggle }) {
  const cfg  = EVT_CFG[ev.category] ?? EVT_CFG.event;
  const Icon = cfg.icon;
  return (
    <div
      onClick={onToggle}
      style={{
        background: open ? cfg.bg : "#fff",
        border: `0.5px solid ${open ? cfg.color + "40" : "#e2e8f0"}`,
        borderRadius: 10, padding: "12px 14px",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} style={{ color: cfg.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
            <p style={{ color: "#1e293b", fontSize: 12.5, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</p>
            <span style={{ color: "#94a3b8", fontSize: 10.5, flexShrink: 0 }}>
              {new Date(ev.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
          {open && ev.description && (
            <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0", lineHeight: 1.5 }}>{ev.description}</p>
          )}
          {open && ev.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <MapPin size={11} style={{ color: "#94a3b8" }} />
              <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>{ev.location}</p>
            </div>
          )}
          {!open && (
            <span style={{ display: "inline-block", background: cfg.color + "18", color: cfg.color, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, marginTop: 3, textTransform: "capitalize" }}>
              {ev.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ParentDashboard() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [children,     setChildren]     = useState([]);
  const [resultsMap,   setResultsMap]   = useState({});
  const [attendMap,    setAttendMap]    = useState({});
  const [feesMap,      setFeesMap]      = useState({});
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [childLoading, setChildLoading] = useState({});
  const [errors,       setErrors]       = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [activeEvt,    setActiveEvt]    = useState(-1);
  const [refreshKey,   setRefreshKey]   = useState(0);

  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const pushError   = (msg) => setErrors((e) => [...e, msg]);
  const removeError = (i)   => setErrors((e) => e.filter((_, idx) => idx !== i));

  // ── FIX: navigation helper that always carries child state ────────────────
  const navToChild = useCallback((child, path) => {
    navigate(path, {
      state: {
        grade:   child.grade,
        section: child.section,
        name:    child.name,
      },
    });
  }, [navigate]);

  // ── Fetch per-child results + attendance + fees ───────────────────────────
  const fetchChildData = useCallback(async (child, fetch, force = false) => {
    const id = child._id;
    if (!force && resultsMap[id] !== undefined && attendMap[id] !== undefined && feesMap[id] !== undefined) return;

    setChildLoading((p) => ({ ...p, [id]: true }));

    const [resData, attData, feeData] = await Promise.all([
      apiFetch(fetch, `/results/student/${id}`).catch(() => null),
      apiFetch(fetch, `/attendance/parent/child/${id}`).catch(() => null),
      apiFetch(fetch, `/fees/child-fees?grade=${encodeURIComponent(child.grade)}&section=${encodeURIComponent(child.section || "")}&rollNo=${encodeURIComponent(child.rollNo || "")}`)
        .catch(() => null),
    ]);

    setResultsMap((p) => ({ ...p, [id]: resData ?? null }));
    setAttendMap((p)  => ({ ...p, [id]: attData?.data  ?? null }));
    setFeesMap((p)    => ({ ...p, [id]: feeData        ?? null }));
    setChildLoading((p) => ({ ...p, [id]: false }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setErrors([]);
    setResultsMap({});
    setAttendMap({});
    setFeesMap({});

    const fetch = authFetchRef.current;

    Promise.all([
      apiFetch(fetch, "/attendance/parent/children").catch((e) => {
        pushError(`Could not load children: ${e.message}`);
        return { data: [] };
      }),
      apiFetch(fetch, "/calendar/upcoming?days=30").catch(() => ({ events: [] })),
      apiFetch(fetch, "/fees/my-children").catch(() => ({ data: [] })),
    ])
      .then(([childRes, evtRes, feeChildRes]) => {
        const kids        = childRes.data   ?? [];
        const feeChildren = feeChildRes.data ?? [];

        const feeById = {};
        feeChildren.forEach((fc) => { feeById[fc._id?.toString()] = fc; });

        const mergedKids = kids.map((k) => {
          const fi = feeById[k._id?.toString()];
          return {
            ...k,
            feesDue: fi?.balance ?? fi?.totalBalance ?? k.feesDue ?? 0,
          };
        });

        setChildren(mergedKids);
        setEvents(evtRes.events ?? []);
        if (mergedKids.length) setSelected(mergedKids[0]._id);

        mergedKids.forEach((child) => {
          fetchChildData(child, fetch, true);
        });
      })
      .finally(() => setLoading(false));
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── On-demand fetch when child selected ──────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    const child = children.find((c) => c._id === selected);
    if (!child) return;
    if (resultsMap[selected] !== undefined && attendMap[selected] !== undefined) return;
    fetchChildData(child, authFetchRef.current, false);
  }, [selected, children]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = user?.name?.split(" ")[0] || "Parent";

  const getAttPct = (child) => {
    const real = attendMap[child._id]?.overall?.percentage;
    if (real != null) return real;
    return child.attendanceSummary?.percentage ?? 0;
  };

  const avgAttendance = useMemo(() => {
    if (!children.length) return 0;
    return Math.round(children.reduce((a, c) => a + getAttPct(c), 0) / children.length);
  }, [children, attendMap]);

  const avgScore = useMemo(() => {
    const vals = children.map((c) => {
      const sums = resultsMap[c._id]?.examSummaries ?? [];
      if (!sums.length) return null;
      const total = sums.reduce((a, s) => a + (s.pct || 0), 0);
      return Math.round(total / sums.length);
    }).filter((v) => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }, [children, resultsMap]);

  const totalFeesDue = useMemo(() =>
    children.reduce((a, c) => a + (c.feesDue ?? 0), 0), [children]);

  const selectedChild = children.find((c) => c._id === selected);
  const selectedPal   = selectedChild
    ? AVATAR_COLORS[children.findIndex((c) => c._id === selected) % AVATAR_COLORS.length]
    : AVATAR_COLORS[0];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "28px 28px 48px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Lato', 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .pd-fu { animation: fadeUp 0.35s ease both }
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
      `}</style>

      {/* ── Greeting ── */}
      <div className="pd-fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
        <div>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 3px" }}>{greeting},</p>
          <h1 style={{ color: "#0f172a", fontSize: 26, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {userName}
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            {children.length > 0 ? `Monitoring ${children.length} child${children.length > 1 ? "ren" : ""} · ` : ""}
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#fff", border: "0.5px solid #e2e8f0",
            borderRadius: 10, padding: "9px 16px",
            color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={loading ? { animation: "spin 0.75s linear infinite" } : {}} />
          Refresh
        </button>
      </div>

      {/* ── Errors ── */}
      {errors.map((err, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fef2f2", border: "0.5px solid #fecaca",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#b91c1c",
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{err}</span>
          <button onClick={() => removeError(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c" }}>
            <X size={14} />
          </button>
        </div>
      ))}

      {/* ── Summary stats ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 26 }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h={82} />)}
        </div>
      ) : (
        <div className="pd-fu" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 26 }}>
          <StatCard icon={Users}        label="Children"       value={children.length}
            sub="Enrolled"                        accentColor="#1d4ed8" accentBg="#dbeafe" />
          <StatCard icon={ClipboardList} label="Avg Attendance" value={`${avgAttendance}%`}
            sub="Across all children"             accentColor="#15803d" accentBg="#dcfce7" />
          <StatCard icon={BarChart3}    label="Avg Score"      value={avgScore != null ? `${avgScore}%` : "—"}
            sub="Latest exam results"             accentColor="#b45309" accentBg="#fef3c7" />
          <StatCard icon={IndianRupee} label="Fees Status"
            value={totalFeesDue > 0 ? `₹${totalFeesDue.toLocaleString("en-IN")}` : "Clear"}
            sub={totalFeesDue > 0 ? "Pending payment" : "All fees paid ✓"}
            accentColor={totalFeesDue > 0 ? "#b91c1c" : "#15803d"}
            accentBg={totalFeesDue > 0 ? "#fee2e2" : "#dcfce7"} />
        </div>
      )}

      {/* ── No children ── */}
      {!loading && children.length === 0 && errors.length === 0 && (
        <div style={{ background: "#fff", border: "1px dashed #e2e8f0", borderRadius: 16, padding: "56px 24px", textAlign: "center" }}>
          <Users size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: "#374151", margin: "0 0 6px" }}>No children linked yet</p>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Ask your school admin to link your children to your account.</p>
        </div>
      )}

      {/* ── Main grid ── */}
      {!loading && children.length > 0 && (
        <div className="pd-fu" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 22, marginBottom: 24 }}>

          {/* Left: child selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>My Children</p>

            {children.map((child, idx) => {
              const pal      = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const att      = getAttPct(child);
              const sums     = resultsMap[child._id]?.examSummaries ?? [];
              const allPcts  = sums.map((s) => s.pct || 0);
              const lastPct  = allPcts.length
                ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length)
                : null;
              const isLoadingChild = childLoading[child._id];

              return (
                <div
                  key={child._id}
                  onClick={() => setSelected(child._id)}
                  style={{
                    background: "#fff",
                    border: `1.5px solid ${selected === child._id ? pal.ring : "#e2e8f0"}`,
                    borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: selected === child._id ? `0 4px 16px ${pal.ring}50` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: pal.bg, border: `2px solid ${pal.ring}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: pal.text, fontWeight: 900, fontSize: 15 }}>{initials(child.name)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#0f172a", fontSize: 14, fontWeight: 800, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{child.name}</p>
                      <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>
                        {child.grade}{child.section ? `-${child.section}` : ""}
                        {child.rollNo ? ` · Roll ${child.rollNo}` : ""}
                      </p>
                    </div>
                    {(child.feesDue ?? 0) > 0
                      ? <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5 }}>DUE</span>
                      : <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5 }}>PAID</span>}
                  </div>

                  {/* Mini metrics */}
                  {isLoadingChild ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {[0,1].map(i => (
                        <div key={i} style={{ height: 52, borderRadius: 8, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: attendBg(att), borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                        <p style={{ fontSize: 9, color: attendColor(att), fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>Attendance</p>
                        <p style={{ fontSize: 16, fontWeight: 900, color: attendColor(att), margin: 0 }}>{att}%</p>
                      </div>
                      {(() => {
                        const g = lastPct != null ? gradeOf(lastPct, 100) : null;
                        const m = g ? (GRADE_META[g.g] || {}) : {};
                        return (
                          <div style={{ background: g ? (m.bg ?? "#f8fafc") : "#f8fafc", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                            <p style={{ fontSize: 9, color: g ? m.c : "#94a3b8", fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>Avg Score</p>
                            <p style={{ fontSize: 16, fontWeight: 900, color: g ? m.c : "#94a3b8", margin: 0 }}>
                              {lastPct != null ? `${lastPct}%` : "—"}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* FIX: action row — both buttons pass navigation state */}
                  <div style={{ display: "flex", gap: 7, borderTop: "0.5px solid #f1f5f9", paddingTop: 10 }}>
                    {[
                      { label: "Attendance", path: `/parent/children/${child._id}/attendance` },
                      { label: "Results",    path: `/parent/children/${child._id}/results`    },
                    ].map((a) => (
                      <button key={a.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          navToChild(child, a.path); // ← FIX: was navigate(a.path)
                        }}
                        style={{ flex: 1, background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: 7, padding: "5px 4px", color: "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = pal.bg; e.currentTarget.style.color = pal.text; e.currentTarget.style.borderColor = pal.ring; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: selected child detail */}
          <div>
            {selectedChild && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                    {selectedChild.name.split(" ")[0]}'s Overview
                  </p>
                  {children.length > 1 && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {children.map((c, idx) => {
                        const pal = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const isSel = selected === c._id;
                        return (
                          <button key={c._id} onClick={() => setSelected(c._id)}
                            style={{
                              background: isSel ? pal.bg : "#fff",
                              border: `1px solid ${isSel ? pal.ring : "#e2e8f0"}`,
                              borderRadius: 7, padding: "4px 11px",
                              color: isSel ? pal.text : "#94a3b8",
                              fontSize: 12, fontWeight: 700, cursor: "pointer",
                            }}>
                            {c.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {childLoading[selected] ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Skel h={100} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                      {[...Array(3)].map((_, i) => <Skel key={i} h={60} />)}
                    </div>
                    <Skel h={130} />
                    <Skel h={100} />
                  </div>
                ) : (
                  <ChildDetailCard
                    child={selectedChild}
                    pal={selectedPal}
                    results={resultsMap[selected]}
                    attendance={attendMap[selected]}
                    fees={feesMap[selected]}
                    navigate={navigate}
                    attPctFallback={selectedChild?.attendanceSummary?.percentage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Events & Announcements ── */}
      {!loading && (
        <div style={{ background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Megaphone size={16} style={{ color: "#4338ca" }} />
              <h2 style={{ color: "#0f172a", fontSize: 14, fontWeight: 800, margin: 0 }}>School Events & Announcements</h2>
            </div>
            {events.length > 0 && (
              <span style={{ background: "#ede9fe", color: "#6d28d9", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
                {events.length} upcoming
              </span>
            )}
          </div>

          {events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CalendarDays size={32} style={{ color: "#cbd5e1", marginBottom: 8 }} />
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No upcoming school events</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
              {events.slice(0, 8).map((ev, i) => (
                <EventCard
                  key={ev._id ?? i}
                  ev={ev}
                  open={activeEvt === i}
                  onToggle={() => setActiveEvt(activeEvt === i ? -1 : i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}