import React, { useState, useMemo, useCallback } from 'react';
import {
  Download, Save, Search, TrendingUp, Users, Award, CheckCircle,
  Plus, Trash2, Pencil, X, ChevronDown, AlertTriangle,
  BookOpen, BarChart2, ClipboardList, Eye, RefreshCw,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CLASSES_LIST = ['Grade 9 – A', 'Grade 9 – B', 'Grade 10 – A', 'Grade 10 – B', 'Grade 11 – A', 'Grade 11 – B'];

const EXAM_TYPES = [
  { value: 'unit1', label: 'Unit Test 1', max: 25 },
  { value: 'mid',   label: 'Mid-Term',    max: 50 },
  { value: 'unit2', label: 'Unit Test 2', max: 25 },
  { value: 'final', label: 'Final Exam',  max: 100 },
];

const ALL_SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer'];

const SUBJECT_COLORS = ['#4F46E5','#0891B2','#059669','#D97706','#DC2626','#7C3AED'];

const AVATAR_PALETTE = [
  { bg: '#EEF2FF', tx: '#3730A3' }, { bg: '#ECFDF5', tx: '#065F46' },
  { bg: '#FFF7ED', tx: '#92400E' }, { bg: '#FEF2F2', tx: '#991B1B' },
  { bg: '#F0F9FF', tx: '#075985' }, { bg: '#FDF4FF', tx: '#6B21A8' },
];

const SEED_STUDENTS = [
  { id: 1,  name: 'Aarav Kumar',    roll: '01', batch: 'Grade 10 – A' },
  { id: 2,  name: 'Priya Sharma',   roll: '02', batch: 'Grade 10 – A' },
  { id: 3,  name: 'Rohan Patel',    roll: '03', batch: 'Grade 10 – A' },
  { id: 4,  name: 'Diya Mehta',     roll: '04', batch: 'Grade 10 – B' },
  { id: 5,  name: 'Arjun Singh',    roll: '05', batch: 'Grade 10 – B' },
  { id: 6,  name: 'Kavya Nair',     roll: '06', batch: 'Grade 9 – A'  },
  { id: 7,  name: 'Vikram Joshi',   roll: '07', batch: 'Grade 9 – A'  },
  { id: 8,  name: 'Ananya Gupta',   roll: '08', batch: 'Grade 9 – B'  },
  { id: 9,  name: 'Siddharth Rao',  roll: '09', batch: 'Grade 9 – B'  },
  { id: 10, name: 'Ishaan Verma',   roll: '10', batch: 'Grade 10 – A' },
];

function seedMarks(students, max) {
  const m = {};
  students.forEach((s) => {
    ALL_SUBJECTS.forEach((sub) => {
      m[`${s.id}::${sub}`] = Math.floor(Math.random() * (max * 0.55)) + Math.floor(max * 0.35);
    });
  });
  return m;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function gradeInfo(pct) {
  if (pct >= 90) return { grade: 'A+', color: '#065F46', bg: '#D1FAE5' };
  if (pct >= 75) return { grade: 'A',  color: '#065F46', bg: '#ECFDF5' };
  if (pct >= 60) return { grade: 'B',  color: '#1E40AF', bg: '#DBEAFE' };
  if (pct >= 50) return { grade: 'C',  color: '#92400E', bg: '#FEF3C7' };
  if (pct >= 35) return { grade: 'D',  color: '#9A3412', bg: '#FFEDD5' };
  return               { grade: 'F',  color: '#991B1B', bg: '#FEE2E2' };
}

function barColor(pct) {
  if (pct >= 75) return '#059669';
  if (pct >= 50) return '#D97706';
  return '#DC2626';
}

let _nextId = 11;
function nextId() { return _nextId++; }

// ─── Tiny Components ─────────────────────────────────────────────────────────

function GradeBadge({ pct }) {
  const { grade, color, bg } = gradeInfo(pct);
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ color, backgroundColor: bg }}>
      {grade}
    </span>
  );
}

