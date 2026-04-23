// src/pages/school-admin/curriculum/AcademicCalendar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, Edit2, Trash2, Download, ChevronLeft, ChevronRight,
  Search, Bell, Clock, Users, BookOpen, Award, AlertCircle, X, Save,
  Printer, MapPin, FileText, Star, Zap, GraduationCap, Sun, Filter,
  CheckCircle, RefreshCw, Tag, AlignLeft, ToggleLeft, ToggleRight, Eye
} from 'lucide-react';

// ─── API base ─────────────────────────────────────────────────────────────────
// FIX: was '/api/calendar' — server mounts everything under /api/v1/
// VITE_API_URL should be "http://localhost:5000" (no trailing slash, no /api/v1)
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1';
const BASE     = `${API_BASE}/calendar`;

const getToken  = () => localStorage.getItem('token') || '';
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const api = {
  getEvents:   (params = {}) => fetch(`${BASE}?${new URLSearchParams(params)}`, { headers: authHeader() }).then(r => r.json()),
  createEvent: (data)        => fetch(BASE,             { method: 'POST',   headers: authHeader(), body: JSON.stringify(data) }).then(r => r.json()),
  updateEvent: (id, data)    => fetch(`${BASE}/${id}`,  { method: 'PUT',    headers: authHeader(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteEvent: (id)          => fetch(`${BASE}/${id}`,  { method: 'DELETE', headers: authHeader() }).then(r => r.json()),
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CATEGORIES = [
  { value: 'exam',     label: 'Exams',    color: '#EF4444', bg: '#FEF2F2', text: '#B91C1C', icon: FileText },
  { value: 'holiday',  label: 'Holidays', color: '#10B981', bg: '#ECFDF5', text: '#065F46', icon: Sun      },
  { value: 'event',    label: 'Events',   color: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', icon: Star     },
  { value: 'meeting',  label: 'Meetings', color: '#8B5CF6', bg: '#F5F3FF', text: '#5B21B6', icon: Users    },
  { value: 'sports',   label: 'Sports',   color: '#F97316', bg: '#FFF7ED', text: '#C2410C', icon: Award    },
  { value: 'academic', label: 'Academic', color: '#6366F1', bg: '#EEF2FF', text: '#3730A3', icon: BookOpen },
];

const catMap = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));
const getCat = (val) => catMap[val] || { color: '#6B7280', bg: '#F9FAFB', text: '#374151', icon: Tag, label: val };

// ─── Mock data (used when useMock = true) ─────────────────────────────────────
const MOCK_EVENTS = [
  { _id:'1', title:'First Semester Midterm Exams', category:'exam',     startDate:'2024-04-15', endDate:'2024-04-20', description:'Midterm exams for all grades', location:'All Classrooms', participants:['All Students','All Teachers'], reminder:true,  allDay:true  },
  { _id:'2', title:'Spring Break',                 category:'holiday',  startDate:'2024-04-01', endDate:'2024-04-07', description:'Spring vacation',               location:'N/A',            participants:['All'],                          reminder:false, allDay:true  },
  { _id:'3', title:'Annual Science Fair',          category:'event',    startDate:'2024-04-10', endDate:'2024-04-10', description:'Science project exhibition',     location:'Main Hall',       participants:['Grades 6-12','Parents'],         reminder:true,  allDay:false, startTime:'09:00', endTime:'15:00' },
  { _id:'4', title:'Parent-Teacher Conference',    category:'meeting',  startDate:'2024-04-12', endDate:'2024-04-12', description:'Quarterly meetings',            location:'Classrooms',      participants:['Teachers','Parents'],            reminder:true,  allDay:false, startTime:'14:00', endTime:'18:00' },
  { _id:'5', title:'Basketball Tournament',        category:'sports',   startDate:'2024-04-18', endDate:'2024-04-20', description:'Regional championship',         location:'Sports Complex',  participants:['Basketball Team'],               reminder:true,  allDay:true  },
  { _id:'6', title:'Last Day of Classes',          category:'academic', startDate:'2024-05-30', endDate:'2024-05-30', description:'Final day of semester',         location:'School',          participants:['All'],                          reminder:true,  allDay:true  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AcademicCalendar() {
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [events,        setEvents]        = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selectedDate,  setSelectedDate]  = useState(null);
  const [modal,         setModal]         = useState(null);   // null | 'add' | 'edit' | 'view' | 'dayEvents'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayEvents,     setDayEvents]     = useState([]);
  const [filterCat,     setFilterCat]     = useState('all');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [toast,         setToast]         = useState(null);
  const [useMock,       setUseMock]       = useState(true);   // flip to false when backend is running

  // ── Load events ──────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      if (useMock) {
        setTimeout(() => { setEvents(MOCK_EVENTS); setLoading(false); }, 300);
        return;
      }
      const res = await api.getEvents({ month: currentDate.getMonth() + 1, year: currentDate.getFullYear() });
      if (res.success) setEvents(res.events);
      else showToast(res.message || 'Failed to load events', 'error');
    } catch {
      showToast('Network error – switching to offline data', 'warning');
      setEvents(MOCK_EVENTS);
    } finally {
      if (!useMock) setLoading(false);
    }
  }, [currentDate, useMock]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    try {
      if (useMock) {
        setEvents(prev => [...prev, { ...data, _id: Date.now().toString() }]);
        showToast('Event created successfully');
        setModal(null);
        return;
      }
      const res = await api.createEvent(data);
      if (res.success) { setEvents(prev => [...prev, res.event]); showToast('Event created'); setModal(null); }
      else showToast(res.message || 'Failed to create event', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const handleUpdate = async (id, data) => {
    try {
      if (useMock) {
        setEvents(prev => prev.map(e => e._id === id ? { ...e, ...data } : e));
        showToast('Event updated successfully');
        setModal(null); setSelectedEvent(null);
        return;
      }
      const res = await api.updateEvent(id, data);
      if (res.success) { setEvents(prev => prev.map(e => e._id === id ? res.event : e)); showToast('Event updated'); setModal(null); setSelectedEvent(null); }
      else showToast(res.message || 'Failed to update event', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      if (useMock) {
        setEvents(prev => prev.filter(e => e._id !== id));
        showToast('Event deleted');
        setModal(null); setSelectedEvent(null);
        return;
      }
      const res = await api.deleteEvent(id);
      if (res.success) { setEvents(prev => prev.filter(e => e._id !== id)); showToast('Event deleted'); setModal(null); setSelectedEvent(null); }
      else showToast(res.message || 'Failed to delete event', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  // ── Calendar grid helpers ─────────────────────────────────────────────────
  const year       = currentDate.getFullYear();
  const month      = currentDate.getMonth();
  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today      = new Date();

  const getEventsForDate = (day) => {
    const d  = new Date(year, month, day);
    const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events
      .filter(ev => ds >= ev.startDate && ds <= ev.endDate)
      .filter(ev => filterCat === 'all' || ev.category === filterCat)
      .filter(ev => !searchTerm || ev.title.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const handleDayClick = (day) => {
    const evs  = getEventsForDate(day);
    const date = new Date(year, month, day);
    setSelectedDate(date);
    if      (evs.length === 0) { setModal('add'); }
    else if (evs.length === 1) { setSelectedEvent(evs[0]); setModal('view'); }
    else                       { setDayEvents(evs); setModal('dayEvents'); }
  };

  // ── Upcoming list — shows ALL events that appear in the currently viewed month
  //    (same window the calendar grid uses, so they're always in sync)
  const viewMonthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const viewMonthEnd   = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const upcoming = events
    .filter(ev => ev.startDate <= viewMonthEnd && ev.endDate >= viewMonthStart) // overlaps this month
    .filter(ev => filterCat === 'all' || ev.category === filterCat)
    .filter(ev => !searchTerm || ev.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.startDate.localeCompare(b.startDate)); // no slice — show all of them

  return (
    <div style={styles.page}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === 'error' ? '#EF4444' : toast.type === 'warning' ? '#F59E0B' : '#10B981' }}>
          {toast.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle size={16}/>}
          <span>{toast.msg}</span>
        </div>
      )}

      <div style={styles.container}>
        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}><Calendar size={28} color="#fff"/></div>
            <div>
              <h1 style={styles.h1}>Academic Calendar</h1>
              <p style={styles.subTitle}>Academic Year {year}–{year + 1}</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.btnPrimary} onClick={() => { setSelectedDate(today); setSelectedEvent(null); setModal('add'); }}>
              <Plus size={16}/> Add Event
            </button>
            <button style={styles.btnIcon} title="Print" onClick={() => window.print()}><Printer size={18}/></button>
            <button style={styles.btnIcon} title="Refresh" onClick={loadEvents}><RefreshCw size={18}/></button>
            {/* Toggle mock ↔ live. Yellow = mock mode, green = live API */}
            <button
              style={{ ...styles.btnIcon, background: useMock ? '#FEF9C3' : '#DCFCE7', color: useMock ? '#92400E' : '#166534' }}
              title={useMock ? 'Mock mode – click to use live API' : 'Live API mode – click for mock data'}
              onClick={() => setUseMock(v => !v)}
            >
              {useMock ? <ToggleLeft size={18}/> : <ToggleRight size={18}/>}
            </button>
          </div>
        </header>

        {/* ── Controls Bar ── */}
        <div style={styles.controlBar}>
          <div style={styles.navGroup}>
            <button style={styles.navBtn} onClick={() => setCurrentDate(new Date(year, month - 1))}><ChevronLeft  size={18}/></button>
            <button style={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>Today</button>
            <button style={styles.navBtn} onClick={() => setCurrentDate(new Date(year, month + 1))}><ChevronRight size={18}/></button>
            <span style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</span>
          </div>
          <div style={styles.searchGroup}>
            <div style={styles.searchWrap}>
              <Search size={15} style={styles.searchIcon}/>
              <input
                style={styles.searchInput}
                placeholder="Search events…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select style={styles.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div style={styles.pills}>
          {CATEGORIES.map(cat => {
            const Icon   = cat.icon;
            const active = filterCat === cat.value;
            return (
              <button
                key={cat.value}
                style={{ ...styles.pill, background: active ? cat.bg : '#F1F5F9', color: active ? cat.text : '#64748B', border: `1.5px solid ${active ? cat.color + '55' : 'transparent'}` }}
                onClick={() => setFilterCat(active ? 'all' : cat.value)}
              >
                <Icon size={12}/> {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Calendar Grid ── */}
        <div style={styles.calCard}>
          {loading && (
            <div style={styles.loadingOverlay}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }}/>
            </div>
          )}

          <div style={styles.dayHeaders}>
            {DAY_NAMES.map(d => <div key={d} style={styles.dayHeader}>{d}</div>)}
          </div>

          <div style={styles.grid}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`}/>)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day    = i + 1;
              const dayEvs = getEventsForDate(day);
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const isSel   = selectedDate?.getFullYear() === year && selectedDate?.getMonth() === month && selectedDate?.getDate() === day;

              return (
                <div
                  key={day}
                  style={{
                    ...styles.cell,
                    background:  isToday ? '#EFF6FF' : isSel ? '#F5F3FF' : '#FAFAFA',
                    border:      `2px solid ${isToday ? '#3B82F6' : isSel ? '#8B5CF6' : '#E2E8F0'}`,
                    cursor:      'pointer',
                  }}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={e => { if (!isToday && !isSel) e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { if (!isToday && !isSel) e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <div style={{ ...styles.dayNum, color: isToday ? '#2563EB' : '#374151', background: isToday ? '#DBEAFE' : 'transparent', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {day}
                  </div>
                  <div style={styles.eventDots}>
                    {dayEvs.slice(0, 2).map(ev => {
                      const cat = getCat(ev.category);
                      return (
                        <div key={ev._id} style={{ ...styles.eventChip, background: cat.bg, color: cat.text, borderLeft: `3px solid ${cat.color}` }}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvs.length > 2 && <div style={styles.moreChip}>+{dayEvs.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Events This Month ── */}
        <div style={styles.upcomingCard}>
          <h3 style={styles.sectionTitle}>
            <Clock size={18} color="#3B82F6"/> Events in {MONTH_NAMES[month]} {year}
            <span style={styles.badge}>{upcoming.length}</span>
          </h3>
          {upcoming.length === 0 && (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>
              No events in {MONTH_NAMES[month]} — click any date to add one
            </p>
          )}
          <div style={styles.eventList}>
            {upcoming.map(ev => (
              <EventRow
                key={ev._id}
                event={ev}
                onView={() => { setSelectedEvent(ev); setModal('view'); }}
                onEdit={() => { setSelectedEvent(ev); setModal('edit'); }}
                onDelete={() => handleDelete(ev._id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {(modal === 'add' || modal === 'edit') && (
        <EventFormModal
          event={modal === 'edit' ? selectedEvent : null}
          defaultDate={selectedDate}
          onClose={() => { setModal(null); setSelectedEvent(null); }}
          onSubmit={(data) => modal === 'edit' ? handleUpdate(selectedEvent._id, data) : handleCreate(data)}
        />
      )}

      {modal === 'view' && selectedEvent && (
        <EventViewModal
          event={selectedEvent}
          onClose={() => { setModal(null); setSelectedEvent(null); }}
          onEdit={() => setModal('edit')}
          onDelete={() => handleDelete(selectedEvent._id)}
        />
      )}

      {modal === 'dayEvents' && (
        <DayEventsModal
          events={dayEvents}
          date={selectedDate}
          onClose={() => setModal(null)}
          onView={(ev) => { setSelectedEvent(ev); setModal('view'); }}
          onEdit={(ev) => { setSelectedEvent(ev); setModal('edit'); }}
          onDelete={(id) => handleDelete(id)}
          onAdd={() => setModal('add')}
        />
      )}

      <style>{`
        @keyframes spin    { to   { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: 2px solid #3B82F6; outline-offset: 1px; }
      `}</style>
    </div>
  );
}

// ─── EventRow ─────────────────────────────────────────────────────────────────
function EventRow({ event, onView, onEdit, onDelete }) {
  const cat  = getCat(event.category);
  const Icon = cat.icon;
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{ ...styles.eventRow, background: hov ? cat.bg : '#fff', borderLeft: `4px solid ${cat.color}` }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <div style={{ ...styles.evtIconWrap, background: cat.bg }}>
        <Icon size={16} color={cat.color}/>
      </div>
      <div style={styles.evtBody}>
        <div style={styles.evtTitle}>{event.title}</div>
        <div style={styles.evtMeta}>
          <span><Calendar size={11}/> {event.startDate}{event.endDate !== event.startDate ? ` → ${event.endDate}` : ''}</span>
          {event.location && <span><MapPin size={11}/> {event.location}</span>}
          {!event.allDay && event.startTime && <span><Clock size={11}/> {event.startTime}–{event.endTime}</span>}
        </div>
      </div>
      <div style={styles.evtActions}>
        {event.reminder && <Bell size={14} color="#F59E0B"/>}
        <button style={styles.iconBtn} onClick={onView}  title="View"><Eye     size={14}/></button>
        <button style={styles.iconBtn} onClick={onEdit}  title="Edit"><Edit2   size={14}/></button>
        <button style={{ ...styles.iconBtn, color: '#EF4444' }} onClick={onDelete} title="Delete"><Trash2 size={14}/></button>
      </div>
    </div>
  );
}

// ─── EventFormModal ───────────────────────────────────────────────────────────
function EventFormModal({ event, defaultDate, onClose, onSubmit }) {
  const fmt = (d) => {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return d;
  };

  const [form, setForm] = useState({
    title:        event?.title        || '',
    category:     event?.category     || 'event',
    startDate:    event?.startDate    || fmt(defaultDate),
    endDate:      event?.endDate      || fmt(defaultDate),
    description:  event?.description  || '',
    location:     event?.location     || '',
    allDay:       event?.allDay       !== undefined ? event.allDay : true,
    startTime:    event?.startTime    || '09:00',
    endTime:      event?.endTime      || '10:00',
    reminder:     event?.reminder     || false,
    participants: Array.isArray(event?.participants) ? event.participants.join(', ') : '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim())              e.title     = 'Title is required';
    if (!form.startDate)                 e.startDate = 'Start date required';
    if (!form.endDate)                   e.endDate   = 'End date required';
    if (form.endDate < form.startDate)   e.endDate   = 'End must be after start';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      participants: form.participants.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Overlay onClose={onClose}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{event ? 'Edit Event' : 'Add New Event'}</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>
        <div style={styles.modalBody}>
          <Field label="Event Title" error={errors.title} required>
            <input style={inp(errors.title)} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Annual Sports Day"/>
          </Field>

          <div style={styles.row2}>
            <Field label="Category" required>
              <select style={inp()} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Reminder">
              <label style={styles.checkLabel}>
                <input type="checkbox" checked={form.reminder} onChange={e => set('reminder', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#3B82F6' }}/>
                Send notifications
              </label>
            </Field>
          </div>

          <div style={styles.row2}>
            <Field label="Start Date" error={errors.startDate} required>
              <input style={inp(errors.startDate)} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}/>
            </Field>
            <Field label="End Date" error={errors.endDate} required>
              <input style={inp(errors.endDate)} type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}/>
            </Field>
          </div>

          <Field label="">
            <label style={styles.checkLabel}>
              <input type="checkbox" checked={form.allDay} onChange={e => set('allDay', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#3B82F6' }}/>
              All Day Event
            </label>
          </Field>

          {!form.allDay && (
            <div style={styles.row2}>
              <Field label="Start Time">
                <input style={inp()} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}/>
              </Field>
              <Field label="End Time">
                <input style={inp()} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}/>
              </Field>
            </div>
          )}

          <Field label="Location">
            <input style={inp()} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Main Hall, Sports Complex"/>
          </Field>

          <Field label="Participants (comma separated)">
            <input style={inp()} value={form.participants} onChange={e => set('participants', e.target.value)} placeholder="e.g. All Students, Teachers, Parents"/>
          </Field>

          <Field label="Description">
            <textarea style={{ ...inp(), resize: 'vertical', minHeight: 80 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the event…"/>
          </Field>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button style={styles.btnPrimary} onClick={handleSubmit}>
            <Save size={16}/> {event ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── EventViewModal ───────────────────────────────────────────────────────────
function EventViewModal({ event, onClose, onEdit, onDelete }) {
  const cat  = getCat(event.category);
  const Icon = cat.icon;

  return (
    <Overlay onClose={onClose}>
      <div style={{ ...styles.modal, maxWidth: 520 }}>
        <div style={{ ...styles.modalHeader, background: cat.bg, borderBottom: `2px solid ${cat.color}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: `${cat.color}22`, borderRadius: 8, padding: 8 }}><Icon size={20} color={cat.color}/></div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: cat.text, textTransform: 'uppercase', letterSpacing: 1 }}>{cat.label}</div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{event.title}</h2>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>
        <div style={styles.modalBody}>
          {event.description && <p style={{ color: '#64748B', margin: '0 0 20px' }}>{event.description}</p>}
          <div style={styles.infoGrid}>
            <InfoItem icon={<Calendar size={15}/>} label="Dates"    value={`${event.startDate}${event.endDate !== event.startDate ? ` → ${event.endDate}` : ''}`}/>
            {!event.allDay && event.startTime && <InfoItem icon={<Clock size={15}/>} label="Time" value={`${event.startTime} – ${event.endTime}`}/>}
            {event.location  && <InfoItem icon={<MapPin size={15}/>} label="Location" value={event.location}/>}
            <InfoItem icon={<Tag size={15}/>} label="Type" value={event.allDay ? 'All Day' : 'Timed'}/>
          </div>
          {event.participants?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={styles.infoLabel}>Participants</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {event.participants.map((p, i) => <span key={i} style={styles.participantTag}>{p}</span>)}
              </div>
            </div>
          )}
          {event.reminder && (
            <div style={styles.reminderBadge}><Bell size={14} color="#D97706"/> Reminder notifications enabled</div>
          )}
        </div>
        <div style={styles.modalFooter}>
          <button style={{ ...styles.btnGhost, color: '#EF4444', borderColor: '#EF4444' }} onClick={onDelete}>
            <Trash2 size={15}/> Delete
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.btnGhost} onClick={onClose}>Close</button>
            <button style={styles.btnPrimary} onClick={onEdit}><Edit2 size={15}/> Edit</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── DayEventsModal ───────────────────────────────────────────────────────────
function DayEventsModal({ events, date, onClose, onView, onEdit, onDelete, onAdd }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ ...styles.modal, maxWidth: 480 }}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{date?.toDateString()}</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>
        <div style={styles.modalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map(ev => {
              const cat  = getCat(ev.category);
              const Icon = cat.icon;
              return (
                <div key={ev._id} style={{ border: `1px solid ${cat.color}44`, borderRadius: 10, padding: '12px 14px', background: cat.bg, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={18} color={cat.color}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{ev.title}</div>
                    {ev.location && <div style={{ fontSize: 12, color: '#64748B' }}><MapPin size={10}/> {ev.location}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={styles.iconBtn} onClick={() => onView(ev)}><Eye    size={14}/></button>
                    <button style={styles.iconBtn} onClick={() => onEdit(ev)}><Edit2  size={14}/></button>
                    <button style={{ ...styles.iconBtn, color: '#EF4444' }} onClick={() => onDelete(ev._id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.btnGhost} onClick={onClose}>Close</button>
          <button style={styles.btnPrimary} onClick={onAdd}><Plus size={15}/> Add Event</button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ animation: 'fadeIn .18s ease' }}>{children}</div>
    </div>
  );
}

// ─── Field / InfoItem helpers ─────────────────────────────────────────────────
function Field({ label, children, error, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={styles.label}>{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>}
      {children}
      {error && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 3 }}>{error}</div>}
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ color: '#94A3B8', marginTop: 1 }}>{icon}</div>
      <div>
        <div style={styles.infoLabel}>{label}</div>
        <div style={{ fontSize: 14, color: '#1E293B', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

const inp = (err) => ({ ...styles.input, border: `1.5px solid ${err ? '#EF4444' : '#E2E8F0'}` });

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page:          { minHeight: '100vh', background: '#F8FAFC', padding: 24, fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container:     { maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 },
  header:        { background: '#fff', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,.07)', flexWrap: 'wrap', gap: 12 },
  headerLeft:    { display: 'flex', alignItems: 'center', gap: 14 },
  headerIcon:    { width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  h1:            { margin: 0, fontSize: 26, fontWeight: 800, color: '#1E293B' },
  subTitle:      { margin: 0, fontSize: 13, color: '#94A3B8', marginTop: 2 },
  headerActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  btnPrimary:    { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnGhost:      { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', color: '#374151', border: '1.5px solid #E2E8F0', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnIcon:       { width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', border: 'none', borderRadius: 9, cursor: 'pointer', color: '#64748B' },
  controlBar:    { background: '#fff', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,.06)', flexWrap: 'wrap', gap: 12 },
  navGroup:      { display: 'flex', alignItems: 'center', gap: 6 },
  navBtn:        { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#64748B' },
  todayBtn:      { padding: '6px 16px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' },
  monthLabel:    { fontSize: 20, fontWeight: 800, color: '#1E293B', marginLeft: 6 },
  searchGroup:   { display: 'flex', gap: 8, flexWrap: 'wrap' },
  searchWrap:    { position: 'relative' },
  searchIcon:    { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' },
  searchInput:   { paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13, background: '#F8FAFC', width: 200 },
  select:        { padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13, background: '#F8FAFC', cursor: 'pointer' },
  pills:         { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill:          { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' },
  calCard:       { background: '#fff', borderRadius: 16, padding: '20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', position: 'relative' },
  loadingOverlay:{ position: 'absolute', inset: 0, background: '#ffffffaa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, zIndex: 10, color: '#3B82F6' },
  dayHeaders:    { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 },
  dayHeader:     { textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94A3B8', padding: '6px 0', letterSpacing: .5 },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 },
  cell:          { minHeight: 90, borderRadius: 10, padding: '6px 6px', transition: 'border-color .15s, background .15s', overflow: 'hidden' },
  dayNum:        { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  eventDots:     { display: 'flex', flexDirection: 'column', gap: 2 },
  eventChip:     { fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  moreChip:      { fontSize: 10, color: '#94A3B8', fontWeight: 600, paddingLeft: 4 },
  upcomingCard:  { background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' },
  sectionTitle:  { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#1E293B', margin: '0 0 16px' },
  badge:         { background: '#EFF6FF', color: '#2563EB', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700 },
  eventList:     { display: 'flex', flexDirection: 'column', gap: 8 },
  eventRow:      { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', transition: 'background .15s', cursor: 'default' },
  evtIconWrap:   { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  evtBody:       { flex: 1, minWidth: 0 },
  evtTitle:      { fontSize: 14, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  evtMeta:       { display: 'flex', gap: 10, marginTop: 3, fontSize: 11, color: '#94A3B8', flexWrap: 'wrap', alignItems: 'center' },
  evtActions:    { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  iconBtn:       { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 5, display: 'flex', alignItems: 'center' },
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' },
  modal:         { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.18)' },
  modalHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #E2E8F0' },
  modalTitle:    { margin: 0, fontSize: 20, fontWeight: 800, color: '#1E293B' },
  closeBtn:      { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 6 },
  modalBody:     { padding: '20px 22px', overflowY: 'auto', flex: 1 },
  modalFooter:   { padding: '16px 22px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  label:         { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 },
  input:         { width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14, background: '#F8FAFC', color: '#1E293B' },
  row2:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  checkLabel:    { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer', fontWeight: 500, paddingTop: 6 },
  infoGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  infoLabel:     { fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: .5 },
  participantTag:{ background: '#EFF6FF', color: '#2563EB', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600 },
  reminderBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#FFFBEB', color: '#92400E', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginTop: 14 },
  toast:         { position: 'fixed', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', borderRadius: 10, padding: '12px 18px', fontWeight: 600, fontSize: 14, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,.18)', animation: 'fadeIn .2s ease' },
};