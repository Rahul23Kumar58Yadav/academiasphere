import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
  teal:     "#0f766e",
  tealL:    "#e6f7f6",
  tealBg:   "#0f766e0e",
};

// ─── Data ──────────────────────────────────────────────────────────────────
const CHILDREN_DATA = {
  1: {
    id: 1, name: "Aryan Reddy", grade: "Grade 10 – A", avatar: "AR",
    color: C.blue, colorL: C.blueL, colorBg: C.blueBg,
    school: "Greenwood High School", classTeacher: "Mrs. Priya Nambiar",
    rank: 7, rankTotal: 42, rankPrev: 9, avgScore: 79, avgScorePrev: 74,
    percentile: 82,
    aiSummary: "Aryan shows consistent improvement in Sciences and English. Mathematics needs focused attention — particularly algebra. His Computer Science scores are exceptional. Recommended: extra practice sessions for Social Studies before finals.",
    subjects: [
      { name: "Mathematics",    code: "MATH", score: 74, prev: 68, max: 100, grade: "B",  color: C.amber,  teacher: "Mr. Rajesh Kumar",   icon: "∑"  },
      { name: "Physics",        code: "PHY",  score: 81, prev: 75, max: 100, grade: "A–", color: C.blue,   teacher: "Mrs. Leela Sharma",  icon: "⚛"  },
      { name: "Chemistry",      code: "CHEM", score: 77, prev: 72, max: 100, grade: "B+", color: C.green,  teacher: "Mr. Anand Pillai",   icon: "⬡"  },
      { name: "English",        code: "ENG",  score: 83, prev: 79, max: 100, grade: "A–", color: C.violet, teacher: "Mrs. Sunita Mehta",  icon: "Aa" },
      { name: "Computer Sc.",   code: "CS",   score: 91, prev: 88, max: 100, grade: "A+", color: C.accent, teacher: "Mr. Kiran Nair",     icon: "</>" },
      { name: "Social Studies", code: "SOC",  score: 69, prev: 64, max: 100, grade: "C+", color: C.rose,   teacher: "Mrs. Geetha Rao",    icon: "◎"  },
    ],
    termScores: [
      { term: "Term 1",    math: 62, physics: 68, chemistry: 65, english: 72, cs: 82, social: 58, avg: 68 },
      { term: "Term 2",    math: 68, physics: 75, chemistry: 72, english: 79, cs: 88, social: 64, avg: 74 },
      { term: "Term 3",    math: 74, physics: 81, chemistry: 77, english: 83, cs: 91, social: 69, avg: 79 },
    ],
    weeklyProgress: [68, 69, 72, 71, 73, 74, 76, 75, 78, 77, 79],
    classComparison: { studentAvg: 79, classAvg: 71, topperAvg: 94, lowestAvg: 48 },
    strengths: ["Computer Science", "English", "Physics"],
    weaknesses: ["Social Studies", "Mathematics"],
    predictions: { nextTerm: 83, finalExam: 80 },
    upcomingTests: [
      { subject: "Mathematics",  date: "Mar 18", daysLeft: 5,  chapters: "Polynomials, Coordinate Geometry" },
      { subject: "Social Studies",date: "Mar 22", daysLeft: 9,  chapters: "Indian History Ch. 7–9" },
      { subject: "Physics",      date: "Mar 25", daysLeft: 12, chapters: "Current Electricity, Magnetism" },
    ],
    badges: [
      { title: "Science Star",      desc: "Top 10% in Physics",       icon: "⚡", color: C.blue   },
      { title: "Code Champion",     desc: "Highest CS score in class", icon: "💻", color: C.accent },
      { title: "Most Improved",     desc: "+11% over Term 1",         icon: "📈", color: C.green  },
    ],
    teacherComments: [
      { teacher: "Mr. Kiran Nair", subject: "Computer Sc.", comment: "Aryan's project work is outstanding. He should consider participating in national coding competitions.", date: "Mar 9" },
      { teacher: "Mrs. Leela",     subject: "Physics",      comment: "Great improvement in numerical problems. Keep focusing on derivations.", date: "Mar 7" },
      { teacher: "Mr. Rajesh",     subject: "Mathematics",  comment: "Needs to practice more word problems and improve speed in calculations.", date: "Mar 5" },
    ],
    monthlyHours: [
      { month: "Oct", study: 48, recommended: 60 },
      { month: "Nov", study: 52, recommended: 60 },
      { month: "Dec", study: 44, recommended: 60 },
      { month: "Jan", study: 58, recommended: 60 },
      { month: "Feb", study: 62, recommended: 60 },
      { month: "Mar", study: 35, recommended: 60 },
    ],
  },
  2: {
    id: 2, name: "Priya Reddy", grade: "Grade 7 – B", avatar: "PR",
    color: C.accent, colorL: C.accentL, colorBg: C.accentBg,
    school: "Greenwood High School", classTeacher: "Mrs. Anitha Krishnan",
    rank: 3, rankTotal: 38, rankPrev: 5, avgScore: 88, avgScorePrev: 85,
    percentile: 92,
    aiSummary: "Priya is an exceptional all-round student. Her consistency across all subjects is remarkable. Mathematics and English are her strongest areas. A slight dip in Sanskrit — a few extra revision sessions are recommended before the finals.",
    subjects: [
      { name: "Mathematics", code: "MATH", score: 92, prev: 88, max: 100, grade: "A+", color: C.accent, teacher: "Mrs. Devi Prasad",   icon: "∑"  },
      { name: "Science",     code: "SCI",  score: 88, prev: 84, max: 100, grade: "A",  color: C.green,  teacher: "Mr. Sanjay Iyer",    icon: "⚗"  },
      { name: "English",     code: "ENG",  score: 90, prev: 87, max: 100, grade: "A+", color: C.violet, teacher: "Mrs. Kavitha Nair",  icon: "Aa" },
      { name: "Social St.",  code: "SOC",  score: 84, prev: 80, max: 100, grade: "A–", color: C.blue,   teacher: "Mr. Prakash Sharma", icon: "◎"  },
      { name: "Hindi",       code: "HIN",  score: 86, prev: 83, max: 100, grade: "A",  color: C.amber,  teacher: "Mrs. Radha Joshi",   icon: "ह"  },
      { name: "Sanskrit",    code: "SAN",  score: 79, prev: 74, max: 100, grade: "B+", color: C.rose,   teacher: "Mrs. Geeta Sharma",  icon: "ॐ"  },
    ],
    termScores: [
      { term: "Term 1",  math: 85, science: 80, english: 84, social: 76, hindi: 80, sanskrit: 70, avg: 79 },
      { term: "Term 2",  math: 88, science: 84, english: 87, social: 80, hindi: 83, sanskrit: 74, avg: 83 },
      { term: "Term 3",  math: 92, science: 88, english: 90, social: 84, hindi: 86, sanskrit: 79, avg: 87 },
    ],
    weeklyProgress: [82, 83, 84, 85, 85, 86, 87, 87, 88, 88, 88],
    classComparison: { studentAvg: 88, classAvg: 74, topperAvg: 95, lowestAvg: 51 },
    strengths: ["Mathematics", "English", "Science"],
    weaknesses: ["Sanskrit"],
    predictions: { nextTerm: 91, finalExam: 90 },
    upcomingTests: [
      { subject: "Science",   date: "Mar 20", daysLeft: 7,  chapters: "Light, Sound & Optics" },
      { subject: "Sanskrit",  date: "Mar 24", daysLeft: 11, chapters: "Grammar & Comprehension" },
      { subject: "Mathematics",date: "Mar 27", daysLeft: 14, chapters: "Algebra, Fractions" },
    ],
    badges: [
      { title: "All-Rounder",   desc: "All subjects above 79%",      icon: "🌟", color: C.accent },
      { title: "Class Topper",  desc: "Ranked #3 out of 38",         icon: "🏆", color: C.amber  },
      { title: "Math Genius",   desc: "92% — Highest in class",      icon: "∑",  color: C.green  },
    ],
    teacherComments: [
      { teacher: "Mrs. Anitha",  subject: "Class Teacher", comment: "Priya is a wonderful student. She is disciplined, hardworking and a positive influence on the class.", date: "Mar 11" },
      { teacher: "Mrs. Devi",    subject: "Mathematics",   comment: "She has achieved the highest score in class. I recommend she attempt Olympiad problems.", date: "Mar 9" },
      { teacher: "Mrs. Geeta",   subject: "Sanskrit",      comment: "Good understanding of texts. Needs to focus on grammar rules for the final exam.", date: "Mar 6" },
    ],
    monthlyHours: [
      { month: "Oct", study: 55, recommended: 50 },
      { month: "Nov", study: 58, recommended: 50 },
      { month: "Dec", study: 52, recommended: 50 },
      { month: "Jan", study: 60, recommended: 50 },
      { month: "Feb", study: 62, recommended: 50 },
      { month: "Mar", study: 38, recommended: 50 },
    ],
  },
};

