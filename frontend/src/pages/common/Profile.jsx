import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#faf9f7", surface: "#ffffff", s2: "#f5f2ee", s3: "#ede9e3",
  border: "#ede9e3", text1: "#1a1612", text2: "#6b6057", text3: "#a89d93",
  accent: "#c96b2e", accentL: "#f4ede6", accentBg: "#c96b2e12",
  green: "#2d7d4a", greenL: "#e8f5ed", greenBg: "#2d7d4a0e",
  rose: "#c0392b", roseL: "#fdecea", roseBg: "#c0392b0e",
  amber: "#b8640a", amberL: "#fef3e2", amberBg: "#b8640a0e",
  blue: "#1d5fa6", blueL: "#e8f0fb", blueBg: "#1d5fa60e",
  violet: "#5b3fa6", violetL: "#eeebfb", violetBg: "#5b3fa60e",
};

// ─── Mock user — swap with useAuth() ─────────────────────────────────────────
const MOCK_USER = {
  id: "USR-2024-0042",
  name: "Sunita Reddy",
  email: "sunita.reddy@gmail.com",
  phone: "+91 98765 43210",
  role: "PARENT",
  avatar: "SR",
  avatarColor: C.accent,
  joined: "August 14, 2024",
  lastLogin: "Today, 9:22 AM",
  location: "Bengaluru, Karnataka",
  language: "English (India)",
  timezone: "IST (UTC+5:30)",
  bio: "Parent of two children at Greenwood High School. Always keen to stay updated on their academic progress.",
  twoFA: true,
  emailVerified: true,
  phoneVerified: false,
  loginMethod: "Email + Password",
};

const ROLE_CONFIG = {
  SUPER_ADMIN:  { label: "Super Admin",  color: C.rose,   icon: "👑" },
  SCHOOL_ADMIN: { label: "School Admin", color: C.violet, icon: "🏫" },
  TEACHER:      { label: "Teacher",      color: C.blue,   icon: "📚" },
  STUDENT:      { label: "Student",      color: C.green,  icon: "🎓" },
  PARENT:       { label: "Parent",       color: C.accent, icon: "👨‍👩‍👧" },
  VENDOR:       { label: "Vendor",       color: C.amber,  icon: "🛒" },
};

const ACTIVITY_LOG = [
  { action: "Logged in",                   device: "Chrome · Windows",       time: "Today, 9:22 AM",    icon: "🔓", color: C.green  },
  { action: "Paid Term 2 fees",            device: "Chrome · Windows",       time: "Today, 9:10 AM",    icon: "💳", color: C.blue   },
  { action: "Sent message to Mrs. Nambiar",device: "Chrome · Windows",       time: "Mar 13, 9:35 AM",   icon: "💬", color: C.accent },
  { action: "Viewed Aryan's results",      device: "Mobile · Android",       time: "Mar 12, 8:02 PM",   icon: "📊", color: C.violet },
  { action: "Updated phone number",        device: "Chrome · Windows",       time: "Mar 10, 3:14 PM",   icon: "✏️", color: C.amber  },
  { action: "Password changed",            device: "Chrome · Windows",       time: "Mar 5, 11:30 AM",   icon: "🔑", color: C.rose   },
  { action: "Logged in from new device",   device: "Safari · iPhone 15",     time: "Mar 3, 7:45 PM",    icon: "📱", color: C.amber  },
  { action: "Profile photo updated",       device: "Chrome · Windows",       time: "Feb 28, 2:20 PM",   icon: "🖼", color: C.teal   },
];

const ACTIVE_SESSIONS = [
  { device: "Chrome · Windows 11",    location: "Bengaluru, IN", lastSeen: "Active now",      current: true,  icon: "💻" },
  { device: "Safari · iPhone 15",     location: "Bengaluru, IN", lastSeen: "2 days ago",      current: false, icon: "📱" },
  { device: "Chrome · Android",       location: "Hyderabad, IN", lastSeen: "5 days ago",      current: false, icon: "📱" },
];

