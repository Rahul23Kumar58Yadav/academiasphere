// src/pages/parent/ChildResults.jsx
// Route: /parent/children/:childId/results
//
// FIX SUMMARY:
// 1. Reset all state on every fetch to avoid stale data across refreshes
// 2. Expose a debug panel (toggle) showing resolved child, classSection, and what
//    getMyChildren returned — makes mismatch root-causes visible during development
// 3. Proper error surfaces for every failure path (no silent swallows)
// 4. Pass classSection explicitly alongside studentId in console logs
// 5. Graceful handling when childId is an ObjectId but child list uses sequential ids
// 6. classSection pill in the header always reflects live data from the DB

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RefreshCw, ArrowLeft, TrendingUp, TrendingDown, Minus,
  Trophy, AlertCircle, BarChart3, Award, Target,
  CheckCircle2, XCircle, Medal, Flame, Sparkles,
  ChevronDown, Clock, Globe, Send, User, Hash,
  BookOpen, Zap, Bug, ChevronUp,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  gradeOf,
  getExamTypes,
  getStudentResults,
  getMyChildren,
} from "../../services/resultApi";

// ─── helpers ──────────────────────────────────────────────────────────────────
const isObjectId = (s) => /^[a-f\d]{24}$/i.test(String(s ?? ""));

/**
 * Derive classSection string from a child/student document.
 * Handles every field combination the backend may return:
 *   • child.classSection  → "Grade 9-C"  or "9-C"
 *   • child.grade + child.section → built as "<grade>-<section>"
 *   • child.class + child.section → same
 *   • child.className alone → used as-is
 */
const deriveClassSection = (child) => {
  if (!child) return "";
  if (child.classSection?.trim()) return child.classSection.trim();
  const grade   = (child.grade   || child.class   || child.className || "").trim();
  const section = (child.section || "").trim();
  if (grade && section) return `${grade}-${section}`;
  return grade;
};

// ─── Grade metadata ────────────────────────────────────────────────────────────
const GRADE_META = {
  "A+": { emoji: "🏆", label: "Outstanding",   bg: "#dcfce7", c: "#15803d", bar: "#22c55e" },
  "A":  { emoji: "⭐", label: "Excellent",     bg: "#dbeafe", c: "#1d4ed8", bar: "#3b82f6" },
  "B+": { emoji: "✨", label: "Very Good",     bg: "#ede9fe", c: "#6d28d9", bar: "#8b5cf6" },
  "B":  { emoji: "👍", label: "Good",          bg: "#e0f2fe", c: "#0369a1", bar: "#0ea5e9" },
  "C":  { emoji: "📚", label: "Average",       bg: "#fef3c7", c: "#b45309", bar: "#f59e0b" },
  "D":  { emoji: "⚠️",  label: "Below Average", bg: "#ffedd5", c: "#c2410c", bar: "#f97316" },
  "F":  { emoji: "❌", label: "Fail",          bg: "#fee2e2", c: "#b91c1c", bar: "#ef4444" },
};

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
const Skeleton = ({ style = {} }) => (
  <div className="rounded-2xl" style={{
    background: "linear-gradient(90deg,#fef3c7 25%,#fde68a 50%,#fef3c7 75%)",
    backgroundSize: "200% 100%",
    animation: "cr-shimmer 1.5s infinite",
    ...style,
  }} />
);

const GradePill = ({ g, bg, c }) => {
  const meta = GRADE_META[g] || {};
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
      style={{ background: bg, color: c }}>
      <span>{meta.emoji}</span>{g}
    </span>
  );
};

