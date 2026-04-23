import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#faf9f7",
  surface:  "#ffffff",
  surface2: "#f5f2ee",
  surface3: "#f0ece6",
  border:   "#ede9e3",
  text1:    "#1a1612",
  text2:    "#6b6057",
  text3:    "#a89d93",
  accent:   "#c96b2e",
  accentBg: "#c96b2e12",
  accentL:  "#f4ede6",
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
  blueL:    "#e8f0fb",
  blueBg:   "#1d5fa60e",
  violet:   "#5b3fa6",
  violetL:  "#eeebfb",
  violetBg: "#5b3fa60e",
};

// ─── Rich Data ────────────────────────────────────────────────────────────────
const CHILDREN = [
  {
    id: 1,
    name: "Aryan Reddy",
    fullName: "Aryan Suresh Reddy",
    grade: "Grade 10 – Section A",
    school: "Greenwood High School",
    rollNo: "GHS-2024-1047",
    dob: "March 8, 2009",
    age: 16,
    avatar: "AR",
    color: C.blue,
    colorBg: C.blueBg,
    colorL: C.blueL,
    classTeacher: "Mrs. Priya Nambiar",
    houseColor: "Blue House",
    bloodGroup: "B+",
    attendance: 88,
    avgScore: 79,
    rank: 7,
    rankTotal: 42,
    feesDue: 12500,
    feesStatus: "pending",
    pendingAssignments: 2,
    completedAssignments: 18,
    certificates: 3,
    nextExam: { subject: "Mathematics", date: "Mar 18", daysLeft: 5 },
    achievements: ["Science Olympiad – Finalist", "Chess Club Captain", "School Cricket Team"],
    subjects: [
      { name: "Mathematics",   score: 74, maxScore: 100, grade: "B",  color: C.amber,  teacher: "Mr. Rajesh Kumar",    lastTest: "Mar 5", trend: "up"   },
      { name: "Physics",       score: 81, maxScore: 100, grade: "A–", color: C.blue,   teacher: "Mrs. Leela Sharma",   lastTest: "Mar 8", trend: "up"   },
      { name: "Chemistry",     score: 77, maxScore: 100, grade: "B+", color: C.green,  teacher: "Mr. Anand Pillai",    lastTest: "Mar 2", trend: "flat" },
      { name: "English",       score: 83, maxScore: 100, grade: "A–", color: C.violet, teacher: "Mrs. Sunita Mehta",   lastTest: "Mar 6", trend: "up"   },
      { name: "Computer Sc.",  score: 91, maxScore: 100, grade: "A+", color: C.accent, teacher: "Mr. Kiran Nair",      lastTest: "Mar 9", trend: "up"   },
      { name: "Social Studies",score: 69, maxScore: 100, grade: "C+", color: C.rose,   teacher: "Mrs. Geetha Rao",     lastTest: "Mar 3", trend: "down" },
    ],
    examHistory: [
      { term: "Unit Test 1", math: 68, physics: 75, chemistry: 72, english: 79, cs: 88, social: 64 },
      { term: "Unit Test 2", math: 72, physics: 78, chemistry: 75, english: 81, cs: 90, social: 67 },
      { term: "Unit Test 3", math: 74, physics: 81, chemistry: 77, english: 83, cs: 91, social: 69 },
    ],
    attendanceDetail: [
      { month: "Sep", present: 22, total: 24, pct: 92 },
      { month: "Oct", present: 21, total: 25, pct: 84 },
      { month: "Nov", present: 19, total: 23, pct: 83 },
      { month: "Dec", present: 20, total: 22, pct: 91 },
      { month: "Jan", present: 23, total: 26, pct: 88 },
      { month: "Feb", present: 20, total: 23, pct: 87 },
      { month: "Mar", present: 9,  total: 10, pct: 90 },
    ],
    recentAssignments: [
      { name: "Calculus Problem Set 4",  subject: "Mathematics",  due: "Mar 15", status: "pending",   score: null },
      { name: "Newton's Laws Lab Report",subject: "Physics",      due: "Mar 12", status: "submitted", score: null },
      { name: "Organic Chemistry Notes", subject: "Chemistry",    due: "Mar 10", status: "graded",    score: 36   },
      { name: "Essay: Climate Change",   subject: "English",      due: "Mar 8",  status: "graded",    score: 43   },
      { name: "Python Recursion Project",subject: "Computer Sc.", due: "Mar 6",  status: "graded",    score: 48   },
    ],
    fees: [
      { term: "Term 2 – 2025", amount: 12500, status: "pending", due: "Mar 20, 2025"  },
      { term: "Term 1 – 2025", amount: 12500, status: "paid",    paid: "Jan 10, 2025" },
      { term: "Term 3 – 2024", amount: 12500, status: "paid",    paid: "Aug 12, 2024" },
    ],
    teacherRemarks: [
      { teacher: "Mrs. Nambiar",   subject: "Class Teacher", remark: "Aryan is focused and shows leadership qualities. Should improve Social Studies.", date: "Mar 10" },
      { teacher: "Mr. Kiran Nair", subject: "Computer Sc.",  remark: "Exceptional student. His Python project was outstanding.", date: "Mar 9" },
      { teacher: "Mr. Rajesh",     subject: "Mathematics",   remark: "Needs to practice algebra and coordinate geometry consistently.", date: "Mar 7" },
    ],
  },
  {
    id: 2,
    name: "Priya Reddy",
    fullName: "Priya Suresh Reddy",
    grade: "Grade 7 – Section B",
    school: "Greenwood High School",
    rollNo: "GHS-2024-0728",
    dob: "July 14, 2012",
    age: 12,
    avatar: "PR",
    color: C.accent,
    colorBg: C.accentBg,
    colorL: C.accentL,
    classTeacher: "Mrs. Anitha Krishnan",
    houseColor: "Red House",
    bloodGroup: "O+",
    attendance: 95,
    avgScore: 88,
    rank: 3,
    rankTotal: 38,
    feesDue: 0,
    feesStatus: "paid",
    pendingAssignments: 0,
    completedAssignments: 24,
    certificates: 7,
    nextExam: { subject: "Science", date: "Mar 20", daysLeft: 7 },
    achievements: ["School Topper – Term 1", "Art Competition 1st Prize", "Dance Team Member", "Best Student Award"],
    subjects: [
      { name: "Mathematics",  score: 92, maxScore: 100, grade: "A+", color: C.accent, teacher: "Mrs. Devi Prasad",    lastTest: "Mar 7",  trend: "up"   },
      { name: "Science",      score: 88, maxScore: 100, grade: "A",  color: C.green,  teacher: "Mr. Sanjay Iyer",     lastTest: "Mar 8",  trend: "flat" },
      { name: "English",      score: 90, maxScore: 100, grade: "A+", color: C.violet, teacher: "Mrs. Kavitha Nair",   lastTest: "Mar 6",  trend: "up"   },
      { name: "Social St.",   score: 84, maxScore: 100, grade: "A–", color: C.blue,   teacher: "Mr. Prakash Sharma",  lastTest: "Mar 4",  trend: "up"   },
      { name: "Hindi",        score: 86, maxScore: 100, grade: "A",  color: C.amber,  teacher: "Mrs. Radha Joshi",    lastTest: "Mar 5",  trend: "flat" },
      { name: "Sanskrit",     score: 79, maxScore: 100, grade: "B+", color: C.rose,   teacher: "Mrs. Geeta Sharma",   lastTest: "Mar 3",  trend: "up"   },
    ],
    examHistory: [
      { term: "Unit Test 1", math: 88, science: 84, english: 87, social: 80, hindi: 83, sanskrit: 74 },
      { term: "Unit Test 2", math: 90, science: 86, english: 88, social: 82, hindi: 85, sanskrit: 77 },
      { term: "Unit Test 3", math: 92, science: 88, english: 90, social: 84, hindi: 86, sanskrit: 79 },
    ],
    attendanceDetail: [
      { month: "Sep", present: 24, total: 24, pct: 100 },
      { month: "Oct", present: 24, total: 25, pct: 96  },
      { month: "Nov", present: 22, total: 23, pct: 96  },
      { month: "Dec", present: 21, total: 22, pct: 95  },
      { month: "Jan", present: 25, total: 26, pct: 96  },
      { month: "Feb", present: 22, total: 23, pct: 96  },
      { month: "Mar", present: 9,  total: 10, pct: 90  },
    ],
    recentAssignments: [
      { name: "Polynomial Equations",   subject: "Mathematics", due: "Mar 10", status: "graded",  score: 46 },
      { name: "Light & Optics Notes",   subject: "Science",     due: "Mar 8",  status: "graded",  score: 44 },
      { name: "Creative Writing Piece", subject: "English",     due: "Mar 6",  status: "graded",  score: 48 },
      { name: "History Map Activity",   subject: "Social St.",  due: "Mar 4",  status: "graded",  score: 42 },
      { name: "Poem Recitation",        subject: "Hindi",       due: "Mar 2",  status: "graded",  score: 45 },
    ],
    fees: [
      { term: "Term 2 – 2025", amount: 10800, status: "paid", paid: "Mar 1, 2025"  },
      { term: "Term 1 – 2025", amount: 10800, status: "paid", paid: "Jan 8, 2025"  },
      { term: "Term 3 – 2024", amount: 10800, status: "paid", paid: "Aug 10, 2024" },
    ],
    teacherRemarks: [
      { teacher: "Mrs. Anitha",    subject: "Class Teacher", remark: "Priya is an exceptional student. She is a role model for the class.", date: "Mar 11" },
      { teacher: "Mrs. Devi",      subject: "Mathematics",   remark: "Perfect scores in recent units. Should try advanced olympiad problems.", date: "Mar 10" },
      { teacher: "Mrs. Kavitha",   subject: "English",       remark: "Outstanding creative writing and comprehension skills.", date: "Mar 8" },
    ],
  },
];

