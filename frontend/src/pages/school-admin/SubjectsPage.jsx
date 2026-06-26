// src/pages/school-admin/SubjectsPage.jsx
// KEY FIX: addClassTag now stores className as `${c.name}-${c.section}` (e.g. "Grade 10-C")
// which is the primary format the attendance controller looks for.
// The controller also tries all other variants so old data continues to work.

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, Check,
  AlertCircle, ChevronDown, GraduationCap, Tag, Hash,
  Layers, Loader2, FlaskConical, Globe2, Music2, Wrench,
} from "lucide-react";

// ── API ───────────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";
const api = axios.create({ baseURL: API, withCredentials: true });

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECT_TYPES = ["Core", "Elective", "Language", "Co-Curricular", "Vocational"];

const TYPE_META = {
  Core:            { bg: "#EEF2FF", color: "#4338CA", dot: "#6366F1", icon: Layers },
  Elective:        { bg: "#FDF4FF", color: "#7E22CE", dot: "#A855F7", icon: Tag },
  Language:        { bg: "#ECFDF5", color: "#065F46", dot: "#10B981", icon: Globe2 },
  "Co-Curricular": { bg: "#FFF7ED", color: "#92400E", dot: "#F59E0B", icon: Music2 },
  Vocational:      { bg: "#FFF1F2", color: "#9F1239", dot: "#F43F5E", icon: Wrench },
};

const EMPTY_FORM = {
  name: "", code: "", description: "",
  type: "Core", maxMarks: 100, passMarks: 33, assignedClasses: [],
};

