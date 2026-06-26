// src/pages/student/timetable/MyTimetable.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Clock, User, MapPin, Download, Bell, CheckCircle,
  PlayCircle, RefreshCw, AlertCircle, Zap,
  Calendar, ChevronRight, Wifi, WifiOff, School, BookOpen,
  ChevronLeft, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSchoolEvents }     from "../../hooks/useSchoolEvents";
import { useStudentTimetable } from "../../hooks/useStudentTimetable";

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEK_DAYS  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const FULL_MONTH = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];

const todayName = () => DAY_NAMES[new Date().getDay()];
const todayStr  = () => new Date().toISOString().split("T")[0];

// ─── Event-type meta ──────────────────────────────────────────────────────────
const TYPE_META = {
  class:    { color:"#3B82F6", bg:"#EFF6FF", grad:"from-blue-500 to-blue-700",     icon:"📘", label:"Class"    },
  exam:     { color:"#EF4444", bg:"#FEF2F2", grad:"from-red-500 to-rose-600",      icon:"📝", label:"Exam"     },
  activity: { color:"#F59E0B", bg:"#FFFBEB", grad:"from-amber-400 to-orange-500",  icon:"🎯", label:"Activity" },
  meeting:  { color:"#8B5CF6", bg:"#F5F3FF", grad:"from-violet-500 to-purple-700", icon:"👥", label:"Meeting"  },
  holiday:  { color:"#10B981", bg:"#ECFDF5", grad:"from-emerald-500 to-teal-600",  icon:"🌴", label:"Holiday"  },
};

const CAT_META = {
  exam:     { color:"#EF4444", bg:"#FEF2F2", label:"Exam"     },
  holiday:  { color:"#10B981", bg:"#ECFDF5", label:"Holiday"  },
  event:    { color:"#3B82F6", bg:"#EFF6FF", label:"Event"    },
  meeting:  { color:"#8B5CF6", bg:"#F5F3FF", label:"Meeting"  },
  sports:   { color:"#F97316", bg:"#FFF7ED", label:"Sports"   },
  academic: { color:"#6366F1", bg:"#EEF2FF", label:"Academic" },
};

const getMeta = (type) => TYPE_META[type] ?? TYPE_META.class;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toMins = (t) => { if (!t) return 0; const [h,m] = t.split(":").map(Number); return h*60+m; };

const deriveStatus = (ev, nowMins) => {
  if (!ev.startTime) return "upcoming";
  const start = toMins(ev.startTime), end = toMins(ev.endTime || ev.startTime);
  if (nowMins >= end)                    return "completed";
  if (nowMins >= start && nowMins < end) return "ongoing";
  return "upcoming";
};

function timeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10)   return "just now";
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

// ─── Progress bar for ongoing period ─────────────────────────────────────────
function ProgressBar({ ev, nowMins }) {
  if (!ev.startTime || !ev.endTime) return null;
  const start = toMins(ev.startTime), end = toMins(ev.endTime);
  const pct = Math.min(100, Math.max(0, ((nowMins - start) / (end - start)) * 100));
  const remaining = end - nowMins;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-blue-300 mb-1">
        <span>In progress</span>
        <span>{remaining}m remaining</span>
      </div>
      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-white/70 rounded-full transition-all duration-1000"
          style={{ width:`${pct}%` }}/>
      </div>
    </div>
  );
}

// ─── Live dot ─────────────────────────────────────────────────────────────────
function LiveDot({ size = "md" }) {
  const s = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const p = size === "sm" ? "h-2 w-2"  : "h-2.5 w-2.5";
  return (
    <span className={`relative flex ${s}`}>
      <span className={`animate-ping absolute inline-flex ${p} rounded-full bg-green-400 opacity-75`}/>
      <span className={`relative inline-flex rounded-full ${s} bg-green-500`}/>
    </span>
  );
}

