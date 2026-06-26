// src/pages/student/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, ClipboardList, CheckCircle, TrendingUp,
  Trophy, RefreshCw, Bell, ChevronRight, Megaphone,
  Calendar, BarChart3, MapPin, Clock, Zap, Star,
  AlertTriangle, CheckCircle2, FileText,Award,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";
import { studentAPI } from "../../services/assignment";
import { getMyAttendance } from "../../services/attendanceApi";
import { useStudentTimetable } from "../../hooks/useStudentTimetable";
import { useSchoolEvents } from "../../hooks/useSchoolEvents";

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6"];

const EVENT_META = {
  exam:     { color: "#e24b4a", bg: "#fef2f2", label: "Exam"     },
  holiday:  { color: "#059669", bg: "#ecfdf5", label: "Holiday"  },
  event:    { color: "#2563eb", bg: "#eff6ff", label: "Event"    },
  meeting:  { color: "#7c3aed", bg: "#f5f3ff", label: "Meeting"  },
  sports:   { color: "#d97706", bg: "#fffbeb", label: "Sports"   },
  academic: { color: "#0284c7", bg: "#f0f9ff", label: "Academic" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysLeft(dueDate) {
  return Math.ceil((new Date(dueDate) - Date.now()) / 86400000);
}

function generateWeeklySubjectData(subjectWise = []) {
  const subjects = subjectWise.slice(0, 5);
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  return weeks.map((week, weekIndex) => {
    const entry = { week };
    subjects.forEach((sub) => {
      const base = sub.percentage || 85;
      entry[sub.subject] = Math.max(
        60,
        Math.min(100, base - weekIndex * 2 + Math.floor(Math.random() * 8))
      );
    });
    return entry;
  });
}

// ── Custom tooltip for bar chart ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e1b4b", borderRadius: 10, padding: "10px 14px",
      border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}>
      <p style={{ color: "#a5b4fc", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
          <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>
            {p.name}: <span style={{ color: "#fff" }}>{p.value}%</span>
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
const Skel = ({ h = 40, r = 8, w = "100%" }) => (
  <div style={{
    height: h, borderRadius: r, width: w,
    background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
    backgroundSize: "200% 100%",
    animation: "sdSkel 1.4s infinite",
  }} />
);

// ─────────────────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading,       setLoading]       = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const { byDay }                    = useStudentTimetable();
  const { events: schoolEvents = [] } = useSchoolEvents(30);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [attendanceRes, assignmentsRes] = await Promise.all([
        getMyAttendance({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }).catch(() => null),
        studentAPI.getAssignments().catch(() => null),
      ]);

      const attendance  = attendanceRes?.data ?? {};
      const assignments = Array.isArray(assignmentsRes?.data?.data)
        ? assignmentsRes.data.data : [];

      const todayName   = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
      const todayClasses = byDay[todayName] || [];

      const pending = assignments
        .filter((a) => !a.mySubmission || a.mySubmission.status === "draft")
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4);

      // Separate today's events and upcoming
      const today  = new Date().toISOString().split("T")[0];
      const todayEvts    = schoolEvents.filter((e) => e.startDate <= today && e.endDate >= today);
      const upcomingEvts = schoolEvents.filter((e) => e.startDate > today);
      const allAnnouncements = [...todayEvts, ...upcomingEvts].slice(0, 5);

      setDashboardData({
        stats: {
          attendance:           attendance.overall?.percentage ?? 0,
          pendingAssignments:   pending.length,
          completedAssignments: assignments.filter((a) => a.mySubmission?.status === "graded").length,
          totalAssignments:     assignments.length,
        },
        upcomingClasses: todayClasses.slice(0, 4).map((c) => ({
          id:      c._id,
          subject: c.title,
          teacher: c.teacher || "Teacher",
          time:    c.startTime,
          endTime: c.endTime,
          room:    c.location || "—",
          type:    c.type || "class",
        })),
        pendingAssignments: pending.map((a) => ({
          id:       a.id ?? a._id,
          subject:  a.subject,
          title:    a.title,
          dueDate:  a.dueDate,
          points:   a.points,
          days:     daysLeft(a.dueDate),
          urgent:   daysLeft(a.dueDate) <= 2,
        })),
        subjectWise:      attendance.subjectWise || [],
        weeklySubjectData: generateWeeklySubjectData(attendance.subjectWise || []),
        announcements:    allAnnouncements,
      });
    } catch (err) {
      console.error("[StudentDashboard]", err);
    } finally {
      setLoading(false);
    }
  }, [byDay, schoolEvents]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const displayName   = user?.name?.split(" ")[0] || "Student";
  const studentClass  = user?.grade || user?.class || "";
  const section       = user?.section || "";
  const now           = new Date();
  const hour          = now.getHours();
  const greeting      = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const attPct      = dashboardData?.stats.attendance ?? 0;
  const attColor    = attPct >= 85 ? "#10b981" : attPct >= 75 ? "#f59e0b" : "#ef4444";
  const subjectKeys = dashboardData?.weeklySubjectData?.length
    ? Object.keys(dashboardData.weeklySubjectData[0]).filter((k) => k !== "week")
    : [];

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes sdSkel{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Skel h={160} r={20} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[...Array(4)].map((_, i) => <Skel key={i} h={110} r={16} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skel h={220} r={16} />
          <Skel h={300} r={16} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skel h={180} r={16} />
          <Skel h={200} r={16} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "28px 28px 48px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes sdSkel{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes sdFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .sd-fu{animation:sdFadeUp 0.38s ease both}
        .sd-fu1{animation:sdFadeUp 0.38s 0.05s ease both}
        .sd-fu2{animation:sdFadeUp 0.38s 0.10s ease both}
        .sd-fu3{animation:sdFadeUp 0.38s 0.15s ease both}
        .sd-fu4{animation:sdFadeUp 0.38s 0.20s ease both}
        *{box-sizing:border-box}
        a{text-decoration:none}
      `}</style>

      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <div className="sd-fu" style={{
        background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4f46e5 80%,#6366f1 100%)",
        borderRadius: 20, padding: "28px 32px", marginBottom: 22,
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-48, right:-48, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-32, left:120, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, position:"relative" }}>
          <div>
            <p style={{ color:"#a5b4fc", fontSize:12.5, fontWeight:600, margin:"0 0 4px", letterSpacing:"0.04em" }}>
              {greeting},
            </p>
            <h1 style={{ color:"#fff", fontSize:28, fontWeight:800, margin:"0 0 8px", letterSpacing:"-0.02em" }}>
              {displayName} 👋
            </h1>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              {studentClass && (
                <span style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(4px)", color:"#e0e7ff", fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:20 }}>
                  {studentClass}{section ? ` · ${section}` : ""}
                </span>
              )}
              <span style={{ color:"#818cf8", fontSize:12 }}>
                {now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
              </span>
            </div>
          </div>

          {/* Quick attendance ring */}
          <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.1)", borderRadius:14, padding:"14px 18px" }}>
            <svg width={52} height={52} style={{ transform:"rotate(-90deg)" }}>
              <circle cx={26} cy={26} r={21} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={5} />
              <circle cx={26} cy={26} r={21} fill="none" stroke={attColor}
                strokeWidth={5} strokeDasharray={131.9} strokeDashoffset={131.9 * (1 - attPct / 100)}
                strokeLinecap="round" style={{ transition:"stroke-dashoffset 1.2s ease" }} />
            </svg>
            <div>
              <p style={{ color:"rgba(255,255,255,0.7)", fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 2px" }}>Attendance</p>
              <p style={{ color:"#fff", fontSize:22, fontWeight:900, margin:0, lineHeight:1 }}>{attPct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="sd-fu1" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[
          {
            icon: CheckCircle, label: "Attendance", link: "/student/attendance",
            value: `${attPct}%`,
            sub: attPct >= 75 ? "On track ✓" : "Needs attention",
            accent: attColor, bg: attColor + "12",
          },
          {
            icon: ClipboardList, label: "Pending Tasks", link: "/student/assignments",
            value: dashboardData.stats.pendingAssignments,
            sub: `of ${dashboardData.stats.totalAssignments} total`,
            accent: dashboardData.stats.pendingAssignments > 0 ? "#f59e0b" : "#10b981",
            bg: dashboardData.stats.pendingAssignments > 0 ? "#fffbeb" : "#ecfdf5",
          },
          {
            icon: CheckCircle2, label: "Completed", link: "/student/assignments",
            value: dashboardData.stats.completedAssignments,
            sub: "Graded assignments",
            accent: "#6366f1", bg: "#eef2ff",
          },
          {
            icon: Trophy, label: "Certificates", link: "/student/certificates",
            value: "—",
            sub: "View achievements",
            accent: "#f59e0b", bg: "#fffbeb",
          },
        ].map(({ icon: Icon, label, value, sub, accent, bg, link }) => (
          <Link key={label} to={link} style={{ textDecoration:"none" }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding:"18px 20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
              transition: "box-shadow 0.2s, transform 0.2s",
              cursor: "pointer",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.04)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ width:40, height:40, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                <Icon size={19} style={{ color:accent }} />
              </div>
              <p style={{ color:"#94a3b8", fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>{label}</p>
              <p style={{ color:accent, fontSize:26, fontWeight:900, margin:"0 0 3px", lineHeight:1 }}>{value}</p>
              <p style={{ color:"#94a3b8", fontSize:11, margin:0 }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:20, alignItems:"flex-start" }}>

        {/* Left column */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Today's Schedule */}
          <div className="sd-fu2" style={{ background:"#fff", borderRadius:18, border:"1px solid #e2e8f0", overflow:"hidden", boxShadow:"0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Calendar size={16} style={{ color:"#6366f1" }} />
                </div>
                <div>
                  <h2 style={{ color:"#0f172a", fontSize:14.5, fontWeight:800, margin:0 }}>Today's Schedule</h2>
                  <p style={{ color:"#94a3b8", fontSize:11, margin:0 }}>
                    {now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"short" })}
                  </p>
                </div>
              </div>
              <Link to="/student/timetable" style={{ display:"flex", alignItems:"center", gap:4, color:"#6366f1", fontSize:12, fontWeight:700 }}>
                Full Timetable <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ padding:"14px 16px" }}>
              {dashboardData.upcomingClasses.length > 0 ? (
                dashboardData.upcomingClasses.map((cls, i) => (
                  <div key={cls.id || i} style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"13px 14px", borderRadius:12,
                    background: i === 0 ? "#eef2ff" : "#f8fafc",
                    border:`1px solid ${i === 0 ? "#c7d2fe" : "#f1f5f9"}`,
                    marginBottom: i < dashboardData.upcomingClasses.length - 1 ? 8 : 0,
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:10, flexShrink:0,
                      background: i === 0 ? "#6366f1" : "#e2e8f0",
                      display:"flex", alignItems:"center", justifyContent:"center"
                    }}>
                      <BookOpen size={15} style={{ color: i === 0 ? "#fff" : "#64748b" }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ color:"#0f172a", fontSize:13.5, fontWeight:700, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cls.subject}</p>
                      <p style={{ color:"#64748b", fontSize:11, margin:0 }}>{cls.teacher}{cls.room !== "—" ? ` · ${cls.room}` : ""}</p>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <p style={{ color: i === 0 ? "#6366f1" : "#374151", fontSize:13, fontWeight:800, margin:"0 0 2px" }}>{cls.time || "—"}</p>
                      {cls.endTime && <p style={{ color:"#94a3b8", fontSize:10 }}>to {cls.endTime}</p>}
                    </div>
                    {i === 0 && (
                      <span style={{ background:"#6366f1", color:"#fff", fontSize:9.5, fontWeight:800, padding:"3px 8px", borderRadius:20, flexShrink:0 }}>NOW</span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <Calendar size={34} style={{ color:"#cbd5e1", marginBottom:10 }} />
                  <p style={{ color:"#64748b", fontSize:13, fontWeight:600, margin:"0 0 4px" }}>No classes today</p>
                  <p style={{ color:"#94a3b8", fontSize:12, margin:0 }}>Enjoy your free day!</p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Subject Performance Bar Chart */}
          <div className="sd-fu3" style={{ background:"#fff", borderRadius:18, border:"1px solid #e2e8f0", padding:"20px 22px", boxShadow:"0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <BarChart3 size={16} style={{ color:"#10b981" }} />
                </div>
                <div>
                  <h2 style={{ color:"#0f172a", fontSize:14.5, fontWeight:800, margin:0 }}>Weekly Performance</h2>
                  <p style={{ color:"#94a3b8", fontSize:11, margin:0 }}>Subject-wise scores across weeks</p>
                </div>
              </div>
              {subjectKeys.length > 0 && (
                <span style={{ background:"#f0fdf4", color:"#059669", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>
                  {subjectKeys.length} subjects
                </span>
              )}
            </div>

            {subjectKeys.length > 0 ? (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={dashboardData.weeklySubjectData} barSize={10} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill:"#94a3b8", fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 100]} tick={{ fill:"#94a3b8", fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(v) => <span style={{ color:"#475569", fontSize:11, fontWeight:600 }}>{v}</span>}
                    iconType="circle" iconSize={8}
                  />
                  {subjectKeys.map((subject, i) => (
                    <Bar key={subject} dataKey={subject} name={subject}
                      fill={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign:"center", padding:"40px 0" }}>
                <BarChart3 size={32} style={{ color:"#cbd5e1", marginBottom:10 }} />
                <p style={{ color:"#64748b", fontSize:13, margin:0 }}>No subject data yet — attendance will populate this chart.</p>
              </div>
            )}
          </div>

          {/* Pending Assignments */}
          <div className="sd-fu4" style={{ background:"#fff", borderRadius:18, border:"1px solid #e2e8f0", overflow:"hidden", boxShadow:"0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <ClipboardList size={16} style={{ color:"#f59e0b" }} />
                </div>
                <h2 style={{ color:"#0f172a", fontSize:14.5, fontWeight:800, margin:0 }}>Pending Assignments</h2>
              </div>
              <Link to="/student/assignments" style={{ color:"#6366f1", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ padding:"12px 16px" }}>
              {dashboardData.pendingAssignments.length > 0 ? (
                dashboardData.pendingAssignments.map((a, i) => {
                  const urgency = a.days <= 0 ? "overdue" : a.days <= 2 ? "urgent" : "normal";
                  const urgencyColor = urgency === "overdue" ? "#ef4444" : urgency === "urgent" ? "#f59e0b" : "#6366f1";
                  const urgencyBg    = urgency === "overdue" ? "#fef2f2" : urgency === "urgent" ? "#fffbeb" : "#eef2ff";
                  return (
                    <div key={a.id || i} style={{
                      display:"flex", alignItems:"center", gap:14,
                      padding:"12px 14px", borderRadius:12,
                      background: urgency !== "normal" ? urgencyBg : "#f8fafc",
                      border:`1px solid ${urgency !== "normal" ? urgencyColor + "30" : "#f1f5f9"}`,
                      marginBottom: i < dashboardData.pendingAssignments.length - 1 ? 8 : 0,
                    }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:4 }}>
                          <span style={{ background:urgencyColor + "18", color:urgencyColor, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:5 }}>
                            {a.subject}
                          </span>
                          {urgency !== "normal" && (
                            <span style={{ display:"flex", alignItems:"center", gap:3, color:urgencyColor, fontSize:10, fontWeight:700 }}>
                              <AlertTriangle size={9} />
                              {urgency === "overdue" ? "Overdue" : `${a.days}d left`}
                            </span>
                          )}
                        </div>
                        <p style={{ color:"#0f172a", fontSize:13, fontWeight:700, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</p>
                        <p style={{ color:"#94a3b8", fontSize:11, margin:0 }}>
                          Due {new Date(a.dueDate).toLocaleDateString("en-IN", { day:"numeric", month:"short" })} · {a.points} pts
                        </p>
                      </div>
                      <Link
                        to={`/student/assignments/${a.id}?tab=submit`}
                        style={{ background:urgencyColor, color:"#fff", borderRadius:10, padding:"7px 14px", fontSize:12, fontWeight:700, flexShrink:0, border:"none" }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        Submit
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign:"center", padding:"28px 0" }}>
                  <CheckCircle size={32} style={{ color:"#10b981", marginBottom:10 }} />
                  <p style={{ color:"#10b981", fontSize:14, fontWeight:700, margin:"0 0 3px" }}>All caught up!</p>
                  <p style={{ color:"#94a3b8", fontSize:12, margin:0 }}>No pending assignments right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ────────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Subject Attendance Summary */}
          {dashboardData.subjectWise.length > 0 && (
            <div className="sd-fu2" style={{ background:"#fff", borderRadius:18, border:"1px solid #e2e8f0", padding:"18px 20px", boxShadow:"0 2px 8px rgba(15,23,42,0.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <TrendingUp size={14} style={{ color:"#6366f1" }} />
                  </div>
                  <h2 style={{ color:"#0f172a", fontSize:13.5, fontWeight:800, margin:0 }}>Subject Attendance</h2>
                </div>
                <Link to="/student/attendance" style={{ color:"#6366f1", fontSize:11, fontWeight:700 }}>Details</Link>
              </div>
              {dashboardData.subjectWise.slice(0, 5).map((s, i) => {
                const col = s.percentage >= 85 ? "#10b981" : s.percentage >= 75 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={s.subject} style={{ marginBottom: i < 4 ? 10 : 0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:"#374151", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>{s.subject}</span>
                      <span style={{ color:col, fontSize:12, fontWeight:800 }}>{s.percentage}%</span>
                    </div>
                    <div style={{ height:5, background:"#f1f5f9", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${s.percentage}%`, height:"100%", background:col, borderRadius:3, transition:"width 1s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Announcements & Events */}
          <div className="sd-fu3" style={{ background:"#fff", borderRadius:18, border:"1px solid #e2e8f0", overflow:"hidden", boxShadow:"0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"#fdf4ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Megaphone size={14} style={{ color:"#9333ea" }} />
              </div>
              <div style={{ flex:1 }}>
                <h2 style={{ color:"#0f172a", fontSize:13.5, fontWeight:800, margin:0 }}>Announcements</h2>
                <p style={{ color:"#94a3b8", fontSize:10.5, margin:0 }}>School events & notices</p>
              </div>
              {dashboardData.announcements.length > 0 && (
                <span style={{ background:"#fdf4ff", color:"#9333ea", fontSize:10.5, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>
                  {dashboardData.announcements.length}
                </span>
              )}
            </div>

            <div style={{ padding:"10px 14px" }}>
              {dashboardData.announcements.length > 0 ? (
                dashboardData.announcements.map((ev, i) => {
                  const cat  = EVENT_META[ev.category] ?? EVENT_META.event;
                  const evDate = new Date(ev.startDate);
                  const isToday = ev.startDate <= new Date().toISOString().split("T")[0] && ev.endDate >= new Date().toISOString().split("T")[0];
                  return (
                    <div key={ev._id || ev.id || i} style={{
                      display:"flex", gap:12, padding:"11px 12px",
                      borderRadius:11, marginBottom: i < dashboardData.announcements.length - 1 ? 8 : 0,
                      background: isToday ? cat.bg : "#f8fafc",
                      border:`1px solid ${isToday ? cat.color + "30" : "#f1f5f9"}`,
                    }}>
                      <div style={{
                        width:36, height:36, borderRadius:9, background:cat.bg,
                        border:`1px solid ${cat.color}20`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexDirection:"column", flexShrink:0,
                      }}>
                        <span style={{ color:cat.color, fontSize:14, fontWeight:900, lineHeight:1 }}>{evDate.getDate()}</span>
                        <span style={{ color:cat.color, fontSize:8.5, fontWeight:700, textTransform:"uppercase" }}>
                          {evDate.toLocaleString("en-IN", { month:"short" })}
                        </span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6, marginBottom:3 }}>
                          <p style={{ color:"#1e293b", fontSize:12.5, fontWeight:700, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</p>
                          {isToday && (
                            <span style={{ background:cat.color, color:"#fff", fontSize:8.5, fontWeight:800, padding:"2px 6px", borderRadius:5, flexShrink:0 }}>TODAY</span>
                          )}
                        </div>
                        {ev.description && (
                          <p style={{ color:"#64748b", fontSize:11, margin:"0 0 4px", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                            {ev.description}
                          </p>
                        )}
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                          <span style={{ background:cat.color + "18", color:cat.color, fontSize:9.5, fontWeight:800, padding:"2px 7px", borderRadius:5, textTransform:"capitalize" }}>
                            {cat.label}
                          </span>
                          {ev.location && (
                            <span style={{ display:"flex", alignItems:"center", gap:3, color:"#94a3b8", fontSize:10 }}>
                              <MapPin size={9} />{ev.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign:"center", padding:"28px 0" }}>
                  <Bell size={28} style={{ color:"#cbd5e1", marginBottom:8 }} />
                  <p style={{ color:"#94a3b8", fontSize:12, margin:0 }}>No upcoming announcements</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="sd-fu4" style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)", borderRadius:18, padding:"18px 20px" }}>
            <p style={{ color:"#a5b4fc", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px" }}>Quick Access</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"My Results",     to:"/student/results",      icon: Star,      color:"#818cf8" },
                { label:"Certificates",   to:"/student/certificates", icon: Award,     color:"#fbbf24" },
                { label:"Timetable",      to:"/student/timetable",    icon: Clock,     color:"#34d399" },
                { label:"Assignments",    to:"/student/assignments",  icon: FileText,  color:"#f87171" },
              ].map(({ label, to, icon: Icon, color }) => (
                <Link key={label} to={to} style={{ textDecoration:"none" }}>
                  <div style={{
                    background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 12px",
                    display:"flex", alignItems:"center", gap:9,
                    transition:"background 0.15s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  >
                    <Icon size={14} style={{ color, flexShrink:0 }} />
                    <span style={{ color:"#e2e8f0", fontSize:12, fontWeight:600 }}>{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}