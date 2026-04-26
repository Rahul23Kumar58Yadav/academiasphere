// middleware/authMiddleware.js
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');

// ─── protect — verify JWT and attach req.user ─────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Bearer token from Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback: httpOnly cookie
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError('Not authenticated. Please log in.', 401);
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch fresh user
  const user = await User.findById(decoded.id).select('-password -refreshToken');
  if (!user) throw new AppError('User no longer exists.', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated.', 401);

  // Check if password was changed after token was issued
  if (user.passwordChangedAt) {
    const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (decoded.iat < changedAt) {
      throw new AppError('Password was recently changed. Please log in again.', 401);
    }
  }

  req.user = user;
  next();
});

// ─── authorise — check user role ─────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated.', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Role '${req.user.role}' is not authorised for this action.`,
        403
      )
    );
  }
  next();
};

module.exports = { protect, authorize };