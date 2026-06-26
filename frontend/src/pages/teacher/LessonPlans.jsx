// src/pages/teacher/curriculum/LessonPlans.jsx
// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: ALL hooks declared unconditionally at top of component.
//         Early-return (selector screen) happens AFTER every hook.
// FIX 2: fetchCurriculums() tries /curriculums (plural) first, falls back to
//         /curriculum (singular) on 404.  subjectId is only added to params
//         when it is defined — avoids the 404 the browser showed.
// FIX 3: Three-strategy fallback: subjectId → grade+name text → classId only.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Search, Eye, Clock, BookOpen,
  CheckCircle, AlertCircle, FileText, Target, X,
  RefreshCw, Filter, Layers, FolderOpen, Globe,
  Video, Image, Link as LinkIcon, Music, Zap,
  List, Grid, ChevronRight, Loader2,
} from "lucide-react";

// ── API ───────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

/** Try /curriculums first, fall back to /curriculum on 404 */
async function apiFetchCurriculums(params) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  clean._ = Date.now(); // ← add this line to bust 304 cache
  try {
    const { data } = await api.get("/curriculums", { params: clean });
    return data.curriculums ?? data.data ?? [];
  } catch (err) {
    if (err?.response?.status === 404) {
      const { data } = await api.get("/curriculum", { params: clean });
      const raw = data.curriculums ?? data.curriculum ?? data.data;
      if (!raw) return [];
      return Array.isArray(raw) ? raw : [raw];
    }
    throw err;
  }
}

// ── Domain constants ──────────────────────────────────────────────────────────
const LESSON_TYPES = {
  lecture:    { label: "Lecture",    color: "#6366f1", bg: "#eef2ff" },
  practical:  { label: "Practical",  color: "#10b981", bg: "#ecfdf5" },
  assessment: { label: "Assessment", color: "#f59e0b", bg: "#fffbeb" },
  discussion: { label: "Discussion", color: "#0ea5e9", bg: "#f0f9ff" },
  project:    { label: "Project",    color: "#8b5cf6", bg: "#f5f3ff" },
};

const UNIT_STATUS = {
  "not-started": { label: "Not Started", color: "#94a3b8", bg: "#f1f5f9" },
  "scheduled":   { label: "Scheduled",   color: "#f59e0b", bg: "#fffbeb" },
  "in-progress": { label: "In Progress", color: "#6366f1", bg: "#eef2ff" },
  "completed":   { label: "Completed",   color: "#10b981", bg: "#ecfdf5" },
};

const RESOURCE_ICONS  = { document: FileText, video: Video, image: Image, link: LinkIcon, audio: Music };
const RESOURCE_COLORS = { document: "#6366f1", video: "#ef4444", image: "#10b981", link: "#0ea5e9", audio: "#f59e0b" };

// ── Pure helpers ──────────────────────────────────────────────────────────────
const lt = (t) => LESSON_TYPES[t]  ?? LESSON_TYPES.lecture;
const us = (s) => UNIT_STATUS[s]   ?? UNIT_STATUS["not-started"];

const fmtMin = (m) => {
  if (!m) return "—";
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
};

// ── Dumb UI atoms (no hooks) ──────────────────────────────────────────────────
const Skel = () => (
  <div className="h-16 animate-pulse bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl" />
);

