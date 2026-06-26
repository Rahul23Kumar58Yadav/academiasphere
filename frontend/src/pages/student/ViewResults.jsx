// src/pages/student/ViewResults.jsx
// Route: /student/results

import { useState, useEffect, useMemo, useRef } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  BarChart3,
  AlertCircle,
  X,
  ChevronDown,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Medal,
  Flame,
  Globe,
  Send,
  Bug,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  gradeOf,
  DEFAULT_SUBJECTS,
  getExamTypes,
  getStudentResults,
  getMyStudentProfile,
} from "../../services/resultApi";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GRADE_META = {
  "A+": {
    emoji: "🏆",
    label: "Outstanding",
    bg: "#dcfce7",
    c: "#15803d",
    bar: "#22c55e",
  },
  A: {
    emoji: "⭐",
    label: "Excellent",
    bg: "#dbeafe",
    c: "#1d4ed8",
    bar: "#3b82f6",
  },
  "B+": {
    emoji: "✨",
    label: "Very Good",
    bg: "#ede9fe",
    c: "#6d28d9",
    bar: "#8b5cf6",
  },
  B: {
    emoji: "👍",
    label: "Good",
    bg: "#e0f2fe",
    c: "#0369a1",
    bar: "#0ea5e9",
  },
  C: {
    emoji: "📚",
    label: "Average",
    bg: "#fef3c7",
    c: "#b45309",
    bar: "#f59e0b",
  },
  D: {
    emoji: "⚠️",
    label: "Below Average",
    bg: "#ffedd5",
    c: "#c2410c",
    bar: "#f97316",
  },
  F: {
    emoji: "❌",
    label: "Fail",
    bg: "#fee2e2",
    c: "#b91c1c",
    bar: "#ef4444",
  },
};

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
const Spinner = ({ size = 20, color = "#6366f1" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ animation: "spin 0.75s linear infinite" }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2.5"
      strokeOpacity=".2"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const GradePill = ({ g, bg, c }) => {
  const meta = GRADE_META[g] || {};
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide"
      style={{ background: bg, color: c }}
    >
      <span>{meta.emoji}</span>
      {g}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const config = {
    published: { label: "Official", icon: Globe, bg: "#dcfce7", c: "#15803d" },
    submitted: { label: "Submitted", icon: Send, bg: "#dbeafe", c: "#1d4ed8" },
    draft: { label: "Draft", icon: Clock, bg: "#f1f5f9", c: "#64748b" },
  };
  const cfg = config[status] || config.draft;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.c }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
};

const TrendChip = ({ diff, prevName }) => {
  if (diff == null) return null;
  const isUp = diff > 0,
    isDown = diff < 0;
  return (
    <div
      className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
      style={{
        background: isUp ? "#dcfce7" : isDown ? "#fee2e2" : "#f1f5f9",
        color: isUp ? "#15803d" : isDown ? "#b91c1c" : "#64748b",
      }}
    >
      {isUp ? (
        <TrendingUp size={11} />
      ) : isDown ? (
        <TrendingDown size={11} />
      ) : (
        <Minus size={11} />
      )}
      <span>
        {isUp ? `+${diff}` : diff} vs {prevName || "prev"}
      </span>
    </div>
  );
};

const ProgressBar = ({ pct, color, h = 6 }) => (
  <div
    className="w-full rounded-full overflow-hidden bg-gray-100"
    style={{ height: h }}
  >
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{
        width: `${Math.min(100, Math.max(0, pct || 0))}%`,
        background: color,
      }}
    />
  </div>
);

const Ring = ({
  pct = 0,
  color = "#6366f1",
  size = 88,
  stroke = 7,
  children,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="relative z-10 text-center">{children}</div>
    </div>
  );
};

const Skeleton = ({ style = {} }) => (
  <div
    className="rounded-xl"
    style={{
      background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }}
  />
);

const KpiCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: accent + "18" }}
    >
      <Icon size={20} style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-black truncate" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Debug panel ───────────────────────────────────────────────────────────────
