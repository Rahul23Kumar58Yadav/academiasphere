// controllers/user.controller.js
const User         = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt       = require('bcryptjs');
const cloudinary   = require('../config/cloudinary');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

// ─── GET /api/users/me ────────────────────────────────────────────────────
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});

// ─── PUT /api/users/me ────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const FORBIDDEN = ['password', 'role', 'schoolId', 'isActive', 'refreshToken', 'email'];
  FORBIDDEN.forEach(f => delete req.body[f]);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  res.json({ success: true, message: 'Profile updated.', data: user });
});

// ─── PUT /api/users/me/password ───────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    throw new AppError('Both currentPassword and newPassword are required.', 400);

  if (newPassword.length < 8)
    throw new AppError('New password must be at least 8 characters.', 400);

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
    throw new AppError('Password must contain uppercase, lowercase, and a number.', 400);

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect.', 401);

  user.password          = await bcrypt.hash(newPassword, 12);
  user.refreshToken      = undefined;          // invalidate all sessions
  user.passwordChangedAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

// ─── PUT /api/users/me/avatar ─────────────────────────────────────────────
exports.updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image file provided.', 400);

  const user = await User.findById(req.user._id).select('avatar avatarPublicId');

  // Remove old avatar from Cloudinary
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: req.file.path, avatarPublicId: req.file.filename } },
    { new: true }
  ).select('-password -refreshToken');

  res.json({ success: true, message: 'Avatar updated.', data: updated });
});

// ─── GET /api/users/me/activity ───────────────────────────────────────────
exports.getUserActivity = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const user = await User.findById(req.user._id).select('activityLog');
  const log  = (user?.activityLog || [])
    .slice(-Number(limit))
    .reverse();
  res.json({ success: true, data: log });
});

// ─── GET /api/users/me/notifications ─────────────────────────────────────
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly, type } = req.query;

  const filter = {
    $or: [
      { recipientId: req.user._id },
      { recipientRoles: req.user.role, schoolId: req.user.schoolId },
    ],
    isArchived: false,
    ...(unreadOnly === 'true' && { isRead: false }),
    ...(type && { type }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─── PATCH /api/users/me/notifications/read ───────────────────────────────
exports.markNotificationsRead = asyncHandler(async (req, res) => {
  const { ids, markAll } = req.body;

  if (markAll) {
    await Notification.updateMany(
      {
        $or: [
          { recipientId: req.user._id },
          { recipientRoles: req.user.role, schoolId: req.user.schoolId },
        ],
        isRead: false,
      },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  }

  if (!Array.isArray(ids) || !ids.length)
    throw new AppError('Provide ids array or set markAll: true', 400);

  await Notification.updateMany(
    { _id: { $in: ids } },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.json({ success: true, message: `${ids.length} notifications marked as read.` });
});

// ─── GET /api/users (Admin) ───────────────────────────────────────────────
exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20,
    role, status, search, schoolId,
    sortBy = 'createdAt', sortOrder = 'desc',
  } = req.query;

  const filter = {};

  // SCHOOL_ADMIN can only see users in their school
  if (req.user.role === 'SCHOOL_ADMIN') {
    filter.schoolId = req.user.schoolId;
  } else if (schoolId) {
    filter.schoolId = schoolId;
  }

  if (role)   filter.role     = role.toUpperCase();
  if (status) filter.isActive = status === 'active';

  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [docs, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  // Role summary
  const roleSummary = await User.aggregate([
    { $match: filter },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: docs,
    roleSummary,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
      hasNext: Number(page) * Number(limit) < total,
      hasPrev: Number(page) > 1,
    },
  });
});

// ─── GET /api/users/search ────────────────────────────────────────────────
exports.searchUsers = asyncHandler(async (req, res) => {
  const { q, role, limit = 15 } = req.query;
  if (!q || q.trim().length < 2)
    throw new AppError('Query param q must be at least 2 characters.', 400);

  const filter = {
    $or: [
      { name:  { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
    ...(role && { role: role.toUpperCase() }),
    ...(req.user.role === 'SCHOOL_ADMIN' && { schoolId: req.user.schoolId }),
  };

  const users = await User.find(filter)
    .select('name email role avatar schoolId isActive')
    .limit(Number(limit));

  res.json({ success: true, data: users });
});

// ─── GET /api/users/by-role/:role ─────────────────────────────────────────
exports.getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const validRoles = ['SUPER_ADMIN','SCHOOL_ADMIN','TEACHER','STUDENT','PARENT','VENDOR'];
  if (!validRoles.includes(role.toUpperCase()))
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);

  const filter = {
    role:     role.toUpperCase(),
    isActive: true,
    ...(req.user.role === 'SCHOOL_ADMIN' && { schoolId: req.user.schoolId }),
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [docs, total] = await Promise.all([
    User.find(filter)
      .select('name email avatar phone role schoolId createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: docs,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshToken')
    .populate('schoolId', 'name address logo');

  if (!user) throw new AppError('User not found', 404);

  // SCHOOL_ADMIN can only view users in their school
  if (req.user.role === 'SCHOOL_ADMIN' &&
      user.schoolId?.toString() !== req.user.schoolId?.toString()) {
    throw new AppError('Not authorised to view this user.', 403);
  }

  res.json({ success: true, data: user });
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────
exports.updateUser = asyncHandler(async (req, res) => {
  const FORBIDDEN = ['password', 'refreshToken', 'passwordChangedAt'];
  FORBIDDEN.forEach(f => delete req.body[f]);

  // Only SUPER_ADMIN can change roles
  if (req.user.role !== 'SUPER_ADMIN') delete req.body.role;
  // Only SUPER_ADMIN can change schoolId
  if (req.user.role !== 'SUPER_ADMIN') delete req.body.schoolId;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, message: 'User updated.', data: user });
});

// ─── PATCH /api/users/:id/status ──────────────────────────────────────────
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const { isActive, reason } = req.body;

  if (typeof isActive !== 'boolean')
    throw new AppError('isActive must be a boolean.', 400);

  // Prevent self-deactivation
  if (req.params.id === req.user._id.toString())
    throw new AppError('You cannot change your own account status.', 400);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive, ...(reason && { deactivationReason: reason }) } },
    { new: true }
  ).select('name email isActive role');

  if (!user) throw new AppError('User not found', 404);

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
    data: user,
  });
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString())
    throw new AppError('You cannot delete your own account.', 400);

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  // Remove avatar from Cloudinary
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
  }

  await user.deleteOne();

  res.json({ success: true, message: 'User permanently deleted.' });
});

// ─── GET /api/users/stats ─────────────────────────────────────────────────
exports.getUserStats = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'SCHOOL_ADMIN'
    ? { schoolId: req.user.schoolId }
    : {};

  const [byRole, byStatus, recentSignups] = await Promise.all([
    User.aggregate([
      { $match: filter },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.aggregate([
      { $match: filter },
      { $group: { _id: '$isActive', count: { $sum: 1 } } },
    ]),
    User.find({ ...filter, createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt'),
  ]);

  const totalUsers = byRole.reduce((a, r) => a + r.count, 0);
  const activeCount= byStatus.find(s => s._id === true)?.count  || 0;
  const inactiveCount=byStatus.find(s => s._id === false)?.count || 0;

  res.json({
    success: true,
    data: { totalUsers, activeCount, inactiveCount, byRole, recentSignups },
  });
});