const ProgressBar = ({ pct, color, h = 6 }) => (
  <div className="w-full rounded-full overflow-hidden"
    style={{ height: h, background: "rgba(0,0,0,0.06)" }}>
    <div className="h-full rounded-full transition-all duration-700"
      style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%`, background: color }} />
  </div>
);

const Ring = ({ pct = 0, color = "#b45309", size = 96, stroke = 8, children }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div className="relative z-10 text-center">{children}</div>
    </div>
  );
};

const TrendChip = ({ diff, prevName }) => {
  if (diff == null) return null;
  const isUp = diff > 0, isDown = diff < 0;
  return (
    <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{
        background: isUp ? "#dcfce7" : isDown ? "#fee2e2" : "#f1f5f9",
        color:      isUp ? "#15803d" : isDown ? "#b91c1c" : "#64748b",
      }}>
      {isUp ? <TrendingUp size={10}/> : isDown ? <TrendingDown size={10}/> : <Minus size={10}/>}
      {isUp ? `+${diff}` : diff} vs {prevName || "prev"}
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="bg-white rounded-2xl border border-amber-100/60 p-4 flex items-center gap-3
    hover:-translate-y-0.5 transition-all duration-200 shadow-sm">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: accent + "18" }}>
      <Icon size={20} style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-black truncate" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const cfg = {
    published: { label: "Official",  Icon: Globe, bg: "#dcfce7", c: "#15803d" },
    submitted: { label: "Submitted", Icon: Send,  bg: "#dbeafe", c: "#1d4ed8" },
    draft:     { label: "Draft",     Icon: Clock, bg: "#f1f5f9", c: "#64748b" },
  }[status] || { label: "Draft", Icon: Clock, bg: "#f1f5f9", c: "#64748b" };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.c }}>
      <cfg.Icon size={10}/>{cfg.label}
    </span>
  );
};

const InfoPill = ({ icon: Icon, text, accent = "#92400e" }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
    style={{ background: accent + "14", color: accent }}>
    <Icon size={11}/>{text}
  </span>
);

// ─── Debug panel ──────────────────────────────────────────────────────────────
// Shows resolved IDs and classSection so you can spot mismatches immediately.
// Remove or gate behind NODE_ENV in production.
const DebugPanel = ({ childId, childInfo, childrenList, classSection }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden text-xs font-mono">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-amber-700 font-semibold hover:bg-amber-100 transition">
        <Bug size={13}/>
        Debug: child resolution
        {open ? <ChevronUp size={12} className="ml-auto"/> : <ChevronDown size={12} className="ml-auto"/>}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1 text-amber-800 border-t border-amber-200">
          <p><span className="opacity-60">URL childId:</span> {String(childId)}</p>
          <p><span className="opacity-60">isObjectId:</span> {String(isObjectId(childId))}</p>
          <p><span className="opacity-60">children in list:</span> {childrenList?.length ?? "—"}</p>
          {childrenList?.map((c, i) => (
            <p key={c._id || i} className="pl-3">
              [{i}] _id={String(c._id)} name={c.name} grade={c.grade} section={c.section}
              {" "}classSection={c.classSection || "—"} rollNo={c.rollNo || c.rollNumber || "—"}
            </p>
          ))}
          <p className="mt-1"><span className="opacity-60">→ resolved _id:</span> {childInfo?._id ? String(childInfo._id) : "❌ NOT RESOLVED"}</p>
          <p><span className="opacity-60">→ resolved name:</span> {childInfo?.name || "—"}</p>
          <p><span className="opacity-60">→ derived classSection:</span> {classSection || "❌ EMPTY — results will be empty!"}</p>
          {!classSection && (
            <p className="text-red-600 font-bold">
              ⚠ classSection is empty. The backend will fail to find result sheets.
              Ensure the student document has grade+section or classSection populated.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
export default function ChildResults() {
  const { childId }  = useParams();
  const navigate     = useNavigate();
  const { authFetch, loading: authLoading } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [exams,         setExams]         = useState([]);
  const [allData,       setAllData]       = useState({});
  const [examSummaries, setExamSummaries] = useState([]);
  const [selectedExam,  setSelectedExam]  = useState(null);
  const [childInfo,     setChildInfo]     = useState(null);
  const [childrenList,  setChildrenList]  = useState([]); // kept for debug panel
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [showTable,     setShowTable]     = useState(false);
  const [showDebug,     setShowDebug]     = useState(false); // flip to true during dev

  const fetchRef = useRef(authFetch);
  useEffect(() => { fetchRef.current = authFetch; }, [authFetch]);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !childId) return;

    // Reset everything so stale data never bleeds across refreshes
    setLoading(true);
    setError(null);
    setChildInfo(null);
    setChildrenList([]);
    setExams([]);
    setAllData({});
    setExamSummaries([]);
    setSelectedExam(null);

    const fetch = fetchRef.current;

    // ── Step 1: resolve the real Student._id from the children list ──────────
    getMyChildren(fetch)
      .then(async (childrenRes) => {
        // Normalise the response — some backends return { data: [...] }, others [...]
        const list = Array.isArray(childrenRes?.data)
          ? childrenRes.data
          : Array.isArray(childrenRes)
          ? childrenRes
          : [];

        setChildrenList(list); // for debug panel

        // --- Resolution strategy ---
        // A) Exact ObjectId match on _id
        // B) Exact ObjectId match on userId (some schemas put auth id here)
        // C) Numeric index in the list ("0", "1", …)
        // D) If only one child, use them regardless
        let resolvedChild = null;

        if (isObjectId(childId)) {
          resolvedChild =
            list.find((c) => String(c._id)     === String(childId)) ||
            list.find((c) => String(c.userId)  === String(childId)) ||
            list.find((c) => String(c.user)    === String(childId));
        }

        if (!resolvedChild) {
          const idx = parseInt(childId, 10);
          if (!isNaN(idx) && idx >= 0 && idx < list.length) {
            resolvedChild = list[idx];
          }
        }

        if (!resolvedChild && list.length === 1) {
          resolvedChild = list[0];
        }

        if (!resolvedChild) {
          const detail = list.length === 0
            ? "No children are linked to your account. Contact the school admin."
            : `Could not match childId "${childId}" to any of your ${list.length} child(ren). `
              + `Available _ids: ${list.map((c) => c._id).join(", ")}`;
          throw new Error(detail);
        }

        setChildInfo(resolvedChild);

        // ── Step 2: derive identifiers ────────────────────────────────────────
        const realStudentId = String(resolvedChild._id);
        const classSection  = deriveClassSection(resolvedChild);

        console.log("[ChildResults] resolved student:", {
          _id: realStudentId,
          name: resolvedChild.name,
          grade: resolvedChild.grade,
          section: resolvedChild.section,
          classSection: resolvedChild.classSection,
          derivedClassSection: classSection,
          rollNo: resolvedChild.rollNo || resolvedChild.rollNumber,
        });

        if (!classSection) {
          console.warn(
            "[ChildResults] classSection is empty for student", realStudentId,
            "— result sheets may not be found. Ensure student doc has grade+section."
          );
        }

        // ── Step 3: fetch exam types + results in parallel ────────────────────
        const [examRes, resultsRes] = await Promise.all([
          getExamTypes(fetch, classSection).catch((err) => {
            console.warn("[ChildResults] getExamTypes failed:", err.message);
            return { data: [] };
          }),
          getStudentResults(fetch, realStudentId).catch((err) => {
            // Surface this as a visible error — don't silently return empty
            throw new Error(`Could not load results for ${resolvedChild.name}: ${err.message}`);
          }),
        ]);

        const data      = resultsRes.data          || {};
        const summaries = resultsRes.examSummaries || [];

        setAllData(data);
        setExamSummaries(summaries);

        console.log("[ChildResults] results data keys:", Object.keys(data));
        console.log("[ChildResults] examSummaries:", summaries);

        // Build exam list from ExamType docs; fall back to result keys
        const examList = (examRes.data || [])
          .filter((e) => e.isActive !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const finalExams = examList.length > 0
          ? examList
          : Object.keys(data).map((name) => ({ name, shortName: name, max: 100 }));

        setExams(finalExams);

        // Auto-select: first exam that has actual data, else first exam
        const firstWithData = finalExams.find((ex) => data[ex.name]);
        setSelectedExam(firstWithData || finalExams[0] || null);
      })
      .catch((err) => {
        console.error("[ChildResults] fatal error:", err);
        setError(err.message || "Could not load results.");
      })
      .finally(() => setLoading(false));

  }, [authLoading, childId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ──────────────────────────────────────────────────────────
  const classSection = deriveClassSection(childInfo);

  const examData  = selectedExam ? (allData[selectedExam.name] || {}) : {};
  const subjects  = useMemo(() => Object.keys(examData), [examData]);
  const validSubs = useMemo(
    () => Object.values(examData).filter((d) => d?.score != null), [examData]
  );
  const total    = validSubs.reduce((a, d) => a + (d.score || 0), 0);
  const maxTotal = validSubs.reduce((a, d) => a + (d.max   || 0), 0);
  const overall  = maxTotal > 0 ? gradeOf(total, maxTotal) : null;
  const oMeta    = overall ? (GRADE_META[overall.g] || {}) : {};

  const examStatus = useMemo(() => {
    const ss = Object.values(examData).map((d) => d?.status).filter(Boolean);
    if (ss.includes("published")) return "published";
    if (ss.includes("submitted")) return "submitted";
    return "draft";
  }, [examData]);

  const prevExam = useMemo(() => {
    if (!selectedExam || exams.length < 2) return null;
    const idx = exams.findIndex((e) => e.name === selectedExam.name);
    return idx > 0 ? exams[idx - 1] : null;
  }, [selectedExam, exams]);
  const prevExamData = prevExam ? (allData[prevExam.name] || {}) : {};

  const overallTrend = useMemo(() => {
    const withData = exams.filter((ex) => examSummaries.find((s) => s.examName === ex.name));
    if (withData.length < 2) return null;
    const first = examSummaries.find((s) => s.examName === withData[0].name)?.pct || 0;
    const last  = examSummaries.find((s) => s.examName === withData[withData.length - 1].name)?.pct || 0;
    return last - first;
  }, [exams, examSummaries]);

  const { bestSubject, worstSubject } = useMemo(() => {
    let best = null, bestPct = -1, worst = null, worstPct = 101;
    for (const sub of subjects) {
      const d = examData[sub];
      if (d?.score == null) continue;
      const pct = Math.round((d.score / d.max) * 100);
      if (pct > bestPct)  { bestPct  = pct; best  = sub; }
      if (pct < worstPct) { worstPct = pct; worst = sub; }
    }
    return { bestSubject: best, worstSubject: worst };
  }, [subjects, examData]);

  const hasAnyResults = Object.keys(allData).length > 0;

  const displayName  = childInfo?.name || "Your Child";
  const rollNo       = childInfo?.rollNo || childInfo?.rollNumber || "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-16" style={{ background: "#fffbf5" }}>
      <style>{`
        @keyframes cr-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes cr-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .cr0{animation:cr-up .35s ease both}
        .cr1{animation:cr-up .35s .06s ease both}
        .cr2{animation:cr-up .35s .12s ease both}
        .cr3{animation:cr-up .35s .18s ease both}
        .cr4{animation:cr-up .35s .24s ease both}
        .cr5{animation:cr-up .35s .30s ease both}
        .cr-card{transition:box-shadow .2s,transform .2s}
        .cr-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(146,64,14,.12)}
        .cr-tab{transition:all .15s ease}
        .cr-tab:hover{transform:translateY(-1px)}
      `}</style>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30"
        style={{ background: "rgba(255,251,245,0.92)", backdropFilter: "blur(12px)",
                 borderBottom: "1px solid rgba(217,119,6,0.15)" }}>
        <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold
                text-amber-700 hover:bg-amber-100 transition flex-shrink-0">
              <ArrowLeft size={15}/> Back
            </button>
            <div className="h-4 w-px bg-amber-200 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base font-black text-gray-900 truncate leading-tight">
                {displayName}'s Results
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {classSection && <InfoPill icon={BookOpen} text={classSection} />}
                {rollNo       && <InfoPill icon={Hash}     text={`Roll ${rollNo}`} accent="#0369a1" />}
                {/* Live status pill — shows when data loaded */}
                {!loading && !error && childInfo && !classSection && (
                  <InfoPill icon={AlertCircle} text="No class assigned" accent="#b91c1c" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Debug toggle — remove in production */}
            <button
              onClick={() => setShowDebug((v) => !v)}
              className="p-2 rounded-xl text-amber-500 hover:bg-amber-100 transition"
              title="Toggle debug panel">
              <Bug size={14}/>
            </button>
            <button onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                text-amber-700 border border-amber-200 hover:bg-amber-50 transition disabled:opacity-40">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-5 space-y-4">

        {/* ── Debug panel ── */}
        {showDebug && (
          <DebugPanel
            childId={childId}
            childInfo={childInfo}
            childrenList={childrenList}
            classSection={classSection}
          />
        )}

        {/* ── classSection warning ── */}
        {!loading && childInfo && !classSection && (
          <div className="cr0 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3.5">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-500"/>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-700 text-sm">Class not set for this student</p>
              <p className="text-xs text-amber-600 mt-0.5">
                The student record for <strong>{displayName}</strong> has no grade/section/classSection.
                Ask your school admin to update it — results cannot be loaded without a class assignment.
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="cr0 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500"/>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-700 text-sm">Could not load results</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full
                hover:bg-red-100 text-red-400 text-lg flex-shrink-0">×</button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton style={{ height: 240 }}/>
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: 56 }}/>)}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} style={{ height: 130 }}/>)}
            </div>
          </div>

        ) : !hasAnyResults ? (
          /* ── Empty state: distinguish "no class" vs "no marks yet" ── */
          <div className="cr0 bg-white rounded-3xl border-2 border-dashed border-amber-200 py-20 text-center">
            <div className="text-6xl mb-4">{!classSection ? "🏫" : "📋"}</div>
            <p className="text-lg font-black text-gray-700 mb-1">
              {!classSection ? "Student has no class assigned" : "No results yet"}
            </p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              {!classSection
                ? "This student has no grade or section in the database. Contact the school admin to assign a class."
                : "The teacher hasn't submitted marks yet, or results are still in draft. Check back soon."}
            </p>
            {classSection && (
              <p className="text-xs text-gray-300 mt-2">Class: {classSection}</p>
            )}
            {classSection && (
              <button onClick={() => setRefreshKey((k) => k + 1)}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  text-sm font-bold text-white hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg,#92400e,#b45309)" }}>
                <RefreshCw size={14}/> Check again
              </button>
            )}
          </div>

        ) : (<>

          {/* ══ Hero Banner ══ */}
          <div className="cr0 rounded-3xl overflow-hidden relative"
            style={{ background: "linear-gradient(135deg,#78350f 0%,#92400e 40%,#b45309 75%,#d97706 100%)" }}>
            <div style={{ position:"absolute",top:-60,right:-60,width:220,height:220,
              borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none" }}/>
            <div style={{ position:"absolute",bottom:-50,left:-50,width:180,height:180,
              borderRadius:"50%",background:"rgba(255,255,255,0.04)",pointerEvents:"none" }}/>

            <div className="relative px-6 py-7 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {classSection && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(255,255,255,0.15)" }}>
                        <User size={11}/>{classSection}
                      </div>
                    )}
                    {rollNo && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold opacity-70"
                        style={{ background: "rgba(255,255,255,0.1)" }}>
                        <Hash size={10}/>Roll {rollNo}
                      </div>
                    )}
                  </div>
                  <h2 className="text-3xl font-black leading-tight mb-2">{displayName}</h2>
                  {selectedExam && overall && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm opacity-70">{selectedExam.name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-black"
                        style={{ background: "rgba(255,255,255,0.18)" }}>
                        {oMeta.emoji} {overall.g} · {oMeta.label}
                      </span>
                      {examStatus === "submitted" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-400/20 text-blue-100">
                          ✓ Submitted
                        </span>
                      )}
                      {examStatus === "published" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-400/20 text-emerald-100">
                          ✓ Official
                        </span>
                      )}
                    </div>
                  )}
                  {overallTrend != null && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold
                      px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                      {overallTrend > 0
                        ? <><TrendingUp size={12} className="text-emerald-300"/><span className="text-emerald-300">+{overallTrend}%</span></>
                        : overallTrend < 0
                        ? <><TrendingDown size={12} className="text-red-300"/><span className="text-red-300">{overallTrend}%</span></>
                        : <><Minus size={12}/><span>Steady</span></>}
                      <span className="opacity-60">overall trend</span>
                    </div>
                  )}
                </div>
                {overall && (
                  <Ring pct={overall.p} color={oMeta.bar || "#fbbf24"} size={100} stroke={8}>
                    <p className="text-3xl font-black leading-none">{overall.p}%</p>
                    <p className="text-xs opacity-60 font-bold mt-0.5">{overall.g}</p>
                  </Ring>
                )}
              </div>

              {/* Exam mini-cards */}
              {exams.length > 0 && (
                <div className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${Math.min(exams.length, 4)}, 1fr)` }}>
                  {exams.map((ex) => {
                    const es  = examSummaries.find((s) => s.examName === ex.name);
                    const pct = es?.pct ?? null;
                    const sel = selectedExam?.name === ex.name;
                    const g   = pct != null ? gradeOf(pct, 100) : null;
                    return (
                      <button key={ex.name} onClick={() => setSelectedExam(ex)}
                        className="rounded-2xl p-3 text-left transition-all hover:scale-[1.02]"
                        style={{
                          background: sel ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.09)",
                          boxShadow:  sel ? "0 0 0 2px rgba(255,255,255,0.45)" : "none",
                        }}>
                        <p className="text-xs font-bold opacity-70 truncate mb-1">
                          {ex.shortName || ex.name}
                        </p>
                        <p className="text-2xl font-black leading-none">
                          {pct != null ? `${pct}%` : "—"}
                        </p>
                        {pct != null && (
                          <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.2)" }}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width:`${pct}%`, background: GRADE_META[g?.g]?.bar || "#fff" }}/>
                          </div>
                        )}
                        <p className="text-xs opacity-40 mt-1">/{ex.max} pts</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Exam tabs ── */}
          {exams.length > 1 && (
            <div className="cr1 flex gap-2 flex-wrap">
              {exams.map((ex) => {
                const es  = examSummaries.find((s) => s.examName === ex.name);
                const sel = selectedExam?.name === ex.name;
                return (
                  <button key={ex.name} onClick={() => setSelectedExam(ex)}
                    className="cr-tab flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border"
                    style={sel
                      ? { background:"#92400e", color:"#fff", borderColor:"#92400e",
                          boxShadow:"0 2px 10px rgba(146,64,14,.35)" }
                      : { background:"#fff", color:"#374151", borderColor:"#e5e7eb" }}>
                    {ex.name}
                    {es?.pct != null && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-black"
                        style={sel
                          ? { background:"rgba(255,255,255,0.2)" }
                          : { background:"#f3f4f6", color:"#6b7280" }}>
                        {es.pct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── No data for selected exam ── */}
          {selectedExam && !validSubs.length ? (
            <div className="cr1 bg-white rounded-2xl border-2 border-dashed border-amber-200 py-14 text-center">
              <Clock size={32} className="text-amber-200 mx-auto mb-3"/>
              <p className="font-bold text-gray-500">
                {selectedExam.name} marks haven't been entered yet
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Check back after the teacher submits marks
              </p>
            </div>

          ) : validSubs.length > 0 && (<>

            {/* ── KPI strip ── */}
            <div className="cr2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard icon={BarChart3} label="Total Score"
                value={`${total}/${maxTotal}`} accent="#92400e"
                sub={`${validSubs.length} subjects`}/>
              <KpiCard icon={Award} label="Percentage"
                value={`${overall?.p ?? 0}%`} accent={oMeta.c || "#92400e"}/>
              <KpiCard icon={Target} label="Grade"
                value={overall ? `${oMeta.emoji} ${overall.g}` : "—"}
                accent={oMeta.c || "#92400e"} sub={oMeta.label}/>
              <KpiCard
                icon={overall?.p >= 35 ? CheckCircle2 : XCircle}
                label="Result"
                value={overall?.p >= 35 ? "PASS ✓" : "FAIL ✗"}
                accent={overall?.p >= 35 ? "#15803d" : "#b91c1c"}/>
            </div>

            {/* ── Best / Worst ── */}
            {bestSubject && worstSubject && bestSubject !== worstSubject && (
              <div className="cr2 grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 cr-card"
                  style={{ border:"1.5px solid #bbf7d0" }}>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Trophy size={20} className="text-emerald-600"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Strongest</p>
                    <p className="font-black text-gray-900 truncate">{bestSubject}</p>
                    <p className="text-sm font-bold text-emerald-600">
                      {examData[bestSubject]?.score}/{examData[bestSubject]?.max} ·{" "}
                      {Math.round((examData[bestSubject].score / examData[bestSubject].max) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 cr-card"
                  style={{ border:"1.5px solid #fecaca" }}>
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-red-500"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Needs Attention</p>
                    <p className="font-black text-gray-900 truncate">{worstSubject}</p>
                    <p className="text-sm font-bold text-red-500">
                      {examData[worstSubject]?.score}/{examData[worstSubject]?.max} ·{" "}
                      {Math.round((examData[worstSubject].score / examData[worstSubject].max) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Best subject banner ── */}
            {bestSubject && (
              <div className="cr3 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background:"linear-gradient(135deg,#fef3c7,#fde68a)", color:"#92400e" }}>
                <Medal size={18} className="flex-shrink-0" style={{ color:"#d97706" }}/>
                <span>
                  Best subject: <strong>{bestSubject}</strong> —{" "}
                  {examData[bestSubject]?.score}/{examData[bestSubject]?.max} (
                  {Math.round((examData[bestSubject].score / examData[bestSubject].max) * 100)}%)
                </span>
                <Flame size={16} style={{ color:"#f59e0b", marginLeft:"auto" }}/>
              </div>
            )}

            {/* ── Subject cards ── */}
            <div className="cr3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap size={12} className="text-amber-500"/>Subject Breakdown
                </h3>
                <StatusBadge status={examStatus}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjects.map((sub) => {
                  const d    = examData[sub];
                  const g    = d?.score != null ? gradeOf(d.score, d.max) : null;
                  const meta = g ? (GRADE_META[g.g] || {}) : {};
                  const prev = prevExamData[sub];
                  const diff = g && prev?.score != null ? d.score - prev.score : null;
                  return (
                    <div key={sub} className="cr-card bg-white rounded-2xl overflow-hidden"
                      style={{ border:`1.5px solid ${meta.bg || "#f3f4f6"}` }}>
                      <div className="h-1.5" style={{ background: meta.bar || "#e2e8f0" }}/>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-bold text-gray-800 leading-tight">{sub}</p>
                          {g
                            ? <GradePill {...g}/>
                            : <span className="text-xs text-gray-300 font-medium">No mark</span>}
                        </div>
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <span className="text-3xl font-black"
                              style={{ color: meta.c || "#94a3b8", fontVariantNumeric:"tabular-nums" }}>
                              {d?.score ?? "—"}
                            </span>
                            {d && <span className="text-sm text-gray-400 ml-1 font-medium">/{d.max}</span>}
                          </div>
                          {diff != null && (
                            <TrendChip diff={diff} prevName={prevExam?.shortName || prevExam?.name}/>
                          )}
                        </div>
                        {g && (
                          <>
                            <ProgressBar pct={g.p} color={meta.bar}/>
                            <div className="flex justify-between mt-1.5">
                              <span className="text-xs text-gray-400 font-medium">{meta.label}</span>
                              <span className="text-xs font-black" style={{ color: meta.c }}>{g.p}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Full score table ── */}
            <div className="cr4 bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
              <button onClick={() => setShowTable((t) => !t)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-amber-50/40 transition">
                <div className="text-left">
                  <h3 className="font-black text-gray-800 text-sm">
                    Full Score Sheet —{" "}
                    <span style={{ color:"#92400e" }}>{selectedExam?.name}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Marks as entered by the teacher</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 flex-shrink-0 transition-transform"
                  style={{ transform: showTable ? "rotate(180deg)" : "none" }}/>
              </button>
              {showTable && (
                <div className="overflow-x-auto border-t border-amber-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-amber-50/60">
                        {["Subject","Max","Scored","Pct","Grade","Result"].map((h) => (
                          <th key={h}
                            className="py-3 px-4 text-xs font-bold text-amber-800/60 uppercase tracking-wider text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, i) => {
                        const d    = examData[sub];
                        const g    = d?.score != null ? gradeOf(d.score, d.max) : null;
                        const meta = g ? (GRADE_META[g.g] || {}) : {};
                        return (
                          <tr key={sub}
                            className={`border-t border-gray-50 ${i % 2 ? "bg-amber-50/20" : ""}`}>
                            <td className="py-3 px-4 font-bold text-gray-800">{sub}</td>
                            <td className="py-3 px-4 text-gray-500 font-medium">{d?.max ?? "—"}</td>
                            <td className="py-3 px-4">
                              <span className="font-black text-base" style={{ color: meta.c || "#94a3b8" }}>
                                {d?.score != null
                                  ? d.score
                                  : <span className="text-gray-300 text-sm font-normal">—</span>}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {g ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full"
                                      style={{ width:`${g.p}%`, background: meta.bar }}/>
                                  </div>
                                  <span className="text-xs font-black w-8"
                                    style={{ color: meta.c }}>{g.p}%</span>
                                </div>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3 px-4">
                              {g ? <GradePill {...g}/> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3 px-4">
                              {g && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                  g.p >= 35 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                }`}>
                                  {g.p >= 35 ? "PASS" : "FAIL"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {overall && (
                      <tfoot>
                        <tr className="border-t-2 border-amber-200" style={{ background:"#fef3c7" }}>
                          <td className="py-3 px-4 font-black text-amber-900">TOTAL</td>
                          <td className="py-3 px-4 font-bold text-gray-600">{maxTotal}</td>
                          <td className="py-3 px-4 font-black text-2xl" style={{ color:oMeta.c }}>{total}</td>
                          <td className="py-3 px-4 font-black" style={{ color:oMeta.c }}>{overall.p}%</td>
                          <td className="py-3 px-4"><GradePill {...overall}/></td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${
                              overall.p >= 35 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}>
                              {overall.p >= 35 ? "✓ PASS" : "✗ FAIL"}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

            {/* ── Cross-exam comparison ── */}
            {examSummaries.length > 1 && (
              <div className="cr5 bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-50 flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-500"/>
                  <h3 className="font-black text-gray-800 text-sm">Performance Across All Exams</h3>
                </div>
                <div className="p-5 space-y-4">
                  {[...examSummaries]
                    .sort((a, b) => {
                      const ai = exams.findIndex((e) => e.name === a.examName);
                      const bi = exams.findIndex((e) => e.name === b.examName);
                      return ai - bi;
                    })
                    .map((es) => {
                      const g    = gradeOf(es.total || 0, es.maxTotal || 1);
                      const meta = g ? (GRADE_META[g.g] || {}) : {};
                      const ex   = exams.find((e) => e.name === es.examName);
                      const isSel = selectedExam?.name === es.examName;
                      return (
                        <button key={es.examName}
                          onClick={() => setSelectedExam(ex || null)}
                          className="w-full text-left transition-all hover:scale-[1.01]">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-black text-gray-500 w-16 text-right flex-shrink-0 truncate">
                              {ex?.shortName || es.examName}
                            </span>
                            <div className="flex-1">
                              <ProgressBar pct={es.pct || 0} color={meta.bar || "#fde68a"} h={10}/>
                            </div>
                            <span className="text-sm font-black w-10 text-right flex-shrink-0"
                              style={{ color: meta.c || "#94a3b8" }}>
                              {es.pct ?? 0}%
                            </span>
                            {g && <GradePill {...g}/>}
                          </div>
                          {isSel && (
                            <div className="ml-20 text-xs text-amber-600 font-bold">← viewing now</div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

          </>)}
        </>)}
      </div>
    </div>
  );
}