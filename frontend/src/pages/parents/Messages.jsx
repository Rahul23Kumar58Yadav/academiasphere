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

const ME = { id: "parent", name: "Sunita Reddy", avatar: "SR", color: C.accent };

// ─── All Conversations ──────────────────────────────────────────────────────
const INITIAL_CONVERSATIONS = [
  {
    id: "conv1",
    contact: { name: "Mrs. Priya Nambiar", role: "Class Teacher · Grade 10–A", avatar: "PN", color: C.blue, subject: "Class Teacher", child: "Aryan" },
    unread: 2,
    pinned: true,
    messages: [
      { id: 1, from: "PN", text: "Good morning Mrs. Reddy! I wanted to share that Aryan performed exceptionally well in today's Computer Science test.", time: "9:14 AM", date: "Today" },
      { id: 2, from: "SR", text: "That's wonderful to hear! He had been practicing all week. Thank you for letting me know.", time: "9:31 AM", date: "Today" },
      { id: 3, from: "PN", text: "Also, the Parent-Teacher Meeting is scheduled for March 22nd from 10 AM to 1 PM. Please do try to attend — I'd love to discuss his progress in detail.", time: "9:33 AM", date: "Today" },
      { id: 4, from: "PN", text: "We'll also discuss his stream selection for Grade 11 — Science with CS seems like a natural fit!", time: "9:34 AM", date: "Today" },
    ],
  },
  {
    id: "conv2",
    contact: { name: "Mr. Rajesh Kumar", role: "Mathematics · Grade 10", avatar: "RK", color: C.amber, subject: "Mathematics", child: "Aryan" },
    unread: 0,
    pinned: false,
    messages: [
      { id: 1, from: "SR", text: "Hello Mr. Rajesh, I noticed Aryan scored 74 in the recent Maths test. Can you suggest how he can improve?", time: "3:20 PM", date: "Mar 11" },
      { id: 2, from: "RK", text: "Hello Mrs. Reddy! Yes, Aryan struggles a bit with word problems and coordinate geometry. I recommend he solve 15–20 problems daily from the NCERT exemplar.", time: "4:45 PM", date: "Mar 11" },
      { id: 3, from: "SR", text: "Thank you. Should I consider getting him a private tutor?", time: "4:52 PM", date: "Mar 11" },
      { id: 4, from: "RK", text: "Not yet — consistent self-practice should be enough for now. Let's reassess after Unit Test 4.", time: "5:10 PM", date: "Mar 11" },
    ],
  },
  {
    id: "conv3",
    contact: { name: "Mrs. Leela Sharma", role: "Physics · Grade 10", avatar: "LS", color: C.teal, subject: "Physics", child: "Aryan" },
    unread: 1,
    pinned: false,
    messages: [
      { id: 1, from: "LS", text: "Dear Mrs. Reddy, Aryan's lab report on Newton's Laws was submitted but had some calculation errors. He needs to re-submit by Friday.", time: "11:00 AM", date: "Mar 10" },
      { id: 2, from: "SR", text: "I'll make sure he corrects and resubmits. Thank you for informing me.", time: "12:30 PM", date: "Mar 10" },
      { id: 3, from: "LS", text: "Also, just wanted to say — his conceptual understanding is excellent. The errors are minor. He's one of my best students!", time: "8:55 AM", date: "Today" },
    ],
  },
  {
    id: "conv4",
    contact: { name: "Mrs. Anitha Krishnan", role: "Class Teacher · Grade 7–B", avatar: "AK", color: C.violet, subject: "Class Teacher", child: "Priya" },
    unread: 0,
    pinned: true,
    messages: [
      { id: 1, from: "AK", text: "Good afternoon! Priya has been absolutely outstanding this term. She achieved the highest marks in Mathematics and English in the class!", time: "2:00 PM", date: "Mar 9" },
      { id: 2, from: "SR", text: "We are so proud of her! She works really hard. Thank you for guiding her so well.", time: "2:20 PM", date: "Mar 9" },
      { id: 3, from: "AK", text: "She truly deserves it. I'd like to nominate her for the school's Academic Excellence Award this year.", time: "2:22 PM", date: "Mar 9" },
      { id: 4, from: "SR", text: "That would be wonderful! Please do. We'd be honored.", time: "2:35 PM", date: "Mar 9" },
      { id: 5, from: "AK", text: "Done! I've submitted the nomination. The results will be announced on Annual Day.", time: "3:00 PM", date: "Mar 9" },
    ],
  },
  {
    id: "conv5",
    contact: { name: "School Administration", role: "Greenwood High School", avatar: "GH", color: C.green, subject: "Admin", child: null },
    unread: 3,
    pinned: false,
    messages: [
      { id: 1, from: "GH", text: "📢 NOTICE: Annual Sports Day is scheduled for March 25, 2025. Students must wear sports uniform. Participation is mandatory.", time: "9:00 AM", date: "Mar 13" },
      { id: 2, from: "GH", text: "📢 REMINDER: Term 2 fees are due by March 20th. Please pay via the parent portal to avoid late penalties.", time: "9:05 AM", date: "Mar 13" },
      { id: 3, from: "GH", text: "📢 PTM NOTICE: Parent-Teacher Meeting is on March 22nd, 10:00 AM – 1:00 PM. Please collect your slot token from the front desk.", time: "9:10 AM", date: "Mar 13" },
    ],
  },
  {
    id: "conv6",
    contact: { name: "Mrs. Kavitha Nair", role: "English · Grade 7", avatar: "KN", color: C.rose, subject: "English", child: "Priya" },
    unread: 0,
    pinned: false,
    messages: [
      { id: 1, from: "KN", text: "Hello Mrs. Reddy! Priya's essay on 'The Environment' was one of the best I've received in 10 years of teaching.", time: "4:30 PM", date: "Mar 6" },
      { id: 2, from: "SR", text: "Thank you so much! She really enjoyed writing it. English is her favourite subject.", time: "6:00 PM", date: "Mar 6" },
      { id: 3, from: "KN", text: "I've selected it for the school magazine. We'll publish it in the April edition!", time: "6:15 PM", date: "Mar 6" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timeAgo = date => date === "Today" ? "Today" : date;
const getInitials = name => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

function Avatar({ name, color, colorL, size = 42, fontSize = 14 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: colorL || color + "20", border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color, fontWeight: 900, fontSize }}>{getInitials(name)}</span>
    </div>
  );
}

function Bubble({ msg, isMe, contact }) {
  const bg     = isMe ? C.accent : C.surface;
  const textC  = isMe ? "#fff" : C.text1;
  const subC   = isMe ? "rgba(255,255,255,0.65)" : C.text3;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
      {!isMe && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: contact.color + "18", border: `1.5px solid ${contact.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2 }}>
          <span style={{ color: contact.color, fontSize: 9, fontWeight: 900 }}>{getInitials(contact.name)}</span>
        </div>
      )}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 2 }}>
        <div style={{ background: isMe ? C.accent : C.surface, border: isMe ? "none" : `1px solid ${C.border}`, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 15px", boxShadow: isMe ? "none" : "0 1px 4px #0000000a" }}>
          <p style={{ color: textC, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>{msg.text}</p>
        </div>
        <span style={{ color: subC === "rgba(255,255,255,0.65)" ? C.text3 : C.text3, fontSize: 10.5 }}>{msg.time}</span>
      </div>
    </div>
  );
}

// ─── New Message Modal ───────────────────────────────────────────────────────
function NewMessageModal({ onClose, onStart }) {
  const [search, setSearch] = useState("");
  const TEACHERS = [
    { name: "Mrs. Priya Nambiar",   role: "Class Teacher · Grade 10–A", color: C.blue,   child: "Aryan" },
    { name: "Mr. Rajesh Kumar",     role: "Mathematics · Grade 10",     color: C.amber,  child: "Aryan" },
    { name: "Mrs. Leela Sharma",    role: "Physics · Grade 10",         color: C.teal,   child: "Aryan" },
    { name: "Mr. Anand Pillai",     role: "Chemistry · Grade 10",       color: C.green,  child: "Aryan" },
    { name: "Mrs. Sunita Mehta",    role: "English · Grade 10",         color: C.violet, child: "Aryan" },
    { name: "Mr. Kiran Nair",       role: "Computer Sc. · Grade 10",    color: C.accent, child: "Aryan" },
    { name: "Mrs. Anitha Krishnan", role: "Class Teacher · Grade 7–B",  color: C.violet, child: "Priya" },
    { name: "Mrs. Kavitha Nair",    role: "English · Grade 7",          color: C.rose,   child: "Priya" },
    { name: "Mr. Sanjay Iyer",      role: "Science · Grade 7",          color: C.green,  child: "Priya" },
    { name: "School Administration",role: "Greenwood High School",      color: C.teal,   child: null    },
  ];
  const filtered = TEACHERS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,8,5,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, borderRadius: 18, width: "100%", maxWidth: 420, boxShadow: "0 24px 80px #00000025", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: 0 }}>New Message</p>
          <button onClick={onClose} style={{ background: C.s2, border: "none", borderRadius: 7, width: 30, height: 30, cursor: "pointer", color: C.text2, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "14px 22px 0" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers or staff…"
            style={{ width: "100%", padding: "10px 14px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 13.5, outline: "none", fontFamily: "inherit" }}
            autoFocus
          />
        </div>
        <div style={{ maxHeight: 380, overflowY: "auto", padding: "10px 0" }}>
          {filtered.map(t => (
            <div key={t.name} onClick={() => onStart(t)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 22px", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = C.s2}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color + "18", border: `2px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: t.color, fontWeight: 900, fontSize: 12 }}>{getInitials(t.name)}</span>
              </div>
              <div>
                <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 700, margin: "0 0 1px" }}>{t.name}</p>
                <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>{t.role}{t.child ? ` · ${t.child}` : ""}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: C.text3, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No results found</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeId,   setActiveId]   = useState("conv1");
  const [input,      setInput]      = useState("");
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all"); // all | unread | pinned
  const [showNew,    setShowNew]    = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const active = conversations.find(c => c.id === activeId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, conversations]);

  // Mark read on open
  useEffect(() => {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unread: 0 } : c));
  }, [activeId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), from: "SR", text: input.trim(), time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), date: "Today" };
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, newMsg] } : c));
    setInput("");
    inputRef.current?.focus();

    // Simulate reply
    setTimeout(() => {
      const replies = [
        "Thank you for reaching out, Mrs. Reddy! I'll get back to you shortly.",
        "Noted! I will make sure to address this with the class.",
        "Of course! Happy to help. Let me check and confirm.",
        "Thank you for the kind words! We appreciate your support.",
      ];
      const autoReply = { id: Date.now() + 1, from: active.contact.avatar, text: replies[Math.floor(Math.random() * replies.length)], time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), date: "Today" };
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, autoReply] } : c));
    }, 1400);
  };

  const togglePin = id => setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));

  const filteredConvs = conversations
    .filter(c => {
      if (filter === "unread") return c.unread > 0;
      if (filter === "pinned") return c.pinned;
      return true;
    })
    .filter(c => !search || c.contact.name.toLowerCase().includes(search.toLowerCase()) || c.contact.child?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  // Date separators
  const getDateLabel = (msgs, index) => {
    if (index === 0 || msgs[index].date !== msgs[index - 1].date) return msgs[index].date;
    return null;
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", background: C.bg, fontFamily: "'Lato', 'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* ── Left Panel: Conversation List ───────────────────────────── */}
      <div style={{ width: 320, minWidth: 320, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ color: C.text1, fontSize: 17, fontWeight: 900, margin: "0 0 2px" }}>Messages</h2>
              {totalUnread > 0 && <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{totalUnread} unread</p>}
            </div>
            <button
              onClick={() => setShowNew(true)}
              style={{ background: C.accent, border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}
            >
              <span style={{ fontSize: 15 }}>✏</span> New
            </button>
          </div>

          {/* Search */}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            style={{ width: "100%", padding: "9px 12px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text1, fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
            {[{ k: "all", l: "All" }, { k: "unread", l: `Unread${totalUnread > 0 ? ` (${totalUnread})` : ""}` }, { k: "pinned", l: "Pinned" }].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} style={{ background: filter === f.k ? C.accentBg : "transparent", border: `1px solid ${filter === f.k ? C.accent + "40" : "transparent"}`, borderRadius: 20, padding: "4px 11px", color: filter === f.k ? C.accent : C.text3, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredConvs.map(conv => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isActive = activeId === conv.id;
            const isMe = lastMsg?.from === "SR";
            return (
              <div
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                style={{ display: "flex", gap: 12, padding: "14px 18px", cursor: "pointer", background: isActive ? C.accentBg : "transparent", borderLeft: `3px solid ${isActive ? C.accent : "transparent"}`, transition: "all 0.12s" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.s2; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: conv.contact.color + "18", border: `2px solid ${conv.contact.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: conv.contact.color, fontWeight: 900, fontSize: 13 }}>{getInitials(conv.contact.name)}</span>
                  </div>
                  {conv.unread > 0 && (
                    <div style={{ position: "absolute", top: -2, right: -2, background: C.accent, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: "50%", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }}>
                      {conv.unread}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                    <p style={{ color: C.text1, fontSize: 13.5, fontWeight: conv.unread > 0 ? 800 : 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{conv.contact.name.split(" ").slice(0, 2).join(" ")}</p>
                    <span style={{ color: C.text3, fontSize: 10.5, flexShrink: 0, marginLeft: 6 }}>{lastMsg?.time}</span>
                  </div>
                  <p style={{ color: C.text3, fontSize: 11, margin: "0 0 3px" }}>{conv.contact.role.split("·")[0].trim()}{conv.contact.child ? ` · ${conv.contact.child}` : ""}</p>
                  <p style={{ color: conv.unread > 0 ? C.text2 : C.text3, fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: conv.unread > 0 ? 600 : 400 }}>
                    {isMe ? "You: " : ""}{lastMsg?.text}
                  </p>
                </div>
                {conv.pinned && <span style={{ color: C.amber, fontSize: 12, flexShrink: 0, alignSelf: "center" }}>📌</span>}
              </div>
            );
          })}
          {filteredConvs.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>💬</p>
              <p style={{ color: C.text3, fontSize: 13 }}>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat ────────────────────────────────────────── */}
      {active ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: C.bg }}>

          {/* Chat header */}
          <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: active.contact.color + "18", border: `2px solid ${active.contact.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: active.contact.color, fontWeight: 900, fontSize: 14 }}>{getInitials(active.contact.name)}</span>
              </div>
              <div>
                <p style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: "0 0 1px" }}>{active.contact.name}</p>
                <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{active.contact.role}{active.contact.child ? ` · Regarding: ${active.contact.child}` : ""}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => togglePin(activeId)}
                title={active.pinned ? "Unpin" : "Pin"}
                style={{ background: active.pinned ? C.amberBg : C.s2, border: `1px solid ${active.pinned ? C.amber + "40" : C.border}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", fontSize: 14 }}
              >
                📌
              </button>
              <button style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: C.text2, fontSize: 12.5, fontWeight: 700 }}>
                📎
              </button>
              <button style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: C.text2, fontSize: 12.5, fontWeight: 700 }}>
                ⋯
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column" }}>
            {active.messages.map((msg, i) => {
              const isMe    = msg.from === "SR";
              const dateLabel = getDateLabel(active.messages, i);
              return (
                <div key={msg.id}>
                  {dateLabel && (
                    <div style={{ textAlign: "center", margin: "12px 0" }}>
                      <span style={{ background: C.s3, color: C.text3, fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20 }}>{dateLabel}</span>
                    </div>
                  )}
                  <Bubble msg={msg} isMe={isMe} contact={active.contact} />
                </div>
              );
            })}

            {/* Typing indicator slot */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies (contextual) */}
          {active.messages.length > 0 && active.messages[active.messages.length - 1].from !== "SR" && (
            <div style={{ padding: "8px 24px 0", display: "flex", gap: 7, flexWrap: "wrap" }}>
              {["Thank you!", "I'll follow up", "Noted, will do", "Can we schedule a call?"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px", color: C.text2, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px 20px 16px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-end" }}>
            <button style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 12px", cursor: "pointer", color: C.text3, fontSize: 16, flexShrink: 0 }}>
              📎
            </button>
            <div style={{ flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${active.contact.name.split(" ").slice(0, 2).join(" ")}…`}
                rows={1}
                style={{ flex: 1, padding: "11px 14px", background: "transparent", border: "none", color: C.text1, fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{ background: input.trim() ? C.accent : C.s3, border: "none", borderRadius: 12, padding: "11px 16px", cursor: input.trim() ? "pointer" : "default", color: input.trim() ? "#fff" : C.text3, fontSize: 16, transition: "all 0.15s", flexShrink: 0 }}
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
            <p style={{ color: C.text1, fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>Select a conversation</p>
            <p style={{ color: C.text3, fontSize: 13.5, margin: 0 }}>Choose from the left to start messaging</p>
          </div>
        </div>
      )}

      {/* ── Right Info Panel (for active chat) ──────────────────────── */}
      {active && (
        <div style={{ width: 260, minWidth: 260, background: C.surface, borderLeft: `1px solid ${C.border}`, padding: "20px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Contact details */}
          <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: active.contact.color + "18", border: `3px solid ${active.contact.color}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <span style={{ color: active.contact.color, fontWeight: 900, fontSize: 20 }}>{getInitials(active.contact.name)}</span>
            </div>
            <p style={{ color: C.text1, fontSize: 14, fontWeight: 800, margin: "0 0 3px" }}>{active.contact.name}</p>
            <p style={{ color: C.text3, fontSize: 11.5, margin: "0 0 10px", lineHeight: 1.5 }}>{active.contact.role}</p>
            {active.contact.child && (
              <span style={{ background: active.contact.color + "18", color: active.contact.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                Regarding: {active.contact.child}
              </span>
            )}
          </div>

          {/* Stats */}
          <div>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Conversation Stats</p>
            {[
              { l: "Total Messages", v: active.messages.length },
              { l: "From Teacher",   v: active.messages.filter(m => m.from !== "SR").length },
              { l: "From You",       v: active.messages.filter(m => m.from === "SR").length },
              { l: "Started",        v: active.messages[0]?.date || "—" },
            ].map(s => (
              <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.text3, fontSize: 12 }}>{s.l}</span>
                <span style={{ color: C.text1, fontSize: 12, fontWeight: 700 }}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Quick Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "📅 Request PTM", action: () => setInput("I'd like to request a Parent-Teacher Meeting. Can we schedule one?") },
                { label: "📊 Ask About Grades", action: () => setInput("Could you share the latest performance update for my child?") },
                { label: "📋 Homework Enquiry", action: () => setInput("Could you share the pending homework or assignments?") },
                { label: "🏥 Report Absence", action: () => setInput("I'd like to inform that my child will be absent tomorrow due to health reasons.") },
              ].map(a => (
                <button key={a.label} onClick={() => { a.action(); inputRef.current?.focus(); }} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = active.contact.color + "60"; e.currentTarget.style.color = active.contact.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pin / Notification toggle */}
          <div>
            <p style={{ color: C.text3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Options</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <button onClick={() => togglePin(activeId)} style={{ background: active.pinned ? C.amberBg : C.s2, border: `1px solid ${active.pinned ? C.amber + "40" : C.border}`, borderRadius: 9, padding: "9px 12px", color: active.pinned ? C.amber : C.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                {active.pinned ? "📌 Pinned · Unpin" : "📌 Pin Conversation"}
              </button>
              <button style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                🔔 Mute Notifications
              </button>
              <button style={{ background: C.roseBg, border: `1px solid ${C.rose}25`, borderRadius: 9, padding: "9px 12px", color: C.rose, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                🗑 Delete Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Message Modal ── */}
      {showNew && (
        <NewMessageModal
          onClose={() => setShowNew(false)}
          onStart={teacher => {
            const newConvId = `conv-new-${Date.now()}`;
            const newConv = {
              id: newConvId,
              contact: { name: teacher.name, role: teacher.role, avatar: getInitials(teacher.name), color: teacher.color, subject: teacher.role.split("·")[0].trim(), child: teacher.child },
              unread: 0, pinned: false,
              messages: [],
            };
            setConversations(prev => [newConv, ...prev]);
            setActiveId(newConvId);
            setShowNew(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
        />
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#d4c9b8;border-radius:4px} textarea{scrollbar-width:thin}`}</style>
    </div>
  );
}