function PctBar({ pct }) {
  const color = barColor(pct);
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <span className="text-xs font-semibold w-9 text-right tabular-nums" style={{ color }}>{pct}%</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent + '20' }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <p className="text-xs font-semibold text-gray-500 mb-1.5">{label}</p>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-8 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800 cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle size={22} />
          <h3 className="font-bold text-gray-900">Confirm Delete</h3>
        </div>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add/Edit Student Modal ───────────────────────────────────────────────────

function StudentModal({ student, onSave, onClose }) {
  const isEdit = !!student?.id;
  const [form, setForm] = useState({
    name:  student?.name  ?? '',
    roll:  student?.roll  ?? '',
    batch: student?.batch ?? CLASSES_LIST[0],
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.roll.trim()) e.roll = 'Roll No is required';
    return e;
  };

  const handle = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...(student ?? {}), ...form, id: student?.id ?? nextId() });
  };

  const field = (key, label, placeholder) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: '' }); }}
        placeholder={placeholder}
        className={`w-full text-sm px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <h2 className="font-bold text-base">{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 transition"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {field('name', 'Full Name', 'e.g. Aarav Kumar')}
          {field('roll', 'Roll Number', 'e.g. 01')}
          <Select label="Batch / Class" value={form.batch} onChange={(v) => setForm({ ...form, batch: v })} options={CLASSES_LIST.map((c) => ({ value: c, label: c }))} />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handle} className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:opacity-90 flex items-center gap-2 transition shadow-md">
            <Save size={15} /> {isEdit ? 'Update' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mark Cell ────────────────────────────────────────────────────────────────

function MarkCell({ value, max, onChange }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal]     = useState(String(value));
  const pct    = max ? Math.round((value / max) * 100) : 0;
  const isOver = value > max;

  const commit = () => {
    const v = Math.min(max, Math.max(0, Number(local) || 0));
    onChange(v);
    setLocal(String(v));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        max={max}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-14 text-center text-sm rounded-lg py-1.5 border-2 border-indigo-400 outline-none bg-indigo-50"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`w-14 py-1.5 rounded-lg text-sm font-semibold border transition group-hover:border-indigo-300 ${
        isOver ? 'bg-red-50 border-red-300 text-red-700'
               : pct >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
               : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-indigo-50'
      }`}
    >
      {value}
    </button>
  );
}

// ─── Mark Entry Tab ───────────────────────────────────────────────────────────

function MarkEntryTab({ students, subjects, marks, maxMark, onMarkChange, onEditStudent, onDeleteStudent, onAddStudent }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.includes(search)),
    [students, search]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-base">Mark Entry Grid</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student…"
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50 w-44"
            />
          </div>
          <button
            onClick={onAddStudent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs sticky left-0 bg-slate-50 z-10 min-w-[200px]">Student</th>
              {subjects.map((sub, i) => (
                <th key={sub} className="py-3 px-3 text-xs font-bold text-center" style={{ color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}>
                  {sub.length > 7 ? sub.substring(0, 7) + '…' : sub}
                  <span className="block text-gray-400 font-normal">/{maxMark}</span>
                </th>
              ))}
              <th className="py-3 px-3 text-xs text-gray-500 font-semibold text-center whitespace-nowrap">Total</th>
              <th className="py-3 px-3 text-xs text-gray-500 font-semibold min-w-[120px]">Score</th>
              <th className="py-3 px-3 text-xs text-gray-500 font-semibold text-center">Grade</th>
              <th className="py-3 px-3 text-xs text-gray-500 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, idx) => {
              const pal      = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
              const subVals  = subjects.map((sub) => marks[`${student.id}::${sub}`] ?? 0);
              const total    = subVals.reduce((a, b) => a + b, 0);
              const maxTotal = maxMark * subjects.length;
              const pct      = maxTotal ? Math.round((total / maxTotal) * 100) : 0;

              return (
                <tr key={student.id} className="group border-b border-gray-50 hover:bg-indigo-50/20 transition-colors">
                  {/* Student info */}
                  <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-indigo-50/20">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: pal.bg, color: pal.tx }}
                      >
                        {initials(student.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{student.name}</p>
                        <p className="text-xs text-gray-400">Roll #{student.roll} · {student.batch}</p>
                      </div>
                    </div>
                  </td>

                  {/* Mark cells */}
                  {subjects.map((sub) => (
                    <td key={sub} className="py-3 px-3 text-center">
                      <MarkCell
                        value={marks[`${student.id}::${sub}`] ?? 0}
                        max={maxMark}
                        onChange={(val) => onMarkChange(student.id, sub, val)}
                      />
                    </td>
                  ))}

                  {/* Total */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="font-bold text-gray-900">{total}</span>
                    <span className="text-gray-400 text-xs">/{maxTotal}</span>
                  </td>

                  {/* Pct bar */}
                  <td className="py-3 px-3"><PctBar pct={pct} /></td>

                  {/* Grade */}
                  <td className="py-3 px-3 text-center"><GradeBadge pct={pct} /></td>

                  {/* Actions */}
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEditStudent(student)}
                        className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition"
                        title="Edit student"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteStudent(student.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 transition"
                        title="Delete student"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No students found</p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
        <Eye size={12} /> Showing {filtered.length} of {students.length} students · Click any mark cell to edit
      </div>
    </div>
  );
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────

function SummaryTab({ students, subjects, marks, maxMark }) {
  if (!students.length) return (
    <div className="text-center py-20 text-gray-400">
      <BarChart2 size={42} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">No student data to summarise</p>
    </div>
  );

  const maxTotal = maxMark * subjects.length;

  return (
    <div className="space-y-5">
      {/* Subject-wise */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-500" />
          <h3 className="font-bold text-gray-800">Subject-wise Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-gray-500 font-semibold">
                <th className="text-left py-3 px-5">Subject</th>
                <th className="py-3 px-4 text-center">Avg</th>
                <th className="py-3 px-4 text-center">Highest</th>
                <th className="py-3 px-4 text-center">Lowest</th>
                <th className="py-3 px-4 text-center">Pass %</th>
                <th className="py-3 px-4 min-w-[160px]">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, i) => {
                const vals    = students.map((s) => marks[`${s.id}::${sub}`] ?? 0);
                const avg     = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                const highest = Math.max(...vals);
                const lowest  = Math.min(...vals);
                const pass    = vals.filter((v) => (v / maxMark) * 100 >= 35).length;
                const passPct = Math.round((pass / vals.length) * 100);
                const avgPct  = Math.round((avg / maxMark) * 100);
                const color   = SUBJECT_COLORS[i % SUBJECT_COLORS.length];

                return (
                  <tr key={sub} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-gray-800">{sub}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">
                      {avg}<span className="text-gray-400 font-normal text-xs">/{maxMark}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{highest}</td>
                    <td className="py-3 px-4 text-center font-bold text-red-600">{lowest}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ color: barColor(passPct), backgroundColor: passPct >= 75 ? '#D1FAE5' : passPct >= 50 ? '#FEF3C7' : '#FEE2E2' }}>
                        {passPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${avgPct}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{avgPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student overall */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList size={16} className="text-violet-500" />
          <h3 className="font-bold text-gray-800">Student Overall Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-gray-500 font-semibold">
                <th className="text-left py-3 px-5">Student</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4 text-center">Total</th>
                <th className="py-3 px-4 min-w-[130px]">Score</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...students]
                .map((s) => {
                  const vals  = subjects.map((sub) => marks[`${s.id}::${sub}`] ?? 0);
                  const total = vals.reduce((a, b) => a + b, 0);
                  const pct   = maxTotal ? Math.round((total / maxTotal) * 100) : 0;
                  return { ...s, total, pct };
                })
                .sort((a, b) => b.pct - a.pct)
                .map((student, idx) => {
                  const pal = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                  return (
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: pal.bg, color: pal.tx }}>
                            {initials(student.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-400">Roll #{student.roll}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{student.batch}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-800">
                        {student.total}<span className="text-gray-400 font-normal text-xs">/{maxTotal}</span>
                      </td>
                      <td className="py-3 px-4"><PctBar pct={student.pct} /></td>
                      <td className="py-3 px-4 text-center"><GradeBadge pct={student.pct} /></td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          student.pct >= 35 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {student.pct >= 35 ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Results = () => {
  // ── Config state ──────────────────────────────────────────────────────────
  const [examType,    setExamType]    = useState('unit1');
  const [batchFilter, setBatchFilter] = useState('All');
  const [subjectSet,  setSubjectSet]  = useState('all');
  const [activeTab,   setActiveTab]   = useState('entry');

  // ── Data state ────────────────────────────────────────────────────────────
  const [students, setStudents] = useState(SEED_STUDENTS);
  const maxMark = EXAM_TYPES.find((e) => e.value === examType)?.max ?? 100;
  const [marks, setMarks] = useState(() => seedMarks(SEED_STUDENTS, maxMark));

  // ── Subjects ──────────────────────────────────────────────────────────────
  const subjects = subjectSet === 'all' ? ALL_SUBJECTS
    : ALL_SUBJECTS.filter((s) => s.toLowerCase().includes(subjectSet.toLowerCase()));

  // ── Filtered students ─────────────────────────────────────────────────────
  const visibleStudents = useMemo(
    () => batchFilter === 'All' ? students : students.filter((s) => s.batch === batchFilter),
    [students, batchFilter]
  );

  // ── UI state ──────────────────────────────────────────────────────────────
  const [toast,         setToast]         = useState(null);
  const [saved,         setSaved]         = useState(false);
  const [studentModal,  setStudentModal]  = useState(null);  // null | 'new' | student obj
  const [confirmDelete, setConfirmDelete] = useState(null);  // null | studentId

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleExamChange = (val) => {
    setExamType(val);
    const newMax = EXAM_TYPES.find((e) => e.value === val)?.max ?? 100;
    setMarks(seedMarks(students, newMax));
    setSaved(false);
  };

  const handleMarkChange = useCallback((studentId, subject, value) => {
    setMarks((prev) => ({ ...prev, [`${studentId}::${subject}`]: value }));
    setSaved(false);
  }, []);

  const handleSaveStudent = (data) => {
    if (students.find((s) => s.id === data.id)) {
      setStudents((prev) => prev.map((s) => s.id === data.id ? data : s));
      showToast('Student updated!');
    } else {
      setStudents((prev) => [...prev, data]);
      const newMax = EXAM_TYPES.find((e) => e.value === examType)?.max ?? 100;
      const extra = {};
      ALL_SUBJECTS.forEach((sub) => { extra[`${data.id}::${sub}`] = 0; });
      setMarks((prev) => ({ ...prev, ...extra }));
      showToast('Student added!');
    }
    setStudentModal(null);
  };

  const handleDeleteStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setMarks((prev) => {
      const next = { ...prev };
      ALL_SUBJECTS.forEach((sub) => delete next[`${id}::${sub}`]);
      return next;
    });
    setConfirmDelete(null);
    showToast('Student removed.');
  };

  const resetMarks = () => {
    setMarks(seedMarks(students, maxMark));
    setSaved(false);
    showToast('Marks reset to sample data.');
  };

  const saveMarks = () => {
    console.log('POST /api/marks', { examType, marks });
    setSaved(true);
    showToast('Marks saved successfully!');
  };

  const exportCSV = () => {
    const maxTotal = maxMark * subjects.length;
    const header   = ['Roll', 'Name', 'Batch', ...subjects, 'Total', '%', 'Grade'].join(',');
    const rows     = visibleStudents.map((s) => {
      const vals  = subjects.map((sub) => marks[`${s.id}::${sub}`] ?? 0);
      const total = vals.reduce((a, b) => a + b, 0);
      const pct   = maxTotal ? Math.round((total / maxTotal) * 100) : 0;
      const { grade } = gradeInfo(pct);
      return [s.roll, `"${s.name}"`, `"${s.batch}"`, ...vals, total, `${pct}%`, grade].join(',');
    });
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `results_${batchFilter}_${examType}.csv` }).click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!visibleStudents.length) return { avgPct: 0, passRate: 0, topScore: 0, maxTotal: 0 };
    const maxTotal = maxMark * subjects.length;
    const totals   = visibleStudents.map((s) =>
      subjects.reduce((sum, sub) => sum + (marks[`${s.id}::${sub}`] ?? 0), 0)
    );
    const avgPct   = maxTotal ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length / maxTotal * 100) : 0;
    const passRate = Math.round(totals.filter((t) => maxTotal && (t / maxTotal) * 100 >= 35).length / totals.length * 100);
    const topScore = maxTotal ? Math.round(Math.max(...totals) / maxTotal * 100) : 0;
    return { avgPct, passRate, topScore, maxTotal };
  }, [marks, subjects, maxMark, visibleStudents]);

  const examLabel = EXAM_TYPES.find((e) => e.value === examType)?.label ?? '';

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Result Management</h1>
          <p className="text-sm text-gray-400 mt-1">Enter, update and manage student marks — {examLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={resetMarks}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition">
            <RefreshCw size={14} /> Reset
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={saveMarks}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition shadow-md ${
              saved ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90'
            }`}>
            {saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? 'Saved' : 'Save Marks'}
          </button>
        </div>
      </div>

      {/* ── Filters Bar ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Select
          label="Exam Type"
          value={examType}
          onChange={handleExamChange}
          options={EXAM_TYPES.map((e) => ({ value: e.value, label: `${e.label} (/${e.max})` }))}
        />
        <Select
          label="Batch / Class"
          value={batchFilter}
          onChange={setBatchFilter}
          options={[{ value: 'All', label: 'All Batches' }, ...CLASSES_LIST.map((c) => ({ value: c, label: c }))]}
        />
        <Select
          label="Subject Filter"
          value={subjectSet}
          onChange={setSubjectSet}
          options={[
            { value: 'all',     label: 'All Subjects'   },
            { value: 'math',    label: 'Mathematics'    },
            { value: 'science', label: 'Science'        },
            { value: 'english', label: 'English'        },
            { value: 'hindi',   label: 'Hindi'          },
            { value: 'social',  label: 'Social Studies' },
            { value: 'comp',    label: 'Computer'       },
          ]}
        />
        <Select
          label="Academic Year"
          value="2024-25"
          onChange={() => {}}
          options={[
            { value: '2024-25', label: '2024 – 2025' },
            { value: '2023-24', label: '2023 – 2024' },
          ]}
        />
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Students"     value={visibleStudents.length}  accent="#4F46E5" />
        <StatCard icon={TrendingUp}  label="Class Avg"    value={`${stats.avgPct}%`}      accent="#059669" />
        <StatCard icon={Award}       label="Top Score"    value={`${stats.topScore}%`}    accent="#D97706" />
        <StatCard icon={CheckCircle} label="Pass Rate"    value={`${stats.passRate}%`}
          accent={stats.passRate >= 80 ? '#059669' : '#DC2626'} />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-gray-200">
        {[
          { key: 'entry',   label: 'Mark Entry',    icon: ClipboardList },
          { key: 'summary', label: 'Class Summary', icon: BarChart2     },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      {activeTab === 'entry' && (
        <MarkEntryTab
          students={visibleStudents}
          subjects={subjects}
          marks={marks}
          maxMark={maxMark}
          onMarkChange={handleMarkChange}
          onEditStudent={(s) => setStudentModal(s)}
          onDeleteStudent={(id) => setConfirmDelete(id)}
          onAddStudent={() => setStudentModal('new')}
        />
      )}
      {activeTab === 'summary' && (
        <SummaryTab students={visibleStudents} subjects={subjects} marks={marks} maxMark={maxMark} />
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {studentModal && (
        <StudentModal
          student={studentModal === 'new' ? null : studentModal}
          onSave={handleSaveStudent}
          onClose={() => setStudentModal(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="This will permanently remove the student and all their marks from this session."
          onConfirm={() => handleDeleteStudent(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-bounce-once">
          <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
};

export default Results;