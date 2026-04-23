// src/pages/teacher/results/GradeBook.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Upload, Save, Search, Filter, Plus, Edit, Eye,
  TrendingUp, TrendingDown, Award, AlertCircle, CheckCircle, BarChart3,
  Users, BookOpen, FileText, Printer, RefreshCw, ChevronDown, ChevronUp,
  Lock, Unlock, Send, X, Check, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const GradeBook = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedExam, setSelectedExam] = useState('current');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isLocked, setIsLocked] = useState(false);

  const exams = [
    { value: 'current', label: 'Current Term' },
    { value: 'q1', label: 'Quarter 1' },
    { value: 'q2', label: 'Quarter 2' },
    { value: 'mid', label: 'Mid-Term' },
    { value: 'q3', label: 'Quarter 3' },
    { value: 'annual', label: 'Annual' },
  ];

  const classes = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const sections = ['A', 'B', 'C', 'D'];

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'];

  const [students, setStudents] = useState([
    {
      id: 1, name: 'Aarav Kumar', rollNo: '2024-10A-001', section: 'A', avatar: '👦',
      grades: { Mathematics: 92, Physics: 88, Chemistry: 90, English: 85, History: 78, 'Computer Science': 95 },
      attendance: 96, behavior: 'Excellent',
    },
    {
      id: 2, name: 'Priya Sharma', rollNo: '2024-10A-002', section: 'A', avatar: '👧',
      grades: { Mathematics: 88, Physics: 92, Chemistry: 85, English: 90, History: 82, 'Computer Science': 78 },
      attendance: 94, behavior: 'Good',
    },
    {
      id: 3, name: 'Rohan Verma', rollNo: '2024-10A-003', section: 'A', avatar: '👦',
      grades: { Mathematics: 75, Physics: 70, Chemistry: 72, English: 80, History: 88, 'Computer Science': 82 },
      attendance: 88, behavior: 'Good',
    },
    {
      id: 4, name: 'Ananya Singh', rollNo: '2024-10A-004', section: 'A', avatar: '👧',
      grades: { Mathematics: 95, Physics: 94, Chemistry: 96, English: 92, History: 90, 'Computer Science': 98 },
      attendance: 99, behavior: 'Excellent',
    },
    {
      id: 5, name: 'Vikram Patel', rollNo: '2024-10A-005', section: 'A', avatar: '👦',
      grades: { Mathematics: 60, Physics: 55, Chemistry: 62, English: 70, History: 65, 'Computer Science': 72 },
      attendance: 82, behavior: 'Needs Improvement',
    },
    {
      id: 6, name: 'Sneha Reddy', rollNo: '2024-10A-006', section: 'A', avatar: '👧',
      grades: { Mathematics: 82, Physics: 79, Chemistry: 84, English: 88, History: 91, 'Computer Science': 86 },
      attendance: 95, behavior: 'Good',
    },
    {
      id: 7, name: 'Arjun Mehta', rollNo: '2024-10A-007', section: 'A', avatar: '👦',
      grades: { Mathematics: 78, Physics: 82, Chemistry: 75, English: 72, History: 80, 'Computer Science': 90 },
      attendance: 91, behavior: 'Good',
    },
    {
      id: 8, name: 'Zara Khan', rollNo: '2024-10A-008', section: 'A', avatar: '👧',
      grades: { Mathematics: 90, Physics: 86, Chemistry: 88, English: 94, History: 85, 'Computer Science': 82 },
      attendance: 97, behavior: 'Excellent',
    },
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  // ─── Helpers ────────────────────────────────────────
  const calcAverage = (grades) => {
    const vals = Object.values(grades);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
  };

  const getLetterGrade = (avg) => {
    if (avg >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-100' };
    if (avg >= 85) return { grade: 'A',  color: 'text-emerald-700 bg-emerald-100' };
    if (avg >= 80) return { grade: 'A-', color: 'text-green-700 bg-green-100' };
    if (avg >= 75) return { grade: 'B+', color: 'text-blue-700 bg-blue-100' };
    if (avg >= 70) return { grade: 'B',  color: 'text-blue-700 bg-blue-100' };
    if (avg >= 65) return { grade: 'B-', color: 'text-blue-700 bg-blue-100' };
    if (avg >= 60) return { grade: 'C',  color: 'text-yellow-700 bg-yellow-100' };
    if (avg >= 55) return { grade: 'D',  color: 'text-orange-700 bg-orange-100' };
    return { grade: 'F', color: 'text-red-700 bg-red-100' };
  };

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-800';
    if (score >= 70) return 'bg-blue-50 text-blue-800';
    if (score >= 60) return 'bg-yellow-50 text-yellow-800';
    return 'bg-red-50 text-red-800';
  };

  const classAvg = (subj) => {
    const vals = students.map(s => s.grades[subj]).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
  };

  const classHighest = (subj) => Math.max(...students.map(s => s.grades[subj] || 0));
  const classLowest  = (subj) => Math.min(...students.map(s => s.grades[subj] || 0));

  // ─── Filtering / Sorting ────────────────────────────
  const filtered = students
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSection = selectedSection === 'all' || s.section === selectedSection;
      return matchSearch && matchSection;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = sortConfig.key === 'average' ? calcAverage(a.grades) : (a[sortConfig.key] || a.grades[sortConfig.key] || 0);
      const bVal = sortConfig.key === 'average' ? calcAverage(b.grades) : (b[sortConfig.key] || b.grades[sortConfig.key] || 0);
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ChevronDown size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className="text-indigo-600" />
      : <ChevronDown size={14} className="text-indigo-600" />;
  };

  // ─── Inline Edit ────────────────────────────────────
  const startEdit = (studentId, subject, currentVal) => {
    if (isLocked) return;
    setEditingCell({ studentId, subject });
    setEditValue(String(currentVal));
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const val = Math.min(100, Math.max(0, parseInt(editValue) || 0));
    setStudents(prev =>
      prev.map(s =>
        s.id === editingCell.studentId
          ? { ...s, grades: { ...s.grades, [editingCell.subject]: val } }
          : s
      )
    );
    setEditingCell(null);
    toast.success('Grade updated');
  };

  // ─── Publish ────────────────────────────────────────
  const handlePublish = () => {
    toast.success('Grades published to students & parents');
    setShowPublishModal(false);
    setIsLocked(true);
  };

  // ─── Student Report Modal ───────────────────────────
  const renderReportModal = () => {
    if (!selectedStudent) return null;
    const avg = calcAverage(selectedStudent.grades);
    const { grade, color } = getLetterGrade(avg);
    const rank = [...students]
      .sort((a, b) => calcAverage(b.grades) - calcAverage(a.grades))
      .findIndex(s => s.id === selectedStudent.id) + 1;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Student Report Card</h2>
              <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-white/20 rounded-lg">
                <X size={22} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                {selectedStudent.avatar}
              </div>
              <div>
                <p className="text-lg font-bold">{selectedStudent.name}</p>
                <p className="text-sm opacity-80">{selectedStudent.rollNo} • Attendance: {selectedStudent.attendance}%</p>
              </div>
              <div className="ml-auto text-center">
                <p className={`text-4xl font-bold`}>{avg}%</p>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white text-indigo-700`}>{grade}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Rank + Behavior */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Class Rank</p>
                <p className="text-2xl font-bold text-indigo-700">#{rank}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Attendance</p>
                <p className="text-2xl font-bold text-green-700">{selectedStudent.attendance}%</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Behavior</p>
                <p className="text-sm font-bold text-purple-700">{selectedStudent.behavior}</p>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Subject Breakdown</h3>
              <div className="space-y-3">
                {subjects.map(subj => {
                  const score = selectedStudent.grades[subj];
                  const { grade: sg, color: sc } = getLetterGrade(score);
                  return (
                    <div key={subj} className="flex items-center gap-3">
                      <p className="text-sm font-medium text-gray-700 w-40">{subj}</p>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-10 text-right">{score}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc} w-10 text-center`}>{sg}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">
                Close
              </button>
              <button
                onClick={() => { toast.success('Report downloaded'); setSelectedStudent(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={32} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher/results')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grade Book</h1>
              <p className="text-sm text-gray-500">Manage and publish student grades</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLocked(!isLocked)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              {isLocked ? 'Locked' : 'Unlocked'}
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Upload size={16} /> Import
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Download size={16} /> Export
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Printer size={16} /> Print
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              <Send size={16} /> Publish Grades
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
            {exams.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><Users size={24} /><span className="text-3xl font-bold">{students.length}</span></div>
          <p className="text-sm opacity-90">Total Students</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><Award size={24} /><span className="text-3xl font-bold">
            {calcAverage(students.reduce((acc, s) => {
              subjects.forEach(sub => { acc[sub] = (acc[sub] || 0) + (s.grades[sub] || 0); });
              return acc;
            }, {}).constructor === Object ? Object.fromEntries(subjects.map(sub => [sub, students.reduce((a, s) => a + (s.grades[sub] || 0), 0) / students.length])) : {})}
          </span></div>
          <p className="text-sm opacity-90">Class Average</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><TrendingUp size={24} /><span className="text-3xl font-bold">
            {students.filter(s => parseFloat(calcAverage(s.grades)) >= 85).length}
          </span></div>
          <p className="text-sm opacity-90">Honor Roll</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2"><AlertCircle size={24} /><span className="text-3xl font-bold">
            {students.filter(s => parseFloat(calcAverage(s.grades)) < 60).length}
          </span></div>
          <p className="text-sm opacity-90">Need Attention</p>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1">Student <SortIcon col="name" /></button>
                </th>
                {subjects.map(subj => (
                  <th key={subj} className="px-3 py-3 text-center font-semibold text-gray-600 min-w-[100px]">
                    <button onClick={() => handleSort(subj)} className="flex flex-col items-center gap-0.5 mx-auto">
                      <span className="flex items-center gap-1">{subj.split(' ')[0]} <SortIcon col={subj} /></span>
                      <span className="text-xs font-normal text-gray-400">Avg: {classAvg(subj)}</span>
                    </button>
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-semibold text-gray-600 min-w-[90px] sticky right-0 bg-gray-50 z-10">
                  <button onClick={() => handleSort('average')} className="flex items-center gap-1">
                    Avg <SortIcon col="average" />
                  </button>
                </th>
                <th className="px-3 py-3 text-center font-semibold text-gray-600 min-w-[70px] sticky right-0 bg-gray-50 z-10">Grade</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-600 min-w-[70px] sticky right-0 bg-gray-50 z-10">Action</th>
              </tr>

              {/* Class Stats Row */}
              <tr className="bg-indigo-50 border-b border-indigo-100">
                <td className="px-4 py-2 text-xs font-bold text-indigo-700 sticky left-0 bg-indigo-50">Class Stats</td>
                {subjects.map(subj => (
                  <td key={subj} className="px-3 py-2 text-center">
                    <p className="text-xs text-indigo-700 font-semibold">Avg: {classAvg(subj)}</p>
                    <p className="text-xs text-green-600">H: {classHighest(subj)}</p>
                    <p className="text-xs text-red-600">L: {classLowest(subj)}</p>
                  </td>
                ))}
                <td className="px-3 py-2 text-center text-xs font-bold text-indigo-700">—</td>
                <td className="px-3 py-2 text-center text-xs font-bold text-indigo-700">—</td>
                <td className="px-3 py-2" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((student, idx) => {
                const avg = calcAverage(student.grades);
                const { grade, color } = getLetterGrade(avg);
                return (
                  <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${parseFloat(avg) < 60 ? 'bg-red-50/40' : ''}`}>
                    {/* Student Name */}
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-lg">
                          {student.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.rollNo}</p>
                        </div>
                      </div>
                    </td>

                    {/* Subject Grades */}
                    {subjects.map(subj => {
                      const score = student.grades[subj];
                      const isEditing = editingCell?.studentId === student.id && editingCell?.subject === subj;
                      return (
                        <td key={subj} className="px-2 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                autoFocus
                                type="number"
                                min="0"
                                max="100"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingCell(null); }}
                                className="w-14 px-2 py-1 border border-indigo-400 rounded-lg text-center text-sm focus:ring-2 focus:ring-indigo-500"
                              />
                              <button onClick={saveEdit} className="text-green-600 hover:text-green-800"><Check size={16} /></button>
                              <button onClick={() => setEditingCell(null)} className="text-red-600 hover:text-red-800"><X size={16} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(student.id, subj, score)}
                              className={`w-14 py-1 rounded-lg text-sm font-bold transition-colors hover:ring-2 hover:ring-indigo-300 ${getScoreBg(score)} ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              {score}
                            </button>
                          )}
                        </td>
                      );
                    })}

                    {/* Average */}
                    <td className="px-3 py-3 text-center font-bold text-gray-900 sticky right-0 bg-white z-10">{avg}</td>

                    {/* Letter Grade */}
                    <td className="px-3 py-3 text-center sticky right-0 bg-white z-10">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>{grade}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-center sticky right-0 bg-white z-10">
                      <button onClick={() => setSelectedStudent(student)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No students found</p>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Publish Grades</h2>
                <button onClick={() => setShowPublishModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={22} /></button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Publishing grades will notify all <strong>{students.length} students</strong> and their parents.
                    This action will lock the grade sheet.
                  </p>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Notify Students via Email</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Notify Parents via Email</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Send SMS Notification</span>
                  <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Lock Grade Sheet After Publish</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPublishModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">Cancel</button>
                <button onClick={handlePublish} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                  <Send size={16} /> Publish Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Report Modal */}
      {selectedStudent && renderReportModal()}
    </div>
  );
};

export default GradeBook;