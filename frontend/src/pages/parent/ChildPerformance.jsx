// src/pages/parent/ChildPerformance.jsx
// Route: /parent/children/:childId/performance
//
// APIs used (all PARENT-authorised):
//   GET /attendance/parent/children                   → resolve child + grade/section
//   GET /attendance/parent/child/:id?month=&year=     → attendance records
//   GET /results/student/:studentId                   → exam results + subject breakdown
//
// All hardcoded CHILDREN_DATA removed — every metric comes from live APIs.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, AlertCircle, BookOpen, TrendingUp,
  TrendingDown, Minus, Trophy, Target, BarChart3, Award,
  CheckCircle2, XCircle, Flame, Sparkles, ChevronDown, Clock,
  Shield, Calendar, User, Hash,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg:       "#faf9f7",
  surface:  "#ffffff",
  s2:       "#f5f2ee",
  s3:       "#ede9e3",
  border:   "#ede9e3",
  text1:    "#1a1612",
  text2:    "#6b6057",
  text3:    "#a89d93",
  accent:   "#c96b2e",
  accentL:  "#f4ede6",
  accentBg: "#c96b2e12",
  green:    "#2d7d4a",
  greenL:   "#e8f5ed",
  greenBg:  "#2d7d4a0e",
  rose:     "#c0392b",
  roseL:    "#fdecea",
  roseBg:   "#c0392b0e",
  amber:    "#b8640a",
  amberL:   "#fef3e2",
  amberBg:  "#b8640a0e",
  blue:     "#1d5fa6",
  blueL:    "#e8f0fb",
  blueBg:   "#1d5fa60e",
  violet:   "#5b3fa6",
  violetL:  "#eeebfb",
  violetBg: "#5b3fa60e",
};

// ─── Grade helpers ─────────────────────────────────────────────────────────
const GRADE_META = {
  "A+": { emoji: "🏆", label: "Outstanding",   bg: "#dcfce7", c: "#15803d", bar: "#22c55e" },
  "A":  { emoji: "⭐", label: "Excellent",     bg: "#dbeafe", c: "#1d4ed8", bar: "#3b82f6" },
  "B+": { emoji: "✨", label: "Very Good",     bg: "#ede9fe", c: "#6d28d9", bar: "#8b5cf6" },
  "B":  { emoji: "👍", label: "Good",          bg: "#e0f2fe", c: "#0369a1", bar: "#0ea5e9" },
  "C":  { emoji: "📚", label: "Average",       bg: "#fef3c7", c: "#b45309", bar: "#f59e0b" },
  "D":  { emoji: "⚠️", label: "Below Average", bg: "#ffedd5", c: "#c2410c", bar: "#f97316" },
  "F":  { emoji: "❌", label: "Fail",          bg: "#fee2e2", c: "#b91c1c", bar: "#ef4444" },
};

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

function scoreColor(s) {
  if (s >= 85) return C.green;
  if (s >= 70) return C.amber;
  return C.rose;
}
function attendColor(a) {
  if (a >= 90) return C.green;
  if (a >= 75) return C.amber;
  return C.rose;
}
const isObjectId = (s) => /^[a-f\d]{24}$/i.test(String(s ?? ""));

const deriveClassSection = (child) => {
  if (!child) return "";
  if (child.classSection?.trim()) return child.classSection.trim();
  const grade   = (child.grade   || child.class || "").trim();
  const section = (child.section || "").trim();
  if (grade && section) return `${grade}-${section}`;
  return grade;
};

