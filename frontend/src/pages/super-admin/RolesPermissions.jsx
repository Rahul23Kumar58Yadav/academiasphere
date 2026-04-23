import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const ROLES = [
  { key: "SUPER_ADMIN",  label: "Super Admin",  color: "#818cf8", bg: "#1e1b4b", users: 2,  description: "Full platform access. Manages all schools, users, and settings." },
  { key: "SCHOOL_ADMIN", label: "School Admin", color: "#60a5fa", bg: "#1e3a5f", users: 24, description: "Manages a single school's students, teachers, fees, and curriculum." },
  { key: "TEACHER",      label: "Teacher",      color: "#4ade80", bg: "#14532d", users: 187, description: "Access to assigned classes, students, grades, and lesson plans." },
  { key: "STUDENT",      label: "Student",      color: "#fb923c", bg: "#451a03", users: 4820, description: "Views own courses, attendance, results, and assignments." },
  { key: "PARENT",       label: "Parent",       color: "#f0abfc", bg: "#4a1942", users: 3210, description: "Monitors child performance, attendance, and pays fees." },
  { key: "VENDOR",       label: "Vendor",       color: "#fbbf24", bg: "#422006", users: 38, description: "Lists products, manages orders, and tracks earnings." },
];

const PERMISSION_GROUPS = [
  {
    group: "User Management",
    icon: "👥",
    permissions: [
      { key: "users.view",    label: "View Users" },
      { key: "users.create",  label: "Create Users" },
      { key: "users.edit",    label: "Edit Users" },
      { key: "users.delete",  label: "Delete Users" },
    ]
  },
  {
    group: "School Management",
    icon: "🏫",
    permissions: [
      { key: "schools.view",   label: "View Schools" },
      { key: "schools.create", label: "Onboard Schools" },
      { key: "schools.edit",   label: "Edit School Details" },
      { key: "schools.delete", label: "Delete Schools" },
    ]
  },
  {
    group: "Student Management",
    icon: "🎓",
    permissions: [
      { key: "students.view",   label: "View Students" },
      { key: "students.enroll", label: "Enroll Students" },
      { key: "students.edit",   label: "Edit Students" },
      { key: "students.delete", label: "Delete Students" },
    ]
  },
  {
    group: "Attendance",
    icon: "📋",
    permissions: [
      { key: "attendance.view",   label: "View Attendance" },
      { key: "attendance.mark",   label: "Mark Attendance" },
      { key: "attendance.edit",   label: "Edit Attendance" },
      { key: "attendance.export", label: "Export Reports" },
    ]
  },
  {
    group: "Curriculum",
    icon: "📚",
    permissions: [
      { key: "curriculum.view",   label: "View Curriculum" },
      { key: "curriculum.create", label: "Build Curriculum" },
      { key: "curriculum.edit",   label: "Edit Curriculum" },
      { key: "lessons.manage",    label: "Manage Lessons" },
    ]
  },
  {
    group: "Results & Grades",
    icon: "📊",
    permissions: [
      { key: "results.view",   label: "View Results" },
      { key: "results.enter",  label: "Enter Grades" },
      { key: "results.edit",   label: "Edit Grades" },
      { key: "results.export", label: "Export Transcripts" },
    ]
  },
  {
    group: "Fee Management",
    icon: "💳",
    permissions: [
      { key: "fees.view",      label: "View Fees" },
      { key: "fees.structure", label: "Set Fee Structure" },
      { key: "fees.pay",       label: "Make Payments" },
      { key: "fees.reports",   label: "Fee Reports" },
    ]
  },
  {
    group: "Certificates",
    icon: "🏆",
    permissions: [
      { key: "certs.view",   label: "View Certificates" },
      { key: "certs.issue",  label: "Issue Certificates" },
      { key: "certs.verify", label: "Verify on Blockchain" },
      { key: "certs.revoke", label: "Revoke Certificates" },
    ]
  },
  {
    group: "AI & Analytics",
    icon: "🤖",
    permissions: [
      { key: "ai.insights",     label: "View AI Insights" },
      { key: "ai.training",     label: "Manage Models" },
      { key: "analytics.view",  label: "View Analytics" },
      { key: "analytics.export",label: "Export Reports" },
    ]
  },
  {
    group: "Blockchain",
    icon: "⛓",
    permissions: [
      { key: "blockchain.view",      label: "View Transactions" },
      { key: "blockchain.contracts", label: "Manage Contracts" },
      { key: "blockchain.audit",     label: "View Audit Logs" },
      { key: "blockchain.admin",     label: "Contract Admin" },
    ]
  },
  {
    group: "Vendor Marketplace",
    icon: "🛒",
    permissions: [
      { key: "vendors.view",     label: "View Vendors" },
      { key: "vendors.approve",  label: "Approve Vendors" },
      { key: "products.manage",  label: "Manage Products" },
      { key: "orders.manage",    label: "Manage Orders" },
    ]
  },
  {
    group: "System Settings",
    icon: "⚙️",
    permissions: [
      { key: "settings.view",   label: "View Settings" },
      { key: "settings.edit",   label: "Edit Settings" },
      { key: "email.templates", label: "Email Templates" },
      { key: "system.logs",     label: "System Logs" },
    ]
  },
];

