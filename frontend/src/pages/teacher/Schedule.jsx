// src/teacher/Schedule.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users, BookOpen,
  MapPin, X, Edit2, Trash2, CheckCircle, AlertCircle,
  Calendar, Bell, RefreshCw, School, Wifi, Zap, WifiOff,
  Info,
} from 'lucide-react';
import { useSchoolEvents } from '../../hooks/useSchoolEvents';
import { useAuth } from '../../hooks/useAuth';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const FULL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EVENT_TYPES = [
  { value:'class',    label:'Class',         color:'indigo' },
  { value:'exam',     label:'Exam / Test',   color:'red'    },
  { value:'activity', label:'Activity',      color:'amber'  },
  { value:'meeting',  label:'Meeting',       color:'purple' },
  { value:'holiday',  label:'Holiday / Off', color:'green'  },
];

const colorMap = {
  indigo: { bg:'bg-indigo-50', border:'border-indigo-400', text:'text-indigo-700', dot:'bg-indigo-500', badge:'bg-indigo-100 text-indigo-700' },
  red:    { bg:'bg-red-50',    border:'border-red-400',    text:'text-red-700',    dot:'bg-red-500',    badge:'bg-red-100 text-red-700'       },
  amber:  { bg:'bg-amber-50',  border:'border-amber-400',  text:'text-amber-700',  dot:'bg-amber-500',  badge:'bg-amber-100 text-amber-700'   },
  purple: { bg:'bg-purple-50', border:'border-purple-400', text:'text-purple-700', dot:'bg-purple-500', badge:'bg-purple-100 text-purple-700' },
  green:  { bg:'bg-green-50',  border:'border-green-400',  text:'text-green-700',  dot:'bg-green-500',  badge:'bg-green-100 text-green-700'   },
};

const SCHOOL_CAT_COLOR = {
  exam:     { bg:'bg-red-50',    text:'text-red-700',    dot:'bg-red-500',    border:'border-l-red-400'    },
  holiday:  { bg:'bg-green-50',  text:'text-green-700',  dot:'bg-green-500',  border:'border-l-green-400'  },
  event:    { bg:'bg-blue-50',   text:'text-blue-700',   dot:'bg-blue-500',   border:'border-l-blue-400'   },
  meeting:  { bg:'bg-purple-50', text:'text-purple-700', dot:'bg-purple-500', border:'border-l-purple-400' },
  sports:   { bg:'bg-orange-50', text:'text-orange-700', dot:'bg-orange-500', border:'border-l-orange-400' },
  academic: { bg:'bg-indigo-50', text:'text-indigo-700', dot:'bg-indigo-500', border:'border-l-indigo-400' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay    = (y, m) => new Date(y, m, 1).getDay();
const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth()    === d2.getMonth()    &&
  d1.getDate()     === d2.getDate();
const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseDate = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); };

function timeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10)   return 'just now';
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

