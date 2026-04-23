// src/pages/super-admin/AdminSettings.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",    icon: "◉", label: "Profile"          },
  { id: "security",  icon: "⬡", label: "Security"         },
  { id: "platform",  icon: "▣", label: "Platform"         },
  { id: "notify",    icon: "◎", label: "Notifications"    },
  { id: "appearance",icon: "◈", label: "Appearance"       },
  { id: "api",       icon: "⟳", label: "API & Integrations"},
  { id: "audit",     icon: "≡", label: "Audit Log"        },
  { id: "danger",    icon: "⚠", label: "Danger Zone"      },
];

// ─── Mock audit log ───────────────────────────────────────────────────────────
const AUDIT = [
  { id:1, action:"Password changed",         ip:"103.26.14.8",   ua:"Chrome 124 / Windows",  time:"2 min ago",   level:"warn"    },
  { id:2, action:"School approved: DPS R.K.", ip:"103.26.14.8",  ua:"Chrome 124 / Windows",  time:"18 min ago",  level:"info"    },
  { id:3, action:"User role changed: TEACHER→SCHOOL_ADMIN", ip:"103.26.14.8", ua:"Chrome 124 / Windows", time:"1h ago", level:"warn" },
  { id:4, action:"Login successful",          ip:"103.26.14.8",   ua:"Chrome 124 / Windows",  time:"2h ago",      level:"info"    },
  { id:5, action:"School application rejected",ip:"103.26.14.8",  ua:"Chrome 124 / Windows",  time:"3h ago",      level:"error"   },
  { id:6, action:"Platform settings saved",   ip:"122.18.90.4",   ua:"Safari 17 / macOS",     time:"Yesterday",   level:"info"    },
  { id:7, action:"New SCHOOL_ADMIN created",  ip:"122.18.90.4",   ua:"Safari 17 / macOS",     time:"Yesterday",   level:"info"    },
  { id:8, action:"Failed login attempt",       ip:"45.33.120.8",   ua:"Unknown",               time:"2 days ago",  level:"error"   },
];

// ─── Mock active sessions ─────────────────────────────────────────────────────
const SESSIONS = [
  { id:1, device:"Chrome 124 · Windows 11",  location:"New Delhi, IN",    time:"Now",         current:true  },
  { id:2, device:"Safari 17 · macOS Sonoma", location:"Mumbai, IN",       time:"3 hours ago", current:false },
  { id:3, device:"Mobile · Android 14",      location:"Bengaluru, IN",    time:"Yesterday",   current:false },
];

