// src/pages/parent/MyChildren.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getParentChildren, getChildAttendance } from "../../services/attendanceApi";

// ─── Design tokens — matching screenshot palette ──────────────────────────────
const T = {
  bg:       "#f4f6fb",
  surface:  "#ffffff",
  border:   "#e5e9f2",
  text1:    "#0f172a",
  text2:    "#475569",
  text3:    "#94a3b8",
  indigo:   "#4f46e5",
  indigoBg: "#eef2ff",
  indigoL:  "#e0e7ff",
  green:    "#16a34a",
  greenBg:  "#f0fdf4",
  amber:    "#d97706",
  amberBg:  "#fffbeb",
  rose:     "#e11d48",
  roseBg:   "#fff1f2",
  blue:     "#2563eb",
  blueBg:   "#eff6ff",
  violet:   "#7c3aed",
  violetBg: "#f5f3ff",
  teal:     "#0d9488",
  tealBg:   "#f0fdfa",
};

const PALETTE = [
  { color: "#4f46e5", light: "#e0e7ff", bg: "#eef2ff" },
  { color: "#2563eb", light: "#dbeafe", bg: "#eff6ff" },
  { color: "#16a34a", light: "#dcfce7", bg: "#f0fdf4" },
  { color: "#7c3aed", light: "#ede9fe", bg: "#f5f3ff" },
  { color: "#d97706", light: "#fef3c7", bg: "#fffbeb" },
];

const SUBJ_COLORS = ["#4f46e5", "#2563eb", "#16a34a", "#7c3aed", "#d97706", "#0d9488"];