// Default permission matrix
const DEFAULT_MATRIX = (() => {
  const m = {};
  const allKeys = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
  ROLES.forEach(r => {
    m[r.key] = {};
    allKeys.forEach(k => {
      if (r.key === "SUPER_ADMIN") { m[r.key][k] = true; return; }
      if (r.key === "SCHOOL_ADMIN") {
        m[r.key][k] = !["schools.create","schools.delete","users.delete","ai.training","blockchain.contracts","blockchain.admin","blockchain.audit","settings.edit","email.templates","system.logs","vendors.approve"].includes(k);
        return;
      }
      if (r.key === "TEACHER") {
        m[r.key][k] = ["students.view","attendance.view","attendance.mark","curriculum.view","curriculum.edit","lessons.manage","results.view","results.enter","results.edit","certs.view","ai.insights","analytics.view"].includes(k);
        return;
      }
      if (r.key === "STUDENT") {
        m[r.key][k] = ["students.view","attendance.view","curriculum.view","results.view","fees.view","fees.pay","certs.view"].includes(k);
        return;
      }
      if (r.key === "PARENT") {
        m[r.key][k] = ["students.view","attendance.view","results.view","fees.view","fees.pay","certs.view"].includes(k);
        return;
      }
      if (r.key === "VENDOR") {
        m[r.key][k] = ["products.manage","orders.manage"].includes(k);
        return;
      }
      m[r.key][k] = false;
    });
  });
  return m;
})();

// ─── Components ───────────────────────────────────────────────────────────────
function PermCheck({ value, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 22, height: 22, borderRadius: 6, border: `2px solid ${value ? "#3b82f6" : "#1e2d45"}`,
        background: value ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "default" : "pointer", transition: "all 0.15s", flexShrink: 0,
        opacity: disabled ? 0.4 : 1
      }}
    >
      {value && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1, fontWeight: 800 }}>✓</span>}
    </div>
  );
}