let _toastId = 0;

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .sp-wrap * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

  .sp-wrap {
    background: #F4F6FB;
    min-height: 100vh;
  }

  .sp-header {
    background: #fff;
    border-bottom: 1.5px solid #E8ECF4;
    padding: 24px 28px;
    display: flex; flex-wrap: wrap; align-items: center;
    justify-content: space-between; gap: 12px;
  }

  .sp-add-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: #fff; padding: 10px 20px; border-radius: 11px;
    font-size: 14px; font-weight: 600; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
    transition: opacity 0.15s, transform 0.15s;
  }
  .sp-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .sp-stat {
    background: #fff; border-radius: 14px;
    border: 1.5px solid #E8ECF4; padding: 18px 20px;
    display: flex; align-items: center; gap: 14px;
    transition: box-shadow 0.2s, transform 0.15s;
  }
  .sp-stat:hover { box-shadow: 0 6px 24px rgba(15,23,42,0.08); transform: translateY(-1px); }
  .sp-stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sp-stat-val  { font-size: 26px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px; line-height: 1; margin-bottom: 3px; }
  .sp-stat-lbl  { font-size: 12.5px; color: #64748B; font-weight: 500; }

  .sp-search  { position: relative; flex: 1; min-width: 220px; }
  .sp-search input {
    width: 100%; padding: 10px 14px 10px 40px;
    border: 1.5px solid #E2E8F0; border-radius: 10px;
    background: #fff; color: #0F172A; font-size: 14px;
    outline: none; transition: border 0.15s, box-shadow 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .sp-search input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .sp-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }

  .sp-select {
    padding: 10px 36px 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px;
    background: #fff; color: #374151; font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer;
    appearance: none; transition: border 0.15s;
  }
  .sp-select:focus { border-color: #6366F1; }
  .sp-select-wrap { position: relative; }
  .sp-select-wrap svg { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #94A3B8; }

  .sp-table-wrap {
    background: #fff; border-radius: 16px;
    border: 1.5px solid #E8ECF4;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(15,23,42,0.04);
  }
  .sp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .sp-table thead tr { background: #F8FAFC; border-bottom: 1.5px solid #E8ECF4; }
  .sp-table th {
    padding: 12px 20px; text-align: left;
    font-size: 11px; font-weight: 700; color: #94A3B8;
    text-transform: uppercase; letter-spacing: 0.08em;
    white-space: nowrap;
  }
  .sp-table th.r { text-align: right; }
  .sp-table tbody tr { border-bottom: 1px solid #F1F5F9; transition: background 0.12s; }
  .sp-table tbody tr:last-child { border-bottom: none; }
  .sp-table tbody tr:hover { background: #FAFBFF; }
  .sp-table td { padding: 14px 20px; vertical-align: middle; }

  .sp-subj-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .sp-type-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 600; padding: 4px 10px;
    border-radius: 20px; white-space: nowrap;
  }
  .sp-type-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  .sp-code {
    font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
    background: #F1F5F9; color: #475569;
    padding: 4px 10px; border-radius: 8px; letter-spacing: 0.04em;
  }

  .sp-class-tag {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11.5px; font-weight: 500; padding: 3px 8px;
    border-radius: 6px; background: #EEF2FF; color: #4338CA;
    white-space: nowrap;
  }
  .sp-more-tag {
    font-size: 11.5px; font-weight: 600; padding: 3px 8px;
    border-radius: 6px; background: #F1F5F9; color: #64748B;
  }

  .sp-marks { display: flex; align-items: center; gap: 6px; }
  .sp-marks-val { font-size: 14px; font-weight: 700; color: #0F172A; }
  .sp-marks-lbl { font-size: 11px; color: #94A3B8; font-weight: 500; }
  .sp-marks-sep { color: #CBD5E1; font-size: 12px; }

  .sp-act-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
  }
  .sp-act-edit { background: #F1F5F9; color: #475569; }
  .sp-act-edit:hover { background: #EEF2FF; color: #4F46E5; }
  .sp-act-del  { background: #F1F5F9; color: #475569; }
  .sp-act-del:hover  { background: #FEF2F2; color: #DC2626; }

  .sp-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 72px 24px; text-align: center;
  }

  .sp-shimmer {
    background: linear-gradient(90deg, #F1F5F9 25%, #E8ECF4 50%, #F1F5F9 75%);
    background-size: 400px 100%;
    animation: sp-shimmer 1.4s infinite;
    border-radius: 8px;
  }
  @keyframes sp-shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }

  .sp-modal-bg {
    position: fixed; inset: 0; background: rgba(15,23,42,0.45);
    backdrop-filter: blur(3px); z-index: 50;
    display: flex; align-items: center; justify-content: center;
    padding: 16px; overflow-y: auto;
  }

  .sp-form-modal {
    background: #fff; border-radius: 20px;
    width: 100%; max-width: 520px; max-height: 90vh;
    overflow-y: auto; box-shadow: 0 24px 64px rgba(15,23,42,0.2);
    border: 1.5px solid #E8ECF4;
    animation: sp-pop 0.22s cubic-bezier(0.16,1,0.3,1);
  }

  .sp-del-modal {
    background: #fff; border-radius: 20px;
    width: 100%; max-width: 380px;
    box-shadow: 0 24px 64px rgba(15,23,42,0.2);
    border: 1.5px solid #E8ECF4; padding: 28px;
    animation: sp-pop 0.22s cubic-bezier(0.16,1,0.3,1);
  }

  @keyframes sp-pop {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sp-label {
    display: block; font-size: 11px; font-weight: 700;
    color: #64748B; text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 6px;
  }
  .sp-input {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid #E2E8F0; border-radius: 10px;
    background: #fff; color: #0F172A; font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none;
    transition: border 0.15s, box-shadow 0.15s;
  }
  .sp-input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .sp-input::placeholder { color: #CBD5E1; }
  .sp-input.mono { font-family: 'DM Mono', monospace; }

  .sp-suggestion-list {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
    box-shadow: 0 8px 32px rgba(15,23,42,0.12); z-index: 10;
    max-height: 200px; overflow-y: auto;
  }
  .sp-suggestion-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; cursor: pointer; border: none; background: transparent;
    width: 100%; text-align: left; transition: background 0.1s;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #0F172A;
  }
  .sp-suggestion-item:hover { background: #F5F7FF; color: #4F46E5; }

  .sp-cls-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: #EEF2FF; color: #4338CA;
    font-size: 12px; font-weight: 600; padding: 4px 10px;
    border-radius: 20px;
  }
  .sp-cls-chip button { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.6; display: flex; }
  .sp-cls-chip button:hover { opacity: 1; }

  /* canonical label badge */
  .sp-canonical {
    font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
    background: rgba(99,102,241,0.12); color: #4338CA;
    padding: 2px 6px; border-radius: 4px; margin-left: 4px;
    vertical-align: middle;
  }

  .sp-form-cancel {
    flex: 1; padding: 10px; border-radius: 10px;
    border: 1.5px solid #E2E8F0; background: #fff;
    color: #475569; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s;
  }
  .sp-form-cancel:hover { background: #F8FAFC; }
  .sp-form-submit {
    flex: 1; padding: 10px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: #fff; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3); transition: opacity 0.15s;
  }
  .sp-form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .sp-form-submit:not(:disabled):hover { opacity: 0.9; }

  .sp-toast-wrap { position: fixed; bottom: 20px; right: 20px; z-index: 60; display: flex; flex-direction: column; gap: 8px; }
  .sp-toast {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px;
    font-size: 13.5px; font-weight: 500;
    box-shadow: 0 8px 24px rgba(15,23,42,0.15);
    animation: sp-pop 0.2s ease;
    min-width: 240px; max-width: 340px;
  }
  .sp-toast.success { background: #0F172A; color: #fff; }
  .sp-toast.error   { background: #FEF2F2; color: #DC2626; border: 1.5px solid #FECACA; }
  .sp-toast-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; opacity: 0.5; display: flex; }
  .sp-toast-close:hover { opacity: 1; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @media (max-width: 767px) {
    .sp-header { padding: 16px; }
    .sp-table-wrap { border-radius: 12px; }
    .sp-form-modal { border-radius: 16px; }
  }
`;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="sp-toast-wrap">
    {toasts.map((t) => (
      <div key={t.id} className={`sp-toast ${t.type}`}>
        {t.type === "success"
          ? <Check size={15} style={{ flexShrink: 0 }} />
          : <AlertCircle size={15} style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1 }}>{t.message}</span>
        <button className="sp-toast-close" onClick={() => removeToast(t.id)}><X size={14} /></button>
      </div>
    ))}
  </div>
);

// ── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal = ({ subject, onConfirm, onCancel, loading }) => (
  <div className="sp-modal-bg" onClick={e => e.target === e.currentTarget && onCancel()}>
    <div className="sp-del-modal">
      <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Trash2 size={22} color="#DC2626" />
      </div>
      <h3 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Delete Subject?</h3>
      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
        <strong style={{ color: '#0F172A' }}>{subject?.name}</strong> will be permanently removed from the curriculum.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} className="sp-form-cancel">Cancel</button>
        <button
          onClick={onConfirm} disabled={loading}
          style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s' }}
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Subject Form Modal ────────────────────────────────────────────────────────
const SubjectFormModal = ({ mode, initial, onSave, onClose, saving }) => {
  const [form,             setForm]             = useState(initial || EMPTY_FORM);
  const [classInput,       setClassInput]       = useState("");
  const [showSuggestions,  setShowSuggestions]  = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses,   setLoadingClasses]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/classes", { params: { isArchived: false, limit: 200 } });
        setAvailableClasses(data.classes ?? data.data ?? []);
      } catch { setAvailableClasses([]); }
      finally  { setLoadingClasses(false); }
    })();
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── KEY FIX: store className as canonical "Grade-Section" format ──────────
  // e.g. "Grade 10-C"  (grade=name, section uppercased, joined with dash, no spaces around dash)
  // The attendance controller checks this as its PRIMARY variant.
  // Old data with "Grade 10 - C" is handled by the controller's variant list.
  const addClassTag = (cls) => {
    const canonicalName = `${cls.name}-${(cls.section || "").toUpperCase()}`;
    // Also keep a human-friendly display label
    const displayLabel  = cls.displayName || `${cls.name} ${(cls.section || "").toUpperCase()}`;

    // Prevent duplicates by classId OR canonical name
    if (form.assignedClasses.some(c =>
      c.classId === cls._id ||
      c.className === canonicalName
    )) return;

    set("assignedClasses", [
      ...form.assignedClasses,
      {
        classId:   cls._id,
        className: canonicalName,   // ← stored in DB, used for attendance lookup
        label:     displayLabel,    // ← display only (not stored to DB, just UI)
      },
    ]);
    setClassInput("");
    setShowSuggestions(false);
  };

  const removeClassTag = (classId) =>
    set("assignedClasses", form.assignedClasses.filter(c => c.classId !== classId));

  // Strip the local-only `label` field before saving so the DB only gets classId + className
  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {
      ...form,
      assignedClasses: form.assignedClasses.map(({ classId, className }) => ({ classId, className })),
    };
    onSave(cleaned);
  };

  const suggestions = availableClasses.filter(c => {
    const label = (c.displayName || `${c.name} ${c.section}`).toLowerCase();
    const canon = `${c.name}-${(c.section || "").toUpperCase()}`.toLowerCase();
    const q     = classInput.toLowerCase();
    return (label.includes(q) || canon.includes(q)) &&
           !form.assignedClasses.some(ac => ac.classId === c._id);
  });

  const typeMeta = TYPE_META[form.type] || TYPE_META.Core;

  return (
    <div className="sp-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sp-form-modal">
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: typeMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
            <BookOpen size={18} color={typeMeta.color} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
              {mode === 'create' ? 'Add New Subject' : 'Edit Subject'}
            </h2>
            <p style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 1 }}>Fill in the subject details below</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name + Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="sp-label">Subject Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input required className="sp-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="sp-label">Subject Code <span style={{ color: '#EF4444' }}>*</span></label>
              <input required className="sp-input mono" value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="e.g. MATH" />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="sp-label">Subject Type</label>
            <div className="sp-select-wrap">
              <select className="sp-input" style={{ paddingRight: 36, appearance: 'none' }} value={form.type} onChange={e => set("type", e.target.value)}>
                {SUBJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="sp-label">Description</label>
            <textarea
              className="sp-input" rows={2} style={{ resize: 'none' }}
              value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Optional notes or description…"
            />
          </div>

          {/* Marks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="sp-label">Max Marks</label>
              <input type="number" min={1} className="sp-input" value={form.maxMarks} onChange={e => set("maxMarks", Number(e.target.value))} />
            </div>
            <div>
              <label className="sp-label">Pass Marks</label>
              <input type="number" min={0} className="sp-input" value={form.passMarks} onChange={e => set("passMarks", Number(e.target.value))} />
            </div>
          </div>

          {/* Assigned classes */}
          <div>
            <label className="sp-label">
              Assigned Classes
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
                (stored as Grade-Section for attendance matching)
              </span>
            </label>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, minHeight: 28 }}>
              {form.assignedClasses.length === 0
                ? <span style={{ fontSize: 12.5, color: '#CBD5E1', fontStyle: 'italic' }}>No classes assigned yet</span>
                : form.assignedClasses.map(c => (
                    <span key={c.classId || c.className} className="sp-cls-chip">
                      <GraduationCap size={11} />
                      {/* Show friendly label if available, otherwise canonical name */}
                      {c.label || c.className}
                      {/* Show canonical stored value in a small badge */}
                      <span className="sp-canonical">{c.className}</span>
                      <button type="button" onClick={() => removeClassTag(c.classId || c.className)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))
              }
            </div>

            {/* Search input */}
            <div style={{ position: 'relative' }}>
              {loadingClasses ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#94A3B8' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading classes…
                </div>
              ) : (
                <input
                  className="sp-input" value={classInput}
                  onChange={e => { setClassInput(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={e => {
                    if (e.key === "Escape") setShowSuggestions(false);
                    if (e.key === "Enter" && suggestions.length > 0) { e.preventDefault(); addClassTag(suggestions[0]); }
                  }}
                  placeholder={availableClasses.length === 0 ? "No classes available — create classes first" : "Search and select a class…"}
                  disabled={availableClasses.length === 0}
                  style={{ opacity: availableClasses.length === 0 ? 0.5 : 1 }}
                />
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="sp-suggestion-list">
                  {suggestions.map(c => {
                    const displayLabel = c.displayName || `${c.name} ${c.section}`;
                    const canonical    = `${c.name}-${(c.section || "").toUpperCase()}`;
                    return (
                      <button key={c._id} type="button" className="sp-suggestion-item" onMouseDown={() => addClassTag(c)}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <GraduationCap size={13} color="#6366F1" />
                        </div>
                        <span style={{ flex: 1 }}>{displayLabel}</span>
                        {/* Show canonical key so admin sees what gets stored */}
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', background: '#EEF2FF', color: '#4338CA', padding: '2px 6px', borderRadius: 4 }}>
                          {canonical}
                        </span>
                        {c.academicYear && <span style={{ fontSize: 11.5, color: '#94A3B8', marginLeft: 4 }}>{c.academicYear}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {showSuggestions && classInput && suggestions.length === 0 && !loadingClasses && (
                <div className="sp-suggestion-list" style={{ padding: '12px 16px', fontSize: 13.5, color: '#94A3B8', fontStyle: 'italic' }}>
                  No matching classes found
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
              Select from your school's active classes · stored as <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>Grade-Section</code> for reliable attendance lookup
            </p>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" className="sp-form-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="sp-form-submit" disabled={saving}>
              {saving
                ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                : <Check size={15} />}
              {saving ? 'Saving…' : mode === 'create' ? 'Create Subject' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SubjectsPage = () => {
  const [subjects,     setSubjects]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("All");
  const [modal,        setModal]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [toasts,       setToasts]       = useState([]);

  const toast = (message, type = "success") => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)               params.search = search;
      if (filterType !== "All") params.type   = filterType;
      const { data } = await api.get("/subjects", { params });
      setSubjects(data.subjects || []);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to load subjects", "error");
    } finally { setLoading(false); }
  }, [search, filterType]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const handleSave = async (form) => {
    try {
      setSaving(true);
      if (modal.mode === "create") {
        const { data } = await api.post("/subjects", form);
        setSubjects(p => [data.subject, ...p]);
        toast("Subject created successfully");
      } else {
        const { data } = await api.put(`/subjects/${modal.subject._id}`, form);
        setSubjects(p => p.map(s => s._id === data.subject._id ? data.subject : s));
        toast("Subject updated successfully");
      }
      setModal(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to save subject", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/subjects/${deleteTarget._id}`);
      setSubjects(p => p.filter(s => s._id !== deleteTarget._id));
      toast("Subject deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to delete subject", "error");
    } finally { setDeleting(false); }
  };

  const stats = {
    total:    subjects.length,
    core:     subjects.filter(s => s.type === "Core").length,
    elective: subjects.filter(s => s.type === "Elective").length,
    language: subjects.filter(s => s.type === "Language").length,
  };

  const STAT_CARDS = [
    { label: "Total Subjects", value: stats.total,    icon: BookOpen, bg: "#EEF2FF", color: "#6366F1" },
    { label: "Core",           value: stats.core,     icon: Layers,   bg: "#EEF2FF", color: "#4338CA" },
    { label: "Elective",       value: stats.elective, icon: Tag,      bg: "#FDF4FF", color: "#A855F7" },
    { label: "Language",       value: stats.language, icon: Globe2,   bg: "#ECFDF5", color: "#10B981" },
  ];

  // ── Prepare edit initial form: re-attach label from className ─────────────
  const prepareEditForm = (subject) => ({
    name:            subject.name,
    code:            subject.code,
    description:     subject.description || "",
    type:            subject.type,
    maxMarks:        subject.maxMarks,
    passMarks:       subject.passMarks,
    assignedClasses: (subject.assignedClasses || []).map(c => ({
      classId:   c.classId,
      className: c.className,
      label:     c.className, // use stored canonical as label for existing data
    })),
  });

  return (
    <div className="sp-wrap">
      <style>{CSS}</style>

      {/* Page Header */}
      <div className="sp-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.4px' }}>Subjects</h1>
          <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 2 }}>Manage curriculum subjects and class assignments</p>
        </div>
        <button className="sp-add-btn" onClick={() => setModal({ mode: "create" })}>
          <Plus size={16} /> Add Subject
        </button>
      </div>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          {STAT_CARDS.map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="sp-stat">
              <div className="sp-stat-icon" style={{ background: bg }}>
                <Icon size={19} color={color} />
              </div>
              <div>
                <div className="sp-stat-val">{value}</div>
                <div className="sp-stat-lbl">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div className="sp-search" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} />
            <input placeholder="Search by name or code…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <select className="sp-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              {SUBJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="sp-shimmer" style={{ height: 56 }} />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="sp-table-wrap">
            <div className="sp-empty">
              <div style={{ width: 60, height: 60, borderRadius: 16, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <BookOpen size={26} color="#6366F1" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>No subjects found</p>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>Add your first subject to start building the curriculum.</p>
              <button className="sp-add-btn" onClick={() => setModal({ mode: "create" })}>
                <Plus size={15} /> Add Subject
              </button>
            </div>
          </div>
        ) : (
          <div className="sp-table-wrap">
            <div style={{ overflowX: 'auto' }}>
              <table className="sp-table">
                <thead>
                  <tr>
                    {["Subject", "Code", "Type", "Classes", "Marks", "Actions"].map(h => (
                      <th key={h} className={h === "Actions" ? "r" : ""}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => {
                    const meta = TYPE_META[subject.type] || TYPE_META.Core;
                    const TypeIcon = meta.icon;
                    return (
                      <tr key={subject._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="sp-subj-icon" style={{ background: meta.bg }}>
                              <TypeIcon size={16} color={meta.color} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{subject.name}</p>
                              {subject.description && (
                                <p style={{ fontSize: 12, color: '#94A3B8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                  {subject.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><span className="sp-code">{subject.code}</span></td>
                        <td>
                          <span className="sp-type-badge" style={{ background: meta.bg, color: meta.color }}>
                            <span className="sp-type-dot" style={{ background: meta.dot }} />
                            {subject.type}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 240 }}>
                            {!subject.assignedClasses?.length ? (
                              <span style={{ fontSize: 12.5, color: '#CBD5E1', fontStyle: 'italic' }}>None assigned</span>
                            ) : (
                              <>
                                {subject.assignedClasses.slice(0, 3).map(c => (
                                  <span key={c.classId || c.className} className="sp-class-tag">
                                    {c.className}
                                  </span>
                                ))}
                                {subject.assignedClasses.length > 3 && (
                                  <span className="sp-more-tag">+{subject.assignedClasses.length - 3} more</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="sp-marks">
                            <span className="sp-marks-val">{subject.maxMarks}</span>
                            <span className="sp-marks-lbl">max</span>
                            <span className="sp-marks-sep">·</span>
                            <span className="sp-marks-val">{subject.passMarks}</span>
                            <span className="sp-marks-lbl">pass</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button className="sp-act-btn sp-act-edit" title="Edit"
                              onClick={() => setModal({ mode: "edit", subject })}>
                              <Edit2 size={14} />
                            </button>
                            <button className="sp-act-btn sp-act-del" title="Delete"
                              onClick={() => setDeleteTarget(subject)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <SubjectFormModal
          mode={modal.mode}
          initial={modal.mode === "edit" ? prepareEditForm(modal.subject) : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          subject={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default SubjectsPage;