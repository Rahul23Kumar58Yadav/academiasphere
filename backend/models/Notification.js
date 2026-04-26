// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // ── Recipients ────────────────────────────────────────────────────────
  // Either a specific user OR broadcast to roles (both optional but one required)
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'School',
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },
  recipientRoles: [{
    type: String,
    enum: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'VENDOR'],
  }],
  grades: [{ type: String }],  // filter to specific grades; empty = all

  // ── Content ───────────────────────────────────────────────────────────
  title: { type: String, required: true, trim: true },
  body:  { type: String, required: true },
  type: {
    type:    String,
    enum:    ['info', 'success', 'warning', 'error', 'fee', 'attendance', 'result', 'event', 'message', 'system'],
    default: 'info',
  },
  priority: {
    type:    String,
    enum:    ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  icon:        { type: String },
  actionUrl:   { type: String },
  actionLabel: { type: String },

  // ── State ─────────────────────────────────────────────────────────────
  isRead:     { type: Boolean, default: false },
  readAt:     { type: Date },
  isArchived: { type: Boolean, default: false },

  // ── Delivery channels ──────────────────────────────────────────────────
  channels:  [{ type: String, enum: ['push', 'email', 'sms'] }],
  emailSent: { type: Boolean, default: false },
  smsSent:   { type: Boolean, default: false },

  // ── Meta ──────────────────────────────────────────────────────────────
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },
  expiresAt: { type: Date },  // TTL field — auto-deleted after this date
}, {
  timestamps: true,
});

// ── Validation: at least one recipient must be defined ───────────────────
notificationSchema.pre('save', function (next) {
  if (!this.recipientId && (!this.recipientRoles || !this.recipientRoles.length)) {
    return next(new Error('Either recipientId or recipientRoles must be provided.'));
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────
notificationSchema.index({ recipientId:    1, isRead: 1, createdAt: -1 });
notificationSchema.index({ schoolId:       1, recipientRoles: 1, createdAt: -1 });
notificationSchema.index({ schoolId:       1, type: 1, priority: 1 });
notificationSchema.index({ isArchived:     1, createdAt: -1 });
// TTL index — MongoDB auto-deletes expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);