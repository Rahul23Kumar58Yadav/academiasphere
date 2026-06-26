// src/pages/student/assignments/SubmitAssignment.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  Upload, X, CheckCircle, AlertCircle, Clock, Award, Calendar,
  FileText, Link as LinkIcon, Send, Save, ArrowLeft,
  User, Loader2, Trash2, AlignLeft, Edit, BookOpen,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../services/assignment';
import { getDaysRemaining, getDifficultyColor } from '../../shared/assignmentSchema';

const normalizeAssignment = (raw) => ({
  id:           raw._id ?? raw.id,
  title:        raw.title,
  subject:      raw.subject,
  class:        raw.grade ?? raw.class,
  sections:     Array.isArray(raw.sections) ? raw.sections : [],
  teacher:      raw.teacherName ?? 'Teacher',
  description:  raw.description   ?? '',
  instructions: raw.instructions  ?? '',
  dueDate:      raw.dueDate ? new Date(raw.dueDate).toISOString().split('T')[0] : '',
  dueDateTime:  raw.dueDate ? new Date(raw.dueDate) : null,
  points:       raw.maxMarks  ?? raw.points  ?? 100,
  passingMarks: raw.passingMarks ?? 40,
  assignmentType:      raw.assignmentType ?? 'homework',
  submissionType:      raw.submissionType  ?? 'file',
  allowLateSubmission: raw.allowLateSubmission ?? false,
  latePenalty:  raw.latePenalty   ?? 10,
  difficulty:   raw.difficulty    ?? 'medium',
  estimatedTime: raw.estimatedTime ?? 60,
  attachments:  raw.attachments   ?? [],
  rubric:       raw.rubric        ?? [],
  learningObjectives: raw.learningObjectives ?? [],
  maxFiles:     raw.maxFiles      ?? 5,
  maxFileSize:  raw.maxFileSize   ?? 10,
  allowedExtensions: raw.allowedExtensions ?? ['.pdf', '.doc', '.docx', '.png', '.jpg'],
  mySubmission: raw.mySubmission  ?? null,
});

