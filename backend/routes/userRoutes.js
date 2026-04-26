// routes/userRoutes.js
const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  getUserProfile,
  updateProfile,
  changePassword,
  updateAvatar,
  getUserActivity,
  getMyNotifications,
  markNotificationsRead,
  getAllUsers,
  searchUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats,
} = require('../controllers/user.controller');

// ── My profile (any authenticated user) ──────────────────────────────────
router.get  ('/me',                    protect, getUserProfile);
router.put  ('/me',                    protect, updateProfile);
router.put  ('/me/password',           protect, changePassword);
router.put  ('/me/avatar',             protect, upload.single('avatar'), updateAvatar);
router.get  ('/me/activity',           protect, getUserActivity);
router.get  ('/me/notifications',      protect, getMyNotifications);
router.patch('/me/notifications/read', protect, markNotificationsRead);

// ── Admin routes ──────────────────────────────────────────────────────────
router.get  ('/stats',         protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), getUserStats);
router.get  ('/search',        protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), searchUsers);
router.get  ('/by-role/:role', protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), getUsersByRole);
router.get  ('/',              protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), getAllUsers);
router.get  ('/:id',           protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), getUserById);
router.put  ('/:id',           protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), updateUser);
router.patch('/:id/status',    protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), toggleUserStatus);
router.delete('/:id',          protect, authorize('SUPER_ADMIN'),                deleteUser);

module.exports = router;