import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#faf9f7", surface: "#ffffff", s2: "#f5f2ee", s3: "#ede9e3",
  border: "#ede9e3", text1: "#1a1612", text2: "#6b6057", text3: "#a89d93",
  accent: "#c96b2e", accentL: "#f4ede6", accentBg: "#c96b2e12",
  green: "#2d7d4a", greenL: "#e8f5ed", greenBg: "#2d7d4a0e",
  rose: "#c0392b", roseL: "#fdecea", roseBg: "#c0392b0e",
  amber: "#b8640a", amberL: "#fef3e2", amberBg: "#b8640a0e",
  blue: "#1d5fa6", blueL: "#e8f0fb", blueBg: "#1d5fa60e",
  violet: "#5b3fa6", violetL: "#eeebfb", violetBg: "#5b3fa60e",
  teal: "#0f766e", tealL: "#e6f7f6", tealBg: "#0f766e0e",
};

// ─── Notification Data ────────────────────────────────────────────────────────
const INITIAL_NOTIFICATIONS = [
  // Academic
  { id: 1,  category: "academic",  priority: "high",   read: false, pinned: true,  time: "9:34 AM",       date: "Today",     icon: "📊", color: C.blue,   title: "Aryan's Physics test result is out",      body: "Aryan scored 81/100 in Unit Test 3 Physics. Grade: A–. View full marksheet.", action: { label: "View Result", path: "/parent/children/1/results" } },
  { id: 2,  category: "academic",  priority: "medium", read: false, pinned: false, time: "8:15 AM",       date: "Today",     icon: "📝", color: C.violet, title: "New assignment from Mr. Rajesh",           body: "Mathematics – Polynomial equations assignment due March 18. 2 days remaining.", action: { label: "View Assignment", path: "#" } },
  { id: 3,  category: "academic",  priority: "low",    read: true,  pinned: false, time: "Yesterday",     date: "Yesterday", icon: "🎓", color: C.green,  title: "Priya ranked #3 in class this month",     body: "Priya Reddy has moved up 2 positions to Rank #3 out of 38 students. Great progress!", action: { label: "View Performance", path: "/parent/children/2/performance" } },

  // Fees
  { id: 4,  category: "fees",      priority: "urgent", read: false, pinned: true,  time: "9:00 AM",       date: "Today",     icon: "💳", color: C.rose,   title: "⚠ Fee payment due in 7 days",             body: "Term 2 fees of ₹12,500 for Aryan Reddy are due by March 20, 2025. Pay now to avoid late fee.", action: { label: "Pay Now", path: "/parent/fees/pay" } },
  { id: 5,  category: "fees",      priority: "low",    read: true,  pinned: false, time: "2 days ago",    date: "Mar 11",    icon: "✅", color: C.green,  title: "Fee payment confirmed for Priya",         body: "₹10,800 paid successfully for Priya Reddy. Transaction Ref: UPI202503011456.", action: { label: "Download Receipt", path: "#" } },

  // Attendance
  { id: 6,  category: "attendance",priority: "high",   read: false, pinned: false, time: "7:30 AM",       date: "Today",     icon: "📋", color: C.amber,  title: "Aryan's attendance fell below 90%",       body: "Aryan's current attendance is 88%. Regular attendance is required for exam eligibility.", action: { label: "View Attendance", path: "/parent/children/1/attendance" } },
  { id: 7,  category: "attendance",priority: "low",    read: true,  pinned: false, time: "Mar 12",        date: "Mar 12",    icon: "✓",  color: C.green,  title: "Priya had perfect attendance this week",  body: "All 5 classes attended. Priya's overall attendance is now 95%. Keep it up!", action: null },

  // Messages
  { id: 8,  category: "messages",  priority: "high",   read: false, pinned: false, time: "9:33 AM",       date: "Today",     icon: "💬", color: C.accent, title: "New message from Mrs. Priya Nambiar",     body: "PTM is scheduled for March 22nd, 10 AM – 1 PM. Please collect your slot token from the front desk.", action: { label: "Reply", path: "/parent/messages" } },
  { id: 9,  category: "messages",  priority: "medium", read: true,  pinned: false, time: "Mar 11",        date: "Mar 11",    icon: "💬", color: C.violet, title: "Message from Mr. Rajesh Kumar",           body: "Aryan needs to focus on word problems. I've shared some practice resources.", action: { label: "View Message", path: "/parent/messages" } },
  { id: 10, category: "messages",  priority: "low",    read: true,  pinned: false, time: "Mar 10",        date: "Mar 10",    icon: "💬", color: C.teal,   title: "Mrs. Leela Sharma sent a message",        body: "Physics lab report has some errors. Please ask Aryan to re-submit by Friday.", action: { label: "View Message", path: "/parent/messages" } },

  // School Events
  { id: 11, category: "events",    priority: "medium", read: false, pinned: false, time: "Mar 13",        date: "Mar 13",    icon: "🏃", color: C.green,  title: "Annual Sports Day – March 25",            body: "Sports Day is on March 25. Students must wear sports uniform. Participation is mandatory for all.", action: { label: "Add to Calendar", path: "#" } },
  { id: 12, category: "events",    priority: "medium", read: true,  pinned: false, time: "Mar 12",        date: "Mar 12",    icon: "👥", color: C.blue,   title: "Parent-Teacher Meeting – March 22",       body: "PTM is scheduled for March 22nd, 10:00 AM – 1:00 PM. All parents are requested to attend.", action: { label: "RSVP", path: "#" } },
  { id: 13, category: "events",    priority: "low",    read: true,  pinned: false, time: "Mar 10",        date: "Mar 10",    icon: "🎨", color: C.violet, title: "Art Exhibition – March 28",               body: "Annual Art Exhibition on March 28. Priya's paintings will be on display. You're invited!", action: { label: "View Details", path: "#" } },

  // System
  { id: 14, category: "system",    priority: "low",    read: true,  pinned: false, time: "Mar 9",         date: "Mar 9",     icon: "🔒", color: C.amber,  title: "New login from Safari · iPhone",          body: "A new login was detected from Safari on iPhone 15 in Bengaluru. Was this you?", action: { label: "Review Activity", path: "#" } },
  { id: 15, category: "system",    priority: "low",    read: true,  pinned: false, time: "Mar 8",         date: "Mar 8",     icon: "⚙️", color: C.text3,  title: "App updated to v2.4.1",                  body: "AcademySphere has been updated. New features: improved PDF reports and attendance calendar view.", action: { label: "What's New", path: "#" } },
  { id: 16, category: "system",    priority: "low",    read: true,  pinned: false, time: "Mar 5",         date: "Mar 5",     icon: "📧", color: C.blue,   title: "Email address verified",                  body: "Your email address sunita.reddy@gmail.com has been successfully verified.", action: null },
];

