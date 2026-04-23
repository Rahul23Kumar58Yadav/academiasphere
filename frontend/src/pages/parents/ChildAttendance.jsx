import { useState } from "react";
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
};

// ─── Data ───────────────────────────────────────────────────────────────────
const CHILDREN_ATT = {
  1: {
    id: 1, name: "Aryan Reddy", grade: "Grade 10 – A", avatar: "AR",
    color: C.blue, colorL: C.blueL, colorBg: C.blueBg,
    overall: 88, present: 154, absent: 21, late: 7, totalDays: 182,
    requirement: 75, medical: 4,
    monthlyData: [
      { month: "September", year: 2024, total: 24, present: 22, absent: 1, late: 1, pct: 92 },
      { month: "October",   year: 2024, total: 25, present: 21, absent: 3, late: 1, pct: 84 },
      { month: "November",  year: 2024, total: 23, present: 19, absent: 3, late: 1, pct: 83 },
      { month: "December",  year: 2024, total: 22, present: 20, absent: 2, late: 0, pct: 91 },
      { month: "January",   year: 2025, total: 26, present: 23, absent: 2, late: 1, pct: 88 },
      { month: "February",  year: 2025, total: 23, present: 20, absent: 2, late: 1, pct: 87 },
      { month: "March",     year: 2025, total: 10, present: 9,  absent: 1, late: 0, pct: 90 },
    ],
    // Calendar days for current visible month (March 2025): 1=present, 0=absent, 2=late, -1=holiday/weekend
    calendarMarch: {
      startDay: 6, // Saturday = index 6 (Mon=0)
      days: [
        -1, // Mar 1 = Sat
        -1, // Mar 2 = Sun
         1, // Mar 3 = present
         1, // Mar 4
         1, // Mar 5
         1, // Mar 6
         1, // Mar 7
        -1, // Mar 8 = Sat
        -1, // Mar 9 = Sun
         2, // Mar 10 = late
         1, // Mar 11
         1, // Mar 12
         0, // Mar 13 = absent
         1, // Mar 14
        -1, // Mar 15 = Sat
        -1, // Mar 16 = Sun
         1, // Mar 17
         1, // Mar 18
         1, // Mar 19
         1, // Mar 20
         1, // Mar 21
        -1, // Mar 22 = Sat
        -1, // Mar 23 = Sun
         1, // Mar 24
         1, // Mar 25
         1, // Mar 26
         1, // Mar 27
         1, // Mar 28
        -1, // Mar 29 = Sat
        -1, // Mar 30 = Sun
         1, // Mar 31
      ]
    },
    subjectAttendance: [
      { subject: "Mathematics",    present: 26, total: 30, pct: 87, color: C.amber  },
      { subject: "Physics",        present: 29, total: 30, pct: 97, color: C.blue   },
      { subject: "Chemistry",      present: 27, total: 30, pct: 90, color: C.green  },
      { subject: "English",        present: 25, total: 30, pct: 83, color: "#5b3fa6"},
      { subject: "Computer Sc.",   present: 30, total: 30, pct: 100,color: C.accent },
      { subject: "Social Studies", present: 22, total: 30, pct: 73, color: C.rose   },
    ],
    absentReasons: [
      { date: "Oct 14–15", reason: "Fever",               days: 2, category: "medical"  },
      { date: "Nov 5–7",   reason: "Family Function",     days: 3, category: "personal" },
      { date: "Nov 22",    reason: "Doctor Appointment",  days: 1, category: "medical"  },
      { date: "Dec 18",    reason: "Unwell (Cold)",       days: 1, category: "medical"  },
      { date: "Jan 6",     reason: "Holiday Travel",      days: 1, category: "personal" },
      { date: "Jan 24",    reason: "Stomach Issue",       days: 1, category: "medical"  },
      { date: "Feb 11",    reason: "Sports Tournament",   days: 2, category: "school"   },
      { date: "Mar 13",    reason: "Unwell",              days: 1, category: "medical"  },
    ],
    weeklyPattern: [
      { day: "Monday",    present: 24, total: 26, pct: 92 },
      { day: "Tuesday",   present: 25, total: 26, pct: 96 },
      { day: "Wednesday", present: 22, total: 26, pct: 85 },
      { day: "Thursday",  present: 25, total: 26, pct: 96 },
      { day: "Friday",    present: 20, total: 26, pct: 77 },
    ],
  },
  2: {
    id: 2, name: "Priya Reddy", grade: "Grade 7 – B", avatar: "PR",
    color: C.accent, colorL: C.accentL, colorBg: C.accentBg,
    overall: 95, present: 173, absent: 9, late: 2, totalDays: 182,
    requirement: 75, medical: 1,
    monthlyData: [
      { month: "September", year: 2024, total: 24, present: 24, absent: 0, late: 0, pct: 100 },
      { month: "October",   year: 2024, total: 25, present: 24, absent: 1, late: 0, pct: 96  },
      { month: "November",  year: 2024, total: 23, present: 22, absent: 1, late: 0, pct: 96  },
      { month: "December",  year: 2024, total: 22, present: 21, absent: 1, late: 0, pct: 95  },
      { month: "January",   year: 2025, total: 26, present: 25, absent: 1, late: 0, pct: 96  },
      { month: "February",  year: 2025, total: 23, present: 22, absent: 1, late: 1, pct: 96  },
      { month: "March",     year: 2025, total: 10, present: 9,  absent: 1, late: 1, pct: 90  },
    ],
    calendarMarch: {
      startDay: 6,
      days: [-1,-1,1,1,1,1,1,-1,-1,1,1,1,1,1,-1,-1,1,1,1,1,1,-1,-1,1,0,1,1,1,-1,-1,1],
    },
    subjectAttendance: [
      { subject: "Mathematics", present: 30, total: 30, pct: 100, color: C.accent },
      { subject: "Science",     present: 29, total: 30, pct: 97,  color: C.green  },
      { subject: "English",     present: 30, total: 30, pct: 100, color: "#5b3fa6"},
      { subject: "Social St.",  present: 28, total: 30, pct: 93,  color: C.blue   },
      { subject: "Hindi",       present: 29, total: 30, pct: 97,  color: C.amber  },
      { subject: "Sanskrit",    present: 27, total: 30, pct: 90,  color: C.rose   },
    ],
    absentReasons: [
      { date: "Oct 10",    reason: "Minor Fever",         days: 1, category: "medical"  },
      { date: "Nov 19",    reason: "School Excursion",    days: 1, category: "school"   },
      { date: "Dec 24",    reason: "Family Function",     days: 1, category: "personal" },
      { date: "Jan 15",    reason: "Republic Day Holiday",days: 1, category: "holiday"  },
      { date: "Feb 14",    reason: "Unwell",              days: 1, category: "medical"  },
      { date: "Mar 25",    reason: "Sports Day Practice", days: 1, category: "school"   },
    ],
    weeklyPattern: [
      { day: "Monday",    present: 26, total: 26, pct: 100 },
      { day: "Tuesday",   present: 26, total: 26, pct: 100 },
      { day: "Wednesday", present: 25, total: 26, pct: 96  },
      { day: "Thursday",  present: 26, total: 26, pct: 100 },
      { day: "Friday",    present: 24, total: 26, pct: 92  },
    ],
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const attColor  = p => p >= 90 ? C.green : p >= 75 ? C.amber : C.rose;
const attLabel  = p => p >= 90 ? "Excellent" : p >= 75 ? "Acceptable" : "Critical";
const catColor  = c => c === "medical" ? C.blue : c === "personal" ? C.amber : c === "school" ? C.green : C.text3;
const catLabel  = c => c.charAt(0).toUpperCase() + c.slice(1);

// ─── Radial ──────────────────────────────────────────────────────────────────
function Radial({ value, color, size = 80, stroke = 7 }) {
  const r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.s3} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: size > 72 ? 17 : 12, fontWeight: 900, lineHeight: 1 }}>{value}%</span>
      </div>
    </div>
  );
}

