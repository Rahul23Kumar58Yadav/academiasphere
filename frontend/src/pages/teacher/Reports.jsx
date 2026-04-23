import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Star,
  Medal,
  BookOpen,
  ChevronDown,
  Search,
  X,
  Save,
  Award,
  TrendingUp,
  Users,
  Filter,
} from 'lucide-react';

// ── Sample seed data ─────────────────────────────────────────────────────────
const INITIAL_TOPPERS = [
  {
    id: 1,
    studentName: 'Aarav Kumar',
    rollNo: 'GR10A-01',
    class: '10-A',
    subject: 'Mathematics',
    score: 98,
    totalMarks: 100,
    rank: 1,
    exam: 'Unit Test 1',
    remarks: 'Exceptional problem-solving skills',
  },
  {
    id: 2,
    studentName: 'Priya Sharma',
    rollNo: 'GR10A-04',
    class: '10-A',
    subject: 'Mathematics',
    score: 95,
    totalMarks: 100,
    rank: 2,
    exam: 'Unit Test 1',
    remarks: 'Consistent performer',
  },
  {
    id: 3,
    studentName: 'Rohan Singh',
    rollNo: 'GR9B-07',
    class: '9-B',
    subject: 'Science',
    score: 97,
    totalMarks: 100,
    rank: 1,
    exam: 'Mid-Term',
    remarks: 'Outstanding in practical',
  },
];

