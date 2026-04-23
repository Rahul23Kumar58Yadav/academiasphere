import { useState, useRef, useEffect } from "react";
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
  teal: "#0f766e", tealL: "#e6f7f6",
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const FAQ_DATA = [
  { category: "Account", icon: "👤", questions: [
    { q: "How do I change my password?", a: "Go to Profile → Security → Change Password. Enter your current password, then your new password twice. Your password must be at least 8 characters with uppercase, number, and symbol." },
    { q: "How do I enable two-factor authentication?", a: "Navigate to Profile → Security → Two-Factor Authentication. Toggle it on, scan the QR code with Google Authenticator or similar app, then enter the 6-digit code to verify." },
    { q: "I forgot my password. How do I reset it?", a: "Click 'Forgot Password' on the login page. Enter your registered email. A reset link will be sent within 2 minutes. The link is valid for 30 minutes." },
    { q: "How do I update my phone number?", a: "Go to Profile → Personal Information → Phone Number. Enter your new number and click Save. You'll receive an OTP to verify the new number." },
  ]},
  { category: "Fees & Payments", icon: "💳", questions: [
    { q: "Which payment methods are accepted?", a: "We accept UPI (GPay, PhonePe, Paytm, BHIM), Net Banking (all major banks), Debit/Credit Cards (Visa, Mastercard, RuPay), and 0% EMI for 3 or 6 months." },
    { q: "How do I download a payment receipt?", a: "Go to Pay Fees → Payment History. Find the transaction and click the 'Receipt' button to download a PDF receipt." },
    { q: "What if my payment failed but money was deducted?", a: "Payments are typically reversed within 3–5 business days by your bank. If not, raise a support ticket with your transaction reference number and we'll investigate." },
    { q: "Is there a late fee for delayed payments?", a: "A late fee of 1.5% per month is applied after the due date. You can check the due date in the Fees section under your child's profile." },
  ]},
  { category: "Attendance", icon: "📋", questions: [
    { q: "What is the minimum attendance required?", a: "Students must maintain a minimum of 75% attendance to be eligible for final examinations. Students falling below this threshold will receive automated warnings." },
    { q: "How is attendance marked?", a: "Teachers mark attendance for each class period. It is updated on the portal by end of day. You can view period-wise attendance under your child's Attendance page." },
    { q: "Can a medical absence be condoned?", a: "Yes. Submit a medical certificate to the school admin within 3 days of return. The admin can mark the absence as medical leave, which is considered separately." },
  ]},
  { category: "Academic & Results", icon: "📚", questions: [
    { q: "When are results published?", a: "Unit test results are typically published within 7 days of the exam date. Annual exam results are published on the Results page as soon as they're entered by the admin." },
    { q: "How is the grade calculated?", a: "Grades are based on percentage: A+ (91–100%), A (81–90%), A– (76–80%), B+ (71–75%), B (61–70%), C+ (51–60%), C (41–50%), F (below 40%)." },
    { q: "Can I request a re-evaluation?", a: "Yes. Contact your class teacher or school admin within 5 days of result publication to request a re-check. An administrative fee may apply depending on the school's policy." },
  ]},
  { category: "Technical", icon: "⚙️", questions: [
    { q: "The app is not loading correctly. What should I do?", a: "Try: 1) Clear browser cache (Ctrl+Shift+Delete), 2) Try a different browser, 3) Disable browser extensions, 4) Check your internet connection. If the problem persists, raise a support ticket." },
    { q: "I'm not receiving notifications. How do I fix this?", a: "Check Profile → Notifications to ensure your preferences are enabled. For push notifications, make sure your browser has permission (click the lock icon in the URL bar)." },
    { q: "How do I report a bug or technical issue?", a: "Use the 'Report an Issue' option in Help & Support. Provide a description, your browser/device, and a screenshot if possible. Our team responds within 24 hours." },
  ]},
];

const TICKET_HISTORY = [
  { id: "TKT-2025-0042", subject: "Payment not reflecting after UPI transfer", status: "resolved", priority: "high",   created: "Mar 10, 2025", updated: "Mar 11, 2025", replies: 3 },
  { id: "TKT-2025-0028", subject: "Aryan's attendance marked wrong on Nov 5",  status: "closed",   priority: "medium", created: "Nov 12, 2024", updated: "Nov 14, 2024", replies: 5 },
  { id: "TKT-2025-0011", subject: "Cannot access app on Safari browser",        status: "closed",   priority: "low",    created: "Sep 3, 2024",  updated: "Sep 5, 2024",  replies: 2 },
];

