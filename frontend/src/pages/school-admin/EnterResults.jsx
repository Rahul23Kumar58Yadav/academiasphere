// src/pages/school-admin/results/EnterResults.jsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit, Save, Check, X, Upload, Download, Search,
  Filter, Users, Calendar, FileText, AlertCircle, CheckCircle,
  TrendingUp, Award, Target, BarChart3, RefreshCw, Printer,
  Eye, ChevronDown, ChevronUp, Grid, List, Copy, Trash2, Lock,
  Unlock, Send, Mail, Clock, Info, Star, Calculator, Percent,
} from 'lucide-react';

const EnterResults = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showStats, setShowStats] = useState(true);

  const classes = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physical Education', 'Arts'];
  const exams = ['Unit Test 1', 'Unit Test 2', 'Midterm', 'Unit Test 3', 'Final Exam', 'Practical Exam'];

  const gradingScale = [
    { grade: 'A+', min: 90, max: 100, gpa: 4.0 },
    { grade: 'A', min: 85, max: 89, gpa: 3.7 },
    { grade: 'B+', min: 80, max: 84, gpa: 3.3 },
    { grade: 'B', min: 75, max: 79, gpa: 3.0 },
    { grade: 'C+', min: 70, max: 74, gpa: 2.7 },
    { grade: 'C', min: 65, max: 69, gpa: 2.3 },
    { grade: 'D', min: 60, max: 64, gpa: 2.0 },
    { grade: 'F', min: 0, max: 59, gpa: 0 },
  ];

  useEffect(() => {
    if (selectedClass && selectedSection && selectedSubject && selectedExam) {
      loadStudents();
    }
  }, [selectedClass, selectedSection, selectedSubject, selectedExam]);

  const loadStudents = () => {
    setLoading(true);
    setTimeout(() => {
      // Mock student data
      const mockStudents = [
        { id: 1, rollNo: '101', studentId: 'STU2024001', name: 'John Doe', previousScore: 85 },
        { id: 2, rollNo: '102', studentId: 'STU2024002', name: 'Emily Johnson', previousScore: 92 },
        { id: 3, rollNo: '103', studentId: 'STU2024003', name: 'Michael Williams', previousScore: 78 },
        { id: 4, rollNo: '104', studentId: 'STU2024004', name: 'Sarah Brown', previousScore: 95 },
        { id: 5, rollNo: '105', studentId: 'STU2024005', name: 'David Martinez', previousScore: 88 },
        { id: 6, rollNo: '106', studentId: 'STU2024006', name: 'Lisa Anderson', previousScore: 90 },
        { id: 7, rollNo: '107', studentId: 'STU2024007', name: 'James Wilson', previousScore: 82 },
        { id: 8, rollNo: '108', studentId: 'STU2024008', name: 'Jennifer Taylor', previousScore: 87 },
      ];

      setStudents(mockStudents);
      
      // Initialize results
      const initialResults = {};
      mockStudents.forEach(student => {
        initialResults[student.id] = {
          marksObtained: '',
          totalMarks: 100,
          grade: '',
          gpa: '',
          remarks: '',
          absent: false,
        };
      });
      setResults(initialResults);
      setLoading(false);
    }, 800);
  };

  const calculateGrade = (marks, total) => {
    const percentage = (marks / total) * 100;
    const gradeInfo = gradingScale.find(g => percentage >= g.min && percentage <= g.max);
    return gradeInfo || { grade: 'N/A', gpa: 0 };
  };

  const handleScoreChange = (studentId, value) => {
    const score = value === '' ? '' : parseFloat(value);
    const totalMarks = results[studentId].totalMarks;

    // Validation
    const errors = { ...validationErrors };
    if (score !== '' && (score < 0 || score > totalMarks)) {
      errors[studentId] = `Score must be between 0 and ${totalMarks}`;
    } else {
      delete errors[studentId];
    }
    setValidationErrors(errors);

    if (score !== '' && score >= 0 && score <= totalMarks) {
      const { grade, gpa } = calculateGrade(score, totalMarks);
      setResults({
        ...results,
        [studentId]: {
          ...results[studentId],
          marksObtained: score,
          grade,
          gpa,
        }
      });
    } else {
      setResults({
        ...results,
        [studentId]: {
          ...results[studentId],
          marksObtained: value,
          grade: '',
          gpa: '',
        }
      });
    }
  };

  const handleAbsentToggle = (studentId) => {
    const isAbsent = !results[studentId].absent;
    setResults({
      ...results,
      [studentId]: {
        ...results[studentId],
        absent: isAbsent,
        marksObtained: isAbsent ? 0 : '',
        grade: isAbsent ? 'AB' : '',
        gpa: isAbsent ? 0 : '',
      }
    });
  };

  const handleRemarksChange = (studentId, value) => {
    setResults({
      ...results,
      [studentId]: {
        ...results[studentId],
        remarks: value,
      }
    });
  };

  const handleSaveResults = () => {
    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix validation errors before saving');
      return;
    }

    // Check if all students have scores entered
    const incomplete = students.filter(s => 
      results[s.id].marksObtained === '' && !results[s.id].absent
    );

    if (incomplete.length > 0) {
      if (!confirm(`${incomplete.length} student(s) don't have scores. Continue saving?`)) {
        return;
      }
    }

    setSaving(true);
    setTimeout(() => {
      console.log('Saving results:', results);
      setSaving(false);
      alert('Results saved successfully!');
      setEditMode(false);
    }, 1500);
  };

  const handlePublishResults = () => {
    if (confirm('Publish results? Students and parents will be notified.')) {
      console.log('Publishing results:', results);
      alert('Results published successfully!');
    }
  };

  const handleBulkUpload = (file) => {
    console.log('Processing bulk upload:', file);
    setShowBulkUpload(false);
    alert('Bulk upload processed successfully!');
  };

  const calculateStats = () => {
    const validScores = Object.values(results)
      .filter(r => r.marksObtained !== '' && !r.absent)
      .map(r => parseFloat(r.marksObtained));

    if (validScores.length === 0) return null;

    const total = validScores.reduce((sum, score) => sum + score, 0);
    const average = total / validScores.length;
    const highest = Math.max(...validScores);
    const lowest = Math.min(...validScores);
    const passed = validScores.filter(s => s >= 60).length;
    const failed = validScores.filter(s => s < 60).length;
    const absent = Object.values(results).filter(r => r.absent).length;

    return {
      total: students.length,
      entered: validScores.length,
      average: average.toFixed(2),
      highest,
      lowest,
      passed,
      failed,
      absent,
      passPercentage: ((passed / validScores.length) * 100).toFixed(1),
    };
  };

  const stats = calculateStats();

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.includes(searchTerm) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedClass || !selectedSection || !selectedSubject || !selectedExam) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter Exam Results</h1>
              <p className="text-gray-600">Select class, section, subject, and exam to begin</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Select Class" required>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Select Section" required>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedClass}
                  >
                    <option value="">Choose section</option>
                    {sections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Select Subject" required>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedSection}
                  >
                    <option value="">Choose subject</option>
                    {subjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Select Exam" required>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedSubject}
                  >
                    <option value="">Choose exam</option>
                    {exams.map(exam => (
                      <option key={exam} value={exam}>{exam}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={loadStudents}
                  disabled={!selectedClass || !selectedSection || !selectedSubject || !selectedExam}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>Load Students</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enter Exam Results</h1>
              <p className="text-gray-600 mt-1">
                {selectedClass} - Section {selectedSection} • {selectedSubject} • {selectedExam}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedClass('');
                setSelectedSection('');
                setSelectedSubject('');
                setSelectedExam('');
                setStudents([]);
                setResults({});
              }}
              className="mt-4 md:mt-0 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Change Selection
            </button>
          </div>

          {/* Statistics */}
          {showStats && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
              <StatCard icon={Users} label="Total" value={stats.total} color="blue" />
              <StatCard icon={CheckCircle} label="Entered" value={stats.entered} color="green" />
              <StatCard icon={Calculator} label="Average" value={`${stats.average}%`} color="purple" />
              <StatCard icon={TrendingUp} label="Highest" value={stats.highest} color="emerald" />
              <StatCard icon={Target} label="Lowest" value={stats.lowest} color="orange" />
              <StatCard icon={Award} label="Passed" value={stats.passed} color="green" />
              <StatCard icon={X} label="Failed" value={stats.failed} color="red" />
              <StatCard icon={AlertCircle} label="Absent" value={stats.absent} color="yellow" />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  editMode
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                    : 'bg-gray-50 text-gray-700 border border-gray-300'
                }`}
              >
                {editMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{editMode ? 'Editing' : 'Locked'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={() => alert('Download template')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Printer className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Grading Scale Reference */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Grading Scale Reference</h3>
          <div className="flex flex-wrap gap-2">
            {gradingScale.map(scale => (
              <div key={scale.grade} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="font-bold text-gray-900">{scale.grade}</span>
                <span className="text-xs text-gray-600 ml-2">({scale.min}-{scale.max}%)</span>
                <span className="text-xs text-gray-500 ml-2">GPA: {scale.gpa}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Previous</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Marks Obtained</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Marks</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">GPA</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Remarks</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const result = results[student.id];
                  const percentage = result.marksObtained !== '' 
                    ? ((result.marksObtained / result.totalMarks) * 100).toFixed(1)
                    : '';
                  const hasError = validationErrors[student.id];

                  return (
                    <tr key={student.id} className={`hover:bg-gray-50 ${result.absent ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.rollNo}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">{student.previousScore || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={result.marksObtained}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          disabled={!editMode || result.absent}
                          className={`w-24 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 ${
                            hasError
                              ? 'border-red-300 focus:ring-red-500 bg-red-50'
                              : 'border-gray-300 focus:ring-blue-500'
                          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                          min="0"
                          max={result.totalMarks}
                          step="0.5"
                        />
                        {hasError && (
                          <p className="text-xs text-red-600 mt-1">{hasError}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">{result.totalMarks}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {percentage ? `${percentage}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          result.grade === 'AB' ? 'bg-yellow-100 text-yellow-700' :
                          result.grade.includes('A') ? 'bg-green-100 text-green-700' :
                          result.grade.includes('B') ? 'bg-blue-100 text-blue-700' :
                          result.grade.includes('C') ? 'bg-yellow-100 text-yellow-700' :
                          result.grade === 'F' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {result.grade || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {result.gpa !== '' ? result.gpa : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={result.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Add remarks..."
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={result.absent}
                          onChange={() => handleAbsentToggle(student.id)}
                          disabled={!editMode}
                          className="w-4 h-4 text-blue-600 rounded disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Actions */}
        {editMode && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {Object.keys(validationErrors).length > 0 && (
                  <div className="flex items-center space-x-2 text-red-700 bg-red-50 px-4 py-2 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {Object.keys(validationErrors).length} validation error(s)
                    </span>
                  </div>
                )}
                {stats && stats.entered < stats.total && (
                  <div className="flex items-center space-x-2 text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg">
                    <Info className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {stats.total - stats.entered} student(s) pending
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePublishResults}
                  disabled={saving || Object.keys(validationErrors).length > 0}
                  className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish & Notify</span>
                </button>
                <button
                  onClick={handleSaveResults}
                  disabled={saving || Object.keys(validationErrors).length > 0}
                  className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Results</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onUpload={handleBulkUpload}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-lg p-3 shadow`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs opacity-90">{label}</span>
        <Icon className="w-4 h-4 opacity-90" />
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

const BulkUploadModal = ({ onClose, onUpload }) => {
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Bulk Upload Results</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Upload Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Download the template file first</li>
                    <li>Fill in the marks for each student</li>
                    <li>Upload the completed Excel/CSV file</li>
                    <li>System will validate and import the data</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Choose File
              </label>
              {file && (
                <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={() => alert('Download template')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Upload & Import
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

export default EnterResults;