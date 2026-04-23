import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ─── Design Tokens ──────────────────────────────────────────────────────────
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

// ─── DATA ───────────────────────────────────────────────────────────────────
const CHILDREN_RESULTS = {
  1: {
    id: 1,
    name: "Aryan Reddy",
    fullName: "Aryan Suresh Reddy",
    grade: "Grade 10 – Section A",
    rollNo: "GHS-2024-1047",
    dob: "08-03-2009",
    school: "Greenwood High School",
    academicYear: "2024–25",
    avatar: "AR",
    color: C.blue, colorL: C.blueL, colorBg: C.blueBg,
    classTeacher: "Mrs. Priya Nambiar",
    principal: "Dr. Ramesh Iyer",
    rank: 7, rankTotal: 42,
    overallGrade: "B+",
    overallPct: 79,
    totalMarks: 395,
    maxTotalMarks: 500,
    promoted: true,
    exams: [
      {
        id: "ut1",
        name: "Unit Test 1",
        shortName: "UT–1",
        month: "October 2024",
        type: "unit",
        totalMax: 250,
        rank: 14, rankTotal: 42,
        subjects: [
          { name: "Mathematics",    code: "MATH", color: C.amber,  written: 30, practical: null, oral: null,  max: 50, grade: "C+", pass: true  },
          { name: "Physics",        code: "PHY",  color: C.blue,   written: 34, practical: null, oral: null,  max: 50, grade: "B",  pass: true  },
          { name: "Chemistry",      code: "CHEM", color: C.green,  written: 32, practical: null, oral: null,  max: 50, grade: "C+", pass: true  },
          { name: "English",        code: "ENG",  color: C.violet, written: 36, practical: null, oral: null,  max: 50, grade: "B",  pass: true  },
          { name: "Computer Sc.",   code: "CS",   color: C.accent, written: 41, practical: null, oral: null,  max: 50, grade: "A",  pass: true  },
          { name: "Social Studies", code: "SOC",  color: C.rose,   written: 29, practical: null, oral: null,  max: 50, grade: "C",  pass: true  },
        ],
        teacherRemark: "Good start to the year. Aryan must focus on improving consistency across all subjects.",
        conduct: "Good",
        attendance: "91%",
      },
      {
        id: "ut2",
        name: "Unit Test 2",
        shortName: "UT–2",
        month: "December 2024",
        type: "unit",
        totalMax: 250,
        rank: 10, rankTotal: 42,
        subjects: [
          { name: "Mathematics",    code: "MATH", color: C.amber,  written: 34, practical: null, oral: null,  max: 50, grade: "B",  pass: true  },
          { name: "Physics",        code: "PHY",  color: C.blue,   written: 37, practical: null, oral: null,  max: 50, grade: "B+", pass: true  },
          { name: "Chemistry",      code: "CHEM", color: C.green,  written: 35, practical: null, oral: null,  max: 50, grade: "B",  pass: true  },
          { name: "English",        code: "ENG",  color: C.violet, written: 39, practical: null, oral: null,  max: 50, grade: "B+", pass: true  },
          { name: "Computer Sc.",   code: "CS",   color: C.accent, written: 44, practical: null, oral: null,  max: 50, grade: "A+", pass: true  },
          { name: "Social Studies", code: "SOC",  color: C.rose,   written: 31, practical: null, oral: null,  max: 50, grade: "C+", pass: true  },
        ],
        teacherRemark: "Significant improvement. Keep the momentum going into Term 3.",
        conduct: "Very Good",
        attendance: "88%",
      },
      {
        id: "ut3",
        name: "Unit Test 3",
        shortName: "UT–3",
        month: "February 2025",
        type: "unit",
        totalMax: 250,
        rank: 7, rankTotal: 42,
        subjects: [
          { name: "Mathematics",    code: "MATH", color: C.amber,  written: 37, practical: null, oral: null,  max: 50, grade: "B",  pass: true  },
          { name: "Physics",        code: "PHY",  color: C.blue,   written: 40, practical: null, oral: null,  max: 50, grade: "A",  pass: true  },
          { name: "Chemistry",      code: "CHEM", color: C.green,  written: 38, practical: null, oral: null,  max: 50, grade: "B+", pass: true  },
          { name: "English",        code: "ENG",  color: C.violet, written: 41, practical: null, oral: null,  max: 50, grade: "A",  pass: true  },
          { name: "Computer Sc.",   code: "CS",   color: C.accent, written: 45, practical: null, oral: null,  max: 50, grade: "A+", pass: true  },
          { name: "Social Studies", code: "SOC",  color: C.rose,   written: 34, practical: null, oral: null,  max: 50, grade: "C+", pass: true  },
        ],
        teacherRemark: "Outstanding progress in Computer Science and Physics. Final exam preparation is on track.",
        conduct: "Excellent",
        attendance: "90%",
      },
      {
        id: "annual",
        name: "Annual Examination",
        shortName: "Annual",
        month: "March 2025",
        type: "annual",
        totalMax: 500,
        rank: 7, rankTotal: 42,
        subjects: [
          { name: "Mathematics",    code: "MATH", color: C.amber,  written: 62, practical: 12, oral: null,  max: 100, grade: "B",  pass: true },
          { name: "Physics",        code: "PHY",  color: C.blue,   written: 58, practical: 23, oral: null,  max: 100, grade: "A–", pass: true },
          { name: "Chemistry",      code: "CHEM", color: C.green,  written: 56, practical: 21, oral: null,  max: 100, grade: "B+", pass: true },
          { name: "English",        code: "ENG",  color: C.violet, written: 68, practical: null,oral: 15,   max: 100, grade: "A–", pass: true },
          { name: "Computer Sc.",   code: "CS",   color: C.accent, written: 71, practical: 20, oral: null,  max: 100, grade: "A+", pass: true },
          { name: "Social Studies", code: "SOC",  color: C.rose,   written: 54, practical: null,oral: 15,   max: 100, grade: "C+", pass: true },
        ],
        teacherRemark: "Aryan has shown commendable growth throughout the year. Promoted to Grade 11 with distinction in Computer Science.",
        conduct: "Very Good",
        attendance: "88%",
      },
    ],
    progressOverTime: [
      { exam: "UT–1", pct: 68, rank: 14 },
      { exam: "UT–2", pct: 74, rank: 10 },
      { exam: "UT–3", pct: 79, rank: 7  },
      { exam: "Annual", pct: 79, rank: 7 },
    ],
  },
  2: {
    id: 2,
    name: "Priya Reddy",
    fullName: "Priya Suresh Reddy",
    grade: "Grade 7 – Section B",
    rollNo: "GHS-2024-0728",
    dob: "14-07-2012",
    school: "Greenwood High School",
    academicYear: "2024–25",
    avatar: "PR",
    color: C.accent, colorL: C.accentL, colorBg: C.accentBg,
    classTeacher: "Mrs. Anitha Krishnan",
    principal: "Dr. Ramesh Iyer",
    rank: 3, rankTotal: 38,
    overallGrade: "A",
    overallPct: 88,
    totalMarks: 519,
    maxTotalMarks: 600,
    promoted: true,
    exams: [
      {
        id: "ut1",
        name: "Unit Test 1",
        shortName: "UT–1",
        month: "October 2024",
        type: "unit",
        totalMax: 300,
        rank: 5, rankTotal: 38,
        subjects: [
          { name: "Mathematics", code: "MATH", color: C.accent, written: 44, practical: null, oral: null, max: 50, grade: "A",  pass: true },
          { name: "Science",     code: "SCI",  color: C.green,  written: 40, practical: null, oral: null, max: 50, grade: "A–", pass: true },
          { name: "English",     code: "ENG",  color: C.violet, written: 42, practical: null, oral: null, max: 50, grade: "A",  pass: true },
          { name: "Social St.",  code: "SOC",  color: C.blue,   written: 38, practical: null, oral: null, max: 50, grade: "B+", pass: true },
          { name: "Hindi",       code: "HIN",  color: C.amber,  written: 40, practical: null, oral: null, max: 50, grade: "A–", pass: true },
          { name: "Sanskrit",    code: "SAN",  color: C.rose,   written: 35, practical: null, oral: null, max: 50, grade: "B",  pass: true },
        ],
        teacherRemark: "Excellent performance across all subjects. Priya is a consistent high achiever.",
        conduct: "Excellent",
        attendance: "100%",
      },
      {
        id: "ut2",
        name: "Unit Test 2",
        shortName: "UT–2",
        month: "December 2024",
        type: "unit",
        totalMax: 300,
        rank: 4, rankTotal: 38,
        subjects: [
          { name: "Mathematics", code: "MATH", color: C.accent, written: 45, practical: null, oral: null, max: 50, grade: "A+", pass: true },
          { name: "Science",     code: "SCI",  color: C.green,  written: 42, practical: null, oral: null, max: 50, grade: "A",  pass: true },
          { name: "English",     code: "ENG",  color: C.violet, written: 44, practical: null, oral: null, max: 50, grade: "A+", pass: true },
          { name: "Social St.",  code: "SOC",  color: C.blue,   written: 40, practical: null, oral: null, max: 50, grade: "A–", pass: true },
          { name: "Hindi",       code: "HIN",  color: C.amber,  written: 42, practical: null, oral: null, max: 50, grade: "A",  pass: true },
          { name: "Sanskrit",    code: "SAN",  color: C.rose,   written: 37, practical: null, oral: null, max: 50, grade: "B+", pass: true },
        ],
        teacherRemark: "Remarkable consistency. Perfect score in Mathematics. Should target the top rank.",
        conduct: "Excellent",
        attendance: "96%",
      },
      {
        id: "ut3",
        name: "Unit Test 3",
        shortName: "UT–3",
        month: "February 2025",
        type: "unit",
        totalMax: 300,
        rank: 3, rankTotal: 38,
        subjects: [
          { name: "Mathematics", code: "MATH", color: C.accent, written: 46, practical: null, oral: null, max: 50, grade: "A+", pass: true },
          { name: "Science",     code: "SCI",  color: C.green,  written: 44, practical: null, oral: null, max: 50, grade: "A+", pass: true },
          { name: "English",     code: "ENG",  color: C.violet, written: 45, practical: null, oral: null, max: 50, grade: "A+", pass: true },
          { name: "Social St.",  code: "SOC",  color: C.blue,   written: 42, practical: null, oral: null, max: 50, grade: "A",  pass: true },
          { name: "Hindi",       code: "HIN",  color: C.amber,  written: 43, practical: null, oral: null, max: 50, grade: "A",  pass: true },
          { name: "Sanskrit",    code: "SAN",  color: C.rose,   written: 39, practical: null, oral: null, max: 50, grade: "B+", pass: true },
        ],
        teacherRemark: "Outstanding! Priya is among the top 3 students in the class. A well-rounded student.",
        conduct: "Excellent",
        attendance: "95%",
      },
      {
        id: "annual",
        name: "Annual Examination",
        shortName: "Annual",
        month: "March 2025",
        type: "annual",
        totalMax: 600,
        rank: 3, rankTotal: 38,
        subjects: [
          { name: "Mathematics", code: "MATH", color: C.accent, written: 82, practical: 10,  oral: null,  max: 100, grade: "A+", pass: true },
          { name: "Science",     code: "SCI",  color: C.green,  written: 74, practical: 14,  oral: null,  max: 100, grade: "A",  pass: true },
          { name: "English",     code: "ENG",  color: C.violet, written: 78, practical: null, oral: 12,   max: 100, grade: "A+", pass: true },
          { name: "Social St.",  code: "SOC",  color: C.blue,   written: 72, practical: null, oral: 12,   max: 100, grade: "A–", pass: true },
          { name: "Hindi",       code: "HIN",  color: C.amber,  written: 74, practical: null, oral: 12,   max: 100, grade: "A",  pass: true },
          { name: "Sanskrit",    code: "SAN",  color: C.rose,   written: 67, practical: null, oral: 12,   max: 100, grade: "B+", pass: true },
        ],
        teacherRemark: "Priya has been a model student throughout the year. Promoted to Grade 8 with distinction.",
        conduct: "Excellent",
        attendance: "95%",
      },
    ],
    progressOverTime: [
      { exam: "UT–1", pct: 79, rank: 5 },
      { exam: "UT–2", pct: 83, rank: 4 },
      { exam: "UT–3", pct: 87, rank: 3 },
      { exam: "Annual", pct: 87, rank: 3 },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pct        = (s, m)  => Math.round((s / m) * 100);
const scoreColor = s       => s >= 85 ? C.green : s >= 70 ? C.amber : s >= 50 ? C.accent : C.rose;
const gradeColor = g       => !g ? C.text3 : g.startsWith("A") ? C.green : g.startsWith("B") ? C.amber : g.startsWith("C") ? C.accent : C.rose;
const totalScore = subjects => subjects.reduce((a, s) => a + s.written + (s.practical || 0) + (s.oral || 0), 0);

// ─── SVG Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 200, h = 48 }) {
  const mn = Math.min(...data.map(d => d.pct));
  const mx = Math.max(...data.map(d => d.pct));
  const rng = mx - mn || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - 6 - ((d.pct - mn) / rng) * (h - 12)}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const id = `rs${color.replace(/[^a-z]/gi, "")}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - 6 - ((d.pct - mn) / rng) * (h - 12);
        return <circle key={i} cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

// ─── Grade Pill ──────────────────────────────────────────────────────────────
function GradePill({ grade }) {
  return (
    <span style={{ background: gradeColor(grade) + "18", color: gradeColor(grade), fontSize: 11, fontWeight: 800, padding: "2px 9px", borderRadius: 6, border: `1px solid ${gradeColor(grade)}25` }}>
      {grade}
    </span>
  );
}

// ─── HBar ────────────────────────────────────────────────────────────────────
function HBar({ value, max = 100, color, h = 6 }) {
  return (
    <div style={{ width: "100%", height: h, background: C.s3, borderRadius: h / 2, overflow: "hidden" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: h / 2, transition: "width 1s ease" }} />
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}

// ─── Marksheet Component ──────────────────────────────────────────────────────
function Marksheet({ exam, child }) {
  const total = totalScore(exam.subjects);
  const totalPct = pct(total, exam.totalMax);
  const isAnnual = exam.type === "annual";

  return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px #0000000a" }}>

      {/* Header band */}
      <div style={{ background: `linear-gradient(135deg, ${child.color}14, ${child.color}06)`, borderBottom: `1px solid ${child.color}25`, padding: "20px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: child.color + "20", border: `1px solid ${child.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: child.color, fontWeight: 900, fontSize: 13 }}>{child.avatar}</span>
              </div>
              <div>
                <p style={{ color: C.text1, fontSize: 15, fontWeight: 900, margin: 0, fontFamily: "Georgia, serif" }}>{child.fullName}</p>
                <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>Roll No: {child.rollNo} · {child.grade}</p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: child.color, fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>{exam.name}</p>
            <p style={{ color: C.text3, fontSize: 12, margin: "0 0 4px" }}>{exam.month} · {child.academicYear}</p>
            <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>Rank: <strong style={{ color: child.color }}>#{exam.rank}</strong> / {exam.rankTotal}</p>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div style={{ padding: "0 0 20px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.s2 }}>
              {["Subject", "Written", isAnnual ? "Practical" : null, isAnnual ? "Oral" : null, "Total", "Max", "Pct", "Grade", "Status"]
                .filter(Boolean)
                .map((h, i) => (
                  <th key={i} style={{ padding: "10px 16px", textAlign: i <= 1 ? "left" : "center", color: C.text3, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {exam.subjects.map((s, i) => {
              const subTotal = s.written + (s.practical || 0) + (s.oral || 0);
              const subPct   = pct(subTotal, s.max);
              return (
                <tr key={s.code} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.s2 + "66" }}>
                  {/* Subject */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ color: C.text1, fontSize: 13, fontWeight: 700 }}>{s.name}</span>
                    </div>
                  </td>
                  {/* Written */}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span style={{ color: C.text1, fontSize: 13, fontWeight: 600 }}>{s.written}</span>
                  </td>
                  {/* Practical (annual only) */}
                  {isAnnual && (
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ color: s.practical ? C.text1 : C.text3, fontSize: 13 }}>{s.practical ?? "—"}</span>
                    </td>
                  )}
                  {/* Oral (annual only) */}
                  {isAnnual && (
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ color: s.oral ? C.text1 : C.text3, fontSize: 13 }}>{s.oral ?? "—"}</span>
                    </td>
                  )}
                  {/* Total */}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span style={{ color: scoreColor(subPct), fontSize: 14, fontWeight: 900 }}>{subTotal}</span>
                  </td>
                  {/* Max */}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span style={{ color: C.text3, fontSize: 12 }}>{s.max}</span>
                  </td>
                  {/* Pct + bar */}
                  <td style={{ padding: "12px 16px", textAlign: "center", minWidth: 90 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ color: scoreColor(subPct), fontSize: 12, fontWeight: 800 }}>{subPct}%</span>
                      <HBar value={subTotal} max={s.max} color={scoreColor(subPct)} h={4} />
                    </div>
                  </td>
                  {/* Grade */}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <GradePill grade={s.grade} />
                  </td>
                  {/* Status */}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span style={{ background: s.pass ? C.greenL : C.roseL, color: s.pass ? C.green : C.rose, fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
                      {s.pass ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Grand Total */}
          <tfoot>
            <tr style={{ background: child.colorBg, borderTop: `2px solid ${child.color}30` }}>
              <td style={{ padding: "14px 16px" }}>
                <span style={{ color: child.color, fontSize: 13.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" }}>Grand Total</span>
              </td>
              <td colSpan={isAnnual ? 4 : 1} />
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <span style={{ color: child.color, fontSize: 16, fontWeight: 900 }}>{total}</span>
              </td>
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <span style={{ color: C.text3, fontSize: 13 }}>{exam.totalMax}</span>
              </td>
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <span style={{ color: scoreColor(totalPct), fontSize: 14, fontWeight: 900 }}>{totalPct}%</span>
              </td>
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <GradePill grade={child.overallGrade} />
              </td>
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <span style={{ background: C.greenL, color: C.green, fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>PASS</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer: Teacher remark + metadata */}
      <div style={{ padding: "14px 28px 20px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Class Teacher's Remarks</p>
          <p style={{ color: C.text2, fontSize: 12.5, margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>"{exam.teacherRemark}"</p>
        </div>
        <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
          {[
            { l: "Conduct",    v: exam.conduct    },
            { l: "Attendance", v: exam.attendance },
            { l: "Rank",       v: `${exam.rank} / ${exam.rankTotal}` },
          ].map(m => (
            <div key={m.l} style={{ textAlign: "center" }}>
              <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>{m.l}</p>
              <p style={{ color: C.text1, fontSize: 13, fontWeight: 800, margin: 0 }}>{m.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Grade Card (compact summary) ────────────────────────────────────────────
function GradeCard({ exam, child, onClick, active }) {
  const total    = totalScore(exam.subjects);
  const totalPct = pct(total, exam.totalMax);
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? child.colorBg : C.surface,
        border: `1.5px solid ${active ? child.color : C.border}`,
        borderRadius: 14, padding: "16px 20px", cursor: "pointer",
        transition: "all 0.16s", boxShadow: active ? `0 2px 16px ${child.color}18` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ color: active ? child.color : C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>{exam.shortName}</p>
          <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{exam.month}</p>
        </div>
        <div style={{ background: gradeColor(child.overallGrade) + "18", color: gradeColor(child.overallGrade), fontWeight: 900, fontSize: 16, padding: "4px 10px", borderRadius: 8 }}>
          {exam.type === "annual" ? child.overallGrade : exam.subjects.reduce((best, s) => s.grade < best ? s.grade : best, "Z")}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ color: scoreColor(totalPct), fontSize: 22, fontWeight: 900, margin: "0 0 2px", lineHeight: 1 }}>{totalPct}%</p>
          <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{total}/{exam.totalMax}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: C.text3, fontSize: 10, margin: "0 0 2px" }}>Rank</p>
          <p style={{ color: child.color, fontSize: 14, fontWeight: 900, margin: 0 }}>#{exam.rank}</p>
        </div>
      </div>

      <HBar value={total} max={exam.totalMax} color={scoreColor(totalPct)} h={5} />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ChildResults() {
  const { childId } = useParams();
  const navigate    = useNavigate();
  const child       = CHILDREN_RESULTS[childId] || CHILDREN_RESULTS[1];
  const { color, colorL, colorBg } = child;

  const [activeExam, setActiveExam] = useState("annual");
  const [tab,        setTab       ] = useState("marksheet"); // marksheet | progress | report

  const exam = child.exams.find(e => e.id === activeExam) || child.exams[child.exams.length - 1];

  // Grade scale reference
  const GRADE_SCALE = [
    { grade: "A+", range: "91–100", color: C.green  },
    { grade: "A",  range: "81–90",  color: C.green  },
    { grade: "A–", range: "76–80",  color: C.teal   },
    { grade: "B+", range: "71–75",  color: C.amber  },
    { grade: "B",  range: "61–70",  color: C.amber  },
    { grade: "C+", range: "51–60",  color: C.accent },
    { grade: "C",  range: "41–50",  color: C.rose   },
    { grade: "F",  range: "0–40",   color: C.rose   },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "28px 30px 60px", fontFamily: "'Lato', 'Segoe UI', sans-serif" }}>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back</button>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: colorL, border: `3px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color, fontWeight: 900, fontSize: 18 }}>{child.avatar}</span>
          </div>
          <div>
            <h1 style={{ color: C.text1, fontSize: 22, fontWeight: 900, margin: "0 0 2px", fontFamily: "Georgia, serif" }}>{child.name}</h1>
            <p style={{ color: C.text3, fontSize: 13, margin: 0 }}>{child.grade} · Exam Results · {child.academicYear}</p>
          </div>
        </div>

        {/* Promotion badge */}
        {child.promoted && (
          <div style={{ background: C.greenBg, border: `1.5px solid ${C.green}40`, borderRadius: 14, padding: "12px 20px", textAlign: "center" }}>
            <span style={{ fontSize: 24 }}>🎓</span>
            <p style={{ color: C.green, fontSize: 12, fontWeight: 800, margin: "4px 0 0" }}>PROMOTED</p>
            <p style={{ color: C.text3, fontSize: 10.5, margin: 0 }}>Next Grade</p>
          </div>
        )}
      </div>

      {/* ── Exam Selector Row ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 26 }}>
        {child.exams.map(e => (
          <GradeCard
            key={e.id}
            exam={e}
            child={child}
            active={activeExam === e.id}
            onClick={() => setActiveExam(e.id)}
          />
        ))}
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 22 }}>
        {[
          { key: "marksheet", label: "📋 Marksheet"       },
          { key: "progress",  label: "📈 Progress Charts" },
          { key: "report",    label: "📄 Report Card"     },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? colorBg : "transparent",
            border: `1px solid ${tab === t.key ? color + "45" : "transparent"}`,
            borderRadius: 9, padding: "8px 18px", color: tab === t.key ? color : C.text3,
            fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.14s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: MARKSHEET
      ══════════════════════════════════════════════════════════════ */}
      {tab === "marksheet" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Marksheet exam={exam} child={child} />

          {/* Grade scale reference */}
          <Card>
            <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: "0 0 12px" }}>Grading Scale Reference</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {GRADE_SCALE.map(g => (
                <div key={g.grade} style={{ background: g.color + "12", border: `1px solid ${g.color}30`, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                  <p style={{ color: g.color, fontSize: 13, fontWeight: 900, margin: "0 0 2px" }}>{g.grade}</p>
                  <p style={{ color: C.text3, fontSize: 10, margin: 0 }}>{g.range}%</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: PROGRESS CHARTS
      ══════════════════════════════════════════════════════════════ */}
      {tab === "progress" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Overall progress sparkline */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <p style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 3px" }}>Overall Score Progression</p>
                <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>Term-by-term performance across the academic year</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: color, fontSize: 22, fontWeight: 900, margin: "0 0 2px" }}>
                  {child.progressOverTime[child.progressOverTime.length - 1].pct}%
                </p>
                <p style={{ color: C.green, fontSize: 11.5, fontWeight: 700, margin: 0 }}>
                  +{child.progressOverTime[child.progressOverTime.length - 1].pct - child.progressOverTime[0].pct}% since Term 1
                </p>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <Sparkline data={child.progressOverTime} color={color} w={600} h={80} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12 }}>
              {child.progressOverTime.map((d, i) => (
                <div key={d.exam} style={{ textAlign: "center" }}>
                  <p style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, margin: "0 0 2px" }}>{d.exam}</p>
                  <p style={{ color: scoreColor(d.pct), fontSize: 14, fontWeight: 900, margin: "0 0 1px" }}>{d.pct}%</p>
                  <p style={{ color: C.text3, fontSize: 10, margin: 0 }}>Rank #{d.rank}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Per-subject progression bars */}
          <Card>
            <p style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 16px" }}>Subject-wise Term Progression</p>
            {child.exams[0].subjects.map((sub, si) => {
              const termVals = child.exams.map(e => {
                const s = e.subjects[si];
                return { exam: e.shortName, val: s.written + (s.practical || 0) + (s.oral || 0), max: s.max };
              });
              return (
                <div key={sub.code} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sub.color }} />
                      <span style={{ color: C.text1, fontSize: 13, fontWeight: 700 }}>{sub.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {termVals.map(tv => (
                        <span key={tv.exam} style={{ color: scoreColor(pct(tv.val, tv.max)), fontSize: 11.5, fontWeight: 800 }}>
                          {tv.exam}: {tv.val}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Layered bars */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {termVals.map((tv, i) => {
                      const p = pct(tv.val, tv.max);
                      return (
                        <div key={tv.exam} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ width: "100%", height: 8, background: C.s3, borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${p}%`, height: "100%", background: i === termVals.length - 1 ? sub.color : sub.color + "66", borderRadius: 4, transition: "width 1s ease" }} />
                          </div>
                          <span style={{ color: C.text3, fontSize: 9.5, fontWeight: 700 }}>{tv.exam}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Rank trajectory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card>
              <p style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: "0 0 14px" }}>Rank Trajectory</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {child.progressOverTime.map((d, i) => (
                  <div key={d.exam} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: i === child.progressOverTime.length - 1 ? colorBg : C.s2, borderRadius: 10, border: `1px solid ${i === child.progressOverTime.length - 1 ? color + "30" : C.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color, fontSize: 13, fontWeight: 900 }}>#{d.rank}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{d.exam}</p>
                      <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>Out of {child.exams[i]?.rankTotal || child.rankTotal}</p>
                    </div>
                    <span style={{ color: scoreColor(d.pct), fontSize: 14, fontWeight: 900 }}>{d.pct}%</span>
                    {i > 0 && (
                      <span style={{ color: child.progressOverTime[i].rank < child.progressOverTime[i - 1].rank ? C.green : C.rose, fontSize: 11, fontWeight: 700 }}>
                        {child.progressOverTime[i].rank < child.progressOverTime[i - 1].rank ? "↑" : "↓"}
                        {Math.abs(child.progressOverTime[i].rank - child.progressOverTime[i - 1].rank)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Best / worst each term */}
            <Card>
              <p style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: "0 0 14px" }}>Best & Weakest Subject Per Term</p>
              {child.exams.map(e => {
                const subs = e.subjects.map(s => ({ name: s.name, score: s.written + (s.practical || 0) + (s.oral || 0), max: s.max, color: s.color }));
                const best   = subs.reduce((b, s) => pct(s.score, s.max) > pct(b.score, b.max) ? s : b);
                const worst  = subs.reduce((w, s) => pct(s.score, s.max) < pct(w.score, w.max) ? s : w);
                return (
                  <div key={e.id} style={{ padding: "10px 14px", background: C.s2, borderRadius: 10, marginBottom: 8 }}>
                    <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 800, margin: "0 0 6px" }}>{e.shortName} — {e.month}</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1, background: C.greenBg, borderRadius: 7, padding: "6px 10px" }}>
                        <p style={{ color: C.text3, fontSize: 9, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>Best</p>
                        <p style={{ color: C.green, fontSize: 12, fontWeight: 800, margin: 0 }}>{best.name} — {pct(best.score, best.max)}%</p>
                      </div>
                      <div style={{ flex: 1, background: C.roseBg, borderRadius: 7, padding: "6px 10px" }}>
                        <p style={{ color: C.text3, fontSize: 9, fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px" }}>Weakest</p>
                        <p style={{ color: C.rose, fontSize: 12, fontWeight: 800, margin: 0 }}>{worst.name} — {pct(worst.score, worst.max)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: REPORT CARD
      ══════════════════════════════════════════════════════════════ */}
      {tab === "report" && (() => {
        const annualExam = child.exams.find(e => e.type === "annual");
        const annualTotal = totalScore(annualExam.subjects);
        const annualPct   = pct(annualTotal, annualExam.totalMax);

        return (
          <div>
            {/* Official report card styled layout */}
            <div style={{ background: C.surface, border: `2px solid ${color}40`, borderRadius: 20, overflow: "hidden", maxWidth: 860, margin: "0 auto", boxShadow: "0 8px 40px #0000000f" }}>

              {/* School letterhead */}
              <div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, padding: "24px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, fontFamily: "Georgia, serif" }}>G</span>
                    </div>
                    <div>
                      <p style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: "0 0 2px", fontFamily: "Georgia, serif", letterSpacing: "-0.01em" }}>{child.school}</p>
                      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>CBSE Affiliated · Est. 1988 · Bengaluru</p>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Academic Progress Report</p>
                  <p style={{ color: "#fff", fontSize: 16, fontWeight: 900, margin: "0 0 2px" }}>Annual Examination {child.academicYear}</p>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: 0 }}>Issued: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>

              {/* Student info strip */}
              <div style={{ background: colorBg, borderBottom: `1px solid ${color}20`, padding: "16px 36px", display: "grid", gridTemplateColumns: "auto 1fr repeat(4, auto)", gap: 24, alignItems: "center" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: colorL, border: `3px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color, fontWeight: 900, fontSize: 18 }}>{child.avatar}</span>
                </div>
                <div>
                  <p style={{ color: C.text1, fontSize: 16, fontWeight: 900, margin: "0 0 2px", fontFamily: "Georgia, serif" }}>{child.fullName}</p>
                  <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>{child.grade} · {child.school}</p>
                </div>
                {[
                  { l: "Roll No",    v: child.rollNo    },
                  { l: "DOB",        v: child.dob       },
                  { l: "Year",       v: child.academicYear },
                  { l: "Class Teacher", v: child.classTeacher.split(" ").slice(0, 2).join(" ") },
                ].map(f => (
                  <div key={f.l} style={{ textAlign: "right" }}>
                    <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>{f.l}</p>
                    <p style={{ color: C.text1, fontSize: 12, fontWeight: 700, margin: 0 }}>{f.v}</p>
                  </div>
                ))}
              </div>

              {/* Results table */}
              <div style={{ padding: "24px 36px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                  <thead>
                    <tr style={{ background: C.s2, borderRadius: 8 }}>
                      {["Subject", "Max Marks", "Marks Obtained", "Percentage", "Grade", "Result"].map((h, i) => (
                        <th key={i} style={{ padding: "10px 16px", textAlign: i === 0 ? "left" : "center", color: C.text3, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {annualExam.subjects.map((s, i) => {
                      const subTotal = s.written + (s.practical || 0) + (s.oral || 0);
                      const subPct   = pct(subTotal, s.max);
                      return (
                        <tr key={s.code} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? C.s2 + "55" : C.surface }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                              <span style={{ color: C.text1, fontSize: 13, fontWeight: 700 }}>{s.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center", color: C.text3, fontSize: 13 }}>{s.max}</td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ color: scoreColor(subPct), fontSize: 15, fontWeight: 900 }}>{subTotal}</span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                              <HBar value={subTotal} max={s.max} color={scoreColor(subPct)} h={5} />
                              <span style={{ color: scoreColor(subPct), fontSize: 12, fontWeight: 800, minWidth: 34 }}>{subPct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <GradePill grade={s.grade} />
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ background: C.greenL, color: C.green, fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>PASS</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: colorBg, borderTop: `2px solid ${color}35` }}>
                      <td style={{ padding: "14px 16px", color: color, fontSize: 14, fontWeight: 900 }}>TOTAL</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", color: C.text3, fontSize: 14, fontWeight: 700 }}>{annualExam.totalMax}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", color: color, fontSize: 18, fontWeight: 900 }}>{annualTotal}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", color: scoreColor(annualPct), fontSize: 15, fontWeight: 900 }}>{annualPct}%</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}><GradePill grade={child.overallGrade} /></td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ background: C.greenL, color: C.green, fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>PROMOTED</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Summary row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
                  {[
                    { l: "Total Marks",  v: `${annualTotal}/${annualExam.totalMax}`, col: color    },
                    { l: "Percentage",   v: `${annualPct}%`,                          col: scoreColor(annualPct) },
                    { l: "Overall Grade",v: child.overallGrade,                       col: gradeColor(child.overallGrade) },
                    { l: "Class Rank",   v: `#${child.rank} / ${child.rankTotal}`,    col: color    },
                    { l: "Attendance",   v: annualExam.attendance,                    col: C.green  },
                  ].map(m => (
                    <div key={m.l} style={{ background: C.s2, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                      <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{m.l}</p>
                      <p style={{ color: m.col, fontSize: 16, fontWeight: 900, margin: 0 }}>{m.v}</p>
                    </div>
                  ))}
                </div>

                {/* Remarks + Signatures */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                  <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Class Teacher's Remarks</p>
                  <p style={{ color: C.text2, fontSize: 13, margin: "0 0 24px", lineHeight: 1.6, fontStyle: "italic" }}>"{annualExam.teacherRemark}"</p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                    {[
                      { role: "Class Teacher",   name: child.classTeacher },
                      { role: "Principal",       name: child.principal    },
                      { role: "Parent / Guardian",name: "________________" },
                    ].map(sig => (
                      <div key={sig.role} style={{ textAlign: "center", paddingTop: 36, borderTop: `1px solid ${C.border}` }}>
                        <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 700, margin: "0 0 2px" }}>{sig.name}</p>
                        <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{sig.role}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, padding: "12px 16px", background: C.s2, borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>This is a computer-generated report. No physical signature required.</p>
                    <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{child.school} · {new Date().getFullYear()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-thumb{background:#d4c9b8;border-radius:4px}`}</style>
    </div>
  );
}