// backend/models/CalendarEvent.js
const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    // ── Core ──────────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [150, "Title must be 150 characters or fewer"],
    },
    category: {
      type: String,
      enum: ["exam", "holiday", "event", "meeting", "sports", "academic"],
      required: [true, "Category is required"],
      index: true,
    },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    location:    { type: String, trim: true, maxlength: 200,  default: "" },

    // ── Dates & Time (stored as "YYYY-MM-DD" strings — timezone-safe) ─────────
    startDate: {
      type:     String,
      required: [true, "Start date is required"],
      match:    [/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"],
      index:    true,
    },
    endDate: {
      type:     String,
      required: [true, "End date is required"],
      match:    [/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"],
    },
    allDay:    { type: Boolean, default: true },
    startTime: { type: String, match: [/^\d{2}:\d{2}$/, "Use HH:MM format"], default: null },
    endTime:   { type: String, match: [/^\d{2}:\d{2}$/, "Use HH:MM format"], default: null },

    // ── Associations ──────────────────────────────────────────────────────────
    schoolId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "School",
      required: true,
      index:    true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },

    // ── Metadata ──────────────────────────────────────────────────────────────
    participants: [{ type: String, trim: true }],
    reminder:     { type: Boolean, default: false },
    isRecurring:  { type: Boolean, default: false },
    color:        { type: String,  trim: true, default: null },
    isActive:     { type: Boolean, default: true, index: true },
    deletedAt:    { type: Date,    default: null },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Pre-validate ──────────────────────────────────────────────────────────────
calendarEventSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "endDate must be on or after startDate");
  }
  if (!this.allDay) {
    if (!this.startTime) this.invalidate("startTime", "startTime required when allDay is false");
    if (!this.endTime)   this.invalidate("endTime",   "endTime required when allDay is false");
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
calendarEventSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });
calendarEventSchema.index({ schoolId: 1, category: 1, startDate: 1 });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);