// ─── Utilities ──────────────────────────────────────────────────────────────
const scoreColor = s => s >= 85 ? C.green : s >= 70 ? C.amber : C.rose;
const scoreLabel = s => s >= 85 ? "Excellent" : s >= 70 ? "Good" : "Needs Attention";
const gradeColor = g => g?.startsWith("A") ? C.green : g?.startsWith("B") ? C.amber : C.rose;
const delta      = (curr, prev) => curr - prev;
const deltaColor = d => d > 0 ? C.green : d < 0 ? C.rose : C.text3;
const deltaSign  = d => d > 0 ? `+${d}` : `${d}`;

// ─── Animated Counter ───────────────────────────────────────────────────────
function Counter({ to, suffix = "", duration = 1000 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let s = 0, step = to / (duration / 16);
    const t = setInterval(() => {
      s = Math.min(s + step, to);
      setV(Math.round(s));
      if (s >= to) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [to]);
  return <>{v}{suffix}</>;
}

// ─── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 120, h = 36 }) {
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 4 - ((v - mn) / rng) * (h - 8)}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const id = `sp${color.replace(/[^a-z]/gi, "")}${w}`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={h - 4 - ((data[data.length - 1] - mn) / rng) * (h - 8)} r="3.5" fill={color} />
    </svg>
  );
}

