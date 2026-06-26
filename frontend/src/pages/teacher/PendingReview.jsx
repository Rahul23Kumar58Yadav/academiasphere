// src/pages/teacher/assignments/PendingReview.jsx
// Fully dynamic — fetches real submissions, grades via API, zero mock fallback
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Download, Eye, CheckCircle, XCircle,
  Clock, AlertCircle, FileText, MessageSquare, Save,
  Sparkles, Loader2, RefreshCw, User, ChevronDown, Filter, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { assignmentAPI } from '../../services/assignment';

// ─── Normalize raw submission from API ────────────────────────────────────────
const normalizeSubmission = (raw) => ({
  id:             raw._id          ?? raw.id,
  assignmentId:   raw.assignmentId?._id ?? raw.assignmentId ?? raw.assignment,
  assignmentTitle: raw.assignmentTitle
                  ?? raw.assignmentId?.title
                  ?? raw.assignment?.title
                  ?? raw.title
                  ?? '—',
  subject:        raw.subject
                  ?? raw.assignmentId?.subject
                  ?? raw.assignment?.subject
                  ?? '—',
  class:          raw.class
                  ?? raw.grade
                  ?? raw.assignmentId?.grade
                  ?? raw.assignment?.grade
                  ?? '—',
  section:        raw.section
                  ?? raw.sections
                  ?? raw.assignmentId?.sections
                  ?? raw.assignment?.sections
                  ?? [],
  dueDate:        raw.dueDate
                  ?? raw.assignmentId?.dueDate
                  ?? raw.assignment?.dueDate,
  totalMarks:     raw.totalMarks
                  ?? raw.maxMarks
                  ?? raw.assignmentId?.maxMarks
                  ?? raw.assignment?.maxMarks
                  ?? raw.points
                  ?? 100,
  studentName:    raw.studentName
                  ?? raw.student?.name
                  ?? raw.studentId?.name
                  ?? 'Unknown Student',
  rollNumber:     raw.rollNumber
                  ?? raw.student?.rollNumber
                  ?? raw.studentId?.rollNumber
                  ?? '—',
  studentPhoto:   raw.studentPhoto ?? raw.student?.avatar ?? null,
  submittedDate:  raw.submittedDate ?? raw.submittedAt ?? raw.createdAt,
  // FIX: controller saves status as 'submitted', normalise → 'pending' for UI
  status:         raw.status === 'submitted' ? 'pending' : (raw.status ?? 'pending'),
  isLate:         raw.isLate ?? false,
  submissionType: raw.submissionType ?? 'file',
  files:          raw.files ?? raw.attachments ?? [],
  textContent:    raw.textContent ?? raw.content ?? '',
  marks:          raw.marks ?? raw.score ?? null,
  feedback:       raw.feedback ?? '',
  aiScore:        raw.aiScore ?? raw.aiPredictedScore ?? null,
  plagiarismScore: raw.plagiarismScore ?? raw.similarityScore ?? null,
});

// ─── Colour helpers ───────────────────────────────────────────────────────────
const aiColor   = s => s >= 85 ? 'text-emerald-600' : s >= 70 ? 'text-blue-600' : s >= 60 ? 'text-amber-600' : 'text-red-600';
const plagColor = s => s < 10  ? 'text-emerald-600' : s < 20  ? 'text-amber-600' : 'text-red-600';
const plagBg    = s => s < 10  ? 'bg-emerald-50'    : s < 20  ? 'bg-amber-50'    : 'bg-red-50';

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, photo }) => {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  if (photo) return <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
      {initials}
    </div>
  );
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status, isLate }) => {
  if (isLate && status === 'pending')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
        <Clock size={11} />Late
      </span>
    );
  const map = {
    pending:  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100   text-amber-700   rounded-full text-xs font-semibold"><Clock       size={11} />Pending</span>,
    graded:   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><CheckCircle size={11} />Graded</span>,
    returned: <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100    text-blue-700    rounded-full text-xs font-semibold"><CheckCircle size={11} />Returned</span>,
  };
  return map[status] ?? map.pending;
};