const CATEGORIES = [
  { k: "all",        l: "All",        icon: "🔔" },
  { k: "academic",   l: "Academic",   icon: "📚" },
  { k: "fees",       l: "Fees",       icon: "💳" },
  { k: "attendance", l: "Attendance", icon: "📋" },
  { k: "messages",   l: "Messages",   icon: "💬" },
  { k: "events",     l: "Events",     icon: "🗓" },
  { k: "system",     l: "System",     icon: "⚙️" },
];

const PRIORITY_CFG = {
  urgent: { color: C.rose,   bg: C.roseL,   label: "Urgent",  dot: "●" },
  high:   { color: C.amber,  bg: C.amberL,  label: "High",    dot: "●" },
  medium: { color: C.blue,   bg: C.blueL,   label: "Medium",  dot: "●" },
  low:    { color: C.text3,  bg: C.s2,      label: "Low",     dot: "○" },
};

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? C.accent : C.s3, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 19 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px #00000022" }} />
    </div>
  );
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({ notif, onRead, onPin, onDelete, onAction, selected, onSelect }) {
  const pc = PRIORITY_CFG[notif.priority];
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 0, background: notif.read ? C.surface : `linear-gradient(90deg, ${notif.color}06, ${C.surface})`, border: `1.5px solid ${selected ? notif.color + "60" : notif.read ? C.border : notif.color + "30"}`, borderRadius: 14, overflow: "hidden", transition: "all 0.15s", cursor: "pointer", boxShadow: hover ? "0 4px 16px #0000000a" : "none" }}
    >
      {/* Unread indicator bar */}
      <div style={{ width: 4, background: notif.read ? "transparent" : notif.color, flexShrink: 0, transition: "background 0.2s" }} />

      <div style={{ flex: 1, padding: "16px 18px", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Checkbox */}
          <div onClick={e => { e.stopPropagation(); onSelect(notif.id); }} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected ? notif.color : C.border}`, background: selected ? notif.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, cursor: "pointer", transition: "all 0.14s" }}>
            {selected && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
          </div>

          {/* Icon */}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: notif.color + "18", border: `1px solid ${notif.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{notif.icon}</div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }} onClick={() => { onRead(notif.id); }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4, alignItems: "flex-start" }}>
              <p style={{ color: notif.read ? C.text2 : C.text1, fontSize: 14, fontWeight: notif.read ? 600 : 800, margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                {!notif.read && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: notif.color, marginRight: 7, verticalAlign: "middle" }} />}
                {notif.title}
              </p>
              <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
                {notif.pinned && <span style={{ fontSize: 13 }}>📌</span>}
                <span style={{ background: pc.bg, color: pc.color, fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, border: `1px solid ${pc.color}25` }}>{pc.label}</span>
                <span style={{ color: C.text3, fontSize: 11.5 }}>{notif.time}</span>
              </div>
            </div>
            <p style={{ color: C.text3, fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>{notif.body}</p>
            {notif.action && (
              <button onClick={e => { e.stopPropagation(); onAction(notif); }} style={{ background: notif.color + "14", border: `1px solid ${notif.color}35`, borderRadius: 8, padding: "6px 14px", color: notif.color, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.14s" }}
                onMouseEnter={e => { e.currentTarget.style.background = notif.color + "22"; }}
                onMouseLeave={e => { e.currentTarget.style.background = notif.color + "14"; }}
              >{notif.action.label} →</button>
            )}
          </div>

          {/* Actions (on hover) */}
          <div style={{ display: "flex", gap: 4, opacity: hover ? 1 : 0, transition: "opacity 0.15s", flexShrink: 0 }}>
            <button onClick={e => { e.stopPropagation(); onPin(notif.id); }} title={notif.pinned ? "Unpin" : "Pin"} style={{ background: notif.pinned ? C.amberBg : C.s2, border: `1px solid ${notif.pinned ? C.amber + "40" : C.border}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontSize: 13 }}>📌</button>
            <button onClick={e => { e.stopPropagation(); onRead(notif.id); }} title="Mark read" style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontSize: 13 }}>✓</button>
            <button onClick={e => { e.stopPropagation(); onDelete(notif.id); }} title="Delete" style={{ background: C.roseBg, border: `1px solid ${C.rose}25`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontSize: 13, color: C.rose }}>🗑</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs]       = useState(INITIAL_NOTIFICATIONS);
  const [category, setCategory]   = useState("all");
  const [filter, setFilter]       = useState("all"); // all | unread | pinned
  const [selected, setSelected]   = useState(new Set());
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("time"); // time | priority
  const [showSettings, setShowSettings] = useState(false);
  const [animNew, setAnimNew]     = useState(false);

  // Simulate a new notification arriving
  useEffect(() => {
    const t = setTimeout(() => {
      setNotifs(prev => [{
        id: 99, category: "academic", priority: "high", read: false, pinned: false,
        time: "Just now", date: "Today", icon: "🌟", color: C.green,
        title: "Priya scored 100% in today's Maths quiz!",
        body: "Perfect score in the surprise quiz conducted today. Teachers are very impressed!",
        action: { label: "View Result", path: "#" }
      }, ...prev]);
      setAnimNew(true);
      setTimeout(() => setAnimNew(false), 3000);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n => {
    if (category !== "all" && n.category !== category) return false;
    if (filter === "unread" && n.read) return false;
    if (filter === "pinned" && !n.pinned) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "priority") {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    }
    return a.id - b.id; // already newest first
  }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const markRead    = id => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = ()  => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const pinNotif    = id  => setNotifs(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const deleteNotif = id  => { setNotifs(prev => prev.filter(n => n.id !== id)); setSelected(s => { const ns = new Set(s); ns.delete(id); return ns; }); };
  const toggleSel   = id  => setSelected(s => { const ns = new Set(s); ns.has(id) ? ns.delete(id) : ns.add(id); return ns; });
  const selectAll   = ()  => setSelected(new Set(filtered.map(n => n.id)));
  const clearSel    = ()  => setSelected(new Set());

  const bulkRead   = () => { selected.forEach(id => markRead(id)); clearSel(); };
  const bulkDelete = () => { setNotifs(prev => prev.filter(n => !selected.has(n.id))); clearSel(); };

  // Group by date
  const grouped = filtered.reduce((acc, n) => {
    const key = n.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.k] = c.k === "all" ? notifs.filter(n => !n.read).length : notifs.filter(n => n.category === c.k && !n.read).length;
    return acc;
  }, {});

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Lato','Segoe UI',sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "22px 32px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: 1000, margin: "0 auto" }}>
          <div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 4 }}>
              <h1 style={{ color: C.text1, fontSize: 22, fontWeight: 900, margin: 0, fontFamily: "Georgia,serif" }}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={{ background: C.accent, color: "#fff", fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20 }}>
                  {unreadCount} unread
                </span>
              )}
              {animNew && (
                <span style={{ background: C.greenL, color: C.green, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, border: `1px solid ${C.green}30`, animation: "pulse 1s ease" }}>
                  🆕 New notification!
                </span>
              )}
            </div>
            <p style={{ color: C.text3, fontSize: 13, margin: 0 }}>{notifs.length} total · {filtered.length} showing</p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {selected.size > 0 && (
              <div style={{ display: "flex", gap: 8, padding: "6px 12px", background: C.accentBg, border: `1px solid ${C.accent}30`, borderRadius: 10 }}>
                <span style={{ color: C.accent, fontSize: 12.5, fontWeight: 700 }}>{selected.size} selected</span>
                <span style={{ color: C.border }}>·</span>
                <button onClick={bulkRead}   style={{ background: "none", border: "none", cursor: "pointer", color: C.blue, fontSize: 12.5, fontWeight: 700 }}>Mark Read</button>
                <button onClick={bulkDelete} style={{ background: "none", border: "none", cursor: "pointer", color: C.rose, fontSize: 12.5, fontWeight: 700 }}>Delete</button>
                <button onClick={clearSel}   style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12.5 }}>✕</button>
              </div>
            )}
            <button onClick={markAllRead} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✓ Mark All Read
            </button>
            <button onClick={() => setShowSettings(s => !s)} style={{ background: showSettings ? C.accentBg : C.s2, border: `1px solid ${showSettings ? C.accent + "40" : C.border}`, borderRadius: 10, padding: "8px 14px", color: showSettings ? C.accent : C.text2, fontSize: 16, cursor: "pointer" }}>
              ⚙️
            </button>
          </div>
        </div>

        {/* Search + controls */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, maxWidth: 1000, margin: "14px auto 0" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.text3, fontSize: 15 }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications…"
              style={{ width: "100%", padding: "10px 14px 10px 38px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 4, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4 }}>
            {[{ k: "all", l: "All" }, { k: "unread", l: "Unread" }, { k: "pinned", l: "Pinned" }].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} style={{ background: filter === f.k ? C.surface : "transparent", border: `1px solid ${filter === f.k ? C.border : "transparent"}`, borderRadius: 7, padding: "6px 14px", color: filter === f.k ? C.text1 : C.text3, fontSize: 12.5, fontWeight: filter === f.k ? 700 : 500, cursor: "pointer" }}>
                {f.l}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "8px 12px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="time">Sort: Newest</option>
            <option value="priority">Sort: Priority</option>
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 32px 60px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>

        {/* ── Left: Category Sidebar ── */}
        <div style={{ position: "sticky", top: 120, alignSelf: "flex-start" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px", display: "flex", flexDirection: "column", gap: 2, marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.k} onClick={() => setCategory(cat.k)} style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: category === cat.k ? C.accentBg : "transparent", border: `1px solid ${category === cat.k ? C.accent + "40" : "transparent"}`, borderRadius: 9, cursor: "pointer", transition: "all 0.13s" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 14 }}>{cat.icon}</span>
                  <span style={{ color: category === cat.k ? C.accent : C.text2, fontSize: 13, fontWeight: category === cat.k ? 800 : 600 }}>{cat.l}</span>
                </div>
                {catCounts[cat.k] > 0 && (
                  <span style={{ background: category === cat.k ? C.accent : C.s3, color: category === cat.k ? "#fff" : C.text3, fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 20, minWidth: 18, textAlign: "center" }}>
                    {catCounts[cat.k]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Summary stats */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Summary</p>
            {[
              { l: "Total",    v: notifs.length,                        col: C.text1 },
              { l: "Unread",   v: notifs.filter(n => !n.read).length,   col: C.accent },
              { l: "Pinned",   v: notifs.filter(n => n.pinned).length,  col: C.amber },
              { l: "Urgent",   v: notifs.filter(n => n.priority === "urgent").length, col: C.rose },
            ].map(s => (
              <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.text3, fontSize: 12 }}>{s.l}</span>
                <span style={{ color: s.col, fontSize: 13, fontWeight: 800 }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Notification Feed ── */}
        <div>
          {/* Bulk select bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <label style={{ display: "flex", gap: 7, alignItems: "center", cursor: "pointer" }}>
              <div onClick={() => selected.size === filtered.length ? clearSel() : selectAll()} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected.size === filtered.length ? C.accent : C.border}`, background: selected.size === filtered.length ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {selected.size === filtered.length && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ color: C.text3, fontSize: 12.5 }}>Select all</span>
            </label>
            <span style={{ color: C.s3 }}>·</span>
            <span style={{ color: C.text3, fontSize: 12.5 }}>{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🔕</div>
              <p style={{ color: C.text1, fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>No notifications</p>
              <p style={{ color: C.text3, fontSize: 13.5 }}>{search ? "Try a different search term" : "You're all caught up!"}</p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateKey, items]) => (
              <div key={dateKey} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <span style={{ color: C.text3, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>{dateKey}</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ color: C.text3, fontSize: 11 }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map(n => (
                    <NotifCard
                      key={n.id} notif={n}
                      onRead={markRead} onPin={pinNotif} onDelete={deleteNotif}
                      onAction={notif => navigate(notif.action?.path || "#")}
                      selected={selected.has(n.id)} onSelect={toggleSel}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Settings Panel (slide-in) ── */}
      {showSettings && (
        <>
          <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 340, background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 50, overflowY: "auto", padding: "24px 24px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <p style={{ color: C.text1, fontSize: 16, fontWeight: 800, margin: 0 }}>Notification Settings</p>
              <button onClick={() => setShowSettings(false)} style={{ background: C.s2, border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Channel toggles */}
              <div>
                <p style={{ color: C.text3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>Channels</p>
                {[
                  { icon: "📱", l: "Push Notifications", on: true  },
                  { icon: "📧", l: "Email Notifications", on: true  },
                  { icon: "💬", l: "SMS Notifications",   on: false },
                ].map(s => (
                  <div key={s.l} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", background: C.s2, borderRadius: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ color: C.text1, fontSize: 13, flex: 1, fontWeight: 600 }}>{s.l}</span>
                    <Toggle on={s.on} onChange={() => {}} />
                  </div>
                ))}
              </div>

              {/* Quiet hours */}
              <div>
                <p style={{ color: C.text3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>Quiet Hours</p>
                <div style={{ padding: "14px", background: C.s2, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ color: C.text1, fontSize: 13, fontWeight: 600 }}>Enable Quiet Hours</span>
                    <Toggle on={true} onChange={() => {}} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[{ l: "From", v: "22:00" }, { l: "Until", v: "07:00" }].map(t => (
                      <div key={t.l}>
                        <label style={{ color: C.text3, fontSize: 10, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{t.l}</label>
                        <input type="time" defaultValue={t.v} style={{ width: "100%", padding: "8px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text1, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority threshold */}
              <div>
                <p style={{ color: C.text3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>Minimum Priority</p>
                <p style={{ color: C.text2, fontSize: 12, margin: "0 0 10px" }}>Only receive notifications at or above this priority level.</p>
                {["All (including Low)", "Medium & above", "High & above", "Urgent only"].map((o, i) => (
                  <label key={o} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: i === 0 ? C.accentBg : C.s2, border: `1px solid ${i === 0 ? C.accent + "30" : C.border}`, borderRadius: 9, cursor: "pointer", marginBottom: 6 }}>
                    <input type="radio" name="minpri" defaultChecked={i === 0} style={{ accentColor: C.accent }} />
                    <span style={{ color: i === 0 ? C.accent : C.text1, fontSize: 12.5, fontWeight: i === 0 ? 700 : 500 }}>{o}</span>
                  </label>
                ))}
              </div>

              <button style={{ background: C.accent, border: "none", borderRadius: 10, padding: "12px", color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>Save Settings</button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #d4c9b8; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  );
}