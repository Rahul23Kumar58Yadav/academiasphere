// src/pages/student/PayFees.jsx
// FIXES:
//  1. Removed manual lookup form entirely — data is always auto-fetched using
//     the student's own identity from the JWT (grade/section/rollNo).
//  2. No "Search by Roll Number" button anywhere — the page is fully automatic.
//  3. On 404 / empty state, show a clean informational message instead of
//     prompting the student to search.
//  4. filterYear is client-side only — changing the year never triggers a re-fetch.
//  5. lookupParamsRef ensures load() always uses the latest identity without
//     stale closure issues.
//  6. feeStructureId data normalised so FeeCard works for both real DB records
//     and FeeStructure preview records.
//  7. Two independent expand toggles on FeeCard (breakdown vs payment history).
//  8. discountRules and bank details rendered inside the fee breakdown card.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, Receipt, Hash, GraduationCap,
  BookOpen, BadgeCheck,
  Shield, Eye, FileText,
  Loader2, Phone, Tag,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

// ─── Normalise a fee record so FeeCard always sees a consistent shape ─────────
// Works for both real DB records (feeStructureId is a populated subdoc)
// and preview records (feeStructureId is the raw structure object).
function normaliseRecord(rec) {
  if (!rec) return rec;
  const struct = rec.feeStructureId || {};
  return {
    ...rec,
    // Guarantee these fields exist at the top level for easy access
    _structureGrade:    struct.grade    || rec.grade    || "",
    _structureFeeType:  struct.feeType  || rec.feeType  || "",
    _feeComponents:     struct.feeComponents  || [],
    _installmentDefs:   struct.installments   || [],
    _discountRules:     struct.discountRules  || [],
    _bankDetails:       rec.bankDetails || struct.bankDetails || null,
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, large = false }) => {
  const sz = large ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  const map = {
    paid:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle size={large ? 14 : 11} />, label: "Paid"    },
    partial: { cls: "bg-amber-50   text-amber-700   border-amber-200",   icon: <Clock       size={large ? 14 : 11} />, label: "Partial" },
    pending: { cls: "bg-slate-100  text-slate-600   border-slate-200",   icon: <Clock       size={large ? 14 : 11} />, label: "Pending" },
    overdue: { cls: "bg-red-50     text-red-700     border-red-200",     icon: <XCircle     size={large ? 14 : 11} />, label: "Overdue" },
    waived:  { cls: "bg-purple-50  text-purple-700  border-purple-200",  icon: <BadgeCheck  size={large ? 14 : 11} />, label: "Waived"  },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 ${sz} rounded-full font-semibold border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
};

// ─── Circular Progress ────────────────────────────────────────────────────────
const Ring = ({ pct = 0, size = 76, stroke = 7, color = "#a5f3fc" }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,.15)" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }}/>
    </svg>
  );
};

// ─── Identity Pills ───────────────────────────────────────────────────────────
function IdentityPills({ identity }) {
  if (!identity) return null;
  const pills = [
    identity.classLabel && identity.classLabel !== "—" && { icon: <GraduationCap size={12}/>, val: identity.classLabel },
    identity.rollNo     && identity.rollNo     !== "—" && { icon: <Hash size={11}/>,           val: `Roll ${identity.rollNo}` },
    identity.admissionNo && identity.admissionNo !== "—" && { icon: <BookOpen size={11}/>,     val: identity.admissionNo },
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {pills.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-lg text-xs font-semibold backdrop-blur-sm">
          {p.icon}{p.val}
        </span>
      ))}
    </div>
  );
}

// ─── Contact Admin Card ───────────────────────────────────────────────────────
function ContactAdminCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Phone size={18} className="text-indigo-600"/>
      </div>
      <div>
        <p className="font-bold text-slate-800 text-sm">Need to Make a Payment?</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Fee payments are processed by the school admin or your parents.
          Contact the school office or ask your parent to pay via the Parent Portal.
        </p>
      </div>
    </div>
  );
}

