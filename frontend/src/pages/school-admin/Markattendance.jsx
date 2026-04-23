// src/pages/school-admin/attendance/MarkAttendance.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, CheckCircle, XCircle, Clock, Search, Filter,
  Download, Upload, Printer, Save, RefreshCw, AlertCircle, Check,
  X, User, Phone, Mail, MapPin, Edit, Eye, MoreVertical, FileText,
  TrendingUp, Activity, Target, Award, Send, MessageSquare, ChevronDown,
  ChevronUp, Grid, List, Settings, Copy, Trash2, Plus, Minus, Info,
  UserCheck, UserX, UserMinus, BarChart3, PieChart, History, Bell,
} from 'lucide-react';

const MarkAttendance = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showStats, setShowStats] = useState(true);
  const [attendanceNotes, setAttendanceNotes] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNoteStudent, setCurrentNoteStudent] = useState(null);

  const classes = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];

  const attendanceStatuses = [
    { value: 'present', label: 'Present', icon: CheckCircle, color: 'green' },
    { value: 'absent', label: 'Absent', icon: XCircle, color: 'red' },
    { value: 'late', label: 'Late', icon: Clock, color: 'yellow' },
    { value: 'excused', label: 'Excused', icon: AlertCircle, color: 'blue' },
  ];

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterStatus]);

  const loadStudents = () => {
    setLoading(true);
    setTimeout(() => {
      const mockStudents = [
        {
          id: 1,
          studentId: 'STU2024001',
          firstName: 'John',
          lastName: 'Doe',
          rollNo: '101',
          photo: null,
          email: 'john.doe@school.com',
          phone: '+1 (555) 123-4567',
          parentPhone: '+1 (555) 123-4568',
          attendanceHistory: { present: 85, absent: 5, late: 8, excused: 2 },
          attendancePercentage: 85,
        },
        {
          id: 2,
          studentId: 'STU2024002',
          firstName: 'Emily',
          lastName: 'Johnson',
          rollNo: '102',
          photo: null,
          email: 'emily.johnson@school.com',
          phone: '+1 (555) 234-5678',
          parentPhone: '+1 (555) 234-5679',
          attendanceHistory: { present: 92, absent: 2, late: 4, excused: 2 },
          attendancePercentage: 92,
        },
        {
          id: 3,
          studentId: 'STU2024003',
          firstName: 'Michael',
          lastName: 'Williams',
          rollNo: '103',
          photo: null,
          email: 'michael.williams@school.com',
          phone: '+1 (555) 345-6789',
          parentPhone: '+1 (555) 345-6790',
          attendanceHistory: { present: 78, absent: 12, late: 6, excused: 4 },
          attendancePercentage: 78,
        },
        {
          id: 4,
          studentId: 'STU2024004',
          firstName: 'Sarah',
          lastName: 'Brown',
          rollNo: '104',
          photo: null,
          email: 'sarah.brown@school.com',
          phone: '+1 (555) 456-7890',
          parentPhone: '+1 (555) 456-7891',
          attendanceHistory: { present: 95, absent: 1, late: 3, excused: 1 },
          attendancePercentage: 95,
        },
        {
          id: 5,
          studentId: 'STU2024005',
          firstName: 'David',
          lastName: 'Martinez',
          rollNo: '105',
          photo: null,
          email: 'david.martinez@school.com',
          phone: '+1 (555) 567-8901',
          parentPhone: '+1 (555) 567-8902',
          attendanceHistory: { present: 88, absent: 4, late: 5, excused: 3 },
          attendancePercentage: 88,
        },
        {
          id: 6,
          studentId: 'STU2024006',
          firstName: 'Lisa',
          lastName: 'Anderson',
          rollNo: '106',
          photo: null,
          email: 'lisa.anderson@school.com',
          phone: '+1 (555) 678-9012',
          parentPhone: '+1 (555) 678-9013',
          attendanceHistory: { present: 90, absent: 3, late: 5, excused: 2 },
          attendancePercentage: 90,
        },
      ];

      setStudents(mockStudents);
      // Initialize attendance as empty for new date or load from saved data
      const initialAttendance = {};
      mockStudents.forEach(student => {
        initialAttendance[student.id] = null;
      });
      setAttendance(initialAttendance);
      setLoading(false);
    }, 800);
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.includes(searchTerm) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => attendance[student.id] === filterStatus);
    }

    setFilteredStudents(filtered);
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };

  const handleBulkAttendance = (status) => {
    const updates = {};
    selectedStudents.forEach(studentId => {
      updates[studentId] = status;
    });
    setAttendance(prev => ({ ...prev, ...updates }));
    setSelectedStudents(new Set());
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const markAllPresent = () => {
    const updates = {};
    students.forEach(student => {
      updates[student.id] = 'present';
    });
    setAttendance(updates);
  };

  const markAllAbsent = () => {
    const updates = {};
    students.forEach(student => {
      updates[student.id] = 'absent';
    });
    setAttendance(updates);
  };

  const clearAttendance = () => {
    if (confirm('Are you sure you want to clear all attendance records?')) {
      const cleared = {};
      students.forEach(student => {
        cleared[student.id] = null;
      });
      setAttendance(cleared);
    }
  };

  const handleSaveAttendance = () => {
    setSaving(true);
    setTimeout(() => {
      console.log('Saving attendance:', {
        class: selectedClass,
        section: selectedSection,
        date: selectedDate,
        attendance,
        notes: attendanceNotes,
      });
      setSaving(false);
      alert('Attendance saved successfully!');
    }, 1500);
  };

  const handleExport = () => {
    alert('Exporting attendance data...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendNotifications = () => {
    const absentStudents = students.filter(s => attendance[s.id] === 'absent');
    if (absentStudents.length === 0) {
      alert('No absent students to notify');
      return;
    }
    alert(`Sending notifications to ${absentStudents.length} absent student(s) parents`);
  };

  const addNote = (studentId, note) => {
    setAttendanceNotes(prev => ({
      ...prev,
      [studentId]: note
    }));
  };

  const calculateStats = () => {
    const stats = {
      total: students.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0,
    };

    students.forEach(student => {
      const status = attendance[student.id];
      if (status) {
        stats[status]++;
      } else {
        stats.unmarked++;
      }
    });

    stats.markedPercentage = stats.total > 0 ? Math.round(((stats.total - stats.unmarked) / stats.total) * 100) : 0;
    stats.presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    return stats;
  };

  const stats = calculateStats();

  if (!selectedClass || !selectedSection) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
              <p className="text-gray-600">Select a class and section to begin</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Select Date" required>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => selectedClass && selectedSection && loadStudents()}
                  disabled={!selectedClass || !selectedSection}
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
              <p className="text-gray-600 mt-1">
                {selectedClass} - Section {selectedSection} • {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedClass('');
                setSelectedSection('');
                setStudents([]);
                setAttendance({});
              }}
              className="mt-4 md:mt-0 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Change Class/Section
            </button>
          </div>

          {/* Statistics */}
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <StatCard
                icon={Users}
                label="Total Students"
                value={stats.total}
                color="blue"
              />
              <StatCard
                icon={CheckCircle}
                label="Present"
                value={stats.present}
                color="green"
                percentage={stats.presentPercentage}
              />
              <StatCard
                icon={XCircle}
                label="Absent"
                value={stats.absent}
                color="red"
              />
              <StatCard
                icon={Clock}
                label="Late"
                value={stats.late}
                color="yellow"
              />
              <StatCard
                icon={AlertCircle}
                label="Excused"
                value={stats.excused}
                color="blue"
              />
              <StatCard
                icon={Target}
                label="Unmarked"
                value={stats.unmarked}
                color="gray"
              />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <button
                onClick={markAllPresent}
                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>All Present</span>
              </button>

              <button
                onClick={markAllAbsent}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center space-x-2"
              >
                <UserX className="w-4 h-4" />
                <span>All Absent</span>
              </button>

              <button
                onClick={clearAttendance}
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear</span>
              </button>

              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleExport}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Export"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={handlePrint}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Print"
              >
                <Printer className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedStudents.size} student(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-800">Mark as:</span>
                    {attendanceStatuses.map(status => (
                      <button
                        key={status.value}
                        onClick={() => handleBulkAttendance(status.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1 bg-${status.color}-100 text-${status.color}-700 hover:bg-${status.color}-200`}
                      >
                        <status.icon className="w-4 h-4" />
                        <span>{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudents(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Filter Status */}
          <div className="mt-4 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Filter:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-sm ${filterStatus === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
            >
              All ({students.length})
            </button>
            {attendanceStatuses.map(status => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-3 py-1 rounded-full text-sm ${filterStatus === status.value ? `bg-${status.color}-100 text-${status.color}-700` : 'bg-gray-100 text-gray-600'}`}
              >
                {status.label} ({stats[status.value] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Students Grid/List */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 'No students in this class/section'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                status={attendance[student.id]}
                onStatusChange={(status) => handleAttendanceChange(student.id, status)}
                isSelected={selectedStudents.has(student.id)}
                onSelect={() => handleSelectStudent(student.id)}
                note={attendanceNotes[student.id]}
                onAddNote={(note) => addNote(student.id, note)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <StudentTable
              students={filteredStudents}
              attendance={attendance}
              onStatusChange={handleAttendanceChange}
              selectedStudents={selectedStudents}
              onSelectStudent={handleSelectStudent}
              onSelectAll={handleSelectAll}
              notes={attendanceNotes}
              onAddNote={addNote}
            />
          </div>
        )}

        {/* Save Button */}
        {students.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{stats.total - stats.unmarked}</span> of <span className="font-semibold">{stats.total}</span> students marked
                </div>
                {stats.unmarked > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">
                    <AlertCircle className="w-4 h-4" />
                    <span>{stats.unmarked} student(s) not marked</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSendNotifications}
                  disabled={stats.absent === 0}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Notify Parents</span>
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving || stats.unmarked === stats.total}
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
                      <span>Save Attendance</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color, percentage }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm opacity-90">{label}</span>
        <Icon className="w-5 h-5 opacity-90" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {percentage !== undefined && (
        <p className="text-xs opacity-75 mt-1">{percentage}%</p>
      )}
    </div>
  );
};

const StudentCard = ({ student, status, onStatusChange, isSelected, onSelect, note, onAddNote }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(note || '');

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'border-green-500 bg-green-50';
      case 'absent': return 'border-red-500 bg-red-50';
      case 'late': return 'border-yellow-500 bg-yellow-50';
      case 'excused': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden transition-all border-2 ${getStatusColor(status)} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm opacity-90">Roll: {student.rollNo}</span>
          </div>
          <span className="text-sm opacity-90">{student.studentId}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
            {student.photo ? (
              <img src={student.photo} alt={student.firstName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold">{student.firstName} {student.lastName}</h3>
            <p className="text-xs opacity-90">Attendance: {student.attendancePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Attendance Buttons */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => onStatusChange('present')}
            className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
              status === 'present'
                ? 'border-green-500 bg-green-100 text-green-700'
                : 'border-gray-200 hover:border-green-300 text-gray-600'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Present</span>
          </button>
          <button
            onClick={() => onStatusChange('absent')}
            className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
              status === 'absent'
                ? 'border-red-500 bg-red-100 text-red-700'
                : 'border-gray-200 hover:border-red-300 text-gray-600'
            }`}
          >
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Absent</span>
          </button>
          <button
            onClick={() => onStatusChange('late')}
            className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
              status === 'late'
                ? 'border-yellow-500 bg-yellow-100 text-yellow-700'
                : 'border-gray-200 hover:border-yellow-300 text-gray-600'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Late</span>
          </button>
          <button
            onClick={() => onStatusChange('excused')}
            className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
              status === 'excused'
                ? 'border-blue-500 bg-blue-100 text-blue-700'
                : 'border-gray-200 hover:border-blue-300 text-gray-600'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Excused</span>
          </button>
        </div>

        {/* Note Section */}
        <div className="border-t pt-3">
          {note || showNoteInput ? (
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowNoteInput(false);
                    setNoteText(note || '');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAddNote(noteText);
                    setShowNoteInput(false);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Note
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNoteInput(true)}
              className="w-full text-sm text-gray-600 hover:text-blue-600 flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentTable = ({ students, attendance, onStatusChange, selectedStudents, onSelectStudent, onSelectAll, notes, onAddNote }) => {
  const allSelected = students.length > 0 && selectedStudents.size === students.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="w-4 h-4 rounded"
              />
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roll No</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendance %</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student.id} className={`hover:bg-gray-50 ${selectedStudents.has(student.id) ? 'bg-blue-50' : ''}`}>
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedStudents.has(student.id)}
                  onChange={() => onSelectStudent(student.id)}
                  className="w-4 h-4 rounded"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {student.photo ? (
                      <img src={student.photo} alt={student.firstName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-gray-500">{student.studentId}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-gray-900">{student.rollNo}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12">
                    <svg className="transform -rotate-90 w-12 h-12">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke={student.attendancePercentage >= 90 ? '#10b981' : student.attendancePercentage >= 75 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${student.attendancePercentage * 1.257} ${125.7 - student.attendancePercentage * 1.257}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="ml-2 text-sm font-semibold">{student.attendancePercentage}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-center space-x-1">
                  <button
                    onClick={() => onStatusChange(student.id, 'present')}
                    className={`p-2 rounded-lg ${attendance[student.id] === 'present' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Present"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onStatusChange(student.id, 'absent')}
                    className={`p-2 rounded-lg ${attendance[student.id] === 'absent' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Absent"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onStatusChange(student.id, 'late')}
                    className={`p-2 rounded-lg ${attendance[student.id] === 'late' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Late"
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onStatusChange(student.id, 'excused')}
                    className={`p-2 rounded-lg ${attendance[student.id] === 'excused' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Excused"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Add Note"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

export default MarkAttendance;