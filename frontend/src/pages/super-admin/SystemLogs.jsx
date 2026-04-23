// src/pages/super-admin/SystemLogs.jsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── Log generators ───────────────────────────────────────────────────────────
const SERVICES = ["auth", "school", "user", "ai", "blockchain", "fee", "notification", "system"];
const LEVELS   = ["INFO", "WARN", "ERROR", "DEBUG"];
const ACTIONS  = {
  auth:         ["LOGIN_SUCCESS","LOGIN_FAILED","TOKEN_REFRESHED","LOGOUT","PASSWORD_CHANGED","2FA_ENABLED","REGISTER"],
  school:       ["SCHOOL_APPROVED","SCHOOL_REJECTED","SCHOOL_CREATED","SCHOOL_UPDATED","SCHOOL_SUSPENDED","PLAN_CHANGED"],
  user:         ["USER_CREATED","USER_DELETED","USER_ROLE_CHANGED","USER_DEACTIVATED","PROFILE_UPDATED"],
  ai:           ["MODEL_RETRAINED","PREDICTION_RUN","DRIFT_DETECTED","MODEL_DEPLOYED","ACCURACY_DROP"],
  blockchain:   ["TX_CONFIRMED","TX_PENDING","CERT_ISSUED","CERT_REVOKED","CONTRACT_DEPLOYED","GAS_SPIKE"],
  fee:          ["PAYMENT_PROCESSED","PAYMENT_FAILED","REFUND_ISSUED","FEE_STRUCTURE_UPDATED"],
  notification: ["EMAIL_SENT","SMS_SENT","EMAIL_FAILED","WEBHOOK_TRIGGERED","DIGEST_SENT"],
  system:       ["SERVER_START","BACKUP_COMPLETE","MAINTENANCE_ON","MAINTENANCE_OFF","CONFIG_CHANGED","RATE_LIMIT_HIT","DB_RECONNECT"],
};
const IPS = ["103.26.14.8","122.18.90.4","45.33.120.8","192.168.1.1","10.0.0.5","203.88.141.22","172.16.0.3"];
const USERS = ["rahul@admin.com","system","priya@admin.com","scheduler","webhook-service","ai-daemon"];

const levelWeight = (a) => { return { ERROR:0, WARN:1, INFO:2, DEBUG:3 }[a.level] - { ERROR:0, WARN:1, INFO:2, DEBUG:3 }[b?.level ?? "INFO"]; };

