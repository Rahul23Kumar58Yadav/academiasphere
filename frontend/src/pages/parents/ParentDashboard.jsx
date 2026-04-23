import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#faf9f7",
  surface:  "#ffffff",
  surface2: "#f5f2ee",
  border:   "#ede9e3",
  borderHov:"#d4c9b8",
  text1:    "#1a1612",
  text2:    "#6b6057",
  text3:    "#a89d93",
  accent:   "#c96b2e",
  accentL:  "#f4ede6",
  accentBg: "#c96b2e12",
  green:    "#2d7d4a",
  greenBg:  "#2d7d4a0e",
  greenL:   "#e8f5ed",
  rose:     "#c0392b",
  roseBg:   "#c0392b0e",
  roseL:    "#fdecea",
  amber:    "#b8640a",
  amberBg:  "#b8640a0e",
  amberL:   "#fef3e2",
  blue:     "#1d5fa6",
  blueBg:   "#1d5fa60e",
  blueL:    "#e8f0fb",
  violet:   "#5b3fa6",
  violetBg: "#5b3fa60e",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const PARENT = { name: "Sunita Reddy", children: 2 };

const CHILDREN = [
  {
    id: 1,
    name: "Aryan Reddy",
    grade: "Grade 10 – A",
    school: "Greenwood High School",
    rollNo: "GHS-2024-1047",
    age: 16,
    avatar: "AR",
    color: C.blue,
    colorBg: C.blueBg,
    colorL: C.blueL,
    attendance: 88,
    avgScore: 79,
    rank: 7,
    totalStudents: 42,
    feesDue: 12500,
    feesStatus: "pending",
    nextExam: { subject: "Mathematics", date: "Mar 18", daysLeft: 5 },
    subjects: [
      { name: "Mathematics", score: 74, grade: "B",    color: C.amber  },
      { name: "Physics",     score: 81, grade: "A–",   color: C.blue   },
      { name: "Chemistry",   score: 77, grade: "B+",   color: C.green  },
      { name: "English",     score: 83, grade: "A–",   color: C.violet },
      { name: "Computer Sc.",score: 91, grade: "A+",   color: C.accent },
    ],
    recentMarks: [72, 75, 79, 77, 81, 79],
    attendanceMonths: [
      { month: "Oct", pct: 91 }, { month: "Nov", pct: 85 },
      { month: "Dec", pct: 78 }, { month: "Jan", pct: 92 },
      { month: "Feb", pct: 88 }, { month: "Mar", pct: 82 },
    ],
    pendingAssignments: 2,
    recentActivities: [
      { type: "score",   text: "Physics test scored 81%",           time: "2h ago",  icon: "📊" },
      { type: "attend",  text: "Attended all 6 classes today",      time: "Today",   icon: "✓"  },
      { type: "assign",  text: "Chemistry assignment submitted",     time: "Yesterday",icon: "📝" },
    ],
  },
  {
    id: 2,
    name: "Priya Reddy",
    grade: "Grade 7 – B",
    school: "Greenwood High School",
    rollNo: "GHS-2024-0728",
    age: 12,
    avatar: "PR",
    color: C.accent,
    colorBg: C.accentBg,
    colorL: C.accentL,
    attendance: 95,
    avgScore: 88,
    rank: 3,
    totalStudents: 38,
    feesDue: 0,
    feesStatus: "paid",
    nextExam: { subject: "Science", date: "Mar 20", daysLeft: 7 },
    subjects: [
      { name: "Mathematics", score: 92, grade: "A+",   color: C.accent },
      { name: "Science",     score: 88, grade: "A",    color: C.green  },
      { name: "English",     score: 90, grade: "A+",   color: C.violet },
      { name: "Social St.",  score: 84, grade: "A–",   color: C.blue   },
      { name: "Hindi",       score: 86, grade: "A",    color: C.amber  },
    ],
    recentMarks: [84, 86, 88, 87, 90, 88],
    attendanceMonths: [
      { month: "Oct", pct: 98 }, { month: "Nov", pct: 96 },
      { month: "Dec", pct: 92 }, { month: "Jan", pct: 97 },
      { month: "Feb", pct: 95 }, { month: "Mar", pct: 94 },
    ],
    pendingAssignments: 0,
    recentActivities: [
      { type: "score",  text: "English essay scored 90%",        time: "4h ago",   icon: "🌟" },
      { type: "rank",   text: "Ranked 3rd in class this month",  time: "Yesterday",icon: "🏆" },
      { type: "attend", text: "Perfect attendance this week",    time: "3 days ago",icon: "✓" },
    ],
  },
];

