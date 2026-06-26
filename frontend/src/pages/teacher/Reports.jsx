// src/pages/school-admin/Reports.jsx
// Route: /school-admin/reports
// Topper Reports — derives data DYNAMICALLY from the result system.
// Subjects are fetched from the Subject model (/subjects API).
// Supports filter by subject TYPE (Core / Elective / Language / etc.)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy, Plus, Pencil, Trash2, Star, BookOpen,
  ChevronDown, Search, X, Save, Award,
  Users, Filter, RefreshCw, AlertCircle,
  CheckCircle, BarChart3, Sparkles, Tag, Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getExamTypes,
  getClassMarks,
  getStudentsByClass,
  getClassExamStatus,
} from '../../services/resultApi';
import api from '../../services/api';

// ─── Subject type config (mirrors SubjectsPage) ───────────────────────────────
const TYPE_META = {
  Core:            { color: '#1d4ed8', bg: '#dbeafe', label: 'Core'          },
  Elective:        { color: '#6d28d9', bg: '#ede9fe', label: 'Elective'      },
  Language:        { color: '#15803d', bg: '#dcfce7', label: 'Language'      },
  'Co-Curricular': { color: '#c2410c', bg: '#ffedd5', label: 'Co-Curricular' },
  Vocational:      { color: '#9d174d', bg: '#fce7f3', label: 'Vocational'    },
};

const SUBJECT_TYPES = ['All', 'Core', 'Elective', 'Language', 'Co-Curricular', 'Vocational'];

// ─── Rank config ──────────────────────────────────────────────────────────────
const RANK_CONFIG = {
  1: { label: '1st', color: '#b45309', bg: '#fef3c7', border: '#fcd34d', icon: '🥇' },
  2: { label: '2nd', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', icon: '🥈' },
  3: { label: '3rd', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: '🥉' },
};

const EMPTY_FORM = {
  studentName: '', rollNo: '', class: '', subject: '',
  score: '', totalMarks: 100, rank: 1, exam: '', remarks: '',
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
const Spinner = ({ size = 20, color = '#6366f1' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'spin 0.8s linear infinite' }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity=".25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Toast = ({ msg, type = 'success' }) =>
  msg ? (
    <div className={`fixed bottom-6 right-6 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 font-semibold ${type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
      {type === 'error'
        ? <AlertCircle size={14} className="text-red-200" />
        : <CheckCircle size={14} className="text-emerald-400" />}
      {msg}
    </div>
  ) : null;

const PercentBadge = ({ score, total }) => {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const cls = pct >= 95 ? 'bg-emerald-100 text-emerald-700'
            : pct >= 85 ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700';
  return <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${cls}`}>{pct}%</span>;
};

const SubjectTypePill = ({ type }) => {
  const m = TYPE_META[type];
  if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: m.bg, color: m.color }}>
      {type}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, accent = '#6366f1' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: accent + '18' }}>
      <Icon size={18} style={{ color: accent }} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  </div>
);