const DebugPanel = ({
  profile,
  user,
  resolvedStudentId,
  classSection,
  rawResult,
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 overflow-hidden text-xs font-mono">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-indigo-700 font-semibold hover:bg-indigo-100 transition"
      >
        <Bug size={13} />
        Debug: Result fetch diagnostics
        {open ? (
          <ChevronUp size={12} className="ml-auto" />
        ) : (
          <ChevronDown size={12} className="ml-auto" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-1 text-indigo-800 border-t border-indigo-200 pt-3">
          <p>
            <span className="opacity-60">user._id (JWT):</span>{" "}
            {String(user?._id ?? "—")}
          </p>
          <p>
            <span className="opacity-60">profile._id (Student._id):</span>{" "}
            {String(profile?._id ?? "❌ NOT LOADED")}
          </p>
          <p>
            <span className="opacity-60">resolvedStudentId sent to API:</span>{" "}
            {resolvedStudentId || "❌ EMPTY"}
          </p>
          <p>
            <span className="opacity-60">profile.grade:</span>{" "}
            {profile?.grade ?? "—"}
          </p>
          <p>
            <span className="opacity-60">profile.section:</span>{" "}
            {profile?.section ?? "—"}
          </p>
          <p>
            <span className="opacity-60">profile.classSection:</span>{" "}
            {profile?.classSection ?? "—"}
          </p>
          <p>
            <span className="opacity-60">derived classSection:</span>{" "}
            {classSection || "❌ EMPTY"}
          </p>
          <p className="mt-2">
            <span className="opacity-60">result keys returned:</span>{" "}
            {rawResult
              ? Object.keys(rawResult).length > 0
                ? JSON.stringify(Object.keys(rawResult))
                : "[] (empty — classSection mismatch likely)"
              : "not fetched yet"}
          </p>
          {!profile?._id && (
            <p className="text-red-600 font-bold mt-2">
              ⚠ profile._id missing — API called with wrong ID. Check GET
              /students/profile response shape.
            </p>
          )}
          {profile?._id && !classSection && (
            <p className="text-red-600 font-bold mt-2">
              ⚠ classSection empty — exam types lookup will fail. Fix student
              grade/section in DB.
            </p>
          )}
          {profile?._id &&
            classSection &&
            rawResult &&
            Object.keys(rawResult).length === 0 && (
              <p className="text-orange-600 font-bold mt-2">
                ⚠ 0 results returned for classSection="{classSection}". Teacher
                likely saved with a different format (e.g. "Grade 10-A" vs
                "10-A"). Check server [getStudentResults] logs for the variants
                tried vs DB values. Run GET /api/v1/results/debug/student/
                {resolvedStudentId} for diagnosis.
              </p>
            )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function ViewResults() {
  const { user, authFetch, loading: authLoading } = useAuth();

  const [exams, setExams] = useState([]);
  const [profile, setProfile] = useState(null);
  const [allData, setAllData] = useState({});
  const [examSummaries, setExamSummaries] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [resolvedStudentId, setResolvedStudentId] = useState("");
  const [rawResult, setRawResult] = useState(null);

  const authFetchRef = useRef(authFetch);
  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  // ── Fetch all data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user?._id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAllData({});
    setExamSummaries([]);
    setExams([]);
    setSelectedExam(null);
    setRawResult(null);

    const fetch = authFetchRef.current;

    getMyStudentProfile(fetch)
      .then(async (profileRes) => {
        // FIX: handle { data: {...} } or flat object
        const profileData = profileRes?.data ?? profileRes;
        setProfile(profileData);

        // FIX: use Student._id (profile._id), fall back to user._id if missing
        // Backend getStudentResults resolves by findById OR findOne({userId: id})
        // so both work, but profile._id is always correct
        const studentId = String(profileData?._id ?? user._id ?? "");
        setResolvedStudentId(studentId);

        // Derive classSection for scoping exam types
        const classSection =
          profileData.classSection ||
          (profileData.grade && profileData.section
            ? `Grade ${profileData.grade}-${profileData.section}`
            : "");

        console.log(
          "[ViewResults] studentId:",
          studentId,
          "classSection:",
          classSection,
        );

        const [examRes, resultsRes] = await Promise.all([
          getExamTypes(fetch, classSection).catch((e) => {
            console.warn("[ViewResults] getExamTypes failed:", e.message);
            return { data: [] };
          }),
          getStudentResults(fetch, studentId).catch((err) => {
            console.error(
              "[ViewResults] getStudentResults failed:",
              err.message,
            );
            setError(`Could not load results: ${err.message}`);
            return { data: {}, examSummaries: [] };
          }),
        ]);

        // FIX: normalise exam list — handle wrapped { data: { data: [] } } responses
        const rawExamList = Array.isArray(examRes?.data?.data)
          ? examRes.data.data
          : Array.isArray(examRes?.data)
            ? examRes.data
            : Array.isArray(examRes)
              ? examRes
              : [];

        const examList = rawExamList
          .filter((e) => e?.name)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // FIX: normalise results data
        const resultData = resultsRes?.data ?? {};
        const summaries = resultsRes?.examSummaries ?? [];

        console.log(
          "[ViewResults] exams:",
          examList.map((e) => e.name),
        );
        console.log("[ViewResults] result keys:", Object.keys(resultData));
        console.log("[ViewResults] summaries:", summaries);

        setRawResult(resultData);
        setExams(examList);
        setAllData(resultData);
        setExamSummaries(summaries);

        const firstWithResult = examList.find(
          (ex) => resultsRes.data?.[ex.name],
        );
        setSelectedExam(firstWithResult || examList[0] || null);

        // FIX: if examList is empty but we have summaries, build exams from summaries
        if (examList.length === 0 && resultsRes.examSummaries?.length) {
          const fromSummaries = resultsRes.examSummaries.map((s) => ({
            name: s.examName,
            shortName: s.examName,
            max: s.maxTotal || 100,
          }));
          setExams(fromSummaries);
          setSelectedExam(fromSummaries[0]);
        }
      })
      .catch((err) => {
        console.error("[ViewResults] fatal:", err);
        setError(
          err.message || "Could not load your profile. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [authLoading, user?._id, refreshKey]); // eslint-disable-line

  // ── Derived state ─────────────────────────────────────────────────────────
  const classSection =
    profile?.classSection?.trim() ||
    (profile?.grade && profile?.section
      ? `${profile.grade}-${profile.section}`
      : profile?.grade || "");

  const examData = selectedExam ? allData[selectedExam.name] || {} : {};
  const validSubs = Object.values(examData).filter((d) => d?.score != null);
  const total = validSubs.reduce((a, d) => a + (d.score || 0), 0);
  const maxTotal = validSubs.reduce((a, d) => a + (d.max || 0), 0);
  const overall = maxTotal > 0 ? gradeOf(total, maxTotal) : null;
  const overallMeta = overall ? GRADE_META[overall.g] || {} : {};

  const examStatus = useMemo(() => {
    const statuses = Object.values(examData)
      .map((d) => d?.status)
      .filter(Boolean);
    if (statuses.includes("published")) return "published";
    if (statuses.includes("submitted")) return "submitted";
    return "draft";
  }, [examData]);

  const subjects = useMemo(() => Object.keys(examData), [examData]);

  const prevExam = useMemo(() => {
    if (!selectedExam || exams.length < 2) return null;
    const idx = exams.findIndex((e) => e.name === selectedExam.name);
    return idx > 0 ? exams[idx - 1] : null;
  }, [selectedExam, exams]);
  const prevExamData = prevExam ? allData[prevExam.name] || {} : {};

  // FIX: hasAnyResults must check that at least one exam has actual marks data
  const hasAnyResults = Object.values(allData).some((examObj) =>
    Object.values(examObj || {}).some((d) => d?.score != null),
  );

  const overallTrend = useMemo(() => {
    const withData = exams.filter((ex) =>
      examSummaries.find((s) => s.examName === ex.name),
    );
    if (withData.length < 2) return null;
    const first =
      examSummaries.find((s) => s.examName === withData[0].name)?.pct || 0;
    const last =
      examSummaries.find(
        (s) => s.examName === withData[withData.length - 1].name,
      )?.pct || 0;
    return last - first;
  }, [exams, examSummaries]);

  const bestSubject = useMemo(() => {
    if (!validSubs.length) return null;
    let best = null,
      bestPct = -1;
    for (const sub of subjects) {
      const d = examData[sub];
      if (d?.score == null) continue;
      const pct = Math.round((d.score / d.max) * 100);
      if (pct > bestPct) {
        bestPct = pct;
        best = sub;
      }
    }
    return best;
  }, [subjects, examData, validSubs]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-12" style={{ background: "#f8fafc" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .fu  { animation: fadeUp  0.4s ease both }
        .fu1 { animation: fadeUp  0.4s 0.05s ease both }
        .fu2 { animation: fadeUp  0.4s 0.1s  ease both }
        .fu3 { animation: fadeUp  0.4s 0.15s ease both }
        .fu4 { animation: fadeUp  0.4s 0.2s  ease both }
        .fu5 { animation: fadeUp  0.4s 0.25s ease both }
        .exam-tab { transition: all 0.15s ease }
        .exam-tab:hover { transform: translateY(-1px) }
        .sub-card { transition: box-shadow 0.2s ease, transform 0.2s ease }
        .sub-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) }
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              My Results
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Your exam marks from teachers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebug((v) => !v)}
              className={`p-2 rounded-xl transition ${showDebug ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:bg-gray-100"}`}
              title="Toggle debug"
            >
              <Bug size={15} />
            </button>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-5 space-y-4">
        {/* ── Debug panel ── */}
        {showDebug && (
          <DebugPanel
            profile={profile}
            user={user}
            resolvedStudentId={resolvedStudentId}
            classSection={classSection}
            rawResult={rawResult}
          />
        )}

        {/* ── Error ── */}
        {error && (
          <div className="fu flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="flex-1 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton style={{ height: 200 }} />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} style={{ height: 52 }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} style={{ height: 140 }} />
              ))}
            </div>
          </div>
        ) : !hasAnyResults ? (
          <div className="fu bg-white rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
            <div className="text-6xl mb-4">
              {!profile ? "⚠️" : exams.length === 0 ? "📋" : "🕐"}
            </div>
            <p className="text-lg font-black text-gray-700 mb-2">
              {!profile
                ? "Student profile not found"
                : exams.length === 0
                  ? "No exams configured for your class"
                  : "No results yet"}
            </p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              {!profile
                ? "Your student profile couldn't be loaded. Contact your school admin."
                : exams.length === 0
                  ? `No exam types are set up for class "${classSection || "unknown"}". Contact your school admin.`
                  : "Your teacher hasn't entered marks yet, or results are still in draft."}
            </p>
            {profile && (
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-300">
                  Class:{" "}
                  <span className="font-bold text-gray-400">
                    {classSection || "not assigned"}
                  </span>
                </p>
                <p className="text-xs text-gray-300 font-mono">
                  Student ID: {resolvedStudentId}
                </p>
              </div>
            )}
            {profile && !classSection && (
              <p className="mt-3 text-xs text-red-500 font-semibold">
                ⚠ No grade/section in your profile. Contact your school admin.
              </p>
            )}
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition"
            >
              <RefreshCw size={14} /> Check again
            </button>
          </div>
        ) : (
          <>
            {/* ══ Hero banner ══ */}
            <div
              className="fu rounded-3xl overflow-hidden relative"
              style={{
                background:
                  "linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4338ca 80%,#6366f1 100%)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  left: -30,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  pointerEvents: "none",
                }}
              />

              <div className="relative px-6 py-6 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                        {classSection || user?.role}
                      </span>
                      {profile?.rollNumber && (
                        <span className="text-xs opacity-50">
                          · Roll {profile.rollNumber}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black mb-1 leading-tight">
                      {profile?.name || user?.name || "Student"}
                    </h2>
                    {selectedExam && overall && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm opacity-70">
                          {selectedExam.name}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-black"
                          style={{ background: "rgba(255,255,255,0.15)" }}
                        >
                          {overallMeta.emoji} {overall.g}
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
                      <div
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                      >
                        {overallTrend > 0 ? (
                          <>
                            <TrendingUp
                              size={11}
                              className="text-emerald-300"
                            />
                            <span className="text-emerald-300">
                              +{overallTrend}%
                            </span>
                          </>
                        ) : overallTrend < 0 ? (
                          <>
                            <TrendingDown size={11} className="text-red-300" />
                            <span className="text-red-300">
                              {overallTrend}%
                            </span>
                          </>
                        ) : (
                          <>
                            <Minus size={11} />
                            <span>Steady</span>
                          </>
                        )}
                        <span className="opacity-60">overall trend</span>
                      </div>
                    )}
                  </div>
                  {overall && (
                    <Ring
                      pct={overall.p}
                      color={overallMeta.bar || "#a5b4fc"}
                      size={88}
                      stroke={7}
                    >
                      <p className="text-2xl font-black leading-none">
                        {overall.p}%
                      </p>
                      <p className="text-xs opacity-60 font-bold">
                        {overall.g}
                      </p>
                    </Ring>
                  )}
                </div>

                {/* Exam mini-cards */}
                {exams.length > 0 && (
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(exams.length, 4)}, 1fr)`,
                    }}
                  >
                    {exams.map((ex) => {
                      const es = examSummaries.find(
                        (s) => s.examName === ex.name,
                      );
                      const pct = es?.pct ?? null;
                      const sel = selectedExam?.name === ex.name;
                      const g = pct != null ? gradeOf(pct, 100) : null;
                      return (
                        <button
                          key={ex.name}
                          onClick={() => setSelectedExam(ex)}
                          className="rounded-2xl p-3 text-left transition-all exam-tab"
                          style={{
                            background: sel
                              ? "rgba(255,255,255,0.2)"
                              : "rgba(255,255,255,0.08)",
                            boxShadow: sel
                              ? "0 0 0 2px rgba(255,255,255,0.4)"
                              : "none",
                          }}
                        >
                          <p className="text-xs font-bold opacity-70 truncate mb-1">
                            {ex.shortName || ex.name}
                          </p>
                          <p className="text-xl font-black leading-none">
                            {pct != null ? `${pct}%` : "—"}
                          </p>
                          {pct != null && (
                            <div
                              className="mt-2 h-1 rounded-full overflow-hidden"
                              style={{ background: "rgba(255,255,255,0.2)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: GRADE_META[g?.g]?.bar || "#fff",
                                }}
                              />
                            </div>
                          )}
                          <p className="text-xs opacity-40 mt-1">
                            /{ex.max} pts
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Exam tab bar */}
            {exams.length > 1 && (
              <div className="fu1 flex gap-2 flex-wrap">
                {exams.map((ex) => {
                  const es = examSummaries.find((s) => s.examName === ex.name);
                  const sel = selectedExam?.name === ex.name;
                  return (
                    <button
                      key={ex.name}
                      onClick={() => setSelectedExam(ex)}
                      className="exam-tab flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border"
                      style={
                        sel
                          ? {
                              background: "#4338ca",
                              color: "#fff",
                              borderColor: "#4338ca",
                              boxShadow: "0 2px 8px rgba(67,56,202,0.35)",
                            }
                          : {
                              background: "#fff",
                              color: "#374151",
                              borderColor: "#e5e7eb",
                            }
                      }
                    >
                      {ex.name}
                      {es?.pct != null && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md font-black"
                          style={
                            sel
                              ? { background: "rgba(255,255,255,0.2)" }
                              : { background: "#f3f4f6", color: "#6b7280" }
                          }
                        >
                          {es.pct}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* No data for selected exam */}
            {selectedExam && !validSubs.length ? (
              <div className="fu bg-white rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
                <Clock size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-500">
                  {selectedExam.name} marks haven't been entered yet
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Check back after your teacher submits marks
                </p>
              </div>
            ) : (
              validSubs.length > 0 && (
                <>
                  {/* KPI strip */}
                  <div className="fu2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiCard
                      icon={BarChart3}
                      label="Total Score"
                      value={`${total}/${maxTotal}`}
                      accent="#4338ca"
                      sub={`${validSubs.length} subjects`}
                    />
                    <KpiCard
                      icon={Award}
                      label="Percentage"
                      value={`${overall?.p ?? 0}%`}
                      accent={overallMeta.c || "#4338ca"}
                    />
                    <KpiCard
                      icon={Target}
                      label="Grade"
                      value={
                        overall ? `${overallMeta.emoji} ${overall.g}` : "—"
                      }
                      accent={overallMeta.c || "#4338ca"}
                      sub={overallMeta.label}
                    />
                    <KpiCard
                      icon={overall?.p >= 35 ? CheckCircle2 : XCircle}
                      label="Status"
                      value={overall?.p >= 35 ? "PASS ✓" : "FAIL ✗"}
                      accent={overall?.p >= 35 ? "#15803d" : "#b91c1c"}
                    />
                  </div>

                  {/* Best subject banner */}
                  {bestSubject && (
                    <div
                      className="fu3 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold"
                      style={{
                        background: "linear-gradient(135deg,#fef3c7,#fde68a)",
                        color: "#92400e",
                      }}
                    >
                      <Medal
                        size={18}
                        className="flex-shrink-0"
                        style={{ color: "#d97706" }}
                      />
                      <span>
                        Best subject: <strong>{bestSubject}</strong> —{" "}
                        {examData[bestSubject]?.score}/
                        {examData[bestSubject]?.max} (
                        {Math.round(
                          (examData[bestSubject]?.score /
                            examData[bestSubject]?.max) *
                            100,
                        )}
                        %)
                      </span>
                      <Flame
                        size={15}
                        style={{ color: "#f59e0b", marginLeft: "auto" }}
                      />
                    </div>
                  )}

                  {/* Subject cards */}
                  <div className="fu3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Subject Breakdown
                      </h3>
                      <StatusBadge status={examStatus} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subjects.map((sub) => {
                        const d = examData[sub];
                        const g =
                          d?.score != null ? gradeOf(d.score, d.max) : null;
                        const meta = g ? GRADE_META[g.g] || {} : {};
                        const prev = prevExamData[sub];
                        const diff =
                          g && prev?.score != null
                            ? d.score - prev.score
                            : null;
                        return (
                          <div
                            key={sub}
                            className="sub-card bg-white rounded-2xl border border-gray-100 overflow-hidden"
                          >
                            <div
                              className="h-1.5"
                              style={{ background: meta.bar || "#e2e8f0" }}
                            />
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                  {sub}
                                </p>
                                {g ? (
                                  <GradePill {...g} />
                                ) : (
                                  <span className="text-xs text-gray-300 font-medium">
                                    No mark
                                  </span>
                                )}
                              </div>
                              <div className="flex items-end justify-between mb-3">
                                <div>
                                  <span
                                    className="text-3xl font-black"
                                    style={{ color: meta.c || "#94a3b8" }}
                                  >
                                    {d?.score ?? "—"}
                                  </span>
                                  {d && (
                                    <span className="text-sm text-gray-400 ml-1 font-medium">
                                      /{d.max}
                                    </span>
                                  )}
                                </div>
                                {diff != null && (
                                  <TrendChip
                                    diff={diff}
                                    prevName={prevExam?.shortName}
                                  />
                                )}
                              </div>
                              {g && (
                                <>
                                  <ProgressBar pct={g.p} color={meta.bar} />
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs text-gray-400 font-medium">
                                      {meta.label}
                                    </span>
                                    <span
                                      className="text-xs font-black"
                                      style={{ color: meta.c }}
                                    >
                                      {g.p}%
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Score table */}
                  <div className="fu4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowTable((t) => !t)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="text-left">
                        <h3 className="font-black text-gray-800 text-sm">
                          Full Score Sheet —{" "}
                          <span style={{ color: "#4338ca" }}>
                            {selectedExam?.name}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Marks as entered by your teacher
                        </p>
                      </div>
                      <ChevronDown
                        size={16}
                        className="text-gray-400 flex-shrink-0 transition-transform"
                        style={{
                          transform: showTable ? "rotate(180deg)" : "none",
                        }}
                      />
                    </button>
                    {showTable && (
                      <div className="overflow-x-auto border-t border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              {[
                                "Subject",
                                "Max",
                                "Scored",
                                "Pct",
                                "Grade",
                                "Result",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {subjects.map((sub, i) => {
                              const d = examData[sub];
                              const g =
                                d?.score != null
                                  ? gradeOf(d.score, d.max)
                                  : null;
                              const meta = g ? GRADE_META[g.g] || {} : {};
                              return (
                                <tr
                                  key={sub}
                                  className={`border-t border-gray-50 ${i % 2 ? "bg-gray-50/40" : ""}`}
                                >
                                  <td className="py-3 px-4 font-bold text-gray-800">
                                    {sub}
                                  </td>
                                  <td className="py-3 px-4 text-gray-500 font-medium">
                                    {d?.max ?? "—"}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className="font-black text-base"
                                      style={{ color: meta.c || "#94a3b8" }}
                                    >
                                      {d?.score != null ? (
                                        d.score
                                      ) : (
                                        <span className="text-gray-300 font-normal text-sm">
                                          —
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {g ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full"
                                            style={{
                                              width: `${g.p}%`,
                                              background: meta.bar,
                                            }}
                                          />
                                        </div>
                                        <span
                                          className="text-xs font-black w-8"
                                          style={{ color: meta.c }}
                                        >
                                          {g.p}%
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {g ? (
                                      <GradePill {...g} />
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {g && (
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-black ${g.p >= 35 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                                      >
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
                              <tr
                                className="border-t-2 border-indigo-100"
                                style={{ background: "#eef2ff" }}
                              >
                                <td className="py-3 px-4 font-black text-indigo-800">
                                  TOTAL
                                </td>
                                <td className="py-3 px-4 font-bold text-gray-600">
                                  {maxTotal}
                                </td>
                                <td
                                  className="py-3 px-4 font-black text-2xl"
                                  style={{ color: overallMeta.c }}
                                >
                                  {total}
                                </td>
                                <td
                                  className="py-3 px-4 font-black"
                                  style={{ color: overallMeta.c }}
                                >
                                  {overall.p}%
                                </td>
                                <td className="py-3 px-4">
                                  <GradePill {...overall} />
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-black ${overall.p >= 35 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                                  >
                                    {overall.p >= 35 ? "✓ PROMOTED" : "✗ FAIL"}
                                  </span>
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Cross-exam comparison */}
                  {examSummaries.length > 1 && (
                    <div className="fu5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                        <Sparkles size={15} className="text-indigo-500" />
                        <h3 className="font-black text-gray-800 text-sm">
                          Performance Across All Exams
                        </h3>
                      </div>
                      <div className="p-5 space-y-4">
                        {[...examSummaries]
                          .sort(
                            (a, b) =>
                              exams.findIndex((e) => e.name === a.examName) -
                              exams.findIndex((e) => e.name === b.examName),
                          )
                          .map((es) => {
                            const g = gradeOf(es.total || 0, es.maxTotal || 1);
                            const meta = g ? GRADE_META[g.g] || {} : {};
                            const ex = exams.find(
                              (e) => e.name === es.examName,
                            );
                            const isSel = selectedExam?.name === es.examName;
                            return (
                              <button
                                key={es.examName}
                                onClick={() => setSelectedExam(ex || null)}
                                className="w-full text-left transition-all hover:scale-[1.01]"
                              >
                                <div className="flex items-center gap-3 mb-1.5">
                                  <span className="text-xs font-black text-gray-500 w-16 text-right flex-shrink-0">
                                    {ex?.shortName || es.examName}
                                  </span>
                                  <div className="flex-1">
                                    <ProgressBar
                                      pct={es.pct || 0}
                                      color={meta.bar || "#e2e8f0"}
                                      h={10}
                                    />
                                  </div>
                                  <span
                                    className="text-sm font-black w-10 text-right flex-shrink-0"
                                    style={{ color: meta.c || "#94a3b8" }}
                                  >
                                    {es.pct ?? 0}%
                                  </span>
                                  {g && <GradePill {...g} />}
                                </div>
                                {isSel && (
                                  <div className="ml-20 text-xs text-indigo-500 font-bold">
                                    ← viewing now
                                  </div>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