// ─── School event card ────────────────────────────────────────────────────────
function SchoolEventCard({ ev, isNew }) {
  const cat    = CAT_META[ev.category] ?? CAT_META.event;
  const today  = todayStr();
  const start  = new Date(ev.startDate + "T00:00:00");
  const end    = new Date(ev.endDate   + "T00:00:00");
  const todayD = new Date(today        + "T00:00:00");
  const diff   = Math.round((start - todayD) / 86400000);
  const isOngoing  = ev.startDate <= today && ev.endDate >= today;
  const isMultiDay = ev.startDate !== ev.endDate;

  const urgencyStyle = isOngoing      ? "bg-red-500 text-white"
    : diff === 1                      ? "bg-amber-500 text-white"
    : diff <= 3                       ? "bg-blue-500 text-white"
    : "bg-gray-100 text-gray-600";
  const urgencyLabel = isOngoing ? "Today!" : diff===1 ? "Tomorrow"
    : diff<=3 ? `In ${diff} days` : `${diff}d away`;

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
        isNew ? "ring-2 ring-blue-400 ring-offset-1" : ""
      }`}
      style={{ background:cat.bg, borderLeft:`3px solid ${cat.color}` }}
    >
      {isNew && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
          <Zap size={8}/> NEW
        </div>
      )}
      <div className="p-3 flex items-start gap-3">
        <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-white shadow-sm shrink-0"
          style={{ border:`1px solid ${cat.color}33` }}>
          <span className="text-base font-black leading-none" style={{color:cat.color}}>{start.getDate()}</span>
          <span className="text-[9px] font-bold uppercase" style={{color:cat.color}}>{MONTHS[start.getMonth()]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900 leading-snug flex-1">{ev.title}</p>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${urgencyStyle}`}>
              {urgencyLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {ev.location && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500"><MapPin size={9}/>{ev.location}</span>
            )}
            {isMultiDay && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Calendar size={9}/>until {end.getDate()} {MONTHS[end.getMonth()]}
              </span>
            )}
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background:`${cat.color}18`, color:cat.color }}>{cat.label}</span>
          </div>
          {ev.description && (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{ev.description}</p>
          )}
        </div>
      </div>
      {ev.reminder && (
        <div className="px-3 pb-2 flex items-center gap-1 text-[10px] text-amber-600 font-medium border-t border-black/5">
          <Bell size={9}/> Reminder set
        </div>
      )}
    </div>
  );
}

