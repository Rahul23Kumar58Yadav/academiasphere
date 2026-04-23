// src/pages/student/assignments/PendingAssignments.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Clock, Calendar, Award, Search, Filter,
  AlertCircle, Download, Eye, Send, FileText, User,
  RefreshCw, SortAsc, SortDesc, Grid, List, Tag,
  Zap, BookOpen, Link as LinkIcon,
} from 'lucide-react';
import {
  MOCK_ASSIGNMENTS,
  getDaysRemaining,
  getPriorityColor,
  getDifficultyColor,
  getCompletionPercentage,
} from '../../shared/assignmentSchema';

// ─── Submission type badge ────────────────────────────────────────────────────
const SubmissionTypeBadge = ({ type }) => {
  const map = {
    file: { label: 'File Upload', color: 'bg-blue-100 text-blue-700' },
    text: { label: 'Text Entry', color: 'bg-purple-100 text-purple-700' },
    link: { label: 'Link/URL',   color: 'bg-green-100 text-green-700' },
    both: { label: 'File + Text', color: 'bg-indigo-100 text-indigo-700' },
  };
  const { label, color } = map[type] ?? map.file;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>
  );
};

// ─── Difficulty badge ─────────────────────────────────────────────────────────
const DifficultyBadge = ({ difficulty }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(difficulty)}`}>
    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
  </span>
);

// ─── Late submission note ─────────────────────────────────────────────────────
const LateNote = ({ allowed, penalty }) =>
  allowed ? (
    <span className="text-xs text-orange-600 font-medium">
      Late allowed (–{penalty}%/day)
    </span>
  ) : (
    <span className="text-xs text-red-600 font-medium">No late submissions</span>
  );

// ─── Assignment Card (grid view) ──────────────────────────────────────────────
const AssignmentCard = ({ assignment }) => {
  const daysRemaining = getDaysRemaining(assignment.dueDate);
  const priorityColor = getPriorityColor(assignment.priority);
  const completionPct = getCompletionPercentage(assignment.submissions, assignment.totalStudents);

  const daysColor =
    daysRemaining <= 2 ? 'text-red-600' :
    daysRemaining <= 5 ? 'text-yellow-600' :
    'text-green-600';

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-${priorityColor}-500 hover:shadow-xl transition-shadow flex flex-col`}>
      {/* Coloured header */}
      <div className={`bg-${priorityColor}-500 p-4 text-white`}>
        <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
          <span className="px-2 py-1 bg-white/20 rounded text-xs font-semibold">{assignment.subject}</span>
          <div className="flex gap-1 flex-wrap">
            <DifficultyBadge difficulty={assignment.difficulty} />
            <SubmissionTypeBadge type={assignment.submissionType} />
          </div>
        </div>
        <h3 className="font-bold text-lg leading-tight mb-1">{assignment.title}</h3>
        <p className="text-xs opacity-90">{assignment.teacher} · {assignment.class} – {assignment.section.join(', ')}</p>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{assignment.description}</p>

        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Due in</p>
            <p className={`text-sm font-bold ${daysColor}`}>{daysRemaining}d</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Points</p>
            <p className="text-sm font-bold text-gray-900">{assignment.points}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Est. time</p>
            <p className="text-sm font-bold text-gray-900">{assignment.estimatedTime}m</p>
          </div>
        </div>

        {/* Due date */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-xs text-gray-700">
            Due: {assignment.dueDate} at {assignment.dueTime}
          </span>
        </div>

        {/* Late submission */}
        <div className="mb-3">
          <LateNote allowed={assignment.allowLateSubmission} penalty={assignment.latePenalty} />
        </div>

        {/* Tags */}
        {assignment.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {assignment.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Learning objectives preview */}
        {assignment.learningObjectives?.length > 0 && (
          <div className="mb-4 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Objectives ({assignment.learningObjectives.length})
            </p>
            <p className="text-xs text-blue-700 line-clamp-2">
              {assignment.learningObjectives[0]}
            </p>
          </div>
        )}

        {/* Attachments */}
        {assignment.attachments?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">
              Attachments ({assignment.attachments.length})
            </p>
            {assignment.attachments.slice(0, 2).map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs mb-1">
                <span className="flex items-center gap-1 truncate">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </span>
                <span className="text-gray-400 ml-2 shrink-0">{file.size}</span>
              </div>
            ))}
          </div>
        )}

        {/* Resources */}
        {assignment.resources?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Resources ({assignment.resources.length})
            </p>
            {assignment.resources.slice(0, 1).map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block truncate">
                {r.title}
              </a>
            ))}
          </div>
        )}

        {/* Class progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Class progress</span>
            <span>{completionPct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 rounded-full h-1.5 transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/student/assignments/${assignment.id}`}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm font-medium flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </Link>
          <Link
            to={`/student/assignments/submit?id=${assignment.id}`}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium flex items-center justify-center gap-1"
          >
            <Send className="w-4 h-4" /> Submit
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Assignment List Item (list view) ─────────────────────────────────────────
const AssignmentListItem = ({ assignment }) => {
  const daysRemaining = getDaysRemaining(assignment.dueDate);
  const priorityColor = getPriorityColor(assignment.priority);

  const daysColor =
    daysRemaining <= 2 ? 'text-red-600' :
    daysRemaining <= 5 ? 'text-yellow-600' :
    'text-green-600';

  return (
    <div className={`bg-white rounded-xl shadow-lg p-5 border-l-4 border-${priorityColor}-500 hover:shadow-xl transition-shadow`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className={`px-2.5 py-1 bg-${priorityColor}-100 text-${priorityColor}-700 text-xs font-semibold rounded-full`}>
              {assignment.priority.toUpperCase()}
            </span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
              {assignment.subject}
            </span>
            <DifficultyBadge difficulty={assignment.difficulty} />
            <SubmissionTypeBadge type={assignment.submissionType} />
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
              {assignment.assignmentType}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">{assignment.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">{assignment.description}</p>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {assignment.teacher}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Due: {assignment.dueDate} {assignment.dueTime}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              {assignment.points} pts (pass: {assignment.passingMarks})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{assignment.estimatedTime} min
            </span>
            <span className={`flex items-center gap-1 font-semibold ${daysColor}`}>
              {daysRemaining} days left
            </span>
          </div>

          {/* Tags */}
          {assignment.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {assignment.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Late submission */}
          <div className="mt-2">
            <LateNote allowed={assignment.allowLateSubmission} penalty={assignment.latePenalty} />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            to={`/student/assignments/${assignment.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> View Details
          </Link>
          <Link
            to={`/student/assignments/submit?id=${assignment.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Submit Now
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const PendingAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');

  const subjects    = [...new Set(MOCK_ASSIGNMENTS.map(a => a.subject))];
  const priorities  = ['urgent', 'high', 'medium', 'low', 'normal'];
  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => { loadAssignments(); }, []);

  useEffect(() => {
    let result = [...assignments];

    if (searchTerm)
      result = result.filter(a =>
        [a.title, a.subject, a.teacher, ...(a.tags ?? [])].some(
          v => v.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

    if (filterSubject !== 'all')   result = result.filter(a => a.subject === filterSubject);
    if (filterPriority !== 'all')  result = result.filter(a => a.priority === filterPriority);
    if (filterDifficulty !== 'all') result = result.filter(a => a.difficulty === filterDifficulty);

    const priorityOrder = { urgent: 0, high: 1, medium: 2, normal: 3, low: 4 };
    const difficultyOrder = { hard: 0, medium: 1, easy: 2 };

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'dueDate':    cmp = new Date(a.dueDate) - new Date(b.dueDate); break;
        case 'points':     cmp = a.points - b.points; break;
        case 'subject':    cmp = a.subject.localeCompare(b.subject); break;
        case 'priority':   cmp = priorityOrder[a.priority] - priorityOrder[b.priority]; break;
        case 'difficulty': cmp = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]; break;
        case 'estimatedTime': cmp = a.estimatedTime - b.estimatedTime; break;
        default: cmp = 0;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    setFiltered(result);
  }, [assignments, searchTerm, filterSubject, filterPriority, filterDifficulty, sortBy, sortOrder]);

  const loadAssignments = () => {
    setLoading(true);
    setTimeout(() => {
      setAssignments(MOCK_ASSIGNMENTS);
      setLoading(false);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assignments…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-blue-600" />
              Pending Assignments
            </h1>
            <p className="text-gray-500 mt-1">{filtered.length} assignment(s) pending</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={loadAssignments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search title, subject, teacher, tag…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Subject */}
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Priority */}
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">All Priorities</option>
              {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>

            {/* Difficulty */}
            <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">All Difficulties</option>
              {difficulties.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>

          {/* Sort + view toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="dueDate">Sort: Due Date</option>
                <option value="points">Sort: Points</option>
                <option value="subject">Sort: Subject</option>
                <option value="priority">Sort: Priority</option>
                <option value="difficulty">Sort: Difficulty</option>
                <option value="estimatedTime">Sort: Est. Time</option>
              </select>
              <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <button onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Found</h3>
          <p className="text-gray-500">All caught up, or try adjusting your filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(a => <AssignmentCard key={a.id} assignment={a} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => <AssignmentListItem key={a.id} assignment={a} />)}
        </div>
      )}
    </div>
  );
};

export default PendingAssignments;