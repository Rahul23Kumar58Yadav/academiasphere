// src/pages/school-admin/FeeStructure.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Save, X, Search, AlertCircle,
  Users, CheckCircle, Clock, RefreshCw, Eye, Send, Copy,
  DollarSign, BookOpen, PlusCircle, ChevronDown, ChevronUp,
  Download, GraduationCap, Hash, Building2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// ─── constants ────────────────────────────────────────────────────────────────
const GRADES = [
  "Nursery","LKG","UKG",
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
];
const ACADEMIC_YEARS  = ["2024-2025","2025-2026","2026-2027"];
const FEE_TYPES       = ["annual","semester","quarterly","monthly"];
const COMP_CATEGORIES = ["tuition","development","sports","lab","library","transport","exam","other"];

const BLANK = () => ({
  grade: "", academicYear: "2025-2026", feeType: "annual", currency: "INR",
  title: "", notes: "",
  feeComponents: [
    { name:"Tuition Fee",     amount:0, mandatory:true,  category:"tuition"     },
    { name:"Development Fee", amount:0, mandatory:true,  category:"development" },
    { name:"Sports Fee",      amount:0, mandatory:false, category:"sports"      },
    { name:"Lab Fee",         amount:0, mandatory:false, category:"lab"         },
    { name:"Library Fee",     amount:0, mandatory:false, category:"library"     },
  ],
  installments: [
    { installmentNumber:1, label:"Q1", dueDate:"", percentage:25 },
    { installmentNumber:2, label:"Q2", dueDate:"", percentage:25 },
    { installmentNumber:3, label:"Q3", dueDate:"", percentage:25 },
    { installmentNumber:4, label:"Q4", dueDate:"", percentage:25 },
  ],
  discountRules: [
    { type:"Sibling Discount",  percentage:10, conditions:"For 2nd child onwards"       },
    { type:"Early Payment",     percentage:5,  conditions:"Pay full fee before June 30" },
    { type:"Merit Scholarship", percentage:50, conditions:"Above 95% marks"             },
  ],
  lateFeePolicy: { enabled:true, gracePeriodDays:7, penaltyPercentage:2, maximumPenalty:5000 },
  // ── Bank Details ──────────────────────────────────────────────────────────
  bankDetails: {
    accountHolderName: "",
    bankName:          "",
    accountNumber:     "",
    ifscCode:          "",
    branchName:        "",
    accountType:       "Current",
  },
});

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(n || 0);

const sanitisePayload = (form) => {
  const bd = form.bankDetails || {};
  return {
    ...form,
    grade:        form.grade.trim(),
    academicYear: form.academicYear.trim(),
    feeComponents: form.feeComponents
      .filter((c) => c.name && c.name.trim() !== "")
      .map((c) => ({ ...c, amount: Number(c.amount) || 0 })),
    installments: form.installments.map((inst) => ({
      ...inst,
      percentage: Number(inst.percentage) || 0,
      dueDate: inst.dueDate && inst.dueDate.trim() !== "" ? inst.dueDate : null,
    })),
    discountRules: form.discountRules.map((d) => ({
      ...d,
      percentage: Number(d.percentage) || 0,
    })),
    // ── FIX: explicitly construct bankDetails so it's never lost ──
    bankDetails: {
      accountHolderName: String(bd.accountHolderName || "").trim(),
      bankName:          String(bd.bankName          || "").trim(),
      accountNumber:     String(bd.accountNumber     || "").trim(),
      ifscCode:          String(bd.ifscCode          || "").trim().toUpperCase(),
      branchName:        String(bd.branchName        || "").trim(),
      accountType:       ["Current", "Savings", "OD"].includes(bd.accountType)
        ? bd.accountType
        : "Current",
      upiId:     String(bd.upiId     || "").trim(),
      qrCodeUrl: String(bd.qrCodeUrl || "").trim(),
    },
  };
};

