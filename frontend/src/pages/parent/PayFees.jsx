// src/pages/parent/ParentPayFees.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, Receipt, Hash, GraduationCap,
  BadgeCheck, Building2, Copy, Check, Landmark,
  ArrowRight, User, ChevronRight, Users, X, Info,
  Shield, FileText, IndianRupee,
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

// ─────────────────────────────────────────────────────────────────────────────
// FIX: resolveBankDetails
//
// The server now always sets record.bankDetails via normalizeStudentFee() using
// the shared resolveBankDetails() helper. So the primary path is simply
// record.bankDetails. We also retain the feeStructureId sub-document check as
// a belt-and-suspenders fallback in case an older API version is in play.
//
// Validation: both accountNumber AND bankName must be non-empty strings.
// Previously the check was only truthy — an object with empty strings would
// pass, causing the "bank details" card to render blank fields.
// ─────────────────────────────────────────────────────────────────────────────
function resolveBankDetails(record) {
  const candidates = [
    // Primary: hoisted by server's normalizeStudentFee / structureToPreviewRecord
    record?.bankDetails,
    // Fallback: populated feeStructureId sub-document (belt-and-suspenders)
    record?.feeStructureId?.bankDetails,
  ];

  for (const bd of candidates) {
    if (
      bd &&
      typeof bd === "object" &&
      typeof bd.accountNumber === "string" && bd.accountNumber.trim() !== "" &&
      typeof bd.bankName      === "string" && bd.bankName.trim()      !== ""
    ) {
      return bd;
    }
  }

  return null;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    paid:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle size={11} />, label: "Paid"    },
    partial: { cls: "bg-amber-50   text-amber-700   border-amber-200",   icon: <Clock size={11} />,       label: "Partial" },
    pending: { cls: "bg-slate-100  text-slate-600   border-slate-200",   icon: <Clock size={11} />,       label: "Pending" },
    overdue: { cls: "bg-red-50     text-red-700     border-red-200",     icon: <XCircle size={11} />,     label: "Overdue" },
    waived:  { cls: "bg-purple-50  text-purple-700  border-purple-200",  icon: <BadgeCheck size={11} />,  label: "Waived"  },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
};

