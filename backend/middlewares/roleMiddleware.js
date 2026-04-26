// middleware/roleMiddleware.js

/**
 * requireRole(...roles)
 *
 * Usage:
 *   router.use(requireRole("SUPER_ADMIN"))             // single
 *   router.get("/x", requireRole("TEACHER","SCHOOL_ADMIN"), handler)
 *
 * Must be used AFTER protect() middleware so req.user is already set.
 */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }

  const allowed = roles.flat().map((r) => r.toUpperCase());

  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${allowed.join(" or ")}.`,
    });
  }

  next();
};