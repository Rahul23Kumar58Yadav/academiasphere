// backend/server.js
require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const rateLimit    = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const morgan       = require("morgan");

const connectDB     = require("./config/db");
const errorHandler  = require("./middleware/errorHandler");
const mongoSanitize = require("./middleware/mongoSanitize");

const app    = express();
const PORT   = process.env.PORT || 5000;
const ENV    = process.env.NODE_ENV || "development";
const IS_DEV = ENV === "development";
const uploadRoutes = require('./routes/uploadRoutes');
const {
  assignmentRouter,
  submissionRouter,
  schoolRouter,
  studentAssignmentRouter,
} = require('./routes/assignment.routes.js');
// ─────────────────────────────────────────────────────────────────────────────
// 1. Database
// ─────────────────────────────────────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────────────────────────────────────
// 2. CORS  ← single definition, applied once, before everything else
// ─────────────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,   // use the env-aware array
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-requested-with'],
}));

// Optional: Add these headers manually as fallback
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Security headers
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy:   false,
    contentSecurityPolicy:     IS_DEV ? false : undefined,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Request logging
// ─────────────────────────────────────────────────────────────────────────────
app.use(morgan(IS_DEV ? "dev" : "combined"));

// ─────────────────────────────────────────────────────────────────────────────
// 5. Body parsing + cookie parsing + sanitisation
//    Order: json → urlencoded → cookieParser → sanitise
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());   // ← must be before any route that reads req.cookies
app.use(mongoSanitize);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Rate limiting
// ─────────────────────────────────────────────────────────────────────────────
const limiter = (max) =>
  rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             IS_DEV ? 10_000 : max,
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (_req, res) =>
      res.status(429).json({ success: false, message: "Too many requests — please try again later." }),
  });

const generalLimiter = limiter(200);
const authLimiter    = limiter(20);
const adminLimiter   = limiter(100);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Health / readiness checks
// ─────────────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), environment: ENV, timestamp: new Date().toISOString() })
);

app.get("/ready", (_req, res) => {
  const mongoose = require("mongoose");
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Safe route loader — skips missing files instead of crashing
// ─────────────────────────────────────────────────────────────────────────────
const safeRoute = (routePath) => {
  try {
    const mod = require(routePath);
    const isRouter =
      typeof mod === "function" ||
      (mod && typeof mod.handle === "function");
    if (!isRouter) {
      console.warn(`⚠️  '${routePath}' did not export a valid router — skipped.`);
      return (_req, _res, next) => next();
    }
    return mod;
  } catch (err) {
    console.warn(`⚠️  Could not load '${routePath}': ${err.message} — skipped.`);
    return (_req, _res, next) => next();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. API routes  (all under /api/v1/*)
// ─────────────────────────────────────────────────────────────────────────────

// Auth & identity
app.use("/api/v1/auth",        authLimiter,    safeRoute("./routes/authRoutes"));

// Super admin
app.use("/api/v1/super-admin", adminLimiter,   safeRoute("./routes/superAdminRoutes"));

// Schools  ← was missing; Register page posts to /api/v1/schools/register
app.use("/api/v1/schools",     generalLimiter, safeRoute("./routes/schoolRoutes"));

// Core domain
app.use("/api/v1/users",         generalLimiter, safeRoute("./routes/userRoutes"));
app.use("/api/v1/teachers",      generalLimiter, safeRoute("./routes/teacherRoutes"));
app.use("/api/v1/students",      generalLimiter, safeRoute("./routes/studentRoutes"));
app.use("/api/v1/classes",       generalLimiter, safeRoute("./routes/classRoutes"));
app.use("/api/v1/subjects",      generalLimiter, safeRoute("./routes/subjectRoutes"));
app.use("/api/v1/attendance",    generalLimiter, safeRoute("./routes/attendanceRoutes"));
app.use("/api/v1/fees",          generalLimiter, safeRoute("./routes/feeRoutes"));
app.use("/api/v1/notifications", generalLimiter, safeRoute("./routes/notificationRoutes"));
app.use("/api/v1/calendar",      generalLimiter, safeRoute("./routes/calendarRoutes"));
app.use("/api/v1/ai",            generalLimiter, safeRoute("./routes/aiRoutes"));
app.use("/api/v1/blockchain",    generalLimiter, safeRoute("./routes/Blockchainroutes"));
app.use('/api/uploads', uploadRoutes);
// NEW
app.use("/api/v1/teacher/assignments", generalLimiter, assignmentRouter);
app.use("/api/v1/teacher/submissions", generalLimiter, submissionRouter);
app.use("/api/v1/school",              generalLimiter, schoolRouter);
app.use("/api/v1/student/assignments", generalLimiter, studentAssignmentRouter);

// ─────────────────────────────────────────────────────────────────────────────
// 10. 404 catch-all  (must be after all real routes)
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. Global error handler  (must be last — 4-arg signature is required)
// ─────────────────────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// 12. Start server
// ─────────────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running  →  http://localhost:${PORT}`);
  console.log(`📡 Environment     →  ${ENV}`);
  console.log(`🩺 Health check    →  http://localhost:${PORT}/health\n`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed.");
    } catch (e) {
      console.error("❌ Error closing MongoDB:", e.message);
    }
    process.exit(0);
  });
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

module.exports = app;