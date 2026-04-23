import { useState, useMemo } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1,  name: "Arjun Sharma",    email: "arjun@greenwood.edu",   role: "SCHOOL_ADMIN", school: "Greenwood High",    status: "active",   joined: "2024-01-15", avatar: "AS", lastLogin: "2 hours ago" },
  { id: 2,  name: "Priya Mehta",     email: "priya@sunflower.edu",   role: "TEACHER",      school: "Sunflower Academy", status: "active",   joined: "2024-02-20", avatar: "PM", lastLogin: "1 day ago" },
  { id: 3,  name: "Rahul Verma",     email: "rahul@bluebell.edu",    role: "STUDENT",      school: "Bluebell School",   status: "inactive", joined: "2024-03-05", avatar: "RV", lastLogin: "5 days ago" },
  { id: 4,  name: "Sneha Patel",     email: "sneha@greenwood.edu",   role: "PARENT",       school: "Greenwood High",    status: "active",   joined: "2024-01-28", avatar: "SP", lastLogin: "3 hours ago" },
  { id: 5,  name: "Kiran Nair",      email: "kiran@sunflower.edu",   role: "TEACHER",      school: "Sunflower Academy", status: "active",   joined: "2024-02-14", avatar: "KN", lastLogin: "30 mins ago" },
  { id: 6,  name: "Amit Gupta",      email: "amit@bluebell.edu",     role: "SCHOOL_ADMIN", school: "Bluebell School",   status: "suspended",joined: "2023-11-10", avatar: "AG", lastLogin: "2 weeks ago" },
  { id: 7,  name: "Divya Reddy",     email: "divya@riverside.edu",   role: "STUDENT",      school: "Riverside School",  status: "active",   joined: "2024-04-01", avatar: "DR", lastLogin: "1 hour ago" },
  { id: 8,  name: "Suresh Kumar",    email: "suresh@horizon.edu",    role: "VENDOR",       school: "—",                 status: "active",   joined: "2024-01-05", avatar: "SK", lastLogin: "4 hours ago" },
  { id: 9,  name: "Anita Joshi",     email: "anita@greenwood.edu",   role: "TEACHER",      school: "Greenwood High",    status: "active",   joined: "2024-03-18", avatar: "AJ", lastLogin: "12 hours ago" },
  { id: 10, name: "Vikram Singh",    email: "vikram@bluebell.edu",   role: "PARENT",       school: "Bluebell School",   status: "inactive", joined: "2024-02-02", avatar: "VS", lastLogin: "3 days ago" },
  { id: 11, name: "Meera Pillai",    email: "meera@sunflower.edu",   role: "STUDENT",      school: "Sunflower Academy", status: "active",   joined: "2024-04-15", avatar: "MP", lastLogin: "6 hours ago" },
  { id: 12, name: "Ravi Desai",      email: "ravi@bookmart.com",     role: "VENDOR",       school: "—",                 status: "active",   joined: "2023-12-20", avatar: "RD", lastLogin: "2 days ago" },
];

const ROLE_CONFIG = {
  SUPER_ADMIN:  { label: "Super Admin",  bg: "#1e1b4b", text: "#a5b4fc" },
  SCHOOL_ADMIN: { label: "School Admin", bg: "#1e3a5f", text: "#60a5fa" },
  TEACHER:      { label: "Teacher",      bg: "#14532d", text: "#4ade80" },
  STUDENT:      { label: "Student",      bg: "#451a03", text: "#fb923c" },
  PARENT:       { label: "Parent",       bg: "#4a1942", text: "#f0abfc" },
  VENDOR:       { label: "Vendor",       bg: "#422006", text: "#fbbf24" },
};

const STATUS_CONFIG = {
  active:    { label: "Active",    dot: "#22c55e", bg: "#14532d22", text: "#4ade80" },
  inactive:  { label: "Inactive",  dot: "#94a3b8", bg: "#94a3b822", text: "#94a3b8" },
  suspended: { label: "Suspended", dot: "#ef4444", bg: "#ef444422", text: "#f87171" },
};