// ─── API fetch wrapper ──────────────────────────────────────────────────────
async function apiFetch(authFetch, path) {
  const res = await authFetch(path);
  if (!res) throw new Error("Session expired");
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function Skel({ h = 60, r = 12 }) {
  return (
    <div style={{
      height: h, borderRadius: r,
      background: "linear-gradient(90deg,#f5f2ee 25%,#ede9e3 50%,#f5f2ee 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

// ─── Radial Ring ───────────────────────────────────────────────────────────
function Radial({ value, color, size = 80, stroke = 7, label, sublabel }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.s3} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {label    && <span style={{ color, fontSize: size > 72 ? 15 : 12, fontWeight: 900, lineHeight: 1 }}>{label}</span>}
        {sublabel && <span style={{ color: C.text3, fontSize: 10, marginTop: 2 }}>{sublabel}</span>}
      </div>
    </div>
  );
}

// ─── Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 120, h = 40 }) {
  if (!data || data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 4 - ((v - mn) / rng) * (h - 8)}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const id = `sp${color.replace(/[^a-z]/gi, "")}${w}`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={h - 4 - ((data[data.length - 1] - mn) / rng) * (h - 8)} r="3.5" fill={color} />
    </svg>
  );
}

// ─── HBar ──────────────────────────────────────────────────────────────────
function HBar({ value, color, height = 5 }) {
  return (
    <div style={{ width: "100%", height, background: C.s3, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, value || 0)}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 1.2s ease" }} />
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>{children}</h3>;
}

// ─── Tab Button ────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children, color }) {
  return (
    <button onClick={onClick} style={{
      background: active ? color + "18" : "transparent",
      border: `1px solid ${active ? color + "45" : "transparent"}`,
      borderRadius: 9, padding: "8px 16px",
      color: active ? color : C.text3,
      fontSize: 12.5, fontWeight: 700, cursor: "pointer",
      transition: "all 0.14s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ─── TrendChip ─────────────────────────────────────────────────────────────
function TrendChip({ diff }) {
  if (diff == null) return null;
  const isUp = diff > 0, isDown = diff < 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: isUp ? C.greenBg : isDown ? C.roseBg : C.s2,
      color:      isUp ? C.green   : isDown ? C.rose   : C.text3,
    }}>
      {isUp ? "↑" : isDown ? "↓" : "→"} {isUp ? `+${diff}` : diff}%
    </span>
  );
}

// ─── Grade Pill ────────────────────────────────────────────────────────────
function GradePill({ g }) {
  const meta = GRADE_META[g] || {};
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: meta.bg || C.s2, color: meta.c || C.text2 }}>
      {meta.emoji} {g}
    </span>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function ChildPerformance() {
  const { childId }   = useParams();
  const navigate      = useNavigate();
  const { state }     = useLocation();
  const { authFetch } = useAuth();

  const [tab, setTab]             = useState("overview");
  const [selSubject, setSelSub]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Resolved data
  const [childInfo,   setChildInfo]   = useState(null);
  const [results,     setResults]     = useState(null);   // { data: {examName: {subject: {score,max}}}, examSummaries: [] }
  const [attendance,  setAttendance]  = useState(null);   // { overall: {}, records: [] }

  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  // ── Resolve child + fetch all data ────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetch = authFetchRef.current;

      // Step 1 — resolve child
      const childRes = await apiFetch(fetch, "/attendance/parent/children");
      const list = childRes?.data ?? [];

      let found = null;
      if (isObjectId(childId)) {
        found = list.find((c) => String(c._id) === String(childId))
             || list.find((c) => String(c.userId) === String(childId));
      }
      if (!found) {
        const numId = Number(childId);
        if (!isNaN(numId)) found = list.find((c) => Number(c.rollNo) === numId);
      }
      if (!found) found = list.find((c) => String(c.rollNo) === String(childId));
      if (!found && list.length === 1) found = list[0];
      if (!found) {
        // Use nav state as last resort
        if (state?.grade && state?.name) {
          found = { _id: childId, grade: state.grade, section: state.section, name: state.name, rollNo: childId };
        } else {
          throw new Error("Student not found. Please go back and select the child again.");
        }
      }

      setChildInfo(found);
      const realId = String(found._id || childId);

      // Step 2 — fetch results + attendance in parallel
      const [resData, attData] = await Promise.all([
        apiFetch(fetch, `/results/student/${realId}`).catch(() => null),
        apiFetch(fetch, `/attendance/parent/child/${realId}`).catch(() => null),
      ]);

      setResults(resData  ?? null);
      setAttendance(attData?.data ?? attData ?? null);
    } catch (err) {
      setError(err.message || "Failed to load performance data.");
    } finally {
      setLoading(false);
    }
  }, [childId, state, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Derived from live data ────────────────────────────────────────────────

  // ── Exam list & subject data
  const examSummaries = results?.examSummaries ?? [];
  const allData       = results?.data ?? {};
  const examNames     = Object.keys(allData);

  // Latest exam
  const latestExamName = examSummaries.length
    ? examSummaries[examSummaries.length - 1].examName
    : examNames[examNames.length - 1] ?? null;

  const latestExamData = latestExamName ? (allData[latestExamName] ?? {}) : {};

  // Subjects from latest exam
  const subjects = useMemo(() => {
    return Object.entries(latestExamData)
      .map(([name, d]) => ({
        name,
        score: d?.score ?? null,
        max:   d?.max   ?? 100,
        pct:   d?.score != null ? Math.round((d.score / (d.max || 100)) * 100) : null,
      }))
      .filter((s) => s.pct != null);
  }, [latestExamData]);

  // Per-exam averages for trend sparkline
  const scoreTrend = useMemo(() => {
    return examSummaries.map((s) => s.pct || 0);
  }, [examSummaries]);

  // Overall average across all exams
  const avgPct = useMemo(() => {
    if (!examSummaries.length) return null;
    return Math.round(examSummaries.reduce((a, s) => a + (s.pct || 0), 0) / examSummaries.length);
  }, [examSummaries]);

  const overallGrade = avgPct != null ? gradeOf(avgPct, 100) : null;
  const gradeMeta    = overallGrade ? (GRADE_META[overallGrade.g] || {}) : {};

  // Trend vs first exam
  const overallTrend = useMemo(() => {
    if (examSummaries.length < 2) return null;
    return (examSummaries[examSummaries.length - 1]?.pct ?? 0) - (examSummaries[0]?.pct ?? 0);
  }, [examSummaries]);

  // Best & worst subjects
  const { bestSub, worstSub } = useMemo(() => {
    if (!subjects.length) return {};
    const sorted = [...subjects].sort((a, b) => b.pct - a.pct);
    return { bestSub: sorted[0], worstSub: sorted[sorted.length - 1] };
  }, [subjects]);

  // Attendance
  const attOverall = attendance?.overall ?? {};
  const attPct     = attOverall.percentage ?? 0;
  const attRecords = attendance?.records   ?? [];

  // Monthly attendance breakdown
  const monthlyAtt = useMemo(() => {
    const map = {};
    attRecords.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map[key]) map[key] = { label: d.toLocaleString("en-IN", { month: "short" }), present: 0, total: 0 };
      map[key].total++;
      if (r.status === "present" || r.status === "late") map[key].present++;
    });
    return Object.values(map).map((m) => ({ ...m, pct: m.total ? Math.round((m.present / m.total) * 100) : 0 }));
  }, [attRecords]);

  const displayName    = childInfo?.name    || state?.name    || `Student`;
  const classSection   = deriveClassSection(childInfo);
  const rollNo         = childInfo?.rollNo  || childInfo?.rollNumber || "";
  const initials       = displayName.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const color          = C.blue; // primary accent for this child

  const tabs = [
    { key: "overview",   label: "Overview"       },
    { key: "subjects",   label: "Subjects"       },
    { key: "attendance", label: "Attendance"     },
    { key: "exams",      label: "Exam Progress"  },
  ];

  // ── Render helpers ────────────────────────────────────────────────────────
  const hasResults    = examNames.length > 0;
  const hasAttendance = attOverall.total > 0 || attRecords.length > 0;

  // ── TABS ─────────────────────────────────────────────────────────────────

  // Overview tab
  const OverviewTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Hero metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { l: "Avg Score",   v: avgPct  != null ? `${avgPct}%`  : "—", col: overallGrade ? gradeMeta.c : C.text3,    bg: overallGrade ? gradeMeta.bg : C.s2 },
          { l: "Attendance",  v: `${attPct}%`,                            col: attendColor(attPct),                    bg: attendColor(attPct) + "15"          },
          { l: "Absent Days", v: attOverall.absent  ?? "—",               col: C.rose,                                 bg: C.roseBg                            },
          { l: "Exams Taken", v: examSummaries.length || "—",             col: color,                                  bg: C.blueBg                            },
        ].map((m) => (
          <div key={m.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{m.l}</p>
            <p style={{ color: m.col, fontSize: 22, fontWeight: 900, margin: 0 }}>{m.v}</p>
          </div>
        ))}
      </div>

      {/* Score ring + trend */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16 }}>
        <Card style={{ display: "flex", gap: 24, alignItems: "center", padding: "22px 28px" }}>
          <Radial value={avgPct || 0} color={color} size={88} stroke={8} label={avgPct != null ? `${avgPct}%` : "—"} sublabel="Average" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { l: "Grade",         v: overallGrade ? `${gradeMeta.emoji} ${overallGrade.g}` : "—", col: gradeMeta.c || C.text2 },
              { l: "Best Subject",  v: bestSub?.name  || "—",  col: C.green  },
              { l: "Needs Focus",   v: worstSub?.name || "—",  col: C.rose   },
              { l: "Overall Trend", v: overallTrend != null ? (overallTrend > 0 ? `+${overallTrend}%` : `${overallTrend}%`) : "—",
                col: overallTrend > 0 ? C.green : overallTrend < 0 ? C.rose : C.text3 },
            ].map((r) => (
              <div key={r.l}>
                <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>{r.l}</p>
                <p style={{ color: r.col, fontSize: 13, fontWeight: 800, margin: 0 }}>{r.v}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <SectionTitle>Score Trend Across Exams</SectionTitle>
          {scoreTrend.length >= 2
            ? <>
                <Sparkline data={scoreTrend} color={color} w="100%" h={80} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ color: C.text3, fontSize: 11 }}>{examSummaries[0]?.examName}</span>
                  <span style={{ color: color, fontSize: 13, fontWeight: 800 }}>
                    Now: {examSummaries[examSummaries.length - 1]?.pct ?? 0}%
                  </span>
                </div>
              </>
            : <p style={{ color: C.text3, fontSize: 12, textAlign: "center", padding: "24px 0" }}>Not enough exams to show a trend yet.</p>
          }
        </Card>
      </div>

      {/* Subject snapshot */}
      {subjects.length > 0 && (
        <Card>
          <SectionTitle>Subjects at a Glance — {latestExamName}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {subjects.map((s) => {
              const g = gradeOf(s.pct, 100);
              const m = g ? (GRADE_META[g.g] || {}) : {};
              return (
                <div key={s.name}
                  onClick={() => { setSelSub(s.name); setTab("subjects"); }}
                  style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", background: C.s2, borderRadius: 11, cursor: "pointer", border: `1px solid ${C.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: (m.bar || C.text3) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: m.bar || C.text3, flexShrink: 0 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ color: C.text1, fontSize: 12, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                      {g && <GradePill g={g.g} />}
                    </div>
                    <HBar value={s.pct || 0} color={m.bar || C.text3} height={4} />
                    <p style={{ color: m.c || C.text3, fontSize: 11, fontWeight: 700, margin: "3px 0 0", textAlign: "right" }}>{s.pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Attendance summary */}
      {hasAttendance && (
        <Card>
          <SectionTitle>Attendance Summary</SectionTitle>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Radial value={attPct} color={attendColor(attPct)} size={76} stroke={7} label={`${attPct}%`} sublabel="Attend." />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { l: "Present", v: attOverall.present ?? "—", col: C.green },
                { l: "Absent",  v: attOverall.absent  ?? "—", col: C.rose  },
                { l: "Late",    v: attOverall.late    ?? "—", col: C.amber },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.text3, fontSize: 12, minWidth: 50 }}>{r.l}</span>
                  <div style={{ flex: 1, height: 6, background: C.s3, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${attOverall.total ? ((r.v / attOverall.total) * 100) : 0}%`, height: "100%", background: r.col, borderRadius: 3, transition: "width 1s ease" }} />
                  </div>
                  <span style={{ color: r.col, fontSize: 12, fontWeight: 800, minWidth: 24, textAlign: "right" }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: attPct >= 75 ? C.greenBg : C.roseBg, border: `1px solid ${(attPct >= 75 ? C.green : C.rose) + "30"}`, borderRadius: 10, padding: "12px 16px", textAlign: "center", flexShrink: 0 }}>
              <Shield size={18} style={{ color: attPct >= 75 ? C.green : C.rose, marginBottom: 4, display: "block", margin: "0 auto 4px" }} />
              <p style={{ color: attPct >= 75 ? C.green : C.rose, fontSize: 11, fontWeight: 800, margin: 0 }}>
                {attPct >= 75 ? "Eligible ✓" : "At Risk ⚠️"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {!hasResults && !hasAttendance && (
        <Card style={{ textAlign: "center", padding: "48px 24px" }}>
          <BookOpen size={40} style={{ color: C.s3, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          <p style={{ color: C.text2, fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>No academic data yet</p>
          <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>Results and attendance will appear here once teachers record them.</p>
        </Card>
      )}
    </div>
  );

  // Subjects tab
  const SubjectsTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
      {/* Subject list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {subjects.length === 0 && (
          <p style={{ color: C.text3, fontSize: 12, textAlign: "center", padding: "24px 0" }}>No subject data available.</p>
        )}
        {subjects.map((s) => {
          const g = gradeOf(s.pct, 100);
          const m = g ? (GRADE_META[g.g] || {}) : {};
          const isSel = selSubject === s.name;
          return (
            <div key={s.name} onClick={() => setSelSub(isSel ? null : s.name)}
              style={{ padding: "14px 16px", background: C.surface, border: `1.5px solid ${isSel ? color : C.border}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s", boxShadow: isSel ? `0 2px 12px ${color}18` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{s.name}</p>
                {g && <GradePill g={g.g} />}
              </div>
              <HBar value={s.pct || 0} color={m.bar || C.text3} height={4} />
              <p style={{ color: m.c || C.text3, fontSize: 14, fontWeight: 900, margin: "6px 0 0", textAlign: "right" }}>{s.pct}%</p>
            </div>
          );
        })}
      </div>

      {/* Subject deep-dive */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(selSubject ? subjects.filter((s) => s.name === selSubject) : subjects).map((s) => {
          const g = gradeOf(s.pct, 100);
          const m = g ? (GRADE_META[g.g] || {}) : {};

          // Per-exam scores for this subject
          const examScores = examNames.map((en) => {
            const d = allData[en]?.[s.name];
            return { exam: en, score: d?.score ?? null, max: d?.max ?? 100, pct: d?.score != null ? Math.round((d.score / (d.max || 100)) * 100) : null };
          }).filter((e) => e.pct != null);

          const trend = examScores.length >= 2 ? examScores[examScores.length-1].pct - examScores[0].pct : null;

          return (
            <Card key={s.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <p style={{ color: C.text1, fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>{s.name}</p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {g && <GradePill g={g.g} />}
                    {trend != null && <TrendChip diff={trend} />}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: m.c || C.text2, fontSize: 28, fontWeight: 900, margin: "0 0 2px", lineHeight: 1 }}>{s.pct}%</p>
                  <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{s.score}/{s.max}</p>
                </div>
              </div>
              <HBar value={s.pct || 0} color={m.bar || C.text3} height={8} />

              {examScores.length > 1 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 10px" }}>Exam History</p>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 60 }}>
                    {examScores.map((e, i) => (
                      <div key={e.exam} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                        <span style={{ color: scoreColor(e.pct), fontSize: 10.5, fontWeight: 700 }}>{e.pct}%</span>
                        <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                          <div style={{ width: "100%", background: i === examScores.length - 1 ? (m.bar || color) : (m.bar || color) + "55", borderRadius: "4px 4px 0 0", height: `${e.pct}%`, minHeight: 4, transition: "height 0.8s ease" }} />
                        </div>
                        <span style={{ color: C.text3, fontSize: 9, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 42, textAlign: "center" }}>
                          {e.exam.replace(/term\s*/i, "T").replace(/unit\s*test\s*/i, "UT")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {subjects.length === 0 && (
          <Card style={{ textAlign: "center", padding: "48px 24px" }}>
            <BookOpen size={32} style={{ color: C.s3, margin: "0 auto 10px", display: "block" }} />
            <p style={{ color: C.text2, fontSize: 13, fontWeight: 600, margin: 0 }}>No subject results available yet.</p>
          </Card>
        )}
      </div>
    </div>
  );

  // Attendance tab
  const AttendanceTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { l: "Overall",  v: `${attPct}%`,              col: attendColor(attPct)   },
          { l: "Present",  v: attOverall.present ?? "—", col: C.green               },
          { l: "Absent",   v: attOverall.absent  ?? "—", col: C.rose                },
          { l: "Sessions", v: attOverall.total   ?? "—", col: C.text1               },
        ].map((m) => (
          <div key={m.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>{m.l}</p>
            <p style={{ color: m.col, fontSize: 22, fontWeight: 900, margin: 0 }}>{m.v}</p>
          </div>
        ))}
      </div>

      {/* Attendance compliance */}
      <div style={{ background: attPct >= 75 ? C.greenBg : C.roseBg, border: `1px solid ${(attPct >= 75 ? C.green : C.rose) + "30"}`, borderRadius: 14, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center" }}>
        <Shield size={22} style={{ color: attPct >= 75 ? C.green : C.rose, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ color: attPct >= 75 ? C.green : C.rose, fontSize: 13, fontWeight: 800, margin: "0 0 4px" }}>
            {attPct >= 75 ? "Attendance requirement met ✓" : "⚠️ Below minimum attendance"}
          </p>
          <p style={{ color: C.text2, fontSize: 12, margin: 0 }}>
            {attPct >= 75
              ? `${displayName.split(" ")[0]} is at ${attPct}% — above the 75% minimum required.`
              : `Current: ${attPct}%. Must reach 75% to remain eligible for exams.`}
          </p>
          <div style={{ marginTop: 8, height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(attPct, 100)}%`, height: "100%", background: attPct >= 75 ? C.green : C.rose, borderRadius: 3 }} />
          </div>
        </div>
        <span style={{ color: attPct >= 75 ? C.green : C.rose, fontSize: 22, fontWeight: 900 }}>{attPct}%</span>
      </div>

      {/* Monthly bar chart */}
      {monthlyAtt.length > 0 && (
        <Card>
          <SectionTitle>Monthly Attendance</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {monthlyAtt.map((m) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: C.text3, fontSize: 11.5, fontWeight: 700, minWidth: 28 }}>{m.label}</span>
                <div style={{ flex: 1, height: 8, background: C.s3, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${m.pct}%`, height: "100%", background: attendColor(m.pct), borderRadius: 4, transition: "width 1s ease" }} />
                </div>
                <span style={{ color: attendColor(m.pct), fontSize: 11.5, fontWeight: 800, minWidth: 36, textAlign: "right" }}>{m.pct}%</span>
                <span style={{ color: C.text3, fontSize: 10.5, minWidth: 52 }}>{m.present}/{m.total}d</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!hasAttendance && (
        <Card style={{ textAlign: "center", padding: "48px 24px" }}>
          <Calendar size={32} style={{ color: C.s3, margin: "0 auto 10px", display: "block" }} />
          <p style={{ color: C.text2, fontSize: 13, margin: 0 }}>No attendance records found.</p>
        </Card>
      )}
    </div>
  );

  // Exam progress tab
  const ExamsTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {examSummaries.length === 0 && (
        <Card style={{ textAlign: "center", padding: "48px 24px" }}>
          <BarChart3 size={32} style={{ color: C.s3, margin: "0 auto 10px", display: "block" }} />
          <p style={{ color: C.text2, fontSize: 13, margin: 0 }}>No exam results recorded yet.</p>
        </Card>
      )}

      {examSummaries.length > 0 && (
        <>
          <Card>
            <SectionTitle>All Exams — Score Overview</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[...examSummaries]
                .sort((a, b) => examNames.indexOf(a.examName) - examNames.indexOf(b.examName))
                .map((es) => {
                  const g = gradeOf(es.pct || 0, 100);
                  const m = g ? (GRADE_META[g.g] || {}) : {};
                  return (
                    <div key={es.examName} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ color: C.text2, fontSize: 12.5, fontWeight: 700, minWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{es.examName}</span>
                      <div style={{ flex: 1 }}>
                        <HBar value={es.pct || 0} color={m.bar || color} height={8} />
                      </div>
                      <span style={{ color: m.c || C.text2, fontSize: 14, fontWeight: 900, minWidth: 40, textAlign: "right" }}>{es.pct ?? 0}%</span>
                      {g && <GradePill g={g.g} />}
                      {es.total != null && <span style={{ color: C.text3, fontSize: 11, minWidth: 54, textAlign: "right" }}>{es.total}/{es.maxTotal}</span>}
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Best/Worst across all exams */}
          {bestSub && worstSub && bestSub.name !== worstSub.name && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.greenBg, border: `1px solid ${C.green}25`, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                <Trophy size={22} style={{ color: C.green, flexShrink: 0 }} />
                <div>
                  <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px" }}>Strongest Subject</p>
                  <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>{bestSub.name}</p>
                  <p style={{ color: C.green, fontSize: 13, fontWeight: 700, margin: 0 }}>{bestSub.score}/{bestSub.max} · {bestSub.pct}%</p>
                </div>
              </div>
              <div style={{ background: C.roseBg, border: `1px solid ${C.rose}25`, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                <AlertCircle size={22} style={{ color: C.rose, flexShrink: 0 }} />
                <div>
                  <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px" }}>Needs Attention</p>
                  <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>{worstSub.name}</p>
                  <p style={{ color: C.rose, fontSize: 13, fontWeight: 700, margin: 0 }}>{worstSub.score}/{worstSub.max} · {worstSub.pct}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Subject breakdown across all exams */}
          {examNames.length > 0 && subjects.length > 0 && (
            <Card>
              <SectionTitle>Subject-wise — Latest Exam ({latestExamName})</SectionTitle>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.s2 }}>
                      {["Subject", "Max", "Scored", "%", "Grade", "Result"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: h === "Subject" ? "left" : "center", color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s, i) => {
                      const g = gradeOf(s.pct, 100);
                      const m = g ? (GRADE_META[g.g] || {}) : {};
                      return (
                        <tr key={s.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? C.s2 + "50" : "transparent" }}>
                          <td style={{ padding: "12px 14px", color: C.text1, fontWeight: 700 }}>{s.name}</td>
                          <td style={{ padding: "12px 14px", textAlign: "center", color: C.text3 }}>{s.max}</td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <span style={{ color: m.c || C.text2, fontWeight: 900, fontSize: 15 }}>{s.score ?? "—"}</span>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {g && <span style={{ color: m.c, fontWeight: 800 }}>{g.p}%</span>}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {g && <GradePill g={g.g} />}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {g && (
                              <span style={{ background: g.p >= 35 ? C.greenBg : C.roseBg, color: g.p >= 35 ? C.green : C.rose, fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 20 }}>
                                {g.p >= 35 ? "PASS" : "FAIL"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {subjects.length > 1 && (() => {
                    const tot = subjects.reduce((a, s) => a + (s.score || 0), 0);
                    const mx  = subjects.reduce((a, s) => a + (s.max  || 0), 0);
                    const g   = gradeOf(tot, mx);
                    const m   = g ? (GRADE_META[g.g] || {}) : {};
                    return (
                      <tfoot>
                        <tr style={{ background: C.amberBg, borderTop: `2px solid ${C.amber}30` }}>
                          <td style={{ padding: "12px 14px", color: C.amber, fontWeight: 900 }}>TOTAL</td>
                          <td style={{ padding: "12px 14px", textAlign: "center", color: C.text2, fontWeight: 700 }}>{mx}</td>
                          <td style={{ padding: "12px 14px", textAlign: "center", color: m.c, fontWeight: 900, fontSize: 16 }}>{tot}</td>
                          <td style={{ padding: "12px 14px", textAlign: "center", color: m.c, fontWeight: 900 }}>{g?.p ?? 0}%</td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>{g && <GradePill g={g.g} />}</td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {g && <span style={{ background: g.p >= 35 ? C.greenBg : C.roseBg, color: g.p >= 35 ? C.green : C.rose, fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 20 }}>{g.p >= 35 ? "✓ PASS" : "✗ FAIL"}</span>}
                          </td>
                        </tr>
                      </tfoot>
                    );
                  })()}
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );

  const TAB_CONTENT = {
    overview:   <OverviewTab   />,
    subjects:   <SubjectsTab   />,
    attendance: <AttendanceTab />,
    exams:      <ExamsTab      />,
  };

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "28px 28px 52px", fontFamily: "'Lato', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← Back
          </button>
          {!loading && childInfo && (
            <>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: C.blueL, border: `3px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color, fontWeight: 900, fontSize: 17 }}>{initials || <User size={16} />}</span>
              </div>
              <div>
                <h1 style={{ color: C.text1, fontSize: 21, fontWeight: 900, margin: "0 0 3px", fontFamily: "Georgia, serif" }}>{displayName}</h1>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {classSection && (
                    <span style={{ background: C.blueL, color, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
                      {classSection}
                    </span>
                  )}
                  {rollNo && (
                    <span style={{ background: C.s2, color: C.text2, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>
                      Roll {rollNo}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!loading && overallGrade && (
            <div style={{ background: gradeMeta.bg, borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
              <p style={{ color: gradeMeta.c, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>Overall</p>
              <p style={{ color: gradeMeta.c, fontSize: 18, fontWeight: 900, margin: 0 }}>{gradeMeta.emoji} {overallGrade.g}</p>
            </div>
          )}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 7, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 16px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            <RefreshCw size={14} style={loading ? { animation: "spin 0.75s linear infinite" } : {}} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[...Array(4)].map((_, i) => <Skel key={i} h={82} />)}
          </div>
          <Skel h={180} />
          <Skel h={240} />
        </div>
      )}

      {/* ── Main content ── */}
      {!loading && (
        <>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, padding: 4, width: "fit-content", marginBottom: 22, overflowX: "auto" }}>
            {tabs.map((t) => (
              <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} color={color}>
                {t.label}
              </TabBtn>
            ))}
          </div>

          {TAB_CONTENT[tab] ?? null}
        </>
      )}
    </div>
  );
}