const TABS = [
  { key: "overview",   label: "Overview"   },
  { key: "subjects",   label: "Subjects"   },
  { key: "attendance", label: "Attendance" },
  { key: "fees",       label: "Fees"       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const scoreColor  = (s) => s >= 85 ? T.green : s >= 70 ? T.amber : T.rose;
const attendColor = (a) => a >= 90 ? T.green : a >= 75 ? T.amber : T.rose;
const scoreBg     = (s) => s >= 85 ? T.greenBg : s >= 70 ? T.amberBg : T.roseBg;

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}
function gradeOf(score, max) {
  if (score == null || !max) return "—";
  const p = Math.round((score / max) * 100);
  if (p >= 90) return "A+"; if (p >= 80) return "A"; if (p >= 70) return "B+";
  if (p >= 60) return "B";  if (p >= 50) return "C"; if (p >= 35) return "D";
  return "F";
}
function calcTrend(examHistory, subjectKey) {
  if (!examHistory || examHistory.length < 2) return "flat";
  const scores = examHistory.map(e => e.subjects?.[subjectKey]).filter(d => d?.score != null)
    .map(d => Math.round((d.score / d.max) * 100));
  if (scores.length < 2) return "flat";
  const diff = scores[scores.length - 1] - scores[0];
  return diff > 2 ? "up" : diff < -2 ? "down" : "flat";
}
function buildMonthly(records = []) {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const map = {};
  records.forEach(r => {
    const d = new Date(r.date), key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) map[key] = { month: MONTHS[d.getMonth()], year: d.getFullYear(), present: 0, total: 0 };
    map[key].total++;
    if (r.status === "present" || r.status === "late") map[key].present++;
  });
  return Object.values(map)
    .sort((a,b) => a.year !== b.year ? a.year-b.year : MONTHS.indexOf(a.month)-MONTHS.indexOf(b.month))
    .map(m => ({ ...m, pct: m.total ? Math.round((m.present/m.total)*100) : 0 })).slice(-7);
}
async function apiFetch(authFetch, path) {
  const res = await authFetch(path);
  if (!res) throw new Error("Session expired");
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || `HTTP ${res.status}`); }
  return res.json();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 40, r = 10 }) {
  return (
    <div style={{
      height: h, borderRadius: r,
      background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
      backgroundSize: "400% 100%", animation: "skelShimmer 1.4s infinite",
    }} />
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, color, bg, sub }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${color}25`, borderRadius: 14, padding: "16px 18px" }}>
      <p style={{ color: color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>{label}</p>
      <p style={{ color: color, fontSize: 26, fontWeight: 800, margin: "0 0 2px", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: color + "99", fontSize: 11, margin: 0, fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ─── Score Trend (SVG line) ───────────────────────────────────────────────────
function ScoreTrend({ examSummaries }) {
  if (!examSummaries?.length) return null;
  const pts   = examSummaries.map(e => e.pct ?? 0);
  const W = 220, H = 60, pad = 16;
  const xStep = pts.length > 1 ? (W - pad * 2) / (pts.length - 1) : 0;
  const yScale = (p) => H - pad - ((p - 40) / 60) * (H - pad * 2);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${pad + i * xStep},${yScale(p)}`).join(" ");

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: 0 }}>Score Trend</p>
        {pts.length > 0 && (
          <span style={{ background: scoreBg(pts[pts.length-1]), color: scoreColor(pts[pts.length-1]), fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>
            {gradeOf(pts[pts.length-1], 100)} {pts[pts.length-1]}%
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
        <svg width={W} height={H} style={{ overflow: "visible", flexShrink: 0 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {pts.length > 1 && (
            <path d={`${d} L${pad + (pts.length-1)*xStep},${H} L${pad},${H} Z`}
              fill="url(#trendGrad)" />
          )}
          {pts.length > 1 && <path d={d} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={pad + i * xStep} cy={yScale(p)} r={4} fill="#4f46e5" />
              <text x={pad + i * xStep} y={yScale(p) - 9} textAnchor="middle"
                style={{ fill: scoreColor(p), fontSize: 11, fontWeight: 800 }}>{p}%</text>
            </g>
          ))}
        </svg>
        {pts.length > 0 && (
          <div style={{ flex: 1, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            {examSummaries.slice(-4).map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: T.text3, fontSize: 11, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.examName}</span>
                <span style={{ color: scoreColor(e.pct), fontSize: 11, fontWeight: 800 }}>{e.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ child, palette, attData, resultsData, feesData, attLoading, resultsLoading }) {
  const overall    = attData?.overall    ?? {};
  const attPct     = overall.percentage  ?? child.attendanceSummary?.percentage ?? 0;
  const examSums   = resultsData?.examSummaries ?? [];
  const avgScore   = examSums.length ? Math.round(examSums.reduce((a,s)=>a+(s.pct||0),0)/examSums.length) : null;
  const feeBalance = feesData?.summary?.totalBalance ?? feesData?.balance ?? null;
  const feePaid    = feesData?.summary?.totalPaid    ?? null;

  const latestExam = (() => {
    if (!resultsData?.data) return null;
    const keys = Object.keys(resultsData.data);
    if (!keys.length) return null;
    return { name: keys[keys.length - 1], subjects: resultsData.data[keys[keys.length - 1]] };
  })();

  const subjectEntries = latestExam
    ? Object.entries(latestExam.subjects).map(([name, d], i) => ({
        name, score: d?.score, max: d?.max ?? 100,
        pct: d?.score != null ? Math.round((d.score / d.max) * 100) : null,
        color: SUBJ_COLORS[i % SUBJ_COLORS.length],
      })).filter(s => s.pct != null).sort((a,b) => b.pct - a.pct)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {attLoading ? [...Array(3)].map((_,i) => <Skel key={i} h={90} />) : <>
          <MetricCard label="Attendance" value={`${attPct}%`} color={attendColor(attPct)} bg={attendColor(attPct) === T.green ? T.greenBg : attendColor(attPct) === T.amber ? T.amberBg : T.roseBg} sub="This term" />
          <MetricCard label="Avg Score"  value={avgScore != null ? `${avgScore}%` : "—"} color={avgScore != null ? scoreColor(avgScore) : T.text3} bg={avgScore != null ? scoreBg(avgScore) : "#f8fafc"} sub="Latest results" />
          <MetricCard label="Absent" value={overall.absent ?? "—"} color={T.rose} bg={T.roseBg} sub={`${overall.present ?? "—"} days present`} />
        </>}
      </div>

      {/* Score trend */}
      {!resultsLoading && examSums.length > 0 && <ScoreTrend examSummaries={examSums} />}

      {/* Latest exam subjects */}
      {latestExam && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: 0 }}>{latestExam.name}</p>
            <span style={{ color: T.text3, fontSize: 12 }}>{subjectEntries.length} subjects</span>
          </div>
          {resultsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[...Array(4)].map((_,i)=><Skel key={i} h={28}/>)}</div>
          ) : subjectEntries.length === 0 ? (
            <p style={{ color: T.text3, fontSize: 13, fontStyle: "italic" }}>No results yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {subjectEntries.map(s => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.text2, fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  <div style={{ width: 100, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 3, transition: "width 1s" }} />
                  </div>
                  <span style={{ color: scoreColor(s.pct), fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: "right" }}>{s.pct}%</span>
                  <span style={{ background: scoreBg(s.pct), color: scoreColor(s.pct), fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, minWidth: 28, textAlign: "center" }}>
                    {gradeOf(s.score, s.max)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fee status card */}
      <div style={{
        background: feeBalance === null ? "#f8fafc" : feeBalance > 0 ? T.roseBg : T.greenBg,
        border: `1.5px solid ${feeBalance === null ? T.border : feeBalance > 0 ? T.rose + "30" : T.green + "30"}`,
        borderRadius: 14, padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <p style={{ color: feeBalance === null ? T.text3 : feeBalance > 0 ? T.rose : T.green, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Fee Status</p>
          {feeBalance === null ? (
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>Loading…</p>
          ) : feeBalance > 0 ? (
            <><p style={{ color: T.text1, fontSize: 17, fontWeight: 800, margin: "0 0 2px" }}>₹{feeBalance.toLocaleString("en-IN")} due</p>
            {feePaid != null && <p style={{ color: T.text2, fontSize: 12, margin: 0 }}>Paid: ₹{feePaid.toLocaleString("en-IN")}</p>}</>
          ) : (
            <p style={{ color: T.green, fontSize: 14, fontWeight: 700, margin: 0 }}>All fees cleared ✓</p>
          )}
        </div>
        {feeBalance !== null && feeBalance === 0 && (
          <span style={{ fontSize: 28 }}>✅</span>
        )}
      </div>
    </div>
  );
}

// ─── Subjects Tab ─────────────────────────────────────────────────────────────
function SubjectsTab({ resultsData, resultsLoading }) {
  const allData   = resultsData?.data        ?? {};
  const examSums  = resultsData?.examSummaries ?? [];
  const examNames = Object.keys(allData);
  const subjectSet = new Set();
  examNames.forEach(en => Object.keys(allData[en]||{}).forEach(s => subjectSet.add(s)));
  const subjects = [...subjectSet];
  const subjColors = {};
  subjects.forEach((s,i) => { subjColors[s] = SUBJ_COLORS[i % SUBJ_COLORS.length]; });

  if (resultsLoading) return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(5)].map((_,i)=><Skel key={i} h={60}/>)}</div>;

  if (!examNames.length) return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
      <p style={{ color: T.text1, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>No Results Yet</p>
      <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>Results will appear once teachers enter and submit marks.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Exam summary bars */}
      {examSums.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px" }}>
          <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Exam Performance Overview</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {examSums.map(es => (
              <div key={es.examName} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: T.text2, fontSize: 13, fontWeight: 600, minWidth: 120 }}>{es.examName}</span>
                <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${es.pct}%`, height: "100%", background: scoreColor(es.pct), borderRadius: 4, transition: "width 1s ease" }} />
                </div>
                <span style={{ color: scoreColor(es.pct), fontSize: 13, fontWeight: 800, minWidth: 42, textAlign: "right" }}>{es.pct}%</span>
                <span style={{ background: scoreBg(es.pct), color: scoreColor(es.pct), fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6, minWidth: 32, textAlign: "center" }}>
                  {gradeOf(es.total, es.maxTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score history table */}
      {examNames.length > 0 && subjects.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px" }}>
          <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Subject Score History</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: T.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "8px 0 0 8px" }}>Exam</th>
                  {subjects.map(s => (
                    <th key={s} style={{ padding: "10px 10px", textAlign: "center", color: T.text3, fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80 }}>{s}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {examNames.map(en => {
                  const ed = allData[en] || {};
                  return (
                    <tr key={en} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "12px 14px", color: T.text1, fontWeight: 700, fontSize: 13 }}>{en}</td>
                      {subjects.map(s => {
                        const d = ed[s];
                        const pct = d?.score != null ? Math.round((d.score/d.max)*100) : null;
                        return (
                          <td key={s} style={{ padding: "12px 10px", textAlign: "center" }}>
                            {pct != null
                              ? <span style={{ color: scoreColor(pct), fontWeight: 700 }}>{d.score}/{d.max}</span>
                              : <span style={{ color: T.text3 }}>—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subject cards — latest exam */}
      {examNames.length > 0 && (() => {
        const ln = examNames[examNames.length - 1];
        const ld = allData[ln] || {};
        const entries = Object.entries(ld).map(([name, d], i) => ({
          name, score: d?.score, max: d?.max, color: SUBJ_COLORS[i % SUBJ_COLORS.length]
        })).filter(s => s.score != null);
        if (!entries.length) return null;
        return (
          <div>
            <p style={{ color: T.text2, fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>Subject Breakdown — {ln}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {entries.map(sub => {
                const pct = sub.max > 0 ? Math.round((sub.score/sub.max)*100) : 0;
                const g   = gradeOf(sub.score, sub.max);
                const trend = calcTrend(examNames.map(en => ({ subjects: allData[en] })), sub.name);
                return (
                  <div key={sub.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: sub.color }} />
                        <p style={{ color: T.text1, fontSize: 13, fontWeight: 700, margin: 0 }}>{sub.name}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: scoreColor(pct), fontSize: 20, fontWeight: 800, margin: "0 0 2px", lineHeight: 1 }}>{pct}%</p>
                        <span style={{ background: scoreBg(pct), color: scoreColor(pct), fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5 }}>{g}</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: sub.color, borderRadius: 3, transition: "width 1s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.text3, fontSize: 11 }}>{sub.score}/{sub.max} marks</span>
                      <span style={{ color: trend==="up" ? T.green : trend==="down" ? T.rose : T.text3, fontSize: 11, fontWeight: 700 }}>
                        {trend==="up" ? "↑ Improving" : trend==="down" ? "↓ Declining" : "→ Stable"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
function AttendanceTab({ attData, attLoading, child }) {
  const overall = attData?.overall ?? {};
  const records = attData?.records ?? [];
  const attPct  = overall.percentage ?? child.attendanceSummary?.percentage ?? 0;
  const subjects = attData?.subjectWise ?? [];
  const monthly  = useMemo(() => buildMonthly(records), [records]);

  if (attLoading) return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(4)].map((_,i)=><Skel key={i} h={60}/>)}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { l: "Overall",       v: `${attPct}%`,          c: attendColor(attPct), bg: attendColor(attPct)===T.green?T.greenBg:attendColor(attPct)===T.amber?T.amberBg:T.roseBg },
          { l: "Days Present",  v: overall.present ?? "—", c: T.green,  bg: T.greenBg  },
          { l: "Days Absent",   v: overall.absent  ?? "—", c: T.rose,   bg: T.roseBg   },
          { l: "Late Arrivals", v: overall.late    ?? "—", c: T.amber,  bg: T.amberBg  },
        ].map(m => <MetricCard key={m.l} label={m.l} value={m.v} color={m.c} bg={m.bg} />)}
      </div>

      {/* Monthly chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: 0 }}>Month-by-Month Attendance</p>
          <div style={{ display: "flex", gap: 14 }}>
            {[{c:T.green,l:"≥90%"},{c:T.amber,l:"75–89%"},{c:T.rose,l:"<75%"}].map(k => (
              <div key={k.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: k.c }} />
                <span style={{ color: T.text3, fontSize: 11 }}>{k.l}</span>
              </div>
            ))}
          </div>
        </div>
        {!monthly.length
          ? <p style={{ color: T.text3, fontSize: 12, fontStyle: "italic" }}>No records yet</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {monthly.map(m => (
                <div key={m.month+m.year} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: T.text3, fontSize: 11.5, fontWeight: 700, minWidth: 28 }}>{m.month}</span>
                  <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${m.pct}%`, height: "100%", background: attendColor(m.pct), borderRadius: 4, transition: "width 1s" }} />
                  </div>
                  <span style={{ color: attendColor(m.pct), fontSize: 12, fontWeight: 800, minWidth: 36, textAlign: "right" }}>{m.pct}%</span>
                  <span style={{ color: T.text3, fontSize: 11, minWidth: 60 }}>{m.present}/{m.total} days</span>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Subject-wise */}
      {subjects.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px" }}>
          <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Subject-wise Attendance</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {subjects.map(s => (
              <div key={s.subject} style={{ background: T.bg, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: T.text1, fontSize: 12.5, fontWeight: 700 }}>{s.subject}</span>
                  <span style={{ color: attendColor(s.percentage), fontSize: 13, fontWeight: 800 }}>{s.percentage}%</span>
                </div>
                <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${s.percentage}%`, height: "100%", background: attendColor(s.percentage), borderRadius: 3 }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["P", s.present, T.green], ["A", s.absent, T.rose], ["L", s.late||0, T.amber]].map(([lbl,val,col]) => (
                    <span key={lbl} style={{ color: col, fontSize: 11, fontWeight: 700 }}>{lbl}: {val}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert */}
      {attPct < 90 && attPct > 0 && (
        <div style={{ background: attPct < 75 ? T.roseBg : T.amberBg, border: `1px solid ${attPct < 75 ? T.rose : T.amber}30`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ color: attPct < 75 ? T.rose : T.amber, fontSize: 13, fontWeight: 700, margin: "0 0 3px" }}>
              {attPct < 75 ? "Critical — Below 75%" : "Attendance Below 90%"}
            </p>
            <p style={{ color: T.text2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              {child.name?.split(" ")[0]}'s attendance is {attPct}%.
              {attPct < 75 ? " Students below 75% may be barred from exams." : " Regular attendance improves academic performance."}
            </p>
          </div>
        </div>
      )}

      {/* Recent records */}
      {records.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px" }}>
          <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Recent Records</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...records].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,8).map((r,i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.bg, borderRadius: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: r.status==="present" ? T.greenBg : r.status==="absent" ? T.roseBg : T.amberBg }}>
                  <span style={{ fontSize: 15 }}>{r.status==="present" ? "✓" : r.status==="absent" ? "✗" : "⏰"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: T.text1, fontSize: 12.5, fontWeight: 600, margin: "0 0 1px" }}>
                    {new Date(r.date).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
                  </p>
                  <p style={{ color: T.text3, fontSize: 11, margin: 0 }}>{r.subject || "General"}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize",
                  background: r.status==="present" ? T.greenBg : r.status==="absent" ? T.roseBg : T.amberBg,
                  color: r.status==="present" ? T.green : r.status==="absent" ? T.rose : T.amber }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fees Tab ─────────────────────────────────────────────────────────────────
function FeesTab({ feesData, feesLoading, child, palette, navigate }) {
  const balance = feesData?.summary?.totalBalance ?? feesData?.balance ?? null;
  const paid    = feesData?.summary?.totalPaid    ?? feesData?.paid    ?? null;
  const records = feesData?.records               ?? feesData?.history ?? [];

  if (feesLoading) return <div style={{ display:"flex",flexDirection:"column",gap:10 }}>{[...Array(3)].map((_,i)=><Skel key={i} h={72}/>)}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {balance === null ? (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: "24px", textAlign: "center" }}>
          <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>Fee information not available. Contact school admin.</p>
        </div>
      ) : balance > 0 ? (
        <div style={{ background: T.roseBg, border: `1.5px solid ${T.rose}25`, borderRadius: 14, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: T.rose, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Outstanding Payment</p>
            <p style={{ color: T.text1, fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>₹{balance.toLocaleString("en-IN")}</p>
            <p style={{ color: T.text2, fontSize: 12, margin: 0 }}>Please clear the balance for {child.name?.split(" ")[0]}</p>
            {paid != null && <p style={{ color: T.text3, fontSize: 11.5, margin: "4px 0 0" }}>Already paid: ₹{paid.toLocaleString("en-IN")}</p>}
          </div>
          <button onClick={() => navigate("/parent/fees/pay")}
            style={{ background: T.rose, border: "none", borderRadius: 10, padding: "10px 22px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Pay Now →
          </button>
        </div>
      ) : (
        <div style={{ background: T.greenBg, border: `1.5px solid ${T.green}25`, borderRadius: 14, padding: "16px 20px", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <p style={{ color: T.green, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>All fees cleared ✓</p>
            {paid != null && <p style={{ color: T.text3, fontSize: 12, margin: 0 }}>Total paid: ₹{paid.toLocaleString("en-IN")}</p>}
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px" }}>
          <p style={{ color: T.text1, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Payment History</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {records.map((f,i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: f.status==="paid" ? T.greenBg : T.roseBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 17 }}>{f.status==="paid" ? "✓" : "⏳"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: T.text1, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{f.term || f.description || `Payment ${i+1}`}</p>
                  <p style={{ color: T.text3, fontSize: 11, margin: 0 }}>
                    {f.status==="paid"
                      ? `Paid${f.paidDate ? ` on ${new Date(f.paidDate).toLocaleDateString("en-IN")}` : ""}`
                      : `Due${f.dueDate  ? ` by ${new Date(f.dueDate).toLocaleDateString("en-IN")}` : ""}`}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: T.text1, fontSize: 15, fontWeight: 800, margin: "0 0 3px" }}>₹{(f.amount||0).toLocaleString("en-IN")}</p>
                  <span style={{ background: f.status==="paid" ? T.greenBg : T.roseBg, color: f.status==="paid" ? T.green : T.rose, fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 6 }}>
                    {f.status==="paid" ? "Paid ✓" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function MyChildren() {
  const navigate       = useNavigate();
  const { authFetch }  = useAuth();
  const authFetchRef   = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const [children,   setChildren]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeChild,setActiveChild]= useState(0);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [dataMap,    setDataMap]    = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  useEffect(() => {
    setLoading(true);
    getParentChildren()
      .then(res => {
        const list = res?.data ?? [];
        setChildren(list);
        if (list.length) { setActiveChild(0); fetchChildData(list[0]); }
      })
      .catch(err => setError(err.message || "Failed to load children"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const fetchChildData = useCallback(async (child) => {
    const id = child._id;
    if (dataMap[id]) return;
    setLoadingMap(p => ({ ...p, [id]: { att:true, res:true, fees:true } }));
    const fetch = authFetchRef.current;

    getChildAttendance(id, { grade: child.grade, section: (child.section||"").toUpperCase() })
      .then(res => { setDataMap(p => ({ ...p, [id]: { ...(p[id]||{}), attendance: res?.data??null } })); setLoadingMap(p => ({ ...p, [id]: { ...(p[id]||{}), att:false } })); })
      .catch(() => setLoadingMap(p => ({ ...p, [id]: { ...(p[id]||{}), att:false } })));

    apiFetch(fetch, `/results/student/${id}`)
      .then(res => { setDataMap(p => ({ ...p, [id]: { ...(p[id]||{}), results: res??null } })); setLoadingMap(p => ({ ...p, [id]: { ...(p[id]||{}), res:false } })); })
      .catch(() => setLoadingMap(p => ({ ...p, [id]: { ...(p[id]||{}), res:false } })));

    apiFetch(fetch, `/fees/child-fees?grade=${encodeURIComponent(child.grade)}&section=${encodeURIComponent(child.section||"")}&rollNo=${encodeURIComponent(child.rollNo||"")}`)
      .then(res => { setDataMap(p => ({ ...p, [id]: { ...(p[id]||{}), fees: res??null } })); setLoadingMap(p => ({ ...p, [id]: { ...(p[id]||{}), fees:false } })); })
      .catch(() => setLoadingMap(p => ({ ...p, [id]: { ...(p[id]||{}), fees:false } })));
  }, [dataMap]);

  const handleSelectChild = useCallback((idx) => {
    setActiveChild(idx); setActiveTab("overview");
    const c = children[idx];
    if (c) fetchChildData(c);
  }, [children, fetchChildData]);

  const child   = children[activeChild] ?? null;
  const palette = PALETTE[activeChild % PALETTE.length];
  const cData   = child ? (dataMap[child._id] || {}) : {};
  const cLoad   = child ? (loadingMap[child._id] || {}) : {};
  const attData     = cData.attendance ?? null;
  const resultsData = cData.results    ?? null;
  const feesData    = cData.fees       ?? null;
  const attLoading  = cLoad.att  ?? false;
  const resLoading  = cLoad.res  ?? false;
  const feesLoading = cLoad.fees ?? false;

  const getAttPct    = (c) => dataMap[c._id]?.attendance?.overall?.percentage ?? c.attendanceSummary?.percentage ?? 0;
  const getAvgScore  = (c) => { const s = dataMap[c._id]?.results?.examSummaries??[]; return s.length ? Math.round(s.reduce((a,x)=>a+(x.pct||0),0)/s.length) : null; };
  const getFeeBalance = (c) => { const fd=dataMap[c._id]?.fees; return fd?.summary?.totalBalance??fd?.balance??null; };

  return (
    <div style={{ padding: "24px 28px 48px", background: T.bg, minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes skelShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .mc-fade { animation: fadeUp 0.25s ease both; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        button { font-family: inherit; }
      `}</style>

      {/* Page Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ color:T.text1, fontSize:22, fontWeight:800, margin:"0 0 4px", letterSpacing:"-0.025em" }}>My Children</h1>
          <p style={{ color:T.text3, fontSize:13, margin:0 }}>Academic profiles, attendance, results and fees</p>
        </div>
        <button onClick={() => navigate("/parent/messages")}
          style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 16px", color:T.text2, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          💬 Message School
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:T.roseBg, border:`1px solid ${T.rose}30`, borderRadius:12, padding:"12px 16px", marginBottom:20, color:T.rose, fontSize:13, fontWeight:600 }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:24 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}><Skel h={160} r={14}/><Skel h={160} r={14}/></div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Skel h={50} r={12}/><Skel h={220} r={14}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>{[...Array(3)].map((_,i)=><Skel key={i} h={90} r={12}/>)}</div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && children.length === 0 && !error && (
        <div style={{ background:T.surface, border:`1.5px dashed ${T.border}`, borderRadius:16, padding:"60px 24px", textAlign:"center" }}>
          <p style={{ fontSize:44, margin:"0 0 12px" }}>👨‍👧‍👦</p>
          <p style={{ color:T.text1, fontSize:15, fontWeight:700, margin:"0 0 6px" }}>No children linked yet</p>
          <p style={{ color:T.text3, fontSize:13, margin:0 }}>Ask your school admin to link your children to your account.</p>
        </div>
      )}

      {/* Main */}
      {!loading && children.length > 0 && child && (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:24, alignItems:"flex-start" }}>

          {/* ── Left: Child selector ── */}
          <div style={{ position:"sticky", top:76, display:"flex", flexDirection:"column", gap:12 }}>
            {children.map((c, i) => {
              const pal     = PALETTE[i % PALETTE.length];
              const att     = getAttPct(c);
              const avg     = getAvgScore(c);
              const balance = getFeeBalance(c);
              const isActive = activeChild === i;
              return (
                <div key={c._id} onClick={() => handleSelectChild(i)}
                  style={{
                    background: T.surface,
                    border: `1.5px solid ${isActive ? pal.color : T.border}`,
                    borderRadius: 16, padding: "16px", cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: isActive ? `0 4px 20px ${pal.color}18` : "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                  {/* Child info row */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <div style={{ width:44, height:44, borderRadius:"50%", background:pal.light, border:`2.5px solid ${pal.color}50`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ color:pal.color, fontWeight:800, fontSize:14 }}>{getInitials(c.name)}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ color:T.text1, fontSize:14, fontWeight:700, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</p>
                      <p style={{ color:T.text3, fontSize:11, margin:0 }}>Class {c.grade}{c.section?`-${c.section}`:""}{c.rollNo?` · Roll ${c.rollNo}`:""}</p>
                    </div>
                    {balance !== null && (
                      <span style={{ background: balance > 0 ? T.roseBg : T.greenBg, color: balance > 0 ? T.rose : T.green, fontSize:9.5, fontWeight:700, padding:"3px 8px", borderRadius:20, flexShrink:0 }}>
                        {balance > 0 ? "DUE" : "PAID"}
                      </span>
                    )}
                  </div>

                  {/* Mini stats */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div style={{ background:T.amberBg, border:`1px solid ${T.amber}20`, borderRadius:9, padding:"9px 12px", textAlign:"center" }}>
                      <p style={{ color:T.amber, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px" }}>Attendance</p>
                      <p style={{ color:T.amber, fontSize:16, fontWeight:800, margin:0 }}>{att}%</p>
                    </div>
                    <div style={{ background:T.greenBg, border:`1px solid ${T.green}20`, borderRadius:9, padding:"9px 12px", textAlign:"center" }}>
                      <p style={{ color:T.green, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px" }}>Avg Score</p>
                      <p style={{ color:T.green, fontSize:16, fontWeight:800, margin:0 }}>{avg != null ? `${avg}%` : "—"}</p>
                    </div>
                  </div>

                  {/* Quick nav buttons */}
                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    {["Attendance","Results"].map(lbl => (
                      <button key={lbl}
                        onClick={e => { e.stopPropagation(); handleSelectChild(i); setActiveTab(lbl.toLowerCase()); }}
                        style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 0", color:T.text2, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.12s" }}
                        onMouseEnter={e => { e.currentTarget.style.background=pal.light; e.currentTarget.style.color=pal.color; e.currentTarget.style.borderColor=pal.color+"50"; }}
                        onMouseLeave={e => { e.currentTarget.style.background=T.bg; e.currentTarget.style.color=T.text2; e.currentTarget.style.borderColor=T.border; }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Help card */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
              <p style={{ color:T.text2, fontSize:12, fontWeight:600, margin:"0 0 10px" }}>Need Help?</p>
              <button onClick={() => navigate("/parent/messages")}
                style={{ width:"100%", background:T.indigoBg, border:`1px solid ${T.indigo}20`, borderRadius:9, padding:"9px", color:T.indigo, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Message School →
              </button>
            </div>
          </div>

          {/* ── Right: Detail ── */}
          <div className="mc-fade">
            {/* Child detail header — dark gradient matching screenshot */}
            <div style={{ background:"linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)", borderRadius:16, padding:"20px 24px", marginBottom:20, boxShadow:"0 4px 24px rgba(67,56,202,0.25)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:50, height:50, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ color:"#fff", fontWeight:800, fontSize:17 }}>{getInitials(child.name)}</span>
                  </div>
                  <div>
                    <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:"0 0 3px" }}>{child.name}</h2>
                    <p style={{ color:"rgba(255,255,255,0.65)", fontSize:13, margin:0 }}>
                      {child.grade}{child.section ? `-${child.section}` : ""}
                      {child.rollNo ? ` · Roll ${child.rollNo}` : ""}
                    </p>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {["Attendance","Results"].map(lbl => (
                    <button key={lbl}
                      onClick={() => setActiveTab(lbl.toLowerCase())}
                      style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:9, padding:"8px 16px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", backdropFilter:"blur(4px)", transition:"all 0.13s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.25)"}
                      onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:2, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:4, marginBottom:20, overflowX:"auto", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    background: activeTab === t.key ? palette.bg : "transparent",
                    border: `1px solid ${activeTab === t.key ? palette.color+"30" : "transparent"}`,
                    borderRadius: 8, padding: "8px 18px",
                    color: activeTab === t.key ? palette.color : T.text3,
                    fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500,
                    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.14s",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && <OverviewTab child={child} palette={palette} attData={attData} resultsData={resultsData} feesData={feesData} attLoading={attLoading} resultsLoading={resLoading} />}
            {activeTab === "subjects" && <SubjectsTab resultsData={resultsData} resultsLoading={resLoading} />}
            {activeTab === "attendance" && <AttendanceTab attData={attData} attLoading={attLoading} child={child} />}
            {activeTab === "fees" && <FeesTab feesData={feesData} feesLoading={feesLoading} child={child} palette={palette} navigate={navigate} />}
          </div>
        </div>
      )}
    </div>
  );
}