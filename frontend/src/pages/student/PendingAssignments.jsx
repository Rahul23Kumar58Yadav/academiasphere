// src/pages/student/assignments/PendingAssignments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Clock, Calendar, Award, Search,
  AlertCircle, Eye, Send, FileText, User,
  RefreshCw, SortAsc, SortDesc, Grid, List,
  BookOpen, Loader2, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle,
} from 'lucide-react';
import { studentAPI } from '../../services/assignment';
import {
  getDifficultyColor, getDaysRemaining,
} from '../../shared/assignmentSchema';

// ── helpers ────────────────────────────────────────────────────────────────────
const normalizeAssignment = (raw) => ({
  id:           raw._id  ?? raw.id,
  title:        raw.title,
  subject:      raw.subject,
  class:        raw.grade ?? raw.class,
  section:      Array.isArray(raw.sections) ? raw.sections : (raw.section ? [raw.section] : []),
  teacher:      raw.teacherName ?? 'Teacher',
  description:  raw.description   ?? '',
  instructions: raw.instructions  ?? '',
  dueDate:      raw.dueDate ? new Date(raw.dueDate).toISOString().split('T')[0] : '',
  dueTime:      raw.dueDate
    ? new Date(raw.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '23:59',
  points:           raw.maxMarks  ?? raw.points  ?? 100,
  passingMarks:     raw.passingMarks ?? 40,
  assignmentType:   raw.assignmentType   ?? 'homework',
  submissionType:   raw.submissionType   ?? 'file',
  allowLateSubmission: raw.allowLateSubmission ?? false,
  latePenalty:      raw.latePenalty  ?? 10,
  priority:         raw.priority     ?? 'normal',
  difficulty:       raw.difficulty   ?? 'medium',
  estimatedTime:    raw.estimatedTime ?? 60,
  tags:             raw.tags         ?? [],
  attachments:      raw.attachments  ?? [],
  resources:        raw.resources    ?? [],
  rubric:           raw.rubric       ?? [],
  learningObjectives: raw.learningObjectives ?? [],
  maxFiles:         raw.maxFiles     ?? 5,
  maxFileSize:      raw.maxFileSize  ?? 10,
  allowedExtensions: raw.allowedExtensions ?? ['.pdf', '.doc', '.docx', '.png', '.jpg'],
  mySubmission:     raw.mySubmission ?? null,
});

// ── small badges ───────────────────────────────────────────────────────────────
const SubmissionTypeBadge = ({ type }) => {
  const map = {
    file: { label: 'File Upload',  color: 'bg-blue-100 text-blue-700'   },
    text: { label: 'Text Entry',   color: 'bg-purple-100 text-purple-700' },
    link: { label: 'Link/URL',     color: 'bg-green-100 text-green-700' },
    both: { label: 'File + Text',  color: 'bg-indigo-100 text-indigo-700' },
  };
  const { label, color } = map[type] ?? map.file;
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
};

const DifficultyBadge = ({ difficulty = 'medium' }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(difficulty)}`}>
    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
  </span>
);

const SubmissionStatusBadge = ({ submission }) => {
  if (!submission) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
        <AlertTriangle className="w-3 h-3" /> Pending
      </span>
    );
  }
  if (submission.status === 'draft') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
        <FileText className="w-3 h-3" /> Draft saved
      </span>
    );
  }
  if (submission.status === 'graded') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
        <CheckCircle className="w-3 h-3" /> Graded · {submission.marks ?? '—'}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
      <CheckCircle className="w-3 h-3" /> Submitted
    </span>
  );
};

// ── card ───────────────────────────────────────────────────────────────────────
const AssignmentCard = ({ assignment: a }) => {
  const days      = getDaysRemaining(a.dueDate);
  const overdue   = days < 0;
  const daysColor = overdue ? 'text-red-600' : days <= 2 ? 'text-orange-600' : days <= 5 ? 'text-yellow-600' : 'text-green-600';
  // FIX: only treat as submitted if status is submitted or graded (not draft)
  const submitted = a.mySubmission && ['submitted', 'graded', 'returned'].includes(a.mySubmission.status);

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 hover:shadow-md transition-shadow flex flex-col
      ${submitted ? 'border-green-400 opacity-80' : overdue ? 'border-red-500' : 'border-indigo-500'}`}>
      <div className={`p-4 text-white ${submitted ? 'bg-green-600' : overdue ? 'bg-red-600' : 'bg-indigo-600'}`}>
        <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
          <span className="px-2 py-1 bg-white/20 rounded text-xs font-semibold">{a.subject}</span>
          <div className="flex gap-1 flex-wrap">
            <DifficultyBadge difficulty={a.difficulty} />
            <SubmissionTypeBadge type={a.submissionType} />
          </div>
        </div>
        <h3 className="font-bold text-base leading-tight mb-1">{a.title}</h3>
        <p className="text-xs opacity-90">{a.teacher} · {a.class} – {a.section.join(', ')}</p>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Submission status pill */}
        <div className="mb-3">
          <SubmissionStatusBadge submission={a.mySubmission} />
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{a.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Due in</p>
            <p className={`text-sm font-bold ${daysColor}`}>{overdue ? `${Math.abs(days)}d ago` : `${days}d`}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Points</p>
            <p className="text-sm font-bold text-gray-900">{a.points}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Est.</p>
            <p className="text-sm font-bold text-gray-900">{a.estimatedTime}m</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-600">Due: {a.dueDate} · {a.dueTime}</span>
        </div>

        {a.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {a.tags.map(t => (
              <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full">#{t}</span>
            ))}
          </div>
        )}

        {/* FIX: Both View and Submit route to AssignmentDetail (/student/assignments/:id)
            Submit opens the "submit" tab via ?tab=submit query param */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/student/assignments/${a.id}`}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm font-medium flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </Link>
          {!submitted && (
            <Link
              to={`/student/assignments/${a.id}?tab=submit`}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium flex items-center justify-center gap-1"
            >
              <Send className="w-4 h-4" /> Submit
            </Link>
          )}
          {submitted && (
            <Link
              to={`/student/assignments/${a.id}`}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-center text-sm font-medium flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-4 h-4" /> View Result
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ── list row ───────────────────────────────────────────────────────────────────
const AssignmentListItem = ({ assignment: a }) => {
  const days    = getDaysRemaining(a.dueDate);
  const overdue = days < 0;
  const daysColor = overdue ? 'text-red-600' : days <= 2 ? 'text-orange-600' : days <= 5 ? 'text-yellow-600' : 'text-green-600';
  // FIX: same submitted check
  const submitted = a.mySubmission && ['submitted', 'graded', 'returned'].includes(a.mySubmission.status);

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 hover:shadow-md transition-shadow
      ${submitted ? 'border-green-400' : overdue ? 'border-red-500' : 'border-indigo-500'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">{a.subject}</span>
            <DifficultyBadge difficulty={a.difficulty} />
            <SubmissionTypeBadge type={a.submissionType} />
            <SubmissionStatusBadge submission={a.mySubmission} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{a.title}</h3>
          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{a.teacher}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Due: {a.dueDate}</span>
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{a.points} pts</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />~{a.estimatedTime}m</span>
            <span className={`font-semibold ${daysColor}`}>
              {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            to={`/student/assignments/${a.id}`}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </Link>
          {!submitted && (
            <Link
              to={`/student/assignments/${a.id}?tab=submit`}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Submit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ── subject group ──────────────────────────────────────────────────────────────
const SubjectGroup = ({ subject, assignments, viewMode, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const pending  = assignments.filter(a => !a.mySubmission || a.mySubmission.status === 'draft').length;
  const overdue  = assignments.filter(a => getDaysRemaining(a.dueDate) < 0 && !['submitted','graded','returned'].includes(a.mySubmission?.status)).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">{subject}</p>
            <p className="text-xs text-gray-400">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdue > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{overdue} overdue</span>
          )}
          {pending > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">{pending} pending</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <div className="pt-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {assignments.map(a => <AssignmentCard key={a.id} assignment={a} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(a => <AssignmentListItem key={a.id} assignment={a} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── main ───────────────────────────────────────────────────────────────────────
export default function PendingAssignments() {
  const [assignments, setAssignments]       = useState([]);
  const [grouped,     setGrouped]           = useState({});
  const [meta,        setMeta]              = useState(null);
  const [loading,     setLoading]           = useState(true);
  const [error,       setError]             = useState(null);

  // filters
  const [search,           setSearch]           = useState('');
  const [filterSubject,    setFilterSubject]    = useState('all');
  const [filterStatus,     setFilterStatus]     = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy,           setSortBy]           = useState('dueDate');
  const [sortOrder,        setSortOrder]        = useState('asc');
  const [viewMode,         setViewMode]         = useState('grouped');

  const fetchAssignments = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await studentAPI.getAssignments();
      const payload = res.data?.data ?? res.data ?? {};

      const raw = payload.data ?? (Array.isArray(payload) ? payload : []);
      setAssignments(Array.isArray(raw) ? raw.map(normalizeAssignment) : []);
      setGrouped(payload.grouped ?? {});
      setMeta(payload.meta ?? null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not load assignments. Please refresh.';
      setError(msg);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // ── client-side filter + sort ────────────────────────────────────────────────
  const filtered = (() => {
    let result = [...assignments];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        [a.title, a.subject, a.teacher, ...(a.tags ?? [])].some(v => v?.toLowerCase().includes(q))
      );
    }
    if (filterSubject !== 'all')    result = result.filter(a => a.subject === filterSubject);
    if (filterDifficulty !== 'all') result = result.filter(a => a.difficulty === filterDifficulty);
    if (filterStatus !== 'all') {
      result = result.filter(a => {
        const s = a.mySubmission?.status;
        if (filterStatus === 'pending')   return !s || s === 'draft';
        if (filterStatus === 'submitted') return s === 'submitted';
        if (filterStatus === 'graded')    return s === 'graded';
        return true;
      });
    }

    const dfo = { hard: 0, medium: 1, easy: 2 };
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'dueDate')        cmp = new Date(a.dueDate) - new Date(b.dueDate);
      else if (sortBy === 'points')    cmp = a.points - b.points;
      else if (sortBy === 'subject')   cmp = a.subject.localeCompare(b.subject);
      else if (sortBy === 'difficulty') cmp = dfo[a.difficulty] - dfo[b.difficulty];
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  })();

  const filteredGrouped = filtered.reduce((acc, a) => {
    const key = a.subject || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const subjects     = ['all', ...new Set(assignments.map(a => a.subject).filter(Boolean))];
  // FIX: pending = no submission OR draft only
  const pendingCount = assignments.filter(a => !a.mySubmission || a.mySubmission.status === 'draft').length;
  const overdueCount = assignments.filter(a =>
    getDaysRemaining(a.dueDate) < 0 &&
    !['submitted','graded','returned'].includes(a.mySubmission?.status)
  ).length;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading your assignments…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-blue-600" /> Assignments
            </h1>
            {meta && (
              <p className="text-sm text-gray-400 mt-0.5">
                {meta.grade}{meta.section ? ` · Section ${meta.section}` : ''} · {filtered.length} assignment{filtered.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={fetchAssignments}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* ── Summary pills ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total',    value: assignments.length,  color: 'bg-indigo-50 text-indigo-700' },
            { label: 'Pending',  value: pendingCount,        color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Overdue',  value: overdueCount,        color: 'bg-red-50 text-red-700'       },
            { label: 'Subjects', value: subjects.length - 1, color: 'bg-green-50 text-green-700'   },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Could not load assignments</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search title, subject, teacher, tag…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {subjects.map(s => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
            </select>
            <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Difficulties</option>
              {['easy','medium','hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="dueDate">Sort: Due Date</option>
                <option value="points">Sort: Points</option>
                <option value="subject">Sort: Subject</option>
                <option value="difficulty">Sort: Difficulty</option>
              </select>
              <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              {[
                { mode: 'grouped', icon: <BookOpen className="w-4 h-4" />, label: 'By Subject' },
                { mode: 'grid',    icon: <Grid      className="w-4 h-4" />, label: 'Grid'       },
                { mode: 'list',    icon: <List      className="w-4 h-4" />, label: 'List'       },
              ].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)} title={mode}
                  className={`p-1.5 rounded transition-colors ${viewMode === mode ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No Assignments Found</h3>
          <p className="text-sm text-gray-400">
            {search || filterSubject !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters.'
              : "Your teacher hasn't published any assignments for your class yet."}
          </p>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {filtered.length > 0 && viewMode === 'grouped' && (
        <div className="space-y-4">
          {Object.entries(filteredGrouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([subject, items]) => (
              <SubjectGroup
                key={subject}
                subject={subject}
                assignments={items}
                viewMode="grid"
                defaultOpen={true}
              />
            ))}
        </div>
      )}

      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(a => <AssignmentCard key={a.id} assignment={a} />)}
        </div>
      )}

      {filtered.length > 0 && viewMode === 'list' && (
        <div className="space-y-3">
          {filtered.map(a => <AssignmentListItem key={a.id} assignment={a} />)}
        </div>
      )}
    </div>
  );
}