// ─── Ring progress ────────────────────────────────────────────────────────────
const Ring = ({ pct = 0, size = 72, stroke = 6, color = "#a5f3fc" }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.15)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// BANK PAY MODAL
// ══════════════════════════════════════════════════════════════════════════════
function BankPayModal({ record, child, instalmentNumber, onClose, onSuccess, authFetch }) {
  const [step,    setStep]    = useState("details");
  const [txRef,   setTxRef]   = useState("");
  const [errMsg,  setErrMsg]  = useState("");
  const [receipt, setReceipt] = useState(null);
  const [copied,  setCopied]  = useState({});

  // FIX: use the shared resolver — server now guarantees bankDetails on record root
  const bankDetails    = resolveBankDetails(record);
  const hasBankDetails = !!(bankDetails?.accountNumber && bankDetails?.bankName);
  const isPreview      = record._isPreview === true;

  const inst   = instalmentNumber
    ? record.instalmentStatus?.find((i) => i.instalmentNumber === instalmentNumber)
    : null;
  const amount = inst ? Math.max(0, inst.amount - inst.paid) : (record.balance ?? record.totalDue ?? 0);

  const copyToClipboard = (key, value) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied((p) => ({ ...p, [key]: true }));
    setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 2000);
  };

  const handleConfirmTransfer = async () => {
    if (isPreview) {
      setErrMsg("Invoice not generated yet. The school admin must generate your invoice before payment can be recorded.");
      setStep("error");
      return;
    }
    setStep("processing");
    try {
      const res  = await authFetch("/fees/pay-for-child", {
        method: "POST",
        body: JSON.stringify({
          studentFeeId:     record._id,
          instalmentNumber: instalmentNumber || null,
          paymentMode:      "neft",
          transactionRef:   txRef.trim() || `NEFT-${Date.now()}`,
          rollNo:           child.rollNo,
          grade:            child.grade,
          section:          child.section,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReceipt({ ...json.data, txRef: txRef.trim(), paidAt: new Date().toLocaleTimeString("en-IN") });
        setStep("success");
        onSuccess?.();
      } else {
        setErrMsg(json.message || "Could not record transfer. Please contact school admin.");
        setStep("error");
      }
    } catch {
      setErrMsg("Network error. Check your connection and try again.");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* ── SUCCESS ── */}
        {step === "success" && receipt && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Transfer Recorded!</h3>
            <p className="text-slate-500 text-sm mb-5">
              The school admin has been notified. Your payment will be confirmed once verified.
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2.5 mb-6 border border-slate-200">
              <div className="flex justify-between border-b border-slate-200 pb-3 mb-1">
                <div>
                  <p className="font-bold text-slate-800">{child.name}</p>
                  <p className="text-xs text-indigo-600 font-semibold">
                    {child.grade}-{child.section} · Roll {child.rollNo}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">{fmt(receipt.amountPaid)}</p>
                  <p className="text-xs text-slate-400">Transferred</p>
                </div>
              </div>
              {[
                ["Receipt No.", receipt.receiptNumber],
                ["Txn Ref",    receipt.txRef || "—"],
                ["Mode",       "NEFT / Bank Transfer"],
                ["Time",       receipt.paidAt],
                ["Balance",    fmt(receipt.balance)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className="font-semibold text-slate-700 text-right max-w-[55%] truncate">{v || "—"}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700">
              Done
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[260px]">
            <RefreshCw size={40} className="animate-spin text-indigo-500 mb-5" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">Recording Transfer…</h3>
            <p className="text-slate-400 text-sm">Please wait</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {isPreview ? "Invoice Not Ready" : "Failed to Record"}
            </h3>
            <p className="text-red-600 text-sm mb-6">{errMsg}</p>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl font-semibold hover:bg-slate-50">
                Close
              </button>
              {!isPreview && (
                <button onClick={() => { setStep("details"); setErrMsg(""); }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700">
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === "confirm" && (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Confirm Transfer</p>
              <p className="text-4xl font-bold text-slate-800">{fmt(amount)}</p>
              <p className="text-sm text-indigo-600 font-semibold mt-1">
                {child.name} · {child.grade}-{child.section} · Roll {child.rollNo}
              </p>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Transaction / UTR Reference (optional)
              </label>
              <input
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="e.g. UTR1234567890 or Txn ID"
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-xs text-slate-400">
                Entering the UTR helps admin verify your payment faster.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              <strong>Note:</strong> Clicking "Confirm" only notifies the school. Payment will be confirmed once the admin verifies the bank transfer.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("details")}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50">
                Back
              </button>
              <button onClick={handleConfirmTransfer}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Confirm Transfer
              </button>
            </div>
          </div>
        )}

        {/* ── BANK DETAILS ── */}
        {step === "details" && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-indigo-200 text-xs font-medium">
                    {inst
                      ? `Instalment ${inst.instalmentNumber}${inst.label ? ` — ${inst.label}` : ""}`
                      : "Full Balance"}
                  </p>
                  <p className="text-3xl font-bold mt-0.5">{fmt(amount)}</p>
                  {isPreview && (
                    <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/30 border border-amber-300/40 rounded-lg text-xs font-semibold text-amber-200">
                      <AlertCircle size={10} /> Invoice pending generation
                    </span>
                  )}
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl"><X size={20} /></button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-lg text-xs font-semibold">
                  <GraduationCap size={11} />{child.grade}-{child.section}
                </span>
                {child.rollNo && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-lg text-xs font-medium">
                    <Hash size={10} />Roll {child.rollNo}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-white/15 rounded-lg text-xs font-medium truncate max-w-[140px]">
                  {child.name}
                </span>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Preview warning */}
              {isPreview && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Invoice not generated yet</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      The school admin hasn't generated your fee invoice yet. You can see the bank details below to prepare, but the transfer cannot be recorded until the invoice is generated.
                    </p>
                  </div>
                </div>
              )}

              {/* How to pay */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">How to Pay</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    ["1", "Copy the school's account number and IFSC code below"],
                    ["2", "Open your bank app or visit your bank"],
                    ["3", `Transfer exactly ${fmt(amount)} via NEFT / RTGS / IMPS`],
                    ["4", "Come back here and click \"I've Transferred\" with your UTR"],
                  ].map(([num, text]) => (
                    <div key={num} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {num}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank details */}
              {hasBankDetails ? (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Landmark size={13} /> School Bank Account Details
                  </p>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <p className="text-white font-bold text-base">
                        {bankDetails.accountHolderName || "School Account"}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5 capitalize">
                        {bankDetails.accountType || "Current"} Account
                        {bankDetails.branchName ? ` · ${bankDetails.branchName}` : ""}
                      </p>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      {[
                        { label: "Bank Name",      value: bankDetails.bankName,      key: "bank",  mono: false },
                        { label: "Account Number", value: bankDetails.accountNumber, key: "accno", mono: true  },
                        { label: "IFSC Code",      value: bankDetails.ifscCode,      key: "ifsc",  mono: true  },
                        ...(bankDetails.upiId ? [{ label: "UPI ID", value: bankDetails.upiId, key: "upi", mono: true }] : []),
                      ].map(({ label, value, key, mono }) => (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                            <p className={`text-white font-semibold truncate ${mono ? "font-mono tracking-wider text-emerald-300" : ""}`}>
                              {value || "—"}
                            </p>
                          </div>
                          {value && (
                            <button
                              onClick={() => copyToClipboard(key, value)}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all"
                            >
                              {copied[key] ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mx-5 mb-5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl px-4 py-3 flex items-center justify-between">
                      <p className="text-indigo-200 text-sm font-medium">Amount to Transfer</p>
                      <p className="text-white text-xl font-bold">{fmt(amount)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                  <Building2 size={32} className="mx-auto mb-2 text-amber-400" />
                  <p className="font-semibold text-amber-800">Bank Details Not Available</p>
                  <p className="text-xs text-amber-600 mt-1">
                    The school admin has not added bank account details yet. Please contact the school office to arrange payment.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                After completing the bank transfer, click "I've Transferred" below and enter your UTR / transaction reference number. The school admin will verify and confirm your payment.
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setStep("confirm")}
                disabled={!hasBankDetails || isPreview}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
              >
                <ArrowRight size={16} />
                {isPreview ? "Invoice Not Generated Yet" : "I've Transferred — Notify School"}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                {isPreview
                  ? "Contact the school admin to generate your invoice first."
                  : "This will notify the school admin to verify your bank transfer."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Fee record card (parent view) ───────────────────────────────────────────
function FeeCard({ record, child, onPay }) {
  const [expanded, setExpanded] = useState(false);
  const structure  = record.feeStructureId;
  const paidPct    = record.totalDue > 0 ? Math.round((record.totalPaid / record.totalDue) * 100) : 0;
  const isSettled  = ["paid", "waived"].includes(record.status);
  const isPreview  = record._isPreview === true;

  // FIX: server now always sends bankDetails on record root — resolver finds it
  const bankDetails    = resolveBankDetails(record);
  const hasBankDetails = !!(bankDetails?.accountNumber && bankDetails?.bankName);

  const strokeColor = {
    paid: "#10b981", partial: "#f59e0b", overdue: "#ef4444", pending: "#6366f1", waived: "#8b5cf6",
  }[record.status] || "#6366f1";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${record.status === "overdue" ? "border-red-200" : "border-slate-100 hover:shadow-md"} transition-all`}>
      {isPreview && (
        <div className="bg-amber-500 text-white text-xs font-bold px-5 py-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} /> Invoice not yet generated — bank details available for preview
        </div>
      )}
      {record.status === "overdue" && !isPreview && (
        <div className="bg-red-500 text-white text-xs font-bold px-5 py-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} /> This fee is overdue — please pay immediately
        </div>
      )}

      <div className={`p-5 ${record.status === "overdue" ? "bg-red-50/30" : "bg-slate-50/30"}`}>
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0 w-[56px] h-[56px]">
            <svg width={56} height={56} className="-rotate-90">
              <circle cx={28} cy={28} r={22} stroke="#e2e8f0" strokeWidth={5} fill="none" />
              <circle cx={28} cy={28} r={22} stroke={strokeColor} strokeWidth={5} fill="none"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 - (paidPct / 100) * 2 * Math.PI * 22}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset .6s ease" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-700">{paidPct}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
              <div>
                <p className="text-sm text-slate-400">
                  {record.academicYear}
                  {structure?.feeType && (
                    <span className="ml-2 capitalize bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[11px]">
                      {structure.feeType}
                    </span>
                  )}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Total Due", fmt(record.totalDue),                                "text-slate-700"],
                ["Paid",      fmt(record.totalPaid),                               "text-emerald-600"],
                ["Balance",   fmt(record.balance ?? record.totalDue),              record.balance > 0 || isPreview ? "text-red-600" : "text-slate-400"],
              ].map(([l, v, c]) => (
                <div key={l} className="bg-white rounded-xl p-2.5 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-0.5">{l}</p>
                  <p className={`text-sm font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bank details indicator */}
      {hasBankDetails && (
        <div className="px-5 py-2 border-t border-slate-50 flex items-center gap-2 bg-emerald-50/50">
          <Landmark size={11} className="text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">
            {bankDetails.bankName}
            {bankDetails.accountNumber && (
              <span className="font-mono ml-1.5 text-emerald-600">
                ···{bankDetails.accountNumber.slice(-4)}
              </span>
            )}
            {bankDetails.ifscCode && <span className="ml-1.5">· {bankDetails.ifscCode}</span>}
          </p>
        </div>
      )}
      {!hasBankDetails && !isSettled && (
        <div className="px-5 py-2 border-t border-slate-50 flex items-center gap-2 bg-amber-50/50">
          <AlertCircle size={11} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Bank details not added by school admin</p>
        </div>
      )}

      {/* Fee breakdown */}
      {structure?.feeComponents?.length > 0 && (
        <div className="px-5 py-2 border-t border-slate-50">
          <button onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "Hide" : "View"} fee breakdown · {structure.feeComponents.length} items
          </button>
          {expanded && (
            <div className="mb-3 mt-1 space-y-1.5 bg-slate-50 rounded-xl p-3">
              {structure.feeComponents.map((comp, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                  <span className="flex items-center gap-2 text-slate-600">
                    {comp.mandatory && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                    {comp.name}
                    <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border capitalize">{comp.category}</span>
                  </span>
                  <span className="font-bold text-slate-700">{fmt(comp.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-bold text-sm">
                <span className="text-slate-600">Total</span>
                <span className="text-indigo-600">{fmt(structure.feeComponents.reduce((a, c) => a + c.amount, 0))}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instalments */}
      {record.instalmentStatus?.length > 0 && (
        <div className="px-5 pb-3 border-t border-slate-50 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Schedule</p>
          <div className="space-y-2">
            {record.instalmentStatus.map((inst) => (
              <div key={inst.instalmentNumber}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  inst.status === "paid"    ? "bg-emerald-50 border border-emerald-100" :
                  inst.status === "overdue" ? "bg-red-50 border border-red-100" :
                  "bg-slate-50 border border-slate-100"
                }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700">{inst.label || `Instalment ${inst.instalmentNumber}`}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {fmtDate(inst.dueDate)}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="text-sm font-bold text-slate-700">{fmt(inst.amount)}</p>
                  {inst.paid > 0 && <p className="text-xs text-emerald-600">Paid: {fmt(inst.paid)}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={inst.status} />
                  {inst.status !== "paid" && !isSettled && !isPreview && hasBankDetails && (
                    <button onClick={() => onPay(record, inst.instalmentNumber)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
                      Pay
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      {expanded && record.payments?.length > 0 && (
        <div className="border-t border-slate-100 px-5 pt-3 pb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment History</p>
          <div className="space-y-2">
            {record.payments.map((p, i) => (
              <div key={i} className="flex justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm">
                <div>
                  <p className="font-bold text-emerald-700">{fmt(p.netPaid)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(p.paymentDate)} · {(p.paymentMode || "").toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-slate-500">{p.receiptNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex gap-2">
        {isPreview ? (
          <button onClick={() => onPay(record, null)}
            className="flex-1 py-2.5 bg-amber-50 text-amber-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-amber-200 hover:bg-amber-100 transition-colors">
            <Landmark size={15} /> View Bank Details {hasBankDetails ? "— Invoice Pending" : "— Not Configured"}
          </button>
        ) : isSettled ? (
          <div className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
            <CheckCircle size={15} /> Fees Cleared
          </div>
        ) : hasBankDetails ? (
          <button onClick={() => onPay(record, null)}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-md shadow-indigo-100">
            <Landmark size={15} /> Pay via Bank Transfer — {fmt(record.balance)}
          </button>
        ) : (
          <div className="flex-1 py-2.5 bg-slate-50 text-slate-500 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-200">
            <AlertCircle size={15} /> Contact school to pay — bank details missing
          </div>
        )}
        {record.payments?.length > 0 && (
          <button onClick={() => setExpanded((p) => !p)} title="Payment history"
            className="px-4 py-2.5 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50">
            <Receipt size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — PARENT PAY FEES
// ══════════════════════════════════════════════════════════════════════════════
export default function ParentPayFees() {
  const { authFetch, user } = useAuth();

  const [children,        setChildren]        = useState([]);
  const [selectedChild,   setSelectedChild]   = useState(null);
  const [records,         setRecords]         = useState([]);
  const [summary,         setSummary]         = useState({ totalDue: 0, totalPaid: 0, totalBalance: 0 });
  const [childIdentity,   setChildIdentity]   = useState(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingFees,     setLoadingFees]     = useState(false);
  const [error,           setError]           = useState(null);
  const [filterYear,      setFilterYear]      = useState("all");
  const [payModal,        setPayModal]        = useState(null);

  useEffect(() => {
    setLoadingChildren(true);
    authFetch("/fees/my-children")
      .then(async (res) => {
        const json = await res.json();
        const list = json?.data || [];
        setChildren(Array.isArray(list) ? list : []);
        if (list.length > 0) setSelectedChild(list[0]);
      })
      .catch(() => setError("Could not load children. Please refresh."))
      .finally(() => setLoadingChildren(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFees = useCallback(async (child, year) => {
    if (!child) return;
    setLoadingFees(true);
    setError(null);
    setRecords([]);
    setSummary({ totalDue: 0, totalPaid: 0, totalBalance: 0 });
    setChildIdentity(null);

    try {
      const qp = new URLSearchParams();
      if (child.rollNo)  qp.set("rollNo",  child.rollNo);
      if (child.grade)   qp.set("grade",   child.grade);
      if (child.section) qp.set("section", child.section);
      if (year && year !== "all") qp.set("academicYear", year);

      const res  = await authFetch(`/fees/child-fees?${qp}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Could not load fee records.");
        return;
      }
      if (json.success) {
        setRecords(json.data || []);
        setSummary(json.summary || { totalDue: 0, totalPaid: 0, totalBalance: 0 });
        setChildIdentity(json.childIdentity || null);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoadingFees(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (selectedChild) loadFees(selectedChild, filterYear);
  }, [selectedChild, filterYear, loadFees]);

  const years    = [...new Set(records.map((r) => r.academicYear).filter(Boolean))].sort().reverse();
  const filtered = filterYear === "all" ? records : records.filter((r) => r.academicYear === filterYear);
  const overdue  = filtered.filter((r) => r.status === "overdue");
  const pending  = filtered.filter((r) => ["pending", "partial"].includes(r.status));
  const settled  = filtered.filter((r) => ["paid", "waived"].includes(r.status));
  const paidPct  = summary.totalDue ? Math.round((summary.totalPaid / summary.totalDue) * 100) : 0;

  const identity = childIdentity || (selectedChild ? {
    name:       selectedChild.name,
    rollNo:     selectedChild.rollNo,
    grade:      selectedChild.grade,
    section:    selectedChild.section,
    classLabel: selectedChild.grade
      ? selectedChild.section
        ? `${selectedChild.grade} — Section ${selectedChild.section}`
        : selectedChild.grade
      : "—",
  } : null);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-7 space-y-6">

        {/* Hero banner */}
        <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 backdrop-blur-sm border border-white/20">
                {(identity?.name || user?.name || "P").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-indigo-300 font-medium mb-0.5">Fee Portal — Parent View</p>
                <h1 className="text-xl font-bold leading-tight">{identity?.name || selectedChild?.name || "Select a child"}</h1>
                {identity && (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {identity.classLabel && identity.classLabel !== "—" && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-lg text-xs font-semibold">
                        <GraduationCap size={11} />{identity.classLabel}
                      </span>
                    )}
                    {identity.rollNo && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-lg text-xs font-medium">
                        <Hash size={10} />Roll {identity.rollNo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Ring pct={paidPct} size={72} stroke={6} color="#a5f3fc" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{paidPct}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-indigo-300 text-xs">Outstanding</p>
                <p className="text-3xl font-bold">{fmt(summary.totalBalance)}</p>
                <p className="text-indigo-300 text-xs mt-0.5">of {fmt(summary.totalDue)}</p>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3 mt-5">
            {[
              ["Total Due",   fmt(summary.totalDue),     "bg-white/10"       ],
              ["Paid",        fmt(summary.totalPaid),    "bg-emerald-400/25" ],
              ["Outstanding", fmt(summary.totalBalance), "bg-red-400/20"     ],
            ].map(([l, v, bg]) => (
              <div key={l} className={`${bg} rounded-2xl px-3 py-3 text-center backdrop-blur-sm border border-white/10`}>
                <p className="text-base font-bold">{v}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Children tabs */}
        {loadingChildren ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <RefreshCw size={14} className="animate-spin" /> Loading children…
          </div>
        ) : children.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users size={13} /> Your Children
            </p>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => {
                const isActive = selectedChild?._id === child._id || selectedChild?.rollNo === child.rollNo;
                return (
                  <button key={child._id || child.rollNo}
                    onClick={() => { setSelectedChild(child); }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-semibold ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50"
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isActive ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {child.name?.charAt(0)?.toUpperCase() || <User size={14} />}
                    </div>
                    <div className="text-left">
                      <p className="leading-tight">{child.name}</p>
                      <p className={`text-[11px] font-normal leading-tight ${isActive ? "text-indigo-500" : "text-slate-400"}`}>
                        {child.grade}{child.section ? `-${child.section}` : ""}{child.rollNo ? ` · Roll ${child.rollNo}` : ""}
                      </p>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-indigo-500 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!loadingChildren && children.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-600">No children linked to your account</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Ask the school admin to link your child, or use the "Link Child" feature using your child's class, section and roll number.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        )}

        {!loadingFees && overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={19} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">{overdue.length} Overdue Payment{overdue.length > 1 ? "s" : ""}</p>
              <p className="text-sm text-red-600 mt-0.5">
                Overdue: <strong>{fmt(overdue.reduce((a, r) => a + r.balance, 0))}</strong>. Pay now to avoid late penalties.
              </p>
            </div>
          </div>
        )}

        {selectedChild && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-bold text-slate-700">Fee Records</h2>
            <div className="flex items-center gap-2">
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Years</option>
                {years.map((y) => <option key={y}>{y}</option>)}
              </select>
              <button onClick={() => loadFees(selectedChild, filterYear)} disabled={loadingFees}
                className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50">
                <RefreshCw size={14} className={`text-slate-500 ${loadingFees ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        )}

        {loadingFees && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={28} className="animate-spin text-indigo-400" />
            <p className="text-sm text-slate-400">Loading fee records…</p>
          </div>
        )}

        {!loadingFees && selectedChild && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-slate-300" />
                </div>
                <p className="text-slate-600 font-bold">No fee records found</p>
                <p className="text-sm text-slate-400 mt-1">The school admin hasn't created a fee structure yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {overdue.length > 0 && (
                  <section>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-red-600">
                      <XCircle size={13} /> Overdue
                    </p>
                    <div className="space-y-4">
                      {overdue.map((r, i) => (
                        <FeeCard key={r._id || i} record={r} child={selectedChild || identity}
                          onPay={(rec, inst) => setPayModal({ record: rec, instalmentNumber: inst })} />
                      ))}
                    </div>
                  </section>
                )}
                {pending.length > 0 && (
                  <section>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-amber-600">
                      <Clock size={13} /> Pending / Partial
                    </p>
                    <div className="space-y-4">
                      {pending.map((r, i) => (
                        <FeeCard key={r._id || i} record={r} child={selectedChild || identity}
                          onPay={(rec, inst) => setPayModal({ record: rec, instalmentNumber: inst })} />
                      ))}
                    </div>
                  </section>
                )}
                {settled.length > 0 && (
                  <section>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle size={13} /> Settled
                    </p>
                    <div className="space-y-4">
                      {settled.map((r, i) => (
                        <FeeCard key={r._id || i} record={r} child={selectedChild || identity} onPay={() => {}} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {payModal && selectedChild && (
        <BankPayModal
          record={payModal.record}
          child={selectedChild}
          instalmentNumber={payModal.instalmentNumber}
          authFetch={authFetch}
          onClose={() => setPayModal(null)}
          onSuccess={() => {
            setPayModal(null);
            loadFees(selectedChild, filterYear);
          }}
        />
      )}
    </div>
  );
}