const NOTIF_PREFS = [
  { key: "fees",       label: "Fee Reminders",         email: true,  push: true,  sms: true  },
  { key: "results",    label: "Results & Grades",       email: true,  push: true,  sms: false },
  { key: "attendance", label: "Attendance Alerts",      email: true,  push: true,  sms: true  },
  { key: "messages",   label: "Teacher Messages",       email: false, push: true,  sms: false },
  { key: "events",     label: "School Events",          email: true,  push: false, sms: false },
  { key: "reports",    label: "Monthly Reports",        email: true,  push: false, sms: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 26px", ...style }}>{children}</div>;
}
function SectionHead({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h3 style={{ color: C.text1, fontSize: 15, fontWeight: 800, margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}
function Badge({ label, color, bg }) {
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, border: `1px solid ${color}25` }}>{label}</span>;
}
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? C.accent : C.s3, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px #00000022" }} />
    </div>
  );
}
function InputField({ label, value, onChange, type = "text", disabled = false, icon, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>{icon}</span>}
        <input
          type={type} value={value}
          onChange={e => onChange && onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: "100%", padding: `11px ${icon ? "14px 11px 36px" : "14px"}`, background: disabled ? C.s2 : C.surface, border: `1.5px solid ${focused ? C.accent : C.border}`, borderRadius: 10, color: disabled ? C.text3 : C.text1, fontSize: 13.5, outline: "none", fontFamily: "inherit", cursor: disabled ? "not-allowed" : "text", transition: "border-color 0.15s", boxSizing: "border-box" }}
        />
      </div>
      {hint && <p style={{ color: C.text3, fontSize: 11, margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────
function AvatarUpload({ user }) {
  const [hover, setHover] = useState(false);
  const fileRef = useRef();
  const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.PARENT;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onClick={() => fileRef.current?.click()}
        style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}cc)`, border: `3px solid ${user.avatarColor}50`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", boxShadow: `0 4px 20px ${user.avatarColor}30` }}
      >
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 30, letterSpacing: "-1px" }}>{user.avatar}</span>
        {hover && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>📷</span>
            <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>CHANGE</span>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: roleConf.color, border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
        {roleConf.icon}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} />
    </div>
  );
}

// ─── Password Strength ───────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase",     pass: /[A-Z]/.test(password) },
    { label: "Number",        pass: /[0-9]/.test(password) },
    { label: "Symbol",        pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["", C.rose, C.amber, C.amber, C.green];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : C.s3, transition: "background 0.2s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {checks.map(c => (
            <span key={c.label} style={{ color: c.pass ? C.green : C.text3, fontSize: 10.5, fontWeight: 600 }}>
              {c.pass ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        <span style={{ color: colors[score], fontSize: 11, fontWeight: 800 }}>{labels[score]}</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const [tab, setTab]       = useState("profile");
  const [user, setUser]     = useState({ ...MOCK_USER });
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(NOTIF_PREFS);
  const [sessions, setSessions]     = useState(ACTIVE_SESSIONS);
  const [showPass, setShowPass]     = useState({ curr: false, new: false, conf: false });
  const [passForm, setPassForm]     = useState({ curr: "", new: "", conf: "" });
  const [twoFA, setTwoFA]           = useState(user.twoFA);
  const [showQR, setShowQR]         = useState(false);
  const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.PARENT;

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateNotif = (idx, channel) => {
    setNotifPrefs(prev => prev.map((p, i) => i === idx ? { ...p, [channel]: !p[channel] } : p));
  };

  const revokeSession = (idx) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };

  const TABS = [
    { k: "profile",      l: "Profile",        icon: "👤" },
    { k: "security",     l: "Security",        icon: "🔒" },
    { k: "notifications",l: "Notifications",   icon: "🔔" },
    { k: "sessions",     l: "Sessions",        icon: "💻" },
    { k: "activity",     l: "Activity Log",    icon: "📋" },
    { k: "preferences",  l: "Preferences",     icon: "⚙️"  },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Lato','Segoe UI',sans-serif" }}>

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${user.avatarColor}18, ${user.avatarColor}06)`, borderBottom: `1px solid ${C.border}`, padding: "32px 36px 0" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end", maxWidth: 1100, margin: "0 auto" }}>
          <AvatarUpload user={user} />
          <div style={{ flex: 1, paddingBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              <h1 style={{ color: C.text1, fontSize: 24, fontWeight: 900, margin: 0, fontFamily: "Georgia,serif" }}>{user.name}</h1>
              <Badge label={`${roleConf.icon} ${roleConf.label}`} color={roleConf.color} bg={roleConf.color + "18"} />
              {user.emailVerified && <Badge label="✓ Verified" color={C.green} bg={C.greenL} />}
            </div>
            <p style={{ color: C.text2, fontSize: 13.5, margin: "0 0 10px" }}>{user.email} · {user.phone}</p>
            <p style={{ color: C.text3, fontSize: 12.5, margin: 0 }}>{user.bio}</p>
          </div>
          <div style={{ display: "flex", gap: 10, paddingBottom: 20, flexShrink: 0 }}>
            {saved && (
              <div style={{ background: C.greenL, border: `1px solid ${C.green}30`, borderRadius: 10, padding: "8px 14px", display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ color: C.green, fontSize: 13 }}>✓ Saved!</span>
              </div>
            )}
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 18px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSave} style={{ background: C.accent, border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Save Changes</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 18px", color: C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Quick meta strip */}
        <div style={{ display: "flex", gap: 24, padding: "14px 0", borderTop: `1px solid ${C.border}`, maxWidth: 1100, margin: "0 auto", flexWrap: "wrap" }}>
          {[
            { icon: "📅", l: "Joined",     v: user.joined     },
            { icon: "🕐", l: "Last Login", v: user.lastLogin  },
            { icon: "📍", l: "Location",   v: user.location   },
            { icon: "🌐", l: "Language",   v: user.language   },
            { icon: "⏰", l: "Timezone",   v: user.timezone   },
            { icon: "🔑", l: "Login Via",  v: user.loginMethod},
          ].map(m => (
            <div key={m.l} style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>{m.icon}</span>
              <div>
                <p style={{ color: C.text3, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>{m.l}</p>
                <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 700, margin: 0 }}>{m.v}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2, maxWidth: 1100, margin: "0 auto", overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ background: "transparent", border: "none", borderBottom: `3px solid ${tab === t.k ? user.avatarColor : "transparent"}`, padding: "12px 18px", color: tab === t.k ? user.avatarColor : C.text3, fontSize: 13, fontWeight: tab === t.k ? 800 : 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", gap: 6, alignItems: "center", transition: "all 0.15s" }}>
              <span>{t.icon}</span>{t.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 36px 60px" }}>

        {/* ════ PROFILE ════ */}
        {tab === "profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            <Card>
              <SectionHead title="Personal Information" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <InputField label="First Name" value={user.name.split(" ")[0]} onChange={v => setUser(u => ({ ...u, name: v + " " + u.name.split(" ").slice(1).join(" ") }))} disabled={!editing} />
                  <InputField label="Last Name"  value={user.name.split(" ").slice(1).join(" ")} onChange={v => setUser(u => ({ ...u, name: u.name.split(" ")[0] + " " + v }))} disabled={!editing} />
                </div>
                <InputField label="Email Address" value={user.email} onChange={v => setUser(u => ({ ...u, email: v }))} disabled={!editing} icon="✉️" hint={user.emailVerified ? "✓ Verified" : "⚠ Not verified"} />
                <InputField label="Phone Number"  value={user.phone} onChange={v => setUser(u => ({ ...u, phone: v }))} disabled={!editing} icon="📱" hint={user.phoneVerified ? "✓ Verified" : "⚠ Not verified — click to verify"} />
                <InputField label="Location" value={user.location} onChange={v => setUser(u => ({ ...u, location: v }))} disabled={!editing} icon="📍" />
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Card>
                <SectionHead title="Bio" />
                <textarea
                  value={user.bio}
                  onChange={e => setUser(u => ({ ...u, bio: e.target.value }))}
                  disabled={!editing}
                  rows={4}
                  style={{ width: "100%", padding: "12px 14px", background: editing ? C.surface : C.s2, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 13.5, outline: "none", fontFamily: "inherit", resize: "vertical", cursor: editing ? "text" : "not-allowed", boxSizing: "border-box" }}
                />
                <p style={{ color: C.text3, fontSize: 11, margin: "6px 0 0", textAlign: "right" }}>{user.bio.length}/250 characters</p>
              </Card>

              <Card>
                <SectionHead title="Account Identity" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { l: "User ID",       v: user.id,          copy: true },
                    { l: "Role",          v: `${roleConf.icon} ${roleConf.label}`, copy: false },
                    { l: "Account Type",  v: "Premium",        copy: false },
                    { l: "Timezone",      v: user.timezone,    copy: false },
                  ].map(f => (
                    <div key={f.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: C.s2, borderRadius: 9 }}>
                      <span style={{ color: C.text3, fontSize: 12 }}>{f.l}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: C.text1, fontSize: 12.5, fontWeight: 700 }}>{f.v}</span>
                        {f.copy && <button style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 11 }} onClick={() => navigator.clipboard?.writeText(f.v)}>📋</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Language & Regional */}
            <Card style={{ gridColumn: "1/-1" }}>
              <SectionHead title="Language & Regional Settings" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[
                  { l: "Language", opts: ["English (India)", "Hindi", "Telugu", "Tamil", "Kannada"], v: user.language,  k: "language" },
                  { l: "Timezone", opts: ["IST (UTC+5:30)", "UTC", "EST (UTC-5)", "PST (UTC-8)"],    v: user.timezone,  k: "timezone" },
                  { l: "Date Format", opts: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],              v: "DD/MM/YYYY",   k: "dateFormat" },
                ].map(s => (
                  <div key={s.l}>
                    <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>{s.l}</label>
                    <select disabled={!editing} defaultValue={s.v} style={{ width: "100%", padding: "11px 14px", background: editing ? C.surface : C.s2, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: editing ? "pointer" : "not-allowed" }}>
                      {s.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            {/* Danger zone */}
            <Card style={{ gridColumn: "1/-1", border: `1px solid ${C.rose}30`, background: C.roseL + "44" }}>
              <SectionHead title={<span style={{ color: C.rose }}>⚠ Danger Zone</span>} />
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[
                  { l: "Deactivate Account",  d: "Temporarily disable your account. You can re-enable it anytime.", btn: "Deactivate", col: C.amber },
                  { l: "Delete Account",       d: "Permanently delete your account and all associated data. This cannot be undone.", btn: "Delete",     col: C.rose  },
                ].map(a => (
                  <div key={a.l} style={{ flex: 1, minWidth: 220, padding: "14px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                    <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: "0 0 4px" }}>{a.l}</p>
                    <p style={{ color: C.text3, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>{a.d}</p>
                    <button style={{ background: "none", border: `1px solid ${a.col}`, borderRadius: 8, padding: "7px 16px", color: a.col, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{a.btn}</button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ════ SECURITY ════ */}
        {tab === "security" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            {/* Password change */}
            <Card>
              <SectionHead title="Change Password" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { k: "curr", l: "Current Password"  },
                  { k: "new",  l: "New Password"       },
                  { k: "conf", l: "Confirm Password"   },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>{f.l}</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass[f.k] ? "text" : "password"}
                        value={passForm[f.k]}
                        onChange={e => setPassForm(p => ({ ...p, [f.k]: e.target.value }))}
                        placeholder="••••••••"
                        style={{ width: "100%", padding: "11px 42px 11px 14px", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text1, fontSize: 13.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                      <button onClick={() => setShowPass(p => ({ ...p, [f.k]: !p[f.k] }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 15 }}>
                        {showPass[f.k] ? "🙈" : "👁"}
                      </button>
                    </div>
                    {f.k === "new" && <PasswordStrength password={passForm.new} />}
                    {f.k === "conf" && passForm.conf && passForm.new !== passForm.conf && (
                      <p style={{ color: C.rose, fontSize: 11, margin: "4px 0 0" }}>Passwords do not match</p>
                    )}
                  </div>
                ))}
                <button style={{ background: C.accent, border: "none", borderRadius: 10, padding: "12px", color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: "pointer", marginTop: 4 }}>
                  🔑 Update Password
                </button>
              </div>
            </Card>

            {/* 2FA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Card>
                <SectionHead title="Two-Factor Authentication" action={<Toggle on={twoFA} onChange={v => { setTwoFA(v); if (v) setShowQR(true); }} />} />
                <div style={{ padding: "14px 16px", background: twoFA ? C.greenBg : C.s2, border: `1px solid ${twoFA ? C.green + "30" : C.border}`, borderRadius: 12, marginBottom: 14 }}>
                  <p style={{ color: twoFA ? C.green : C.text2, fontSize: 13, fontWeight: twoFA ? 700 : 500, margin: "0 0 3px" }}>{twoFA ? "✓ 2FA is enabled — your account is secure" : "2FA is disabled — your account is at risk"}</p>
                  <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>Authenticator app · Enabled {twoFA ? "Mar 1, 2025" : "—"}</p>
                </div>
                {showQR && (
                  <div style={{ textAlign: "center", padding: "16px", background: C.s2, borderRadius: 12, marginBottom: 14 }}>
                    <div style={{ width: 120, height: 120, background: C.s3, borderRadius: 8, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📱</div>
                    <p style={{ color: C.text1, fontSize: 12.5, fontWeight: 700, margin: "0 0 4px" }}>Scan QR with Google Authenticator</p>
                    <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>Or enter code: JBSWY3DPEHPK3PXP</p>
                    <button onClick={() => setShowQR(false)} style={{ marginTop: 10, background: C.accent, border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>I've scanned it ✓</button>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[{ icon: "📱", l: "Authenticator App",   s: twoFA ? "Active" : "Inactive", col: twoFA ? C.green : C.text3 },
                    { icon: "📧", l: "Email OTP Backup",    s: "Available",                   col: C.blue  },
                    { icon: "💬", l: "SMS Backup",          s: "Not set up",                  col: C.text3 },
                  ].map(m => (
                    <div key={m.l} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: C.s2, borderRadius: 9 }}>
                      <span style={{ fontSize: 16 }}>{m.icon}</span>
                      <span style={{ color: C.text1, fontSize: 13, flex: 1 }}>{m.l}</span>
                      <span style={{ color: m.col, fontSize: 11.5, fontWeight: 700 }}>{m.s}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionHead title="Login Security" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { l: "Login Alerts via Email",  on: true  },
                    { l: "New Device Notifications",on: true  },
                    { l: "Suspicious Activity Lock",on: false },
                  ].map((s, i) => (
                    <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.s2, borderRadius: 9 }}>
                      <span style={{ color: C.text1, fontSize: 13 }}>{s.l}</span>
                      <Toggle on={s.on} onChange={() => {}} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Backup codes */}
            <Card style={{ gridColumn: "1/-1" }}>
              <SectionHead title="Backup Recovery Codes" action={<button style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.text2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Regenerate</button>} />
              <p style={{ color: C.text2, fontSize: 13, margin: "0 0 14px" }}>Save these codes somewhere safe. Each can be used once if you lose access to your authenticator.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {["7H2K-9PML", "3NXQ-5TRV", "8WBF-2YCJ", "4DGS-6LKM", "1ZPN-0EAT", "9RCH-7QWX", "6UVB-3YFD", "2MSJ-8KPL", "5GTA-1NZR", "0WEK-4XQB"].map(c => (
                  <div key={c} style={{ padding: "8px 12px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8, textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text1, fontWeight: 700 }}>{c}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 16px", color: C.text2, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>📥 Download</button>
                <button style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 16px", color: C.text2, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>📋 Copy All</button>
              </div>
            </Card>
          </div>
        )}

        {/* ════ NOTIFICATIONS ════ */}
        {tab === "notifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Card>
              <SectionHead title="Notification Preferences" action={<button style={{ background: C.accentBg, border: `1px solid ${C.accent}30`, borderRadius: 8, padding: "6px 14px", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reset to Default</button>} />
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.s2 }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</th>
                      {["Email", "Push", "SMS"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "center", color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notifPrefs.map((p, i) => (
                      <tr key={p.key} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? C.s2 + "55" : C.surface }}>
                        <td style={{ padding: "14px 14px", color: C.text1, fontSize: 13.5, fontWeight: 600 }}>{p.label}</td>
                        {["email", "push", "sms"].map(ch => (
                          <td key={ch} style={{ padding: "14px 14px", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <Toggle on={p[ch]} onChange={() => updateNotif(i, ch)} />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Card>
                <SectionHead title="Quiet Hours" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.text1, fontSize: 13 }}>Enable Quiet Hours</span>
                    <Toggle on={true} onChange={() => {}} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[{ l: "From", v: "10:00 PM" }, { l: "Until", v: "7:00 AM" }].map(t => (
                      <div key={t.l}>
                        <label style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", margin: "0 0 6px", display: "block" }}>{t.l}</label>
                        <input type="time" defaultValue={t.v === "10:00 PM" ? "22:00" : "07:00"} style={{ width: "100%", padding: "10px 12px", background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text1, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 12px", background: C.amberBg, border: `1px solid ${C.amber}25`, borderRadius: 9 }}>
                    <p style={{ color: C.amber, fontSize: 12, margin: 0 }}>🌙 Push & SMS notifications are silenced during quiet hours. Email still delivers.</p>
                  </div>
                </div>
              </Card>
              <Card>
                <SectionHead title="Notification Digest" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ color: C.text2, fontSize: 13, margin: "0 0 4px" }}>Instead of individual alerts, receive a summary digest.</p>
                  {["Real-time (instantly)", "Hourly Digest", "Daily Digest (8:00 AM)", "Weekly Digest (Monday)"].map((o, i) => (
                    <label key={o} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: i === 0 ? C.accentBg : C.s2, border: `1px solid ${i === 0 ? C.accent + "30" : C.border}`, borderRadius: 9, cursor: "pointer" }}>
                      <input type="radio" name="digest" defaultChecked={i === 0} style={{ accentColor: C.accent }} />
                      <span style={{ color: i === 0 ? C.accent : C.text1, fontSize: 13, fontWeight: i === 0 ? 700 : 500 }}>{o}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ════ SESSIONS ════ */}
        {tab === "sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Card>
              <SectionHead title={`Active Sessions (${sessions.length})`} action={<button style={{ background: C.roseBg, border: `1px solid ${C.rose}25`, borderRadius: 8, padding: "6px 14px", color: C.rose, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Revoke All Others</button>} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sessions.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 18px", background: s.current ? C.accentBg : C.s2, border: `1.5px solid ${s.current ? C.accent + "35" : C.border}`, borderRadius: 13 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: s.current ? C.accentL : C.s3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                        <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 800, margin: 0 }}>{s.device}</p>
                        {s.current && <span style={{ background: C.greenL, color: C.green, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>Current</span>}
                      </div>
                      <p style={{ color: C.text3, fontSize: 12, margin: 0 }}>{s.location} · {s.lastSeen}</p>
                    </div>
                    {!s.current && (
                      <button onClick={() => revokeSession(i)} style={{ background: C.roseBg, border: `1px solid ${C.rose}25`, borderRadius: 8, padding: "7px 14px", color: C.rose, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionHead title="Login History (Last 30 Days)" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { device: "Chrome · Windows", location: "Bengaluru, IN", time: "Today 9:22 AM",   status: "success" },
                  { device: "Safari · iPhone",  location: "Bengaluru, IN", time: "Mar 11, 7:15 PM", status: "success" },
                  { device: "Chrome · Android", location: "Hyderabad, IN", time: "Mar 9, 3:02 PM",  status: "success" },
                  { device: "Unknown Device",   location: "Mumbai, IN",    time: "Mar 7, 11:44 PM", status: "blocked" },
                  { device: "Chrome · Windows", location: "Bengaluru, IN", time: "Mar 5, 10:30 AM", status: "success" },
                ].map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: l.status === "blocked" ? C.roseBg : C.s2, borderRadius: 10, border: `1px solid ${l.status === "blocked" ? C.rose + "30" : C.border}` }}>
                    <span style={{ color: l.status === "success" ? C.green : C.rose, fontSize: 16 }}>{l.status === "success" ? "✓" : "⛔"}</span>
                    <span style={{ color: C.text1, fontSize: 13, flex: 1, fontWeight: 600 }}>{l.device}</span>
                    <span style={{ color: C.text3, fontSize: 12 }}>{l.location}</span>
                    <span style={{ color: C.text3, fontSize: 11.5 }}>{l.time}</span>
                    {l.status === "blocked" && <span style={{ background: C.roseL, color: C.rose, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>BLOCKED</span>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ════ ACTIVITY LOG ════ */}
        {tab === "activity" && (
          <Card>
            <SectionHead title="Recent Account Activity" action={<button style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.text2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export Log</button>} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ACTIVITY_LOG.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", background: C.s2, borderRadius: 11, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: a.color + "18", border: `1px solid ${a.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text1, fontSize: 13.5, fontWeight: 700, margin: "0 0 2px" }}>{a.action}</p>
                    <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>{a.device}</p>
                  </div>
                  <span style={{ color: C.text3, fontSize: 11.5, flexShrink: 0 }}>{a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ════ PREFERENCES ════ */}
        {tab === "preferences" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            <Card>
              <SectionHead title="Appearance" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <p style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Theme</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {[{ l: "Light", icon: "☀️", active: true }, { l: "Dark", icon: "🌙", active: false }, { l: "System", icon: "💻", active: false }].map(t => (
                      <div key={t.l} style={{ padding: "14px", background: t.active ? C.accentBg : C.s2, border: `1.5px solid ${t.active ? C.accent : C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                        <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>{t.icon}</span>
                        <span style={{ color: t.active ? C.accent : C.text2, fontSize: 12, fontWeight: 700 }}>{t.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Accent Color</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[C.accent, C.blue, C.violet, C.green, C.rose, C.amber].map(col => (
                      <div key={col} onClick={() => {}} style={{ width: 32, height: 32, borderRadius: "50%", background: col, cursor: "pointer", border: col === C.accent ? `3px solid ${col}` : "3px solid transparent", outline: `2px solid ${col === C.accent ? col : "transparent"}`, outlineOffset: 2 }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: C.text3, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Font Size</p>
                  <input type="range" min="12" max="18" defaultValue="14" style={{ width: "100%", accentColor: C.accent }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: C.text3, fontSize: 11 }}>Small</span>
                    <span style={{ color: C.text3, fontSize: 11 }}>Large</span>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <SectionHead title="Accessibility & Behaviour" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { l: "Reduce Motion",            d: "Minimize animations and transitions",        on: false },
                  { l: "High Contrast Mode",        d: "Increase text and border contrast",          on: false },
                  { l: "Show Tooltips",             d: "Show helpful hints on hover",                on: true  },
                  { l: "Compact Mode",              d: "Reduce spacing for more content density",    on: false },
                  { l: "Auto-save Forms",           d: "Save form drafts automatically",             on: true  },
                  { l: "Remember Last Page",        d: "Return to last visited page on login",       on: true  },
                ].map((s, i) => (
                  <div key={s.l} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: C.s2, borderRadius: 9 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.text1, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{s.l}</p>
                      <p style={{ color: C.text3, fontSize: 11.5, margin: 0 }}>{s.d}</p>
                    </div>
                    <Toggle on={s.on} onChange={() => {}} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-thumb{background:#d4c9b8;border-radius:4px}`}</style>
    </div>
  );
}