// ─── Blank form — all fields defined so inputs are never uncontrolled ─────────
const BLANK_FORM = {
  title:     '',
  type:      'class',
  date:      '',
  startTime: '08:00',
  endTime:   '09:00',
  location:  '',
  students:  '',
  note:      '',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
// Module-level counter — never collides even if two toasts fire in same ms
let _toastCounter = 0;
const nextToastId = () => ++_toastCounter;

function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white pointer-events-auto
            ${t.type === 'error'   ? 'bg-red-500'
            : t.type === 'warning' ? 'bg-amber-500'
            : 'bg-emerald-500'}`}
        >
          {t.type === 'error'   ? <AlertCircle size={15}/> :
           t.type === 'warning' ? <Info size={15}/> :
           <CheckCircle size={15}/>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = nextToastId();                               // ← unique counter, never Date.now()
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

// ─── Tiny reusables ───────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
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

// ─── EventModal ───────────────────────────────────────────────────────────────
function EventModal({ event, onClose, onSave, onDelete, mode, saving }) {
  const isView = mode === 'view';
  const isAdd  = mode === 'add';

  // ── FIX: always initialise every field so inputs stay controlled ──────────
  const [form, setForm] = useState(() => ({
    ...BLANK_FORM,
    ...(event ? {
      title:     event.title     ?? '',
      type:      event.type      ?? 'class',
      date:      event.date      ?? '',
      startTime: event.startTime ?? '08:00',
      endTime:   event.endTime   ?? '09:00',
      location:  event.location  ?? '',
      students:  event.students  ?? '',
      note:      event.note      ?? '',
    } : {}),
  }));

  const [delConfirm, setDelConfirm] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const typeObj = EVENT_TYPES.find(t => t.value === form.type) || EVENT_TYPES[0];
  const c       = colorMap[typeObj.color];

  if (isView) {
    return (
      <Overlay onClose={onClose}>
        <div className="w-full max-w-md">
          <div className={`rounded-2xl overflow-hidden shadow-2xl border-t-4 ${c.border} bg-white`}>
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
              {form.startTime && <Row icon={<Clock    size={16}/>} label="Time">{form.startTime} – {form.endTime}</Row>}
              {form.location  && <Row icon={<MapPin   size={16}/>} label="Location">{form.location}</Row>}
              {form.students  && <Row icon={<Users    size={16}/>} label="Students / Group">{form.students}</Row>}
              {form.note      && <Row icon={<BookOpen size={16}/>} label="Note">{form.note}</Row>}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => onSave({ ...form, _editMode: true })}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Edit2 size={16}/> Edit
              </button>
              {!delConfirm
                ? <button onClick={() => setDelConfirm(true)} className="px-4 py-2.5 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>
                : <button onClick={() => onDelete(form.id ?? form._id)} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">Confirm</button>
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
            <Field label="Event Title *">
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Mathematics – Grade 10A"
                className="input"
              />
            </Field>
            <Field label="Event Type *">
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map(t => {
                  const cc = colorMap[t.color];
                  return (
                    <button key={t.value} onClick={() => set('type', t.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.type===t.value ? `${cc.badge} ${cc.border}` : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Date *">
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input"/>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time">
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="input"/>
              </Field>
              <Field label="End Time">
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="input"/>
              </Field>
            </div>
            <Field label="Location / Room">
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Room 201, Lab 1" className="input"/>
            </Field>
            <Field label="Students / Group">
              <input value={form.students} onChange={e => set('students', e.target.value)} placeholder="e.g. Grade 10-A, All Students" className="input"/>
            </Field>
            <Field label="Note / Instructions">
              <textarea rows={3} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Any specific instructions or topics…" className="input resize-none"/>
            </Field>
          </div>
          <div className="px-6 pb-5 flex gap-3 border-t border-gray-100 pt-4">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { if (form.title && form.date) onSave(form); }}
              disabled={!form.title || !form.date || saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {saving
                ? <><RefreshCw size={15} className="animate-spin"/> Saving…</>
                : <><CheckCircle size={16}/> {isAdd ? 'Add Event' : 'Save Changes'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── SchoolEventsSidebar ──────────────────────────────────────────────────────
// Reads admin-created school events via useSchoolEvents (cookie-auth, 60s poll)
function SchoolEventsSidebar() {
  const { events, loading, error, lastUpdated, refetch } = useSchoolEvents(30);

  const [, forceRender] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceRender(n => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const prevIds = useRef(new Set());
  const [newIds, setNewIds] = useState(new Set());

  useEffect(() => {
    const cur   = new Set(events.map(e => e._id));
    const fresh = new Set([...cur].filter(id => !prevIds.current.has(id)));
    if (fresh.size > 0 && prevIds.current.size > 0) {
      setNewIds(fresh);
      setTimeout(() => setNewIds(new Set()), 8000);
    }
    prevIds.current = cur;
  }, [events]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School size={15} className="text-indigo-600"/>
            <h3 className="font-bold text-gray-900 text-sm">School Events</h3>
            {!loading && events.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {events.length}
              </span>
            )}
            {newIds.size > 0 && (
              <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                <Zap size={7}/> {newIds.size} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
            </span>
            <button
              onClick={refetch}
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''}/>
            </button>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Wifi size={9}/> Synced {timeAgo(lastUpdated)} · auto-refreshes every 60s
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {loading && events.length === 0 && (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse"/>)}
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-3">
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">
              <WifiOff size={13}/>
              <span>Could not load school events</span>
              <button onClick={refetch} className="ml-auto underline font-semibold">Retry</button>
            </div>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="px-5 py-8 text-center">
            <School size={28} className="mx-auto text-gray-200 mb-2"/>
            <p className="text-sm text-gray-400">No upcoming school events</p>
            <p className="text-xs text-gray-300 mt-0.5">Auto-updates every 60 s</p>
          </div>
        )}

        {events.map(ev => {
          const cat     = SCHOOL_CAT_COLOR[ev.category] || SCHOOL_CAT_COLOR.event;
          const d       = new Date(ev.startDate + 'T00:00:00');
          const diff    = Math.round((d - new Date(todayStr + 'T00:00:00')) / 86400000);
          const isToday = ev.startDate <= todayStr && ev.endDate >= todayStr;
          const isNew   = newIds.has(ev._id);

          return (
            <div
              key={ev._id}
              className={`flex items-center gap-3 px-4 py-3 border-l-4 transition-all ${cat.border} ${cat.bg} ${isNew ? 'ring-1 ring-inset ring-blue-300' : ''}`}
            >
              <div className="flex flex-col items-center justify-center w-9 h-9 bg-white rounded-lg shadow-sm shrink-0 border border-gray-100">
                <span className={`text-xs font-black ${cat.text}`}>{d.getDate()}</span>
                <span className={`text-[8px] font-bold ${cat.text} uppercase`}>{MONTHS[d.getMonth()].slice(0,3)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={`text-sm font-semibold truncate ${cat.text}`}>{ev.title}</p>
                  {isNew && <span className="text-[9px] bg-blue-500 text-white px-1 rounded font-bold shrink-0">NEW</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {ev.location && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <MapPin size={9}/>{ev.location}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold ${isToday ? 'text-red-600' : diff === 1 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {isToday ? 'Today' : diff === 1 ? 'Tomorrow' : diff > 0 ? `In ${diff}d` : 'Ongoing'}
                  </span>
                </div>
              </div>
              {ev.reminder && <Bell size={11} className="text-amber-500 shrink-0"/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Schedule Component
// ─────────────────────────────────────────────────────────────────────────────
const today = new Date();

const Schedule = () => {
  const { authFetch } = useAuth();
  const { toasts, show: showToast } = useToasts();

  const [currentDate,  setCurrentDate]  = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [apiError,     setApiError]     = useState(null);   // ← surfaces 404/500
  const [modal,        setModal]        = useState(null);
  const [filterType,   setFilterType]   = useState('all');
  const [view,         setView]         = useState('month');

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Load teacher's personal events ────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await authFetch(`/calendar/teacher/schedule?month=${month + 1}&year=${year}`);
      if (!res) return; // auth redirect

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.message || `Server error (${res.status})`;
        setApiError(msg);
        showToast(msg, 'error');
        return;
      }

      const data = await res.json();
      if (data?.success && Array.isArray(data.events)) {
        setEvents(data.events.map(ev => ({ ...ev, id: ev._id ?? ev.id })));
      }
    } catch (err) {
      const msg = 'Could not reach server — check your connection';
      setApiError(msg);
      showToast(msg, 'warning');
    } finally {
      setLoading(false);
    }
  }, [currentDate, authFetch, month, year, showToast]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const daysInMonth   = getDaysInMonth(year, month);
  const firstDay      = getFirstDay(year, month);
  const eventsForDate = (date) =>
    events.filter(e => e.date === formatDate(date) && (filterType === 'all' || e.type === filterType));
  const todayEvents   = eventsForDate(selectedDate);

  const getWeekDates = (anchor) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => { const dd = new Date(d); dd.setDate(dd.getDate() + i); return dd; });
  };
  const weekDates = getWeekDates(selectedDate);

  // ── Upcoming — teacher personal, next 7 days ──────────────────────────────
  const upcoming = events
    .filter(e => {
      const d    = parseDate(e.date);
      const diff = Math.ceil((d - today) / 86400000);
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime||'').localeCompare(b.startTime||''));

  const typeStats = EVENT_TYPES.map(t => ({ ...t, count: events.filter(e => e.type === t.value).length }));

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openAdd  = ()    => setModal({ mode: 'add',  event: { ...BLANK_FORM, date: formatDate(selectedDate) } });
  const openView = (ev)  => setModal({ mode: 'view', event: ev });

  const handleSave = async (data) => {
    // "Edit" button inside view modal → switch to edit mode
    if (data._editMode) {
      const { _editMode, ...clean } = data;
      setModal({ mode: 'edit', event: clean });
      return;
    }

    setSaving(true);
    const isUpdate = Boolean(data.id || data._id);
    const endpoint = isUpdate
      ? `/calendar/teacher/schedule/${data.id ?? data._id}`
      : '/calendar/teacher/schedule';
    const method   = isUpdate ? 'PUT' : 'POST';

    try {
      const res  = await authFetch(endpoint, { method, body: JSON.stringify(data) });
      if (!res) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body.message || `Failed (${res.status})`, 'error');
        return;
      }

      const json = await res.json();
      if (json?.success) {
        const saved = { ...json.event, id: json.event._id ?? json.event.id };
        setEvents(prev =>
          isUpdate
            ? prev.map(e => e.id === saved.id ? saved : e)
            : [...prev, saved]
        );
        showToast(isUpdate ? 'Event updated' : 'Event created');
        setModal(null);
      } else {
        showToast(json.message || 'Something went wrong', 'error');
      }
    } catch {
      showToast('Network error — could not save event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res  = await authFetch(`/calendar/teacher/schedule/${id}`, { method: 'DELETE' });
      if (!res) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body.message || 'Delete failed', 'error');
        return;
      }

      setEvents(prev => prev.filter(e => e.id !== id && e._id !== id));
      showToast('Event deleted');
      setModal(null);
    } catch {
      showToast('Network error — could not delete event', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} />

      <style>{`
        .input{width:100%;border:1.5px solid #e5e7eb;border-radius:0.75rem;padding:0.6rem 0.85rem;font-size:0.875rem;outline:none;transition:border-color .15s}
        .input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan classes, exams, activities &amp; meetings</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-gray-100 rounded-xl p-1 text-sm font-semibold">
            {['month','week'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg capitalize transition-all ${view===v ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
          {loading && <span className="text-xs text-gray-400 animate-pulse flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Loading…</span>}
          <button
            onClick={loadEvents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all">
            <Plus size={18}/> Add Event
          </button>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0"/>
          <span className="flex-1">{apiError}</span>
          <button onClick={loadEvents} className="text-xs font-semibold underline hover:no-underline shrink-0">
            Retry
          </button>
          <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600">
            <X size={14}/>
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {typeStats.map(t => {
          const c = colorMap[t.color];
          return (
            <button key={t.value} onClick={() => setFilterType(filterType===t.value ? 'all' : t.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${filterType===t.value ? `${c.bg} ${c.border}` : 'bg-white border-gray-100 hover:border-gray-200'}`}>
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${c.dot}`}/>
              <div className="text-left min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{t.label}</p>
                <p className={`text-base font-extrabold ${filterType===t.value ? c.text : 'text-gray-800'}`}>{t.count}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Calendar ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={() => setCurrentDate(new Date(year,month-1,1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"><ChevronLeft  size={18}/></button>
            <h2 className="font-bold text-gray-900 text-base">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year,month+1,1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"><ChevronRight size={18}/></button>
          </div>

          {view === 'month' ? (
            <>
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map(d => <div key={d} className="text-center py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_,i) => <div key={`b${i}`} className="h-24 border-r border-b border-gray-50"/>)}
                {Array.from({ length: daysInMonth },(_,i) => i+1).map(day => {
                  const date    = new Date(year, month, day);
                  const isTod   = isSameDay(date, today);
                  const isSel   = isSameDay(date, selectedDate);
                  const dayEvts = eventsForDate(date);
                  return (
                    <div key={day} onClick={() => setSelectedDate(date)}
                      className={`h-24 border-r border-b border-gray-50 p-1.5 cursor-pointer transition-colors ${isSel ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1 ${isTod ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : isSel ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}>{day}</div>
                      <div className="space-y-0.5">
                        {dayEvts.slice(0,2).map(ev => {
                          const c = colorMap[EVENT_TYPES.find(t => t.value===ev.type)?.color||'indigo'];
                          return <div key={ev.id} onClick={e => { e.stopPropagation(); openView(ev); }} className={`text-xs px-1.5 py-0.5 rounded-md truncate font-medium cursor-pointer ${c.badge} hover:opacity-80`}>{ev.title}</div>;
                        })}
                        {dayEvts.length > 2 && <div className="text-xs text-gray-400 font-medium pl-1">+{dayEvts.length-2} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <button onClick={() => { const d=new Date(selectedDate); d.setDate(d.getDate()-7); setSelectedDate(d); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronLeft  size={16}/></button>
                <span className="text-sm font-semibold text-gray-600">{MONTHS[weekDates[0].getMonth()]} {weekDates[0].getDate()} – {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getDate()}</span>
                <button onClick={() => { const d=new Date(selectedDate); d.setDate(d.getDate()+7); setSelectedDate(d); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronRight size={16}/></button>
              </div>
              <div className="grid grid-cols-7 border-b border-gray-100">
                {weekDates.map(d => (
                  <div key={d.toISOString()} onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center py-3 cursor-pointer transition-colors ${isSameDay(d,selectedDate) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <span className="text-xs font-bold text-gray-400 uppercase">{DAYS[d.getDay()]}</span>
                    <span className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${isSameDay(d,today) ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : isSameDay(d,selectedDate) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}>{d.getDate()}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-48">
                {weekDates.map(d => {
                  const dayEvts = eventsForDate(d);
                  return (
                    <div key={d.toISOString()} className={`border-r border-gray-50 p-2 space-y-1 ${isSameDay(d,selectedDate) ? 'bg-indigo-50/40' : ''}`}>
                      {dayEvts.map(ev => {
                        const c = colorMap[EVENT_TYPES.find(t => t.value===ev.type)?.color||'indigo'];
                        return <div key={ev.id} onClick={() => openView(ev)} className={`text-xs p-1.5 rounded-lg cursor-pointer ${c.badge} hover:opacity-80 font-medium`}>{ev.startTime && <p className="font-semibold">{ev.startTime}</p>}<p className="truncate">{ev.title}</p></div>;
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Selected day — teacher's personal events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {isSameDay(selectedDate,today) ? 'Today' : FULL_DAYS[selectedDate.getDay()]}
                </h3>
                <p className="text-xs text-gray-400">{MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}</p>
              </div>
              <button onClick={openAdd} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"><Plus size={16}/></button>
            </div>
            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
              {todayEvents.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-2"/>
                  <p className="text-sm text-gray-400">No personal events</p>
                  <button onClick={openAdd} className="mt-3 text-xs text-indigo-600 font-semibold hover:underline">+ Add one</button>
                </div>
              ) : (
                [...todayEvents]
                  .sort((a,b) => (a.startTime||'').localeCompare(b.startTime||''))
                  .map(ev => {
                    const typeObj = EVENT_TYPES.find(t => t.value===ev.type);
                    const c = colorMap[typeObj?.color||'indigo'];
                    return (
                      <div key={ev.id} onClick={() => openView(ev)} className={`flex gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${c.border}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{ev.title}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {ev.startTime && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11}/>{ev.startTime}–{ev.endTime}</span>}
                            {ev.location  && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11}/>{ev.location}</span>}
                          </div>
                        </div>
                        <span className={`self-start text-xs px-2 py-0.5 rounded-full font-bold ${c.badge}`}>{typeObj?.label}</span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* My upcoming — teacher personal, next 7 days */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-amber-500"/>
                <h3 className="font-bold text-gray-900 text-sm">My Upcoming (7 days)</h3>
                {upcoming.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {upcoming.length}
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {upcoming.length === 0
                ? <p className="px-5 py-6 text-sm text-gray-400 text-center">Nothing in the next 7 days</p>
                : upcoming.slice(0,6).map(ev => {
                    const typeObj = EVENT_TYPES.find(t => t.value===ev.type);
                    const c   = colorMap[typeObj?.color||'indigo'];
                    const d   = parseDate(ev.date);
                    const diff = Math.ceil((d - today) / 86400000);
                    return (
                      <div key={ev.id} onClick={() => { setSelectedDate(d); openView(ev); }} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${c.bg}`}>
                          <span className={`text-xs font-black ${c.text}`}>{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                          <p className="text-xs text-gray-400">{diff===0 ? 'Today' : diff===1 ? 'Tomorrow' : `In ${diff} days`}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{typeObj?.label}</span>
                      </div>
                    );
                  })
              }
            </div>
          </div>

          {/* School-wide events — admin created, read-only, live poll */}
          <SchoolEventsSidebar />

        </div>
      </div>

      {modal && (
        <EventModal
          mode={modal.mode}
          event={modal.event}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Schedule;