function RoleCard({ role, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? role.bg : "#131929",
        border: `1px solid ${isSelected ? role.color : "#1e2d45"}`,
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        transition: "all 0.2s", boxShadow: isSelected ? `0 0 0 2px ${role.color}40` : "none"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ color: role.color, fontWeight: 700, fontSize: 13 }}>{role.label}</span>
        <span style={{ background: role.bg, color: role.color, fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{role.users.toLocaleString()}</span>
      </div>
      <p style={{ color: "#64748b", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{role.description}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RolesPermissions() {
  const [matrix, setMatrix]         = useState(DEFAULT_MATRIX);
  const [activeRole, setActiveRole] = useState("SUPER_ADMIN");
  const [saved, setSaved]           = useState(false);
  const [tab, setTab]               = useState("matrix"); // "matrix" | "compare"

  const role = ROLES.find(r => r.key === activeRole);
  const isSuper = activeRole === "SUPER_ADMIN";

  const toggle = (pKey, val) => {
    if (isSuper) return;
    setMatrix(prev => ({ ...prev, [activeRole]: { ...prev[activeRole], [pKey]: val } }));
    setSaved(false);
  };

  const toggleGroup = (group) => {
    if (isSuper) return;
    const keys = group.permissions.map(p => p.key);
    const allOn = keys.every(k => matrix[activeRole][k]);
    setMatrix(prev => {
      const updated = { ...prev[activeRole] };
      keys.forEach(k => { updated[k] = !allOn; });
      return { ...prev, [activeRole]: updated };
    });
    setSaved(false);
  };

  const handleSave = () => {
    // In production: await api.put('/api/v1/roles/permissions', { role: activeRole, permissions: matrix[activeRole] })
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const countPerms = (roleKey) => Object.values(matrix[roleKey]).filter(Boolean).length;
  const totalPerms = PERMISSION_GROUPS.flatMap(g => g.permissions).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", padding: "28px 32px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 800, margin: 0 }}>Roles & Permissions</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Define what each role can access across the entire platform</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!isSuper && (
            <button
              onClick={handleSave}
              style={{
                background: saved ? "#14532d" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                border: "none", borderRadius: 10, padding: "11px 22px",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                transition: "background 0.3s"
              }}
            >
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#131929", border: "1px solid #1e2d45", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 24 }}>
        {[{ k: "matrix", l: "Permission Matrix" }, { k: "compare", l: "Role Comparison" }].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{ background: tab === t.k ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "transparent", border: "none", borderRadius: 8, padding: "8px 18px", color: tab === t.k ? "#fff" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "matrix" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
          {/* Role List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px 0" }}>Select Role</p>
            {ROLES.map(r => (
              <RoleCard key={r.key} role={r} isSelected={activeRole === r.key} onClick={() => setActiveRole(r.key)} />
            ))}
          </div>

          {/* Permission Panel */}
          <div>
            <div style={{ background: "#131929", border: `1px solid ${role.color}40`, borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: role.color, fontWeight: 700, fontSize: 16, margin: 0 }}>{role.label}</p>
                <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0 0" }}>{role.description}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 22, margin: 0 }}>{countPerms(activeRole)}<span style={{ color: "#64748b", fontSize: 14, fontWeight: 400 }}>/{totalPerms}</span></p>
                <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0 0" }}>permissions enabled</p>
              </div>
            </div>

            {isSuper && (
              <div style={{ background: "#1e3a2f", border: "1px solid #22c55e40", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <p style={{ color: "#4ade80", fontSize: 13, margin: 0 }}>Super Admin has full, unrestricted access to all platform permissions. This cannot be modified.</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PERMISSION_GROUPS.map(group => {
                const keys = group.permissions.map(p => p.key);
                const allOn = keys.every(k => matrix[activeRole][k]);
                const someOn = keys.some(k => matrix[activeRole][k]);

                return (
                  <div key={group.group} style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 12, overflow: "hidden" }}>
                    {/* Group Header */}
                    <div
                      style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e2d45", cursor: !isSuper ? "pointer" : "default" }}
                      onClick={() => toggleGroup(group)}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 18 }}>{group.icon}</span>
                        <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{group.group}</span>
                        <span style={{ background: someOn ? "#1e3a5f" : "#1e2d45", color: someOn ? "#60a5fa" : "#64748b", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>
                          {keys.filter(k => matrix[activeRole][k]).length}/{keys.length}
                        </span>
                      </div>
                      {!isSuper && (
                        <span style={{ color: "#64748b", fontSize: 11 }}>{allOn ? "Deselect all" : "Select all"}</span>
                      )}
                    </div>

                    {/* Permissions Grid */}
                    <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {group.permissions.map(perm => (
                        <div key={perm.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <PermCheck
                            value={matrix[activeRole][perm.key]}
                            onChange={(v) => toggle(perm.key, v)}
                            disabled={isSuper}
                          />
                          <span style={{ color: matrix[activeRole][perm.key] ? "#e2e8f0" : "#64748b", fontSize: 13, transition: "color 0.15s" }}>
                            {perm.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {tab === "compare" && (
        <div style={{ background: "#131929", border: "1px solid #1e2d45", borderRadius: 14, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2d45" }}>
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: 220 }}>Permission</th>
                {ROLES.map(r => (
                  <th key={r.key} style={{ padding: "16px 12px", textAlign: "center", minWidth: 110 }}>
                    <div style={{ color: r.color, fontSize: 12, fontWeight: 700 }}>{r.label}</div>
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{countPerms(r.key)}/{totalPerms}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(group => ([
                <tr key={`group-${group.group}`} style={{ background: "#0f172a" }}>
                  <td colSpan={ROLES.length + 1} style={{ padding: "10px 20px" }}>
                    <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {group.icon} {group.group}
                    </span>
                  </td>
                </tr>,
                ...group.permissions.map((perm, pi) => (
                  <tr key={perm.key} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "11px 20px", color: "#94a3b8", fontSize: 13 }}>{perm.label}</td>
                    {ROLES.map(r => (
                      <td key={r.key} style={{ padding: "11px 12px", textAlign: "center" }}>
                        {matrix[r.key][perm.key]
                          ? <span style={{ color: "#4ade80", fontSize: 16 }}>✓</span>
                          : <span style={{ color: "#334155", fontSize: 16 }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))
              ]))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}