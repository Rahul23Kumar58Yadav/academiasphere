// services/attendanceApi.js
// Central API service — all attendance HTTP calls go through here.
// Base URL is read from the environment variable so it works in dev & prod.

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

// ─── helpers ──────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data; // { success, data, … }
}

// ─── TEACHER / ADMIN — mark & manage ─────────────────────────────────────────

/** GET /attendance  – list records (with optional filters) */
export const getAttendance = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/attendance${qs ? `?${qs}` : ""}`);
};

/**
 * POST /attendance/mark
 * body: { grade, section, date, subject, period, academicYear, records:[{studentId, status, note}] }
 */
export const markAttendance = (body) => request("POST", "/attendance/mark", body);

/** PUT /attendance/:id  – edit a saved record */
export const editAttendance = (id, body) => request("PUT", `/attendance/${id}`, body);

/** DELETE /attendance/:id */
export const deleteAttendance = (id) => request("DELETE", `/attendance/${id}`);

// ─── SUMMARY / REPORTS ───────────────────────────────────────────────────────

/** GET /attendance/summary?grade=&section=&month=&year= */
export const getAttendanceSummary = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/attendance/summary${qs ? `?${qs}` : ""}`);
};

/** GET /attendance/monthly/:grade/:section?month=&year= */
export const getMonthlyReport = (grade, section, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/attendance/monthly/${grade}/${section}${qs ? `?${qs}` : ""}`);
};

// ─── STUDENT ──────────────────────────────────────────────────────────────────

/**
 * GET /attendance/student/:studentId?month=&year=
 * Returns the logged-in student's own calendar.
 */
export const getStudentAttendance = (studentId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/attendance/student/${studentId}${qs ? `?${qs}` : ""}`);
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

/** GET /attendance/today-status  – which classes are marked today */
export const getTodayStatus = () => request("GET", "/attendance/today-status");

/** GET /attendance/predictions?grade=&section= */
export const getAttendancePredictions = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/attendance/predictions${qs ? `?${qs}` : ""}`);
};