const ANNOUNCEMENTS = [
  { id: 1, title: "Annual Sports Day", body: "Sports Day will be held on March 25th. Students must wear sports uniform.", date: "Mar 13", type: "event",   icon: "🏃" },
  { id: 2, title: "PTM Scheduled",     body: "Parent-Teacher Meeting is scheduled for March 22nd, 10:00 AM – 1:00 PM.", date: "Mar 12", type: "meeting", icon: "👥" },
  { id: 3, title: "Fee Reminder",      body: "Second installment fees are due by March 20th. Kindly pay via the portal.", date: "Mar 11", type: "finance", icon: "💳" },
  { id: 4, title: "Exam Timetable",    body: "Unit test timetable for March has been uploaded. Please check the results section.", date: "Mar 10", type: "exam",    icon: "📋" },
];

const FEE_HISTORY = [
  { label: "Jan 2025 – Term 1", amount: 12500, status: "paid",    date: "Jan 10" },
  { label: "Nov 2024 – Term 2", amount: 12500, status: "paid",    date: "Nov 05" },
  { label: "Aug 2024 – Term 3", amount: 12500, status: "paid",    date: "Aug 12" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function gradeColor(g) {
  if (g.startsWith("A")) return C.green;
  if (g.startsWith("B")) return C.amber;
  return C.rose;
}

function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.round(start));
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return val;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 100, h = 32 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 4)}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`spk-${color.replace(/[#,]/g,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spk-${color.replace(/[#,]/g,"")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / rng) * (h - 4)}
        r="3" fill={color}
      />
    </svg>
  );
}

// ─── Radial Progress ─────────────────────────────────────────────────────────
function Radial({ value, color, size = 64, stroke = 5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede9e3" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.4s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: 13, fontWeight: 800, lineHeight: 1 }}>{value}%</span>
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function AttendanceBar({ months, color }) {
  const max = 100;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
      {months.map(m => (
        <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", background: color + "22", borderRadius: "4px 4px 0 0", overflow: "hidden", height: `${(m.pct / max) * 100}%`, minHeight: 4 }}>
              <div style={{ width: "100%", height: "100%", background: `linear-gradient(180deg, ${color}, ${color}cc)`, borderRadius: "4px 4px 0 0" }} />
            </div>
          </div>
          <span style={{ color: C.text3, fontSize: 9, fontWeight: 700 }}>{m.month.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Subject Score Row ────────────────────────────────────────────────────────
function SubjectRow({ sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: sub.color, flexShrink: 0 }} />
      <span style={{ color: C.text2, fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.name}</span>
      <div style={{ width: 90, height: 5, background: C.surface2, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${sub.score}%`, height: "100%", background: sub.color, borderRadius: 3, transition: "width 1s ease" }} />
      </div>
      <span style={{ color: scoreColor(sub.score), fontSize: 12, fontWeight: 700, minWidth: 30, textAlign: "right" }}>{sub.score}%</span>
      <span style={{ background: gradeColor(sub.grade) + "18", color: gradeColor(sub.grade), fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5, minWidth: 28, textAlign: "center" }}>{sub.grade}</span>
    </div>
  );
}