// ── Confirm dialog (no window.confirm — works in all browsers) ────────────────
function ConfirmModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex gap-3 items-start mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Submit Assignment?</p>
            <p className="text-sm text-slate-500 mt-1">Once submitted you won't be able to edit your response.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Submit Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubmitAssignment() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();                       // supports /submit/:id
  const assignmentId  = paramId ?? searchParams.get('id');   // or /submit?id=...

  const [assignment,     setAssignment]     = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [savingDraft,    setSavingDraft]    = useState(false);
  const [savedDraft,     setSavedDraft]     = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [error,          setError]          = useState(null);

  const [uploadedFiles,  setUploadedFiles]  = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [textResponse,   setTextResponse]   = useState('');
  const [linkUrl,        setLinkUrl]        = useState('');
  const [comments,       setComments]       = useState('');

  const fileInputRef = useRef(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!assignmentId) { navigate('/student/assignments'); return; }
    setLoading(true); setError(null);
    try {
      const [aRes, sRes] = await Promise.all([
        studentAPI.getAssignment(assignmentId),
        studentAPI.getMySubmission(assignmentId).catch(() => null),
      ]);
      const raw = aRes.data?.data?.data ?? aRes.data?.data ?? aRes.data;
      const sub = sRes?.data?.data?.data ?? sRes?.data?.data ?? sRes?.data ?? null;

      const a = normalizeAssignment({ ...raw, mySubmission: sub });
      setAssignment(a);

      if (sub) {
        setTextResponse(sub.textContent ?? '');
        setLinkUrl(sub.linkUrl ?? '');
        setComments(sub.comments ?? '');
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not load assignment.');
    } finally { setLoading(false); }
  }, [assignmentId, navigate]);

  useEffect(() => { load(); }, [load]);

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    if (!assignment) return;
    const files = Array.from(e.target.files ?? []);
    if (uploadedFiles.length + files.length > assignment.maxFiles) {
      toast.error(`Max ${assignment.maxFiles} files allowed`); return;
    }

    files.forEach(file => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > assignment.maxFileSize) {
        toast.error(`${file.name} exceeds ${assignment.maxFileSize} MB`); return;
      }
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (assignment.allowedExtensions.length && !assignment.allowedExtensions.includes(ext)) {
        toast.error(`${file.name}: .${ext} not allowed`); return;
      }

      const fileId = `${Date.now()}-${Math.random()}`;
      setUploadProgress(p => ({ ...p, [fileId]: 0 }));

      // Simulate progress then finalise
      let pct = 0;
      const iv = setInterval(() => {
        pct = Math.min(pct + 15, 100);
        setUploadProgress(p => ({ ...p, [fileId]: pct }));
        if (pct === 100) {
          clearInterval(iv);
          setTimeout(() => {
            setUploadProgress(p => { const u = { ...p }; delete u[fileId]; return u; });
            setUploadedFiles(p => [...p, { id: fileId, file, name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type }]);
          }, 300);
        }
      }, 100);
    });

    // Reset input so same file can be re-selected if removed
    e.target.value = '';
  };

  const removeFile = (id) => setUploadedFiles(p => p.filter(f => f.id !== id));

  // ── Draft save ───────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await studentAPI.saveDraft(assignmentId, { textContent: textResponse, linkUrl, comments });
      setSavedDraft(true);
      toast.success('Draft saved!');
      setTimeout(() => setSavedDraft(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not save draft');
    } finally { setSavingDraft(false); }
  };

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const hasFile = uploadedFiles.length > 0;
    const hasText = textResponse.trim().length > 0;
    const hasLink = linkUrl.trim().length > 0;

    if (!hasFile && !hasText && !hasLink) {
      toast.error('Please upload a file, enter a text response, or provide a link.');
      return false;
    }
    if (assignment.submissionType === 'file' && !hasFile) {
      toast.error('This assignment requires a file upload.');
      return false;
    }
    if (assignment.submissionType === 'text' && !hasText) {
      toast.error('This assignment requires a text response.');
      return false;
    }
    if (assignment.submissionType === 'link' && !hasLink) {
      toast.error('This assignment requires a link/URL submission.');
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const alreadySubmitted = assignment.mySubmission && assignment.mySubmission.status !== 'draft';
    if (alreadySubmitted) { toast.error('Already submitted.'); return; }
    if (!validate()) return;
    setShowConfirm(true);
  };

  const doSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach(f => formData.append('files', f.file));
      formData.append('textContent', textResponse);
      formData.append('linkUrl',     linkUrl);
      formData.append('comments',    comments);

      await studentAPI.submit(assignmentId, formData);
      toast.success('Assignment submitted successfully! 🎉');
      navigate('/student/assignments');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Submission failed. Please try again.';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  // ── Loading / error states ────────────────────────────────────────────────────
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
      <p className="text-slate-600 font-medium">{error ?? 'Assignment not found'}</p>
      <div className="flex gap-3">
        <button onClick={load} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
        <button onClick={() => navigate('/student/assignments')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          Back
        </button>
      </div>
    </div>
  );

  const a              = assignment;
  const daysLeft       = getDaysRemaining(a.dueDate);
  const overdue        = daysLeft < 0;
  const alreadySubmitted = a.mySubmission && a.mySubmission.status !== 'draft';
  const showTextEntry  = ['text', 'both'].includes(a.submissionType);
  const showFileEntry  = ['file', 'both'].includes(a.submissionType);
  const showLinkEntry  = ['link', 'both'].includes(a.submissionType);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <ConfirmModal open={showConfirm} onConfirm={doSubmit} onCancel={() => setShowConfirm(false)} />

      {/* ── Back ──────────────────────────────────────────────────────────── */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={`h-1.5 w-full ${alreadySubmitted ? 'bg-green-500' : overdue ? 'bg-red-500' : 'bg-indigo-500'}`} />
        <div className="p-5">
          {alreadySubmitted && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Already Submitted</p>
                {a.mySubmission?.submittedAt && (
                  <p className="text-xs text-green-600">
                    {new Date(a.mySubmission.submittedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          {overdue && !alreadySubmitted && !a.allowLateSubmission && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-semibold text-red-700">
                This assignment is {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} overdue and late submissions are not allowed.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{a.subject}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(a.difficulty)}`}>
              {a.difficulty.charAt(0).toUpperCase() + a.difficulty.slice(1)}
            </span>
            {overdue && !alreadySubmitted && (
              <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {Math.abs(daysLeft)}d overdue
              </span>
            )}
          </div>

          <h1 className="text-xl font-extrabold text-slate-800 mb-2">{a.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{a.teacher}</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Due {a.dueDateTime
                ? a.dueDateTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : a.dueDate}
            </span>
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />{a.points} pts</span>
            {!alreadySubmitted && (
              <span className={`flex items-center gap-1.5 font-semibold ${overdue ? 'text-red-600' : daysLeft <= 2 ? 'text-orange-600' : 'text-green-600'}`}>
                <Clock className="w-3.5 h-3.5" />
                {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Main submission form ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* File upload */}
          {showFileEntry && (
            <FormCard
              title="Upload Files"
              icon={<Upload className="w-4 h-4 text-blue-500" />}
              required={a.submissionType === 'file'}
            >
              {!alreadySubmitted && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-slate-700 font-semibold text-sm mb-1">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400">
                    {a.allowedExtensions.join(', ')} · Max {a.maxFileSize} MB per file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{uploadedFiles.length}/{a.maxFiles} files selected</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" multiple
                accept={a.allowedExtensions.join(',')}
                onChange={handleFileSelect} className="hidden" />

              {/* Upload progress */}
              {Object.entries(uploadProgress).map(([fid, pct]) => (
                <div key={fid} className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex justify-between text-xs font-semibold text-blue-800 mb-1.5">
                    <span>Uploading…</span><span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-150" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}

              {/* Uploaded files */}
              {uploadedFiles.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{f.name}</p>
                    <p className="text-xs text-slate-400">{f.size}</p>
                  </div>
                  {!alreadySubmitted && (
                    <button onClick={() => removeFile(f.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {uploadedFiles.length === 0 && alreadySubmitted && (
                <p className="text-sm text-slate-400 italic">Files submitted — cannot view after submission.</p>
              )}
            </FormCard>
          )}

          {/* Text response */}
          {showTextEntry && (
            <FormCard
              title="Text Response"
              icon={<AlignLeft className="w-4 h-4 text-purple-500" />}
              required={a.submissionType === 'text'}
            >
              <textarea
                value={textResponse}
                onChange={e => setTextResponse(e.target.value)}
                placeholder="Type your answer here…"
                rows={10}
                disabled={alreadySubmitted}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1.5 text-right">{textResponse.length} characters</p>
            </FormCard>
          )}

          {/* Link */}
          {(showLinkEntry || !showFileEntry) && (
            <FormCard
              title="Submit Link"
              icon={<LinkIcon className="w-4 h-4 text-green-500" />}
              required={a.submissionType === 'link'}
              badge={a.submissionType !== 'link' ? 'optional' : null}
            >
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://docs.google.com/…"
                disabled={alreadySubmitted}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              />
            </FormCard>
          )}

          {/* Comments */}
          <FormCard
            title="Note to Teacher"
            icon={<Edit className="w-4 h-4 text-orange-500" />}
            badge="optional"
          >
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Any context or notes for your teacher…"
              rows={3}
              disabled={alreadySubmitted}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500 transition-all"
            />
          </FormCard>

          {/* Action buttons */}
          {!alreadySubmitted && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50">
                  {savingDraft
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : savedDraft
                    ? <CheckCircle className="w-4 h-4 text-green-600" />
                    : <Save className="w-4 h-4" />}
                  {savedDraft ? 'Draft Saved!' : savingDraft ? 'Saving…' : 'Save Draft'}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || (overdue && !a.allowLateSubmission)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    : <><Send className="w-4 h-4" /> Submit Assignment</>}
                </button>
              </div>

              {overdue && a.allowLateSubmission && (
                <p className="text-xs text-orange-600 mt-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Late submission — {a.latePenalty}% penalty per day will apply
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Assignment details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Assignment Details</h3>
            {a.description && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{a.description}</p>
            )}
            {a.instructions && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 mb-1.5">Instructions</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{a.instructions}</p>
              </div>
            )}
          </div>

          {/* Rubric preview */}
          {a.rubric?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Grading Rubric
              </h3>
              <div className="space-y-2">
                {a.rubric.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <p className="text-xs text-slate-700 font-medium">{item.criteria}</p>
                    <span className="text-xs font-bold text-amber-600 shrink-0">{item.points}pts</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <p className="text-xs font-bold text-slate-700">Total</p>
                  <p className="text-xs font-extrabold text-slate-800">{a.points} pts</p>
                </div>
              </div>
            </div>
          )}

          {/* Submission requirements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Submission Rules</h3>
            <dl className="space-y-2.5">
              {[
                ['Format',    a.submissionType],
                ['Max files', `${a.maxFiles} files`],
                ['Max size',  `${a.maxFileSize} MB each`],
                ['Types',     a.allowedExtensions.join(', ')],
                ['Late',      a.allowLateSubmission ? `–${a.latePenalty}%/day` : 'Not allowed'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className={`text-xs font-semibold ${k === 'Late' && !a.allowLateSubmission ? 'text-red-600' : 'text-slate-700'}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Learning objectives */}
          {a.learningObjectives?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> What You'll Show
              </h3>
              <ul className="space-y-2">
                {a.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-600">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormCard({ title, icon, required, badge, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        {icon}{title}
        {required && <span className="text-red-500 text-xs font-semibold">*required</span>}
        {badge && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">{badge}</span>}
      </h2>
      {children}
    </div>
  );
}