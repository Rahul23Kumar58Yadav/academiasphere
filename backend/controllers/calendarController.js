function buildDateQuery(query = {}) {
  const { month, year, from, to } = query;
  const cond = {};
 
  if (from && to) {
    cond.startDate = { $lte: to };
    cond.endDate   = { $gte: from };
  } else if (month && year) {
    const m   = String(month).padStart(2, "0");
    const y   = String(year);
    const lastDay = new Date(Number(y), Number(month), 0).getDate();
    const windowStart = `${y}-${m}-01`;
    const windowEnd   = `${y}-${m}-${lastDay}`;
    cond.startDate = { $lte: windowEnd };
    cond.endDate   = { $gte: windowStart };
  }
  return cond;
}
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get events for a school  (supports ?month=4&year=2024 or ?from=&to=)
// @route GET /api/calendar
// @access Private (SCHOOL_ADMIN, TEACHER, STUDENT within same school)
// ─────────────────────────────────────────────────────────────────────────────
exports.getEvents = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
    const schoolId = req.user.schoolId;
    const { category, search, page = 1, limit = 200 } = req.query;
 
    const query = {
      schoolId,
      isActive: true,
      deletedAt: null,
      ...buildDateQuery(req.query),
    };
 
    if (category && category !== "all") query.category = category;
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
      ];
    }
 
    const total  = await CalendarEvent.countDocuments(query);
    const events = await CalendarEvent.find(query)
      .sort({ startDate: 1, startTime: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("createdBy", "name email");
 
    return res.status(200).json({ success: true, total, events });
  } catch (err) {
    console.error("getEvents error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create an event
// @route POST /api/calendar
// @access Private (SCHOOL_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.createEvent = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
    const { validationResult } = require("express-validator");
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
 
    const {
      title, category, startDate, endDate,
      description, location, allDay, startTime, endTime,
      participants, reminder, color,
    } = req.body;
 
    if (!title?.trim() || !startDate || !endDate || !category) {
      return res.status(400).json({
        success: false,
        message: "title, category, startDate and endDate are required",
      });
    }
 
    const event = await CalendarEvent.create({
      title:        title.trim(),
      category,
      startDate,
      endDate,
      description:  description?.trim() || "",
      location:     location?.trim()    || "",
      allDay:       allDay !== false,
      startTime:    allDay ? null : (startTime || null),
      endTime:      allDay ? null : (endTime   || null),
      participants: Array.isArray(participants) ? participants.filter(Boolean) : [],
      reminder:     !!reminder,
      color:        color || null,
      schoolId:     req.user.schoolId,
      createdBy:    req.user._id,
    });
 
    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (err) {
    console.error("createEvent error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get single event
// @route GET /api/calendar/:id
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getEvent = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
      isActive: true,
    }).populate("createdBy", "name email");
 
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    return res.status(200).json({ success: true, event });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update event
// @route PUT /api/calendar/:id
// @access Private (SCHOOL_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateEvent = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
 
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
      isActive: true,
    });
 
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
 
    const ALLOWED = [
      "title", "category", "startDate", "endDate",
      "description", "location", "allDay", "startTime", "endTime",
      "participants", "reminder", "color",
    ];
 
    const updates = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
 
    // Enforce allDay logic
    if (updates.allDay === true || (updates.allDay === undefined && event.allDay)) {
      updates.startTime = null;
      updates.endTime   = null;
    }
 
    if (updates.title) updates.title = updates.title.trim();
    if (updates.description !== undefined) updates.description = updates.description?.trim() || "";
    if (updates.location    !== undefined) updates.location    = updates.location?.trim()    || "";
 
    if (updates.participants && !Array.isArray(updates.participants)) {
      return res.status(400).json({ success: false, message: "participants must be an array" });
    }
 
    const updated = await CalendarEvent.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");
 
    return res.status(200).json({ success: true, message: "Event updated", event: updated });
  } catch (err) {
    console.error("updateEvent error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Soft-delete event
// @route DELETE /api/calendar/:id
// @access Private (SCHOOL_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteEvent = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
 
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
    });
 
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
 
    event.isActive  = false;
    event.deletedAt = new Date();
    await event.save();
 
    return res.status(200).json({ success: true, message: "Event deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Bulk create events (e.g. import from CSV / template)
// @route POST /api/calendar/bulk
// @access Private (SCHOOL_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkCreateEvents = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
    const { events } = req.body;
 
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: "events array is required" });
    }
    if (events.length > 100) {
      return res.status(400).json({ success: false, message: "Maximum 100 events per bulk request" });
    }
 
    const docs = events.map(ev => ({
      ...ev,
      schoolId:  req.user.schoolId,
      createdBy: req.user._id,
      isActive:  true,
      deletedAt: null,
    }));
 
    const inserted = await CalendarEvent.insertMany(docs, { ordered: false });
    return res.status(201).json({ success: true, count: inserted.length, message: `${inserted.length} events created` });
  } catch (err) {
    if (err.name === "BulkWriteError") {
      return res.status(207).json({ success: false, message: "Some events failed validation", error: err.message });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Export calendar as JSON (frontend can convert to PDF/iCal)
// @route GET /api/calendar/export/json
// @access Private (SCHOOL_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.exportJSON = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
    const { year } = req.query;
    const y = Number(year) || new Date().getFullYear();
 
    const events = await CalendarEvent.find({
      schoolId: req.user.schoolId,
      isActive:  true,
      deletedAt: null,
      startDate: { $gte: `${y}-01-01`, $lte: `${y}-12-31` },
    }).sort({ startDate: 1 }).lean();
 
    res.setHeader("Content-Disposition", `attachment; filename="calendar-${y}.json"`);
    return res.status(200).json({ success: true, year: y, total: events.length, events });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get upcoming events (next N days)
// @route GET /api/calendar/upcoming?days=30
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getUpcoming = async (req, res) => {
  try {
    const CalendarEvent = require("../models/CalendarEvent");
    const days   = Math.min(Number(req.query.days) || 30, 365);
    const today  = new Date().toISOString().split("T")[0];
    const future = new Date(Date.now() + days * 864e5).toISOString().split("T")[0];
 
    const events = await CalendarEvent.find({
      schoolId:  req.user.schoolId,
      isActive:  true,
      deletedAt: null,
      startDate: { $gte: today, $lte: future },
    }).sort({ startDate: 1 }).limit(20);
 
    return res.status(200).json({ success: true, events });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};