// ─── Period row ───────────────────────────────────────────────────────────────
function PeriodRow({ ev, nowMins, isCurrentDay }) {
  const meta      = getMeta(ev.type);
  const status    = isCurrentDay ? deriveStatus(ev, nowMins) : "upcoming";
  const isOngoing = status === "ongoing";

  const badge = {
    completed: { cls:"bg-green-100 text-green-700 border-green-200", icon:<CheckCircle size={12}/>, label:"Done"     },
    ongoing:   { cls:"bg-blue-100 text-blue-700 border-blue-200",    icon:<PlayCircle  size={12}/>, label:"Now"      },
    upcoming:  { cls:"bg-gray-100 text-gray-600 border-gray-200",    icon:<Clock       size={12}/>, label:"Upcoming" },
  }[status];

  return (
    <div className={`group rounded-xl overflow-hidden border transition-all duration-200 ${
      isOngoing
        ? "border-blue-300 shadow-md shadow-blue-100"
        : status === "completed"
          ? "border-gray-100 opacity-60"
          : "border-gray-100 hover:border-indigo-200 hover:shadow-sm"
    }`}>
      {isOngoing && <div className="h-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"/>}
      <div className={`p-4 flex items-center gap-4 ${isOngoing ? "bg-blue-50/40" : "bg-white"}`}>

        {/* Type icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.grad} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
          {meta.icon}
        </div>

        {/* Time column */}
        <div className="flex flex-col items-center w-16 shrink-0">
          <span className="text-xs font-bold text-gray-800">{ev.startTime || "—"}</span>
          <div className="w-px h-3 bg-gray-200 my-0.5"/>
          <span className="text-xs text-gray-400">{ev.endTime || "—"}</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{ev.title}</h3>
            {isOngoing && <LiveDot size="sm"/>}
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background:`${meta.color}18`, color:meta.color }}>{meta.label}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {ev.teacher && ev.teacher !== "Teacher" && (
              <span className="flex items-center gap-1 text-xs text-gray-500"><User size={11}/>{ev.teacher}</span>
            )}
            {ev.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11}/>{ev.location}</span>
            )}
            {ev.students && (
              <span className="flex items-center gap-1 text-xs text-gray-400"><BookOpen size={11}/>{ev.students}</span>
            )}
          </div>
          {ev.note && <p className="text-xs text-gray-400 mt-1 truncate italic">{ev.note}</p>}
        </div>

        {/* Status badge */}
        {isCurrentDay && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${badge.cls}`}>
            {badge.icon}{badge.label}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors"/>
      </div>
    </div>
  );
}

// ─── Empty day ────────────────────────────────────────────────────────────────
function EmptyDay({ totalEvents, onRefresh, onPickDay }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-dashed border-gray-200">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Calendar size={28} className="text-gray-300"/>
      </div>
      <p className="text-sm font-semibold text-gray-500">No classes today</p>

      {totalEvents > 0 ? (
        <>
          <p className="text-xs text-gray-400 mt-1">
            You have <span className="font-bold text-indigo-600">{totalEvents}</span> event{totalEvents !== 1 ? "s" : ""} scheduled this month
          </p>
          <button
            onClick={onPickDay}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Calendar size={12}/> Jump to next class
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 mt-1">Your teacher hasn't posted any events yet</p>
          <button onClick={onRefresh}
            className="mt-4 flex items-center gap-1.5 text-xs text-indigo-500 font-semibold hover:underline">
            <RefreshCw size={11}/> Refresh
          </button>
        </>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length:rows }).map((_,i) => (
        <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse"
          style={{ opacity: 1 - i * 0.18 }}/>
      ))}
    </div>
  );
}

// ─── Week-at-a-glance mini strip ──────────────────────────────────────────────
function WeekStrip({ byDay, selectedDay, calMonth, calYear, onSelect, onPrev, onNext }) {
  const today = todayName();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={onPrev}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
          <ChevronLeft size={16}/>
        </button>
        <span className="text-sm font-bold text-gray-700">
          {FULL_MONTH[calMonth - 1]} {calYear}
        </span>
        <button onClick={onNext}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Day pills */}
      <div className="grid grid-cols-6 gap-1.5">
        {WEEK_DAYS.map(day => {
          const isActive  = selectedDay === day;
          const isTodayD  = day === today;
          const count     = (byDay[day] ?? []).length;
          const hasEvents = count > 0;

          return (
            <button key={day} onClick={() => onSelect(day)}
              className={`relative flex flex-col items-center py-3 px-1 rounded-xl font-semibold text-xs transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : isTodayD
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : hasEvents
                      ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <span className="font-bold">{day.slice(0,3)}</span>

              {/* Event count badge */}
              {hasEvents ? (
                <span className={`mt-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/25 text-white" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {count}
                </span>
              ) : (
                <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-20"/>
              )}

              {/* Today marker */}
              {isTodayD && (
                <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                  isActive ? "bg-green-300" : "bg-green-500"
                }`}/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const MyTimetable = () => {
  const now = new Date();

  const [selectedDay, setSelectedDay] = useState(() => {
    const t = todayName();
    return WEEK_DAYS.includes(t) ? t : "Monday";
  });
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calYear,  setCalYear]  = useState(now.getFullYear());

  // Live clock
  const [nowMins, setNowMins] = useState(() => now.getHours() * 60 + now.getMinutes());
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMins(d.getHours() * 60 + d.getMinutes());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    byDay, loading:ttLoading, error:ttError,
    lastUpdated:ttUpdated, refetch:refetchTT,
  } = useStudentTimetable(calMonth, calYear);

  const {
    events:schoolEvents, loading:evLoading, error:evError,
    lastUpdated:evUpdated, refetch:refetchEv,
  } = useSchoolEvents(30);

  // ── Auto-jump: when data loads, jump to next day that has events ──────────
  const autoJumped = useRef(false);
  useEffect(() => {
    if (ttLoading || autoJumped.current) return;
    const today = todayName();
    if ((byDay[today] ?? []).length > 0) { autoJumped.current = true; return; }
    // rotate week starting from today
    const todayIdx = WEEK_DAYS.indexOf(today);
    const start    = todayIdx >= 0 ? todayIdx : 0;
    const ordered  = [...WEEK_DAYS.slice(start), ...WEEK_DAYS.slice(0, start)];
    const next     = ordered.find(d => (byDay[d] ?? []).length > 0);
    if (next) { setSelectedDay(next); autoJumped.current = true; }
  }, [byDay, ttLoading]);

  // Re-allow auto-jump when month changes
  useEffect(() => { autoJumped.current = false; }, [calMonth, calYear]);

  // ── New-event highlighting ────────────────────────────────────────────────
  const prevIds = useRef(new Set());
  const [newIds, setNewIds] = useState(new Set());
  useEffect(() => {
    const cur   = new Set(schoolEvents.map(e => e._id));
    const fresh = new Set([...cur].filter(id => !prevIds.current.has(id)));
    if (fresh.size > 0 && prevIds.current.size > 0) {
      setNewIds(fresh);
      setTimeout(() => setNewIds(new Set()), 8000);
    }
    prevIds.current = cur;
  }, [schoolEvents]);

  // Re-render "X ago" labels
  const [, tickAgo] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tickAgo(n => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isCurrentDay = selectedDay === todayName();
  const dayEvents    = byDay[selectedDay] ?? [];
  const today        = todayStr();
  const totalEvents  = useMemo(() => Object.values(byDay).flat().length, [byDay]);

  const currentPeriod = useMemo(() =>
    isCurrentDay ? dayEvents.find(e => deriveStatus(e, nowMins) === "ongoing") : null,
    [dayEvents, isCurrentDay, nowMins]
  );
  const nextPeriod = useMemo(() =>
    isCurrentDay ? dayEvents.find(e => deriveStatus(e, nowMins) === "upcoming") : null,
    [dayEvents, isCurrentDay, nowMins]
  );

  const todaySchoolEvts    = schoolEvents.filter(e => e.startDate <= today && e.endDate >= today);
  const upcomingSchoolEvts = schoolEvents.filter(e => e.startDate > today);
  const hasSchoolEvts      = todaySchoolEvts.length > 0 || upcomingSchoolEvts.length > 0;

  // ── Month nav ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Jump to first day with events
  const jumpToNextClass = useCallback(() => {
    const today = todayName();
    const todayIdx = WEEK_DAYS.indexOf(today);
    const start    = todayIdx >= 0 ? todayIdx : 0;
    const ordered  = [...WEEK_DAYS.slice(start), ...WEEK_DAYS.slice(0, start)];
    const next     = ordered.find(d => (byDay[d] ?? []).length > 0);
    if (next) setSelectedDay(next);
  }, [byDay]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    autoJumped.current = false;
    refetchTT(); refetchEv();
    await new Promise(r => setTimeout(r, 600));
    setRefreshing(false);
    toast.success("Refreshed");
  }, [refetchTT, refetchEv]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in-up{animation:fadeInUp .3s ease forwards}
        .stagger>*{opacity:0;animation:fadeInUp .3s ease forwards}
        .stagger>*:nth-child(1){animation-delay:0ms}
        .stagger>*:nth-child(2){animation-delay:55ms}
        .stagger>*:nth-child(3){animation-delay:110ms}
        .stagger>*:nth-child(4){animation-delay:165ms}
        .stagger>*:nth-child(5){animation-delay:220ms}
        .stagger>*:nth-child(6){animation-delay:275ms}
        .stagger>*:nth-child(7){animation-delay:330ms}
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Timetable</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live status pill */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
              ttError
                ? "text-red-600 bg-red-50 border-red-200"
                : "text-green-600 bg-green-50 border-green-200"
            }`}>
              {ttError ? <WifiOff size={11}/> : <LiveDot size="sm"/>}
              {ttLoading ? "Loading…"
                : ttError ? "Offline"
                : `Live${ttUpdated ? ` · ${timeAgo(ttUpdated)}` : ""}`
              }
            </div>

            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-50 disabled:opacity-50 transition-all">
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""}/>
              Refresh
            </button>

            <button onClick={() => toast.success("Downloading…")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
              <Download size={13}/> Download
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {ttError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={15} className="shrink-0"/>
            <span className="flex-1">{ttError}</span>
            <button onClick={refetchTT} className="text-xs font-bold underline shrink-0">Retry</button>
          </div>
        )}

        {/* ── Stats strip ── */}
        {!ttLoading && totalEvents > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {WEEK_DAYS.map(day => {
              const count    = (byDay[day] ?? []).length;
              const isToday  = day === todayName();
              const isSel    = day === selectedDay;
              const hasEvent = count > 0;
              return (
                <button key={day} onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-semibold transition-all border ${
                    isSel
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : isToday
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                        : hasEvent
                          ? "bg-white text-gray-700 border-gray-100 hover:border-indigo-200"
                          : "bg-white text-gray-300 border-gray-100"
                  }`}
                >
                  <span>{day.slice(0,3)}</span>
                  <span className={`text-base font-black mt-0.5 ${
                    isSel ? "text-white" : hasEvent ? "text-indigo-600" : "text-gray-200"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Live "Now" hero ── */}
        {isCurrentDay && currentPeriod && (() => {
          const meta = getMeta(currentPeriod.type);
          return (
            <div className={`rounded-2xl p-5 bg-gradient-to-br ${meta.grad} text-white shadow-lg fade-in-up`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {meta.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Live Now
                      </span>
                      <LiveDot size="sm"/>
                    </div>
                    <h2 className="text-xl font-black truncate">{currentPeriod.title}</h2>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/80">
                      {currentPeriod.teacher && (
                        <span className="flex items-center gap-1"><User size={11}/>{currentPeriod.teacher}</span>
                      )}
                      {currentPeriod.location && (
                        <span className="flex items-center gap-1"><MapPin size={11}/>{currentPeriod.location}</span>
                      )}
                      {currentPeriod.startTime && (
                        <span className="flex items-center gap-1"><Clock size={11}/>{currentPeriod.startTime}–{currentPeriod.endTime}</span>
                      )}
                    </div>
                    <ProgressBar ev={currentPeriod} nowMins={nowMins}/>
                  </div>
                </div>
                {nextPeriod && (
                  <div className="bg-white/15 rounded-xl px-4 py-3 backdrop-blur-sm shrink-0">
                    <p className="text-[11px] text-white/60 font-medium mb-1">Up next</p>
                    <p className="font-bold text-sm">{nextPeriod.title}</p>
                    <p className="text-xs text-white/70 mt-0.5">
                      {getMeta(nextPeriod.type).icon} {nextPeriod.startTime}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── School Events panel ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <School size={15} className="text-indigo-500 shrink-0"/>
              <h2 className="font-bold text-gray-900 text-sm">School Events</h2>
              {!evLoading && schoolEvents.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {schoolEvents.length}
                </span>
              )}
              {newIds.size > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap size={9}/>{newIds.size} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {evUpdated && !evLoading && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Wifi size={9} className="text-green-500"/>{timeAgo(evUpdated)}
                </span>
              )}
              <button onClick={refetchEv}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-indigo-600">
                <RefreshCw size={13} className={evLoading ? "animate-spin" : ""}/>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {evLoading && schoolEvents.length === 0 && (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" style={{opacity:1-i*0.2}}/>)}
              </div>
            )}
            {evError && !evLoading && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="shrink-0"/>
                <span className="flex-1">Could not load events</span>
                <button onClick={refetchEv} className="text-xs underline font-bold">Retry</button>
              </div>
            )}

            {todaySchoolEvts.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse"/>
                  Happening Today
                </p>
                <div className="space-y-2">
                  {todaySchoolEvts.map(ev => <SchoolEventCard key={ev._id} ev={ev} isNew={newIds.has(ev._id)}/>)}
                </div>
              </div>
            )}

            {upcomingSchoolEvts.length > 0 && (
              <div>
                {todaySchoolEvts.length > 0 && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"/>
                    Coming Up
                  </p>
                )}
                <div className="space-y-2">
                  {upcomingSchoolEvts.map(ev => <SchoolEventCard key={ev._id} ev={ev} isNew={newIds.has(ev._id)}/>)}
                </div>
              </div>
            )}

            {!evLoading && !evError && !hasSchoolEvts && (
              <div className="text-center py-8">
                <Calendar size={30} className="mx-auto text-gray-200 mb-2"/>
                <p className="text-sm text-gray-400">No upcoming school events</p>
                <p className="text-xs text-gray-300 mt-1">Auto-refreshes every 60 s</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Week strip + month nav ── */}
        <WeekStrip
          byDay={byDay}
          selectedDay={selectedDay}
          calMonth={calMonth}
          calYear={calYear}
          onSelect={setSelectedDay}
          onPrev={prevMonth}
          onNext={nextMonth}
        />

        {/* ── Day heading ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-800 text-sm">
              {isCurrentDay ? "Today · " : ""}{selectedDay}
            </h2>
            {dayEvents.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {dayEvents.length} {dayEvents.length === 1 ? "class" : "classes"}
              </span>
            )}
          </div>
          {ttUpdated && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Wifi size={9} className="text-green-500"/> {timeAgo(ttUpdated)}
            </span>
          )}
        </div>

        {/* ── No-events nudge (today is empty but month has events) ── */}
        {isCurrentDay && !ttLoading && dayEvents.length === 0 && totalEvents > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
            <Info size={15} className="shrink-0"/>
            <span className="flex-1">
              No classes today — <strong>{totalEvents}</strong> event{totalEvents !== 1 ? "s" : ""} scheduled this month.
            </span>
            <button onClick={jumpToNextClass}
              className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
              Jump to next →
            </button>
          </div>
        )}

        {/* ── Period list ── */}
        {ttLoading && dayEvents.length === 0
          ? <Skeleton rows={4}/>
          : dayEvents.length === 0
            ? <EmptyDay
                totalEvents={totalEvents}
                onRefresh={handleRefresh}
                onPickDay={jumpToNextClass}
              />
            : (
              <div className="space-y-2 stagger">
                {dayEvents.map(ev => (
                  <PeriodRow key={ev._id} ev={ev} nowMins={nowMins} isCurrentDay={isCurrentDay}/>
                ))}
              </div>
            )
        }

      </div>
    </div>
  );
};

export default MyTimetable;