const CLASSES  = ['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A', '12-B'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
const EXAMS    = ['Unit Test 1', 'Unit Test 2', 'Mid-Term', 'Pre-Board', 'Final Exam'];
const RANKS    = [1, 2, 3];

const RANK_CONFIG = {
  1: { label: '1st', color: 'from-yellow-400 to-amber-500',   text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: '🥇' },
  2: { label: '2nd', color: 'from-gray-300 to-slate-400',     text: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200', icon: '🥈' },
  3: { label: '3rd', color: 'from-orange-300 to-orange-500',  text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: '🥉' },
};

const EMPTY_FORM = {
  studentName: '',
  rollNo: '',
  class: '',
  subject: '',
  score: '',
  totalMarks: 100,
  rank: 1,
  exam: '',
  remarks: '',
};

// ── Percentage badge ──────────────────────────────────────────────────────────
function PercentBadge({ score, total }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const color =
    pct >= 95 ? 'bg-emerald-100 text-emerald-700' :
    pct >= 85 ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700';
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${color}`}>
      {pct}%
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white flex items-center gap-4 shadow-md`}>
      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-extrabold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function TopperModal({ form, setForm, onSave, onClose, isEdit }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.studentName.trim()) e.studentName = 'Name is required';
    if (!form.rollNo.trim())      e.rollNo = 'Roll No is required';
    if (!form.class)              e.class = 'Select a class';
    if (!form.subject)            e.subject = 'Select a subject';
    if (!form.exam)               e.exam = 'Select an exam';
    if (form.score === '' || isNaN(+form.score)) e.score = 'Enter valid score';
    else if (+form.score > +form.totalMarks) e.score = 'Score exceeds total marks';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave();
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: '' }); }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
          errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
        }`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  const select = (key, label, options) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <select
        value={form[key]}
        onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: '' }); }}
        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-gray-50 focus:bg-white ${
          errors[key] ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        <option value="">-- Select --</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Trophy size={22} />
            <h2 className="text-lg font-bold">{isEdit ? 'Edit Topper Entry' : 'Add Topper'}</h2>
          </div>
          <button onClick={onClose} className="text-white opacity-70 hover:opacity-100 transition">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {field('studentName', 'Student Name', 'text', 'e.g. Aarav Kumar')}
            {field('rollNo', 'Roll No', 'text', 'e.g. GR10A-01')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {select('class', 'Class', CLASSES)}
            {select('subject', 'Subject', SUBJECTS)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {select('exam', 'Exam / Test', EXAMS)}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rank</label>
              <div className="flex gap-2">
                {RANKS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setForm({ ...form, rank: r })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition ${
                      form.rank === r
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    {RANK_CONFIG[r].icon} {RANK_CONFIG[r].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('score', 'Marks Obtained', 'number', 'e.g. 95')}
            {field('totalMarks', 'Total Marks', 'number', 'e.g. 100')}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Any special remarks about the student..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 flex items-center gap-2 transition shadow"
          >
            <Save size={16} />
            {isEdit ? 'Update Entry' : 'Save Topper'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Topper Card ───────────────────────────────────────────────────────────────
function TopperCard({ topper, onEdit, onDelete }) {
  const cfg = RANK_CONFIG[topper.rank] || RANK_CONFIG[1];
  const pct = Math.round((topper.score / topper.totalMarks) * 100);

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 relative overflow-hidden group transition-shadow hover:shadow-lg`}>
      {/* Rank ribbon */}
      <div className={`absolute top-0 right-0 w-14 h-14 bg-gradient-to-br ${cfg.color} rounded-bl-2xl flex items-center justify-center`}>
        <span className="text-xl">{cfg.icon}</span>
      </div>

      <div className="pr-10">
        <p className="font-extrabold text-gray-900 text-base leading-tight">{topper.studentName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{topper.rollNo} · {topper.class}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-white rounded-lg text-xs font-semibold text-indigo-700 border border-indigo-100 flex items-center gap-1">
          <BookOpen size={11} /> {topper.subject}
        </span>
        <span className="px-2 py-1 bg-white rounded-lg text-xs font-semibold text-gray-600 border border-gray-100 flex items-center gap-1">
          <Star size={11} /> {topper.exam}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Marks</p>
          <p className="text-lg font-extrabold text-gray-900">{topper.score}<span className="text-xs text-gray-400 font-normal">/{topper.totalMarks}</span></p>
        </div>
        <PercentBadge score={topper.score} total={topper.totalMarks} />
      </div>

      {/* Score bar */}
      <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${cfg.color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {topper.remarks && (
        <p className="mt-3 text-xs text-gray-500 italic leading-relaxed">"{topper.remarks}"</p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(topper)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-50 transition"
        >
          <Pencil size={13} /> Edit
        </button>
        <button
          onClick={() => onDelete(topper.id)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition"
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Main Reports Component ────────────────────────────────────────────────────
const Reports = () => {
  const [toppers, setToppers]           = useState(INITIAL_TOPPERS);
  const [showModal, setShowModal]       = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [filterClass, setFilterClass]   = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterExam, setFilterExam]     = useState('');
  const [search, setSearch]             = useState('');
  const [viewMode, setViewMode]         = useState('cards'); // 'cards' | 'table'

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (topper) => {
    setForm({ ...topper });
    setEditingId(topper.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingId) {
      setToppers(toppers.map((t) => (t.id === editingId ? { ...form, id: editingId } : t)));
    } else {
      setToppers([...toppers, { ...form, id: Date.now(), score: +form.score, totalMarks: +form.totalMarks }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this topper entry?')) {
      setToppers(toppers.filter((t) => t.id !== id));
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = toppers.filter((t) => {
    const q = search.toLowerCase();
    return (
      (!filterClass   || t.class   === filterClass)   &&
      (!filterSubject || t.subject === filterSubject) &&
      (!filterExam    || t.exam    === filterExam)    &&
      (!q || t.studentName.toLowerCase().includes(q) || t.rollNo.toLowerCase().includes(q))
    );
  }).sort((a, b) => a.rank - b.rank);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const uniqueClasses  = [...new Set(toppers.map((t) => t.class))].length;
  const avgScore = toppers.length
    ? Math.round(toppers.reduce((s, t) => s + (t.score / t.totalMarks) * 100, 0) / toppers.length)
    : 0;

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Trophy className="text-amber-500" size={28} />
            Topper Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and recognise your class toppers by subject</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:opacity-90 transition"
        >
          <Plus size={18} /> Add Topper
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy}    label="Total Entries"   value={toppers.length}    gradient="from-indigo-500 to-purple-600" />
        <StatCard icon={Users}     label="Classes Covered" value={uniqueClasses}     gradient="from-teal-500 to-emerald-600" />
        <StatCard icon={BookOpen}  label="Subjects"        value={[...new Set(toppers.map((t) => t.subject))].length} gradient="from-sky-500 to-blue-600" />
        <StatCard icon={TrendingUp} label="Avg Score"      value={`${avgScore}%`}    gradient="from-orange-400 to-pink-500" />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-gray-400 flex-shrink-0" />

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {[
          { val: filterClass,   setter: setFilterClass,   opts: CLASSES,  placeholder: 'All Classes'   },
          { val: filterSubject, setter: setFilterSubject, opts: SUBJECTS, placeholder: 'All Subjects'  },
          { val: filterExam,    setter: setFilterExam,    opts: EXAMS,    placeholder: 'All Exams'     },
        ].map(({ val, setter, opts, placeholder }) => (
          <div key={placeholder} className="relative">
            <select
              value={val}
              onChange={(e) => setter(e.target.value)}
              className="pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer"
            >
              <option value="">{placeholder}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ))}

        {(filterClass || filterSubject || filterExam || search) && (
          <button
            onClick={() => { setFilterClass(''); setFilterSubject(''); setFilterExam(''); setSearch(''); }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
          >
            <X size={13} /> Clear
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['cards', 'table'].map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                viewMode === v ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Award size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-semibold">No topper entries found</p>
          <p className="text-sm mt-1">Try adjusting filters or add a new entry</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <TopperCard key={t.id} topper={t} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Rank','Student','Roll No','Class','Subject','Exam','Score','%','Remarks','Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => {
                  const cfg = RANK_CONFIG[t.rank] || RANK_CONFIG[1];
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-lg">{cfg.icon}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{t.studentName}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.rollNo}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">{t.class}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{t.subject}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.exam}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{t.score}/{t.totalMarks}</td>
                      <td className="px-4 py-3"><PercentBadge score={t.score} total={t.totalMarks} /></td>
                      <td className="px-4 py-3 text-gray-400 italic text-xs max-w-[180px] truncate">{t.remarks || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Showing {filtered.length} of {toppers.length} entries
          </div>
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {showModal && (
        <TopperModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          isEdit={!!editingId}
        />
      )}
    </div>
  );
};

export default Reports;