// ─── Topper Card ──────────────────────────────────────────────────────────────
const TopperCard = ({ topper, subjectMap, onEdit, onDelete }) => {
  const cfg      = RANK_CONFIG[topper.rank] || RANK_CONFIG[1];
  const pct      = Math.round((topper.score / topper.totalMarks) * 100);
  const isAuto   = topper._auto;
  const subDoc   = subjectMap[topper.subject];
  const typeMeta = subDoc ? TYPE_META[subDoc.type] : null;

  return (
    <div className="rounded-2xl border-2 p-5 relative overflow-hidden group transition-all hover:shadow-lg"
      style={{ borderColor: cfg.border, background: cfg.bg }}>

      {/* Rank corner */}
      <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center rounded-bl-2xl"
        style={{ background: cfg.border }}>
        <span className="text-lg">{cfg.icon}</span>
      </div>

      {/* Live badge */}
      {isAuto && (
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-bold rounded flex items-center gap-1">
            <Sparkles size={9} /> Live
          </span>
        </div>
      )}

      <div className="pr-10 mt-4">
        <p className="font-extrabold text-gray-900 text-base leading-tight">{topper.studentName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{topper.rollNo} · Class {topper.class}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-white rounded-lg text-xs font-semibold text-indigo-700 border border-indigo-100 flex items-center gap-1">
          <BookOpen size={11} />
          {topper.subject}
          {subDoc?.code && <span className="ml-1 font-mono text-gray-400">{subDoc.code}</span>}
        </span>
        {typeMeta && (
          <span className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: typeMeta.bg, color: typeMeta.color }}>
            {subDoc.type}
          </span>
        )}
        <span className="px-2 py-1 bg-white rounded-lg text-xs font-semibold text-gray-600 border border-gray-100 flex items-center gap-1">
          <Star size={11} /> {topper.exam}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Marks</p>
          <p className="text-lg font-extrabold text-gray-900">
            {topper.score}<span className="text-xs text-gray-400 font-normal">/{topper.totalMarks}</span>
          </p>
        </div>
        <PercentBadge score={topper.score} total={topper.totalMarks} />
      </div>

      <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: cfg.border + '80' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: cfg.color }} />
      </div>

      {topper.remarks && (
        <p className="mt-3 text-xs text-gray-500 italic">"{topper.remarks}"</p>
      )}

      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isAuto ? (
          <>
            <button onClick={() => onEdit(topper)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-50 transition">
              <Pencil size={12} /> Edit
            </button>
            <button onClick={() => onDelete(topper.id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition">
              <Trash2 size={12} /> Delete
            </button>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic flex items-center gap-1">
            <Sparkles size={11} /> Auto-derived
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Manual Entry Modal ───────────────────────────────────────────────────────
const TopperModal = ({ form, setForm, onSave, onClose, isEdit, classes, subjectDocs, exams }) => {
  const [errors, setErrors] = useState({});

  // Group subject docs by type for optgroup
  const subjectsByType = useMemo(() => {
    const groups = {};
    subjectDocs.forEach((s) => {
      if (!groups[s.type]) groups[s.type] = [];
      groups[s.type].push(s);
    });
    return groups;
  }, [subjectDocs]);

  // When subject changes, auto-fill totalMarks from Subject.maxMarks
  const handleSubjectChange = (subjectName) => {
    const doc = subjectDocs.find((s) => s.name === subjectName);
    setForm((f) => ({
      ...f,
      subject: subjectName,
      totalMarks: doc?.maxMarks ?? f.totalMarks,
    }));
    setErrors((e) => ({ ...e, subject: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.studentName.trim()) e.studentName = 'Name is required';
    if (!form.rollNo.trim())      e.rollNo      = 'Roll No is required';
    if (!form.class)              e.class       = 'Select a class';
    if (!form.subject)            e.subject     = 'Select a subject';
    if (!form.exam)               e.exam        = 'Select an exam';
    if (form.score === '' || isNaN(+form.score)) e.score = 'Enter valid score';
    else if (+form.score > +form.totalMarks)     e.score = 'Score exceeds total';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave();
  };

  const inputCls = (key) =>
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
      errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
    }`;

  // Currently selected subject doc
  const selectedDoc  = subjectDocs.find((s) => s.name === form.subject);
  const selectedMeta = selectedDoc ? TYPE_META[selectedDoc.type] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Trophy size={20} />
            <h2 className="text-base font-bold">{isEdit ? 'Edit Entry' : 'Add Manual Topper'}</h2>
          </div>
          <button onClick={onClose} className="text-white opacity-70 hover:opacity-100 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">

          {/* Name + Roll */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Student Name *</label>
              <input value={form.studentName} placeholder="e.g. Aarav Kumar"
                onChange={(e) => { setForm({ ...form, studentName: e.target.value }); setErrors({ ...errors, studentName: '' }); }}
                className={inputCls('studentName')} />
              {errors.studentName && <p className="text-xs text-red-500 mt-1">{errors.studentName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Roll No *</label>
              <input value={form.rollNo} placeholder="e.g. GR10A-01"
                onChange={(e) => { setForm({ ...form, rollNo: e.target.value }); setErrors({ ...errors, rollNo: '' }); }}
                className={inputCls('rollNo')} />
              {errors.rollNo && <p className="text-xs text-red-500 mt-1">{errors.rollNo}</p>}
            </div>
          </div>

          {/* Class + Subject */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Class *</label>
              <select value={form.class}
                onChange={(e) => { setForm({ ...form, class: e.target.value }); setErrors({ ...errors, class: '' }); }}
                className={inputCls('class')}>
                <option value="">-- Select --</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.class && <p className="text-xs text-red-500 mt-1">{errors.class}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
              <select value={form.subject} onChange={(e) => handleSubjectChange(e.target.value)}
                className={inputCls('subject')}>
                <option value="">-- Select --</option>
                {/* Grouped by subject type from Subject model */}
                {Object.entries(subjectsByType).map(([type, subs]) => (
                  <optgroup key={type} label={type}>
                    {subs.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>
          </div>

          {/* Subject meta info (auto-shown after selection) */}
          {selectedDoc && selectedMeta && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: selectedMeta.bg, color: selectedMeta.color }}>
              <Tag size={12} />
              <span>
                <strong>{selectedDoc.type}</strong> · Code: <strong>{selectedDoc.code}</strong>
                {' '}· Max: <strong>{selectedDoc.maxMarks}</strong>
                {' '}· Pass: <strong>{selectedDoc.passMarks}</strong>
              </span>
            </div>
          )}

          {/* Exam + Rank */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Exam *</label>
              <select value={form.exam}
                onChange={(e) => { setForm({ ...form, exam: e.target.value }); setErrors({ ...errors, exam: '' }); }}
                className={inputCls('exam')}>
                <option value="">-- Select --</option>
                {exams.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              {errors.exam && <p className="text-xs text-red-500 mt-1">{errors.exam}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rank</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, rank: r })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition ${
                      form.rank === r
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300'
                    }`}>
                    {RANK_CONFIG[r].icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Score + Total */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Marks Obtained *</label>
              <input type="number" value={form.score} placeholder="95"
                onChange={(e) => { setForm({ ...form, score: e.target.value }); setErrors({ ...errors, score: '' }); }}
                className={inputCls('score')} />
              {errors.score && <p className="text-xs text-red-500 mt-1">{errors.score}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Total Marks</label>
              <input type="number" value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
            <textarea value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Special remarks…" rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 flex items-center gap-2 transition shadow">
            <Save size={15} />
            {isEdit ? 'Update' : 'Save Topper'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const Reports = () => {
  const { authFetch, loading: authLoading } = useAuth();

  // ── Data ───────────────────────────────────────────────────────────────────
  const [rawClasses,     setRawClasses]     = useState([]);
  const [subjectDocs,    setSubjectDocs]    = useState([]); // full Subject docs from /subjects
  const [allMarksData,   setAllMarksData]   = useState([]);
  const [manualToppers,  setManualToppers]  = useState([]);
  const [availableExams, setAvailableExams] = useState([]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [loading,   setLoading]   = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error,     setError]     = useState(null);
  const [toastMsg,  setToastMsg]  = useState(null);
  const [toastType, setToastType] = useState('success');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filterClass, setFilterClass] = useState('');
  const [filterSub,   setFilterSub]   = useState('');
  const [filterExam,  setFilterExam]  = useState('');
  const [filterType,  setFilterType]  = useState('All'); // Subject TYPE tab
  const [search,      setSearch]      = useState('');
  const [viewMode,    setViewMode]    = useState('cards');

  const showToast = useCallback((msg, type = 'success') => {
    setToastMsg(msg); setToastType(type);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // ── subjectMap: name → Subject doc ────────────────────────────────────────
  const subjectMap = useMemo(() => {
    const m = {};
    subjectDocs.forEach((s) => { m[s.name] = s; });
    return m;
  }, [subjectDocs]);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get('/classes').catch(() => ({ data: [] })),
      // Fetch full Subject documents (type, code, maxMarks, passMarks)
      api.get('/subjects', { params: { limit: 200 } }).catch(() => ({ data: { subjects: [] } })),
    ]).then(async ([classRes, subjectRes]) => {
      const classList = (classRes.data?.classes ?? classRes.data ?? [])
        .filter((c) => c.isActive && !c.isArchived);
      setRawClasses(classList);

      const subjects = subjectRes.data?.subjects ?? [];
      setSubjectDocs(subjects);

      if (!classList.length) { setLoading(false); return; }

      const allEntries = [];
      const examSet    = new Set();

      await Promise.all(classList.map(async (cls) => {
        const classSection = `${cls.name}-${cls.section}`;
        try {
          const [examRes, stuRes, statusRes] = await Promise.all([
            getExamTypes(authFetch, classSection).catch(() => ({ data: [] })),
            getStudentsByClass(authFetch, classSection).catch(() => ({ data: [] })),
            getClassExamStatus(authFetch, classSection).catch(() => ({ data: {} })),
          ]);

          const exams    = examRes.data   || [];
          const students = stuRes.data    || [];
          const status   = statusRes.data || {};

          const studentMap = {};
          students.forEach((s) => { studentMap[s._id] = s; });
          exams.forEach((ex) => { examSet.add(ex.name); });

          const relevantExams = exams.filter((ex) =>
            status[ex.name]?.published ||
            (status[ex.name]?.submittedSubjects?.length > 0)
          );

          await Promise.all(relevantExams.map(async (ex) => {
            try {
              const marksRes = await getClassMarks(authFetch, classSection, ex.name);
              Object.entries(marksRes.data || {}).forEach(([subject, sheet]) => {
                allEntries.push({
                  classSection,
                  className: `${cls.name}-${cls.section}`,
                  examName:  ex.name,
                  subject,
                  marks:     sheet.marks    || {},
                  maxMarks:  sheet.maxMarks || ex.max || 100,
                  students:  studentMap,
                });
              });
            } catch (_) {}
          }));
        } catch (_) {}
      }));

      setAllMarksData(allEntries);
      setAvailableExams([...examSet]);
    })
    .catch(() => setError('Could not load data. Check your connection.'))
    .finally(() => setLoading(false));
  }, [authLoading, authFetch, refreshKey]);

  // ── Auto-derive top 3 per class × exam × subject ──────────────────────────
  const autoToppers = useMemo(() => {
    const result = [];
    allMarksData.forEach(({ className, examName, subject, marks, maxMarks, students }) => {
      const scored = Object.entries(marks)
        .filter(([, v]) => v != null && v !== '')
        .map(([id, score]) => ({ id, score: Number(score), student: students[id] }))
        .filter((e) => e.student)
        .sort((a, b) => b.score - a.score);

      scored.slice(0, 3).forEach((entry, idx) => {
        result.push({
          id:          `auto-${className}-${examName}-${subject}-${entry.id}`,
          _auto:       true,
          studentName: entry.student.name,
          rollNo:      entry.student.rollNumber || '—',
          class:       className,
          subject,
          score:       entry.score,
          totalMarks:  maxMarks,
          rank:        idx + 1,
          exam:        examName,
          remarks:     '',
        });
      });
    });
    return result;
  }, [allMarksData]);

  const allToppers = useMemo(() => [...autoToppers, ...manualToppers], [autoToppers, manualToppers]);

  // ── Derived filter options ─────────────────────────────────────────────────
  const classOptions = useMemo(() =>
    rawClasses.map((c) => `${c.name}-${c.section}`), [rawClasses]);

  const availableSubjectNames = useMemo(() =>
    [...new Set(allToppers.map((t) => t.subject))].sort(), [allToppers]);

  // ── Filtered results ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allToppers
      .filter((t) => {
        if (filterClass && t.class   !== filterClass) return false;
        if (filterSub   && t.subject !== filterSub)   return false;
        if (filterExam  && t.exam    !== filterExam)  return false;
        if (q && !t.studentName.toLowerCase().includes(q) && !t.rollNo.toLowerCase().includes(q)) return false;
        // Subject TYPE filter — match against Subject doc
        if (filterType !== 'All') {
          const doc = subjectMap[t.subject];
          if (!doc || doc.type !== filterType) return false;
        }
        return true;
      })
      .sort((a, b) => a.rank - b.rank);
  }, [allToppers, filterClass, filterSub, filterExam, filterType, search, subjectMap]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    goldCount:      allToppers.filter((t) => t.rank === 1).length,
    uniqueClasses:  new Set(allToppers.map((t) => t.class)).size,
    uniqueSubjects: new Set(allToppers.map((t) => t.subject)).size,
    uniqueExams:    new Set(allToppers.map((t) => t.exam)).size,
  }), [allToppers]);

  // Count per subject type (for tab badges)
  const typeCountMap = useMemo(() => {
    const m = { All: allToppers.length };
    allToppers.forEach((t) => {
      const type = subjectMap[t.subject]?.type;
      if (type) m[type] = (m[type] || 0) + 1;
    });
    return m;
  }, [allToppers, subjectMap]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const openAdd  = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (t) => { if (t._auto) return; setForm({ ...t }); setEditingId(t.id); setShowModal(true); };

  const handleSave = () => {
    if (editingId) {
      setManualToppers((p) => p.map((t) => t.id === editingId ? { ...form, id: editingId } : t));
      showToast('Entry updated!');
    } else {
      setManualToppers((p) => [...p, {
        ...form, id: `manual-${Date.now()}`,
        score: +form.score, totalMarks: +form.totalMarks,
      }]);
      showToast('Topper added!');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this topper entry?')) return;
    setManualToppers((p) => p.filter((t) => t.id !== id));
    showToast('Entry removed.');
  };

  const clearFilters = () => {
    setFilterClass(''); setFilterSub(''); setFilterExam('');
    setFilterType('All'); setSearch('');
  };
  const hasFilter = filterClass || filterSub || filterExam || search || filterType !== 'All';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .fade-in{animation:fadeIn .25s ease}
      `}</style>

      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
              <Trophy className="text-amber-500" size={24} />
              Topper Reports
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              Auto-derived from result sheets · {autoToppers.length} live · {manualToppers.length} manual
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow hover:opacity-90 transition">
              <Plus size={16} /> Add Manual
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={13} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner size={32} color="#6366f1" />
            <p className="text-sm text-gray-400 font-medium">Loading results from all classes…</p>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Trophy}    label="Gold Medals"     value={stats.goldCount}      accent="#b45309" />
              <StatCard icon={Users}     label="Classes Covered" value={stats.uniqueClasses}  accent="#0891b2" />
              <StatCard icon={BookOpen}  label="Subjects"        value={stats.uniqueSubjects} accent="#7c3aed" />
              <StatCard icon={BarChart3} label="Exams Tracked"   value={stats.uniqueExams}    accent="#15803d" />
            </div>

            {/* Info / warning banners */}
            {autoToppers.length > 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">
                <Sparkles size={14} className="flex-shrink-0 text-indigo-500" />
                <span>
                  <strong>{autoToppers.length}</strong> toppers auto-derived from{' '}
                  <strong>{allMarksData.length}</strong> mark sheets · top 3 per class × exam × subject.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle size={14} className="flex-shrink-0" />
                No submitted or published mark sheets found. Teachers must submit marks first.
              </div>
            )}

            {/* ── Subject Type Filter Tabs ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers size={12} /> Filter by Subject Type
              </p>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_TYPES.map((type) => {
                  const isActive = filterType === type;
                  const meta     = TYPE_META[type];
                  const count    = typeCountMap[type] || 0;

                  return (
                    <button key={type} onClick={() => setFilterType(type)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition ${
                        isActive ? 'text-white border-transparent shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                      style={isActive ? {
                        background:  meta?.color ?? '#6366f1',
                        borderColor: meta?.color ?? '#6366f1',
                      } : {}}>
                      {type}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-white bg-opacity-25' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Search + Dropdown Filters ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center shadow-sm">
              <Filter size={15} className="text-gray-400 flex-shrink-0" />

              <div className="relative flex-1 min-w-[160px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>

              {/* Class */}
              <div className="relative">
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                  className="pl-3 pr-7 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
                  <option value="">All Classes</option>
                  {classOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Subject — grouped by type */}
              <div className="relative">
                <select value={filterSub} onChange={(e) => setFilterSub(e.target.value)}
                  className="pl-3 pr-7 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
                  <option value="">All Subjects</option>
                  {Object.entries(
                    availableSubjectNames.reduce((acc, name) => {
                      const type = subjectMap[name]?.type || 'Other';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(name);
                      return acc;
                    }, {})
                  ).map(([type, names]) => (
                    <optgroup key={type} label={type}>
                      {names.map((n) => <option key={n} value={n}>{n}</option>)}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Exam */}
              <div className="relative">
                <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)}
                  className="pl-3 pr-7 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
                  <option value="">All Exams</option>
                  {availableExams.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {hasFilter && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold">
                  <X size={12} /> Clear all
                </button>
              )}

              <div className="ml-auto flex gap-1 bg-gray-100 p-1 rounded-lg">
                {['cards', 'table'].map((v) => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                      viewMode === v ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {v === 'cards' ? 'Cards' : 'Table'}
                  </button>
                ))}
              </div>
            </div>

            {/* Result count row */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span>
                Showing <strong className="text-gray-600">{filtered.length}</strong> toppers
                {hasFilter && ` (of ${allToppers.length})`}
              </span>
              {filterType !== 'All' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: TYPE_META[filterType]?.bg, color: TYPE_META[filterType]?.color }}>
                  {filterType}
                </span>
              )}
            </div>

            {/* ── Content ── */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Award size={48} className="text-gray-200 mb-4" />
                <p className="text-base font-bold text-gray-400">No toppers found</p>
                <p className="text-sm mt-1 text-gray-300">
                  {filterType !== 'All'
                    ? `No ${filterType} subject toppers in current results`
                    : 'Adjust filters or ensure mark sheets are submitted'}
                </p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-in">
                {filtered.map((t) => (
                  <TopperCard key={t.id} topper={t} subjectMap={subjectMap}
                    onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-max">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Rank','Student','Roll','Class','Subject','Type','Code','Exam','Score','%','Source','Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => {
                        const cfg = RANK_CONFIG[t.rank] || RANK_CONFIG[1];
                        const doc = subjectMap[t.subject];
                        return (
                          <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-lg">{cfg.icon}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{t.studentName}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{t.rollNo}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{t.class}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{t.subject}</td>
                            <td className="px-4 py-3">
                              {doc ? <SubjectTypePill type={doc.type} /> : <span className="text-gray-300 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {doc?.code || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{t.exam}</td>
                            <td className="px-4 py-3 font-black text-gray-900">
                              {t.score}<span className="text-gray-400 font-normal">/{t.totalMarks}</span>
                            </td>
                            <td className="px-4 py-3"><PercentBadge score={t.score} total={t.totalMarks} /></td>
                            <td className="px-4 py-3">
                              {t._auto
                                ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded flex items-center gap-1 w-fit">
                                    <Sparkles size={9} /> Live
                                  </span>
                                : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold rounded">Manual</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              {!t._auto && (
                                <div className="flex gap-1">
                                  <button onClick={() => openEdit(t)} className="p-1.5 rounded text-indigo-500 hover:bg-indigo-50"><Pencil size={13} /></button>
                                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded text-red-400 hover:bg-red-50"><Trash2 size={13} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                  {filtered.length} of {allToppers.length} entries · {autoToppers.length} live · {manualToppers.length} manual
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <TopperModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          isEdit={!!editingId}
          classes={classOptions}
          subjectDocs={subjectDocs}
          exams={availableExams}
        />
      )}

      <Toast msg={toastMsg} type={toastType} />
    </div>
  );
};

export default Reports;