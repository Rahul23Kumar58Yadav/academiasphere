import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  BookOpen,
  MapPin,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Bell,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const EVENT_TYPES = [
  { value: 'class',    label: 'Class',         color: 'indigo' },
  { value: 'exam',     label: 'Exam / Test',   color: 'red'    },
  { value: 'activity', label: 'Activity',      color: 'amber'  },
  { value: 'meeting',  label: 'Meeting',       color: 'purple' },
  { value: 'holiday',  label: 'Holiday / Off', color: 'green'  },
];

const colorMap = {
  indigo: { bg: 'bg-indigo-50',  border: 'border-indigo-400', text: 'text-indigo-700',  dot: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700'  },
  red:    { bg: 'bg-red-50',     border: 'border-red-400',    text: 'text-red-700',     dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700'        },
  amber:  { bg: 'bg-amber-50',   border: 'border-amber-400',  text: 'text-amber-700',   dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700'    },
  purple: { bg: 'bg-purple-50',  border: 'border-purple-400', text: 'text-purple-700',  dot: 'bg-purple-500',  badge: 'bg-purple-100 text-purple-700'  },
  green:  { bg: 'bg-green-50',   border: 'border-green-400',  text: 'text-green-700',   dot: 'bg-green-500',   badge: 'bg-green-100 text-green-700'    },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── Initial seed data ────────────────────────────────────────────────────────
const today = new Date();
function makeDate(offsetDays) {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return formatDate(d);
}

const INITIAL_EVENTS = [
  { id: 1, title: 'Mathematics – Grade 10A',   type: 'class',    date: makeDate(0),  startTime: '08:00', endTime: '09:00', location: 'Room 201', students: 'Grade 10-A', note: 'Chapter 5: Quadratic Equations'       },
  { id: 2, title: 'Science – Grade 9B',        type: 'class',    date: makeDate(0),  startTime: '10:00', endTime: '11:00', location: 'Lab 1',    students: 'Grade 9-B',  note: 'Practical: Acid & Base Reactions'    },
  { id: 3, title: 'Unit Test – Mathematics',   type: 'exam',     date: makeDate(2),  startTime: '09:00', endTime: '11:00', location: 'Hall A',   students: 'Grade 10-A', note: 'Chapters 1–5, carry calculators'     },
  { id: 4, title: 'Staff Meeting',             type: 'meeting',  date: makeDate(1),  startTime: '13:00', endTime: '14:00', location: 'Conf. Rm', students: 'All Staff',  note: 'Monthly curriculum review'           },
  { id: 5, title: 'Science Fair Prep',         type: 'activity', date: makeDate(3),  startTime: '14:00', endTime: '16:00', location: 'Lab 2',    students: 'Grade 9-A',  note: 'Students to bring project proposals' },
  { id: 6, title: 'Mathematics – Grade 10B',  type: 'class',    date: makeDate(1),  startTime: '08:00', endTime: '09:00', location: 'Room 202', students: 'Grade 10-B', note: ''                                    },
  { id: 7, title: 'Parent-Teacher Day',        type: 'meeting',  date: makeDate(5),  startTime: '09:00', endTime: '13:00', location: 'Main Hall',students: 'All',        note: 'Scheduled appointments only'         },
  { id: 8, title: 'Republic Day – Holiday',   type: 'holiday',  date: makeDate(7),  startTime: '',      endTime: '',      location: '',         students: 'All',        note: 'School closed'                       },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
function EventModal({ event, onClose, onSave, onDelete, mode }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isAdd  = mode === 'add';

  const blank = {
    title: '', type: 'class', date: formatDate(today),
    startTime: '08:00', endTime: '09:00',
    location: '', students: '', note: '',
  };

  const [form, setForm] = useState(event || blank);
  const [delConfirm, setDelConfirm] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const typeObj = EVENT_TYPES.find((t) => t.value === form.type) || EVENT_TYPES[0];
  const c = colorMap[typeObj.color];

  if (isView) {
    return (
      <Overlay onClose={onClose}>
        <div className="w-full max-w-md">
          <div className={`rounded-2xl overflow-hidden shadow-2xl border-t-4 ${c.border} bg-white`}>
            {/* Header */}
            <div className={`${c.bg} px-6 py-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${c.text}`}>{typeObj.label}</span>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{form.title}</h2>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/60 text-gray-500"><X size={20}/></button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <Row icon={<Calendar size={16}/>} label="Date">
                {FULL_DAYS[parseDate(form.date).getDay()]}, {MONTHS[parseDate(form.date).getMonth()]} {parseDate(form.date).getDate()}, {parseDate(form.date).getFullYear()}
              </Row>
              {form.startTime && (
                <Row icon={<Clock size={16}/>} label="Time">{form.startTime} – {form.endTime}</Row>
              )}
              {form.location && <Row icon={<MapPin size={16}/>} label="Location">{form.location}</Row>}
              {form.students && <Row icon={<Users size={16}/>} label="Students / Group">{form.students}</Row>}
              {form.note && <Row icon={<BookOpen size={16}/>} label="Note">{form.note}</Row>}
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => onSave({ ...form, _editMode: true })} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                <Edit2 size={16}/> Edit
              </button>
              {!delConfirm
                ? <button onClick={() => setDelConfirm(true)} className="px-4 py-2.5 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>
                : <button onClick={() => onDelete(form.id)} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">Confirm</button>
              }
            </div>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-lg">
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">{isAdd ? 'Add New Event' : 'Edit Event'}</h2>
            <button onClick={onClose} className="p-1 text-white/80 hover:text-white"><X size={20}/></button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title */}
            <Field label="Event Title *">
              <input value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Mathematics – Grade 10A"
                className="input" />
            </Field>

            {/* Type */}
            <Field label="Event Type *">
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((t) => {
                  const cc = colorMap[t.color];
                  return (
                    <button key={t.value} onClick={() => set('type', t.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                        form.type === t.value ? `${cc.badge} ${cc.border}` : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Date */}
            <Field label="Date *">
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input" />
            </Field>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time">
                <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="input" />
              </Field>
              <Field label="End Time">
                <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="input" />
              </Field>
            </div>

            {/* Location */}
            <Field label="Location / Room">
              <input value={form.location} onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Room 201, Lab 1" className="input" />
            </Field>

            {/* Students */}
            <Field label="Students / Group">
              <input value={form.students} onChange={(e) => set('students', e.target.value)}
                placeholder="e.g. Grade 10-A, All Students" className="input" />
            </Field>

            {/* Note */}
            <Field label="Note / Instructions">
              <textarea rows={3} value={form.note} onChange={(e) => set('note', e.target.value)}
                placeholder="Any specific instructions or topics to cover…"
                className="input resize-none" />
            </Field>
          </div>

          <div className="px-6 pb-5 flex gap-3 border-t border-gray-100 pt-4">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={() => { if (form.title && form.date) onSave(form); }}
              disabled={!form.title || !form.date}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 transition-all">
              <CheckCircle size={16}/> {isAdd ? 'Add Event' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Tiny reusables ───────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
function Row({ icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5">{children}</p>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents]             = useState(INITIAL_EVENTS);
  const [modal, setModal]               = useState(null); // { mode: 'view'|'edit'|'add', event }
  const [filterType, setFilterType]     = useState('all');
  const [view, setView]                 = useState('month'); // 'month' | 'week'

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);

  const eventsForDate = (date) =>
    events.filter((e) => e.date === formatDate(date) && (filterType === 'all' || e.type === filterType));

  const todayEvents = eventsForDate(selectedDate);

  // ── Week view helpers ──────────────────────────────────────────────────
  const getWeekDates = (anchor) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => { const dd = new Date(d); dd.setDate(dd.getDate() + i); return dd; });
  };
  const weekDates = getWeekDates(selectedDate);

  // ── CRUD ───────────────────────────────────────────────────────────────
  const openAdd  = () => setModal({ mode: 'add', event: { date: formatDate(selectedDate) } });
  const openView = (ev) => setModal({ mode: 'view', event: ev });

  const handleSave = (data) => {
    if (data._editMode) { setModal({ mode: 'edit', event: data }); return; }
    if (data.id) {
      setEvents((prev) => prev.map((e) => (e.id === data.id ? data : e)));
    } else {
      setEvents((prev) => [...prev, { ...data, id: Date.now() }]);
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setModal(null);
  };

  // ── Upcoming (next 7 days) ─────────────────────────────────────────────
  const upcoming = events
    .filter((e) => {
      const d = parseDate(e.date);
      const diff = Math.ceil((d - today) / 86400000);
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const typeStats = EVENT_TYPES.map((t) => ({
    ...t,
    count: events.filter((e) => e.type === t.value).length,
  }));

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <style>{`.input{width:100%;border:1.5px solid #e5e7eb;border-radius:0.75rem;padding:0.6rem 0.85rem;font-size:0.875rem;outline:none;transition:border-color .15s}.input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}`}</style>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan classes, exams, activities & meetings</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 text-sm font-semibold">
            {['month','week'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg capitalize transition-all ${view === v ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all">
            <Plus size={18}/> Add Event
          </button>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {typeStats.map((t) => {
          const c = colorMap[t.color];
          return (
            <button key={t.value} onClick={() => setFilterType(filterType === t.value ? 'all' : t.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                filterType === t.value ? `${c.bg} ${c.border}` : 'bg-white border-gray-100 hover:border-gray-200'
              }`}>
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${c.dot}`}/>
              <div className="text-left min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{t.label}</p>
                <p className={`text-base font-extrabold ${filterType === t.value ? c.text : 'text-gray-800'}`}>{t.count}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Calendar ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"><ChevronLeft size={18}/></button>
            <h2 className="font-bold text-gray-900 text-base">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"><ChevronRight size={18}/></button>
          </div>

          {view === 'month' ? (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map((d) => (
                  <div key={d} className="text-center py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`blank-${i}`} className="h-24 border-r border-b border-gray-50" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const date     = new Date(year, month, day);
                  const isToday  = isSameDay(date, today);
                  const isSel    = isSameDay(date, selectedDate);
                  const dayEvts  = eventsForDate(date);
                  return (
                    <div key={day} onClick={() => setSelectedDate(date)}
                      className={`h-24 border-r border-b border-gray-50 p-1.5 cursor-pointer transition-colors ${
                        isSel ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1 ${
                        isToday ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' :
                        isSel   ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
                      }`}>{day}</div>
                      <div className="space-y-0.5">
                        {dayEvts.slice(0, 2).map((ev) => {
                          const c = colorMap[EVENT_TYPES.find((t) => t.value === ev.type)?.color || 'indigo'];
                          return (
                            <div key={ev.id} onClick={(e) => { e.stopPropagation(); openView(ev); }}
                              className={`text-xs px-1.5 py-0.5 rounded-md truncate font-medium cursor-pointer ${c.badge} hover:opacity-80`}>
                              {ev.title}
                            </div>
                          );
                        })}
                        {dayEvts.length > 2 && (
                          <div className="text-xs text-gray-400 font-medium pl-1">+{dayEvts.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Week view */
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-7); setSelectedDate(d); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronLeft size={16}/></button>
                <span className="text-sm font-semibold text-gray-600">
                  {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getDate()} – {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getDate()}, {weekDates[6].getFullYear()}
                </span>
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+7); setSelectedDate(d); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronRight size={16}/></button>
              </div>
              <div className="grid grid-cols-7 border-b border-gray-100">
                {weekDates.map((d) => (
                  <div key={d.toISOString()} onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center py-3 cursor-pointer transition-colors ${isSameDay(d, selectedDate) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <span className="text-xs font-bold text-gray-400 uppercase">{DAYS[d.getDay()]}</span>
                    <span className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                      isSameDay(d, today) ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                      : isSameDay(d, selectedDate) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
                    }`}>{d.getDate()}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-48">
                {weekDates.map((d) => {
                  const dayEvts = eventsForDate(d);
                  return (
                    <div key={d.toISOString()} className={`border-r border-gray-50 p-2 space-y-1 ${isSameDay(d, selectedDate) ? 'bg-indigo-50/40' : ''}`}>
                      {dayEvts.map((ev) => {
                        const c = colorMap[EVENT_TYPES.find((t) => t.value === ev.type)?.color || 'indigo'];
                        return (
                          <div key={ev.id} onClick={() => openView(ev)}
                            className={`text-xs p-1.5 rounded-lg cursor-pointer ${c.badge} hover:opacity-80 font-medium`}>
                            {ev.startTime && <p className="font-semibold">{ev.startTime}</p>}
                            <p className="truncate">{ev.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Right Column ──────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Selected Day Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {isSameDay(selectedDate, today) ? 'Today' : FULL_DAYS[selectedDate.getDay()]}
                </h3>
                <p className="text-xs text-gray-400">{MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}</p>
              </div>
              <button onClick={openAdd}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                <Plus size={16}/>
              </button>
            </div>

            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {todayEvents.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-2"/>
                  <p className="text-sm text-gray-400">No events on this day</p>
                  <button onClick={openAdd} className="mt-3 text-xs text-indigo-600 font-semibold hover:underline">+ Add one</button>
                </div>
              ) : (
                todayEvents
                  .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                  .map((ev) => {
                    const typeObj = EVENT_TYPES.find((t) => t.value === ev.type);
                    const c = colorMap[typeObj?.color || 'indigo'];
                    return (
                      <div key={ev.id} onClick={() => openView(ev)}
                        className={`flex gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${c.border}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{ev.title}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {ev.startTime && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={11}/>{ev.startTime}–{ev.endTime}
                              </span>
                            )}
                            {ev.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin size={11}/>{ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`self-start text-xs px-2 py-0.5 rounded-full font-bold ${c.badge}`}>{typeObj?.label}</span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Bell size={15} className="text-amber-500"/>
              <h3 className="font-bold text-gray-900 text-sm">Upcoming (7 days)</h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {upcoming.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Nothing upcoming</p>
              ) : (
                upcoming.slice(0, 8).map((ev) => {
                  const typeObj = EVENT_TYPES.find((t) => t.value === ev.type);
                  const c = colorMap[typeObj?.color || 'indigo'];
                  const d = parseDate(ev.date);
                  const diff = Math.ceil((d - today) / 86400000);
                  return (
                    <div key={ev.id} onClick={() => { setSelectedDate(d); openView(ev); }}
                      className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${c.bg}`}>
                        <span className={`text-xs font-black ${c.text}`}>{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">{diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{typeObj?.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.event}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Schedule;