const TABS = [
  { key: "overview",     label: "Overview"     },
  { key: "subjects",     label: "Subjects"     },
  { key: "attendance",   label: "Attendance"   },
  { key: "assignments",  label: "Assignments"  },
  { key: "fees",         label: "Fees"         },
  { key: "remarks",      label: "Remarks"      },
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
  if (!g) return C.text3;
  if (g.startsWith("A")) return C.green;
  if (g.startsWith("B")) return C.amber;
  return C.rose;
}
function trendIcon(t) {
  return t === "up" ? "↑" : t === "down" ? "↓" : "→";
}
function trendColor(t) {
  return t === "up" ? C.green : t === "down" ? C.rose : C.text3;
}

// ─── Radial Ring ─────────────────────────────────────────────────────────────
function Radial({ value, color, size = 72, stroke = 6 }) {
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
        <span style={{ color, fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{value}%</span>
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 80, h = 28 }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / rng) * (h - 4)}
        r="3" fill={color} />
    </svg>
  );
}

// ─── Attendance Bar Chart ─────────────────────────────────────────────────────
function AttendBars({ data, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(m => (
        <div key={m.month} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.text3, fontSize: 11.5, fontWeight: 700, minWidth: 28 }}>{m.month}</span>
          <div style={{ flex: 1, height: 8, background: C.surface3, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${m.pct}%`, height: "100%", background: attendColor(m.pct), borderRadius: 4, transition: "width 1s ease" }} />
          </div>
          <span style={{ color: attendColor(m.pct), fontSize: 11.5, fontWeight: 800, minWidth: 36, textAlign: "right" }}>{m.pct}%</span>
          <span style={{ color: C.text3, fontSize: 10.5, minWidth: 60 }}>{m.present}/{m.total} days</span>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ child }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Profile Card */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Big Avatar */}
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: child.colorL, border: `3px solid ${child.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: child.color, fontWeight: 900, fontSize: 24 }}>{child.avatar}</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <div>
                <h2 style={{ color: C.text1, fontSize: 20, fontWeight: 900, margin: "0 0 2px", fontFamily: "Georgia, serif" }}>{child.fullName}</h2>
                <p style={{ color: C.text2, fontSize: 13, margin: 0 }}>{child.grade} · {child.school}</p>
              </div>
              <span style={{ background: child.colorL, color: child.color, fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, flexShrink: 0 }}>
                Rank #{child.rank} of {child.rankTotal}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
              {[
                { l: "Roll No",      v: child.rollNo,          c: C.text1 },
                { l: "Date of Birth",v: child.dob,             c: C.text1 },
                { l: "Class Teacher",v: child.classTeacher,    c: C.text1 },
                { l: "Blood Group",  v: child.bloodGroup,      c: C.rose  },
              ].map(f => (
                <div key={f.l} style={{ background: C.surface2, borderRadius: 9, padding: "10px 12px" }}>
                  <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>{f.l}</p>
                  <p style={{ color: f.c, fontSize: 12, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Attendance",           value: `${child.attendance}%`, color: attendColor(child.attendance), bg: attendColor(child.attendance) + "12" },
          { label: "Avg Score",            value: `${child.avgScore}%`,   color: scoreColor(child.avgScore),    bg: scoreColor(child.avgScore) + "12"    },
          { label: "Pending Assignments",  value: child.pendingAssignments, color: child.pendingAssignments > 0 ? C.rose : C.green, bg: child.pendingAssignments > 0 ? C.roseBg : C.greenBg },
          { label: "Certificates Earned",  value: child.certificates,    color: C.violet, bg: C.violetBg },
        ].map(m => (
          <div key={m.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{m.label}</p>
            <p style={{ color: m.color, fontSize: 24, fontWeight: 900, margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Quick subject summary + achievements */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Top & weak subjects */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>Subject Quick View</p>
          {child.subjects.map(s => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ color: C.text2, fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              <div style={{ width: 80, height: 4, background: C.surface3, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${s.score}%`, height: "100%", background: s.color, borderRadius: 2 }} />
              </div>
              <span style={{ color: scoreColor(s.score), fontSize: 12, fontWeight: 800, minWidth: 30, textAlign: "right" }}>{s.score}%</span>
              <span style={{ color: trendColor(s.trend), fontSize: 12, fontWeight: 700 }}>{trendIcon(s.trend)}</span>
            </div>
          ))}
        </div>

        {/* Achievements + Next exam */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", flex: 1 }}>
            <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>Achievements</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {child.achievements.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: C.surface2, borderRadius: 8 }}>
                  <span style={{ color: C.amber, fontSize: 14 }}>🏆</span>
                  <span style={{ color: C.text1, fontSize: 12.5, fontWeight: 600 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next exam alert */}
          <div style={{ background: C.amberL, border: `1px solid ${C.amber}30`, borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ color: C.amber, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Next Exam</p>
            <p style={{ color: C.text1, fontSize: 16, fontWeight: 900, margin: "0 0 2px" }}>{child.nextExam.subject}</p>
            <p style={{ color: C.text2, fontSize: 12, margin: "0 0 10px" }}>{child.nextExam.date} · {child.nextExam.daysLeft} days away</p>
            <div style={{ height: 5, background: "#ede9e3", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${100 - (child.nextExam.daysLeft / 14) * 100}%`, height: "100%", background: C.amber, borderRadius: 3 }} />
            </div>
            <p style={{ color: C.text3, fontSize: 10, margin: "4px 0 0" }}>Preparation time running out</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subjects Tab ─────────────────────────────────────────────────────────────
function SubjectsTab({ child }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Exam history table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: 0 }}>Exam Score History</p>
          <span style={{ background: child.colorL, color: child.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
            Overall Avg: {child.avgScore}%
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface2 }}>
                <th style={{ padding: "10px 14px", textAlign: "left", color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "8px 0 0 8px" }}>Term</th>
                {Object.keys(child.examHistory[0]).filter(k => k !== "term").map(k => (
                  <th key={k} style={{ padding: "10px 10px", textAlign: "center", color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {child.examHistory.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 14px", color: C.text1, fontWeight: 700, fontSize: 13 }}>{row.term}</td>
                  {Object.entries(row).filter(([k]) => k !== "term").map(([k, v]) => (
                    <td key={k} style={{ padding: "12px 10px", textAlign: "center" }}>
                      <span style={{ color: scoreColor(v), fontWeight: 700, fontSize: 13 }}>{v}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject detail cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {child.subjects.map(sub => (
          <div key={sub.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: sub.color }} />
                  <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: 0 }}>{sub.name}</p>
                </div>
                <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{sub.teacher}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: scoreColor(sub.score), fontSize: 20, fontWeight: 900, margin: "0 0 2px", lineHeight: 1 }}>{sub.score}%</p>
                <span style={{ background: gradeColor(sub.grade) + "18", color: gradeColor(sub.grade), fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5 }}>{sub.grade}</span>
              </div>
            </div>

            <div style={{ height: 5, background: C.surface3, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ width: `${sub.score}%`, height: "100%", background: sub.color, borderRadius: 3, transition: "width 1s ease" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: C.text3, fontSize: 11 }}>Last test: {sub.lastTest}</span>
              <span style={{ color: trendColor(sub.trend), fontSize: 12, fontWeight: 700 }}>
                {trendIcon(sub.trend)} {sub.trend === "up" ? "Improving" : sub.trend === "down" ? "Declining" : "Stable"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
function AttendanceTab({ child }) {
  const totalPresent  = child.attendanceDetail.reduce((a, m) => a + m.present, 0);
  const totalDays     = child.attendanceDetail.reduce((a, m) => a + m.total, 0);
  const totalAbsent   = totalDays - totalPresent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { l: "Overall",       v: `${child.attendance}%`, c: attendColor(child.attendance), bg: attendColor(child.attendance) + "12" },
          { l: "Days Present",  v: totalPresent,           c: C.green,  bg: C.greenBg },
          { l: "Days Absent",   v: totalAbsent,            c: C.rose,   bg: C.roseBg  },
          { l: "Total Working", v: totalDays,              c: C.text1,  bg: C.surface2 },
        ].map(m => (
          <div key={m.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>{m.l}</p>
            <p style={{ color: m.c, fontSize: 22, fontWeight: 900, margin: 0 }}>{m.v}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: 0 }}>Month-by-Month Attendance</p>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ c: C.green, l: "≥90% Excellent" }, { c: C.amber, l: "75–89% Average" }, { c: C.rose, l: "<75% Low" }].map(k => (
              <div key={k.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: k.c }} />
                <span style={{ color: C.text3, fontSize: 10.5 }}>{k.l}</span>
              </div>
            ))}
          </div>
        </div>
        <AttendBars data={child.attendanceDetail} color={child.color} />
      </div>

      {/* Attendance alert */}
      {child.attendance < 90 && (
        <div style={{ background: C.amberL, border: `1px solid ${C.amber}30`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ color: C.amber, fontSize: 13, fontWeight: 800, margin: "0 0 3px" }}>Attendance Below 90%</p>
            <p style={{ color: C.text2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              {child.name.split(" ")[0]}'s attendance is {child.attendance}%. Students with attendance below 75% may be barred from exams. Please ensure regular attendance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assignments Tab ──────────────────────────────────────────────────────────
const ASSIGN_STATUS = {
  pending:   { label: "Pending",   bg: C.amberL, color: C.amber, border: C.amber  + "30" },
  submitted: { label: "Submitted", bg: C.blueL,  color: C.blue,  border: C.blue   + "30" },
  graded:    { label: "Graded",    bg: C.greenL, color: C.green, border: C.green  + "30" },
};

function AssignmentsTab({ child }) {
  const total     = child.recentAssignments.length;
  const graded    = child.recentAssignments.filter(a => a.status === "graded").length;
  const pending   = child.recentAssignments.filter(a => a.status === "pending").length;
  const avgAssign = child.recentAssignments.filter(a => a.score !== null).length
    ? Math.round(child.recentAssignments.filter(a => a.score !== null).reduce((s, a) => s + (a.score / 50) * 100, 0) / graded)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { l: "Total",     v: total,    c: C.text1  },
          { l: "Graded",    v: graded,   c: C.green  },
          { l: "Pending",   v: pending,  c: pending > 0 ? C.rose : C.green },
        ].map(m => (
          <div key={m.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>{m.l}</p>
            <p style={{ color: m.c, fontSize: 22, fontWeight: 900, margin: 0 }}>{m.v}</p>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
        <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>Recent Assignments</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {child.recentAssignments.map((a, i) => {
            const cfg = ASSIGN_STATUS[a.status];
            const scorePct = a.score !== null ? (a.score / 50) * 100 : null;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: C.surface2, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                  <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{a.subject} · Due: {a.due}</p>
                </div>
                {a.score !== null && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ color: scoreColor(scorePct), fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>{a.score}/50</p>
                    <p style={{ color: C.text3, fontSize: 10, margin: 0 }}>{Math.round(scorePct)}%</p>
                  </div>
                )}
                <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Fees Tab ─────────────────────────────────────────────────────────────────
function FeesTab({ child }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {child.feesDue > 0 && (
        <div style={{ background: C.roseL, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: C.rose, fontSize: 13, fontWeight: 800, margin: "0 0 4px" }}>Outstanding Payment</p>
            <p style={{ color: C.text2, fontSize: 13, margin: 0 }}>Term fee for {child.name} is due by March 20, 2025</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ color: C.rose, fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>₹{child.feesDue.toLocaleString()}</p>
            <button
              onClick={() => navigate("/parent/fees/pay")}
              style={{ background: C.rose, border: "none", borderRadius: 9, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              Pay Now →
            </button>
          </div>
        </div>
      )}

      {child.feesDue === 0 && (
        <div style={{ background: C.greenL, border: `1px solid ${C.green}30`, borderRadius: 14, padding: "14px 20px", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <p style={{ color: C.green, fontSize: 13, fontWeight: 700, margin: 0 }}>All fees are up to date for {child.name}. No outstanding payments.</p>
        </div>
      )}

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
        <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>Payment History</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {child.fees.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: C.surface2, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: f.status === "paid" ? C.greenL : C.roseL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>{f.status === "paid" ? "✓" : "⏳"}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{f.term}</p>
                <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{f.status === "paid" ? `Paid on ${f.paid}` : `Due by ${f.due}`}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>₹{f.amount.toLocaleString()}</p>
                <span style={{ background: f.status === "paid" ? C.greenL : C.roseL, color: f.status === "paid" ? C.green : C.rose, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>
                  {f.status === "paid" ? "Paid ✓" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Remarks Tab ─────────────────────────────────────────────────────────────
function RemarksTab({ child }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: C.accentBg, border: `1px solid ${C.accent}25`, borderRadius: 12, padding: "12px 16px" }}>
        <p style={{ color: C.accent, fontSize: 12.5, margin: 0, fontWeight: 600 }}>
          💬 {child.teacherRemarks.length} teacher remarks for {child.name.split(" ")[0]} this month. These are updated after each evaluation.
        </p>
      </div>
      {child.teacherRemarks.map((r, i) => (
        <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.surface2, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: C.text2, fontWeight: 800, fontSize: 13 }}>
                {r.teacher.split(" ").filter(w => w.startsWith("Mrs") || w.startsWith("Mr") ? false : true).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: "0 0 1px" }}>{r.teacher}</p>
                  <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{r.subject}</p>
                </div>
                <span style={{ color: C.text3, fontSize: 11 }}>{r.date}</span>
              </div>
              <div style={{ background: C.surface2, borderRadius: 9, padding: "12px 14px", marginTop: 8, borderLeft: `3px solid ${child.color}` }}>
                <p style={{ color: C.text2, fontSize: 13, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>"{r.remark}"</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyChildren() {
  const navigate = useNavigate();
  const [activeChild, setActiveChild]   = useState(0);
  const [activeTab,   setActiveTab]     = useState("overview");
  const [search,      setSearch]        = useState("");

  const child = CHILDREN[activeChild];

  const TAB_CONTENT = {
    overview:    <OverviewTab    child={child} />,
    subjects:    <SubjectsTab   child={child} />,
    attendance:  <AttendanceTab child={child} />,
    assignments: <AssignmentsTab child={child} />,
    fees:        <FeesTab       child={child} />,
    remarks:     <RemarksTab    child={child} />,
  };

  return (
    <div style={{ padding: "28px 28px 48px", background: C.bg, minHeight: "100vh" }}>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: C.text1, fontSize: 25, fontWeight: 900, margin: "0 0 4px", fontFamily: "Georgia, serif", letterSpacing: "-0.02em" }}>
            My Children
          </h1>
          <p style={{ color: C.text2, fontSize: 13.5, margin: 0 }}>Full academic profile, attendance, fees, and teacher feedback</p>
        </div>
        <button
          onClick={() => navigate("/parent/messages")}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 18px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
        >
          <span>💬</span> Message Teacher
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24, alignItems: "flex-start" }}>

        {/* ── Left Sidebar: Child Selector ── */}
        <div style={{ position: "sticky", top: 76, display: "flex", flexDirection: "column", gap: 12 }}>
          {CHILDREN.map((c, i) => (
            <div
              key={c.id}
              onClick={() => { setActiveChild(i); setActiveTab("overview"); }}
              style={{
                background: activeChild === i ? C.surface : C.surface,
                border: `1.5px solid ${activeChild === i ? c.color : C.border}`,
                borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                transition: "all 0.16s ease",
                boxShadow: activeChild === i ? `0 2px 16px ${c.color}16` : "none",
              }}
            >
              {/* Avatar row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: c.colorL, border: `2.5px solid ${c.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: c.color, fontWeight: 900, fontSize: 15 }}>{c.avatar}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                  <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{c.grade}</p>
                </div>
              </div>

              {/* Mini stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: "Score",   v: `${c.avgScore}%`,    col: scoreColor(c.avgScore)    },
                  { l: "Attend",  v: `${c.attendance}%`,  col: attendColor(c.attendance) },
                  { l: "Rank",    v: `#${c.rank}`,        col: c.color                   },
                  { l: "Fees",    v: c.feesDue > 0 ? "Due" : "✓ OK", col: c.feesDue > 0 ? C.rose : C.green },
                ].map(m => (
                  <div key={m.l} style={{ background: C.surface2, borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                    <p style={{ color: C.text3, fontSize: 9, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>{m.l}</p>
                    <p style={{ color: m.col, fontSize: 13, fontWeight: 900, margin: 0 }}>{m.v}</p>
                  </div>
                ))}
              </div>

              {c.pendingAssignments > 0 && (
                <div style={{ marginTop: 10, background: C.roseL, borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.rose, display: "inline-block" }} />
                  <span style={{ color: C.rose, fontSize: 11, fontWeight: 700 }}>{c.pendingAssignments} assignment{c.pendingAssignments > 1 ? "s" : ""} pending</span>
                </div>
              )}
            </div>
          ))}

          {/* Contact school */}
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ color: C.text2, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>School Contact</p>
            <p style={{ color: C.text1, fontSize: 12, margin: "0 0 2px", fontWeight: 600 }}>Greenwood High School</p>
            <p style={{ color: C.text3, fontSize: 11, margin: "0 0 10px" }}>+91 80 4567 8901</p>
            <button
              style={{ width: "100%", background: C.accentL, border: `1px solid ${C.accent}30`, borderRadius: 8, padding: "8px", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              onClick={() => navigate("/parent/messages")}
            >
              Send Message →
            </button>
          </div>
        </div>

        {/* ── Right: Detail Area ── */}
        <div>
          {/* Tab Bar */}
          <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, padding: 4, marginBottom: 20, overflowX: "auto" }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  background: activeTab === t.key ? child.colorL : "transparent",
                  border: `1px solid ${activeTab === t.key ? child.color + "40" : "transparent"}`,
                  borderRadius: 8, padding: "8px 16px", color: activeTab === t.key ? child.color : C.text3,
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.14s"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          {TAB_CONTENT[activeTab]}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4c9b8; border-radius: 4px; }
        button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}