const CHAT_INIT = [
  { from: "bot", text: "👋 Hi there! I'm AcademyBot. How can I help you today?", time: "Just now" },
  { from: "bot", text: "You can ask me about fees, attendance, results, or any other topic. I'm here to help!", time: "Just now" },
];

const BOT_REPLIES = {
  fee:       "For fee-related queries, you can visit the **Pay Fees** section in your portal. If you've already paid but it's not reflecting, please raise a support ticket with your transaction reference.",
  attend:    "Attendance is marked period-wise by teachers. The minimum required attendance is **75%**. You can view detailed attendance under each child's profile.",
  result:    "Results are published within 7 days of exam completion. You'll receive a notification when they're available. Visit the **Results** tab under your child's profile.",
  password:  "To reset your password, go to **Profile → Security → Change Password**. If you're locked out, use the **Forgot Password** link on the login page.",
  message:   "You can message teachers directly from the **Messages** section in your sidebar. All conversations are private and secure.",
  default:   "I'm not sure about that specific query. Let me connect you with a support agent who can help. You can also raise a **support ticket** for detailed assistance.",
};

const STATUS_CFG = {
  open:     { color: C.blue,   bg: C.blueL,   label: "Open"     },
  resolved: { color: C.green,  bg: C.greenL,  label: "Resolved" },
  closed:   { color: C.text3,  bg: C.s3,      label: "Closed"   },
  pending:  { color: C.amber,  bg: C.amberL,  label: "Pending"  },
};

const PRIORITY_CFG = {
  high:   { color: C.rose,  bg: C.roseL  },
  medium: { color: C.amber, bg: C.amberL },
  low:    { color: C.text3, bg: C.s3     },
};

