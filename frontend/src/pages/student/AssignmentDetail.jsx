// src/pages/student/assignments/AssignmentDetail.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Clock, Calendar, Award, User, BookOpen, FileText,
  Upload, Send, Save, CheckCircle, AlertTriangle, AlertCircle,
  Loader2, Trash2, Link as LinkIcon, AlignLeft, Edit3, RefreshCw,
  Tag, Target, BarChart2, Download, ExternalLink, Layers, Info,
  ChevronRight, Star, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../services/assignment';
import { getDaysRemaining, getDifficultyColor } from '../../shared/assignmentSchema';

// ── Normalise raw API → unified shape ──────────────────────────────────────────
const normalize = (raw) => ({
  id:                  raw._id ?? raw.id,
  title:               raw.title        ?? 'Untitled',
  subject:             raw.subject      ?? '',
  class:               raw.grade        ?? raw.class ?? '',
  sections:            Array.isArray(raw.sections)
                         ? raw.sections
                         : raw.section ? [raw.section] : [],
  teacher:             raw.teacherName  ?? 'Teacher',
  description:         raw.description  ?? '',
  instructions:        raw.instructions ?? '',
  dueDate:             raw.dueDate
                         ? new Date(raw.dueDate).toISOString().split('T')[0]
                         : '',
  dueDateTime:         raw.dueDate ? new Date(raw.dueDate) : null,
  points:              raw.maxMarks     ?? raw.points      ?? 100,
  passingMarks:        raw.passingMarks ?? 40,
  assignmentType:      raw.assignmentType      ?? 'homework',
  submissionType:      raw.submissionType      ?? 'file',
  allowLateSubmission: raw.allowLateSubmission ?? false,
  latePenalty:         raw.latePenalty  ?? 10,
  priority:            raw.priority     ?? 'normal',
  difficulty:          raw.difficulty   ?? 'medium',
  estimatedTime:       raw.estimatedTime ?? 60,
  tags:                raw.tags         ?? [],
  attachments:         raw.attachments  ?? [],
  resources:           raw.resources    ?? [],
  rubric:              raw.rubric       ?? [],
  learningObjectives:  raw.learningObjectives ?? [],
  maxFiles:            raw.maxFiles     ?? 5,
  maxFileSize:         raw.maxFileSize  ?? 10,
  allowedExtensions:   raw.allowedExtensions
                         ?? ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
  // FIX: store mySubmission as-is; we determine submitted status explicitly below
  mySubmission:        raw.mySubmission ?? null,
});

// ── Tiny helpers ───────────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  normal: 'bg-slate-100 text-slate-600',
  low:    'bg-green-100 text-green-700',
};

const TYPE_ICONS = {
  homework:     '📝',
  project:      '🎯',
  quiz:         '📋',
  lab:          '🔬',
  presentation: '📊',
  essay:        '✍️',
  other:        '📌',
};

const SUBMITTED_STATUSES = ['submitted', 'graded', 'returned'];

const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
    {children}
  </span>
);

const InfoRow = ({ label, value, valueClass = 'text-slate-700 font-semibold' }) => (
  <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-400">{label}</span>
    <span className={`text-xs text-right ${valueClass}`}>{value}</span>
  </div>
);

