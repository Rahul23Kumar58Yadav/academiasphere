// routes/attendanceSSE.js
// Server-Sent Events endpoint — clients subscribe here and receive
// a push notification whenever attendance is marked/edited.
//
// Mount in app.js:
//   const sseRouter = require('./routes/attendanceSSE');
//   app.use('/api/attendance/events', sseRouter);

const express = require("express");
const router  = express.Router();

// In-memory set of active SSE clients
// In production with multiple workers, use Redis pub/sub instead.
const clients = new Set();

/**
 * Broadcast to every connected client.
 * Call this from attendance.controller.js after markAttendance / editAttendance.
 */
function broadcastAttendanceUpdate(payload = {}) {
  const data = JSON.stringify({ type: "attendance-update", ...payload, ts: Date.now() });
  for (const res of clients) {
    try {
      res.write(`event: attendance-update\ndata: ${data}\n\n`);
    } catch (_) {
      clients.delete(res);
    }
  }
}

// ── GET /api/attendance/events ────────────────────────────────────────────────
router.get("/", (req, res) => {
  // Optional: validate JWT from ?token= query param
  // const token = req.query.token;
  // if (!verifyToken(token)) return res.sendStatus(401);

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // nginx: disable buffering
  res.flushHeaders();

  // Send a heartbeat immediately so the browser doesn't timeout
  res.write(": heartbeat\n\n");

  clients.add(res);

  // Heartbeat every 25 s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); }
    catch (_) { clearInterval(heartbeat); clients.delete(res); }
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

module.exports = { router, broadcastAttendanceUpdate };