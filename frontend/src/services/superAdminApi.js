// services/superAdminApi.js
// Central API service — reads base URL + token from env / localStorage

const BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/super-admin`
  : "/api/v1/super-admin";

// ── Auth header helper ────────────────────────────────────────────────────────
const authHeaders = () => {
  const token = localStorage.getItem("accessToken");   // ← Must match above
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Generic fetch wrapper ─────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: authHeaders(),
    ...options,
  });

  // 401 → clear tokens and reload to login
  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
    return;
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboard = () => apiFetch("/dashboard");

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAnalytics = () => apiFetch("/analytics");

// ── Applications ──────────────────────────────────────────────────────────────
export const fetchApplications = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/applications?${qs}`);
};
export const fetchApplicationById = (id) =>
  apiFetch(`/applications/${id}`);
export const approveApplication = (id) =>
  apiFetch(`/applications/${id}/approve`, { method: "PUT" });
export const rejectApplication = (id, reason) =>
  apiFetch(`/applications/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });

// ── Schools ───────────────────────────────────────────────────────────────────
export const fetchSchools = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/schools?${qs}`);
};
export const fetchSchoolById = (id) => apiFetch(`/schools/${id}`);
export const updateSchool = (id, data) =>
  apiFetch(`/schools/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteSchool = (id) =>
  apiFetch(`/schools/${id}`, { method: "DELETE" });
export const suspendSchool = (id) =>
  apiFetch(`/schools/${id}/suspend`, { method: "PATCH" });
export const changeSchoolPlan = (id, plan) =>
  apiFetch(`/schools/${id}/plan`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchUsers = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/users?${qs}`);
};
export const fetchUserById = (id) => apiFetch(`/users/${id}`);
export const createUser = (data) =>
  apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateUser = (id, data) =>
  apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteUser = (id) =>
  apiFetch(`/users/${id}`, { method: "DELETE" });
export const toggleUserStatus = (id) =>
  apiFetch(`/users/${id}/toggle`, { method: "PATCH" });
export const changeUserRole = (id, role) =>
  apiFetch(`/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

// ── Roles ─────────────────────────────────────────────────────────────────────
export const fetchRoles = () => apiFetch("/roles");
export const updateRolePermissions = (roleKey, permissions) =>
  apiFetch(`/roles/${roleKey}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });

// ── Settings ──────────────────────────────────────────────────────────────────
export const fetchSettings = () => apiFetch("/settings");
export const updateSettings = (data) =>
  apiFetch("/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// ── Notifications (real endpoint when ready, falls back gracefully) ───────────
export const fetchNotifications = () =>
  apiFetch("/notifications").catch(() => ({
    notifications: [],
    unread: 0,
  }));

export const markNotificationRead = (id) =>
  apiFetch(`/notifications/${id}/read`, {
    method: "PATCH",
  }).catch(() => null);

export const markAllNotificationsRead = () =>
  apiFetch("/notifications/read-all", {
    method: "PATCH",
  }).catch(() => null);