// ── Confirm submit modal ────────────────────────────────────────────────────────
function ConfirmModal({ open, onConfirm, onCancel, isLate, latePenalty }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Send className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Submit Assignment?</h3>
        <p className="text-sm text-slate-500 text-center mb-4 leading-relaxed">
          Once submitted you cannot edit your response. Make sure everything is ready.
        </p>
        {isLate && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700 font-medium">
              This is a late submission. A {latePenalty}% penalty per day will be applied.
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all">
            Submit Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab definitions ─────────────────────────────────────────────────────────────
const TABS = [
  { key: 'details',   label: 'Details',   icon: Info      },
  { key: 'submit',    label: 'Submit',    icon: Send      },
  { key: 'rubric',    label: 'Rubric',    icon: BarChart2 },
  { key: 'resources', label: 'Resources', icon: Layers    },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AssignmentDetail() {
  const { id }             = useParams();
  const navigate           = useNavigate();
  // FIX: read ?tab=submit so Submit button from list lands on the submit tab
  const [searchParams]     = useSearchParams();
  const initialTab         = searchParams.get('tab') ?? 'details';

  // ── state ────────────────────────────────────────────────────────────────────
  const [assignment,  setAssignment]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState(initialTab);

  // form
  const [files,        setFiles]        = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [textAnswer,   setTextAnswer]   = useState('');
  const [linkAnswer,   setLinkAnswer]   = useState('');
  const [noteToTeacher,setNoteToTeacher]= useState('');

  // actions
  const [submitting,  setSubmitting]  = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved,  setDraftSaved]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileInputRef = useRef(null);

  // ── load ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) { navigate('/student/assignments/pending'); return; }
    setLoading(true); setError(null);
    try {
      // Fetch assignment + existing submission in parallel
      const [aRes, sRes] = await Promise.all([
        studentAPI.getAssignment(id),
        studentAPI.getMySubmission(id).catch(() => null),
      ]);

      const raw = aRes.data?.data?.data ?? aRes.data?.data ?? aRes.data;
      // FIX: getMySubmission returns null body for "no submission" — handle that
      const sub = (() => {
        const d = sRes?.data?.data?.data ?? sRes?.data?.data ?? sRes?.data ?? null;
        // If it's an empty object or has no _id/status, treat as null
        if (!d || (!d._id && !d.status)) return null;
        return d;
      })();

      if (!raw) throw new Error('Assignment data missing in response');

      const a = normalize({ ...raw, mySubmission: sub });
      setAssignment(a);

      // Pre-fill form ONLY if there's a real draft (never for submitted/graded)
      if (sub?.status === 'draft') {
        setTextAnswer(sub.textContent ?? '');
        setLinkAnswer(sub.linkUrl     ?? '');
        setNoteToTeacher(sub.comments ?? '');
      }
    } catch (err) {
      console.error('[AssignmentDetail] load error:', err);
      setError(err.response?.data?.message ?? err.message ?? 'Could not load assignment.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  // FIX: sync tab if URL param changes after mount (e.g. navigating Submit → View)
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  // ── file handling ─────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!assignment || !incoming.length) return;

    if (files.length + incoming.length > assignment.maxFiles) {
      toast.error(`Maximum ${assignment.maxFiles} files allowed`);
      e.target.value = '';
      return;
    }

    incoming.forEach(file => {
      if (file.size / 1024 / 1024 > assignment.maxFileSize) {
        toast.error(`"${file.name}" exceeds the ${assignment.maxFileSize} MB limit`);
        return;
      }
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (
        assignment.allowedExtensions.length > 0 &&
        !assignment.allowedExtensions.includes(ext)
      ) {
        toast.error(`"${ext}" files are not allowed`);
        return;
      }

      const fileId = `${Date.now()}-${Math.random()}`;
      setFileProgress(p => ({ ...p, [fileId]: 0 }));

      let pct = 0;
      const iv = setInterval(() => {
        pct = Math.min(pct + 25, 100);
        setFileProgress(p => ({ ...p, [fileId]: pct }));
        if (pct >= 100) {
          clearInterval(iv);
          setTimeout(() => {
            setFileProgress(p => { const n = { ...p }; delete n[fileId]; return n; });
            setFiles(prev => [...prev, {
              id:   fileId,
              file,
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: file.type,
            }]);
          }, 300);
        }
      }, 80);
    });

    e.target.value = '';
  };

  const removeFile = (fileId) =>
    setFiles(prev => prev.filter(f => f.id !== fileId));

  // ── save draft ────────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await studentAPI.saveDraft(id, {
        textContent: textAnswer,
        linkUrl:     linkAnswer,
        comments:    noteToTeacher,
      });
      setDraftSaved(true);
      toast.success('Draft saved!');
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // ── validate ──────────────────────────────────────────────────────────────────
  const validate = () => {
    const a = assignment;
    const hasFiles = files.length > 0;
    const hasText  = textAnswer.trim().length > 0;
    const hasLink  = linkAnswer.trim().length > 0;

    if (!hasFiles && !hasText && !hasLink) {
      toast.error('Please provide a file, text response, or link.');
      return false;
    }
    if (a.submissionType === 'file' && !hasFiles) {
      toast.error('This assignment requires at least one file upload.');
      return false;
    }
    if (a.submissionType === 'text' && !hasText) {
      toast.error('This assignment requires a written answer.');
      return false;
    }
    if (a.submissionType === 'link' && !hasLink) {
      toast.error('This assignment requires a link/URL submission.');
      return false;
    }
    return true;
  };

  // ── submit ────────────────────────────────────────────────────────────────────
  const handleSubmitClick = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const doSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f.file));
      form.append('textContent', textAnswer);
      form.append('linkUrl',     linkAnswer);
      form.append('comments',    noteToTeacher);

      const res = await studentAPI.submit(id, form);
      const saved = res.data?.data?.data ?? res.data?.data ?? res.data;

      toast.success('Assignment submitted! 🎉');

      setAssignment(prev => ({
        ...prev,
        mySubmission: saved ?? { status: 'submitted', submittedAt: new Date().toISOString() },
      }));
      setActiveTab('details');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Submission failed. Please try again.';
      toast.error(msg);
      console.error('[AssignmentDetail] submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── loading / error screens ───────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading assignment…</p>
      </div>
    </div>
  );

  if (error || !assignment) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-slate-600 font-semibold">{error ?? 'Assignment not found'}</p>
      <div className="flex gap-3">
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
        <button onClick={() => navigate('/student/assignments/pending')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
          Back to Assignments
        </button>
      </div>
    </div>
  );

  // ── derived values ────────────────────────────────────────────────────────────
  const a                = assignment;
  const sub              = a.mySubmission;
  const daysLeft         = getDaysRemaining(a.dueDate);
  const overdue          = daysLeft < 0;
  // FIX: only treat as submitted if status is one of the submitted statuses
  const alreadySubmitted = sub && SUBMITTED_STATUSES.includes(sub.status);
  const isGraded         = sub?.status === 'graded';
  const isDraft          = sub?.status === 'draft';
  const showFileSection  = ['file', 'both'].includes(a.submissionType);
  const showTextSection  = ['text', 'both'].includes(a.submissionType);
  const showLinkSection  = ['link', 'both'].includes(a.submissionType);
  const canSubmit        = !alreadySubmitted && (!overdue || a.allowLateSubmission);

  const urgencyText = overdue
    ? `${Math.abs(daysLeft)}d overdue`
    : daysLeft === 0
    ? 'Due today!'
    : `${daysLeft}d left`;

  const urgencyClass = overdue
    ? 'text-red-600'
    : daysLeft <= 2
    ? 'text-orange-500'
    : 'text-green-600';

  const accentGradient = alreadySubmitted
    ? 'from-emerald-500 to-green-600'
    : overdue
    ? 'from-red-500 to-rose-600'
    : 'from-indigo-500 to-violet-600';

  const visibleTabs = TABS.filter(t => {
    if (t.key === 'rubric')    return a.rubric?.length > 0;
    if (t.key === 'resources') return a.attachments?.length > 0 || a.resources?.length > 0;
    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto pb-14 space-y-5">
      <ConfirmModal
        open={showConfirm}
        onConfirm={doSubmit}
        onCancel={() => setShowConfirm(false)}
        isLate={overdue && a.allowLateSubmission}
        latePenalty={a.latePenalty}
      />

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <div className="pt-4">
        <button
          onClick={() => navigate('/student/assignments/pending')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Assignments
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO CARD                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={`h-1.5 bg-gradient-to-r ${accentGradient}`} />

        <div className="p-6">

          {/* ── Status banners ──────────────────────────────────────────── */}
          {isGraded && (
            <div className="flex items-center justify-between gap-4 p-4 mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-emerald-600 fill-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Graded</p>
                  <p className="text-xs text-emerald-600">
                    {sub.gradedAt
                      ? new Date(sub.gradedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Reviewed by teacher'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-extrabold text-emerald-700 leading-none">
                  {sub.marks ?? sub.score ?? '—'}
                  <span className="text-base font-normal text-emerald-500"> / {a.points}</span>
                </p>
              </div>
            </div>
          )}

          {alreadySubmitted && !isGraded && (
            <div className="flex items-center gap-3 p-3 mb-5 bg-blue-50 border border-blue-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-800">Submitted — awaiting grading</p>
                {sub?.submittedAt && (
                  <p className="text-xs text-blue-600">
                    Submitted on {new Date(sub.submittedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          {isDraft && !alreadySubmitted && (
            <div className="flex items-center gap-3 p-3 mb-5 bg-amber-50 border border-amber-200 rounded-xl">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-700">
                Draft saved — complete and submit before the deadline
              </p>
            </div>
          )}

          {overdue && !alreadySubmitted && !a.allowLateSubmission && (
            <div className="flex items-center gap-3 p-3 mb-5 bg-red-50 border border-red-200 rounded-xl">
              <Lock className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-sm font-semibold text-red-700">
                Submission closed — {Math.abs(daysLeft)}d overdue and late submissions are not allowed.
              </p>
            </div>
          )}

          {/* ── Title row ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Pill className="bg-indigo-100 text-indigo-700">{a.subject}</Pill>
            <Pill className="bg-slate-100 text-slate-600 capitalize">
              {TYPE_ICONS[a.assignmentType] ?? '📌'} {a.assignmentType}
            </Pill>
            <Pill className={getDifficultyColor(a.difficulty)}>
              {a.difficulty.charAt(0).toUpperCase() + a.difficulty.slice(1)}
            </Pill>
            <Pill className={PRIORITY_STYLES[a.priority] ?? 'bg-slate-100 text-slate-600'}>
              {a.priority.charAt(0).toUpperCase() + a.priority.slice(1)} priority
            </Pill>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-3 leading-tight">{a.title}</h1>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500 mb-5">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {a.teacher}
            </span>
            {(a.class || a.sections.length > 0) && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {a.class}{a.sections.length > 0 ? ` · Sec ${a.sections.join(', ')}` : ''}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Due {a.dueDateTime
                ? a.dueDateTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : a.dueDate}
              {a.dueDateTime
                ? ` · ${a.dueDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </span>
          </div>

          {/* ── Stat strip ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {!alreadySubmitted && (
              <div>
                <p className={`text-xl font-extrabold ${urgencyClass}`}>{urgencyText}</p>
                <p className="text-xs text-slate-400">remaining</p>
              </div>
            )}
            <div>
              <p className="text-xl font-extrabold text-slate-800">{a.points}</p>
              <p className="text-xs text-slate-400">points</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{a.estimatedTime}m</p>
              <p className="text-xs text-slate-400">est. time</p>
            </div>
            {a.passingMarks > 0 && (
              <div>
                <p className="text-xl font-extrabold text-slate-800">{a.passingMarks}</p>
                <p className="text-xs text-slate-400">to pass</p>
              </div>
            )}
            {canSubmit && (
              <button
                onClick={() => setActiveTab('submit')}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200"
              >
                <Send className="w-4 h-4" />
                Submit Assignment
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex border-t border-slate-100 bg-slate-50/60 overflow-x-auto">
          {visibleTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all
                ${activeTab === key
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === 'submit' && canSubmit && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: DETAILS                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <div className="lg:col-span-2 space-y-5">

            {isGraded && sub?.feedback && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                  Teacher Feedback
                </p>
                <p className="text-sm text-emerald-800 leading-relaxed">{sub.feedback}</p>
              </div>
            )}

            {a.description && (
              <Card title="Description" icon={<AlignLeft className="w-4 h-4" />}>
                <p className="text-sm text-slate-600 leading-relaxed">{a.description}</p>
              </Card>
            )}

            {a.instructions && (
              <Card title="Instructions" icon={<FileText className="w-4 h-4" />}>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {a.instructions}
                </p>
              </Card>
            )}

            {a.learningObjectives?.length > 0 && (
              <Card title="Learning Objectives" icon={<Target className="w-4 h-4" />}>
                <ul className="space-y-2.5">
                  {a.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-indigo-600" />
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {a.tags?.length > 0 && (
              <Card title="Tags" icon={<Tag className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-2">
                  {a.tags.map(t => (
                    <Pill key={t} className="bg-indigo-50 text-indigo-600">#{t}</Pill>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            <div className={`rounded-2xl border p-5 shadow-sm
              ${isGraded
                ? 'bg-emerald-50 border-emerald-200'
                : alreadySubmitted
                ? 'bg-blue-50 border-blue-200'
                : isDraft
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-slate-100'}`}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-400">
                Your Status
              </p>
              {isGraded ? (
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-emerald-500 fill-emerald-300" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      Score: {sub.marks ?? sub.score} / {a.points}
                    </p>
                    <p className="text-xs text-emerald-600">Graded</p>
                  </div>
                </div>
              ) : alreadySubmitted ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Submitted</p>
                    <p className="text-xs text-blue-500">Pending review</p>
                  </div>
                </div>
              ) : isDraft ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-amber-700">Draft saved</p>
                    <p className="text-xs text-amber-500">Not yet submitted</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Pending</p>
                    <p className={`text-xs font-semibold ${urgencyClass}`}>{urgencyText}</p>
                  </div>
                </div>
              )}
            </div>

            <Card title="Submission Rules">
              <InfoRow label="Type"          value={a.submissionType} />
              <InfoRow label="Max files"     value={`${a.maxFiles} files`} />
              <InfoRow label="Max file size" value={`${a.maxFileSize} MB each`} />
              <InfoRow label="Allowed types" value={a.allowedExtensions.join(', ')} />
              <InfoRow label="Passing marks" value={`${a.passingMarks} / ${a.points}`} />
              <InfoRow
                label="Late submission"
                value={a.allowLateSubmission ? `Allowed (−${a.latePenalty}%/day)` : 'Not allowed'}
                valueClass={`text-xs font-semibold ${!a.allowLateSubmission ? 'text-red-600' : 'text-slate-700'}`}
              />
            </Card>

            {canSubmit && (
              <button
                onClick={() => setActiveTab('submit')}
                className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Go to Submit
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: SUBMIT                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <div className="lg:col-span-2 space-y-5">

            {/* ── Already submitted receipt ─────────────────────────────── */}
            {alreadySubmitted && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
                  ${isGraded ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                  {isGraded
                    ? <Star className="w-8 h-8 text-emerald-600 fill-emerald-300" />
                    : <CheckCircle className="w-8 h-8 text-blue-600" />}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {isGraded ? 'Graded!' : 'Submitted!'}
                </h3>
                {isGraded
                  ? <p className="text-slate-500 text-sm mb-3">
                      Score: <span className="font-bold text-emerald-600 text-base">
                        {sub.marks ?? sub.score}
                      </span> / {a.points}
                    </p>
                  : <p className="text-slate-500 text-sm mb-3">
                      Your submission is awaiting review.
                    </p>
                }
                {sub?.submittedAt && (
                  <p className="text-xs text-slate-400">
                    Submitted {new Date(sub.submittedAt).toLocaleString('en-IN')}
                  </p>
                )}
                {sub?.feedback && (
                  <div className="mt-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-left">
                    <p className="text-xs font-bold text-emerald-600 mb-1.5">Teacher Feedback</p>
                    <p className="text-sm text-emerald-800 leading-relaxed">{sub.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Closed / overdue notice ───────────────────────────────── */}
            {!alreadySubmitted && overdue && !a.allowLateSubmission && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
                <Lock className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-red-700 mb-1">Submission Closed</h3>
                <p className="text-sm text-red-500">
                  This assignment is {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} overdue
                  and late submissions are not allowed.
                </p>
              </div>
            )}

            {/* ── Submission form — only shown when canSubmit ───────────── */}
            {!alreadySubmitted && canSubmit && (
              <>
                {/* File upload */}
                {showFileSection && (
                  <Card
                    title={a.submissionType === 'file' ? 'Upload Files *' : 'Upload Files'}
                    icon={<Upload className="w-4 h-4" />}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center
                        hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group mb-4"
                    >
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                        <Upload className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        Click to browse or drag & drop
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.allowedExtensions.join(', ')} · Max {a.maxFileSize} MB each
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {files.length} / {a.maxFiles} files selected
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={a.allowedExtensions.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {Object.entries(fileProgress).map(([fid, pct]) => (
                      <div key={fid} className="mb-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex justify-between text-xs font-semibold text-blue-800 mb-1.5">
                          <span>Processing…</span><span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-150"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    {files.map(f => (
                      <div key={f.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-2">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{f.name}</p>
                          <p className="text-xs text-slate-400">{f.size}</p>
                        </div>
                        <button
                          onClick={() => removeFile(f.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </Card>
                )}

                {/* Text answer */}
                {showTextSection && (
                  <Card
                    title={a.submissionType === 'text' ? 'Written Answer *' : 'Written Answer'}
                    icon={<AlignLeft className="w-4 h-4" />}
                  >
                    <textarea
                      value={textAnswer}
                      onChange={e => setTextAnswer(e.target.value)}
                      placeholder="Type your answer here…"
                      rows={10}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-y
                        focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50
                        placeholder:text-slate-300 transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 text-right">
                      {textAnswer.length} characters
                    </p>
                  </Card>
                )}

                {/* Link answer */}
                {showLinkSection && (
                  <Card
                    title={a.submissionType === 'link' ? 'Link / URL *' : 'Link / URL'}
                    icon={<LinkIcon className="w-4 h-4" />}
                  >
                    <input
                      type="url"
                      value={linkAnswer}
                      onChange={e => setLinkAnswer(e.target.value)}
                      placeholder="https://docs.google.com/…"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                        focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50
                        placeholder:text-slate-300 transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                      Share a Google Doc, OneDrive file, GitHub repo, etc.
                    </p>
                  </Card>
                )}

                {/* Note to teacher */}
                <Card title="Note to Teacher" icon={<Edit3 className="w-4 h-4" />}>
                  <p className="text-xs text-slate-400 mb-2">Optional</p>
                  <textarea
                    value={noteToTeacher}
                    onChange={e => setNoteToTeacher(e.target.value)}
                    placeholder="Any context, questions, or notes for your teacher…"
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-y
                      focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50
                      placeholder:text-slate-300 transition-all"
                  />
                </Card>

                {/* ── Action bar ─────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {savingDraft
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : draftSaved
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <Save className="w-4 h-4" />}
                      {draftSaved ? 'Saved!' : savingDraft ? 'Saving…' : 'Save Draft'}
                    </button>

                    <button
                      onClick={handleSubmitClick}
                      disabled={submitting}
                      className="flex items-center gap-2 px-7 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-indigo-200"
                    >
                      {submitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                        : <><Send className="w-4 h-4" /> Submit Assignment</>}
                    </button>
                  </div>

                  {overdue && a.allowLateSubmission && (
                    <p className="text-xs text-orange-600 mt-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Late submission — {a.latePenalty}% penalty per day will apply.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {(a.description || a.instructions) && (
              <Card title="Brief">
                {a.description && (
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">{a.description}</p>
                )}
                {a.instructions && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 mb-1">Instructions</p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {a.instructions}
                    </p>
                  </div>
                )}
              </Card>
            )}

            <Card title="Submission Rules">
              <InfoRow label="Format"    value={a.submissionType} />
              <InfoRow label="Max files" value={`${a.maxFiles} files`} />
              <InfoRow label="Max size"  value={`${a.maxFileSize} MB each`} />
              <InfoRow label="Types"     value={a.allowedExtensions.join(', ')} />
              <InfoRow
                label="Late sub"
                value={a.allowLateSubmission ? `−${a.latePenalty}%/day` : 'Not allowed'}
                valueClass={`text-xs font-semibold ${!a.allowLateSubmission ? 'text-red-600' : 'text-slate-700'}`}
              />
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: RUBRIC                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rubric' && a.rubric?.length > 0 && (
        <Card title="Grading Rubric" icon={<BarChart2 className="w-4 h-4" />}>
          <div className="space-y-3 mb-4">
            {a.rubric.map((item, i) => {
              const pct = Math.round((item.points / a.points) * 100);
              return (
                <div key={i} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.criteria}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <Pill className="bg-amber-100 text-amber-700 shrink-0">
                      {item.points} pts
                    </Pill>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct}% of total</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-sm font-bold text-indigo-800">Total</p>
            <p className="text-sm font-extrabold text-indigo-700">
              {a.rubric.reduce((s, r) => s + (r.points ?? 0), 0)} / {a.points} pts
            </p>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: RESOURCES                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'resources' && (
        <div className="space-y-5">
          {a.attachments?.length > 0 && (
            <Card title="Teacher Attachments" icon={<Download className="w-4 h-4" />}>
              <div className="space-y-2">
                {a.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{att.name}</p>
                      {att.size && <p className="text-xs text-slate-400">{att.size}</p>}
                    </div>
                    {att.url && att.url !== '#' && (
                      <a href={att.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {a.resources?.length > 0 && (
            <Card title="Reference Links" icon={<ExternalLink className="w-4 h-4" />}>
              <div className="space-y-2">
                {a.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 truncate">{r.title}</p>
                      <p className="text-xs text-slate-400 truncate">{r.url}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {!a.attachments?.length && !a.resources?.length && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No resources attached to this assignment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared card wrapper ────────────────────────────────────────────────────────
function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {title && (
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-50">
          {icon && <span className="text-slate-400">{icon}</span>}
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}