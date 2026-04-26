// routes/notificationRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/Notification.controller');

router.get ('/unread-count',         protect, ctrl.getUnreadCount);
router.get ('/all',                  protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.getAllNotifications);
router.get ('/',                     protect, ctrl.getMyNotifications);
router.post('/send',                 protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), ctrl.sendNotification);
router.post('/broadcast',            protect, authorize('SUPER_ADMIN','SCHOOL_ADMIN'), ctrl.broadcastNotification);
router.post('/fee-reminder',         protect, authorize('SCHOOL_ADMIN','SUPER_ADMIN'), ctrl.sendFeeReminders);
router.post('/attendance-alert',     protect, authorize('SCHOOL_ADMIN','TEACHER'), ctrl.sendAttendanceAlerts);
router.patch('/read-all',            protect, ctrl.markAllRead);
router.patch('/:id/read',            protect, ctrl.markOneRead);
router.patch('/:id/archive',         protect, ctrl.archiveNotification);
router.delete('/clear-read',         protect, ctrl.clearAllRead);
router.delete('/:id',                protect, ctrl.deleteNotification);

module.exports = router;