// ═════════════════════════════════════════════════════════════════════════════
export default function PendingReview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [search,   setSearch]   = useState('');
  const [fStatus,  setFStatus]  = useState('all');
  const [fSubject, setFSubject] = useState('all');
  const [showF,    setShowF]    = useState(false);

  const [selected,  setSelected]  = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: 0, feedback: '' });
  const [grading,   setGrading]   = useState(false);

  // ── Fetch submissions ─────────────────────────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Primary: get all submissions for this teacher
      const res = await assignmentAPI.getAllSubmissions();
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      const list = Array.isArray(raw) ? raw.map(normalizeSubmission) : [];

      // If primary returns empty, try fetching per-assignment submissions
      if (list.length === 0) {
        const aRes = await assignmentAPI.getAll();
        const assignments =
          Array.isArray(aRes.data?.data?.data) ? aRes.data.data.data :
          Array.isArray(aRes.data?.data)       ? aRes.data.data       :
          Array.isArray(aRes.data)             ? aRes.data            : [];

        const nested = await Promise.all(
          assignments.map(a =>
            assignmentAPI.getSubmissions(a._id ?? a.id)
              .then(r => {
                const subs = r.data?.data?.data ?? r.data?.data ?? r.data ?? [];
                return (Array.isArray(subs) ? subs : []).map(s => ({
                  ...s,
                  assignmentId: a, // inject full assignment so normalizer can extract fields
                }));
              })
              .catch(() => [])
          )
        );
        setSubmissions(nested.flat().map(normalizeSubmission));
      } else {
        setSubmissions(list);
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Could not load submissions. Please refresh.';
      setError(msg);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = {
    total:   submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    graded:  submissions.filter(s => s.status === 'graded').length,
    late:    submissions.filter(s => s.isLate).length,
  };

  const subjects = ['all', ...new Set(submissions.map(s => s.subject).filter(Boolean))];

  const filtered = submissions.filter(s => {
    const q = search.toLowerCase();
    return (
      (!q ||
        s.studentName.toLowerCase().includes(q) ||
        s.assignmentTitle.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q))
      && (fStatus  === 'all' || s.status  === fStatus)
      && (fSubject === 'all' || s.subject === fSubject)
    );
  });

  // ── Grade modal ───────────────────────────────────────────────────────────
  const openGrade = (sub) => {
    setSelected(sub);
    setGradeForm({ marks: sub.marks ?? 0, feedback: sub.feedback ?? '' });
  };

  const submitGrade = async () => {
    if (+gradeForm.marks > selected.totalMarks) {
      toast.error(`Marks cannot exceed ${selected.totalMarks}`); return;
    }
    if (+gradeForm.marks < 0) { toast.error('Marks cannot be negative'); return; }

    setGrading(true);
    try {
      await assignmentAPI.gradeSubmission(selected.id, {
        marks:    +gradeForm.marks,
        score:    +gradeForm.marks,
        feedback: gradeForm.feedback,
      });
      // Optimistic update
      setSubmissions(prev =>
        prev.map(s =>
          s.id === selected.id
            ? { ...s, status: 'graded', marks: +gradeForm.marks, feedback: gradeForm.feedback }
            : s
        )
      );
      toast.success('Grade submitted!');
      setSelected(null);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to submit grade';
      toast.error(msg);
    } finally {
      setGrading(false);
    }
  };

  const downloadFile = (file) => {
    if (file.url && file.url !== '#') window.open(file.url, '_blank');
    else toast('File URL not available.');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher/assignments/create')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pending Reviews</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Review and grade student submissions ·{' '}
                <span className="font-semibold text-indigo-600">{user?.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchSubmissions}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
              <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                const pending = filtered.filter(s => s.status === 'pending');
                if (!pending.length) { toast('No pending submissions.'); return; }
                toast.success(`${pending.length} submission(s) ready for download`);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
            >
              <Download size={16} />Download All
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <FileText   size={20} />, label: 'Total',   value: stats.total,   color: 'bg-indigo-50  text-indigo-600',  border: 'border-indigo-100'  },
          { icon: <Clock      size={20} />, label: 'Pending', value: stats.pending, color: 'bg-amber-50   text-amber-600',   border: 'border-amber-100'   },
          { icon: <CheckCircle size={20}/>, label: 'Graded',  value: stats.graded,  color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
          { icon: <AlertCircle size={20}/>, label: 'Late',    value: stats.late,    color: 'bg-red-50     text-red-500',     border: 'border-red-100'     },
        ].map(({ icon, label, value, color, border }) => (
          <div key={label} className={`bg-white rounded-xl border ${border} shadow-sm p-4 flex items-center gap-4`}>
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search student, assignment, roll no…"
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowF(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
              showF || fStatus !== 'all' || fSubject !== 'all'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={14} />Filters
          </button>
          <span className="text-sm text-gray-400 ml-auto hidden sm:block">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {showF && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: 'Status',  val: fStatus,  set: setFStatus,  opts: [['all','All Status'],['pending','Pending'],['graded','Graded'],['returned','Returned']] },
              { label: 'Subject', val: fSubject, set: setFSubject, opts: subjects.map(s => [s, s === 'all' ? 'All Subjects' : s]) },
            ].map(({ label, val, set, opts }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{label}</p>
                <div className="relative">
                  <select value={val} onChange={e => set(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-indigo-400 outline-none pr-7">
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 bg-white rounded-xl border border-gray-100">
          <Loader2 className="animate-spin text-indigo-600" size={26} />
          <p className="text-gray-500 font-medium">Loading submissions…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={28} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {submissions.length === 0 ? 'No submissions yet' : 'No results'}
          </h3>
          <p className="text-sm text-gray-400">
            {submissions.length === 0
              ? 'Students have not submitted any assignments yet.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Student', 'Assignment', 'Submitted', 'AI Insights', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">

                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={sub.studentName} photo={sub.studentPhoto} />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{sub.studentName}</p>
                          <p className="text-xs text-gray-400">{sub.rollNumber}</p>
                          <p className="text-xs text-gray-400">
                            {sub.class}{sub.section?.length ? ` · Sec ${sub.section.join(', ')}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Assignment */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 text-sm leading-snug max-w-[200px] truncate">
                        {sub.assignmentTitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{sub.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Total: {sub.totalMarks} marks</p>
                    </td>

                    {/* Submitted */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {sub.submittedDate
                          ? new Date(sub.submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {sub.submittedDate
                          ? new Date(sub.submittedDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </p>
                      {sub.dueDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Due {new Date(sub.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </td>

                    {/* AI Insights */}
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        {sub.aiScore !== null ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 ${aiColor(sub.aiScore)}`}>
                            <Sparkles size={11} />AI: {sub.aiScore}%
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">No AI score</span>
                        )}
                        {sub.plagiarismScore !== null ? (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${plagBg(sub.plagiarismScore)} ${plagColor(sub.plagiarismScore)}`}>
                            <AlertCircle size={11} />Plag: {sub.plagiarismScore}%
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 block">No plag check</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={sub.status} isLate={sub.isLate} />
                      {sub.status === 'graded' && sub.marks !== null && (
                        <p className="text-sm font-bold text-emerald-700 mt-1.5">
                          {sub.marks}/{sub.totalMarks}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openGrade(sub)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View & Grade">
                          <Eye size={17} />
                        </button>
                        {sub.files?.length > 0 && (
                          <button onClick={() => downloadFile(sub.files[0])}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                            <Download size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Grading modal ── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col">

            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="min-w-0 pr-4">
                <h2 className="text-lg font-bold text-gray-900 truncate">{selected.assignmentTitle}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={selected.studentName} photo={selected.studentPhoto} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selected.studentName}</p>
                    <p className="text-xs text-gray-400">{selected.rollNumber} · {selected.class}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
                <XCircle size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Quick info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Submitted',   val: selected.submittedDate ? new Date(selected.submittedDate).toLocaleDateString('en-IN') : '—' },
                  { label: 'Total Marks', val: selected.totalMarks },
                  { label: 'AI Score',    val: selected.aiScore !== null ? `${selected.aiScore}%` : 'N/A',        extra: selected.aiScore !== null ? aiColor(selected.aiScore) : 'text-gray-400' },
                  { label: 'Plagiarism',  val: selected.plagiarismScore !== null ? `${selected.plagiarismScore}%` : 'N/A', extra: selected.plagiarismScore !== null ? plagColor(selected.plagiarismScore) : 'text-gray-400' },
                ].map(({ label, val, extra }) => (
                  <div key={label} className="p-3.5 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`font-bold text-sm ${extra ?? 'text-gray-900'}`}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Submission content */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Submission Content</h3>
                {selected.files?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Attached Files</p>
                    {selected.files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2.5">
                          <FileText size={16} className="text-indigo-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-400">{file.size}</p>
                          </div>
                        </div>
                        <button onClick={() => downloadFile(file)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {selected.textContent && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Text Submission</p>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.textContent}</p>
                    </div>
                  </div>
                )}
                {!selected.files?.length && !selected.textContent && (
                  <p className="text-sm text-gray-400 text-center py-4">No submission content available.</p>
                )}
              </div>

              {/* Late warning */}
              {selected.isLate && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <Clock size={16} className="text-orange-500 shrink-0" />
                  <p className="text-sm font-semibold text-orange-700">This was a late submission.</p>
                </div>
              )}

              {/* Grading form */}
              <div className="bg-white border-2 border-indigo-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={17} className="text-indigo-600" />
                  Grade This Submission
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Marks Obtained
                      <span className="ml-1 font-normal text-gray-400">(out of {selected.totalMarks})</span>
                    </label>
                    <input
                      type="number"
                      value={gradeForm.marks}
                      onChange={e => setGradeForm(p => ({ ...p, marks: e.target.value }))}
                      min={0} max={selected.totalMarks}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (+gradeForm.marks / selected.totalMarks) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {selected.totalMarks > 0 ? `${Math.round((+gradeForm.marks / selected.totalMarks) * 100)}%` : ''}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Feedback</label>
                    <textarea
                      value={gradeForm.feedback}
                      onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))}
                      rows={4}
                      placeholder="Provide constructive feedback to the student…"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={submitGrade}
                disabled={grading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-100 active:scale-95 transition-all"
              >
                {grading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {selected.status === 'graded' ? 'Update Grade' : 'Submit Grade'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}