function makeLogs(count = 200) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const svc    = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const action = ACTIONS[svc][Math.floor(Math.random() * ACTIONS[svc].length)];
    const lvl    = Math.random() < 0.05 ? "ERROR" : Math.random() < 0.12 ? "WARN" : Math.random() < 0.08 ? "DEBUG" : "INFO";
    const ts     = new Date(now - i * (Math.random() * 90_000 + 2_000));
    const ip     = IPS[Math.floor(Math.random() * IPS.length)];
    const user   = USERS[Math.floor(Math.random() * USERS.length)];
    const ms     = Math.floor(Math.random() * 480) + 2;

    const msgMap = {
      LOGIN_SUCCESS:       `User ${user} authenticated successfully`,
      LOGIN_FAILED:        `Authentication failed for ${user} — invalid credentials`,
      TOKEN_REFRESHED:     `JWT access token refreshed for ${user}`,
      LOGOUT:              `Session terminated for ${user}`,
      PASSWORD_CHANGED:    `Password updated for ${user}`,
      SCHOOL_APPROVED:     `School application approved — school_id:${Math.floor(Math.random()*9000)+1000}`,
      SCHOOL_REJECTED:     `School application rejected — reason: incomplete documents`,
      SCHOOL_CREATED:      `New school registered — code:${["DPS2024","KV2025","RPS2024"][Math.floor(Math.random()*3)]}`,
      SCHOOL_SUSPENDED:    `School suspended by admin — school_id:${Math.floor(Math.random()*9000)+1000}`,
      USER_CREATED:        `New user created — role:TEACHER email:${user}`,
      USER_DELETED:        `User account deleted — uid:${Math.random().toString(36).slice(2,10)}`,
      USER_ROLE_CHANGED:   `Role updated STUDENT→TEACHER for uid:${Math.random().toString(36).slice(2,8)}`,
      MODEL_RETRAINED:     `AI model retrained — accuracy:${(Math.random()*8+88).toFixed(1)}%`,
      PREDICTION_RUN:      `${Math.floor(Math.random()*5000)+1000} attendance predictions computed`,
      DRIFT_DETECTED:      `Model drift detected — accuracy dropped to ${(Math.random()*10+72).toFixed(1)}%`,
      ACCURACY_DROP:       `Attendance model accuracy below threshold: ${(Math.random()*8+74).toFixed(1)}%`,
      TX_CONFIRMED:        `Blockchain tx confirmed — hash:0x${Math.random().toString(16).slice(2,10)}`,
      TX_PENDING:          `Transaction pending confirmation — hash:0x${Math.random().toString(16).slice(2,10)}`,
      CERT_ISSUED:         `Digital certificate issued — student_id:${Math.floor(Math.random()*50000)}`,
      PAYMENT_PROCESSED:   `Fee payment processed — ₹${(Math.random()*50000+5000).toFixed(0)}`,
      PAYMENT_FAILED:      `Payment failed — gateway timeout for school_id:${Math.floor(Math.random()*9000)+1000}`,
      EMAIL_SENT:          `Email dispatched to ${user} — subject:School Approval`,
      EMAIL_FAILED:        `Email delivery failed for ${user} — SMTP error 550`,
      WEBHOOK_TRIGGERED:   `Outbound webhook fired — endpoint:https://partner.api/hook`,
      SERVER_START:        `API server started on port 5000 — env:production`,
      BACKUP_COMPLETE:     `MongoDB backup completed — size:${(Math.random()*400+100).toFixed(0)}MB`,
      MAINTENANCE_ON:      `Maintenance mode enabled by ${user}`,
      MAINTENANCE_OFF:     `Maintenance mode disabled by ${user}`,
      RATE_LIMIT_HIT:      `Rate limit exceeded — IP:${ip} endpoint:/api/v1/auth/login`,
      DB_RECONNECT:        `MongoDB reconnected after ${Math.floor(Math.random()*8)+1}s downtime`,
      CONFIG_CHANGED:      `Platform config updated — field:${["maxSchools","defaultPlan","allowRegistrations"][Math.floor(Math.random()*3)]}`,
      GAS_SPIKE:           `Blockchain gas price spike — avg:${(Math.random()*2+1.5).toFixed(2)} Gwei`,
    };

    return {
      id:      `log_${(now - i * 1000).toString(36)}`,
      ts,
      tsStr:   ts.toISOString(),
      level:   lvl,
      service: svc,
      action,
      message: msgMap[action] || `${action} executed`,
      ip,
      user,
      ms,
      traceId: Math.random().toString(36).slice(2, 14).toUpperCase(),
    };
  }).sort((a, b) => b.ts - a.ts);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVEL_META = {
  INFO:  { color: "#5b8cff", bg: "rgba(91,140,255,0.10)",  dot: "#5b8cff"  },
  WARN:  { color: "#ffb547", bg: "rgba(255,181,71,0.10)",  dot: "#ffb547"  },
  ERROR: { color: "#ff5f7e", bg: "rgba(255,95,126,0.10)",  dot: "#ff5f7e"  },
  DEBUG: { color: "#8b93b0", bg: "rgba(139,147,176,0.08)", dot: "#8b93b0"  },
};
const SVC_COLOR = {
  auth:         "#5b8cff", school:  "#38d9c0", user:  "#a78bfa",
  ai:           "#fbbf24", blockchain:"#34d399",fee:  "#fb923c",
  notification: "#f472b6", system:  "#94a3b8",
};
const PAGE_SIZE = 50;