// ─── Child Summary Card ───────────────────────────────────────────────────────
function ChildCard({ child, onSelect, selected }) {
  const navigate = useNavigate();
  const isSelected = selected === child.id;
  return (
    <div
      onClick={() => onSelect(child.id)}
      style={{
        background: C.surface,
        border: `1.5px solid ${isSelected ? child.color : C.border}`,
        borderRadius: 16, padding: "20px", cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: isSelected ? `0 4px 20px ${child.color}18` : "none",
      }}
    >
      {/* Avatar + Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: child.colorL, border: `2.5px solid ${child.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: child.color, fontWeight: 900, fontSize: 16 }}>{child.avatar}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{child.name}</p>
          <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{child.grade}</p>
        </div>
        {child.feesDue > 0 && (
          <span style={{ background: C.roseL, color: C.rose, fontSize: 9.5, fontWeight: 800, padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>
            FEE DUE
          </span>
        )}
        {child.feesDue === 0 && (
          <span style={{ background: C.greenL, color: C.green, fontSize: 9.5, fontWeight: 800, padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>
            PAID ✓
          </span>
        )}
      </div>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Attendance", value: `${child.attendance}%`, color: attendColor(child.attendance) },
          { label: "Avg Score",  value: `${child.avgScore}%`,  color: scoreColor(child.avgScore)   },
          { label: "Class Rank", value: `#${child.rank}`,       color: child.color                  },
        ].map(m => (
          <div key={m.label} style={{ background: C.surface2, borderRadius: 9, padding: "8px 10px", textAlign: "center" }}>
            <p style={{ color: C.text3, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>{m.label}</p>
            <p style={{ color: m.color, fontSize: 15, fontWeight: 900, margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Trend Sparkline */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div>
          <p style={{ color: C.text3, fontSize: 9, fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px" }}>Score Trend</p>
          <Sparkline data={child.recentMarks} color={child.color} w={90} h={28} />
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: C.text3, fontSize: 9, fontWeight: 700, margin: "0 0 2px" }}>NEXT EXAM</p>
          <p style={{ color: C.amber, fontSize: 11, fontWeight: 700, margin: 0 }}>{child.nextExam.subject}</p>
          <p style={{ color: C.text3, fontSize: 10, margin: 0 }}>{child.nextExam.date} · {child.nextExam.daysLeft}d left</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 7, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        {[
          { label: "Performance", path: `/parent/children/${child.id}/performance` },
          { label: "Attendance",  path: `/parent/children/${child.id}/attendance`  },
          { label: "Results",     path: `/parent/children/${child.id}/results`      },
        ].map(a => (
          <button
            key={a.label}
            onClick={e => { e.stopPropagation(); navigate(a.path); }}
            style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 4px", color: C.text2, fontSize: 10.5, fontWeight: 700, cursor: "pointer", transition: "all 0.14s" }}
            onMouseEnter={e => { e.currentTarget.style.background = child.colorL; e.currentTarget.style.color = child.color; e.currentTarget.style.borderColor = child.color + "40"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.color = C.text2; e.currentTarget.style.borderColor = C.border; }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Selected Child Detail Panel ──────────────────────────────────────────────
function ChildDetail({ child }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Subject Scores */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: 0 }}>Subject Performance</p>
          <span style={{ background: child.colorL, color: child.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
            Avg: {child.avgScore}%
          </span>
        </div>
        {child.subjects.map(s => <SubjectRow key={s.name} sub={s} />)}
      </div>

      {/* Attendance Bar */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: 0 }}>Monthly Attendance</p>
          <span style={{ background: attendColor(child.attendance) + "18", color: attendColor(child.attendance), fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
            {child.attendance}% Overall
          </span>
        </div>
        <AttendanceBar months={child.attendanceMonths} color={child.color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {child.attendanceMonths.map(m => (
            <div key={m.month} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ color: attendColor(m.pct), fontSize: 10, fontWeight: 700 }}>{m.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>Recent Activity</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {child.recentActivities.map((act, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: C.surface2, borderRadius: 9 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{act.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text1, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{act.text}</p>
                <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Status */}
      {child.feesDue > 0 && (
        <div style={{ background: C.roseL, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: C.rose, fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>Fee Payment Due</p>
            <p style={{ color: C.text2, fontSize: 12, margin: 0 }}>Due by March 20, 2025</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: C.rose, fontSize: 18, fontWeight: 900, margin: "0 0 6px" }}>₹{child.feesDue.toLocaleString()}</p>
            <button style={{ background: C.rose, border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Pay Now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quick Stat Card ──────────────────────────────────────────────────────────
function StatCard({ label, value, sublabel, icon, bg, color, trend }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -16, right: -16, width: 72, height: 72, borderRadius: "50%", background: bg, opacity: 0.6 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <p style={{ color: C.text3, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{label}</p>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
          {icon}
        </div>
      </div>
      <p style={{ color, fontSize: 26, fontWeight: 900, margin: "0 0 4px", lineHeight: 1 }}>{value}</p>
      <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>{sublabel}</p>
      {trend && (
        <p style={{ color: trend > 0 ? C.green : C.rose, fontSize: 11, margin: "6px 0 0", fontWeight: 600 }}>
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  );
}

// ─── Today's Timetable ────────────────────────────────────────────────────────
const TIMETABLE = [
  { child: "Aryan",  subject: "Physics Lab",       time: "08:30 – 10:00", room: "Lab 101", status: "done"     },
  { child: "Priya",  subject: "English",            time: "09:00 – 09:45", room: "Rm 112",  status: "done"     },
  { child: "Aryan",  subject: "Mathematics",        time: "10:30 – 11:30", room: "Rm 204",  status: "ongoing"  },
  { child: "Priya",  subject: "Mathematics",        time: "10:45 – 11:30", room: "Rm 207",  status: "ongoing"  },
  { child: "Aryan",  subject: "Computer Science",   time: "02:00 – 03:30", room: "Comp Lab",status: "upcoming" },
  { child: "Priya",  subject: "Science",            time: "02:00 – 02:45", room: "Lab 202", status: "upcoming" },
];

const STATUS_CFG = {
  done:     { color: C.green,  bg: C.greenL,  label: "Done"    },
  ongoing:  { color: C.blue,   bg: C.blueL,   label: "Now"     },
  upcoming: { color: C.amber,  bg: C.amberL,  label: "Upcoming"},
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(1);
  const [activeAnnounce, setActiveAnnounce] = useState(0);
  const selectedChild = CHILDREN.find(c => c.id === selected);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Summary stats across children
  const totalFeesDue = CHILDREN.reduce((a, c) => a + c.feesDue, 0);
  const avgAttendance = Math.round(CHILDREN.reduce((a, c) => a + c.attendance, 0) / CHILDREN.length);
  const avgScore      = Math.round(CHILDREN.reduce((a, c) => a + c.avgScore, 0) / CHILDREN.length);

  return (
    <div style={{ padding: "28px 28px 40px", background: C.bg, minHeight: "100vh" }}>

      {/* ── Greeting Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <p style={{ color: C.text3, fontSize: 13, margin: "0 0 4px" }}>{greeting},</p>
          <h1 style={{ color: C.text1, fontSize: 26, fontWeight: 900, margin: "0 0 4px", fontFamily: "Georgia, serif", letterSpacing: "-0.02em" }}>
            {PARENT.name}
          </h1>
          <p style={{ color: C.text2, fontSize: 13.5, margin: 0 }}>
            Tracking {PARENT.children} children · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => navigate("/parent/fees/pay")}
          style={{ background: C.accent, border: "none", borderRadius: 11, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          <span>💳</span> Pay Fees
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Children"       value={PARENT.children}    sublabel="Both at Greenwood High"    icon="👨‍👩‍👧" bg={C.blueBg}    color={C.blue}   trend={null} />
        <StatCard label="Avg Attendance" value={`${avgAttendance}%`} sublabel="Across both children"     icon="📋"      bg={C.greenBg}  color={C.green}  trend={2.4}  />
        <StatCard label="Avg Score"      value={`${avgScore}%`}      sublabel="Combined performance"     icon="📊"      bg={C.amberBg}  color={C.amber}  trend={3.1}  />
        <StatCard label="Fees Due"       value={totalFeesDue > 0 ? `₹${totalFeesDue.toLocaleString()}` : "Clear"} sublabel={totalFeesDue > 0 ? "Due by Mar 20" : "All fees paid ✓"} icon="💳" bg={totalFeesDue > 0 ? C.roseBg : C.greenBg} color={totalFeesDue > 0 ? C.rose : C.green} trend={null} />
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 24 }}>

        {/* Left: Child Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: C.text1, fontSize: 16, fontWeight: 800, margin: 0 }}>My Children</h2>
            <button
              onClick={() => navigate("/parent/children")}
              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", color: C.text2, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
            >
              See All →
            </button>
          </div>
          {CHILDREN.map(child => (
            <ChildCard key={child.id} child={child} onSelect={setSelected} selected={selected} />
          ))}
        </div>

        {/* Right: Selected Child Detail */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ color: C.text1, fontSize: 16, fontWeight: 800, margin: 0 }}>
              {selectedChild.name.split(" ")[0]}'s Overview
            </h2>
            <div style={{ display: "flex", gap: 6 }}>
              {CHILDREN.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  style={{
                    background: selected === c.id ? c.colorL : C.surface2,
                    border: `1px solid ${selected === c.id ? c.color + "40" : C.border}`,
                    borderRadius: 7, padding: "5px 12px",
                    color: selected === c.id ? c.color : C.text3,
                    fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <ChildDetail child={selectedChild} />
        </div>
      </div>

      {/* ── Today's Timetable ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: 0 }}>Today's Timetable</h2>
            <span style={{ color: C.text3, fontSize: 12 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long" })}</span>
          </div>

          {/* Child filter pills */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["All", ...CHILDREN.map(c => c.name.split(" ")[0])].map(f => (
              <button
                key={f}
                style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", color: C.text2, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TIMETABLE.map((t, i) => {
              const cfg = STATUS_CFG[t.status];
              const child = CHILDREN.find(c => c.name.startsWith(t.child));
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: t.status === "ongoing" ? C.blueL : C.surface2, borderRadius: 10, border: `1px solid ${t.status === "ongoing" ? C.blue + "30" : C.border}` }}>
                  <div style={{ width: 3, height: 36, borderRadius: 3, background: child?.color || C.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p>
                      <span style={{ background: child?.colorL || C.accentL, color: child?.color || C.accent, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{t.child}</span>
                    </div>
                    <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{t.time} · {t.room}</p>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>
                    {cfg.label}
                    {t.status === "ongoing" && " ●"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Announcements ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: 0 }}>School Announcements</h2>
            <span style={{ background: C.accentBg, color: C.accent, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>{ANNOUNCEMENTS.length} new</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {ANNOUNCEMENTS.map((ann, i) => (
              <div
                key={ann.id}
                onClick={() => setActiveAnnounce(activeAnnounce === i ? -1 : i)}
                style={{
                  background: activeAnnounce === i ? C.accentBg : C.surface2,
                  border: `1px solid ${activeAnnounce === i ? C.accent + "30" : C.border}`,
                  borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{ann.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                      <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ann.title}</p>
                      <span style={{ color: C.text3, fontSize: 10, flexShrink: 0 }}>{ann.date}</span>
                    </div>
                    {activeAnnounce === i && (
                      <p style={{ color: C.text2, fontSize: 12, margin: "4px 0 0", lineHeight: 1.5 }}>{ann.body}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}