// ─── Bank Details Card ────────────────────────────────────────────────────────
function BankDetailsCard({ bankDetails }) {
  if (!bankDetails?.bankName && !bankDetails?.accountNumber) return null;
  return (
    <div className="px-5 pb-4 border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Receipt size={11}/> Bank Transfer Details
      </p>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white text-xs">
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
          {[
            ["Account Holder", bankDetails.accountHolderName],
            ["Bank",           bankDetails.bankName],
            ["Account No.",    bankDetails.accountNumber],
            ["IFSC Code",      bankDetails.ifscCode],
            ["Account Type",   bankDetails.accountType],
            ["Branch",         bankDetails.branchName],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label}>
              <p className="text-slate-400 text-[10px]">{label}</p>
              <p className={`font-semibold mt-0.5 ${
                label === "Account No." || label === "IFSC Code"
                  ? "font-mono tracking-wider text-emerald-300"
                  : "text-white"
              }`}>{val}</p>
            </div>
          ))}
        </div>
        {bankDetails.upiId && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-slate-400 text-[10px]">UPI ID</p>
            <p className="font-mono font-semibold text-sky-300 mt-0.5">{bankDetails.upiId}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fee Record Card (read-only) ──────────────────────────────────────────────
function FeeCard({ record, studentIdentity }) {
  // Two independent toggles — no shared state bug
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [historyOpen,   setHistoryOpen]   = useState(false);

  const isPreview = record._isPreview === true;

  // Use the normalised fields added by normaliseRecord()
  const grade        = record._structureGrade  || studentIdentity?.grade   || "";
  const feeType      = record._structureFeeType;
  const feeComponents  = record._feeComponents  || [];
  const discountRules  = record._discountRules  || [];
  const instalmentDefs = record._installmentDefs || [];

  const section  = record.section || studentIdentity?.section || "";
  const identity = record.studentIdentity || studentIdentity;

  const paidPct = record.totalDue > 0
    ? Math.round((record.totalPaid / record.totalDue) * 100)
    : 0;

  const strokeColor = {
    paid:"#10b981", partial:"#f59e0b", overdue:"#ef4444", pending:"#6366f1", waived:"#8b5cf6",
  }[record.status] || "#6366f1";

  const balance = record.balance ?? record.totalDue ?? 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      record.status === "overdue" ? "border-red-200" : "border-slate-100 hover:shadow-md"
    }`}>
      {/* Preview banner */}
      {isPreview && (
        <div className="bg-amber-500 text-white text-xs font-bold px-5 py-1.5 flex items-center gap-1.5">
          <AlertCircle size={12}/> Invoice not yet generated — amounts shown are estimates
        </div>
      )}
      {/* Overdue banner */}
      {record.status === "overdue" && !isPreview && (
        <div className="bg-red-500 text-white text-xs font-bold px-5 py-1.5 flex items-center gap-1.5">
          <AlertCircle size={12}/> This fee is overdue — please ask your parent or school admin
        </div>
      )}

      <div className={`p-5 ${record.status === "overdue" ? "bg-red-50/30" : "bg-slate-50/30"}`}>
        <div className="flex items-start gap-4">
          {/* Progress ring */}
          <div className="relative flex-shrink-0 w-[60px] h-[60px]">
            <svg width={60} height={60} className="-rotate-90">
              <circle cx={30} cy={30} r={24} stroke="#e2e8f0" strokeWidth={5} fill="none"/>
              <circle cx={30} cy={30} r={24} stroke={strokeColor} strokeWidth={5} fill="none"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 - (paidPct / 100) * 2 * Math.PI * 24}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset .6s ease" }}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-700">{paidPct}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {grade && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold">
                      <GraduationCap size={11}/>{grade}{section ? ` — ${section}` : ""}
                    </span>
                  )}
                  {identity?.rollNo && identity.rollNo !== "—" && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-xs font-bold">
                      <Hash size={10}/>Roll {identity.rollNo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">{record.academicYear}</p>
                  {feeType && (
                    <span className="text-[11px] capitalize bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                      {feeType}
                    </span>
                  )}
                  {isPreview && (
                    <span className="text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-semibold">
                      Preview
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={record.status}/>
            </div>

            {/* Amount grid */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Total Due", val: fmt(record.totalDue),  cls: "text-slate-700"   },
                { label: "Paid",      val: fmt(record.totalPaid), cls: "text-emerald-600" },
                { label: "Balance",   val: fmt(balance), cls: balance > 0 ? "text-red-600" : "text-slate-400" },
              ].map(({ label, val, cls }) => (
                <div key={label} className="bg-white rounded-xl p-2.5 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                  <p className={`text-sm font-bold ${cls}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Discount / late fee */}
      {(record.discount > 0 || record.lateFee > 0) && (
        <div className="px-5 py-2 flex gap-4 border-t border-slate-50">
          {record.discount > 0 && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle size={11}/> Discount: {fmt(record.discount)}
            </span>
          )}
          {record.lateFee > 0 && (
            <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle size={11}/> Late Fee: {fmt(record.lateFee)}
            </span>
          )}
        </div>
      )}

      {/* Fee Components breakdown — independent toggle */}
      {feeComponents.length > 0 && (
        <div className="px-5 py-2 border-t border-slate-50">
          <button onClick={() => setBreakdownOpen((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1">
            {breakdownOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            {breakdownOpen ? "Hide" : "View"} fee breakdown · {feeComponents.length} items
          </button>
          {breakdownOpen && (
            <div className="mb-3 mt-1 space-y-1.5 bg-slate-50 rounded-xl p-3">
              {feeComponents.map((comp, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                  <span className="flex items-center gap-2 text-slate-600">
                    {comp.mandatory && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" title="Mandatory"/>
                    )}
                    {comp.name}
                    <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100 capitalize">
                      {comp.category}
                    </span>
                  </span>
                  <span className="font-bold text-slate-700">{fmt(comp.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-bold text-sm border-t border-slate-200 mt-1">
                <span className="text-slate-600">Total</span>
                <span className="text-indigo-600">{fmt(feeComponents.reduce((a, c) => a + (c.amount || 0), 0))}</span>
              </div>

              {/* Discount rules — previously missing */}
              {discountRules.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Tag size={10}/> Available Discounts
                  </p>
                  {discountRules.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-1 text-xs">
                      <span className="text-slate-600">{d.type}{d.conditions ? ` — ${d.conditions}` : ""}</span>
                      <span className="font-bold text-emerald-600">{d.percentage}% off</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instalments — READ ONLY */}
      {record.instalmentStatus?.length > 0 && (
        <div className="px-5 pb-4 border-t border-slate-50 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Schedule</p>
          <div className="space-y-2">
            {record.instalmentStatus.map((inst) => (
              <div key={inst.instalmentNumber}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  inst.status === "paid"    ? "bg-emerald-50 border border-emerald-100" :
                  inst.status === "overdue" ? "bg-red-50 border border-red-100"         :
                  "bg-slate-50 border border-slate-100"
                }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700">
                    {inst.label || `Instalment ${inst.instalmentNumber}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {fmtDate(inst.dueDate)}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="text-sm font-bold text-slate-700">{fmt(inst.amount)}</p>
                  {inst.paid > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold">Paid: {fmt(inst.paid)}</p>
                  )}
                </div>
                <StatusBadge status={inst.status}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank transfer details */}
      <BankDetailsCard bankDetails={record._bankDetails}/>

      {/* Payment history — independent toggle */}
      {record.payments?.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <button onClick={() => setHistoryOpen((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-2">
            <Eye size={13}/> {historyOpen ? "Hide" : "View"} payment history ({record.payments.length})
          </button>
          {historyOpen && (
            <div className="space-y-2">
              {record.payments.map((p, i) => (
                <div key={i} className="flex justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm">
                  <div>
                    <p className="font-bold text-emerald-700">{fmt(p.netPaid)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {fmtDate(p.paymentDate)} · {p.paymentMode?.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-slate-500 font-semibold">{p.receiptNumber}</p>
                    {p.transactionRef && (
                      <p className="text-xs text-slate-400 mt-0.5">{p.transactionRef}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer notice */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <Shield size={13} className="text-slate-400 flex-shrink-0"/>
        <p className="text-xs text-slate-400">
          {["paid","waived"].includes(record.status)
            ? "This fee has been cleared. No further action needed."
            : isPreview
              ? "Invoice not generated yet. Contact school admin or your parent for payment."
              : "Contact school admin or your parent to make a payment."}
        </p>
      </div>
    </div>
  );
}

const SectionLabel = ({ icon, label, color }) => (
  <p className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${color}`}>
    {icon}{label}
  </p>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — STUDENT (READ ONLY)
// ══════════════════════════════════════════════════════════════════════════════
export default function StudentPayFees() {
  const { authFetch, user } = useAuth();

  const [records,         setRecords]         = useState([]);
  const [summary,         setSummary]         = useState({ totalDue:0, totalPaid:0, totalBalance:0 });
  const [studentIdentity, setStudentIdentity] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [filterYear,      setFilterYear]      = useState("all");

  // ── Use a ref for lookupParams so load() always reads the latest value
  // without needing to be re-created (avoids stale closure 404 loops).
  const lookupParamsRef = useRef(null);

  // ── Extract stable primitive identity from the user object ────────────────
  const userRollNo  = user?.rollNo  || user?.roll_no  || null;
  const userGrade   = user?.grade   || null;
  const userSection = user?.section || null;

  const getUserParams = useCallback(() => {
    if (userRollNo || userGrade) return { rollNo: userRollNo, grade: userGrade, section: userSection };
    return null;
  }, [userRollNo, userGrade, userSection]);

  // ── Core fetch — does NOT depend on filterYear (client-side filter only) ──
  const load = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      // Priority: explicit override → stored ref → user JWT fields
      const p = overrideParams ?? lookupParamsRef.current ?? getUserParams();

      const qp = new URLSearchParams();
      if (p?.rollNo)  qp.set("rollNo",  p.rollNo);
      if (p?.grade)   qp.set("grade",   p.grade);
      if (p?.section) qp.set("section", p.section);

      const res  = await authFetch(`/fees/my-fees?${qp}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Could not load fee records.");
        setRecords([]);
        setSummary({ totalDue:0, totalPaid:0, totalBalance:0 });
        return;
      }

      if (json.success) {
        // Normalise every record so FeeCard always has a consistent shape
        setRecords((json.data || []).map(normaliseRecord));
        setSummary(json.summary || { totalDue:0, totalPaid:0, totalBalance:0 });

        if (json.studentIdentity) {
          setStudentIdentity(json.studentIdentity);
          setError(null);

          // Persist resolved identity into ref for future refreshes
          if (!lookupParamsRef.current) {
            const id = json.studentIdentity;
            const resolved = {
              rollNo:  id.rollNo  !== "—" ? id.rollNo  : null,
              grade:   id.grade   !== "—" ? id.grade   : null,
              section: id.section !== "—" ? id.section : null,
            };
            if (resolved.rollNo || resolved.grade) {
              lookupParamsRef.current = resolved;
            }
          }
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, getUserParams]);
  // Note: filterYear intentionally NOT in deps — year filtering is client-side.

  // ── Initial load only — pass user params immediately so the first request
  //    never goes out empty, avoiding a guaranteed 404 + show-lookup flicker.
  useEffect(() => {
    const initialParams = getUserParams();
    if (initialParams) lookupParamsRef.current = initialParams;
    load(initialParams);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Client-side year filter — no network call needed ──────────────────────
  const allYears = [...new Set(records.map((r) => r.academicYear).filter(Boolean))].sort().reverse();
  const filtered = filterYear === "all" ? records : records.filter((r) => r.academicYear === filterYear);

  const overdue = filtered.filter((r) => r.status === "overdue");
  const pending = filtered.filter((r) => ["pending","partial"].includes(r.status));
  const preview = filtered.filter((r) => r._isPreview === true);
  const settled = filtered.filter((r) => ["paid","waived"].includes(r.status));

  const paidPct = summary.totalDue
    ? Math.round((summary.totalPaid / summary.totalDue) * 100)
    : 0;

  const displayIdentity = studentIdentity || (user ? {
    name:        user.name || (`${user.firstName || ""} ${user.lastName || ""}`).trim() || "Student",
    rollNo:      userRollNo  || "—",
    grade:       userGrade   || "—",
    section:     userSection || "—",
    admissionNo: user.admissionNo || "—",
    classLabel:  userGrade
      ? userSection ? `${userGrade} — Section ${userSection}` : userGrade
      : "—",
  } : null);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-7 space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full pointer-events-none"/>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none"/>

          <div className="relative flex justify-end mb-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-bold border border-white/20">
              <Eye size={11}/> View Only
            </span>
          </div>

          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 backdrop-blur-sm border border-white/20">
                {(displayIdentity?.name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">
                  {displayIdentity?.name || "Student"}
                </h1>
                <IdentityPills identity={displayIdentity}/>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Ring pct={paidPct} size={76} stroke={7} color="#a5f3fc"/>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{paidPct}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-indigo-300 text-xs font-medium">Balance Due</p>
                <p className="text-3xl font-bold leading-tight">{fmt(summary.totalBalance)}</p>
                <p className="text-indigo-300 text-xs mt-0.5">of {fmt(summary.totalDue)}</p>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3 mt-5">
            {[
              { label:"Total Due",   val: fmt(summary.totalDue),     bg:"bg-white/10"       },
              { label:"Paid",        val: fmt(summary.totalPaid),    bg:"bg-emerald-400/25" },
              { label:"Outstanding", val: fmt(summary.totalBalance), bg:"bg-red-400/20"     },
            ].map((c) => (
              <div key={c.label} className={`${c.bg} rounded-2xl px-3 py-3 text-center backdrop-blur-sm border border-white/10`}>
                <p className="text-base font-bold">{c.val}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact admin note */}
        <ContactAdminCard/>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5"/>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        )}


        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={19} className="text-red-500 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="font-bold text-red-800">
                {overdue.length} Overdue Payment{overdue.length > 1 ? "s" : ""}
                {displayIdentity?.classLabel && displayIdentity.classLabel !== "—" && (
                  <span className="ml-2 text-xs font-normal">
                    ({displayIdentity.classLabel}
                    {displayIdentity.rollNo && displayIdentity.rollNo !== "—"
                      ? ` · Roll ${displayIdentity.rollNo}` : ""})
                  </span>
                )}
              </p>
              <p className="text-sm text-red-600 mt-0.5">
                Total overdue: <strong>{fmt(overdue.reduce((a, r) => a + (r.balance ?? 0), 0))}</strong>.
                Ask your parent or school office to make the payment.
              </p>
            </div>
          </div>
        )}

        {/* Filters row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-700">Fee Records</h2>
              {displayIdentity?.classLabel && displayIdentity.classLabel !== "—" && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                  <GraduationCap size={11}/>
                  {displayIdentity.classLabel}
                  {displayIdentity.rollNo && displayIdentity.rollNo !== "—"
                    ? ` · Roll ${displayIdentity.rollNo}` : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Year filter — client-side only, no re-fetch */}
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Years</option>
                {allYears.map((y) => <option key={y}>{y}</option>)}
              </select>
              <button
                onClick={() => load()}
                disabled={loading}
                className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50"
                title="Refresh">
                <RefreshCw size={14} className={`text-slate-500 ${loading ? "animate-spin" : ""}`}/>
              </button>

            </div>
          </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-400"/>
            <p className="text-sm text-slate-400 font-medium">Loading fee records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-slate-300"/>
            </div>
            <p className="text-slate-600 font-bold">No fee records found</p>
            <p className="text-sm text-slate-400 mt-1">
              {displayIdentity?.classLabel && displayIdentity.classLabel !== "—"
                ? `No invoices generated for ${displayIdentity.classLabel} yet. Contact your school admin.`
                : "Your fee records haven't been set up yet. Contact your school admin."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdue.length > 0 && (
              <section>
                <SectionLabel icon={<XCircle size={13}/>} label="Overdue" color="text-red-600"/>
                <div className="space-y-4">
                  {overdue.map((r, i) => <FeeCard key={r._id || `ov-${i}`} record={r} studentIdentity={displayIdentity}/>)}
                </div>
              </section>
            )}
            {pending.length > 0 && (
              <section>
                <SectionLabel icon={<Clock size={13}/>} label="Pending / Partial" color="text-amber-600"/>
                <div className="space-y-4">
                  {pending.map((r, i) => <FeeCard key={r._id || `pe-${i}`} record={r} studentIdentity={displayIdentity}/>)}
                </div>
              </section>
            )}
            {preview.length > 0 && overdue.length === 0 && pending.length === 0 && (
              <section>
                <SectionLabel icon={<AlertCircle size={13}/>} label="Fee Preview — Invoice Pending" color="text-amber-600"/>
                <div className="space-y-4">
                  {preview.map((r, i) => <FeeCard key={`pr-${i}`} record={r} studentIdentity={displayIdentity}/>)}
                </div>
              </section>
            )}
            {settled.length > 0 && (
              <section>
                <SectionLabel icon={<CheckCircle size={13}/>} label="Settled" color="text-emerald-600"/>
                <div className="space-y-4">
                  {settled.map((r, i) => <FeeCard key={r._id || `se-${i}`} record={r} studentIdentity={displayIdentity}/>)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}