const AVATAR_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#06b6d4"
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const c = ROLE_CONFIG[role] || ROLE_CONFIG.STUDENT;
  return (
    <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.03em" }}>
      {c.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, width: "fit-content" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function Avatar({ initials, index }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: AVATAR_COLORS[index % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, change, color, icon }) {
  return (
    <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ color: "#64748b", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
        <p style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</p>
        <p style={{ color: change > 0 ? "#4ade80" : "#f87171", fontSize: 12, marginTop: 6 }}>
          {change > 0 ? "▲" : "▼"} {Math.abs(change)}% this month
        </p>
      </div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
        {icon}
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || { name: "", email: "", role: "TEACHER", school: "", status: "active" });
  const isEdit = !!user?.id;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000080", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0f172a", border: "1px solid #1e2d45", borderRadius: 18, width: 480, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700 }}>{isEdit ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {[
          { label: "Full Name", key: "name", type: "text", placeholder: "e.g. Arjun Sharma" },
          { label: "Email Address", key: "email", type: "email", placeholder: "e.g. arjun@school.edu" },
          { label: "School", key: "school", type: "text", placeholder: "e.g. Greenwood High" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{ width: "100%", background: "#131929", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Role", key: "role", options: Object.keys(ROLE_CONFIG).map(r => ({ value: r, label: ROLE_CONFIG[r].label })) },
            { label: "Status", key: "status", options: Object.keys(STATUS_CONFIG).map(s => ({ value: s, label: STATUS_CONFIG[s].label })) },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
              <select
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", background: "#131929", border: "1px solid #1e2d45", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 14, outline: "none" }}
              >
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#1e2d45", border: "none", borderRadius: 8, color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {isEdit ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManageUsers() {
  const [users, setUsers]         = useState(MOCK_USERS);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRole]     = useState("ALL");
  const [statusFilter, setStatus] = useState("ALL");
  const [selected, setSelected]   = useState([]);
  const [modal, setModal]         = useState(null); // null | "add" | {user}
  const [page, setPage]           = useState(1);
  const [sortKey, setSortKey]     = useState("name");
  const [sortDir, setSortDir]     = useState("asc");
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    let arr = [...users];
    if (search)            arr = arr.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter !== "ALL")   arr = arr.filter(u => u.role === roleFilter);
    if (statusFilter !== "ALL") arr = arr.filter(u => u.status === statusFilter);
    arr.sort((a, b) => {
      const v = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
      return sortDir === "asc" ? v : -v;
    });
    return arr;
  }, [users, search, roleFilter, statusFilter, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll    = () => setSelected(p => p.length === paginated.length ? [] : paginated.map(u => u.id));

  const handleDelete = (id) => setUsers(p => p.filter(u => u.id !== id));
  const handleBulkDelete = () => { setUsers(p => p.filter(u => !selected.includes(u.id))); setSelected([]); };

  const handleSave = (form) => {
    if (form.id) {
      setUsers(p => p.map(u => u.id === form.id ? { ...u, ...form } : u));
    } else {
      setUsers(p => [...p, { ...form, id: Date.now(), joined: new Date().toISOString().slice(0,10), avatar: form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(), lastLogin: "Just now" }]);
    }
    setModal(null);
  };

  const SortIcon = ({ k }) => sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  const stats = {
    total:    users.length,
    active:   users.filter(u => u.status === "active").length,
    teachers: users.filter(u => u.role === "TEACHER").length,
    students: users.filter(u => u.role === "STUDENT").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", padding: "28px 32px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 800, margin: 0 }}>Manage Users</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Oversee all platform users across every school and role</p>
        </div>
        <button
          onClick={() => setModal("add")}
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", borderRadius: 10, padding: "11px 22px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add User
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Users"    value={stats.total}    change={8.2}  color="#3b82f6" icon="👥" />
        <StatCard label="Active"         value={stats.active}   change={5.1}  color="#22c55e" icon="✅" />
        <StatCard label="Teachers"       value={stats.teachers} change={3.4}  color="#8b5cf6" icon="📚" />
        <StatCard label="Students"       value={stats.students} change={12.7} color="#f59e0b" icon="🎓" />
      </div>

      {/* Filters Row */}
      <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 15 }}>🔍</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d45", borderRadius: 8, padding: "9px 12px 9px 36px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          style={{ background: "#0a0f1e", border: "1px solid #1e2d45", borderRadius: 8, padding: "9px 14px", color: "#f1f5f9", fontSize: 14, outline: "none" }}
        >
          <option value="ALL">All Roles</option>
          {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ background: "#0a0f1e", border: "1px solid #1e2d45", borderRadius: 8, padding: "9px 14px", color: "#f1f5f9", fontSize: 14, outline: "none" }}
        >
          <option value="ALL">All Status</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>

        {selected.length > 0 && (
          <button
            onClick={handleBulkDelete}
            style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "9px 16px", color: "#f87171", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            🗑 Delete ({selected.length})
          </button>
        )}

        <span style={{ color: "#64748b", fontSize: 13, marginLeft: "auto" }}>{filtered.length} users found</span>
      </div>

      {/* Table */}
      <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e2d45" }}>
              <th style={{ padding: "14px 20px", textAlign: "left", width: 40 }}>
                <input
                  type="checkbox"
                  checked={selected.length === paginated.length && paginated.length > 0}
                  onChange={toggleAll}
                  style={{ accentColor: "#3b82f6", cursor: "pointer" }}
                />
              </th>
              {[
                { label: "User",       key: "name" },
                { label: "Role",       key: "role" },
                { label: "School",     key: "school" },
                { label: "Status",     key: "status" },
                { label: "Joined",     key: "joined" },
                { label: "Last Login", key: "lastLogin" },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{ padding: "14px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                >
                  {col.label}<SortIcon k={col.key} />
                </th>
              ))}
              <th style={{ padding: "14px 16px", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((user, i) => (
              <tr
                key={user.id}
                style={{ borderBottom: "1px solid #0f172a", background: selected.includes(user.id) ? "#1e2d4540" : "transparent", transition: "background 0.15s" }}
                onMouseEnter={e => { if (!selected.includes(user.id)) e.currentTarget.style.background = "#1e2d4520"; }}
                onMouseLeave={e => { if (!selected.includes(user.id)) e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ padding: "14px 20px" }}>
                  <input type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleSelect(user.id)} style={{ accentColor: "#3b82f6", cursor: "pointer" }} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={user.avatar} index={i} />
                    <div>
                      <p style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 600, margin: 0 }}>{user.name}</p>
                      <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{user.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}><RoleBadge role={user.role} /></td>
                <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>{user.school}</td>
                <td style={{ padding: "12px 16px" }}><StatusBadge status={user.status} /></td>
                <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>{user.joined}</td>
                <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>{user.lastLogin}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setModal(user)}
                      style={{ background: "#1e2d45", border: "none", borderRadius: 6, padding: "6px 12px", color: "#60a5fa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{ background: "#ef444415", border: "none", borderRadius: 6, padding: "6px 12px", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  No users found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e2d45" }}>
          <span style={{ color: "#64748b", fontSize: 13 }}>
            Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ background: "#1e2d45", border: "none", borderRadius: 6, padding: "6px 14px", color: page === 1 ? "#334155" : "#94a3b8", cursor: page === 1 ? "default" : "pointer", fontSize: 14 }}
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{ background: p === page ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "#1e2d45", border: "none", borderRadius: 6, padding: "6px 12px", color: p === page ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: p === page ? 700 : 400, minWidth: 32 }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ background: "#1e2d45", border: "none", borderRadius: 6, padding: "6px 14px", color: page === totalPages ? "#334155" : "#94a3b8", cursor: page === totalPages ? "default" : "pointer", fontSize: 14 }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <UserModal
          user={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}