// ─── Mini bar ────────────────────────────────────────────────────────────────
function HBar({ value, max = 100, color, h = 6 }) {
  return (
    <div style={{ width: "100%", height: h, background: C.s3, borderRadius: h / 2, overflow: "hidden" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: h / 2, transition: "width 1.2s ease" }} />
    </div>
  );
}

// ─── Calendar Cell ───────────────────────────────────────────────────────────
const CAL_STATUS = {
  1:  { bg: C.greenL,  border: C.green + "50", label: "P"  },
  0:  { bg: C.roseL,   border: C.rose  + "50", label: "A"  },
  2:  { bg: C.amberL,  border: C.amber + "50", label: "L"  },
  "-1":{ bg: C.s2,     border: C.border,       label: ""   },
};

function Calendar({ month, color }) {
  const { startDay, days } = month;
  const weekDays = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const calDays = startDay === 6
    ? ["","", ...days]
    : Array(startDay).fill("").concat(days);

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: "center", color: C.text3, fontSize: 10, fontWeight: 800, padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {calDays.map((d, i) => {
          if (d === "") return <div key={i} />;
          const dayNum = i - (startDay === 6 ? 2 : startDay) + 1;
          const cfg = CAL_STATUS[d];
          return (
            <div key={i} style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: 6,
              padding: "5px 2px",
              textAlign: "center",
              minHeight: 34,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}>
              <span style={{ color: d === -1 ? C.text3 : d === 1 ? C.green : d === 0 ? C.rose : C.amber, fontSize: 11, fontWeight: 800 }}>{dayNum}</span>
              {cfg.label && <span style={{ color: d === 1 ? C.green : d === 0 ? C.rose : C.amber, fontSize: 8, fontWeight: 700 }}>{cfg.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ChildAttendance() {
  const { childId } = useParams();
  const navigate    = useNavigate();
  const child = CHILDREN_ATT[childId] || CHILDREN_ATT[1];
  const [selectedMonth, setSelectedMonth] = useState(6); // March (index)
  const { color, colorL, colorBg } = child;

  const mon = child.monthlyData[selectedMonth];
  const projectedEnd = Math.round(child.overall - 0.5); // stays same if nothing changes
  const safe = child.overall >= child.requirement;
  const daysToBarred = safe ? null : Math.ceil(((child.requirement / 100) * child.totalDays - child.present) / (1 - child.requirement / 100));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "28px 30px 52px", fontFamily: "'Lato', 'Segoe UI', sans-serif" }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back</button>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: colorL, border: `3px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color, fontWeight: 900, fontSize: 17 }}>{child.avatar}</span>
          </div>
          <div>
            <h1 style={{ color: C.text1, fontSize: 22, fontWeight: 900, margin: "0 0 2px", fontFamily: "Georgia, serif" }}>{child.name}</h1>
            <p style={{ color: C.text3, fontSize: 13, margin: 0 }}>{child.grade} · Attendance Report</p>
          </div>
        </div>

        {/* Overall attendance badge */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Radial value={child.overall} color={attColor(child.overall)} size={72} stroke={7} />
          <div>
            <p style={{ color: attColor(child.overall), fontSize: 16, fontWeight: 900, margin: "0 0 2px" }}>{attLabel(child.overall)}</p>
            <p style={{ color: C.text3, fontSize: 12, margin: "0 0 2px" }}>{child.present} of {child.totalDays} school days</p>
            <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>Required: {child.requirement}% minimum</p>
          </div>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { l: "Days Present",  v: child.present,              icon: "✓",  col: C.green  },
          { l: "Days Absent",   v: child.absent,               icon: "✗",  col: C.rose   },
          { l: "Days Late",     v: child.late,                 icon: "⏱",  col: C.amber  },
          { l: "Medical Leave", v: child.medical,              icon: "🏥",  col: C.blue   },
        ].map(s => (
          <Card key={s.l} style={{ textAlign: "center", padding: "18px 16px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{s.l}</p>
            <p style={{ color: s.col, fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1 }}>{s.v}</p>
          </Card>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 22, marginBottom: 22 }}>

        {/* Calendar heatmap */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: 0 }}>Monthly Calendar — March 2025</h3>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { col: C.green, l: "Present" },
                { col: C.amber, l: "Late"    },
                { col: C.rose,  l: "Absent"  },
                { col: C.s3,    l: "Holiday" },
              ].map(k => (
                <div key={k.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: k.col }} />
                  <span style={{ color: C.text3, fontSize: 9.5 }}>{k.l}</span>
                </div>
              ))}
            </div>
          </div>
          <Calendar month={child.calendarMarch} color={color} />

          {/* Current month summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Present",  v: child.monthlyData[6].present, col: C.green },
              { l: "Absent",   v: child.monthlyData[6].absent,  col: C.rose  },
              { l: "Total",    v: child.monthlyData[6].total,   col: C.text1 },
            ].map(s => (
              <div key={s.l} style={{ background: C.s2, borderRadius: 9, padding: "10px", textAlign: "center" }}>
                <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px" }}>{s.l}</p>
                <p style={{ color: s.col, fontSize: 18, fontWeight: 900, margin: 0 }}>{s.v}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Month selector + bar chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: "0 0 14px" }}>Monthly Breakdown</h3>

            {/* Month selector pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {child.monthlyData.map((m, i) => (
                <button
                  key={m.month}
                  onClick={() => setSelectedMonth(i)}
                  style={{
                    background: selectedMonth === i ? color + "18" : C.s2,
                    border: `1px solid ${selectedMonth === i ? color + "50" : C.border}`,
                    borderRadius: 20, padding: "5px 12px",
                    color: selectedMonth === i ? color : C.text3,
                    fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  {m.month.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Selected month detail */}
            <div style={{ background: colorBg, border: `1px solid ${color}28`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <p style={{ color, fontSize: 15, fontWeight: 800, margin: "0 0 2px" }}>{mon.month} {mon.year}</p>
                  <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{mon.total} school days</p>
                </div>
                <Radial value={mon.pct} color={attColor(mon.pct)} size={58} stroke={5} />
              </div>
              {[
                { l: "Present", v: mon.present, max: mon.total, col: C.green },
                { l: "Absent",  v: mon.absent,  max: mon.total, col: C.rose  },
                { l: "Late",    v: mon.late,    max: mon.total, col: C.amber  },
              ].map(r => (
                <div key={r.l} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: C.text2, fontSize: 12, fontWeight: 600 }}>{r.l}</span>
                    <span style={{ color: r.col, fontSize: 12, fontWeight: 800 }}>{r.v} / {mon.total}</span>
                  </div>
                  <HBar value={r.v} max={mon.total} color={r.col} h={6} />
                </div>
              ))}
            </div>
          </Card>

          {/* All-months bar chart */}
          <Card style={{ padding: "18px 20px" }}>
            <h3 style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: "0 0 14px" }}>All Months at a Glance</h3>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 70 }}>
              {child.monthlyData.map((m, i) => (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                  <span style={{ color: attColor(m.pct), fontSize: 9.5, fontWeight: 800 }}>{m.pct}%</span>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", background: i === selectedMonth ? color : attColor(m.pct) + "cc", borderRadius: "4px 4px 0 0", height: `${m.pct}%`, minHeight: 6, cursor: "pointer", transition: "height 0.6s ease" }} onClick={() => setSelectedMonth(i)} />
                  </div>
                  <span style={{ color: C.text3, fontSize: 9, fontWeight: 700 }}>{m.month.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            {/* Required 75% line indicator */}
            <p style={{ color: C.rose, fontSize: 10.5, fontWeight: 700, margin: "8px 0 0" }}>
              — Red line = 75% minimum requirement
            </p>
          </Card>
        </div>
      </div>

      {/* ── Subject-wise + Weekly pattern ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 22 }}>

        <Card>
          <h3 style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: "0 0 16px" }}>Subject-Wise Attendance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {child.subjectAttendance.sort((a, b) => a.pct - b.pct).map(s => (
              <div key={s.subject}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
                    <span style={{ color: C.text1, fontSize: 13, fontWeight: 600 }}>{s.subject}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: C.text3, fontSize: 11.5 }}>{s.present}/{s.total} classes</span>
                    <span style={{ color: attColor(s.pct), fontSize: 12.5, fontWeight: 800, minWidth: 38, textAlign: "right" }}>{s.pct}%</span>
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <HBar value={s.pct} color={s.color} h={7} />
                  {/* 75% marker */}
                  <div style={{ position: "absolute", left: "75%", top: -3, width: 1.5, height: 13, background: C.rose, opacity: 0.5 }} />
                </div>
                {s.pct < 75 && (
                  <p style={{ color: C.rose, fontSize: 10, fontWeight: 700, margin: "3px 0 0" }}>
                    ⚠ Below minimum — {75 - s.pct}% gap. Risk of being barred from exam.
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Weekly pattern */}
          <Card>
            <h3 style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: "0 0 14px" }}>Day-of-Week Pattern</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {child.weeklyPattern.map(w => (
                <div key={w.day} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color: C.text2, fontSize: 12.5, fontWeight: 700, minWidth: 80 }}>{w.day}</span>
                  <div style={{ flex: 1 }}>
                    <HBar value={w.pct} color={attColor(w.pct)} h={8} />
                  </div>
                  <span style={{ color: attColor(w.pct), fontSize: 12.5, fontWeight: 800, minWidth: 36, textAlign: "right" }}>{w.pct}%</span>
                </div>
              ))}
            </div>
            {(() => {
              const weakest = [...child.weeklyPattern].sort((a,b) => a.pct - b.pct)[0];
              return (
                <div style={{ marginTop: 14, padding: "10px 14px", background: C.amberBg, border: `1px solid ${C.amber}30`, borderRadius: 9 }}>
                  <p style={{ color: C.amber, fontSize: 12, fontWeight: 700, margin: 0 }}>
                    {weakest.day}s have the lowest attendance ({weakest.pct}%). Try to ensure {child.name.split(" ")[0]} attends all {weakest.day} classes.
                  </p>
                </div>
              );
            })()}
          </Card>

          {/* Compliance card */}
          <Card style={{ background: safe ? C.greenBg : C.roseBg, border: `1px solid ${safe ? C.green : C.rose}30` }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 28 }}>{safe ? "✅" : "⚠️"}</span>
              <div>
                <p style={{ color: safe ? C.green : C.rose, fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>
                  {safe ? "Attendance Requirement Met" : "Attendance Below Requirement"}
                </p>
                <p style={{ color: C.text2, fontSize: 12.5, margin: "0 0 8px", lineHeight: 1.5 }}>
                  {safe
                    ? `${child.name.split(" ")[0]} has ${child.overall}% attendance — well above the ${child.requirement}% minimum required.`
                    : `Current attendance is ${child.overall}%. Must reach ${child.requirement}% to avoid exam bar. ${daysToBarred ? `Can miss max ${daysToBarred} more days.` : ""}`}
                </p>
                {safe && (
                  <p style={{ color: C.green, fontSize: 11.5, fontWeight: 700, margin: 0 }}>
                    Can miss up to {Math.floor((child.present - child.requirement / 100 * child.totalDays))} more days and still comply.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Absence reasons ────────────────────────────────────────── */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: 0 }}>Absence Log</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {["medical","personal","school","holiday"].map(cat => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: catColor(cat) }} />
                <span style={{ color: C.text3, fontSize: 10.5, textTransform: "capitalize" }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {child.absentReasons.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: C.s2, borderRadius: 11, border: `1px solid ${C.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: catColor(a.category) + "18", border: `1px solid ${catColor(a.category)}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: catColor(a.category), fontSize: 10, fontWeight: 800 }}>
                  {a.days}d
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.reason}</p>
                <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>{a.date}</p>
              </div>
              <span style={{ background: catColor(a.category) + "18", color: catColor(a.category), fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 20, flexShrink: 0 }}>
                {catLabel(a.category)}
              </span>
            </div>
          ))}
        </div>

        {/* Category summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          {["medical","personal","school","holiday"].map(cat => {
            const count = child.absentReasons.filter(a => a.category === cat).reduce((s, a) => s + a.days, 0);
            return (
              <div key={cat} style={{ background: catColor(cat) + "0d", border: `1px solid ${catColor(cat)}25`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                <p style={{ color: catColor(cat), fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>{catLabel(cat)}</p>
                <p style={{ color: catColor(cat), fontSize: 20, fontWeight: 900, margin: 0 }}>{count} <span style={{ fontSize: 11, fontWeight: 600 }}>days</span></p>
              </div>
            );
          })}
        </div>
      </Card>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap'); *{box-sizing:border-box}`}</style>
    </div>
  );
}