// ─── Relative time ────────────────────────────────────────────────────────────
function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function fmtTime(ts) {
  return ts.toLocaleTimeString("en-IN", { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" });
}
function fmtDate(ts) {
  return ts.toLocaleDateString("en-IN", { month:"short", day:"numeric" });
}

// ══════════════════════════════════════════════════════════════════════════════
export default function SystemLogs() {
  const [allLogs]     = useState(() => makeLogs(300));
  const [search,      setSearch     ] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [svcFilter,   setSvcFilter  ] = useState("ALL");
  const [page,        setPage       ] = useState(1);
  const [selected,    setSelected   ] = useState(null);   // detail drawer
  const [streaming,   setStreaming   ] = useState(false);
  const [liveLogs,    setLiveLogs   ] = useState([]);
  const [loaded,      setLoaded     ] = useState(false);
  const [copied,      setCopied     ] = useState(false);
  const [autoScroll,  setAutoScroll ] = useState(true);
  const [timeMode,    setTimeMode   ] = useState("relative"); // relative | absolute
  const [expandedIds, setExpandedIds] = useState(new Set());

  const liveIntervalRef = useRef(null);
  const tableRef        = useRef(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  // ── Live stream ──────────────────────────────────────────────────────────────
  const startStream = useCallback(() => {
    setStreaming(true);
    liveIntervalRef.current = setInterval(() => {
      const fresh = makeLogs(1)[0];
      setLiveLogs(p => [fresh, ...p].slice(0, 50));
    }, 1400);
  }, []);

  const stopStream = useCallback(() => {
    setStreaming(false);
    clearInterval(liveIntervalRef.current);
  }, []);

  useEffect(() => () => clearInterval(liveIntervalRef.current), []);

  // Auto-scroll live feed
  useEffect(() => {
    if (autoScroll && streaming && tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [liveLogs, autoScroll, streaming]);

  // ── Filter + search ──────────────────────────────────────────────────────────
  const displayLogs = useMemo(() => {
    const base = streaming ? [...liveLogs, ...allLogs] : allLogs;
    return base.filter(l => {
      if (levelFilter !== "ALL" && l.level   !== levelFilter) return false;
      if (svcFilter   !== "ALL" && l.service !== svcFilter)   return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!l.message.toLowerCase().includes(q) &&
            !l.action.toLowerCase().includes(q)  &&
            !l.service.toLowerCase().includes(q) &&
            !l.ip.includes(q) &&
            !l.traceId.toLowerCase().includes(q) &&
            !l.user.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allLogs, liveLogs, streaming, levelFilter, svcFilter, search]);

  const totalPages = Math.ceil(displayLogs.length / PAGE_SIZE);
  const pageLogs   = displayLogs.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:  displayLogs.length,
    errors: displayLogs.filter(l => l.level === "ERROR").length,
    warns:  displayLogs.filter(l => l.level === "WARN").length,
    infos:  displayLogs.filter(l => l.level === "INFO").length,
    debugs: displayLogs.filter(l => l.level === "DEBUG").length,
  }), [displayLogs]);

  const copyLog = (log) => {
    const text = `[${log.tsStr}] [${log.level}] [${log.service}] ${log.action} — ${log.message}\nIP: ${log.ip} | User: ${log.user} | Trace: ${log.traceId} | ${log.ms}ms`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportLogs = () => {
    const data = displayLogs.map(l => ({
      timestamp: l.tsStr, level: l.level, service: l.service,
      action: l.action, message: l.message, ip: l.ip,
      user: l.user, traceId: l.traceId, responseMs: l.ms,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `system-logs-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id) => {
    setExpandedIds(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #060810;
          --surf:    #0c0f1a;
          --raised:  #111520;
          --hover:   #181d2e;
          --active:  #1e2540;
          --bdr:     rgba(255,255,255,0.06);
          --bdr-md:  rgba(255,255,255,0.10);
          --t1:      #eef0f8;
          --t2:      #8b93b0;
          --t3:      #4a5168;
          --accent:  #5b8cff;
          --teal:    #38d9c0;
          --rose:    #ff5f7e;
          --amber:   #ffb547;
          --green:   #3dd68c;
          --font:    'Outfit', sans-serif;
          --mono:    'DM Mono', monospace;
        }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }
        @keyframes rowIn    { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(255,95,126,0.4)} 50%{box-shadow:0 0 0 5px rgba(255,95,126,0)} }

        html,body { background:var(--bg); color:var(--t1); font-family:var(--font); }

        /* ── Root ── */
        .sl-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 100vh;
          opacity: 0;
          transition: opacity .3s;
        }
        .sl-root.vis { opacity: 1; }

        /* ── Top bar ── */
        .sl-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px 18px;
          flex-wrap: wrap;
          gap: 14px;
          animation: fadeUp .35s ease;
        }
        .sl-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--t1);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sl-title-icon {
          width: 36px; height: 36px;
          border-radius: 9px;
          background: linear-gradient(135deg,var(--raised),var(--active));
          border: 1px solid var(--bdr-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .sl-sub { font-size: 13px; color: var(--t2); margin-top: 3px; }

        /* ── Action buttons ── */
        .sl-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 14px; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer; border: 1px solid var(--bdr);
          background: var(--raised); color: var(--t2);
          font-family: var(--font); transition: all .15s; white-space: nowrap;
        }
        .btn:hover { background: var(--hover); color: var(--t1); }
        .btn.primary {
          background: linear-gradient(135deg,var(--accent),var(--teal));
          color: #060810; border-color: transparent;
        }
        .btn.primary:hover { filter: brightness(1.08); }
        .btn.live {
          background: rgba(255,95,126,0.12);
          border-color: rgba(255,95,126,0.25);
          color: var(--rose);
        }
        .btn.live:hover { background: rgba(255,95,126,0.2); }
        .btn.live.on {
          background: var(--rose);
          color: #fff;
          animation: pulse 2s infinite;
        }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: currentColor;
          animation: blink 1s infinite;
        }

        /* ── Stat strip ── */
        .sl-stats {
          display: flex;
          gap: 10px;
          padding: 0 28px 18px;
          flex-wrap: wrap;
          animation: fadeUp .4s ease .05s both;
        }
        .stat-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px;
          background: var(--surf);
          border: 1px solid var(--bdr);
          border-radius: 8px;
          font-size: 13px;
          transition: border-color .15s;
          cursor: pointer;
        }
        .stat-pill:hover { border-color: var(--bdr-md); }
        .stat-pill.active { border-color: rgba(91,140,255,.3); background: rgba(91,140,255,.07); }
        .stat-count { font-weight: 700; font-family: var(--mono); font-size: 14px; }
        .stat-label { color: var(--t2); font-size: 12px; }

        /* ── Filter bar ── */
        .sl-filters {
          display: flex;
          gap: 8px;
          padding: 0 28px 16px;
          flex-wrap: wrap;
          align-items: center;
          animation: fadeUp .4s ease .08s both;
        }
        .search-wrap {
          position: relative;
          flex: 1; min-width: 220px; max-width: 380px;
        }
        .search-icon {
          position: absolute; left: 11px; top: 50%;
          transform: translateY(-50%);
          color: var(--t3); pointer-events: none; font-size: 14px;
        }
        .search-inp {
          width: 100%;
          background: var(--surf);
          border: 1px solid var(--bdr);
          border-radius: 8px;
          padding: 8px 12px 8px 34px;
          color: var(--t1); font-size: 13px;
          font-family: var(--font); outline: none;
          transition: border-color .18s;
        }
        .search-inp:focus { border-color: rgba(91,140,255,.4); }
        .search-inp::placeholder { color: var(--t3); }

        .filter-sel {
          background: var(--surf);
          border: 1px solid var(--bdr);
          border-radius: 8px;
          padding: 8px 28px 8px 11px;
          color: var(--t2); font-size: 13px;
          font-family: var(--font); outline: none; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          transition: border-color .18s;
        }
        .filter-sel:focus { border-color: rgba(91,140,255,.4); }

        .time-toggle {
          display: flex;
          background: var(--surf);
          border: 1px solid var(--bdr);
          border-radius: 8px;
          overflow: hidden;
        }
        .tt-btn {
          padding: 7px 12px; font-size: 11.5px; font-weight: 600;
          cursor: pointer; color: var(--t3); border: none;
          background: none; font-family: var(--font); transition: all .15s;
        }
        .tt-btn.active { background: var(--active); color: var(--t1); }

        .filter-count {
          font-size: 12px; color: var(--t3); padding: 0 4px;
          white-space: nowrap; font-family: var(--mono);
        }

        /* ── Log table ── */
        .sl-table-wrap {
          flex: 1;
          overflow: hidden;
          margin: 0 28px;
          border: 1px solid var(--bdr);
          border-radius: 12px;
          background: var(--surf);
          animation: fadeUp .4s ease .12s both;
          display: flex;
          flex-direction: column;
        }
        .sl-table-head {
          display: grid;
          grid-template-columns: 90px 60px 90px 120px 1fr 100px 60px 36px;
          gap: 0;
          padding: 0 14px;
          border-bottom: 1px solid var(--bdr);
          background: var(--raised);
          border-radius: 12px 12px 0 0;
          flex-shrink: 0;
        }
        .th {
          padding: 10px 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .9px;
          text-transform: uppercase;
          color: var(--t3);
          white-space: nowrap;
          overflow: hidden;
        }
        .sl-table-body {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--bdr-md) transparent;
        }
        .sl-table-body::-webkit-scrollbar { width: 5px; }
        .sl-table-body::-webkit-scrollbar-thumb { background: var(--bdr-md); border-radius: 3px; }

        /* ── Log row ── */
        .log-row {
          display: grid;
          grid-template-columns: 90px 60px 90px 120px 1fr 100px 60px 36px;
          gap: 0;
          padding: 0 14px;
          border-bottom: 1px solid rgba(255,255,255,.03);
          cursor: pointer;
          transition: background .1s;
          animation: rowIn .25s ease both;
          position: relative;
        }
        .log-row:hover { background: var(--hover); }
        .log-row.selected { background: var(--active); }
        .log-row.live-new { border-left: 2px solid var(--accent); }

        .log-row::before {
          content: "";
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          opacity: 0;
          transition: opacity .15s;
        }
        .log-row:hover::before, .log-row.selected::before { opacity: 1; }

        .log-row.error::before  { background: var(--rose);  }
        .log-row.warn::before   { background: var(--amber); }
        .log-row.info::before   { background: var(--accent);}
        .log-row.debug::before  { background: var(--t3);    }

        .td {
          padding: 9px 6px;
          font-size: 12px;
          color: var(--t2);
          display: flex;
          align-items: center;
          overflow: hidden;
          white-space: nowrap;
        }
        .td-time {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--t3);
          flex-direction: column;
          align-items: flex-start;
          gap: 1px;
        }
        .td-time-main { color: var(--t2); font-size: 11.5px; }
        .td-time-date { color: var(--t3); font-size: 10px; }

        /* Level badge */
        .level-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 7px; border-radius: 4px;
          font-size: 10px; font-weight: 700;
          font-family: var(--mono); letter-spacing: .3px;
        }
        .level-dot { width: 5px; height: 5px; border-radius: 50%; }

        /* Service badge */
        .svc-badge {
          padding: 2px 8px; border-radius: 20px;
          font-size: 10.5px; font-weight: 600;
          letter-spacing: .2px;
        }

        /* Message cell */
        .td-msg {
          font-size: 12.5px;
          color: var(--t1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .td-action {
          font-family: var(--mono);
          font-size: 10.5px;
          color: var(--t3);
          display: block;
          margin-top: 1px;
        }
        .td-msg-wrap { display: flex; flex-direction: column; justify-content: center; overflow: hidden; }

        /* MS badge */
        .ms-badge {
          font-family: var(--mono);
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* Copy btn */
        .copy-btn {
          width: 26px; height: 26px; border-radius: 6px;
          background: none; border: none; cursor: pointer;
          color: var(--t3); display: flex; align-items: center;
          justify-content: center; font-size: 13px;
          transition: all .15s; opacity: 0;
        }
        .log-row:hover .copy-btn { opacity: 1; }
        .copy-btn:hover { background: var(--active); color: var(--t1); }

        /* ── Expanded row ── */
        .log-expand {
          padding: 12px 14px 14px 46px;
          background: rgba(17,21,32,0.8);
          border-bottom: 1px solid rgba(255,255,255,.04);
          animation: fadeUp .2s ease;
        }
        .expand-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px,1fr));
          gap: 10px 24px;
          margin-bottom: 10px;
        }
        .expand-item { display: flex; flex-direction: column; gap: 2px; }
        .expand-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; color: var(--t3); }
        .expand-val   { font-size: 12.5px; color: var(--t1); font-family: var(--mono); }
        .expand-msg {
          background: var(--raised);
          border: 1px solid var(--bdr);
          border-radius: 7px;
          padding: 10px 13px;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--t2);
          line-height: 1.6;
          word-break: break-all;
        }

        /* ── Pagination ── */
        .sl-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 28px 20px;
          flex-wrap: wrap;
          gap: 10px;
          animation: fadeUp .4s ease .15s both;
        }
        .pg-info { font-size: 12px; color: var(--t3); font-family: var(--mono); }
        .pg-btns { display: flex; gap: 5px; }
        .pg-btn {
          width: 30px; height: 30px; border-radius: 7px;
          background: var(--surf); border: 1px solid var(--bdr);
          font-size: 12px; color: var(--t2); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--mono); transition: all .15s;
        }
        .pg-btn:hover:not(:disabled) { background: var(--hover); color: var(--t1); }
        .pg-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
        .pg-btn:disabled { opacity: .3; cursor: default; }

        /* ── Detail drawer ── */
        .sl-drawer {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: 420px;
          background: var(--surf);
          border-left: 1px solid var(--bdr-md);
          z-index: 100;
          display: flex;
          flex-direction: column;
          box-shadow: -20px 0 60px rgba(0,0,0,0.4);
          animation: slideIn .2s ease;
        }
        .drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--bdr);
          flex-shrink: 0;
        }
        .drawer-title { font-size: 14px; font-weight: 700; color: var(--t1); }
        .drawer-close {
          width: 28px; height: 28px; border-radius: 7px;
          background: none; border: 1px solid var(--bdr);
          cursor: pointer; color: var(--t2); font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .drawer-close:hover { background: var(--hover); color: var(--t1); }
        .drawer-body { flex: 1; overflow-y: auto; padding: 20px; scrollbar-width: thin; scrollbar-color: var(--bdr-md) transparent; }
        .drawer-section { margin-bottom: 20px; }
        .drawer-section-title {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: var(--t3); margin-bottom: 10px;
        }
        .drawer-kv {
          display: flex; flex-direction: column; gap: 8px;
        }
        .drawer-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 12px; padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,.04);
        }
        .drawer-row:last-child { border-bottom: none; }
        .drawer-key { font-size: 12px; color: var(--t3); flex-shrink: 0; width: 100px; }
        .drawer-val { font-size: 12.5px; color: var(--t1); font-family: var(--mono); text-align: right; word-break: break-all; }
        .drawer-msg-box {
          background: var(--raised); border: 1px solid var(--bdr);
          border-radius: 8px; padding: 12px 14px;
          font-family: var(--mono); font-size: 12px; color: var(--t2);
          line-height: 1.7; word-break: break-all;
        }
        .drawer-copy {
          width: 100%; margin-top: 14px;
          padding: 9px 0; border-radius: 8px;
          background: var(--accent-dim, rgba(91,140,255,.12));
          border: 1px solid rgba(91,140,255,.2);
          color: var(--accent); font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: var(--font);
          transition: all .15s;
        }
        .drawer-copy:hover { background: rgba(91,140,255,.2); }

        /* ── Empty state ── */
        .empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 20px; gap: 12px;
        }
        .empty-icon { font-size: 36px; opacity: 0.3; }
        .empty-text { font-size: 14px; color: var(--t3); }

        /* ── Live indicator ── */
        .live-indicator {
          display: flex; align-items: center; gap: 7px;
          padding: 5px 12px;
          background: rgba(255,95,126,0.1);
          border: 1px solid rgba(255,95,126,0.2);
          border-radius: 20px;
          font-size: 11.5px; font-weight: 600; color: var(--rose);
        }

        @media (max-width:1100px) {
          .sl-table-head, .log-row { grid-template-columns: 80px 60px 80px 1fr 80px 36px; }
          .th:nth-child(6), .td:nth-child(6) { display: none; } /* hide user */
        }
        @media (max-width:800px) {
          .sl-topbar, .sl-stats, .sl-filters, .sl-pagination { padding-left:16px; padding-right:16px; }
          .sl-table-wrap { margin:0 16px; }
          .sl-table-head, .log-row { grid-template-columns: 70px 55px 1fr 36px; }
          .th:nth-child(3),.th:nth-child(4),.th:nth-child(6),.th:nth-child(7),
          .td:nth-child(3),.td:nth-child(4),.td:nth-child(6),.td:nth-child(7) { display:none; }
          .sl-drawer { width:100%; }
        }
      `}</style>

      <div className={`sl-root${loaded ? " vis" : ""}`}>

        {/* ── Topbar ── */}
        <div className="sl-topbar">
          <div>
            <div className="sl-title">
              <div className="sl-title-icon">≡</div>
              System Logs
              {streaming && (
                <div className="live-indicator">
                  <span style={{ width:7,height:7,borderRadius:"50%",background:"var(--rose)",display:"inline-block",animation:"blink 1s infinite" }} />
                  LIVE
                </div>
              )}
            </div>
            <p className="sl-sub">Real-time platform event stream — {stats.total.toLocaleString()} entries</p>
          </div>
          <div className="sl-actions">
            <button
              className={`btn live${streaming ? " on" : ""}`}
              onClick={() => streaming ? stopStream() : startStream()}
            >
              {streaming ? (
                <><span className="live-dot" />Stop Stream</>
              ) : (
                <><span style={{fontSize:14}}>▶</span>Live Stream</>
              )}
            </button>
            <button className="btn" onClick={exportLogs}>
              <span>↓</span> Export JSON
            </button>
            <button className="btn" onClick={() => { setSearch(""); setLevelFilter("ALL"); setSvcFilter("ALL"); setPage(1); }}>
              Reset Filters
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="sl-stats">
          {[
            { key:"ALL",   label:"Total",  count:stats.total,  color:"var(--t2)"    },
            { key:"ERROR", label:"Errors", count:stats.errors, color:"var(--rose)"  },
            { key:"WARN",  label:"Warns",  count:stats.warns,  color:"var(--amber)" },
            { key:"INFO",  label:"Info",   count:stats.infos,  color:"var(--accent)"},
            { key:"DEBUG", label:"Debug",  count:stats.debugs, color:"var(--t3)"    },
          ].map(s => (
            <div
              key={s.key}
              className={`stat-pill${levelFilter === s.key ? " active" : ""}`}
              onClick={() => { setLevelFilter(s.key); setPage(1); }}
            >
              <span className="stat-count" style={{ color: s.color }}>{s.count.toLocaleString()}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="sl-filters">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-inp"
              placeholder="Search message, action, IP, trace ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select className="filter-sel" value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select className="filter-sel" value={svcFilter} onChange={e => { setSvcFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Services</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="time-toggle">
            <button className={`tt-btn${timeMode==="relative"?" active":""}`} onClick={()=>setTimeMode("relative")}>Relative</button>
            <button className={`tt-btn${timeMode==="absolute"?" active":""}`} onClick={()=>setTimeMode("absolute")}>Absolute</button>
          </div>

          {streaming && (
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--t2)", cursor:"pointer" }}>
              <input type="checkbox" checked={autoScroll} onChange={e=>setAutoScroll(e.target.checked)}
                style={{ accentColor:"var(--accent)", cursor:"pointer" }} />
              Auto-scroll
            </label>
          )}

          <span className="filter-count">{displayLogs.length.toLocaleString()} results</span>
        </div>

        {/* ── Table ── */}
        <div className="sl-table-wrap">
          {/* Header */}
          <div className="sl-table-head">
            <div className="th">Time</div>
            <div className="th">Level</div>
            <div className="th">Service</div>
            <div className="th">Action</div>
            <div className="th">Message</div>
            <div className="th">User</div>
            <div className="th">ms</div>
            <div className="th"></div>
          </div>

          {/* Body */}
          <div className="sl-table-body" ref={tableRef}>
            {pageLogs.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">≡</span>
                <span className="empty-text">No logs match your filters</span>
              </div>
            ) : pageLogs.map((log, i) => {
              const lm       = LEVEL_META[log.level];
              const svcColor = SVC_COLOR[log.service];
              const isExp    = expandedIds.has(log.id);
              const isSel    = selected?.id === log.id;
              const msColor  = log.ms > 300 ? "var(--rose)" : log.ms > 150 ? "var(--amber)" : "var(--green)";

              return (
                <div key={log.id}>
                  <div
                    className={`log-row ${log.level.toLowerCase()}${isSel ? " selected" : ""}${i < liveLogs.length && streaming ? " live-new" : ""}`}
                    style={{ animationDelay: `${Math.min(i * 0.012, 0.3)}s` }}
                    onClick={() => { setSelected(isSel ? null : log); }}
                  >
                    {/* Time */}
                    <div className="td td-time">
                      <span className="td-time-main">
                        {timeMode === "relative" ? relTime(log.ts) : fmtTime(log.ts)}
                      </span>
                      {timeMode === "relative" && <span className="td-time-date">{fmtDate(log.ts)}</span>}
                    </div>

                    {/* Level */}
                    <div className="td">
                      <span className="level-badge" style={{ background: lm.bg, color: lm.color }}>
                        <span className="level-dot" style={{ background: lm.dot }} />
                        {log.level}
                      </span>
                    </div>

                    {/* Service */}
                    <div className="td">
                      <span className="svc-badge" style={{ background: svcColor+"18", color: svcColor }}>
                        {log.service}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="td">
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--t2)", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {log.action}
                      </span>
                    </div>

                    {/* Message */}
                    <div className="td">
                      <div className="td-msg-wrap">
                        <span className="td-msg">{log.message}</span>
                      </div>
                    </div>

                    {/* User */}
                    <div className="td">
                      <span style={{ fontSize:11.5, color:"var(--t3)", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {log.user}
                      </span>
                    </div>

                    {/* MS */}
                    <div className="td">
                      <span className="ms-badge" style={{ color: msColor, background: msColor+"18" }}>
                        {log.ms}ms
                      </span>
                    </div>

                    {/* Copy */}
                    <div className="td" style={{ justifyContent:"center" }} onClick={e => { e.stopPropagation(); copyLog(log); }}>
                      <button className="copy-btn" title="Copy log">
                        {copied ? "✓" : "⎘"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded inline detail */}
                  {isExp && (
                    <div className="log-expand">
                      <div className="expand-grid">
                        {[
                          ["Trace ID",  log.traceId ],
                          ["IP",        log.ip      ],
                          ["User",      log.user    ],
                          ["Response",  `${log.ms}ms`],
                          ["Timestamp", log.tsStr   ],
                        ].map(([k,v]) => (
                          <div key={k} className="expand-item">
                            <span className="expand-label">{k}</span>
                            <span className="expand-val">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="expand-msg">{log.message}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Pagination ── */}
        <div className="sl-pagination">
          <span className="pg-info">
            {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, displayLogs.length)} of {displayLogs.length.toLocaleString()} logs
          </span>
          <div className="pg-btns">
            <button className="pg-btn" disabled={page===1} onClick={()=>setPage(1)}>«</button>
            <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
            {Array.from({length: Math.min(totalPages,7)}, (_,i) => {
              let p;
              if (totalPages <= 7) { p = i+1; }
              else if (page <= 4) { p = i+1; }
              else if (page >= totalPages-3) { p = totalPages-6+i; }
              else { p = page-3+i; }
              return (
                <button key={p} className={`pg-btn${page===p?" active":""}`} onClick={()=>setPage(p)}>{p}</button>
              );
            })}
            <button className="pg-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
            <button className="pg-btn" disabled={page===totalPages} onClick={()=>setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {selected && (
        <>
          <div style={{ position:"fixed",inset:0,zIndex:99 }} onClick={()=>setSelected(null)} />
          <div className="sl-drawer">
            <div className="drawer-head">
              <div>
                <div className="drawer-title">Log Detail</div>
                <div style={{ fontSize:11, color:"var(--t3)", fontFamily:"var(--mono)", marginTop:2 }}>
                  {selected.traceId}
                </div>
              </div>
              <button className="drawer-close" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="drawer-body">

              {/* Level + service header */}
              <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                <span className="level-badge" style={{ background: LEVEL_META[selected.level].bg, color: LEVEL_META[selected.level].color, padding:"4px 10px", fontSize:12 }}>
                  <span className="level-dot" style={{ background: LEVEL_META[selected.level].dot }} />
                  {selected.level}
                </span>
                <span className="svc-badge" style={{ background: SVC_COLOR[selected.service]+"18", color: SVC_COLOR[selected.service], padding:"4px 10px", fontSize:12 }}>
                  {selected.service}
                </span>
                <span style={{ fontFamily:"var(--mono)", fontSize:11, background:"var(--raised)", padding:"4px 8px", borderRadius:4, color:"var(--t3)" }}>
                  {selected.ms}ms
                </span>
              </div>

              {/* Message */}
              <div className="drawer-section">
                <div className="drawer-section-title">Message</div>
                <div className="drawer-msg-box">{selected.message}</div>
              </div>

              {/* Details */}
              <div className="drawer-section">
                <div className="drawer-section-title">Details</div>
                <div className="drawer-kv">
                  {[
                    ["Action",    selected.action    ],
                    ["Trace ID",  selected.traceId   ],
                    ["Timestamp", selected.tsStr      ],
                    ["IP Address",selected.ip         ],
                    ["User",      selected.user       ],
                    ["Response",  `${selected.ms}ms` ],
                    ["Service",   selected.service    ],
                    ["Level",     selected.level      ],
                  ].map(([k,v]) => (
                    <div key={k} className="drawer-row">
                      <span className="drawer-key">{k}</span>
                      <span className="drawer-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stack trace placeholder */}
              <div className="drawer-section">
                <div className="drawer-section-title">Raw Payload</div>
                <div className="drawer-msg-box" style={{ fontSize:11, lineHeight:1.8 }}>
                  {`{\n  "level": "${selected.level}",\n  "service": "${selected.service}",\n  "action": "${selected.action}",\n  "message": "${selected.message}",\n  "ip": "${selected.ip}",\n  "user": "${selected.user}",\n  "traceId": "${selected.traceId}",\n  "responseMs": ${selected.ms},\n  "timestamp": "${selected.tsStr}"\n}`}
                </div>
              </div>

              <button className="drawer-copy" onClick={() => copyLog(selected)}>
                {copied ? "✓ Copied to clipboard" : "⎘ Copy log entry"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}