import { useState, useEffect, useCallback } from "react";
import {
  Award, Shield, Download, Share2, Eye, Search,
  FileText, Trophy, Medal, GraduationCap, CheckCircle,
  Clock, Copy, ExternalLink, RefreshCw, X, Calendar,
  Hash, BookOpen, Star, Loader2, AlertTriangle,
} from "lucide-react";
import api from "../../services/api";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const CERT_ICONS = {
  Academic:      FileText,
  Achievement:   Trophy,
  Participation: Medal,
  Sports:        Award,
  Cultural:      Star,
  Merit:         GraduationCap,
};

const TYPE_COLORS = {
  Academic:      { bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
  Achievement:   { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  Participation: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Sports:        { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Cultural:      { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  Merit:         { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
};

// ─── sub-components ───────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.Academic;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {type}
    </span>
  );
}

function VerifiedBadge({ status }) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <Shield size={10} /> Blockchain Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={10} /> Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      Draft
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white bg-opacity-70">
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold leading-tight" style={{ color }}>{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: color + "cc" }}>{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState("");   // HTTP / network error
  const [debugMsg,     setDebugMsg]     = useState("");   // soft warning from backend
  const [selected,     setSelected]     = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [copied,       setCopied]       = useState("");

  // filters
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("all");
  const [filterYear,   setFilterYear]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setApiError("");
    setDebugMsg("");
    try {
      const res = await api.get("/certificates/my");
      // Backend returns { success, certificates, debug? }
      const certs = res.data.certificates ?? res.data ?? [];
      setCertificates(Array.isArray(certs) ? certs : []);

      // Show soft warning if backend couldn't find student profile
      if (res.data.debug) setDebugMsg(res.data.debug);
    } catch (e) {
      console.error("[MyCertificates] fetch error:", e);
      const msg = e.response?.data?.message || e.message || "Failed to load certificates";
      setApiError(msg);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  // ── computed ──────────────────────────────────────────────────────────────
  const years = [...new Set(certificates.map((c) => c.academicYear).filter(Boolean))].sort().reverse();

  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.title?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.certificateId?.toLowerCase().includes(q) ||
      c.issuedBy?.toLowerCase().includes(q) ||
      c.classSection?.toLowerCase().includes(q);
    const matchType   = filterType   === "all" || c.type         === filterType;
    const matchYear   = filterYear   === "all" || c.academicYear === filterYear;
    const matchStatus = filterStatus === "all" || c.status       === filterStatus;
    return matchSearch && matchType && matchYear && matchStatus;
  });

  const stats = {
    total:        certificates.length,
    verified:     certificates.filter((c) => c.status === "verified").length,
    academic:     certificates.filter((c) => c.type   === "Academic").length,
    achievements: certificates.filter((c) => c.type   === "Achievement").length,
  };

  // ── handlers ──────────────────────────────────────────────────────────────
  const openView = (cert) => { setSelected(cert); setShowModal(true); };

  const copy = async (text, key) => {
    try { await navigator.clipboard?.writeText(text); } catch (_) {}
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleShare = (cert) => {
    const url = cert.verificationUrl || `${window.location.origin}/verify/${cert._id}`;
    copy(url, "share-" + cert._id);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={20} className="text-white" />
            </div>
            My Certificates
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">Your verified academic achievements and records</p>
        </div>
        <button
          onClick={fetchCertificates}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={`text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Error banner (hard error) ────────────────────────────────────── */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4 text-sm text-red-700">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Could not load certificates</p>
            <p className="text-xs mt-0.5 text-red-600">{apiError}</p>
          </div>
          <button onClick={fetchCertificates} className="text-xs underline flex-shrink-0">Retry</button>
        </div>
      )}

      {/* ── Debug banner (soft warning — student profile not linked) ──────── */}
      {debugMsg && !apiError && certificates.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mb-4 text-sm text-amber-800">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-semibold">Account not linked to a student profile</p>
            <p className="text-xs mt-0.5">{debugMsg}</p>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Certificates"  value={stats.total}        icon={Award}         color="#4f46e5" bg="#eef2ff" border="#c7d2fe" />
        <StatCard label="Blockchain Verified" value={stats.verified}     icon={Shield}        color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
        <StatCard label="Academic"            value={stats.academic}     icon={BookOpen}      color="#0284c7" bg="#eff6ff" border="#bae6fd" />
        <StatCard label="Achievements"        value={stats.achievements} icon={Trophy}        color="#d97706" bg="#fffbeb" border="#fde68a" />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search certificates…"
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <select value={filterType}   onChange={(e) => setFilterType(e.target.value)}   className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white">
            <option value="all">All Types</option>
            {Object.keys(CERT_ICONS).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterYear}   onChange={(e) => setFilterYear(e.target.value)}   className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white">
            <option value="all">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white">
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
          <p className="text-xs text-slate-400 ml-auto">{filtered.length} of {certificates.length}</p>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p className="text-slate-400 text-sm">Loading your certificates…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-3">
          <Award size={44} className="text-slate-200" />
          <p className="text-slate-500 font-semibold">
            {certificates.length === 0 ? "No certificates yet" : "No certificates match your filters"}
          </p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            {certificates.length === 0
              ? "Your certificates will appear here once issued by your school"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cert) => {
            const Icon = CERT_ICONS[cert.type] || Award;
            const c    = TYPE_COLORS[cert.type] || TYPE_COLORS.Academic;
            return (
              <div
                key={cert._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col"
              >
                {/* Top color accent */}
                <div className="h-1.5 rounded-t-2xl" style={{ background: c.color }} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
                      <Icon size={22} style={{ color: c.color }} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <VerifiedBadge status={cert.status} />
                      <TypeBadge type={cert.type} />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mb-1 leading-snug">{cert.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{cert.issuedBy || "Issued by School"}</p>

                  {/* Meta rows */}
                  <div className="space-y-1.5 mb-4 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1"><Hash size={10} /> Cert ID</span>
                      <span className="font-mono font-semibold text-slate-600 truncate max-w-[120px]">
                        {cert.certificateId || cert._id?.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1"><Calendar size={10} /> Issued</span>
                      <span className="font-semibold text-slate-600">{fmt(cert.issuedDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1"><BookOpen size={10} /> Year</span>
                      <span className="font-semibold text-slate-600">{cert.academicYear || "—"}</span>
                    </div>
                    {cert.classSection && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Class</span>
                        <span className="font-semibold text-slate-600">{cert.classSection}</span>
                      </div>
                    )}
                    {cert.grade && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1"><Star size={10} /> Grade</span>
                        <span className="font-bold" style={{ color: c.color }}>{cert.grade}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openView(cert)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors"
                      style={{ background: c.bg, color: c.color }}
                    >
                      <Eye size={12} /> View Details
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="flex items-center justify-center p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
                      title="Share verification link"
                    >
                      {copied === "share-" + cert._id
                        ? <CheckCircle size={14} className="text-green-500" />
                        : <Share2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── DETAIL MODAL ─────────────────────────────────────────────────── */}
      {showModal && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col" style={{ fontFamily: "'DM Sans',sans-serif" }}>
            {/* Coloured header */}
            <div
              className="flex items-center justify-between px-6 py-4 rounded-t-2xl"
              style={{ background: (TYPE_COLORS[selected.type] || TYPE_COLORS.Academic).bg }}
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = CERT_ICONS[selected.type] || Award;
                  const c    = TYPE_COLORS[selected.type] || TYPE_COLORS.Academic;
                  return <Icon size={20} style={{ color: c.color }} />;
                })()}
                <h3 className="text-base font-bold text-slate-800">{selected.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-50">
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Status banners */}
              {selected.status === "verified" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Blockchain Verified</p>
                    <p className="text-xs text-green-600">This certificate is authentic and tamper-proof</p>
                  </div>
                </div>
              )}
              {selected.status === "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <Clock size={20} className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-800">Verification in progress — will be signed on blockchain shortly.</p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Certificate ID",  selected.certificateId || selected._id?.slice(-12).toUpperCase()],
                  ["Type",            selected.type],
                  ["Academic Year",   selected.academicYear || "—"],
                  ["Issued Date",     fmt(selected.issuedDate)],
                  ["Class",           selected.classSection || selected.className || "—"],
                  ["Roll Number",     selected.rollNo || "—"],
                  ["Grade / Score",   selected.grade || "—"],
                  ["Issued By",       selected.issuedBy || "—"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-700">{val}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {/* Blockchain section */}
              {selected.blockchainHash && (
                <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Shield size={12} className="text-green-400" /> Blockchain Record
                  </p>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Transaction Hash</p>
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                      <code className="text-xs text-green-400 flex-1 truncate">{selected.blockchainHash}</code>
                      <button onClick={() => copy(selected.blockchainHash, "hash")} className="p-1 rounded hover:bg-slate-700 flex-shrink-0">
                        {copied === "hash" ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  {selected.verificationUrl && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Verification URL</p>
                      <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                        <code className="text-xs text-blue-400 flex-1 truncate">{selected.verificationUrl}</code>
                        <button onClick={() => copy(selected.verificationUrl, "url")} className="p-1 rounded hover:bg-slate-700 flex-shrink-0">
                          {copied === "url" ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} className="text-slate-400" />}
                        </button>
                        <button onClick={() => window.open(selected.verificationUrl, "_blank")} className="p-1 rounded hover:bg-slate-700 flex-shrink-0">
                          <ExternalLink size={12} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => copy(
                  selected.verificationUrl || `${window.location.origin}/verify/${selected._id}`,
                  "modal-share"
                )}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {copied === "modal-share"
                  ? <><CheckCircle size={14} /> Copied!</>
                  : <><Share2 size={14} /> Share Verification Link</>}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}