// ─── Mock API keys ────────────────────────────────────────────────────────────
const INITIAL_KEYS = [
  { id:1, name:"Production Key",   key:"as_live_xK9p...4mQr", created:"Jan 12, 2025", lastUsed:"2 min ago",   perms:["read","write"],   active:true  },
  { id:2, name:"Analytics Hook",   key:"as_live_yR2n...8wLs", created:"Feb 3, 2025",  lastUsed:"1 day ago",   perms:["read"],           active:true  },
  { id:3, name:"Legacy Webhook",   key:"as_live_mT7q...1xPc", created:"Oct 5, 2024",  lastUsed:"3 months ago",perms:["read"],           active:false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    style={{
      width: 44, height: 24, borderRadius: 12,
      background: value ? "var(--accent)" : "var(--bg-active)",
      border: `1px solid ${value ? "var(--accent)" : "var(--border-md)"}`,
      position: "relative", cursor: disabled ? "default" : "pointer",
      transition: "all 0.2s", flexShrink: 0, padding: 0,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span style={{
      position: "absolute", top: 3,
      left: value ? 22 : 3,
      width: 16, height: 16, borderRadius: "50%",
      background: "#fff",
      transition: "left 0.2s",
      display: "block",
      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
    }} />
  </button>
);

const Field = ({ label, hint, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text2)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </label>
    {children}
    {hint && !error && <p style={{ fontSize: 11.5, color: "var(--c-text3)", lineHeight: 1.4 }}>{hint}</p>}
    {error && <p style={{ fontSize: 11.5, color: "var(--rose)", display: "flex", alignItems: "center", gap: 4 }}>⚠ {error}</p>}
  </div>
);

const inp = (err) => ({
  background: "var(--bg-raised)",
  border: `1px solid ${err ? "rgba(255,95,126,0.4)" : "var(--border)"}`,
  borderRadius: 8,
  padding: "10px 13px",
  color: "var(--c-text1)",
  fontSize: 13.5,
  fontFamily: "var(--font)",
  outline: "none",
  width: "100%",
  transition: "border-color 0.18s",
});

const SaveBar = ({ saving, saved, onSave, onReset }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "flex-end",
    gap: 10, paddingTop: 20, borderTop: "1px solid var(--border)", marginTop: 8,
  }}>
    <button onClick={onReset} style={{
      background: "none", border: "1px solid var(--border)",
      borderRadius: 8, padding: "9px 18px", color: "var(--c-text2)",
      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
    }}>Reset</button>
    <button onClick={onSave} disabled={saving} style={{
      background: saved ? "rgba(61,214,140,0.15)" : "linear-gradient(135deg,var(--accent),var(--teal))",
      border: saved ? "1px solid var(--green)" : "none",
      borderRadius: 8, padding: "9px 22px",
      color: saved ? "var(--green)" : "#060810",
      fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer",
      fontFamily: "var(--font)", display: "flex", alignItems: "center", gap: 7,
      transition: "all 0.3s", opacity: saving ? 0.7 : 1,
    }}>
      {saving ? <><span style={{ width:14,height:14,border:"2px solid #06081040",borderTop:"2px solid #060810",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite" }} />Saving…</> : saved ? "✓ Saved" : "Save Changes"}
    </button>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function SuperAdminSettings() {
  const { user, updateProfile, changePassword, logout, authFetch } = useAuth();

  const [tab,        setTab       ] = useState("profile");
  const [saving,     setSaving    ] = useState(false);
  const [saved,      setSaved     ] = useState(false);
  const [loaded,     setLoaded    ] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    name:        user?.name  || "",
    email:       user?.email || "",
    phone:       user?.phone || "",
    photo:       user?.photo || "",
    bio:         "",
    timezone:    "Asia/Kolkata",
    language:    "en",
    dateFormat:  "DD/MM/YYYY",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [photoPreview,  setPhotoPreview ] = useState(user?.photo || "");
  const photoRef = useRef(null);

  // Security
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwVisible, setPwVisible] = useState({ current:false, next:false, confirm:false });
  const [pwStrength, setPwStrength] = useState(0);
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState(SESSIONS);

  // Platform
  const [platform, setPlatform] = useState({
    platformName:        "AcademiaSphere",
    supportEmail:        "support@academysphere.in",
    maxSchools:          500,
    allowRegistrations:  true,
    requireApproval:     true,
    maintenanceMode:     false,
    maintenanceMsg:      "We're performing scheduled maintenance. Back soon.",
    defaultPlan:         "Trial",
    trialDays:           30,
    autoApproveVendors:  false,
  });

  // Notifications
  const [notif, setNotif] = useState({
    emailNewApp:         true,
    emailApproval:       true,
    emailRejection:      true,
    emailNewUser:        false,
    emailWeeklyReport:   true,
    emailAiAlerts:       true,
    smsNewApp:           false,
    smsCriticalAlerts:   true,
    pushInApp:           true,
    digestFrequency:     "daily",
    quietHoursEnabled:   false,
    quietStart:          "22:00",
    quietEnd:            "08:00",
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    theme:        "dark",
    accentColor:  "#5b8cff",
    sidebarMini:  false,
    denseMode:    false,
    animations:   true,
    primaryFont:  "Outfit",
  });

  // API keys
  const [apiKeys, setApiKeys] = useState(INITIAL_KEYS);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);
  useEffect(() => { setSaved(false); }, [tab]);

  // ── Password strength ───────────────────────────────────────────────────────
  useEffect(() => {
    const p = pwForm.next;
    let s = 0;
    if (p.length >= 8)                            s++;
    if (/[A-Z]/.test(p))                          s++;
    if (/[a-z]/.test(p))                          s++;
    if (/\d/.test(p))                             s++;
    if (/[^A-Za-z0-9]/.test(p))                  s++;
    setPwStrength(s);
  }, [pwForm.next]);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][pwStrength];
  const strengthColor = ["", "#fc8181","#f6ad55","#fbbf24","#3dd68c","#38d9c0"][pwStrength];

  // ── Save helpers ─────────────────────────────────────────────────────────────
  const doSave = useCallback(async (fn) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // simulate latency
    try { await fn(); } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, []);

  // ── Profile save ─────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    const e = {};
    if (!profile.name.trim() || profile.name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (!profile.email || !/\S+@\S+\.\S+/.test(profile.email))  e.email = "Valid email required";
    if (Object.keys(e).length) { setProfileErrors(e); return; }
    setProfileErrors({});
    doSave(() => updateProfile({ name: profile.name, phone: profile.phone, photo: profile.photo }));
  };

  // ── Password save ─────────────────────────────────────────────────────────────
  const savePassword = async () => {
    const e = {};
    if (!pwForm.current)                                              e.current  = "Current password required";
    if (!pwForm.next || pwForm.next.length < 8)                       e.next     = "Minimum 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwForm.next))   e.next     = "Needs uppercase, lowercase & number";
    if (pwForm.next !== pwForm.confirm)                               e.confirm  = "Passwords do not match";
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwErrors({});
    doSave(() => changePassword(pwForm.current, pwForm.next));
    setPwForm({ current: "", next: "", confirm: "" });
  };

  // ── Photo upload ──────────────────────────────────────────────────────────────
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setProfile(p => ({ ...p, photo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // ── API key actions ───────────────────────────────────────────────────────────
  const generateKey = () => {
    if (!newKeyName.trim()) return;
    const fake = `as_live_${Math.random().toString(36).slice(2,6)}...${Math.random().toString(36).slice(2,6)}`;
    const newK = {
      id: Date.now(), name: newKeyName.trim(), key: fake,
      created: new Date().toLocaleDateString("en-IN", { month:"short", day:"numeric", year:"numeric" }),
      lastUsed: "Never", perms: ["read"], active: true,
    };
    setApiKeys(k => [newK, ...k]);
    setShowNewKey(newK.id);
    setNewKeyName("");
    setTimeout(() => setShowNewKey(null), 15000);
  };

  const revokeKey = (id) => setApiKeys(k => k.map(x => x.id === id ? { ...x, active: false } : x));
  const revokeSession = (id) => setSessions(s => s.filter(x => x.id === id ? x.current : true));

  const accentColors = ["#5b8cff","#38d9c0","#ff5f7e","#ffb547","#a78bfa","#34d399","#f472b6","#fb923c"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-base:    #060810;
          --bg-surface: #0c0f1a;
          --bg-raised:  #111520;
          --bg-hover:   #181d2e;
          --bg-active:  #1e2540;
          --border:     rgba(255,255,255,0.06);
          --border-md:  rgba(255,255,255,0.10);
          --c-text1:    #eef0f8;
          --c-text2:    #8b93b0;
          --c-text3:    #4a5168;
          --accent:     #5b8cff;
          --accent-dim: rgba(91,140,255,0.12);
          --teal:       #38d9c0;
          --rose:       #ff5f7e;
          --amber:      #ffb547;
          --green:      #3dd68c;
          --font:       'Outfit', sans-serif;
          --mono:       'DM Mono', monospace;
        }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }

        html, body { background: var(--bg-base); color: var(--c-text1); font-family: var(--font); }

        .settings-root {
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .settings-root.vis { opacity: 1; }

        /* ── Sidebar nav ───── */
        .settings-nav {
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          padding: 28px 12px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .settings-nav::-webkit-scrollbar { display: none; }
        .settings-nav-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: var(--c-text3);
          padding: 0 10px;
          margin-bottom: 10px;
        }
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--c-text2);
          transition: all 0.15s;
          margin-bottom: 2px;
          border: 1px solid transparent;
          background: none;
          width: 100%;
          font-family: var(--font);
          text-align: left;
        }
        .settings-nav-item:hover { background: var(--bg-hover); color: var(--c-text1); }
        .settings-nav-item.active {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: rgba(91,140,255,0.15);
        }
        .settings-nav-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
        .nav-danger { color: var(--rose) !important; }
        .nav-danger:hover { background: rgba(255,95,126,0.1) !important; }
        .nav-danger.active { background: rgba(255,95,126,0.12) !important; color: var(--rose) !important; border-color: rgba(255,95,126,0.2) !important; }

        /* ── Content area ───── */
        .settings-content {
          padding: 32px 36px 80px;
          max-width: 780px;
        }
        .settings-page { animation: fadeUp 0.3s ease; }

        .page-head { margin-bottom: 28px; }
        .page-head-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--c-text1);
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .page-head-sub { font-size: 13px; color: var(--c-text2); line-height: 1.5; }

        /* ── Cards ───── */
        .card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 22px 24px;
          margin-bottom: 16px;
        }
        .card-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--c-text1);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-title-icon { font-size: 16px; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-grid.single { grid-template-columns: 1fr; }
        .span2 { grid-column: span 2; }

        input[type="text"], input[type="email"], input[type="tel"],
        input[type="password"], input[type="number"], select, textarea {
          background: var(--bg-raised);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 13px;
          color: var(--c-text1);
          font-size: 13.5px;
          font-family: var(--font);
          outline: none;
          width: 100%;
          transition: border-color 0.18s;
        }
        input:focus, select:focus, textarea:focus { border-color: rgba(91,140,255,0.4); }
        input::placeholder, textarea::placeholder { color: var(--c-text3); }
        select { appearance: none; cursor: pointer; }
        textarea { resize: vertical; min-height: 80px; }

        /* ── Row items ───── */
        .row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          gap: 16px;
        }
        .row-item:last-child { border-bottom: none; padding-bottom: 0; }
        .row-item-info { flex: 1; }
        .row-label { font-size: 13.5px; font-weight: 500; color: var(--c-text1); margin-bottom: 2px; }
        .row-desc  { font-size: 12px; color: var(--c-text2); line-height: 1.4; }

        /* ── Password strength ───── */
        .pw-strength-bar {
          height: 3px;
          background: var(--bg-active);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }
        .pw-strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s, background 0.3s;
        }

        /* ── Avatar upload ───── */
        .avatar-upload {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }
        .avatar-img {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--accent), var(--teal));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid var(--border-md);
        }
        .avatar-img img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-actions { display: flex; flex-direction: column; gap: 8px; }
        .btn-sm {
          padding: 7px 14px;
          border-radius: 7px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border-md);
          background: var(--bg-raised);
          color: var(--c-text2);
          font-family: var(--font);
          transition: all 0.15s;
        }
        .btn-sm:hover { background: var(--bg-hover); color: var(--c-text1); }
        .btn-sm.accent {
          background: var(--accent-dim);
          border-color: rgba(91,140,255,0.25);
          color: var(--accent);
        }
        .btn-sm.accent:hover { background: rgba(91,140,255,0.2); }
        .btn-sm.danger {
          background: rgba(255,95,126,0.1);
          border-color: rgba(255,95,126,0.2);
          color: var(--rose);
        }
        .btn-sm.danger:hover { background: rgba(255,95,126,0.2); }

        /* ── Session cards ───── */
        .session-item {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px;
          background: var(--bg-raised);
          border: 1px solid var(--border);
          border-radius: 9px;
          margin-bottom: 8px;
        }
        .session-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--bg-active);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .session-info { flex: 1; }
        .session-device { font-size: 13px; font-weight: 600; color: var(--c-text1); }
        .session-meta   { font-size: 11.5px; color: var(--c-text2); margin-top: 2px; }

        /* ── API keys table ───── */
        .key-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-raised);
          border: 1px solid var(--border);
          border-radius: 9px;
          margin-bottom: 8px;
          transition: border-color 0.15s;
        }
        .key-row:hover { border-color: var(--border-md); }
        .key-name   { font-size: 13px; font-weight: 600; color: var(--c-text1); }
        .key-string {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--accent);
          background: var(--accent-dim);
          padding: 3px 8px;
          border-radius: 5px;
          letter-spacing: 0.5px;
        }
        .key-meta { font-size: 11px; color: var(--c-text3); margin-top: 2px; }
        .perm-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 600;
          background: var(--bg-active);
          color: var(--c-text2);
        }
        .new-key-reveal {
          background: rgba(61,214,140,0.08);
          border: 1px solid rgba(61,214,140,0.2);
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .new-key-val {
          flex: 1;
          font-family: var(--mono);
          font-size: 12.5px;
          color: var(--green);
          word-break: break-all;
        }

        /* ── Audit log ───── */
        .audit-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid var(--border);
        }
        .audit-row:last-child { border-bottom: none; }
        .audit-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
        }
        .audit-action { font-size: 13px; color: var(--c-text1); font-weight: 500; }
        .audit-meta   { font-size: 11.5px; color: var(--c-text3); margin-top: 3px; display: flex; gap: 10px; flex-wrap: wrap; }

        /* ── Accent picker ───── */
        .accent-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
        .accent-swatch {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.15s;
          border: 2px solid transparent;
        }
        .accent-swatch.selected { border-color: #fff; transform: scale(1.15); box-shadow: 0 0 0 3px rgba(255,255,255,0.15); }

        /* ── Danger zone ───── */
        .danger-card {
          background: rgba(255,95,126,0.05);
          border: 1px solid rgba(255,95,126,0.15);
          border-radius: 12px;
          padding: 20px 22px;
          margin-bottom: 12px;
        }
        .danger-title { font-size: 14px; font-weight: 700; color: var(--rose); margin-bottom: 4px; }
        .danger-desc  { font-size: 13px; color: var(--c-text2); line-height: 1.5; margin-bottom: 14px; }
        .btn-danger {
          padding: 9px 18px;
          border-radius: 8px;
          background: rgba(255,95,126,0.12);
          border: 1px solid rgba(255,95,126,0.3);
          color: var(--rose);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: var(--font);
          transition: all 0.15s;
        }
        .btn-danger:hover { background: rgba(255,95,126,0.2); }

        /* ── Maintenance banner preview ───── */
        .maintenance-preview {
          background: rgba(255,181,71,0.08);
          border: 1px solid rgba(255,181,71,0.2);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: var(--amber);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        @media (max-width: 800px) {
          .settings-root { grid-template-columns: 1fr; }
          .settings-nav  { position: static; height: auto; display: flex; flex-wrap: wrap; gap: 4px; padding: 16px 12px; border-right: none; border-bottom: 1px solid var(--border); }
          .settings-content { padding: 20px 16px 60px; }
          .form-grid { grid-template-columns: 1fr; }
          .span2 { grid-column: span 1; }
        }
      `}</style>

      <div className={`settings-root${loaded ? " vis" : ""}`}>

        {/* ── Sidebar nav ── */}
        <nav className="settings-nav">
          <div className="settings-nav-title">Settings</div>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`settings-nav-item${tab === t.id ? " active" : ""}${t.id === "danger" ? " nav-danger" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="settings-nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <div className="settings-content">

          {/* ════════════════════════════════════════════
              PROFILE
          ════════════════════════════════════════════ */}
          {tab === "profile" && (
            <div className="settings-page" key="profile">
              <div className="page-head">
                <h2 className="page-head-title">Profile</h2>
                <p className="page-head-sub">Manage your personal information and platform preferences.</p>
              </div>

              {/* Avatar */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">◉</span> Profile Photo</div>
                <div className="avatar-upload">
                  <div className="avatar-img">
                    {photoPreview
                      ? <img src={photoPreview} alt="avatar" />
                      : (user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || "SA")
                    }
                  </div>
                  <div className="avatar-actions">
                    <button className="btn-sm accent" onClick={() => photoRef.current?.click()}>
                      Upload Photo
                    </button>
                    {photoPreview && (
                      <button className="btn-sm danger" onClick={() => { setPhotoPreview(""); setProfile(p=>({...p,photo:""})); }}>
                        Remove
                      </button>
                    )}
                    <p style={{ fontSize: 11, color: "var(--c-text3)" }}>PNG, JPG up to 2MB</p>
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto} />
                </div>
              </div>

              {/* Personal info */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">👤</span> Personal Information</div>
                <div className="form-grid">
                  <Field label="Full Name" error={profileErrors.name}>
                    <input type="text" value={profile.name}
                      onChange={e => setProfile(p=>({...p,name:e.target.value}))}
                      placeholder="Your full name" />
                  </Field>
                  <Field label="Email Address" error={profileErrors.email}>
                    <input type="email" value={profile.email}
                      onChange={e => setProfile(p=>({...p,email:e.target.value}))}
                      placeholder="admin@platform.com" />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" value={profile.phone}
                      onChange={e => setProfile(p=>({...p,phone:e.target.value}))}
                      placeholder="10-digit number" />
                  </Field>
                  <Field label="Timezone">
                    <select value={profile.timezone} onChange={e => setProfile(p=>({...p,timezone:e.target.value}))}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                    </select>
                  </Field>
                  <Field label="Language">
                    <select value={profile.language} onChange={e => setProfile(p=>({...p,language:e.target.value}))}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                    </select>
                  </Field>
                  <Field label="Date Format">
                    <select value={profile.dateFormat} onChange={e => setProfile(p=>({...p,dateFormat:e.target.value}))}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </select>
                  </Field>
                  <div className="span2">
                    <Field label="Bio" hint="Shown on your profile page. Max 200 characters.">
                      <textarea
                        value={profile.bio}
                        onChange={e => setProfile(p=>({...p,bio:e.target.value.slice(0,200)}))}
                        placeholder="Brief description of your role…"
                      />
                      <p style={{ fontSize:11, color:"var(--c-text3)", marginTop:4, textAlign:"right" }}>{profile.bio.length}/200</p>
                    </Field>
                  </div>
                </div>
                <SaveBar saving={saving} saved={saved} onSave={saveProfile} onReset={() => { setProfile({ name: user?.name||"", email: user?.email||"", phone: user?.phone||"", photo:"", bio:"", timezone:"Asia/Kolkata", language:"en", dateFormat:"DD/MM/YYYY" }); setProfileErrors({}); }} />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              SECURITY
          ════════════════════════════════════════════ */}
          {tab === "security" && (
            <div className="settings-page" key="security">
              <div className="page-head">
                <h2 className="page-head-title">Security</h2>
                <p className="page-head-sub">Manage your password, two-factor authentication, and active sessions.</p>
              </div>

              {/* Password */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">🔑</span> Change Password</div>
                <div className="form-grid single" style={{ maxWidth: 400 }}>
                  {[
                    { key:"current", label:"Current Password", placeholder:"Your current password" },
                    { key:"next",    label:"New Password",      placeholder:"Min. 8 characters"     },
                    { key:"confirm", label:"Confirm Password",  placeholder:"Repeat new password"   },
                  ].map(f => (
                    <Field key={f.key} label={f.label} error={pwErrors[f.key]}>
                      <div style={{ position:"relative" }}>
                        <input
                          type={pwVisible[f.key] ? "text" : "password"}
                          value={pwForm[f.key]}
                          onChange={e => setPwForm(p=>({...p,[f.key]:e.target.value}))}
                          placeholder={f.placeholder}
                          style={{ paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setPwVisible(p=>({...p,[f.key]:!p[f.key]}))}
                          style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--c-text3)", cursor:"pointer", fontSize:15 }}
                        >
                          {pwVisible[f.key] ? "◑" : "○"}
                        </button>
                      </div>
                      {f.key === "next" && pwForm.next && (
                        <>
                          <div className="pw-strength-bar">
                            <div className="pw-strength-fill" style={{ width:`${pwStrength*20}%`, background: strengthColor }} />
                          </div>
                          <p style={{ fontSize:11, color: strengthColor, marginTop:3 }}>{strengthLabel}</p>
                        </>
                      )}
                    </Field>
                  ))}
                </div>
                <SaveBar saving={saving} saved={saved} onSave={savePassword} onReset={() => { setPwForm({current:"",next:"",confirm:""}); setPwErrors({}); }} />
              </div>

              {/* 2FA */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">🔐</span> Two-Factor Authentication</div>
                <div className="row-item">
                  <div className="row-item-info">
                    <div className="row-label">Authenticator App (TOTP)</div>
                    <div className="row-desc">Use Google Authenticator or Authy for time-based one-time codes.</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, fontWeight:600, color: twoFA ? "var(--green)" : "var(--c-text3)" }}>
                      {twoFA ? "Enabled" : "Disabled"}
                    </span>
                    <Toggle value={twoFA} onChange={setTwoFA} />
                  </div>
                </div>
                {twoFA && (
                  <div style={{ marginTop:12, background:"var(--bg-raised)", border:"1px solid var(--border)", borderRadius:8, padding:"12px 14px", fontSize:13, color:"var(--c-text2)", display:"flex", alignItems:"center", gap:8 }}>
                    ✓ 2FA is active. Backup codes were sent to {user?.email || "your email"}.
                  </div>
                )}
              </div>

              {/* Active sessions */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">📱</span> Active Sessions</div>
                {sessions.map(s => (
                  <div key={s.id} className="session-item">
                    <div className="session-icon">{s.device.includes("Mobile") ? "📱" : s.device.includes("Safari") ? "🍎" : "💻"}</div>
                    <div className="session-info">
                      <div className="session-device">
                        {s.device}
                        {s.current && (
                          <span style={{ marginLeft:8, fontSize:10, background:"rgba(61,214,140,0.12)", color:"var(--green)", padding:"2px 7px", borderRadius:4, fontWeight:700 }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div className="session-meta">{s.location} · {s.time}</div>
                    </div>
                    {!s.current && (
                      <button className="btn-sm danger" onClick={() => revokeSession(s.id)}>Revoke</button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setSessions(s => s.filter(x => x.current))}
                  style={{ marginTop:8, fontSize:12.5, color:"var(--rose)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font)", fontWeight:600 }}
                >
                  Revoke all other sessions →
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              PLATFORM
          ════════════════════════════════════════════ */}
          {tab === "platform" && (
            <div className="settings-page" key="platform">
              <div className="page-head">
                <h2 className="page-head-title">Platform Settings</h2>
                <p className="page-head-sub">Configure global platform behaviour, registration policies, and defaults.</p>
              </div>

              <div className="card">
                <div className="card-title"><span className="card-title-icon">⬡</span> General</div>
                <div className="form-grid">
                  <Field label="Platform Name">
                    <input type="text" value={platform.platformName}
                      onChange={e => setPlatform(p=>({...p,platformName:e.target.value}))} />
                  </Field>
                  <Field label="Support Email">
                    <input type="email" value={platform.supportEmail}
                      onChange={e => setPlatform(p=>({...p,supportEmail:e.target.value}))} />
                  </Field>
                  <Field label="Max Schools" hint="Set 0 for unlimited.">
                    <input type="number" value={platform.maxSchools}
                      onChange={e => setPlatform(p=>({...p,maxSchools:Number(e.target.value)}))} min={0} />
                  </Field>
                  <Field label="Default Plan">
                    <select value={platform.defaultPlan} onChange={e => setPlatform(p=>({...p,defaultPlan:e.target.value}))}>
                      {["Trial","Basic","Pro","Enterprise"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Trial Duration (days)">
                    <input type="number" value={platform.trialDays}
                      onChange={e => setPlatform(p=>({...p,trialDays:Number(e.target.value)}))} min={1} max={90} />
                  </Field>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><span className="card-title-icon">◎</span> Registration & Approval</div>
                {[
                  { key:"allowRegistrations",  label:"Allow Public Registrations",    desc:"Schools can submit registration requests from the public form."                  },
                  { key:"requireApproval",      label:"Require Manual Approval",        desc:"New school applications need Super Admin approval before going live."           },
                  { key:"autoApproveVendors",   label:"Auto-approve Vendor Accounts",   desc:"Vendor registrations are activated immediately without review."                 },
                ].map(item => (
                  <div key={item.key} className="row-item">
                    <div className="row-item-info">
                      <div className="row-label">{item.label}</div>
                      <div className="row-desc">{item.desc}</div>
                    </div>
                    <Toggle value={platform[item.key]} onChange={v => setPlatform(p=>({...p,[item.key]:v}))} />
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-title"><span className="card-title-icon">⚠</span> Maintenance Mode</div>
                <div className="row-item">
                  <div className="row-item-info">
                    <div className="row-label">Enable Maintenance Mode</div>
                    <div className="row-desc">All non-admin users will see the maintenance message instead of the platform.</div>
                  </div>
                  <Toggle value={platform.maintenanceMode} onChange={v => setPlatform(p=>({...p,maintenanceMode:v}))} />
                </div>
                {platform.maintenanceMode && (
                  <div style={{ marginTop:14 }}>
                    <Field label="Maintenance Message">
                      <textarea
                        value={platform.maintenanceMsg}
                        onChange={e => setPlatform(p=>({...p,maintenanceMsg:e.target.value}))}
                      />
                    </Field>
                    <div className="maintenance-preview">
                      ⚙️ <span><strong>Preview:</strong> {platform.maintenanceMsg}</span>
                    </div>
                  </div>
                )}
              </div>

              <SaveBar saving={saving} saved={saved}
                onSave={() => doSave(() => authFetch?.("/api/v1/super-admin/settings", { method:"PATCH", body: JSON.stringify(platform) }))}
                onReset={() => setPlatform(p=>({...p}))}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════
              NOTIFICATIONS
          ════════════════════════════════════════════ */}
          {tab === "notify" && (
            <div className="settings-page" key="notify">
              <div className="page-head">
                <h2 className="page-head-title">Notifications</h2>
                <p className="page-head-sub">Choose what you get notified about and how.</p>
              </div>

              {[
                {
                  title: "📧 Email Notifications", items: [
                    { key:"emailNewApp",       label:"New school application",  desc:"When a school submits a registration request."    },
                    { key:"emailApproval",     label:"School approved",         desc:"When you or another admin approves a school."     },
                    { key:"emailRejection",    label:"School rejected",         desc:"When an application is rejected."                 },
                    { key:"emailNewUser",      label:"New user signup",         desc:"When any new user registers on the platform."     },
                    { key:"emailWeeklyReport", label:"Weekly report",           desc:"Platform analytics digest every Monday morning."  },
                    { key:"emailAiAlerts",     label:"AI model alerts",         desc:"When a model accuracy drops below threshold."     },
                  ]
                },
                {
                  title: "💬 SMS Notifications", items: [
                    { key:"smsNewApp",         label:"New application (SMS)",  desc:"Receive an SMS for urgent application alerts."    },
                    { key:"smsCriticalAlerts", label:"Critical system alerts", desc:"Infrastructure and security alert SMS."           },
                  ]
                },
                {
                  title: "🔔 In-App", items: [
                    { key:"pushInApp",         label:"In-app notifications",   desc:"Badge counts and slide-in toast notifications."  },
                  ]
                },
              ].map(group => (
                <div key={group.title} className="card">
                  <div className="card-title">{group.title}</div>
                  {group.items.map(item => (
                    <div key={item.key} className="row-item">
                      <div className="row-item-info">
                        <div className="row-label">{item.label}</div>
                        <div className="row-desc">{item.desc}</div>
                      </div>
                      <Toggle value={notif[item.key]} onChange={v => setNotif(p=>({...p,[item.key]:v}))} />
                    </div>
                  ))}
                </div>
              ))}

              <div className="card">
                <div className="card-title">⏰ Quiet Hours</div>
                <div className="row-item">
                  <div className="row-item-info">
                    <div className="row-label">Enable Quiet Hours</div>
                    <div className="row-desc">Suppress non-critical notifications during the selected window.</div>
                  </div>
                  <Toggle value={notif.quietHoursEnabled} onChange={v => setNotif(p=>({...p,quietHoursEnabled:v}))} />
                </div>
                {notif.quietHoursEnabled && (
                  <div className="form-grid" style={{ marginTop:14 }}>
                    <Field label="Quiet Start">
                      <input type="time" value={notif.quietStart} onChange={e => setNotif(p=>({...p,quietStart:e.target.value}))} />
                    </Field>
                    <Field label="Quiet End">
                      <input type="time" value={notif.quietEnd} onChange={e => setNotif(p=>({...p,quietEnd:e.target.value}))} />
                    </Field>
                  </div>
                )}
              </div>

              <SaveBar saving={saving} saved={saved}
                onSave={() => doSave(() => {})}
                onReset={() => {}}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════
              APPEARANCE
          ════════════════════════════════════════════ */}
          {tab === "appearance" && (
            <div className="settings-page" key="appearance">
              <div className="page-head">
                <h2 className="page-head-title">Appearance</h2>
                <p className="page-head-sub">Customise the look and feel of your dashboard.</p>
              </div>

              <div className="card">
                <div className="card-title">◈ Theme</div>
                <div style={{ display:"flex", gap:10, marginBottom:4 }}>
                  {["dark","light","system"].map(t => (
                    <button key={t} onClick={() => setAppearance(p=>({...p,theme:t}))}
                      style={{
                        flex:1, padding:"14px 10px", borderRadius:9, cursor:"pointer",
                        background: appearance.theme === t ? "var(--accent-dim)" : "var(--bg-raised)",
                        border: `1px solid ${appearance.theme === t ? "rgba(91,140,255,0.3)" : "var(--border)"}`,
                        color: appearance.theme === t ? "var(--accent)" : "var(--c-text2)",
                        fontSize:13, fontWeight:600, fontFamily:"var(--font)",
                        transition:"all 0.15s",
                      }}>
                      {t === "dark" ? "🌙" : t === "light" ? "☀️" : "💻"} {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">🎨 Accent Color</div>
                <p style={{ fontSize:12.5, color:"var(--c-text2)", marginBottom:10 }}>Choose your preferred highlight color across the UI.</p>
                <div className="accent-grid">
                  {accentColors.map(c => (
                    <div key={c} className={`accent-swatch${appearance.accentColor === c ? " selected" : ""}`}
                      style={{ background: c }}
                      onClick={() => setAppearance(p=>({...p,accentColor:c}))}
                      title={c}
                    />
                  ))}
                  <input type="color" value={appearance.accentColor}
                    onChange={e => setAppearance(p=>({...p,accentColor:e.target.value}))}
                    style={{ width:28, height:28, border:"none", background:"none", cursor:"pointer", padding:0, borderRadius:7 }}
                    title="Custom color"
                  />
                </div>
                <div style={{ marginTop:14, padding:"10px 14px", background:appearance.accentColor+"22", borderRadius:8, border:`1px solid ${appearance.accentColor}44`, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:10,height:10,borderRadius:"50%",background:appearance.accentColor }} />
                  <span style={{ fontSize:12.5, color:appearance.accentColor, fontFamily:"var(--mono)" }}>
                    Preview: {appearance.accentColor}
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="card-title">⚙️ Interface</div>
                {[
                  { key:"sidebarMini", label:"Collapsed Sidebar by Default",  desc:"Start with the icon-only sidebar on every page load."  },
                  { key:"denseMode",   label:"Dense Mode",                     desc:"Reduce padding and spacing for more data per screen."   },
                  { key:"animations",  label:"Enable Animations",              desc:"Page transitions, chart reveals, and micro-interactions."},
                ].map(item => (
                  <div key={item.key} className="row-item">
                    <div className="row-item-info">
                      <div className="row-label">{item.label}</div>
                      <div className="row-desc">{item.desc}</div>
                    </div>
                    <Toggle value={appearance[item.key]} onChange={v => setAppearance(p=>({...p,[item.key]:v}))} />
                  </div>
                ))}
              </div>

              <SaveBar saving={saving} saved={saved} onSave={() => doSave(()=>{})} onReset={()=>{}} />
            </div>
          )}

          {/* ════════════════════════════════════════════
              API & INTEGRATIONS
          ════════════════════════════════════════════ */}
          {tab === "api" && (
            <div className="settings-page" key="api">
              <div className="page-head">
                <h2 className="page-head-title">API & Integrations</h2>
                <p className="page-head-sub">Manage API keys and third-party service integrations.</p>
              </div>

              <div className="card">
                <div className="card-title">⟳ API Keys</div>
                <p style={{ fontSize:12.5, color:"var(--c-text2)", marginBottom:16, lineHeight:1.6 }}>
                  API keys grant programmatic access. Keep them secret. Shown only once at creation.
                </p>

                {/* New key form */}
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                  <input type="text" placeholder="Key name e.g. 'Webhook Integration'"
                    value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                    style={{ flex:1 }}
                    onKeyDown={e => e.key === "Enter" && generateKey()}
                  />
                  <button onClick={generateKey} style={{
                    padding:"10px 18px", borderRadius:8,
                    background:"linear-gradient(135deg,var(--accent),var(--teal))",
                    border:"none", color:"#060810", fontWeight:700, fontSize:13,
                    cursor:"pointer", fontFamily:"var(--font)", whiteSpace:"nowrap",
                  }}>
                    + Generate
                  </button>
                </div>

                {/* New key reveal */}
                {showNewKey && (
                  <div className="new-key-reveal">
                    <span style={{ fontSize:16 }}>✓</span>
                    <div className="new-key-val">
                      {apiKeys.find(k=>k.id===showNewKey)?.key}
                    </div>
                    <button className="btn-sm" onClick={() => navigator.clipboard?.writeText(apiKeys.find(k=>k.id===showNewKey)?.key || "")}>
                      Copy
                    </button>
                    <p style={{ fontSize:11, color:"var(--green)", whiteSpace:"nowrap" }}>Copy now — won't show again</p>
                  </div>
                )}

                {/* Key list */}
                {apiKeys.map(k => (
                  <div key={k.id} className="key-row" style={{ opacity: k.active ? 1 : 0.5 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span className="key-name">{k.name}</span>
                        {!k.active && <span style={{ fontSize:10, background:"rgba(255,95,126,0.12)", color:"var(--rose)", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>REVOKED</span>}
                      </div>
                      <span className="key-string">{k.key}</span>
                      <div className="key-meta">Created {k.created} · Last used {k.lastUsed}</div>
                      <div style={{ display:"flex", gap:4, marginTop:5 }}>
                        {k.perms.map(p => <span key={p} className="perm-tag">{p}</span>)}
                      </div>
                    </div>
                    {k.active && (
                      <button className="btn-sm danger" onClick={() => revokeKey(k.id)}>Revoke</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Webhooks info card */}
              <div className="card">
                <div className="card-title">🔗 Webhooks</div>
                <p style={{ fontSize:13, color:"var(--c-text2)", lineHeight:1.6, marginBottom:14 }}>
                  Configure endpoints to receive real-time events for school approvals, fee payments, AI alerts, and more.
                </p>
                <button className="btn-sm accent" style={{ padding:"9px 16px", fontSize:13 }}>
                  + Add Webhook Endpoint
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              AUDIT LOG
          ════════════════════════════════════════════ */}
          {tab === "audit" && (
            <div className="settings-page" key="audit">
              <div className="page-head">
                <h2 className="page-head-title">Audit Log</h2>
                <p className="page-head-sub">Every significant action performed by your account is recorded here.</p>
              </div>

              <div className="card">
                <div className="card-title">≡ Recent Activity</div>
                {AUDIT.map(entry => (
                  <div key={entry.id} className="audit-row">
                    <div className="audit-dot" style={{
                      background: entry.level === "error" ? "var(--rose)" : entry.level === "warn" ? "var(--amber)" : "var(--green)"
                    }} />
                    <div style={{ flex:1 }}>
                      <div className="audit-action">{entry.action}</div>
                      <div className="audit-meta">
                        <span>🌐 {entry.ip}</span>
                        <span>💻 {entry.ua}</span>
                        <span>🕐 {entry.time}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4,
                      background: entry.level==="error"?"rgba(255,95,126,0.12)":entry.level==="warn"?"rgba(255,181,71,0.12)":"rgba(61,214,140,0.08)",
                      color: entry.level==="error"?"var(--rose)":entry.level==="warn"?"var(--amber)":"var(--green)",
                    }}>
                      {entry.level.toUpperCase()}
                    </span>
                  </div>
                ))}
                <div style={{ paddingTop:14, textAlign:"center" }}>
                  <button className="btn-sm accent" style={{ fontSize:12.5 }}>Load more →</button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              DANGER ZONE
          ════════════════════════════════════════════ */}
          {tab === "danger" && (
            <div className="settings-page" key="danger">
              <div className="page-head">
                <h2 className="page-head-title" style={{ color:"var(--rose)" }}>Danger Zone</h2>
                <p className="page-head-sub">These actions are irreversible. Proceed with extreme caution.</p>
              </div>

              {[
                {
                  title: "Export All Platform Data",
                  desc:  "Download a full JSON export of all schools, users, applications, and platform settings. This may take a few minutes.",
                  btn:   "Export Data",
                  action: () => alert("Export started — you will receive an email when ready."),
                },
                {
                  title: "Revoke All API Keys",
                  desc:  "Immediately invalidate every active API key on the platform. All integrations will stop working until new keys are issued.",
                  btn:   "Revoke All Keys",
                  action: () => setApiKeys(k => k.map(x => ({ ...x, active: false }))),
                },
                {
                  title: "Enable Read-Only Mode",
                  desc:  "Lock the platform so no data can be created or modified. Super Admin can still read everything. Useful before migrations.",
                  btn:   "Enable Read-Only",
                  action: () => alert("Read-only mode enabled."),
                },
                {
                  title: "Sign Out of All Devices",
                  desc:  "Invalidate all active sessions across every device. You will be logged out immediately after confirmation.",
                  btn:   "Sign Out Everywhere",
                  action: () => logout(),
                },
              ].map(item => (
                <div key={item.title} className="danger-card">
                  <div className="danger-title">{item.title}</div>
                  <div className="danger-desc">{item.desc}</div>
                  <button className="btn-danger" onClick={item.action}>{item.btn}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}