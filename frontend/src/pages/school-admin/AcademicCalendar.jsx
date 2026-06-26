// src/pages/school-admin/curriculum/AcademicCalendar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// KEY FIXES vs original:
//  1. Uses authFetch from AuthContext (httpOnly cookie auth) — NOT localStorage
//  2. useMock defaults to FALSE so events actually go to MongoDB
//  3. After create/update/delete → calls broadcastEventMutation() so teacher
//     and student views refresh in real-time (BroadcastChannel + 60s poll)
//  4. All API errors are surfaced to the user via toast
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Clock,
  Users,
  BookOpen,
  Award,
  AlertCircle,
  X,
  Save,
  Printer,
  MapPin,
  FileText,
  Star,
  Sun,
  CheckCircle,
  RefreshCw,
  Tag,
  ToggleLeft,
  ToggleRight,
  Eye,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { broadcastEventMutation } from "../../hooks/useSchoolEvents";

// ─── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORIES = [
  {
    value: "exam",
    label: "Exams",
    color: "#EF4444",
    bg: "#FEF2F2",
    text: "#B91C1C",
    icon: FileText,
  },
  {
    value: "holiday",
    label: "Holidays",
    color: "#10B981",
    bg: "#ECFDF5",
    text: "#065F46",
    icon: Sun,
  },
  {
    value: "event",
    label: "Events",
    color: "#3B82F6",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    icon: Star,
  },
  {
    value: "meeting",
    label: "Meetings",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    text: "#5B21B6",
    icon: Users,
  },
  {
    value: "sports",
    label: "Sports",
    color: "#F97316",
    bg: "#FFF7ED",
    text: "#C2410C",
    icon: Award,
  },
  {
    value: "academic",
    label: "Academic",
    color: "#6366F1",
    bg: "#EEF2FF",
    text: "#3730A3",
    icon: BookOpen,
  },
];

const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));
const getCat = (val) =>
  catMap[val] || {
    color: "#6B7280",
    bg: "#F9FAFB",
    text: "#374151",
    icon: Tag,
    label: val,
  };

