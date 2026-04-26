// controllers/notification.controller.js
const Notification = require('../models/Notification');
const Student      = require('../models/Student');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail }= require('../utils/sendEmails');

// ─── Recipient filter for the logged-in user ─────────────────────────────────
const myFilter = (user) => ({
  $or: [
    { recipientId: user._id },
    { recipientRoles: user.role, schoolId: user.schoolId },
  ],
  isArchived: false,
});

// ════════════════════════════════════════════════════════════════════════════
// PERSONAL  (any role)
// ════════════════════════════════════════════════════════════════════════════

// GET /api/notifications
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly, type, priority } = req.query;

  const filter = {
    ...myFilter(req.user),
    ...(unreadOnly === 'true' && { isRead: false }),
    ...(type     && { type }),
    ...(priority && { priority }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name avatar'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...myFilter(req.user), isRead: false }),
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

// GET /api/notifications/unread-count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    ...myFilter(req.user),
    isRead: false,
  });
  res.json({ success: true, count });
});

// PATCH /api/notifications/:id/read
exports.markOneRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, ...myFilter(req.user) },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, data: n });
});

// PATCH /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  const { type } = req.body;
  const filter = {
    ...myFilter(req.user),
    isRead: false,
    ...(type && { type }),
  };

  const result = await Notification.updateMany(
    filter,
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read.`,
  });
});

// PATCH /api/notifications/:id/archive
exports.archiveNotification = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, ...myFilter(req.user) },
    { $set: { isArchived: true } },
    { new: true }
  );
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, message: 'Notification archived.' });
});

// DELETE /api/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndDelete({
    _id: req.params.id,
    ...myFilter(req.user),
  });
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, message: 'Notification deleted.' });
});

// DELETE /api/notifications/clear-read
exports.clearAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({
    ...myFilter(req.user),
    isRead: true,
  });
  res.json({
    success: true,
    message: `${result.deletedCount} read notifications cleared.`,
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN — SEND / BROADCAST
// ════════════════════════════════════════════════════════════════════════════

// POST /api/notifications/send  (targeted)
exports.sendNotification = asyncHandler(async (req, res) => {
  const {
    recipientId, recipientRoles, grades,
    title, body, type, priority,
    actionUrl, actionLabel,
    channels, email,
  } = req.body;

  if (!title || !body)
    throw new AppError('title and body are required.', 400);

  if (!recipientId && (!Array.isArray(recipientRoles) || !recipientRoles.length))
    throw new AppError('recipientId or recipientRoles is required.', 400);

  const notification = await Notification.create({
    schoolId:       req.user.schoolId,
    recipientId:    recipientId    || undefined,
    recipientRoles: recipientRoles || [],
    grades:         grades         || [],
    title, body,
    type:     type     || 'info',
    priority: priority || 'medium',
    actionUrl, actionLabel,
    channels: channels || [],
    createdBy: req.user._id,
  });

  if (channels?.includes('email') && email) {
    await sendEmail({ to: email, subject: title, text: body })
      .then(() => Notification.findByIdAndUpdate(notification._id, { $set: { emailSent: true } }))
      .catch(() => {});
  }

  res.status(201).json({ success: true, data: notification });
});

// POST /api/notifications/broadcast  (to multiple roles)
exports.broadcastNotification = asyncHandler(async (req, res) => {
  const {
    recipientRoles, grades,
    title, body, type, priority,
    actionUrl, actionLabel,
  } = req.body;

  if (!Array.isArray(recipientRoles) || !recipientRoles.length)
    throw new AppError('recipientRoles array is required.', 400);

  const notification = await Notification.create({
    schoolId: req.user.schoolId,
    recipientRoles,
    grades:   grades || [],
    title, body,
    type:     type     || 'info',
    priority: priority || 'medium',
    actionUrl, actionLabel,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: `Broadcast sent to: ${recipientRoles.join(', ')}.`,
    data: notification,
  });
});

// ════════════════════════════════════════════════════════════════════════════
// AUTOMATED ALERTS
// ════════════════════════════════════════════════════════════════════════════

// POST /api/notifications/fee-reminder
exports.sendFeeReminders = asyncHandler(async (req, res) => {
  const { academicYear, term } = req.body;

  const { Payment } = require('../models/Fee');

  const pendingPayments = await Payment.find({
    schoolId: req.user.schoolId,
    status:   'pending',
    ...(academicYear && { academicYear }),
    ...(term         && { term }),
  }).populate('studentId', 'firstName lastName guardians grade');

  if (!pendingPayments.length) {
    return res.json({ success: true, message: 'No pending payments found.', sent: 0 });
  }

  const notifs   = [];
  let emailsSent = 0;

  for (const payment of pendingPayments) {
    const student = payment.studentId;
    if (!student) continue;

    notifs.push({
      schoolId:       req.user.schoolId,
      recipientRoles: ['PARENT'],
      grades:         [student.grade],
      title:          `⚠ Fee Payment Reminder – ${payment.term}`,
      body:           `Dear Parent, ₹${payment.amount.toLocaleString()} fee for ${student.firstName} (${payment.term}, ${payment.academicYear}) is due. Please pay via the portal to avoid late fees.`,
      type:           'fee',
      priority:       'high',
      actionUrl:      '/parent/fees/pay',
      createdBy:      req.user._id,
    });

    const parentEmail = student.guardians?.find(g => g.isPrimary)?.email
      || student.guardians?.[0]?.email;

    if (parentEmail) {
      await sendEmail({
        to:      parentEmail,
        subject: `Fee Payment Reminder – ${payment.term}`,
        html: `<p>Dear Parent,</p>
               <p>₹${payment.amount.toLocaleString()} fee for <strong>${student.firstName}</strong> – 
               ${payment.term} (${payment.academicYear}) is due.</p>
               <p>Please log in to the AcademySphere portal to pay.</p>`,
      }).then(() => emailsSent++).catch(() => {});
    }
  }

  if (notifs.length) await Notification.insertMany(notifs);

  res.json({
    success: true,
    message: `${notifs.length} reminders sent. ${emailsSent} emails delivered.`,
    data: { notificationsSent: notifs.length, emailsSent },
  });
});

// POST /api/notifications/attendance-alert
exports.sendAttendanceAlerts = asyncHandler(async (req, res) => {
  const { threshold = 75, grade, section } = req.body;

  const atRiskStudents = await Student.find({
    schoolId: req.user.schoolId,
    status:   'active',
    ...(grade   && { grade }),
    ...(section && { section }),
    'attendanceSummary.percentage': { $lt: Number(threshold), $gt: 0 },
  }).select('firstName lastName grade section guardians attendanceSummary');

  if (!atRiskStudents.length) {
    return res.json({ success: true, message: 'No at-risk students found.', sent: 0 });
  }

  const notifs   = [];
  let emailsSent = 0;

  for (const student of atRiskStudents) {
    const pct      = student.attendanceSummary.percentage;
    const priority = pct < 65 ? 'urgent' : 'high';

    notifs.push({
      schoolId:       req.user.schoolId,
      recipientRoles: ['PARENT'],
      grades:         [student.grade],
      title:          `📋 Low Attendance Alert – ${student.firstName} ${student.lastName}`,
      body:           `${student.firstName}'s attendance is ${pct}%, below the required ${threshold}%. Minimum 75% is mandatory for exam eligibility.`,
      type:           'attendance',
      priority,
      actionUrl:      `/parent/children/${student._id}/attendance`,
      createdBy:      req.user._id,
    });

    const parentEmail = student.guardians?.find(g => g.isPrimary)?.email
      || student.guardians?.[0]?.email;

    if (parentEmail) {
      await sendEmail({
        to:      parentEmail,
        subject: `Attendance Alert – ${student.firstName} (${pct}%)`,
        html: `<p>Dear Parent,</p>
               <p><strong>${student.firstName}'s</strong> current attendance is <strong>${pct}%</strong>.</p>
               <p>The minimum required attendance is <strong>${threshold}%</strong>. 
               Students below this threshold may be barred from examinations.</p>
               <p>Please ensure regular attendance immediately.</p>`,
      }).then(() => emailsSent++).catch(() => {});
    }
  }

  if (notifs.length) await Notification.insertMany(notifs);

  res.json({
    success: true,
    message: `${notifs.length} alerts sent. ${emailsSent} emails delivered.`,
    data: { notificationsSent: notifs.length, emailsSent, studentsAffected: atRiskStudents.length },
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN VIEW  (school-level)
// ════════════════════════════════════════════════════════════════════════════

// GET /api/notifications/all
exports.getAllNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, type, priority, from } = req.query;

  const filter = {
    schoolId: req.user.schoolId,
    ...(type     && { type }),
    ...(priority && { priority }),
    ...(from     && { createdBy: from }),
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [docs, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name'),
    Notification.countDocuments(filter),
  ]);

  const typeSummary = await Notification.aggregate([
    { $match: { schoolId: req.user.schoolId } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: docs,
    typeSummary,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN — platform-wide notifications
// Used by SuperAdminLayout.jsx  (GET /api/v1/super-admin/notifications)
// ════════════════════════════════════════════════════════════════════════════

// Helper: relative time string
const relativeTime = (date) => {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// GET /api/v1/super-admin/notifications
exports.getSuperAdminNotifications = asyncHandler(async (req, res) => {
  // Fetch the latest platform-wide notifications (no schoolId filter)
  const notifications = await Notification.find({ recipientRoles: 'SUPER_ADMIN' })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('createdBy', 'name')
    .lean();

  // If no SUPER_ADMIN-targeted notifications exist yet, synthesise live ones
  // from real data (pending school applications + recent users) as a fallback
  let results = notifications;

  if (!results.length) {
    const User   = require('../models/User');
    const School = require('../models/School');

    const [pendingSchools, recentUsers] = await Promise.all([
      School.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5).select('name createdAt'),
      User.find().sort({ createdAt: -1 }).limit(3).select('name role createdAt'),
    ]);

    results = [
      ...pendingSchools.map((s) => ({
        _id:   `app-${s._id}`,
        type:  'application',
        title: 'New school application',
        body:  `${s.name} submitted a registration request.`,
        isRead: false,
        createdAt: s.createdAt,
      })),
      ...recentUsers.map((u) => ({
        _id:   `user-${u._id}`,
        type:  'user',
        title: `New ${u.role} account`,
        body:  `${u.name} joined the platform.`,
        isRead: true,
        createdAt: u.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const formatted = results.map((n) => ({
    ...n,
    id:   n._id,
    read: n.isRead ?? false,
    time: relativeTime(n.createdAt),
  }));

  const unread = formatted.filter((n) => !n.read).length;

  res.json({ success: true, notifications: formatted, unread });
});

// PATCH /api/v1/super-admin/notifications/:id/read
exports.markSuperAdminNotificationRead = asyncHandler(async (req, res) => {
  // Synthesised IDs (e.g. "app-xxx") are not real Mongo docs — skip gracefully
  if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
    return res.json({ success: true });
  }

  await Notification.findByIdAndUpdate(
    req.params.id,
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.json({ success: true });
});

// PATCH /api/v1/super-admin/notifications/read-all
exports.markAllSuperAdminNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipientRoles: 'SUPER_ADMIN', isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read.`,
  });
});