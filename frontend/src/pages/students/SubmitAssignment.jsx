// src/pages/student/assignments/SubmitAssignment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload, X, Check, AlertCircle, Clock, Award, Calendar,
  FileText, Link as LinkIcon, Download, Send, Save, RefreshCw,
  ChevronLeft, User, Info, CheckCircle, Trash2, AlignLeft, Edit,
  BookOpen, Tag, Zap,
} from 'lucide-react';
import {
  MOCK_ASSIGNMENTS,
  getDaysRemaining,
  getDifficultyColor,
  formatFileSize,
} from '../../shared/assignmentSchema';

// ─── Adaptive submission form ─────────────────────────────────────────────────
// Shows only the input types the teacher configured (file / text / link / both).

const SubmitAssignment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = Number(searchParams.get('id'));

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [textResponse, setTextResponse] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [comments, setComments] = useState('');
  const [savedDraft, setSavedDraft] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadAssignment(); }, [assignmentId]);

  const loadAssignment = () => {
    setLoading(true);
    setTimeout(() => {
      const found = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId) ?? MOCK_ASSIGNMENTS[0];
      setAssignment(found);
      setLoading(false);
    }, 600);
  };

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (uploadedFiles.length + files.length > assignment.maxFiles) {
      alert(`Maximum ${assignment.maxFiles} files allowed`);
      return;
    }

    files.forEach(file => {
      if (file.size > assignment.maxFileSize * 1024 * 1024) {
        alert(`${file.name} exceeds ${assignment.maxFileSize} MB`);
        return;
      }
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!assignment.allowedExtensions.includes(ext)) {
        alert(`${file.name} — invalid type. Allowed: ${assignment.allowedExtensions.join(', ')}`);
        return;
      }

      const fileId = Date.now() + Math.random();
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const next = (prev[fileId] ?? 0) + 12;
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploadProgress(p => { const u = { ...p }; delete u[fileId]; return u; });
              setUploadedFiles(p => [...p, {
                id: fileId, file, name: file.name,
                size: formatFileSize(file.size), type: file.type,
              }]);
            }, 300);
            return { ...prev, [fileId]: 100 };
          }
          return { ...prev, [fileId]: next };
        });
      }, 150);
    });
  };

  const handleRemoveFile = (id) =>
    setUploadedFiles(prev => prev.filter(f => f.id !== id));

  const handleSaveDraft = () => {
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2500);
  };

  const handleSubmit = () => {
    const hasFile = uploadedFiles.length > 0;
    const hasText = textResponse.trim().length > 0;
    const hasLink = linkUrl.trim().length > 0;

    const needsFile = ['file', 'both'].includes(assignment.submissionType);
    const needsText = ['text', 'both'].includes(assignment.submissionType);

    if (needsFile && !hasFile && !hasText) {
      alert('Please upload at least one file or enter a text response.');
      return;
    }
    if (needsText && !hasText && !hasFile) {
      alert('Please enter your text response or upload a file.');
      return;
    }
    if (!hasFile && !hasText && !hasLink) {
      alert('Please add at least one submission (file, text, or link).');
      return;
    }

    if (!window.confirm('Submit this assignment? You cannot edit after submission.')) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert('Assignment submitted successfully!');
      navigate('/student/assignments');
    }, 1800);
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assignment…</p>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(assignment.dueDate);
  const daysColor =
    daysRemaining <= 2 ? 'text-red-600' :
    daysRemaining <= 5 ? 'text-yellow-600' :
    'text-green-600';

  const showFileUpload = ['file', 'both', 'link'].includes(assignment.submissionType) || true;
  const showTextEntry  = ['text', 'both'].includes(assignment.submissionType);
  const showLinkEntry  = ['link', 'both', 'file', 'text'].includes(assignment.submissionType); // always show as optional

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium">
          <ChevronLeft className="w-5 h-5" /> Back to Assignments
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">
                {assignment.subject}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded">
                {assignment.assignmentType}
              </span>
              <span className={`px-3 py-1 rounded text-sm font-semibold ${getDifficultyColor(assignment.difficulty)}`}>
                {assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
              </span>
              {daysRemaining <= 2 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Due Soon
                </span>
              )}
              {assignment.allowLateSubmission && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded">
                  Late OK (–{assignment.latePenalty}%/day)
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>

            <div className="flex items-center flex-wrap gap-5 text-sm text-gray-500">
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{assignment.teacher}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Due: {assignment.dueDate} at {assignment.dueTime}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                {assignment.points} pts (pass: {assignment.passingMarks})
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                ~{assignment.estimatedTime} min
              </span>
              <span className={`flex items-center gap-1 font-semibold ${daysColor}`}>
                <Clock className="w-4 h-4" />{daysRemaining} days remaining
              </span>
            </div>

            {/* Tags */}
            {assignment.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {assignment.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main submission area ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* File Upload (always shown, required when submissionType includes 'file') */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Files
              {assignment.submissionType === 'file' && (
                <span className="text-red-500 text-sm font-normal">*required</span>
              )}
            </h2>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer mb-4"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">
                Allowed: {assignment.allowedExtensions.join(', ')} · Max {assignment.maxFileSize} MB
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {uploadedFiles.length}/{assignment.maxFiles} files uploaded
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={assignment.allowedExtensions.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Progress bars */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-2 mb-4">
                {Object.entries(uploadProgress).map(([id, pct]) => (
                  <div key={id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between text-sm font-medium text-blue-900 mb-1">
                      <span>Uploading…</span><span>{pct}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File list */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map(file => (
                  <div key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveFile(file.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Text Response (shown when type is text or both) */}
          {showTextEntry && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-purple-600" />
                Text Response
                {assignment.submissionType === 'text' && (
                  <span className="text-red-500 text-sm font-normal">*required</span>
                )}
              </h2>
              <textarea
                value={textResponse}
                onChange={e => setTextResponse(e.target.value)}
                placeholder="Type your response here…"
                rows="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{textResponse.length} characters</p>
            </div>
          )}

          {/* Link submission */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-green-600" />
              Submit Link
              <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </h2>
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://docs.google.com/…"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Google Docs, Google Drive, OneDrive, or any public URL
            </p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-500" />
              Comments for Teacher
              <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </h2>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Any notes or context for your teacher…"
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <button onClick={handleSaveDraft}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium">
                <Save className="w-4 h-4" />
                Save Draft
                {savedDraft && <CheckCircle className="w-4 h-4 text-green-600" />}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Assignment</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Assignment details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
            <p className="text-sm text-gray-700 mb-4">{assignment.description}</p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Instructions</p>
              <p className="text-sm text-gray-800 whitespace-pre-line">{assignment.instructions}</p>
            </div>
          </div>

          {/* Learning objectives (from teacher) */}
          {assignment.learningObjectives?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> Learning Objectives
              </h3>
              <ul className="space-y-2">
                {assignment.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments */}
          {assignment.attachments?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {assignment.attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                    <a href={file.url} download
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg ml-1">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources (from teacher) */}
          {assignment.resources?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-green-600" /> Study Resources
              </h3>
              <div className="space-y-2">
                {assignment.resources.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-sm text-green-800 font-medium">
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{r.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Grading rubric */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grading Rubric</h3>
            <div className="space-y-3">
              {assignment.rubric?.map((item, i) => (
                <div key={i} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{item.criteria}</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                      {item.points} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              ))}
              <div className="pt-3 border-t-2 border-gray-200 flex items-center justify-between">
                <p className="font-bold text-gray-900 text-sm">Total</p>
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded">
                  {assignment.points} pts
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Passing marks: {assignment.passingMarks} / {assignment.points}
              </p>
            </div>
          </div>

          {/* Submission format info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Submission Format</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Type:</span> {assignment.submissionType}</p>
              <p><span className="font-medium">Max files:</span> {assignment.maxFiles}</p>
              <p><span className="font-medium">Max size:</span> {assignment.maxFileSize} MB/file</p>
              <p><span className="font-medium">Allowed:</span> {assignment.allowedExtensions.join(', ')}</p>
              <p>
                <span className="font-medium">Late submission: </span>
                {assignment.allowLateSubmission
                  ? <span className="text-orange-600">Allowed (–{assignment.latePenalty}% per day)</span>
                  : <span className="text-red-600">Not allowed</span>}
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Submission Tips</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>· Review all requirements before submitting</li>
                  <li>· Double-check your files are correct</li>
                  <li>· Save drafts frequently</li>
                  <li>· Submit before the deadline</li>
                  <li>· You cannot edit after submission</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;