// ─── Radial Progress ────────────────────────────────────────────────────────
function Radial({ value, color, size = 80, stroke = 7, label, sublabel }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.s3} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {label && <span style={{ color, fontSize: size > 72 ? 16 : 12, fontWeight: 900, lineHeight: 1 }}>{label}</span>}
        {sublabel && <span style={{ color: C.text3, fontSize: 10, marginTop: 2 }}>{sublabel}</span>}
      </div>
    </div>
  );
}

// ─── Horizontal Bar ─────────────────────────────────────────────────────────
function HBar({ value, max = 100, color, height = 6, animated = true }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ width: "100%", height, background: C.s3, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: height / 2, transition: animated ? "width 1.2s ease" : "none" }} />
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h3 style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: 0 }}>{children}</h3>
      {action}
    </div>
  );
}

// ─── Class Comparison Bar ────────────────────────────────────────────────────
function ClassCompBar({ label, value, max = 100, color, isStudent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <span style={{ color: isStudent ? C.text1 : C.text3, fontSize: 12.5, fontWeight: isStudent ? 700 : 500, minWidth: 100 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: C.s3, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1.2s ease" }} />
      </div>
      <span style={{ color: isStudent ? color : C.text2, fontWeight: isStudent ? 900 : 600, fontSize: 13, minWidth: 34, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children, color }) {
  return (
    <button onClick={onClick} style={{
      background: active ? color + "18" : "transparent",
      border: `1px solid ${active ? color + "45" : "transparent"}`,
      borderRadius: 9, padding: "8px 18px",
      color: active ? color : C.text3,
      fontSize: 13, fontWeight: 700, cursor: "pointer",
      transition: "all 0.14s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function ChildPerformance() {
  const { childId } = useParams();
  const navigate    = useNavigate();
  const [tab, setTab]           = useState("overview");
  const [selSubject, setSelSub] = useState(null);
  const child = CHILDREN_DATA[childId] || CHILDREN_DATA[1];
  const { color, colorL, colorBg } = child;

  const tabs = [
    { key: "overview",    label: "Overview"       },
    { key: "subjects",    label: "Subject Detail" },
    { key: "comparison",  label: "Class Standing" },
    { key: "prediction",  label: "AI Insights"    },
    { key: "study",       label: "Study Hours"    },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "28px 30px 52px", fontFamily: "'Lato', 'Segoe UI', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← Back
          </button>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: colorL, border: `3px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color, fontWeight: 900, fontSize: 18 }}>{child.avatar}</span>
          </div>
          <div>
            <h1 style={{ color: C.text1, fontSize: 22, fontWeight: 900, margin: "0 0 2px", fontFamily: "Georgia, serif" }}>{child.name}</h1>
            <p style={{ color: C.text3, fontSize: 13, margin: 0 }}>{child.grade} · {child.school} · Performance Report</p>
          </div>
        </div>

        {/* Hero Stats */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {[
            { l: "Avg Score",  v: `${child.avgScore}%`,   d: delta(child.avgScore, child.avgScorePrev),   col: scoreColor(child.avgScore) },
            { l: "Class Rank", v: `#${child.rank}`,       d: -(delta(child.rank, child.rankPrev)),        col: color                      },
            { l: "Percentile", v: `${child.percentile}th`,d: null,                                         col: C.violet                   },
          ].map(s => (
            <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 18px", textAlign: "center", minWidth: 90 }}>
              <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>{s.l}</p>
              <p style={{ color: s.col, fontSize: 20, fontWeight: 900, margin: "0 0 4px", lineHeight: 1 }}>{s.v}</p>
              {s.d !== null && (
                <p style={{ color: deltaColor(s.d), fontSize: 11, fontWeight: 700, margin: 0 }}>
                  {deltaSign(s.d)} vs last
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 24 }}>
        {tabs.map(t => (
          <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} color={color}>{t.label}</TabBtn>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Top row: big radials + sparkline trend */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center" }}>

            {/* Radial cluster */}
            <Card style={{ display: "flex", gap: 24, alignItems: "center", padding: "22px 28px" }}>
              <div style={{ textAlign: "center" }}>
                <Radial value={child.avgScore} color={color} size={92} stroke={8} label={`${child.avgScore}%`} sublabel="Average" />
                <p style={{ color: scoreColor(child.avgScore), fontSize: 11, fontWeight: 700, margin: "8px 0 0" }}>{scoreLabel(child.avgScore)}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { l: "Best Subject",   v: child.strengths[0],   col: C.green },
                  { l: "Needs Focus",    v: child.weaknesses[0],  col: C.rose  },
                  { l: "Class Rank",     v: `#${child.rank}/${child.rankTotal}`, col: color },
                  { l: "vs Last Term",   v: `${deltaSign(delta(child.avgScore, child.avgScorePrev))}%`, col: deltaColor(delta(child.avgScore, child.avgScorePrev)) },
                ].map(r => (
                  <div key={r.l}>
                    <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>{r.l}</p>
                    <p style={{ color: r.col, fontSize: 13, fontWeight: 800, margin: 0 }}>{r.v}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly sparkline */}
            <Card style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <SectionTitle>Score Trend (Weekly)</SectionTitle>
              <Sparkline data={child.weeklyProgress} color={color} w="100%" h={80} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ color: C.text3, fontSize: 11 }}>10 weeks ago</span>
                <span style={{ color: color, fontSize: 13, fontWeight: 800 }}>Now: {child.weeklyProgress[child.weeklyProgress.length - 1]}%</span>
              </div>
            </Card>

            {/* Badges */}
            <Card style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: "0 0 4px" }}>Achievements</p>
              {child.badges.map(b => (
                <div key={b.title} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: C.s2, borderRadius: 10, border: `1px solid ${b.color}25` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: b.color + "18", border: `1px solid ${b.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {b.icon}
                  </div>
                  <div>
                    <p style={{ color: b.color, fontSize: 12.5, fontWeight: 800, margin: "0 0 1px" }}>{b.title}</p>
                    <p style={{ color: C.text3, fontSize: 10.5, margin: 0 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Subject snapshot row */}
          <Card>
            <SectionTitle>All Subjects at a Glance</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {child.subjects.map(s => {
                const d = delta(s.score, s.prev);
                return (
                  <div
                    key={s.name}
                    onClick={() => { setSelSub(s.code); setTab("subjects"); }}
                    style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: C.s2, borderRadius: 11, cursor: "pointer", border: `1px solid ${C.border}`, transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = s.color + "60"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + "18", border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: s.color, flexShrink: 0 }}>
                      {s.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ color: deltaColor(d), fontSize: 10.5, fontWeight: 700 }}>{deltaSign(d)}</span>
                          <span style={{ background: gradeColor(s.grade) + "18", color: gradeColor(s.grade), fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 5 }}>{s.grade}</span>
                        </div>
                      </div>
                      <HBar value={s.score} color={s.color} height={5} />
                      <p style={{ color: scoreColor(s.score), fontSize: 11, fontWeight: 700, margin: "4px 0 0", textAlign: "right" }}>{s.score}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming tests + teacher remarks */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card>
              <SectionTitle>Upcoming Tests</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {child.upcomingTests.map(t => (
                  <div key={t.subject} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: t.daysLeft <= 7 ? C.amberBg : C.s2, border: `1px solid ${t.daysLeft <= 7 ? C.amber + "35" : C.border}`, borderRadius: 11 }}>
                    <div style={{ textAlign: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", flexShrink: 0 }}>
                      <p style={{ color: t.daysLeft <= 7 ? C.rose : C.text1, fontSize: 16, fontWeight: 900, margin: 0, lineHeight: 1 }}>{t.daysLeft}</p>
                      <p style={{ color: C.text3, fontSize: 9, margin: 0, fontWeight: 700 }}>DAYS</p>
                    </div>
                    <div>
                      <p style={{ color: C.text1, fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>{t.subject}</p>
                      <p style={{ color: C.text3, fontSize: 11, margin: "0 0 2px" }}>{t.date}</p>
                      <p style={{ color: C.text2, fontSize: 11, margin: 0 }}>{t.chapters}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Teacher Comments</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {child.teacherComments.map((c, i) => (
                  <div key={i} style={{ padding: "12px 14px", background: C.s2, borderRadius: 11, borderLeft: `3px solid ${child.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 800, margin: 0 }}>{c.teacher} <span style={{ color: C.text3, fontWeight: 500 }}>· {c.subject}</span></p>
                      <span style={{ color: C.text3, fontSize: 10.5 }}>{c.date}</span>
                    </div>
                    <p style={{ color: C.text2, fontSize: 12, margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>"{c.comment}"</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: SUBJECTS
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === "subjects" && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
          {/* Subject list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {child.subjects.map(s => (
              <div
                key={s.code}
                onClick={() => setSelSub(selSubject === s.code ? null : s.code)}
                style={{ padding: "14px 16px", background: C.surface, border: `1.5px solid ${selSubject === s.code ? s.color : C.border}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s", boxShadow: selSubject === s.code ? `0 2px 12px ${s.color}18` : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: s.color, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 800, margin: "0 0 1px" }}>{s.name}</p>
                    <p style={{ color: C.text3, fontSize: 10.5, margin: 0 }}>{s.teacher.split(" ").slice(0, 2).join(" ")}</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: scoreColor(s.score), fontSize: 18, fontWeight: 900 }}>{s.score}%</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ background: gradeColor(s.grade) + "18", color: gradeColor(s.grade), fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>{s.grade}</span>
                    <p style={{ color: deltaColor(delta(s.score, s.prev)), fontSize: 10.5, fontWeight: 700, margin: "3px 0 0", textAlign: "right" }}>{deltaSign(delta(s.score, s.prev))} pts</p>
                  </div>
                </div>
                <HBar value={s.score} color={s.color} height={4} />
              </div>
            ))}
          </div>

          {/* Subject deep-dive */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(selSubject ? child.subjects.filter(s => s.code === selSubject) : child.subjects).map(s => {
              const d = delta(s.score, s.prev);
              const termVals = child.termScores.map(t => t[s.name.toLowerCase().replace(/\s/g, "").replace(".", "")] || t[s.code.toLowerCase()] || Object.values(t).find((v, i) => i > 0 && typeof v === "number") || 70);
              return (
                <Card key={s.code}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: s.color + "18", border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: s.color }}>{s.icon}</div>
                      <div>
                        <p style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 2px" }}>{s.name}</p>
                        <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{s.teacher}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: scoreColor(s.score), fontSize: 28, fontWeight: 900, margin: "0 0 2px", lineHeight: 1 }}>{s.score}<span style={{ fontSize: 14, color: C.text3 }}>/{s.max}</span></p>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                        <span style={{ background: gradeColor(s.grade) + "18", color: gradeColor(s.grade), fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 6 }}>{s.grade}</span>
                        <span style={{ color: deltaColor(d), fontSize: 12, fontWeight: 700 }}>{deltaSign(d)} from last term</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar full */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: C.text3, fontSize: 11 }}>Score vs Max</span>
                      <span style={{ color: C.text3, fontSize: 11 }}>{s.score}/{s.max}</span>
                    </div>
                    <HBar value={s.score} color={s.color} height={10} />
                  </div>

                  {/* Term comparison mini-bars */}
                  <div>
                    <p style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>Term-by-Term</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 56 }}>
                      {child.termScores.map((t, i) => {
                        const val = Object.values(t).filter(v => typeof v === "number")[i < child.subjects.indexOf(s) ? 0 : child.subjects.indexOf(s)] || 70;
                        const actualVals = [s.prev - (delta(s.score, s.prev) > 0 ? Math.round(delta(s.score, s.prev) / 1.5) : 0), s.prev, s.score];
                        const av = actualVals[i] || 70;
                        return (
                          <div key={t.term} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                            <span style={{ color: scoreColor(av), fontSize: 11, fontWeight: 700 }}>{av}%</span>
                            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                              <div style={{ width: "100%", background: i === 2 ? s.color : s.color + "50", borderRadius: "4px 4px 0 0", height: `${(av / 100) * 100}%`, minHeight: 6, transition: "height 0.8s ease" }} />
                            </div>
                            <span style={{ color: C.text3, fontSize: 9.5, fontWeight: 700 }}>{t.term.replace("Term ", "T")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: CLASS STANDING
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === "comparison" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card>
              <SectionTitle>Score vs Class</SectionTitle>
              <ClassCompBar label={`${child.name.split(" ")[0]} (You)`} value={child.classComparison.studentAvg} color={color} isStudent />
              <ClassCompBar label="Class Average"  value={child.classComparison.classAvg}   color={C.blue}   isStudent={false} />
              <ClassCompBar label="Class Topper"   value={child.classComparison.topperAvg}  color={C.green}  isStudent={false} />
              <ClassCompBar label="Lowest Score"   value={child.classComparison.lowestAvg}  color={C.rose}   isStudent={false} />

              <div style={{ marginTop: 18, padding: "14px 16px", background: colorBg, border: `1px solid ${color}28`, borderRadius: 11 }}>
                <p style={{ color, fontSize: 13, fontWeight: 800, margin: "0 0 4px" }}>
                  {child.avgScore > child.classComparison.classAvg ? `🎉 ${child.name.split(" ")[0]} is scoring ${child.avgScore - child.classComparison.classAvg}% above class average!` : `⚠️ ${child.avgScore - child.classComparison.classAvg}% below class average — needs improvement.`}
                </p>
                <p style={{ color: C.text2, fontSize: 12, margin: 0 }}>
                  Gap to topper: {child.classComparison.topperAvg - child.avgScore}%
                </p>
              </div>
            </Card>

            <Card>
              <SectionTitle>Percentile Ranking</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center", padding: "16px 0" }}>
                <Radial value={child.percentile} color={color} size={110} stroke={10} label={`${child.percentile}th`} sublabel="Percentile" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ color: C.text2, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                    {child.name.split(" ")[0]} performs better than <strong style={{ color }}>{child.percentile}%</strong> of students in the same grade.
                  </p>
                  <div style={{ background: C.s2, borderRadius: 9, padding: "10px 14px" }}>
                    <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px" }}>Rank Progress</p>
                    <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: 0 }}>
                      #{child.rank} <span style={{ color: C.text3, fontWeight: 500, fontSize: 13 }}>of {child.rankTotal}</span>
                      <span style={{ color: C.green, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
                        ↑ {Math.abs(child.rank - child.rankPrev)} ranks up
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Per-subject standing */}
          <Card>
            <SectionTitle>Subject-wise Class Standing</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {child.subjects.map(s => {
                const classAvg = Math.round(child.classComparison.classAvg - 5 + Math.random() * 10);
                const gap = s.score - classAvg;
                return (
                  <div key={s.code} style={{ padding: "14px 16px", background: C.s2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 700, margin: 0 }}>{s.name}</p>
                      <span style={{ color: deltaColor(gap), fontSize: 11.5, fontWeight: 800 }}>{deltaSign(gap)} class avg</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ color: C.text3, fontSize: 9.5 }}>You</span>
                          <span style={{ color: s.color, fontWeight: 800, fontSize: 11 }}>{s.score}%</span>
                        </div>
                        <HBar value={s.score} color={s.color} height={5} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                          <span style={{ color: C.text3, fontSize: 9.5 }}>Class</span>
                          <span style={{ color: C.text3, fontWeight: 700, fontSize: 11 }}>{classAvg}%</span>
                        </div>
                        <HBar value={classAvg} color={C.text3} height={4} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: AI INSIGHTS
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === "prediction" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* AI Summary */}
          <Card style={{ background: `linear-gradient(135deg, ${colorBg}, ${C.surface})`, border: `1px solid ${color}30` }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "18", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🤖</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <p style={{ color: color, fontSize: 14, fontWeight: 800, margin: 0 }}>AI Performance Summary</p>
                  <span style={{ background: color + "18", color, fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em" }}>LIVE ANALYSIS</span>
                </div>
                <p style={{ color: C.text2, fontSize: 13.5, margin: 0, lineHeight: 1.65 }}>{child.aiSummary}</p>
              </div>
            </div>
          </Card>

          {/* Predictions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { label: "Predicted Next Term", value: child.predictions.nextTerm, icon: "📈", color: C.green,  desc: "Based on current improvement rate" },
              { label: "Final Exam Forecast", value: child.predictions.finalExam, icon: "🎯", color: color,   desc: "Confidence level: 87%" },
              { label: "Rank Prediction",     value: `#${Math.max(1, child.rank - 2)}`, icon: "🏅", color: C.violet, desc: "If current pace maintained" },
            ].map(p => (
              <Card key={p.label} style={{ textAlign: "center", padding: "22px 20px" }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{p.icon}</div>
                <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{p.label}</p>
                <p style={{ color: p.color, fontSize: 28, fontWeight: 900, margin: "0 0 6px", lineHeight: 1 }}>
                  {typeof p.value === "number" ? `${p.value}%` : p.value}
                </p>
                <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{p.desc}</p>
              </Card>
            ))}
          </div>

          {/* Strengths vs Weaknesses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card>
              <SectionTitle><span style={{ color: C.green }}>💪 Strengths</span></SectionTitle>
              {child.subjects.filter(s => s.score >= 80).sort((a,b) => b.score - a.score).map(s => (
                <div key={s.code} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: s.color }}>{s.icon}</div>
                  <span style={{ flex: 1, color: C.text1, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                  <HBar value={s.score} color={s.color} height={5} />
                  <span style={{ color: C.green, fontSize: 13, fontWeight: 800, minWidth: 36, textAlign: "right" }}>{s.score}%</span>
                </div>
              ))}
            </Card>
            <Card>
              <SectionTitle><span style={{ color: C.rose }}>⚠️ Areas to Improve</span></SectionTitle>
              {child.subjects.filter(s => s.score < 80).sort((a,b) => a.score - b.score).map(s => (
                <div key={s.code} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: s.color }}>{s.icon}</div>
                  <span style={{ flex: 1, color: C.text1, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                  <HBar value={s.score} color={s.color} height={5} />
                  <span style={{ color: C.rose, fontSize: 13, fontWeight: 800, minWidth: 36, textAlign: "right" }}>{s.score}%</span>
                </div>
              ))}
              {child.subjects.filter(s => s.score < 80).length === 0 && (
                <p style={{ color: C.green, fontSize: 13, fontWeight: 700, textAlign: "center", padding: "20px 0" }}>🎉 All subjects above 80%!</p>
              )}
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <SectionTitle>🧠 AI Recommendations</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[
                { type: "Study Plan",    icon: "📅", text: `Dedicate 45 min/day to ${child.weaknesses[0]} — focus on weak chapters first.`,      color: C.blue   },
                { type: "Peer Learning", icon: "👥", text: "Join the school study group for Sciences — collaborative learning boosts retention.",  color: C.violet },
                { type: "Practice",      icon: "📝", text: `Complete 2 past year papers per week for ${child.weaknesses[0]} before finals.`,       color: C.amber  },
                { type: "Celebrate",     icon: "🎯", text: `${child.strengths[0]} is excellent! Maintain this with weekly revision.`,               color: C.green  },
              ].map(r => (
                <div key={r.type} style={{ padding: "14px 16px", background: r.color + "0a", border: `1px solid ${r.color}25`, borderRadius: 12, display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
                  <div>
                    <p style={{ color: r.color, fontSize: 11.5, fontWeight: 800, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{r.type}</p>
                    <p style={{ color: C.text2, fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: STUDY HOURS
      ═══════════════════════════════════════════════════════════════════ */}
      {tab === "study" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { l: "This Month",      v: `${child.monthlyHours[child.monthlyHours.length - 1].study}h`, color: color    },
              { l: "Monthly Target",  v: `${child.monthlyHours[0].recommended}h`,                       color: C.text2  },
              { l: "Total (6 Mo.)",   v: `${child.monthlyHours.reduce((a,m) => a + m.study, 0)}h`,     color: C.violet },
            ].map(m => (
              <Card key={m.l} style={{ textAlign: "center" }}>
                <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>{m.l}</p>
                <p style={{ color: m.color, fontSize: 28, fontWeight: 900, margin: 0 }}>{m.v}</p>
              </Card>
            ))}
          </div>

          <Card>
            <SectionTitle>Study Hours vs Recommended</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {child.monthlyHours.map(m => (
                <div key={m.month}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: C.text1, fontSize: 13, fontWeight: 700 }}>{m.month}</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ color: m.study >= m.recommended ? C.green : C.amber, fontSize: 12, fontWeight: 800 }}>Actual: {m.study}h</span>
                      <span style={{ color: C.text3, fontSize: 12 }}>Target: {m.recommended}h</span>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 10, background: C.s3, borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(m.study / 80) * 100}%`, background: m.study >= m.recommended ? C.green : color, borderRadius: 5, transition: "width 1.2s ease" }} />
                    <div style={{ position: "absolute", left: `${(m.recommended / 80) * 100}%`, top: -2, width: 2, height: "calc(100% + 4px)", background: C.rose, borderRadius: 2 }} title={`Target: ${m.recommended}h`} />
                  </div>
                  {m.study < m.recommended && (
                    <p style={{ color: C.amber, fontSize: 10.5, fontWeight: 600, margin: "3px 0 0", textAlign: "right" }}>
                      {m.recommended - m.study}h below target
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 14 }}>
              {[{ c: color, l: "Study Hours" }, { c: C.rose, l: "Monthly Target Line" }].map(k => (
                <div key={k.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: k.c }} />
                  <span style={{ color: C.text3, fontSize: 11 }}>{k.l}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap'); *{box-sizing:border-box}`}</style>
    </div>
  );
}