const StatusPill = ({ status }) => {
  const map = {
    paid:    "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100  text-amber-700",
    pending: "bg-slate-100  text-slate-600",
    overdue: "bg-red-100    text-red-700",
    waived:  "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.pending}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT STATUS PANEL
// ─────────────────────────────────────────────────────────────────────────────
function StudentStatusPanel({ structure, authFetch, onClose }) {
  const [records,       setRecords]       = useState([]);
  const [sectionWise,   setSectionWise]   = useState([]);
  const [agg,           setAgg]           = useState({});
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [search,        setSearch]        = useState("");
  const [payModal,      setPayModal]      = useState(null);
  const [generating,    setGenerating]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q   = new URLSearchParams({ status: filterStatus, limit: 500 });
      const res  = await authFetch(`/fees/structures/${structure._id}/students?${q}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setAgg(json.aggregates || {});
        setSectionWise(json.sectionWise || []);
      }
    } catch { /**/ }
    finally { setLoading(false); }
  }, [structure._id, filterStatus, authFetch]);

  useEffect(() => { load(); }, [load]);

  const displayed = records.filter((r) => {
    const sec = r.section || r.studentId?.section || "";
    if (filterSection !== "all" && sec !== filterSection) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.studentName || "").toLowerCase().includes(q) ||
        (r.admissionNo || "").toLowerCase().includes(q) ||
        (r.rollNo      || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sections = [...new Set(records.map((r) => r.section || "").filter(Boolean))].sort();

  const handleRecord = async (payload) => {
    const res  = await authFetch("/fees/record-payment", { method:"POST", body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { setPayModal(null); load(); }
    else alert(json.message || "Failed to record payment");
  };

  const handleGenerateHere = async () => {
    if (!window.confirm(`Generate invoices for all active students in ${structure.grade}?`)) return;
    setGenerating(true);
    try {
      const res  = await authFetch("/fees/generate-invoices", {
        method: "POST",
        body: JSON.stringify({ feeStructureId: structure._id, grade: structure.grade, academicYear: structure.academicYear }),
      });
      const json = await res.json();
      if (json.success) { alert(json.message); load(); }
      else alert(`Error: ${json.message}`);
    } finally { setGenerating(false); }
  };

  const exportCSV = () => {
    const rows = [
      ["Section","Roll No","Student","Adm No","Total Due","Paid","Balance","Status"],
      ...displayed.map((r) => [
        r.section || "—", r.rollNo || "—", r.studentName,
        r.admissionNo || "—", r.totalDue, r.totalPaid, r.balance, r.status,
      ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `fees_${structure.grade}_${structure.academicYear}.csv`,
    }).click();
  };

  const activeSec = filterSection === "all" ? null : sectionWise.find((s) => s._id === filterSection);
  const summaryData = filterSection === "all"
    ? { totalDue: agg.totalDue, totalCollected: agg.totalCollected, totalBalance: agg.totalBalance }
    : activeSec
      ? { totalDue: activeSec.totalDue, totalCollected: activeSec.totalCollected, totalBalance: activeSec.totalBalance }
      : {};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">{structure.grade} — {structure.academicYear}</h2>
            <p className="text-slate-300 text-sm">Student Payment Status</p>
          </div>
          <div className="flex items-center gap-2">
            {records.length === 0 && !loading && (
              <button onClick={handleGenerateHere} disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                {generating ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                Generate Invoices
              </button>
            )}
            <button onClick={exportCSV} disabled={displayed.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 disabled:opacity-40">
              <Download size={12} /> Export CSV
            </button>
            <button onClick={onClose} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Aggregates */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          {[
            ["Total Due",   fmt(summaryData.totalDue),       "text-slate-700"],
            ["Collected",   fmt(summaryData.totalCollected),  "text-emerald-600"],
            ["Outstanding", fmt(summaryData.totalBalance),    "text-red-600"],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-white rounded-xl px-4 py-3 shadow-sm text-center border border-slate-100">
              <p className={`text-xl font-bold ${c}`}>{v || "—"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* Section tabs */}
        {sections.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-white flex-shrink-0 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">Section:</span>
            {["all", ...sections].map((sec) => {
              const secData = sec !== "all" ? sectionWise.find((s) => s._id === sec) : null;
              const isActive = filterSection === sec;
              return (
                <button key={sec} onClick={() => setFilterSection(sec)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}>
                  {sec === "all" ? "All Sections" : `Section ${sec}`}
                  {secData && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {secData.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 px-4 py-3 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, roll no, admission no…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
            {["all","paid","partial","pending","overdue"].map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Status" : s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <RefreshCw size={28} className="animate-spin text-indigo-500" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">
                {records.length === 0
                  ? "No invoices generated yet. Click \"Generate Invoices\" above."
                  : "No students match the current filters."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  {["Sec","Roll","Student","Adm. No","Total Due","Paid","Balance","Status","Action"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayed.map((rec) => {
                  const s = rec.studentId;
                  return (
                    <tr key={rec._id} className={`hover:bg-slate-50 transition-colors ${rec.status === "overdue" ? "bg-red-50/30" : ""}`}>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{rec.section || "—"}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs font-semibold text-violet-700">{rec.rollNo || s?.rollNo || "—"}</span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {s ? `${s.firstName} ${s.lastName}` : rec.studentName}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{s?.admissionNo || rec.admissionNo || "—"}</span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{fmt(rec.totalDue)}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-600">{fmt(rec.totalPaid)}</td>
                      <td className="px-3 py-3 font-semibold text-red-600">{fmt(rec.balance)}</td>
                      <td className="px-3 py-3"><StatusPill status={rec.status} /></td>
                      <td className="px-3 py-3">
                        {rec.status !== "paid" && rec.status !== "waived" ? (
                          <button onClick={() => setPayModal(rec)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 whitespace-nowrap">
                            Record Payment
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <CheckCircle size={12} /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && displayed.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex-shrink-0">
            <p className="text-xs text-slate-400">
              Showing {displayed.length} of {records.length} students
              {filterSection !== "all" && ` in Section ${filterSection}`}
            </p>
          </div>
        )}
      </div>

      {payModal && (
        <RecordPaymentModal record={payModal} onClose={() => setPayModal(null)} onConfirm={handleRecord} />
      )}
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({ record, onClose, onConfirm }) {
  const [form, setForm] = useState({
    studentFeeId: record._id, instalmentNumber: "",
    amount: record.balance, discount: 0, lateFee: 0,
    paymentMode: "cash", transactionRef: "", note: "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const net = Number(form.amount) - Number(form.discount) + Number(form.lateFee);

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Record Payment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <div className="bg-indigo-50 rounded-xl px-4 py-3 mb-5">
          <p className="font-semibold text-indigo-800">{record.studentName}</p>
          <p className="text-xs text-indigo-600 mt-0.5 flex items-center gap-2">
            {record.section && <span className="flex items-center gap-1"><GraduationCap size={11}/>{record.grade}-{record.section}</span>}
            {record.rollNo  && <span className="flex items-center gap-1"><Hash size={10}/>Roll {record.rollNo}</span>}
            <span>Balance: {fmt(record.balance)}</span>
          </p>
        </div>
        <div className="space-y-4">
          <FieldLabel label="Instalment">
            <select value={form.instalmentNumber} onChange={(e) => set("instalmentNumber", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Full / Remaining Balance</option>
              {(record.instalmentStatus || []).map((i) => (
                <option key={i.instalmentNumber} value={i.instalmentNumber} disabled={i.status === "paid"}>
                  {i.label || `Inst. ${i.instalmentNumber}`} — {fmt(i.amount - i.paid)} due{i.status === "paid" ? " ✓" : ""}
                </option>
              ))}
            </select>
          </FieldLabel>
          <div className="grid grid-cols-3 gap-3">
            {[["amount","Amount (₹)"],["discount","Discount (₹)"],["lateFee","Late Fee (₹)"]].map(([k, l]) => (
              <FieldLabel key={k} label={l}>
                <input type="number" min="0" value={form[k]} onChange={(e) => set(k, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </FieldLabel>
            ))}
          </div>
          <FieldLabel label="Payment Mode">
            <select value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
              {["cash","cheque","upi","online","card","dd","neft","rtgs","other"].map((m) => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Transaction Ref">
            <input value={form.transactionRef} onChange={(e) => set("transactionRef", e.target.value)}
              placeholder="UTR / Cheque no / TxID"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
          </FieldLabel>
          <div className="flex justify-between items-center bg-emerald-50 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-600 font-medium">Net Payable</span>
            <span className="text-xl font-bold text-emerald-700">{fmt(net)}</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => onConfirm({ ...form, instalmentNumber: form.instalmentNumber ? Number(form.instalmentNumber) : null })}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            <Save size={14} className="inline mr-1.5"/>Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

const FieldLabel = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function FeeStructureModal({ initial, onSave, onClose }) {
const [form, setForm] = useState(() => {
  if (!initial) return BLANK();
  // Deep-merge: start from BLANK's bankDetails, overlay actual values
  const blankBd   = BLANK().bankDetails;
  const initialBd = initial.bankDetails || {};
  return {
    ...BLANK(),       
    ...initial,       
    bankDetails: {
      ...blankBd,     
      ...initialBd,   
    },
  };
});  const [tab,    setTab]    = useState("components");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setF  = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setBank = (k, v) => setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, [k]: v } }));

  const totalAmount = form.feeComponents.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const pctSum      = form.installments.reduce((s, i) => s + (Number(i.percentage) || 0), 0);

  const validate = () => {
    const e = {};
    if (!form.grade)        e.grade        = "Please select a grade.";
    if (!form.academicYear) e.academicYear = "Please select an academic year.";
    const valid = form.feeComponents.filter((c) => c.name?.trim());
    if (!valid.length)      e.components   = "Add at least one fee component.";
    if (form.installments.length > 0 && pctSum !== 100)
      e.installments = `Percentages must add up to 100 (currently ${pctSum}).`;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(sanitisePayload(form));
    setSaving(false);
  };

  const updComp = (i, k, v) => { const a=[...form.feeComponents]; a[i]={...a[i],[k]:k==="amount"?Number(v)||0:v}; setF("feeComponents",a); };
  const addComp = () => setF("feeComponents",[...form.feeComponents,{name:"",amount:0,mandatory:false,category:"other"}]);
  const rmComp  = (i) => setF("feeComponents",form.feeComponents.filter((_,j)=>j!==i));
  const updInst = (i, k, v) => { const a=[...form.installments]; a[i]={...a[i],[k]:k==="percentage"?Number(v)||0:v}; setF("installments",a); };
  const addInst = () => setF("installments",[...form.installments,{installmentNumber:form.installments.length+1,label:"",dueDate:"",percentage:0}]);
  const rmInst  = (i) => setF("installments",form.installments.filter((_,j)=>j!==i));

  // tabs — added "bank" tab
  const TABS = [
    { id:"components",   label:"Fee Components" },
    { id:"installments", label:"Instalments"    },
    { id:"discounts",    label:"Discounts"      },
    { id:"bank",         label:"Bank Details"   },
    { id:"policy",       label:"Late Fee Policy"},
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-6 shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">{initial ? "Edit" : "Create"} Fee Structure</h2>
            <p className="text-indigo-200 text-sm mt-0.5">Class-wise annual fee configuration</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10">
            <X size={22}/>
          </button>
        </div>

        <div className="p-6">
          {/* Top fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Grade <span className="text-red-500">*</span>
              </label>
              <select value={form.grade} onChange={(e) => setF("grade", e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${errors.grade ? "border-red-400 bg-red-50" : "border-slate-200"}`}>
                <option value="">Select Grade</option>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select value={form.academicYear} onChange={(e) => setF("academicYear", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                {ACADEMIC_YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fee Type</label>
              <select value={form.feeType} onChange={(e) => setF("feeType", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                {FEE_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title (optional)</label>
              <input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="e.g. Science stream"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              {Object.values(errors).map((msg, i) => (
                <p key={i} className="text-red-600 text-xs flex items-center gap-1.5"><AlertCircle size={13}/>{msg}</p>
              ))}
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  tab === t.id ? "bg-white shadow text-indigo-700" : "text-slate-500 hover:text-slate-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Fee Components ── */}
          {tab === "components" && (
            <div>
              <div className="space-y-2">
                {form.feeComponents.map((comp, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 px-3 py-2.5 rounded-xl">
                    <div className="col-span-4">
                      <input value={comp.name} onChange={(e) => updComp(i,"name",e.target.value)} placeholder="Component name"
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"/>
                    </div>
                    <div className="col-span-2">
                      <select value={comp.category} onChange={(e) => updComp(i,"category",e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white capitalize">
                        {COMP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                        <input type="number" min="0" value={comp.amount} onChange={(e) => updComp(i,"amount",e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"/>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <input type="checkbox" id={`m${i}`} checked={comp.mandatory} onChange={(e) => updComp(i,"mandatory",e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600"/>
                      <label htmlFor={`m${i}`} className="text-xs text-slate-600 select-none cursor-pointer">Mandatory</label>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => rmComp(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addComp} className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                <PlusCircle size={15}/> Add Component
              </button>
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Mandatory: <strong>{fmt(form.feeComponents.filter(c=>c.mandatory).reduce((s,c)=>s+c.amount,0))}</strong>
                  {" · "}Optional: <strong>{fmt(form.feeComponents.filter(c=>!c.mandatory).reduce((s,c)=>s+c.amount,0))}</strong>
                </span>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-2xl font-bold text-indigo-600">{fmt(totalAmount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Instalments ── */}
          {tab === "installments" && (
            <div>
              <p className="text-xs text-slate-500 mb-3">Leave Due Date blank if not yet decided.</p>
              <div className="space-y-2">
                {form.installments.map((inst, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 px-3 py-2.5 rounded-xl">
                    <div className="col-span-1 text-center text-sm font-bold text-slate-400">#{inst.installmentNumber}</div>
                    <div className="col-span-2">
                      <input value={inst.label} onChange={(e) => updInst(i,"label",e.target.value)} placeholder="Q1 / Term 1"
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div className="col-span-4">
                      <input type="date" value={inst.dueDate||""} onChange={(e) => updInst(i,"dueDate",e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <input type="number" min="0" max="100" value={inst.percentage} onChange={(e) => updInst(i,"percentage",e.target.value)}
                          className="w-full px-3 py-1.5 pr-7 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500"/>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-slate-600">
                      = {fmt(Math.round((totalAmount*(Number(inst.percentage)||0))/100))}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => rmInst(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addInst} className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                <PlusCircle size={15}/> Add Instalment
              </button>
              <p className={`mt-3 text-sm font-semibold text-right ${pctSum===100?"text-emerald-600":pctSum===0?"text-slate-400":"text-red-500"}`}>
                Total: {pctSum}% {pctSum!==100&&pctSum!==0&&"(must equal 100%)"}
              </p>
            </div>
          )}

          {/* ── Discounts ── */}
          {tab === "discounts" && (
            <div className="space-y-2">
              {form.discountRules.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 px-3 py-2.5 rounded-xl">
                  <div className="col-span-3">
                    <input value={d.type} onChange={(e) => { const a=[...form.discountRules]; a[i]={...a[i],type:e.target.value}; setF("discountRules",a); }}
                      placeholder="Discount type" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <input type="number" min="0" max="100" value={d.percentage}
                        onChange={(e) => { const a=[...form.discountRules]; a[i]={...a[i],percentage:Number(e.target.value)||0}; setF("discountRules",a); }}
                        className="w-full px-3 py-1.5 pr-7 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500"/>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                    </div>
                  </div>
                  <div className="col-span-6">
                    <input value={d.conditions} onChange={(e) => { const a=[...form.discountRules]; a[i]={...a[i],conditions:e.target.value}; setF("discountRules",a); }}
                      placeholder="Conditions / eligibility" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => setF("discountRules",form.discountRules.filter((_,j)=>j!==i))}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><X size={14}/></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setF("discountRules",[...form.discountRules,{type:"",percentage:0,conditions:""}])}
                className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                <PlusCircle size={15}/> Add Rule
              </button>
            </div>
          )}

          {/* ── BANK DETAILS TAB (NEW) ── */}
          {tab === "bank" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Building2 size={18} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="text-sm font-semibold text-blue-800">School Bank Account Details</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    These details will be shown to parents so they can transfer fees directly to the school account via NEFT / RTGS / IMPS.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.bankDetails?.accountHolderName || ""}
                    onChange={(e) => setBank("accountHolderName", e.target.value)}
                    placeholder="e.g. Delhi Public School"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.bankDetails?.bankName || ""}
                    onChange={(e) => setBank("bankName", e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.bankDetails?.accountNumber || ""}
                    onChange={(e) => setBank("accountNumber", e.target.value)}
                    placeholder="e.g. 1234567890"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.bankDetails?.ifscCode || ""}
                    onChange={(e) => setBank("ifscCode", e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Account Type</label>
                  <select
                    value={form.bankDetails?.accountType || "Current"}
                    onChange={(e) => setBank("accountType", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {["Current","Savings","OD"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Branch Name</label>
                  <input
                    value={form.bankDetails?.branchName || ""}
                    onChange={(e) => setBank("branchName", e.target.value)}
                    placeholder="e.g. Connaught Place, New Delhi"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Preview card — how it looks to parent */}
              {(form.bankDetails?.bankName || form.bankDetails?.accountNumber) && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preview — how parents will see this:</p>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 size={18} className="text-indigo-400"/>
                      <span className="text-sm font-bold text-indigo-300">School Bank Account</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      {[
                        ["Account Holder", form.bankDetails?.accountHolderName || "—"],
                        ["Bank",           form.bankDetails?.bankName           || "—"],
                        ["Account No.",    form.bankDetails?.accountNumber      || "—"],
                        ["IFSC Code",      form.bankDetails?.ifscCode           || "—"],
                        ["Account Type",   form.bankDetails?.accountType        || "—"],
                        ["Branch",         form.bankDetails?.branchName         || "—"],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <p className="text-slate-400 text-xs">{l}</p>
                          <p className={`font-semibold mt-0.5 ${l === "Account No." || l === "IFSC Code" ? "font-mono tracking-wider text-emerald-300" : "text-white"}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Late Fee Policy ── */}
          {tab === "policy" && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.lateFeePolicy.enabled}
                  onChange={(e) => setF("lateFeePolicy",{...form.lateFeePolicy,enabled:e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"/>
                <span className="text-sm font-semibold text-slate-700">Enable Late Fee Penalty</span>
              </label>
              {form.lateFeePolicy.enabled && (
                <div className="grid grid-cols-3 gap-4 pl-7">
                  {[["gracePeriodDays","Grace Period (days)"],["penaltyPercentage","Penalty %"],["maximumPenalty","Max Penalty ₹"]].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{l}</label>
                      <input type="number" min="0" value={form.lateFeePolicy[k]}
                        onChange={(e) => setF("lateFeePolicy",{...form.lateFeePolicy,[k]:Number(e.target.value)})}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => setF("notes",e.target.value)} rows={3}
                  placeholder="Internal notes…"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>}
            {initial ? "Update Structure" : "Create Structure"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function FeeStructure() {
  const { authFetch } = useAuth();

  const [structures,    setStructures]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [filterYear,    setFilterYear]    = useState("2025-2026");
  const [filterGrade,   setFilterGrade]   = useState("all");
  const [showModal,     setShowModal]     = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [statusPanel,   setStatusPanel]   = useState(null);
  const [generatingFor, setGenerating]    = useState(null);
  const [studentCount,  setStudentCount]  = useState({ total:0, active:0 });

  useEffect(() => {
    authFetch("/students/count")
      .then((r) => r.json())
      .then((json) => { if (json.success && json.data) setStudentCount({ total: json.data.total??0, active: json.data.active??0 }); })
      .catch(() => {});
  }, [authFetch]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const q    = new URLSearchParams({ academicYear: filterYear, ...(filterGrade !== "all" && { grade: filterGrade }) });
      const res  = await authFetch(`/fees/structures?${q}`);
      const json = await res.json();
      if (json.success) setStructures(json.data || []);
      else setError(json.message || "Failed to load.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }, [authFetch, filterYear, filterGrade]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload) => {
    const method = editTarget ? "PUT"  : "POST";
    const url    = editTarget ? `/fees/structures/${editTarget._id}` : "/fees/structures";
    const res    = await authFetch(url, { method, body: JSON.stringify(payload) });
    const json   = await res.json();
    if (json.success) { setShowModal(false); setEditTarget(null); load(); }
    else alert(`Error: ${json.message || "Could not save fee structure."}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this fee structure?")) return;
    const res  = await authFetch(`/fees/structures/${id}`, { method:"DELETE" });
    const json = await res.json();
    if (json.success) load(); else alert(json.message || "Delete failed.");
  };

  const handleDuplicate = (s) => {
    setEditTarget(null);
    setShowModal({ ...s, _id: undefined, grade:"", academicYear:"2025-2026", title:`${s.title||s.grade} (copy)` });
  };

  const handleGenerate = async (s) => {
    if (!window.confirm(`Generate invoices for all active students in ${s.grade}?`)) return;
    setGenerating(s._id);
    try {
      const res  = await authFetch("/fees/generate-invoices", {
        method:"POST",
        body: JSON.stringify({ feeStructureId:s._id, grade:s.grade, academicYear:s.academicYear }),
      });
      const json = await res.json();
      alert(json.success ? json.message : `Error: ${json.message}`);
      load();
    } finally { setGenerating(null); }
  };

  const filtered = structures.filter((s) => {
    const q = search.toLowerCase();
    return (s.grade || "").toLowerCase().includes(q) || (s.title || "").toLowerCase().includes(q);
  });

  const totalPaid    = filtered.reduce((a,s) => a + (s.paymentSummary?.paid    || 0), 0);
  const totalOverdue = filtered.reduce((a,s) => a + (s.paymentSummary?.overdue || 0), 0);
  const totalPending = filtered.reduce((a,s) => a + (s.paymentSummary?.pending || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 py-7 space-y-6">

        <div className="flex flex-wrap gap-3 items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fee Structure Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Create class-wise fee structures · Add bank details for parent payments</p>
          </div>
          <button onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm">
            <Plus size={17}/> New Fee Structure
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-5 text-white">
            <BookOpen size={20} className="opacity-80 mb-3"/>
            <p className="text-3xl font-bold">{filtered.length}</p>
            <p className="text-sm opacity-80 mt-0.5">Structures</p>
          </div>
          <div className="bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl p-5 text-white">
            <Users size={20} className="opacity-80 mb-3"/>
            <p className="text-3xl font-bold">{studentCount.active.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-0.5">Active Students</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
            <CheckCircle size={20} className="opacity-80 mb-3"/>
            <p className="text-3xl font-bold">{totalPaid}</p>
            <p className="text-sm opacity-80 mt-0.5">Fully Paid</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <AlertCircle size={20} className="opacity-80 mb-3"/>
            <p className="text-3xl font-bold">{totalPending + totalOverdue}</p>
            <p className="text-sm opacity-80 mt-0.5">Pending / Overdue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search grade or title…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
            {ACADEMIC_YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Grades</option>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <button onClick={load}
            className="px-3 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 flex items-center gap-2 text-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16}/>{error}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="flex justify-center py-24"><RefreshCw size={32} className="animate-spin text-indigo-500"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <DollarSign size={48} className="mx-auto mb-4 text-slate-200"/>
            <p className="text-slate-500 font-medium">No fee structures found</p>
            <p className="text-sm text-slate-400 mt-1">Click "New Fee Structure" to create one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((s) => {
              const ps      = s.paymentSummary || {};
              const paidPct = ps.total ? Math.round(((ps.paid||0)+(ps.partial||0)) / ps.total * 100) : 0;
              const hasBankDetails = s.bankDetails?.accountNumber || s.bankDetails?.bankName;
              return (
                <div key={s._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white text-xl font-bold">{s.grade}</h3>
                        {s.title && <p className="text-indigo-200 text-xs mt-0.5">{s.title}</p>}
                        <span className="mt-2 inline-block px-2.5 py-0.5 bg-white/20 text-white text-xs rounded-full font-medium">
                          {s.academicYear}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">{fmt(s.totalAmount)}</p>
                        <p className="text-indigo-200 text-xs mt-0.5 capitalize">{s.feeType}</p>
                      </div>
                    </div>
                    {ps.total > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-indigo-200 mb-1.5">
                          <span>{ps.paid||0} / {ps.total} fully paid</span>
                          <span>{paidPct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full">
                          <div className="h-1.5 bg-white rounded-full" style={{ width:`${paidPct}%` }}/>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    {ps.total > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          ["Paid",    ps.paid,    "bg-emerald-50 text-emerald-700"],
                          ["Partial", ps.partial, "bg-amber-50  text-amber-700"  ],
                          ["Pending", ps.pending, "bg-slate-100  text-slate-600"  ],
                          ["Overdue", ps.overdue, "bg-red-50    text-red-700"     ],
                        ].filter(([,v]) => v > 0).map(([l, v, cls]) => (
                          <span key={l} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{v} {l}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-4">No invoices generated yet</p>
                    )}

                    {/* Bank details indicator */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold mb-4 ${
                      hasBankDetails ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      <Building2 size={13}/>
                      {hasBankDetails
                        ? `Bank: ${s.bankDetails.bankName} · ${s.bankDetails.accountNumber}`
                        : "Bank details not added — parents cannot pay"}
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {(s.feeComponents || []).slice(0,3).map((c, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            {c.mandatory && <span className="w-1.5 h-1.5 bg-red-400 rounded-full"/>}
                            {c.name}
                          </span>
                          <span className="font-semibold text-slate-700">{fmt(c.amount)}</span>
                        </div>
                      ))}
                      {(s.feeComponents||[]).length > 3 && (
                        <p className="text-xs text-slate-400">+{s.feeComponents.length-3} more</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setStatusPanel(s)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100">
                        <Eye size={13}/> View by Section
                      </button>
                      <button onClick={() => handleGenerate(s)} disabled={generatingFor === s._id}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50">
                        {generatingFor===s._id ? <RefreshCw size={13} className="animate-spin"/> : <Send size={13}/>}
                        Generate
                      </button>
                      <button onClick={() => { setEditTarget(s); setShowModal(true); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-700 rounded-xl text-xs font-semibold hover:bg-sky-100">
                        <Edit2 size={13}/> Edit
                      </button>
                      <button onClick={() => handleDuplicate(s)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200">
                        <Copy size={13}/> Duplicate
                      </button>
                    </div>
                    <button onClick={() => handleDelete(s._id)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100">
                      <Trash2 size={13}/> Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <FeeStructureModal
          initial={editTarget || (showModal !== true ? showModal : null)}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}

      {statusPanel && (
        <StudentStatusPanel
          structure={statusPanel}
          authFetch={authFetch}
          onClose={() => setStatusPanel(null)}
        />
      )}
    </div>
  );
}