// ─── Mock data (only when toggle is ON) ───────────────────────────────────────
const today = new Date();
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const MOCK_EVENTS = [
  {
    _id: "m1",
    title: "Midterm Exams",
    category: "exam",
    startDate: ymd(new Date(today.getFullYear(), today.getMonth(), 15)),
    endDate: ymd(new Date(today.getFullYear(), today.getMonth(), 20)),
    description: "All grades",
    location: "All Classrooms",
    participants: ["All Students"],
    reminder: true,
    allDay: true,
  },
  {
    _id: "m2",
    title: "Sports Day",
    category: "sports",
    startDate: ymd(new Date(today.getFullYear(), today.getMonth(), 22)),
    endDate: ymd(new Date(today.getFullYear(), today.getMonth(), 22)),
    description: "Annual event",
    location: "Ground",
    participants: ["All"],
    reminder: true,
    allDay: true,
  },
  {
    _id: "m3",
    title: "Parent-Teacher Meeting",
    category: "meeting",
    startDate: ymd(new Date(today.getFullYear(), today.getMonth(), 25)),
    endDate: ymd(new Date(today.getFullYear(), today.getMonth(), 25)),
    description: "Quarterly review",
    location: "Classrooms",
    participants: ["Teachers", "Parents"],
    reminder: true,
    allDay: false,
    startTime: "14:00",
    endTime: "18:00",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AcademicCalendar() {
  // ── FIX: Use authFetch (cookie-based) instead of localStorage token ────────
  const { authFetch, isAuthenticated } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [filterCat, setFilterCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [useMock, setUseMock] = useState(false); // ← FALSE = real MongoDB

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const todayDate = new Date();

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Wrapper: authFetch → throws on error so callers can catch cleanly ──────
  const apiFetch = useCallback(
    async (path, opts = {}) => {
      const mergedOpts = {
        ...opts,
        headers: {
          "Content-Type": "application/json",
          ...opts.headers, // allow callers to override
        },
      };
      const res = await authFetch(path, mergedOpts);
      if (!res) throw new Error("Session expired — please log in again");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      return res.json();
    },
    [authFetch],
  );

  // ── Load events ───────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      if (useMock) {
        setTimeout(() => {
          setEvents(MOCK_EVENTS);
          setLoading(false);
        }, 300);
        return;
      }
      const res = await authFetch(
        `/calendar?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`,
      );
      if (!res) return; // auth failed, user redirected
      const data = await res.json();
      if (data.success) setEvents(data.events);
      else showToast(data.message || "Failed to load events", "error");
    } catch {
      showToast("Network error – switching to offline data", "warning");
      setEvents(MOCK_EVENTS);
    } finally {
      if (!useMock) setLoading(false);
    }
  }, [currentDate, useMock, authFetch]);

  useEffect(() => {
    if (isAuthenticated || useMock) {
      loadEvents();
    }
  }, [loadEvents, isAuthenticated, useMock]);

  // ── Replace handleCreate ───────────────────────────────────────────────────
  const handleCreate = async (data) => {
    try {
      if (useMock) {
        setEvents((prev) => [...prev, { ...data, _id: Date.now().toString() }]);
        broadcastEventMutation();
        showToast("Event created successfully");
        setModal(null);
        return;
      }
      const res = await authFetch("/calendar", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res) return;
      const json = await res.json();
      if (json.success) {
        setEvents((prev) => [...prev, json.event]);
        broadcastEventMutation(); // ← tells teacher/student views to refresh
        showToast("Event created");
        setModal(null);
      } else {
        showToast(json.message || "Failed to create event", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  // ── Replace handleUpdate ──────────────────────────────────────────────────
  const handleUpdate = async (id, data) => {
    try {
      if (useMock) {
        setEvents((prev) =>
          prev.map((e) => (e._id === id ? { ...e, ...data } : e)),
        );
        broadcastEventMutation();
        showToast("Event updated successfully");
        setModal(null);
        setSelectedEvent(null);
        return;
      }
      const res = await authFetch(`/calendar/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res) return;
      const json = await res.json();
      if (json.success) {
        setEvents((prev) => prev.map((e) => (e._id === id ? json.event : e)));
        broadcastEventMutation();
        showToast("Event updated");
        setModal(null);
        setSelectedEvent(null);
      } else {
        showToast(json.message || "Failed to update event", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  // ── Replace handleDelete ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      if (useMock) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
        broadcastEventMutation();
        showToast("Event deleted");
        setModal(null);
        setSelectedEvent(null);
        return;
      }
      const res = await authFetch(`/calendar/${id}`, { method: "DELETE" });
      if (!res) return;
      const json = await res.json();
      if (json.success) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
        broadcastEventMutation();
        showToast("Event deleted");
        setModal(null);
        setSelectedEvent(null);
      } else {
        showToast(json.message || "Failed to delete event", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };
  // ── Calendar grid helpers ─────────────────────────────────────────────────
  const getEventsForDate = (day) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events
      .filter((ev) => ds >= ev.startDate && ds <= ev.endDate)
      .filter((ev) => filterCat === "all" || ev.category === filterCat)
      .filter(
        (ev) =>
          !searchTerm ||
          ev.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  };

  const handleDayClick = (day) => {
    const evs = getEventsForDate(day);
    const date = new Date(year, month, day);
    setSelectedDate(date);
    if (evs.length === 0) {
      setModal("add");
    } else if (evs.length === 1) {
      setSelectedEvent(evs[0]);
      setModal("view");
    } else {
      setDayEvents(evs);
      setModal("dayEvents");
    }
  };

  const viewMonthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const viewMonthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const upcoming = events
    .filter(
      (ev) => ev.startDate <= viewMonthEnd && ev.endDate >= viewMonthStart,
    )
    .filter((ev) => filterCat === "all" || ev.category === filterCat)
    .filter(
      (ev) =>
        !searchTerm ||
        ev.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {toast && (
        <div
          style={{
            ...S.toast,
            background:
              toast.type === "error"
                ? "#EF4444"
                : toast.type === "warning"
                  ? "#F59E0B"
                  : "#10B981",
          }}
        >
          {toast.type === "error" ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div style={S.container}>
        {/* Header */}
        <header style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerIcon}>
              <Calendar size={28} color="#fff" />
            </div>
            <div>
              <h1 style={S.h1}>Academic Calendar</h1>
              <p style={S.subTitle}>
                Academic Year {year}–{year + 1}
                {!useMock && isAuthenticated && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: "#10B981",
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    <Wifi
                      size={10}
                      style={{ display: "inline", marginRight: 3 }}
                    />
                    Live
                  </span>
                )}
              </p>
            </div>
          </div>
          <div style={S.headerActions}>
            <button
              style={S.btnPrimary}
              onClick={() => {
                setSelectedDate(todayDate);
                setSelectedEvent(null);
                setModal("add");
              }}
            >
              <Plus size={16} /> Add Event
            </button>
            <button
              style={S.btnIcon}
              title="Print"
              onClick={() => window.print()}
            >
              <Printer size={18} />
            </button>
            <button
              style={S.btnIcon}
              title="Refresh"
              onClick={loadEvents}
              disabled={loading}
            >
              <RefreshCw
                size={18}
                style={loading ? { animation: "spin 1s linear infinite" } : {}}
              />
            </button>
            {/* Mock ↔ Live */}
            <button
              style={{
                ...S.btnIcon,
                background: useMock ? "#FEF9C3" : "#DCFCE7",
                color: useMock ? "#92400E" : "#166534",
                fontWeight: 700,
                fontSize: 11,
                padding: "0 12px",
                width: "auto",
                gap: 5,
              }}
              title={
                useMock
                  ? "Mock mode — click for Live API"
                  : "Live API — click for Mock"
              }
              onClick={() => setUseMock((v) => !v)}
            >
              {useMock ? (
                <>
                  <ToggleLeft size={15} /> Mock
                </>
              ) : (
                <>
                  <ToggleRight size={15} /> Live
                </>
              )}
            </button>
          </div>
        </header>

        {/* Auth warning */}
        {!useMock && !isAuthenticated && (
          <div style={S.warnBanner}>
            <WifiOff size={16} />
            <strong>Not authenticated.</strong>&nbsp;Log in first, or toggle to
            Mock mode to preview the UI.
          </div>
        )}

        {/* Controls */}
        <div style={S.controlBar}>
          <div style={S.navGroup}>
            <button
              style={S.navBtn}
              onClick={() => setCurrentDate(new Date(year, month - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              style={S.todayBtn}
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </button>
            <button
              style={S.navBtn}
              onClick={() => setCurrentDate(new Date(year, month + 1))}
            >
              <ChevronRight size={18} />
            </button>
            <span style={S.monthLabel}>
              {MONTH_NAMES[month]} {year}
            </span>
          </div>
          <div style={S.searchGroup}>
            <div style={S.searchWrap}>
              <Search size={15} style={S.searchIcon} />
              <input
                style={S.searchInput}
                placeholder="Search events…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              style={S.select}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={S.pills}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = filterCat === cat.value;
            return (
              <button
                key={cat.value}
                style={{
                  ...S.pill,
                  background: active ? cat.bg : "#F1F5F9",
                  color: active ? cat.text : "#64748B",
                  border: `1.5px solid ${active ? cat.color + "55" : "transparent"}`,
                }}
                onClick={() => setFilterCat(active ? "all" : cat.value)}
              >
                <Icon size={12} /> {cat.label}
              </button>
            );
          })}
        </div>

        {/* Calendar Grid */}
        <div style={S.calCard}>
          {loading && (
            <div style={S.loadingOverlay}>
              <RefreshCw
                size={24}
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          )}
          <div style={S.dayHeaders}>
            {DAY_NAMES.map((d) => (
              <div key={d} style={S.dayHeader}>
                {d}
              </div>
            ))}
          </div>
          <div style={S.grid}>
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvs = getEventsForDate(day);
              const isToday =
                todayDate.getFullYear() === year &&
                todayDate.getMonth() === month &&
                todayDate.getDate() === day;
              const isSel =
                selectedDate?.getFullYear() === year &&
                selectedDate?.getMonth() === month &&
                selectedDate?.getDate() === day;
              return (
                <div
                  key={day}
                  style={{
                    ...S.cell,
                    background: isToday
                      ? "#EFF6FF"
                      : isSel
                        ? "#F5F3FF"
                        : "#FAFAFA",
                    border: `2px solid ${isToday ? "#3B82F6" : isSel ? "#8B5CF6" : "#E2E8F0"}`,
                  }}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={(e) => {
                    if (!isToday && !isSel)
                      e.currentTarget.style.borderColor = "#CBD5E1";
                  }}
                  onMouseLeave={(e) => {
                    if (!isToday && !isSel)
                      e.currentTarget.style.borderColor = "#E2E8F0";
                  }}
                >
                  <div
                    style={{
                      ...S.dayNum,
                      color: isToday ? "#2563EB" : "#374151",
                      background: isToday ? "#DBEAFE" : "transparent",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {day}
                  </div>
                  <div style={S.eventDots}>
                    {dayEvs.slice(0, 2).map((ev) => {
                      const cat = getCat(ev.category);
                      return (
                        <div
                          key={ev._id}
                          style={{
                            ...S.eventChip,
                            background: cat.bg,
                            color: cat.text,
                            borderLeft: `3px solid ${cat.color}`,
                          }}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvs.length > 2 && (
                      <div style={S.moreChip}>+{dayEvs.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Events This Month */}
        <div style={S.upcomingCard}>
          <h3 style={S.sectionTitle}>
            <Clock size={18} color="#3B82F6" /> Events in {MONTH_NAMES[month]}{" "}
            {year}
            <span style={S.badge}>{upcoming.length}</span>
          </h3>
          {upcoming.length === 0 && !loading && (
            <p
              style={{
                color: "#94A3B8",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              {useMock
                ? "Mock mode — toggle Live to load real MongoDB events."
                : `No events in ${MONTH_NAMES[month]} — click any date to add one.`}
            </p>
          )}
          <div style={S.eventList}>
            {upcoming.map((ev) => (
              <EventRow
                key={ev._id}
                event={ev}
                onView={() => {
                  setSelectedEvent(ev);
                  setModal("view");
                }}
                onEdit={() => {
                  setSelectedEvent(ev);
                  setModal("edit");
                }}
                onDelete={() => handleDelete(ev._id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === "add" || modal === "edit") && (
        <EventFormModal
          event={modal === "edit" ? selectedEvent : null}
          defaultDate={selectedDate}
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onSubmit={(data) =>
            modal === "edit"
              ? handleUpdate(selectedEvent._id, data)
              : handleCreate(data)
          }
        />
      )}
      {modal === "view" && selectedEvent && (
        <EventViewModal
          event={selectedEvent}
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onEdit={() => setModal("edit")}
          onDelete={() => handleDelete(selectedEvent._id)}
        />
      )}
      {modal === "dayEvents" && (
        <DayEventsModal
          events={dayEvents}
          date={selectedDate}
          onClose={() => setModal(null)}
          onView={(ev) => {
            setSelectedEvent(ev);
            setModal("view");
          }}
          onEdit={(ev) => {
            setSelectedEvent(ev);
            setModal("edit");
          }}
          onDelete={(id) => handleDelete(id)}
          onAdd={() => setModal("add")}
        />
      )}

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: 2px solid #3B82F6; outline-offset: 1px; }
      `}</style>
    </div>
  );
}

// ─── EventRow ─────────────────────────────────────────────────────────────────
function EventRow({ event, onView, onEdit, onDelete }) {
  const cat = getCat(event.category);
  const Icon = cat.icon;
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        ...S.eventRow,
        background: hov ? cat.bg : "#fff",
        borderLeft: `4px solid ${cat.color}`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ ...S.evtIconWrap, background: cat.bg }}>
        <Icon size={16} color={cat.color} />
      </div>
      <div style={S.evtBody}>
        <div style={S.evtTitle}>{event.title}</div>
        <div style={S.evtMeta}>
          <span>
            <Calendar size={11} /> {event.startDate}
            {event.endDate !== event.startDate ? ` → ${event.endDate}` : ""}
          </span>
          {event.location && (
            <span>
              <MapPin size={11} /> {event.location}
            </span>
          )}
          {!event.allDay && event.startTime && (
            <span>
              <Clock size={11} /> {event.startTime}–{event.endTime}
            </span>
          )}
        </div>
      </div>
      <div style={S.evtActions}>
        {event.reminder && <Bell size={14} color="#F59E0B" />}
        <button style={S.iconBtn} onClick={onView}>
          <Eye size={14} />
        </button>
        <button style={S.iconBtn} onClick={onEdit}>
          <Edit2 size={14} />
        </button>
        <button style={{ ...S.iconBtn, color: "#EF4444" }} onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── EventFormModal ───────────────────────────────────────────────────────────
function EventFormModal({ event, defaultDate, onClose, onSubmit }) {
  const fmt = (d) => {
    if (!d) return "";
    if (d instanceof Date) return d.toISOString().split("T")[0];
    return d;
  };
  const [form, setForm] = useState({
    title: event?.title || "",
    category: event?.category || "event",
    startDate: event?.startDate || fmt(defaultDate),
    endDate: event?.endDate || fmt(defaultDate),
    description: event?.description || "",
    location: event?.location || "",
    allDay: event?.allDay !== undefined ? event.allDay : true,
    startTime: event?.startTime || "09:00",
    endTime: event?.endTime || "10:00",
    reminder: event?.reminder || false,
    participants: Array.isArray(event?.participants)
      ? event.participants.join(", ")
      : "",
  });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.startDate) e.startDate = "Start date required";
    if (!form.endDate) e.endDate = "End date required";
    if (form.endDate < form.startDate) e.endDate = "End must be ≥ start";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      participants: form.participants
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <Overlay onClose={onClose}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <h2 style={S.modalTitle}>{event ? "Edit Event" : "Add New Event"}</h2>
          <button style={S.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={S.modalBody}>
          <Field label="Event Title" error={errors.title} required>
            <input
              style={inp(errors.title)}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Annual Sports Day"
            />
          </Field>
          <div style={S.row2}>
            <Field label="Category" required>
              <select
                style={inp()}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reminder">
              <label style={S.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.reminder}
                  onChange={(e) => set("reminder", e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#3B82F6" }}
                />
                Send notifications
              </label>
            </Field>
          </div>
          <div style={S.row2}>
            <Field label="Start Date" error={errors.startDate} required>
              <input
                style={inp(errors.startDate)}
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
            <Field label="End Date" error={errors.endDate} required>
              <input
                style={inp(errors.endDate)}
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </Field>
          </div>
          <Field label="">
            <label style={S.checkLabel}>
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) => set("allDay", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#3B82F6" }}
              />
              All Day Event
            </label>
          </Field>
          {!form.allDay && (
            <div style={S.row2}>
              <Field label="Start Time">
                <input
                  style={inp()}
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                />
              </Field>
              <Field label="End Time">
                {" "}
                <input
                  style={inp()}
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                />
              </Field>
            </div>
          )}
          <Field label="Location">
            <input
              style={inp()}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Main Hall"
            />
          </Field>
          <Field label="Participants (comma separated)">
            <input
              style={inp()}
              value={form.participants}
              onChange={(e) => set("participants", e.target.value)}
              placeholder="e.g. All Students, Teachers"
            />
          </Field>
          <Field label="Description">
            <textarea
              style={{ ...inp(), resize: "vertical", minHeight: 80 }}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description…"
            />
          </Field>
        </div>
        <div style={S.modalFooter}>
          <button style={S.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button style={S.btnPrimary} onClick={handleSubmit}>
            <Save size={16} /> {event ? "Update Event" : "Create Event"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── EventViewModal ───────────────────────────────────────────────────────────
function EventViewModal({ event, onClose, onEdit, onDelete }) {
  const cat = getCat(event.category);
  const Icon = cat.icon;
  return (
    <Overlay onClose={onClose}>
      <div style={{ ...S.modal, maxWidth: 520 }}>
        <div
          style={{
            ...S.modalHeader,
            background: cat.bg,
            borderBottom: `2px solid ${cat.color}33`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: `${cat.color}22`,
                borderRadius: 8,
                padding: 8,
              }}
            >
              <Icon size={20} color={cat.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: cat.text,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {cat.label}
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1E293B",
                }}
              >
                {event.title}
              </h2>
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={S.modalBody}>
          {event.description && (
            <p style={{ color: "#64748B", margin: "0 0 20px" }}>
              {event.description}
            </p>
          )}
          <div style={S.infoGrid}>
            <InfoItem
              icon={<Calendar size={15} />}
              label="Dates"
              value={`${event.startDate}${event.endDate !== event.startDate ? ` → ${event.endDate}` : ""}`}
            />
            {!event.allDay && event.startTime && (
              <InfoItem
                icon={<Clock size={15} />}
                label="Time"
                value={`${event.startTime} – ${event.endTime}`}
              />
            )}
            {event.location && (
              <InfoItem
                icon={<MapPin size={15} />}
                label="Location"
                value={event.location}
              />
            )}
            <InfoItem
              icon={<Tag size={15} />}
              label="Type"
              value={event.allDay ? "All Day" : "Timed"}
            />
          </div>
          {event.participants?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={S.infoLabel}>Participants</div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {event.participants.map((p, i) => (
                  <span key={i} style={S.participantTag}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {event.reminder && (
            <div style={S.reminderBadge}>
              <Bell size={14} color="#D97706" /> Reminder enabled
            </div>
          )}
        </div>
        <div style={S.modalFooter}>
          <button
            style={{ ...S.btnGhost, color: "#EF4444", borderColor: "#EF4444" }}
            onClick={onDelete}
          >
            <Trash2 size={15} /> Delete
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnGhost} onClick={onClose}>
              Close
            </button>
            <button style={S.btnPrimary} onClick={onEdit}>
              <Edit2 size={15} /> Edit
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── DayEventsModal ───────────────────────────────────────────────────────────
function DayEventsModal({
  events,
  date,
  onClose,
  onView,
  onEdit,
  onDelete,
  onAdd,
}) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ ...S.modal, maxWidth: 480 }}>
        <div style={S.modalHeader}>
          <h2 style={S.modalTitle}>{date?.toDateString()}</h2>
          <button style={S.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={S.modalBody}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map((ev) => {
              const cat = getCat(ev.category);
              const Icon = cat.icon;
              return (
                <div
                  key={ev._id}
                  style={{
                    border: `1px solid ${cat.color}44`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    background: cat.bg,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Icon size={18} color={cat.color} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1E293B",
                        fontSize: 14,
                      }}
                    >
                      {ev.title}
                    </div>
                    {ev.location && (
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        <MapPin size={10} /> {ev.location}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={S.iconBtn} onClick={() => onView(ev)}>
                      <Eye size={14} />
                    </button>
                    <button style={S.iconBtn} onClick={() => onEdit(ev)}>
                      <Edit2 size={14} />
                    </button>
                    <button
                      style={{ ...S.iconBtn, color: "#EF4444" }}
                      onClick={() => onDelete(ev._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={S.modalFooter}>
          <button style={S.btnGhost} onClick={onClose}>
            Close
          </button>
          <button style={S.btnPrimary} onClick={onAdd}>
            <Plus size={15} /> Add Event
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      style={S.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ animation: "fadeIn .18s ease" }}>{children}</div>
    </div>
  );
}
function Field({ label, children, error, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={S.label}>
          {label}
          {required && <span style={{ color: "#EF4444" }}> *</span>}
        </label>
      )}
      {children}
      {error && (
        <div style={{ color: "#EF4444", fontSize: 12, marginTop: 3 }}>
          {error}
        </div>
      )}
    </div>
  );
}
function InfoItem({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ color: "#94A3B8", marginTop: 1 }}>{icon}</div>
      <div>
        <div style={S.infoLabel}>{label}</div>
        <div style={{ fontSize: 14, color: "#1E293B", fontWeight: 500 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

const inp = (err) => ({
  ...S.input,
  border: `1.5px solid ${err ? "#EF4444" : "#E2E8F0"}`,
});

const S = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    padding: 24,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    background: "#fff",
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 4px rgba(0,0,0,.07)",
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  h1: { margin: 0, fontSize: 26, fontWeight: 800, color: "#1E293B" },
  subTitle: { margin: 0, fontSize: 13, color: "#94A3B8", marginTop: 2 },
  headerActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    background: "#3B82F6",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  btnGhost: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 16px",
    background: "#fff",
    color: "#374151",
    border: "1.5px solid #E2E8F0",
    borderRadius: 9,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  btnIcon: {
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F1F5F9",
    border: "none",
    borderRadius: 9,
    cursor: "pointer",
    color: "#64748B",
  },
  controlBar: {
    background: "#fff",
    borderRadius: 14,
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    flexWrap: "wrap",
    gap: 12,
  },
  navGroup: { display: "flex", alignItems: "center", gap: 6 },
  navBtn: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1.5px solid #E2E8F0",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    color: "#64748B",
  },
  todayBtn: {
    padding: "6px 16px",
    border: "1.5px solid #E2E8F0",
    borderRadius: 8,
    background: "#fff",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1E293B",
    marginLeft: 6,
  },
  searchGroup: { display: "flex", gap: 8, flexWrap: "wrap" },
  searchWrap: { position: "relative" },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94A3B8",
  },
  searchInput: {
    paddingLeft: 32,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    border: "1.5px solid #E2E8F0",
    borderRadius: 9,
    fontSize: 13,
    background: "#F8FAFC",
    width: 200,
  },
  select: {
    padding: "8px 12px",
    border: "1.5px solid #E2E8F0",
    borderRadius: 9,
    fontSize: 13,
    background: "#F8FAFC",
    cursor: "pointer",
  },
  pills: { display: "flex", gap: 8, flexWrap: "wrap" },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .15s",
  },
  calCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "20px 16px",
    boxShadow: "0 1px 4px rgba(0,0,0,.07)",
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    background: "#ffffffaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    zIndex: 10,
    color: "#3B82F6",
  },
  dayHeaders: {
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
    gap: 4,
    marginBottom: 6,
  },
  dayHeader: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#94A3B8",
    padding: "6px 0",
    letterSpacing: 0.5,
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 },
  cell: {
    minHeight: 90,
    borderRadius: 10,
    padding: "6px",
    transition: "border-color .15s, background .15s",
    overflow: "hidden",
    cursor: "pointer",
  },
  dayNum: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  eventDots: { display: "flex", flexDirection: "column", gap: 2 },
  eventChip: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 5px",
    borderRadius: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  moreChip: { fontSize: 10, color: "#94A3B8", fontWeight: 600, paddingLeft: 4 },
  upcomingCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,.07)",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 800,
    color: "#1E293B",
    margin: "0 0 16px",
    flexWrap: "wrap",
  },
  badge: {
    background: "#EFF6FF",
    color: "#2563EB",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
  },
  eventList: { display: "flex", flexDirection: "column", gap: 8 },
  eventRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #E2E8F0",
    transition: "background .15s",
  },
  evtIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  evtBody: { flex: 1, minWidth: 0 },
  evtTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1E293B",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  evtMeta: {
    display: "flex",
    gap: 10,
    marginTop: 3,
    fontSize: 11,
    color: "#94A3B8",
    flexWrap: "wrap",
    alignItems: "center",
  },
  evtActions: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748B",
    padding: 4,
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
    backdropFilter: "blur(2px)",
  },
  modal: {
    background: "#fff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 620,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,.18)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 22px",
    borderBottom: "1px solid #E2E8F0",
  },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: "#1E293B" },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748B",
    padding: 4,
    borderRadius: 6,
  },
  modalBody: { padding: "20px 22px", overflowY: "auto", flex: 1 },
  modalFooter: {
    padding: "16px 22px",
    borderTop: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: 14,
    background: "#F8FAFC",
    color: "#1E293B",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#374151",
    cursor: "pointer",
    fontWeight: 500,
    paddingTop: 6,
  },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  infoLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  participantTag: {
    background: "#EFF6FF",
    color: "#2563EB",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
  },
  reminderBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#FFFBEB",
    color: "#92400E",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    marginTop: 14,
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
    borderRadius: 10,
    padding: "12px 18px",
    fontWeight: 600,
    fontSize: 14,
    zIndex: 2000,
    boxShadow: "0 8px 24px rgba(0,0,0,.18)",
    animation: "fadeIn .2s ease",
  },
  warnBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FEF9C3",
    border: "1.5px solid #FDE047",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 13,
    color: "#92400E",
    fontWeight: 600,
  },
};