function TypeBadge({ type, xs }) {
  const t = lt(type);
  return (
    <span className={`inline-flex items-center font-bold rounded-full ${xs ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
      style={{ background: t.bg, color: t.color }}>
      {t.label}
    </span>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
      {label}
      <button onClick={onRemove}><X size={10} /></button>
    </span>
  );
}

function Stat({ value, label, color }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm flex items-center gap-2.5">
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-500 font-medium leading-tight">{label}</p>
    </div>
  );
}

// ── Lesson detail side-drawer ─────────────────────────────────────────────────
function LessonDrawer({ data, onClose }) {
  // Always called — data may be null, that's fine
  const lesson     = data?.lesson     ?? null;
  const unit       = data?.unit       ?? null;
  const curriculum = data?.curriculum ?? null;

  if (!lesson) return null;

  const t = lt(lesson.type);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 flex-shrink-0 flex items-start gap-3"
          style={{ background: t.bg, borderBottom: `2px solid ${t.color}30` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: t.color + "22" }}>
            <BookOpen size={18} style={{ color: t.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <TypeBadge type={lesson.type} />
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={11} /> {fmtMin(lesson.duration)}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-800">{lesson.title}</h3>
            {unit && <p className="text-xs text-slate-500 mt-0.5">{unit.title} · {curriculum?.subject}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/60 text-slate-500">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {lesson.description && <p className="text-sm text-slate-600 leading-relaxed">{lesson.description}</p>}

          {lesson.objectives?.filter(Boolean).length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Target size={12} style={{ color: "#6366f1" }} /> Learning Objectives
              </h4>
              <ul className="space-y-2">
                {lesson.objectives.filter(Boolean).map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" />{o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lesson.activities?.filter(Boolean).length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Zap size={12} style={{ color: "#f59e0b" }} /> Activities
              </h4>
              <ul className="space-y-2">
                {lesson.activities.filter(Boolean).map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(lesson.assessment || lesson.homework) && (
            <div className="grid grid-cols-2 gap-3">
              {lesson.assessment && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Assessment</p>
                  <p className="text-xs text-slate-700">{lesson.assessment}</p>
                </div>
              )}
              {lesson.homework && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Homework</p>
                  <p className="text-xs text-slate-700">{lesson.homework}</p>
                </div>
              )}
            </div>
          )}

          {lesson.resources?.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <FolderOpen size={12} style={{ color: "#10b981" }} /> Resources ({lesson.resources.length})
              </h4>
              <div className="space-y-2">
                {lesson.resources.map((r, idx) => {
                  const RI = RESOURCE_ICONS[r.type] ?? FileText;
                  const rc = RESOURCE_COLORS[r.type] ?? "#6366f1";
                  return (
                    <div key={r._id ?? idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: rc + "18" }}>
                        <RI size={13} style={{ color: rc }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{r.name}</p>
                        {r.size && <p className="text-[10px] text-slate-400">{r.size}</p>}
                      </div>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noreferrer"
                          className="p-1 rounded hover:bg-slate-100 text-slate-400">
                          <Globe size={12} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {unit && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Part of Unit</p>
              <p className="text-sm font-bold text-slate-700">{unit.title}</p>
              {unit.description && <p className="text-xs text-slate-500 mt-0.5">{unit.description}</p>}
              <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: us(unit.status).bg, color: us(unit.status).color }}>
                {us(unit.status).label}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Class + subject selector screen ──────────────────────────────────────────
function SelectorScreen({ onSelect }) {
  const [classes,    setClasses]    = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [selCls,     setSelCls]     = useState(null);
  const [selSub,     setSelSub]     = useState(null);
  const [loadCls,    setLoadCls]    = useState(true);
  const [loadSub,    setLoadSub]    = useState(false);
  const [clsErr,     setClsErr]     = useState("");

  useEffect(() => {
    api.get("/classes", { params: { isArchived: false, limit: 200 } })
      .then(({ data }) => setClasses(data.classes ?? []))
      .catch(() => setClsErr("Could not load classes."))
      .finally(() => setLoadCls(false));
  }, []);

  useEffect(() => {
    if (!selCls) { setSubjects([]); setSelSub(null); return; }
    setLoadSub(true); setSelSub(null);
    api.get("/subjects", { params: { classId: selCls._id, limit: 200 } })
      .then(({ data }) => setSubjects(data.subjects ?? []))
      .catch(() => setSubjects([]))
      .finally(() => setLoadSub(false));
  }, [selCls]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <BookOpen size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 text-center mb-1">Lesson Plans</h1>
        <p className="text-sm text-slate-400 text-center mb-8">View lessons from the school curriculum</p>

        {clsErr && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={14} /> {clsErr}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">
              Class <span className="text-red-500">*</span>
            </label>
            {loadCls
              ? <div className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Loading classes…
                </div>
              : <select value={selCls?._id ?? ""}
                  onChange={(e) => setSelCls(classes.find((c) => c._id === e.target.value) ?? null)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50">
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.displayName || `${c.name} - ${c.section}`}
                      {c.academicYear ? ` (${c.academicYear})` : ""}
                    </option>
                  ))}
                </select>
            }
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            {loadSub
              ? <div className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Loading subjects…
                </div>
              : <select value={selSub?._id ?? ""}
                  onChange={(e) => setSelSub(subjects.find((s) => s._id === e.target.value) ?? null)}
                  disabled={!selCls || subjects.length === 0}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:opacity-50">
                  <option value="">
                    {!selCls ? "Pick a class first…" : subjects.length === 0 ? "No subjects found" : "Select subject…"}
                  </option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>
                  ))}
                </select>
            }
            {selCls && !loadSub && subjects.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} /> Ask admin to assign subjects to this class.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => selCls && selSub && onSelect(selCls, selSub)}
          disabled={!selCls || !selSub}
          className="mt-6 w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <BookOpen size={15} /> View Lesson Plans
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// RULE: every hook must be called unconditionally before any early return.
// ══════════════════════════════════════════════════════════════════════════════
export default function LessonPlans() {
  const navigate = useNavigate();

  // ── 1. All state hooks ─────────────────────────────────────────────────────
  const [showSelector,  setShowSelector]  = useState(true);
  const [selClass,      setSelClass]      = useState(null);
  const [selSubject,    setSelSubject]    = useState(null);
  const [curriculums,   setCurriculums]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [loadErr,       setLoadErr]       = useState("");
  const [search,        setSearch]        = useState("");
  const [filterType,    setFilterType]    = useState("all");
  const [filterUnit,    setFilterUnit]    = useState("all");
  const [viewMode,      setViewMode]      = useState("list");
  const [activeLesson,  setActiveLesson]  = useState(null);
  const [toastMsg,      setToastMsg]      = useState("");

  // ── 2. useCallback hooks ───────────────────────────────────────────────────
  const clearToast   = useCallback(() => setToastMsg(""),  []);
  const clearFilters = useCallback(() => { setSearch(""); setFilterType("all"); setFilterUnit("all"); }, []);

  const loadCurriculums = useCallback(async (cls, sub) => {
    if (!cls || !sub) return;
    setLoading(true);
    setLoadErr("");
    setCurriculums([]);
    try {
      let result = [];

      // Strategy 1 — by subjectId (most accurate, only if id exists)
      if (sub._id) {
        result = await apiFetchCurriculums({ subjectId: sub._id, limit: 50 });
      }

      // Strategy 2 — by grade string + subject name
      if (result.length === 0) {
        const grade = cls.displayName || `${cls.name} - ${cls.section}`;
        result = await apiFetchCurriculums({ grade, subject: sub.name, limit: 50 });
      }

      // Strategy 3 — classId only, then filter client-side by subject name
      if (result.length === 0 && cls._id) {
        const all = await apiFetchCurriculums({ classId: cls._id, limit: 50 });
        result = all.filter(
          (c) => (c.subject ?? "").toLowerCase() === (sub.name ?? "").toLowerCase()
        );
        if (result.length === 0) result = all;
      }

      setCurriculums(result);
    } catch (e) {
      const msg = e?.response?.data?.message ?? e.message ?? "Failed to load curriculum.";
      setLoadErr(msg);
      setToastMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback((cls, sub) => {
    setSelClass(cls);
    setSelSubject(sub);
    setShowSelector(false);
    loadCurriculums(cls, sub);
  }, [loadCurriculums]);

  const handleRefresh = useCallback(() => {
    loadCurriculums(selClass, selSubject);
  }, [loadCurriculums, selClass, selSubject]);

  // ── 3. useEffect hooks ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(clearToast, 3200);
    return () => clearTimeout(t);
  }, [toastMsg, clearToast]);

  // ── 4. useMemo hooks ───────────────────────────────────────────────────────
  const allLessons = useMemo(() => {
    const out = [];
    curriculums.forEach((cur) => {
      (cur.units ?? []).forEach((unit) => {
        (unit.lessons ?? []).forEach((lesson) => {
          out.push({ lesson, unit, curriculum: cur });
        });
      });
    });
    return out;
  }, [curriculums]);

  const allUnits = useMemo(() => {
    const seen = new Set();
    const list = [];
    curriculums.forEach((cur) =>
      (cur.units ?? []).forEach((u) => {
        if (!seen.has(u._id)) { seen.add(u._id); list.push(u); }
      })
    );
    return list;
  }, [curriculums]);

  const filtered = useMemo(() => {
    return allLessons.filter(({ lesson, unit }) => {
      const q = search.toLowerCase();
      const ok_search =
        !search ||
        lesson.title.toLowerCase().includes(q) ||
        (lesson.description ?? "").toLowerCase().includes(q) ||
        lesson.objectives?.some((o) => (o ?? "").toLowerCase().includes(q)) ||
        unit.title.toLowerCase().includes(q);
      const ok_type = filterType === "all" || lesson.type === filterType;
      const ok_unit = filterUnit === "all" || unit._id    === filterUnit;
      return ok_search && ok_type && ok_unit;
    });
  }, [allLessons, search, filterType, filterUnit]);

  const stats = useMemo(() => {
    const byType = {};
    let dur = 0, res = 0;
    filtered.forEach(({ lesson }) => {
      byType[lesson.type] = (byType[lesson.type] ?? 0) + 1;
      dur += lesson.duration        ?? 0;
      res += lesson.resources?.length ?? 0;
    });
    return { total: filtered.length, units: allUnits.length, duration: dur, resources: res, byType };
  }, [filtered, allUnits]);

  const byUnit = useMemo(() => {
    const g = {};
    filtered.forEach((item) => {
      const k = item.unit._id;
      if (!g[k]) g[k] = { unit: item.unit, curriculum: item.curriculum, lessons: [] };
      g[k].lessons.push(item.lesson);
    });
    return Object.values(g);
  }, [filtered]);

  const byCurriculum = useMemo(() => {
    const g = {};
    filtered.forEach((item) => {
      const k = item.curriculum._id;
      if (!g[k]) g[k] = { curriculum: item.curriculum, items: [] };
      g[k].items.push(item);
    });
    return Object.values(g);
  }, [filtered]);

  // ─────────────────────────────────────────────────────────────────────────
  // ALL HOOKS DONE — safe to conditionally render now
  // ─────────────────────────────────────────────────────────────────────────
  if (showSelector) {
    return <SelectorScreen onSelect={handleSelect} />;
  }

  const classLabel  = selClass?.displayName || `${selClass?.name} - ${selClass?.section}`;
  const hasFilter   = search || filterType !== "all" || filterUnit !== "all";

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.fi{animation:fi .2s ease both}`}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 flex-shrink-0">
            <ArrowLeft size={17} />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <BookOpen size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">{selSubject?.name} — Lessons</p>
              <p className="text-xs text-slate-400 truncate">{classLabel}</p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
            {[{ m: "list", I: List }, { m: "board", I: Layers }, { m: "grid", I: Grid }].map(({ m, I }) => (
              <button key={m} onClick={() => setViewMode(m)}
                className="p-2 transition-colors"
                style={viewMode === m ? { background: "#6366f1", color: "#fff" } : { color: "#94a3b8" }}>
                <I size={14} />
              </button>
            ))}
          </div>

          <button onClick={handleRefresh} disabled={loading}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 flex-shrink-0"
            title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-500" : ""} />
          </button>

          <button onClick={() => { setShowSelector(true); setCurriculums([]); }}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 font-semibold flex-shrink-0">
            <Filter size={12} /> Change
          </button>
        </div>
      </div>

      <div className="px-5 py-5 max-w-6xl mx-auto space-y-4">

        {/* Error */}
        {loadErr && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span className="flex-1">{loadErr}</span>
            <button onClick={handleRefresh} className="underline text-xs font-semibold">Retry</button>
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="space-y-3 fi">
            {[...Array(5)].map((_, i) => <Skel key={i} />)}
          </div>
        )}

        {/* Empty — no curriculum */}
        {!loading && !loadErr && curriculums.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center fi">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-slate-400" />
            </div>
            <p className="font-bold text-slate-600">No curriculum found</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              Admin hasn't created a curriculum for <strong>{selSubject?.name}</strong> in <strong>{classLabel}</strong> yet.
            </p>
            <p className="text-xs text-slate-400 mt-2">Ask admin to build it in Curriculum Builder.</p>
          </div>
        )}

        {/* Stats */}
        {!loading && allLessons.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fi">
            <Stat value={stats.units}             label="Units"     color="#6366f1" />
            <Stat value={stats.total}             label="Lessons"   color="#8b5cf6" />
            <Stat value={fmtMin(stats.duration)}  label="Duration"  color="#10b981" />
            <Stat value={stats.resources}         label="Resources" color="#f59e0b" />
          </div>
        )}

        {/* Type pills filter */}
        {!loading && Object.keys(stats.byType).length > 1 && (
          <div className="flex flex-wrap gap-2 fi">
            {Object.entries(stats.byType).map(([type, count]) => {
              const t = lt(type);
              const active = filterType === type;
              return (
                <button key={type}
                  onClick={() => setFilterType(active ? "all" : type)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{ background: active ? t.color : t.bg, color: active ? "#fff" : t.color }}>
                  {t.label} · {count}
                </button>
              );
            })}
          </div>
        )}

        {/* Search + filter row */}
        {!loading && allLessons.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 fi">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search lessons or objectives…"
                  className="pl-9 pr-3 py-2.5 w-full border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
              </div>

              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400">
                <option value="all">All Types</option>
                {Object.entries(LESSON_TYPES).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>

              <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400">
                <option value="all">All Units</option>
                {allUnits.map((u) => <option key={u._id} value={u._id}>{u.title}</option>)}
              </select>
            </div>

            {hasFilter && (
              <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-semibold">Filters:</span>
                {search     && <Chip label={`"${search}"`}              onRemove={() => setSearch("")}          />}
                {filterType !== "all" && <Chip label={lt(filterType).label} onRemove={() => setFilterType("all")} />}
                {filterUnit !== "all" && (
                  <Chip label={allUnits.find((u) => u._id === filterUnit)?.title ?? "Unit"}
                    onRemove={() => setFilterUnit("all")} />
                )}
                <button onClick={clearFilters} className="text-xs text-red-500 font-semibold hover:text-red-700 ml-1">
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* No results after filter */}
        {!loading && curriculums.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 text-center fi">
            <Search size={26} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-500">No lessons match your filters</p>
            <button onClick={clearFilters} className="text-xs text-indigo-500 underline mt-2">Clear filters</button>
          </div>
        )}

        {/* ══ LIST VIEW ══ */}
        {!loading && viewMode === "list" && filtered.length > 0 && (
          <div className="space-y-2 fi">
            {filtered.map(({ lesson, unit, curriculum }, i) => {
              const t = lt(lesson.type);
              return (
                <div key={lesson._id ?? i}
                  onClick={() => setActiveLesson({ lesson, unit, curriculum })}
                  className="group flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: t.bg }}>
                    <BookOpen size={15} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <TypeBadge type={lesson.type} xs />
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Clock size={9} /> {fmtMin(lesson.duration)}
                      </span>
                      {lesson.resources?.length > 0 && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <FolderOpen size={9} /> {lesson.resources.length}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 text-sm truncate">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lesson.description}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                      {unit.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: us(unit.status).bg, color: us(unit.status).color }}>
                      {us(unit.status).label}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}

        {/* ══ BOARD VIEW ══ */}
        {!loading && viewMode === "board" && filtered.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 fi">
            {byUnit.map(({ unit, curriculum, lessons }) => {
              const st = us(unit.status);
              return (
                <div key={unit._id}
                  className="flex-shrink-0 w-64 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100" style={{ borderTop: `3px solid ${st.color}` }}>
                    <p className="text-sm font-black text-slate-800 truncate">{unit.title}</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: st.color }}>
                      {st.label} · {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                    {lessons.map((lesson) => {
                      const t = lt(lesson.type);
                      return (
                        <div key={lesson._id}
                          onClick={() => setActiveLesson({ lesson, unit, curriculum })}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 cursor-pointer">
                          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                            <TypeBadge type={lesson.type} xs />
                            <span className="text-[10px] text-slate-400">{fmtMin(lesson.duration)}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-2">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lesson.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ GRID VIEW ══ */}
        {!loading && viewMode === "grid" && filtered.length > 0 && (
          <div className="space-y-6 fi">
            {byCurriculum.map(({ curriculum, items }) => (
              <div key={curriculum._id}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    <BookOpen size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{curriculum.subject}</p>
                    <p className="text-[10px] text-slate-400">
                      {curriculum.grade} · {curriculum.academicYear} ·{" "}
                      <span style={{ color: curriculum.status === "published" ? "#10b981" : "#94a3b8" }}
                        className="font-semibold capitalize">{curriculum.status}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(({ lesson, unit }) => {
                    const t = lt(lesson.type);
                    return (
                      <div key={lesson._id}
                        onClick={() => setActiveLesson({ lesson, unit, curriculum })}
                        className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 hover:shadow-md cursor-pointer"
                        style={{ borderLeft: `3px solid ${t.color}` }}>
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <TypeBadge type={lesson.type} xs />
                          <span className="text-[10px] text-slate-400">{fmtMin(lesson.duration)}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-1">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{lesson.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400 truncate">{unit.title}</span>
                          {lesson.resources?.length > 0 && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <FolderOpen size={9} /> {lesson.resources.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Lesson detail drawer — always rendered (data may be null) */}
      <LessonDrawer data={activeLesson} onClose={() => setActiveLesson(null)} />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white bg-red-500">
          <AlertCircle size={14} /> {toastMsg}
        </div>
      )}
    </div>
  );
}