// ─── Components ───────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 26px", ...style }}>{children}</div>;
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const [helpful, setHelpful] = useState(null);
  return (
    <div style={{ border: `1px solid ${open ? C.accent + "40" : C.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s", marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", gap: 14, alignItems: "center", padding: "16px 18px", background: open ? C.accentBg : C.surface, border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ color: open ? C.accent : C.text3, fontSize: 18, flexShrink: 0, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
        <p style={{ color: open ? C.accent : C.text1, fontSize: 13.5, fontWeight: open ? 800 : 600, margin: 0, flex: 1 }}>{q}</p>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px 50px", background: C.surface }}>
          <p style={{ color: C.text2, fontSize: 13.5, margin: "0 0 14px", lineHeight: 1.65 }}>{a}</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ color: C.text3, fontSize: 12 }}>Was this helpful?</span>
            <button onClick={() => setHelpful(true)} style={{ background: helpful === true ? C.greenBg : C.s2, border: `1px solid ${helpful === true ? C.green + "40" : C.border}`, borderRadius: 7, padding: "4px 12px", color: helpful === true ? C.green : C.text3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              👍 Yes
            </button>
            <button onClick={() => setHelpful(false)} style={{ background: helpful === false ? C.roseBg : C.s2, border: `1px solid ${helpful === false ? C.rose + "40" : C.border}`, borderRadius: 7, padding: "4px 12px", color: helpful === false ? C.rose : C.text3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              👎 No
            </button>
            {helpful !== null && <span style={{ color: helpful ? C.green : C.accent, fontSize: 12, fontWeight: 700 }}>{helpful ? "Thanks for your feedback!" : "We'll improve this answer."}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live Chat ────────────────────────────────────────────────────────────────
function LiveChat() {
  const [messages, setMessages] = useState(CHAT_INIT);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const getBotReply = (text) => {
    const t = text.toLowerCase();
    if (t.includes("fee") || t.includes("pay"))        return BOT_REPLIES.fee;
    if (t.includes("attend"))                          return BOT_REPLIES.attend;
    if (t.includes("result") || t.includes("grade"))  return BOT_REPLIES.result;
    if (t.includes("password") || t.includes("login"))return BOT_REPLIES.password;
    if (t.includes("message") || t.includes("teacher"))return BOT_REPLIES.message;
    return BOT_REPLIES.default;
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input.trim(), time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(userMsg.text);
      setMessages(prev => [...prev, { from: agentMode ? "agent" : "bot", text: reply, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const QUICK_QUESTIONS = ["How to pay fees?", "Check attendance", "View results", "Reset password"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 520 }}>
      {/* Chat header */}
      <div style={{ padding: "14px 18px", background: C.accent, borderRadius: "12px 12px 0 0", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#fff", fontSize: 14, fontWeight: 800, margin: "0 0 1px" }}>{agentMode ? "Support Agent" : "AcademyBot"}</p>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>Online · Avg response: {agentMode ? "5 mins" : "Instant"}</span>
          </div>
        </div>
        <button onClick={() => setAgentMode(a => !a)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
          {agentMode ? "🤖 AI Mode" : "👤 Human Agent"}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", background: C.s2, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => {
          const isUser = m.from === "user";
          return (
            <div key={i} style={{ display: "flex", gap: 8, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
              {!isUser && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.from === "agent" ? C.blueL : C.accentL, border: `1.5px solid ${m.from === "agent" ? C.blue : C.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                  {m.from === "agent" ? "👤" : "🤖"}
                </div>
              )}
              <div style={{ maxWidth: "75%" }}>
                <div style={{ background: isUser ? C.accent : C.surface, borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", boxShadow: "0 1px 4px #0000000a", border: isUser ? "none" : `1px solid ${C.border}` }}>
                  <p style={{ color: isUser ? "#fff" : C.text1, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>
                    {m.text.split(/\*\*(.*?)\*\*/).map((t, j) => j % 2 === 0 ? t : <strong key={j} style={{ fontWeight: 800 }}>{t}</strong>)}
                  </p>
                </div>
                <p style={{ color: C.text3, fontSize: 10.5, margin: "3px 0 0", textAlign: isUser ? "right" : "left" }}>{m.time}</p>
              </div>
            </div>
          );
        })}
        {typing && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accentL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
            <div style={{ background: C.surface, borderRadius: "18px 18px 18px 4px", padding: "10px 16px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.text3, animation: `bounce 1s ${i * 0.15}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick questions */}
      <div style={{ padding: "8px 14px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {QUICK_QUESTIONS.map(q => (
          <button key={q} onClick={() => { setInput(q); }} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 11px", color: C.text2, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px", background: C.surface, borderTop: `1px solid ${C.border}`, borderRadius: "0 0 12px 12px", display: "flex", gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type your question…"
          style={{ flex: 1, padding: "10px 14px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 13.5, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={send} disabled={!input.trim()} style={{ background: input.trim() ? C.accent : C.s3, border: "none", borderRadius: 10, padding: "10px 16px", color: input.trim() ? "#fff" : C.text3, fontSize: 16, cursor: input.trim() ? "pointer" : "default", transition: "all 0.15s" }}>➤</button>
      </div>
    </div>
  );
}

// ─── Submit Ticket ────────────────────────────────────────────────────────────
function SubmitTicket({ onSubmitted }) {
  const [form, setForm] = useState({ subject: "", category: "", priority: "medium", description: "", attachment: null });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.subject.trim())     e.subject     = "Subject is required";
    if (!form.category)           e.category    = "Select a category";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.description.length < 20) e.description = "Please provide more detail (min 20 characters)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSubmitted(); }, 1800);
  };

  const TICKET_CATEGORIES = ["Account & Login", "Fee & Payment", "Attendance Issue", "Results & Grades", "Technical Problem", "Message / Communication", "Other"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Subject *</label>
          <input
            value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Brief description of your issue"
            style={{ width: "100%", padding: "11px 14px", background: errors.subject ? C.roseL : C.s2, border: `1.5px solid ${errors.subject ? C.rose : C.border}`, borderRadius: 10, color: C.text1, fontSize: 13.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          {errors.subject && <p style={{ color: C.rose, fontSize: 11, margin: "4px 0 0" }}>{errors.subject}</p>}
        </div>

        <div>
          <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Category *</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", padding: "11px 14px", background: errors.category ? C.roseL : C.s2, border: `1.5px solid ${errors.category ? C.rose : C.border}`, borderRadius: 10, color: form.category ? C.text1 : C.text3, fontSize: 13.5, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="">Select category…</option>
            {TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.category && <p style={{ color: C.rose, fontSize: 11, margin: "4px 0 0" }}>{errors.category}</p>}
        </div>

        <div>
          <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Priority</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["low", "medium", "high"].map(p => (
              <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{ flex: 1, padding: "10px", background: form.priority === p ? PRIORITY_CFG[p].bg : C.s2, border: `1.5px solid ${form.priority === p ? PRIORITY_CFG[p].color + "50" : C.border}`, borderRadius: 9, color: form.priority === p ? PRIORITY_CFG[p].color : C.text3, fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Description * <span style={{ color: C.text3, fontWeight: 500, textTransform: "none" }}>({form.description.length}/1000)</span></label>
          <textarea
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 1000) }))}
            placeholder="Please describe your issue in detail. Include steps to reproduce, error messages, or screenshots if applicable…"
            rows={5}
            style={{ width: "100%", padding: "12px 14px", background: errors.description ? C.roseL : C.s2, border: `1.5px solid ${errors.description ? C.rose : C.border}`, borderRadius: 10, color: C.text1, fontSize: 13.5, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", lineHeight: 1.55 }}
          />
          {errors.description && <p style={{ color: C.rose, fontSize: 11, margin: "4px 0 0" }}>{errors.description}</p>}
        </div>

        {/* Attachment */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Attachment (Optional)</label>
          <div style={{ padding: "16px 18px", background: C.s2, border: `2px dashed ${C.border}`, borderRadius: 10, textAlign: "center", cursor: "pointer" }}
            onDragOver={e => e.preventDefault()}
          >
            <p style={{ color: C.text3, fontSize: 13, margin: "0 0 4px" }}>📎 Drag & drop files or <span style={{ color: C.accent, fontWeight: 700, cursor: "pointer" }}>browse</span></p>
            <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>PNG, JPG, PDF up to 10MB</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: C.blueBg, border: `1px solid ${C.blue}25`, borderRadius: 10, display: "flex", gap: 10 }}>
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <p style={{ color: C.text2, fontSize: 12.5, margin: 0 }}>Tickets are typically responded to within <strong>24 business hours</strong>. For urgent issues, use the live chat above.</p>
      </div>

      <button onClick={submit} disabled={submitting} style={{ background: submitting ? C.s3 : C.accent, border: "none", borderRadius: 12, padding: "14px", color: submitting ? C.text3 : "#fff", fontSize: 14, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
        {submitting ? (
          <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> Submitting…</>
        ) : (
          "🎫 Submit Support Ticket"
        )}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HelpSupport() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState("overview");
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCat, setFaqCat]       = useState("all");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [expandedTicket, setExpandedTicket]   = useState(null);

  const allFaqs = FAQ_DATA.flatMap(cat => cat.questions.map(q => ({ ...q, category: cat.category, icon: cat.icon })));
  const filteredFaqs = allFaqs.filter(f => {
    const matchCat  = faqCat === "all" || f.category === faqCat;
    const matchSrch = !faqSearch || f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase());
    return matchCat && matchSrch;
  });

  const TABS = [
    { k: "overview",  l: "Overview",      icon: "🏠" },
    { k: "faq",       l: "FAQ",           icon: "❓" },
    { k: "chat",      l: "Live Chat",     icon: "💬" },
    { k: "ticket",    l: "Raise Ticket",  icon: "🎫" },
    { k: "history",   l: "My Tickets",    icon: "📋" },
    { k: "status",    l: "System Status", icon: "🟢" },
  ];

  const QUICK_LINKS = [
    { icon: "💳", l: "Pay Fees",        col: C.green,  path: "/parent/fees/pay"      },
    { icon: "📊", l: "View Results",    col: C.blue,   path: "/parent/children"       },
    { icon: "📋", l: "Attendance",      col: C.amber,  path: "/parent/children"       },
    { icon: "💬", l: "Message Teacher", col: C.violet, path: "/parent/messages"       },
    { icon: "👤", l: "Edit Profile",    col: C.accent, path: "/parent/profile"        },
    { icon: "🔔", l: "Notifications",   col: C.rose,   path: "/parent/notifications"  },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Lato','Segoe UI',sans-serif" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.accent}14, ${C.accent}06)`, borderBottom: `1px solid ${C.border}`, padding: "32px 36px 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ color: C.text1, fontSize: 26, fontWeight: 900, margin: "0 0 6px", fontFamily: "Georgia,serif" }}>Help & Support</h1>
            <p style={{ color: C.text2, fontSize: 14, margin: "0 0 20px" }}>Find answers, chat with us, or raise a support ticket</p>

            {/* Hero search */}
            <div style={{ position: "relative", maxWidth: 560 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
              <input
                value={faqSearch} onChange={e => { setFaqSearch(e.target.value); setTab("faq"); }}
                placeholder="Search for help topics, guides, FAQs…"
                style={{ width: "100%", padding: "14px 18px 14px 44px", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.text1, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 2px 12px #0000000a" }}
              />
              {faqSearch && <button onClick={() => setFaqSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 16 }}>×</button>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{ background: "transparent", border: "none", borderBottom: `3px solid ${tab === t.k ? C.accent : "transparent"}`, padding: "12px 18px", color: tab === t.k ? C.accent : C.text3, fontSize: 13, fontWeight: tab === t.k ? 800 : 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", gap: 6, alignItems: "center" }}>
                <span>{t.icon}</span>{t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 36px 60px" }}>

        {/* ════ OVERVIEW ════ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Quick links */}
            <div>
              <h3 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 14px" }}>Quick Navigation</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {QUICK_LINKS.map(q => (
                  <button key={q.l} onClick={() => navigate(q.path)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = q.col + "60"; e.currentTarget.style.background = q.col + "08"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: q.col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{q.icon}</div>
                    <span style={{ color: C.text1, fontSize: 13.5, fontWeight: 700 }}>{q.l}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Support channels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { icon: "💬", title: "Live Chat",       desc: "Instant answers from AcademyBot or a support agent", badge: "Online", badgeCol: C.green, action: () => setTab("chat")   },
                { icon: "🎫", title: "Support Ticket",  desc: "Detailed issue tracking with 24hr response guarantee", badge: "< 24hr", badgeCol: C.blue, action: () => setTab("ticket") },
                { icon: "📧", title: "Email Support",   desc: "support@academysphere.in for non-urgent queries",     badge: "1–2 days", badgeCol: C.amber, action: () => {} },
              ].map(s => (
                <div key={s.title} onClick={s.action} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + "50"; e.currentTarget.style.boxShadow = "0 4px 16px #0000000a"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <p style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: 0 }}>{s.title}</p>
                    <span style={{ background: s.badgeCol + "18", color: s.badgeCol, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{s.badge}</span>
                  </div>
                  <p style={{ color: C.text3, fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Popular FAQs */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: 0 }}>Popular Questions</h3>
                <button onClick={() => setTab("faq")} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>See All →</button>
              </div>
              {allFaqs.slice(0, 5).map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
            </div>

            {/* Video guides */}
            <div>
              <h3 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 14px" }}>📹 Video Guides</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { title: "Getting Started with AcademySphere", duration: "3:24", thumb: "🚀" },
                  { title: "How to Pay Fees Online",             duration: "2:10", thumb: "💳" },
                  { title: "Tracking Your Child's Progress",     duration: "4:45", thumb: "📊" },
                ].map(v => (
                  <div key={v.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + "50"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div style={{ height: 100, background: `linear-gradient(135deg, ${C.accent}20, ${C.accent}08)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                      <div style={{ position: "relative" }}>
                        {v.thumb}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>▶</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 700, margin: "0 0 3px" }}>{v.title}</p>
                      <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>⏱ {v.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ FAQ ════ */}
        {tab === "faq" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <button onClick={() => setFaqCat("all")} style={{ background: faqCat === "all" ? C.accentBg : C.s2, border: `1px solid ${faqCat === "all" ? C.accent + "40" : C.border}`, borderRadius: 20, padding: "6px 16px", color: faqCat === "all" ? C.accent : C.text3, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                All ({allFaqs.length})
              </button>
              {FAQ_DATA.map(cat => (
                <button key={cat.category} onClick={() => setFaqCat(cat.category)} style={{ background: faqCat === cat.category ? C.accentBg : C.s2, border: `1px solid ${faqCat === cat.category ? C.accent + "40" : C.border}`, borderRadius: 20, padding: "6px 14px", color: faqCat === cat.category ? C.accent : C.text3, fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}>
                  <span>{cat.icon}</span>{cat.category}
                </button>
              ))}
            </div>

            {faqSearch && <p style={{ color: C.text2, fontSize: 13, marginBottom: 16 }}>Showing {filteredFaqs.length} results for "<strong>{faqSearch}</strong>"</p>}

            {faqCat === "all" && !faqSearch
              ? FAQ_DATA.map(cat => (
                <div key={cat.category} style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <h3 style={{ color: C.text1, fontSize: 14.5, fontWeight: 800, margin: 0 }}>{cat.category}</h3>
                    <span style={{ color: C.text3, fontSize: 12 }}>({cat.questions.length} questions)</span>
                  </div>
                  {cat.questions.map((q, i) => <FAQItem key={i} q={q.q} a={q.a} />)}
                </div>
              ))
              : filteredFaqs.length === 0
                ? <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
                    <p style={{ color: C.text1, fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>No results found</p>
                    <p style={{ color: C.text3, fontSize: 13 }}>Try a different search term or <button onClick={() => setTab("ticket")} style={{ background: "none", border: "none", color: C.accent, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>raise a support ticket</button></p>
                  </div>
                : filteredFaqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)
            }
          </div>
        )}

        {/* ════ LIVE CHAT ════ */}
        {tab === "chat" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <Card style={{ padding: 0, overflow: "hidden", borderRadius: 16 }}>
              <LiveChat />
            </Card>
          </div>
        )}

        {/* ════ RAISE TICKET ════ */}
        {tab === "ticket" && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {ticketSubmitted ? (
              <Card style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ color: C.green, fontSize: 20, fontWeight: 900, margin: "0 0 8px" }}>Ticket Submitted!</h2>
                <p style={{ color: C.text2, fontSize: 14, margin: "0 0 6px" }}>Your ticket ID: <strong style={{ color: C.accent }}>TKT-2025-0043</strong></p>
                <p style={{ color: C.text3, fontSize: 13, margin: "0 0 24px" }}>We'll respond within 24 business hours. You'll be notified via email.</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button onClick={() => { setTicketSubmitted(false); setTab("history"); }} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View My Tickets</button>
                  <button onClick={() => { setTicketSubmitted(false); }} style={{ background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Submit Another</button>
                </div>
              </Card>
            ) : (
              <Card>
                <h3 style={{ color: C.text1, fontSize: 16, fontWeight: 800, margin: "0 0 18px", display: "flex", gap: 8, alignItems: "center" }}>🎫 Submit a Support Ticket</h3>
                <SubmitTicket onSubmitted={() => setTicketSubmitted(true)} />
              </Card>
            )}
          </div>
        )}

        {/* ════ TICKET HISTORY ════ */}
        {tab === "history" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: 0 }}>My Support Tickets ({TICKET_HISTORY.length})</h3>
              <button onClick={() => setTab("ticket")} style={{ background: C.accent, border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>+ New Ticket</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TICKET_HISTORY.map(t => {
                const sc  = STATUS_CFG[t.status];
                const pc  = PRIORITY_CFG[t.priority];
                const exp = expandedTicket === t.id;
                return (
                  <div key={t.id} style={{ background: C.surface, border: `1.5px solid ${exp ? C.accent + "50" : C.border}`, borderRadius: 14, overflow: "hidden" }}>
                    <div onClick={() => setExpandedTicket(exp ? null : t.id)} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 20px", cursor: "pointer" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 11, background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎫</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                          <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p>
                          <span style={{ background: sc.bg, color: sc.color, fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 20, flexShrink: 0 }}>{sc.label}</span>
                          <span style={{ background: pc.bg, color: pc.color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0, textTransform: "capitalize" }}>{t.priority}</span>
                        </div>
                        <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>
                          {t.id} · Opened {t.created} · {t.replies} replies · Last updated {t.updated}
                        </p>
                      </div>
                      <span style={{ color: C.text3, fontSize: 16, transition: "transform 0.2s", display: "inline-block", transform: exp ? "rotate(180deg)" : "rotate(0deg)" }}>›</span>
                    </div>

                    {exp && (
                      <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.border}` }}>
                        <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                          {/* Fake conversation */}
                          {[
                            { from: "You", text: "I made a UPI payment of ₹12,500 but it's not reflecting in the portal.", time: t.created, isUser: true },
                            { from: "Support Agent", text: "Thank you for reaching out. Can you please share your UPI transaction reference number?", time: t.created, isUser: false },
                            { from: "You", text: "Transaction Ref: UPI202503101234. Amount: ₹12,500 on " + t.created, time: t.created, isUser: true },
                            { from: "Support Agent", text: "Thank you! We've verified the transaction. The payment will be reflected in your portal within 2 hours. We apologize for the inconvenience.", time: t.updated, isUser: false },
                          ].slice(0, t.replies + 1).map((msg, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, justifyContent: msg.isUser ? "flex-end" : "flex-start" }}>
                              <div style={{ maxWidth: "75%", background: msg.isUser ? C.accentBg : C.s2, border: `1px solid ${msg.isUser ? C.accent + "30" : C.border}`, borderRadius: msg.isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px", padding: "10px 14px" }}>
                                <p style={{ color: msg.isUser ? C.accent : C.text3, fontSize: 10.5, fontWeight: 700, margin: "0 0 4px" }}>{msg.from}</p>
                                <p style={{ color: C.text1, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                              </div>
                            </div>
                          ))}

                          {t.status === "resolved" && (
                            <div style={{ padding: "10px 14px", background: C.greenBg, border: `1px solid ${C.green}30`, borderRadius: 10, textAlign: "center" }}>
                              <p style={{ color: C.green, fontSize: 13, fontWeight: 700, margin: 0 }}>✅ This ticket was resolved on {t.updated}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ SYSTEM STATUS ════ */}
        {tab === "status" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: C.greenBg, border: `1.5px solid ${C.green}40`, borderRadius: 14, padding: "18px 22px", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.green, flexShrink: 0, boxShadow: `0 0 8px ${C.green}80` }} />
              <div>
                <p style={{ color: C.green, fontSize: 15, fontWeight: 800, margin: "0 0 2px" }}>All Systems Operational</p>
                <p style={{ color: C.text2, fontSize: 12.5, margin: 0 }}>Last checked: Today at 9:45 AM IST · Updated every 5 minutes</p>
              </div>
            </div>

            <Card>
              <h3 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 16px" }}>Service Status</h3>
              {[
                { service: "Web Application",     status: "operational", uptime: "99.98%", latency: "142ms" },
                { service: "API Services",         status: "operational", uptime: "99.96%", latency: "88ms"  },
                { service: "Payment Gateway",      status: "operational", uptime: "99.99%", latency: "210ms" },
                { service: "Email Notifications",  status: "operational", uptime: "99.95%", latency: "—"     },
                { service: "SMS Notifications",    status: "degraded",    uptime: "97.20%", latency: "—"     },
                { service: "AI / Analytics",       status: "operational", uptime: "99.90%", latency: "340ms" },
                { service: "File Storage (CDN)",   status: "operational", uptime: "99.99%", latency: "55ms"  },
                { service: "Authentication",        status: "operational", uptime: "99.99%", latency: "62ms"  },
              ].map(s => {
                const cfg = { operational: { color: C.green, bg: C.greenL, label: "Operational" }, degraded: { color: C.amber, bg: C.amberL, label: "Degraded" }, outage: { color: C.rose, bg: C.roseL, label: "Outage" } }[s.status];
                return (
                  <div key={s.service} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}60` }} />
                    <span style={{ color: C.text1, fontSize: 13.5, fontWeight: 600, flex: 1 }}>{s.service}</span>
                    <span style={{ color: C.text3, fontSize: 12 }}>Latency: {s.latency}</span>
                    <span style={{ color: C.text3, fontSize: 12 }}>Uptime: {s.uptime}</span>
                    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, minWidth: 90, textAlign: "center" }}>{cfg.label}</span>
                  </div>
                );
              })}
            </Card>

            <Card>
              <h3 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: "0 0 16px" }}>Incident History (Last 30 Days)</h3>
              {[
                { date: "Mar 8, 2025",  title: "SMS service intermittent delays", duration: "2h 15m", status: "resolved", severity: "minor" },
                { date: "Feb 22, 2025", title: "API response time elevated",       duration: "45m",    status: "resolved", severity: "minor" },
                { date: "Feb 5, 2025",  title: "Scheduled maintenance (2–4 AM)",  duration: "2h",     status: "completed",severity: "maintenance" },
              ].map((inc, i) => (
                <div key={i} style={{ padding: "14px 16px", background: C.s2, borderRadius: 11, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 700, margin: 0 }}>{inc.title}</p>
                    <span style={{ background: inc.severity === "maintenance" ? C.blueBg : C.amberBg, color: inc.severity === "maintenance" ? C.blue : C.amber, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>
                      {inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1)}
                    </span>
                  </div>
                  <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{inc.date} · Duration: {inc.duration} · <span style={{ color: C.green, fontWeight: 700 }}>{inc.status.charAt(0).toUpperCase() + inc.status.slice(1)}</span></p>
                </div>
              ))}
              <p style={{ color: C.green, fontSize: 13, fontWeight: 700, textAlign: "center", padding: "10px 0 0" }}>✓ No major incidents in the last 30 days</p>
            </Card>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #d4c9b8; border-radius: 4px; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}