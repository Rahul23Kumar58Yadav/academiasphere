// src/pages/teacher/curriculum/LessonPlans.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Edit, Trash2, Eye, Copy, Download, Upload,
  Calendar, Clock, BookOpen, CheckCircle, AlertCircle, Star, Users,
  FileText, Sparkles, ChevronRight, Filter, BarChart3, TrendingUp,
  Layers, Target, Award, X, Save, Send, RefreshCw, Tag, Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

const LessonPlans = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWeek, setFilterWeek] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list | calendar | board
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all | upcoming | completed | draft

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'];
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const durations = ['30 min', '45 min', '60 min', '90 min'];
  const difficultyLevels = ['Easy', 'Medium', 'Hard'];
  const teachingMethods = ['Lecture', 'Interactive', 'Project-Based', 'Collaborative', 'Flipped Classroom', 'Inquiry-Based'];

  const [lessonPlans, setLessonPlans] = useState([
    {
      id: 1,
      title: 'Introduction to Algebraic Expressions',
      subject: 'Mathematics',
      class: 'Grade 10-A',
      week: 'Week 1',
      date: '2024-01-15',
      duration: '45 min',
      status: 'completed',
      difficulty: 'Medium',
      method: 'Interactive',
      objectives: ['Understand variables and constants', 'Simplify basic expressions', 'Solve linear equations'],
      description: 'Students will be introduced to the concept of algebraic expressions through real-world examples and interactive exercises.',
      materials: [
        { name: 'Whiteboard & Markers', type: 'classroom' },
        { name: 'Algebra Worksheet.pdf', type: 'file' },
        { name: 'GeoGebra Interactive Tool', type: 'link', url: 'https://geogebra.org' },
      ],
      activities: [
        { time: '0-10 min', activity: 'Warm-up: Number puzzles', type: 'intro' },
        { time: '10-25 min', activity: 'Direct Instruction: Variables & Constants', type: 'teach' },
        { time: '25-35 min', activity: 'Group Practice: Simplification Exercises', type: 'practice' },
        { time: '35-45 min', activity: 'Exit Ticket: Quick Quiz', type: 'assessment' },
      ],
      assessmentMethod: 'Formative Assessment - Exit Ticket',
      homeworkAssigned: 'Chapter 5, Exercises 1-10',
      rating: 4.5,
      studentFeedback: 'Engaging and well-structured',
      aiSuggestion: 'Consider adding a real-world application example to increase student engagement.',
      tags: ['algebra', 'expressions', 'interactive'],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15',
    },
    {
      id: 2,
      title: 'Laws of Motion - Newton\'s First Law',
      subject: 'Physics',
      class: 'Grade 10-A',
      week: 'Week 1',
      date: '2024-01-16',
      duration: '60 min',
      status: 'completed',
      difficulty: 'Medium',
      method: 'Project-Based',
      objectives: ['Define inertia', 'Explain Newton\'s First Law', 'Demonstrate with practical experiments'],
      description: 'A hands-on lesson exploring Newton\'s First Law through interactive demonstrations and student experiments.',
      materials: [
        { name: 'Newton\'s Cradle', type: 'classroom' },
        { name: 'Coins & Cards', type: 'classroom' },
        { name: 'Physics Lab Manual', type: 'file' },
      ],
      activities: [
        { time: '0-10 min', activity: 'Hook: Tablecloth trick demonstration', type: 'intro' },
        { time: '10-20 min', activity: 'Mini Lecture: Concept of Inertia', type: 'teach' },
        { time: '20-40 min', activity: 'Lab Activity: Group Experiments', type: 'practice' },
        { time: '40-55 min', activity: 'Group Presentations & Discussion', type: 'practice' },
        { time: '55-60 min', activity: 'Reflection & Summary', type: 'assessment' },
      ],
      assessmentMethod: 'Lab Report Submission',
      homeworkAssigned: 'Write a short explanation of inertia with examples',
      rating: 4.8,
      studentFeedback: 'Very engaging experiments!',
      aiSuggestion: 'Link Newton\'s laws to everyday scenarios like seatbelts.',
      tags: ['newton', 'inertia', 'lab'],
      createdAt: '2024-01-12',
      updatedAt: '2024-01-16',
    },
    {
      id: 3,
      title: 'Periodic Table & Element Classification',
      subject: 'Chemistry',
      class: 'Grade 10-A',
      week: 'Week 2',
      date: '2024-01-22',
      duration: '45 min',
      status: 'upcoming',
      difficulty: 'Hard',
      method: 'Collaborative',
      objectives: ['Navigate the periodic table', 'Classify elements by group & period', 'Identify element properties'],
      description: 'Students will explore the periodic table structure and learn to classify elements using collaborative sorting activities.',
      materials: [
        { name: 'Large Periodic Table Poster', type: 'classroom' },
        { name: 'Element Cards (36 cards)', type: 'classroom' },
        { name: 'Periodic Table Worksheet.pdf', type: 'file' },
      ],
      activities: [
        { time: '0-8 min', activity: 'Introduction: Why do we need the periodic table?', type: 'intro' },
        { time: '8-18 min', activity: 'Mini Lecture: Structure Overview', type: 'teach' },
        { time: '18-35 min', activity: 'Card Sorting Activity: Groups & Periods', type: 'practice' },
        { time: '35-45 min', activity: 'Quiz: Element Classification Challenge', type: 'assessment' },
      ],
      assessmentMethod: 'In-class Quiz',
      homeworkAssigned: 'Memorize first 20 elements',
      rating: null,
      studentFeedback: null,
      aiSuggestion: 'Use color-coded element cards for better visual recognition.',
      tags: ['periodic table', 'elements', 'classification'],
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18',
    },
    {
      id: 4,
      title: 'Shakespearean Literature: Romeo & Juliet',
      subject: 'English',
      class: 'Grade 10-A',
      week: 'Week 2',
      date: '2024-01-23',
      duration: '60 min',
      status: 'upcoming',
      difficulty: 'Hard',
      method: 'Inquiry-Based',
      objectives: ['Analyze Shakespearean language', 'Identify literary devices', 'Interpret themes of love and conflict'],
      description: 'An in-depth literary analysis session on Romeo & Juliet, focusing on language interpretation and thematic analysis.',
      materials: [
        { name: 'Romeo & Juliet - Act 2 Excerpt', type: 'file' },
        { name: 'Literary Devices Reference Sheet', type: 'file' },
        { name: 'Shakespeare Online Resources', type: 'link', url: 'https://shakespeare.com' },
      ],
      activities: [
        { time: '0-10 min', activity: 'Warm-up: Modern vs Shakespearean English', type: 'intro' },
        { time: '10-25 min', activity: 'Close Reading: Act 2 Scene 2', type: 'teach' },
        { time: '25-40 min', activity: 'Group Discussion: Themes & Characters', type: 'practice' },
        { time: '40-55 min', activity: 'Writing Activity: Character Analysis Paragraph', type: 'practice' },
        { time: '55-60 min', activity: 'Share & Reflect', type: 'assessment' },
      ],
      assessmentMethod: 'Written Character Analysis',
      homeworkAssigned: 'Read Act 3 and identify 3 literary devices',
      rating: null,
      studentFeedback: null,
      aiSuggestion: 'Consider showing a short film adaptation clip to provide context.',
      tags: ['shakespeare', 'literature', 'analysis'],
      createdAt: '2024-01-19',
      updatedAt: '2024-01-19',
    },
    {
      id: 5,
      title: 'World War II - Causes and Impact',
      subject: 'History',
      class: 'Grade 10-A',
      week: 'Week 2',
      date: '2024-01-24',
      duration: '45 min',
      status: 'draft',
      difficulty: 'Medium',
      method: 'Lecture',
      objectives: ['Identify causes of WWII', 'Understand key events and turning points', 'Analyze global impact'],
      description: 'A comprehensive overview of World War II covering its causes, major events, and lasting impact on the modern world.',
      materials: [
        { name: 'WWII Timeline Poster', type: 'classroom' },
        { name: 'Historical Documents PDF', type: 'file' },
        { name: 'Documentary Clip - 10 min', type: 'video' },
      ],
      activities: [
        { time: '0-5 min', activity: 'Hook: Documentary Clip', type: 'intro' },
        { time: '5-25 min', activity: 'Lecture: Causes & Major Events', type: 'teach' },
        { time: '25-35 min', activity: 'Timeline Activity: Order the Events', type: 'practice' },
        { time: '35-45 min', activity: 'Discussion: Why does WWII still matter today?', type: 'assessment' },
      ],
      assessmentMethod: 'Class Discussion & Participation',
      homeworkAssigned: 'Essay: Impact of WWII on modern politics (500 words)',
      rating: null,
      studentFeedback: null,
      aiSuggestion: 'Add a primary source document analysis activity.',
      tags: ['wwii', 'history', 'causes'],
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20',
    },
    {
      id: 6,
      title: 'Python Programming Basics',
      subject: 'Computer Science',
      class: 'Grade 10-A',
      week: 'Week 3',
      date: '2024-01-29',
      duration: '90 min',
      status: 'draft',
      difficulty: 'Easy',
      method: 'Project-Based',
      objectives: ['Set up Python environment', 'Understand variables and data types', 'Write basic programs'],
      description: 'An introductory coding lesson where students set up their development environment and write their first Python programs.',
      materials: [
        { name: 'Laptops (1 per student)', type: 'classroom' },
        { name: 'Python Setup Guide.pdf', type: 'file' },
        { name: 'Google Colab', type: 'link', url: 'https://colab.research.google.com' },
        { name: 'Coding Exercises Sheet', type: 'file' },
      ],
      activities: [
        { time: '0-15 min', activity: 'Introduction: What is Python & why learn it?', type: 'intro' },
        { time: '15-30 min', activity: 'Setup: Installing Python / Google Colab', type: 'teach' },
        { time: '30-50 min', activity: 'Hands-on: Variables, Print, Input', type: 'practice' },
        { time: '50-70 min', activity: 'Mini Project: Simple Calculator Program', type: 'practice' },
        { time: '70-85 min', activity: 'Code Review & Debugging Together', type: 'practice' },
        { time: '85-90 min', activity: 'Recap & Next Steps', type: 'assessment' },
      ],
      assessmentMethod: 'Practical - Submit Working Calculator',
      homeworkAssigned: 'Create a program that prints multiplication table',
      rating: null,
      studentFeedback: null,
      aiSuggestion: 'Pair programming would be effective for beginners.',
      tags: ['python', 'coding', 'programming'],
      createdAt: '2024-01-21',
      updatedAt: '2024-01-21',
    },
  ]);

  // ─── New Lesson Form State ──────────────────────────
  const emptyForm = {
    title: '', subject: '', class: 'Grade 10-A', week: 'Week 1',
    date: '', duration: '45 min', difficulty: 'Medium', method: 'Lecture',
    objectives: [], description: '', materials: [], activities: [],
    assessmentMethod: '', homeworkAssigned: '', tags: [],
  };
  const [newPlan, setNewPlan] = useState({ ...emptyForm });
  const [currentObjective, setCurrentObjective] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  // ─── Helpers ────────────────────────────────────────
  const getStatusStyles = (status) => {
    const map = {
      completed: 'bg-emerald-100 text-emerald-700',
      upcoming:  'bg-blue-100   text-blue-700',
      draft:     'bg-gray-100   text-gray-700',
      cancelled: 'bg-red-100    text-red-700',
    };
    return map[status] || map.draft;
  };

  const getStatusIcon = (status) => {
    const map = { completed: CheckCircle, upcoming: Clock, draft: FileText, cancelled: X };
    const Icon = map[status] || FileText;
    return <Icon size={14} />;
  };

  const getDiffColor = (diff) => {
    const map = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' };
    return map[diff] || map.Medium;
  };

  const getActivityColor = (type) => {
    const map = { intro: 'bg-blue-100 text-blue-700', teach: 'bg-purple-100 text-purple-700', practice: 'bg-green-100 text-green-700', assessment: 'bg-orange-100 text-orange-700' };
    return map[type] || 'bg-gray-100 text-gray-700';
  };

  // ─── Filtering ──────────────────────────────────────
  const filtered = lessonPlans.filter(plan => {
    const matchSearch  = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) || plan.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === 'all' || plan.subject === filterSubject;
    const matchStatus  = filterStatus === 'all' || plan.status === filterStatus;
    const matchWeek    = filterWeek === 'all' || plan.week === filterWeek;
    const matchTab     = activeTab === 'all' || (activeTab === 'upcoming' && plan.status === 'upcoming') || (activeTab === 'completed' && plan.status === 'completed') || (activeTab === 'draft' && plan.status === 'draft');
    return matchSearch && matchSubject && matchStatus && matchWeek && matchTab;
  });

  // ─── Stats ──────────────────────────────────────────
  const stats = {
    total:     lessonPlans.length,
    completed: lessonPlans.filter(p => p.status === 'completed').length,
    upcoming:  lessonPlans.filter(p => p.status === 'upcoming').length,
    draft:     lessonPlans.filter(p => p.status === 'draft').length,
  };

  // ─── Create ─────────────────────────────────────────
  const handleCreatePlan = () => {
    if (!newPlan.title || !newPlan.subject || !newPlan.date) {
      toast.error('Please fill in required fields');
      return;
    }
    setLessonPlans(prev => [
      ...prev,
      { ...newPlan, id: Date.now(), status: 'draft', rating: null, studentFeedback: null, aiSuggestion: '', createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] },
    ]);
    setNewPlan({ ...emptyForm });
    setShowCreateModal(false);
    toast.success('Lesson plan created successfully!');
  };

  // ─── Delete ─────────────────────────────────────────
  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;
    setLessonPlans(prev => prev.filter(p => p.id !== id));
    toast.success('Lesson plan deleted');
  };

  // ─── Duplicate ──────────────────────────────────────
  const handleDuplicate = (plan) => {
    setLessonPlans(prev => [
      ...prev,
      { ...plan, id: Date.now(), title: plan.title + ' (Copy)', status: 'draft', rating: null, studentFeedback: null, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] },
    ]);
    toast.success('Lesson plan duplicated');
  };

  // ─── RENDER ─────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher/curriculum')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lesson Plans</h1>
              <p className="text-sm text-gray-500">Plan, organize and track your teaching curriculum</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {['list', 'board', 'calendar'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-sm font-semibold capitalize transition-colors ${viewMode === mode ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Upload size={16} /> Import
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              <Plus size={16} /> New Lesson Plan
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><Layers size={24} /><span className="text-3xl font-bold">{stats.total}</span></div>
          <p className="text-sm opacity-90">Total Plans</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><CheckCircle size={24} /><span className="text-3xl font-bold">{stats.completed}</span></div>
          <p className="text-sm opacity-90">Completed</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><Clock size={24} /><span className="text-3xl font-bold">{stats.upcoming}</span></div>
          <p className="text-sm opacity-90">Upcoming</p>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><FileText size={24} /><span className="text-3xl font-bold">{stats.draft}</span></div>
          <p className="text-sm opacity-90">Drafts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
        {['all', 'upcoming', 'completed', 'draft'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search lessons..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Weeks</option>
            {weeks.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filtered.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyles(plan.status)}`}>
                      {getStatusIcon(plan.status)} {plan.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getDiffColor(plan.difficulty)}`}>{plan.difficulty}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{plan.method}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{plan.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.subject} • {plan.class} • {plan.week}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={13} /> {plan.date}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {plan.duration}</span>
                    <span className="flex items-center gap-1"><Target size={13} /> {plan.objectives.length} Objectives</span>
                  </div>
                  {/* Tags */}
                  {plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plan.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}
                  {/* AI Suggestion */}
                  {plan.aiSuggestion && (
                    <div className="flex items-start gap-2 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <Sparkles size={15} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800">{plan.aiSuggestion}</p>
                    </div>
                  )}
                </div>

                {/* Right – rating + actions */}
                <div className="flex items-center gap-3">
                  {plan.rating && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 rounded-lg">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-yellow-700">{plan.rating}</span>
                    </div>
                  )}
                  <button onClick={() => { setSelectedPlan(plan); setShowDetailModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={18} /></button>
                  <button onClick={() => handleDuplicate(plan)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Duplicate"><Copy size={18} /></button>
                  <button onClick={() => handleDelete(plan.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
              <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No lesson plans found</p>
            </div>
          )}
        </div>
      )}

      {/* BOARD VIEW ─── Kanban by status */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['draft', 'upcoming', 'completed'].map(col => (
            <div key={col} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 capitalize">{col}</h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                  {filtered.filter(p => p.status === col).length}
                </span>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filtered.filter(p => p.status === col).map(plan => (
                  <div key={plan.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{plan.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDiffColor(plan.difficulty)}`}>
                        {plan.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{plan.subject} • {plan.class}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {plan.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {plan.duration}</span>
                    </div>
                    {plan.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {plan.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button onClick={() => { setSelectedPlan(plan); setShowDetailModal(true); }} className="text-xs text-indigo-600 font-semibold hover:underline">
                        View Details
                      </button>
                      {plan.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-yellow-700">{plan.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filtered.filter(p => p.status === col).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No {col} plans</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Calendar View</p>
            <p className="text-sm text-gray-400 mt-1">Coming soon - Full calendar integration</p>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create New Lesson Plan</h2>
                <button onClick={() => { setShowCreateModal(false); setNewPlan({ ...emptyForm }); }} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={newPlan.title}
                      onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter lesson title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                    <select
                      value={newPlan.subject}
                      onChange={e => setNewPlan({ ...newPlan, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select subject</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={newPlan.date}
                      onChange={e => setNewPlan({ ...newPlan, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                    <select
                      value={newPlan.duration}
                      onChange={e => setNewPlan({ ...newPlan, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {durations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Week</label>
                    <select
                      value={newPlan.week}
                      onChange={e => setNewPlan({ ...newPlan, week: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {weeks.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={newPlan.difficulty}
                      onChange={e => setNewPlan({ ...newPlan, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {difficultyLevels.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teaching Method</label>
                    <select
                      value={newPlan.method}
                      onChange={e => setNewPlan({ ...newPlan, method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {teachingMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newPlan.description}
                    onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief description of the lesson"
                  />
                </div>

                {/* Objectives */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Learning Objectives</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentObjective}
                      onChange={e => setCurrentObjective(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && currentObjective.trim()) {
                          setNewPlan({ ...newPlan, objectives: [...newPlan.objectives, currentObjective.trim()] });
                          setCurrentObjective('');
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="Add an objective and press Enter"
                    />
                    <button
                      onClick={() => {
                        if (currentObjective.trim()) {
                          setNewPlan({ ...newPlan, objectives: [...newPlan.objectives, currentObjective.trim()] });
                          setCurrentObjective('');
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                  {newPlan.objectives.length > 0 && (
                    <div className="space-y-1">
                      {newPlan.objectives.map((obj, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{obj}</span>
                          <button
                            onClick={() => setNewPlan({ ...newPlan, objectives: newPlan.objectives.filter((_, i) => i !== idx) })}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={e => setCurrentTag(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && currentTag.trim()) {
                          setNewPlan({ ...newPlan, tags: [...newPlan.tags, currentTag.trim().toLowerCase()] });
                          setCurrentTag('');
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="Add a tag and press Enter"
                    />
                  </div>
                  {newPlan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newPlan.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                          #{tag}
                          <button onClick={() => setNewPlan({ ...newPlan, tags: newPlan.tags.filter((_, i) => i !== idx) })}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assessment & Homework */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assessment Method</label>
                    <input
                      type="text"
                      value={newPlan.assessmentMethod}
                      onChange={e => setNewPlan({ ...newPlan, assessmentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Quiz, Exit Ticket"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Homework Assigned</label>
                    <input
                      type="text"
                      value={newPlan.homeworkAssigned}
                      onChange={e => setNewPlan({ ...newPlan, homeworkAssigned: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Chapter 5, Ex 1-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => { setShowCreateModal(false); setNewPlan({ ...emptyForm }); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Create Lesson Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedPlan.title}</h2>
                  <p className="text-indigo-100">{selectedPlan.subject} • {selectedPlan.class} • {selectedPlan.week}</p>
                </div>
                <button onClick={() => { setShowDetailModal(false); setSelectedPlan(null); }} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Status & Info */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyles(selectedPlan.status)}`}>
                    {getStatusIcon(selectedPlan.status)} {selectedPlan.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDiffColor(selectedPlan.difficulty)}`}>
                    {selectedPlan.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                    {selectedPlan.method}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                    <Clock size={14} className="inline mr-1" />{selectedPlan.duration}
                  </span>
                  {selectedPlan.rating && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                      <Star size={14} className="inline mr-1 fill-yellow-500" />{selectedPlan.rating}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedPlan.description}</p>
                </div>

                {/* Learning Objectives */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Learning Objectives</h3>
                  <ul className="space-y-2">
                    {selectedPlan.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Target size={16} className="text-indigo-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Materials */}
                {selectedPlan.materials.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Materials Required</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedPlan.materials.map((mat, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                            mat.type === 'classroom' ? 'bg-blue-100 text-blue-700' :
                            mat.type === 'file' ? 'bg-green-100 text-green-700' :
                            mat.type === 'link' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {mat.type === 'classroom' ? '📦' : mat.type === 'file' ? '📄' : mat.type === 'link' ? '🔗' : '📹'}
                          </div>
                          <span className="text-sm text-gray-700">{mat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities Timeline */}
                {selectedPlan.activities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Lesson Activities</h3>
                    <div className="space-y-3">
                      {selectedPlan.activities.map((act, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getActivityColor(act.type)}`}>
                              {idx + 1}
                            </div>
                            {idx < selectedPlan.activities.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-600">{act.time}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getActivityColor(act.type)}`}>
                                {act.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 font-medium">{act.activity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assessment & Homework */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPlan.assessmentMethod && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Assessment Method</h4>
                      <p className="text-sm text-gray-700">{selectedPlan.assessmentMethod}</p>
                    </div>
                  )}
                  {selectedPlan.homeworkAssigned && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Homework Assigned</h4>
                      <p className="text-sm text-gray-700">{selectedPlan.homeworkAssigned}</p>
                    </div>
                  )}
                </div>

                {/* AI Suggestion */}
                {selectedPlan.aiSuggestion && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">AI Suggestion</h4>
                        <p className="text-sm text-amber-800">{selectedPlan.aiSuggestion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Student Feedback */}
                {selectedPlan.studentFeedback && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Student Feedback</h4>
                    <p className="text-sm text-gray-700">{selectedPlan.studentFeedback}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedPlan.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlan.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between p-6 border-t border-gray-200">
              <button
                onClick={() => handleDuplicate(selectedPlan)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                <Copy size={18} />
                Duplicate
              </button>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
                  <Download size={18} />
                  Export
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedPlan(null); }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlans;