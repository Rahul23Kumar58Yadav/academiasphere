import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  TrendingUp,
  TrendingDown,
  Mail,
  Phone,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  MoreVertical,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyStudents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [filterAttendance, setFilterAttendance] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'Aarav Kumar',
      rollNumber: '2024-10A-025',
      class: 'Grade 10-A',
      grade: 10,
      section: 'A',
      email: 'aarav.kumar@student.edu',
      phone: '+91 98765 43210',
      parentName: 'Rajesh Kumar',
      parentPhone: '+91 98765 43211',
      avatar: '👦',
      attendance: 94.5,
      performance: 87.5,
      trend: 'up',
      trendValue: 5.2,
      recentActivity: 'Submitted Assignment - Quadratic Equations',
      lastActive: '2 hours ago',
      subjects: {
        Mathematics: 92,
        Science: 88,
        English: 85,
        Hindi: 90,
        'Social Studies': 86
      },
      pendingAssignments: 2,
      completedAssignments: 18,
      status: 'active',
      behaviorRating: 'excellent',
      healthStatus: 'good'
    },
    {
      id: 2,
      name: 'Diya Sharma',
      rollNumber: '2024-9B-018',
      class: 'Grade 9-B',
      grade: 9,
      section: 'B',
      email: 'diya.sharma@student.edu',
      phone: '+91 98765 43220',
      parentName: 'Amit Sharma',
      parentPhone: '+91 98765 43221',
      avatar: '👧',
      attendance: 96.2,
      performance: 82.3,
      trend: 'up',
      trendValue: 3.1,
      recentActivity: 'Completed Lab Report - Chemical Reactions',
      lastActive: '1 hour ago',
      subjects: {
        Mathematics: 80,
        Science: 88,
        English: 84,
        Hindi: 82,
        'Social Studies': 78
      },
      pendingAssignments: 1,
      completedAssignments: 19,
      status: 'active',
      behaviorRating: 'excellent',
      healthStatus: 'good'
    },
    {
      id: 3,
      name: 'Rohan Patel',
      rollNumber: '2024-10A-032',
      class: 'Grade 10-A',
      grade: 10,
      section: 'A',
      email: 'rohan.patel@student.edu',
      phone: '+91 98765 43230',
      parentName: 'Kiran Patel',
      parentPhone: '+91 98765 43231',
      avatar: '👦',
      attendance: 89.5,
      performance: 75.8,
      trend: 'down',
      trendValue: 2.3,
      recentActivity: 'Missed Assignment Deadline',
      lastActive: '5 hours ago',
      subjects: {
        Mathematics: 72,
        Science: 75,
        English: 78,
        Hindi: 76,
        'Social Studies': 74
      },
      pendingAssignments: 5,
      completedAssignments: 15,
      status: 'needs-attention',
      behaviorRating: 'good',
      healthStatus: 'good'
    },
    {
      id: 4,
      name: 'Ananya Singh',
      rollNumber: '2024-10A-008',
      class: 'Grade 10-A',
      grade: 10,
      section: 'A',
      email: 'ananya.singh@student.edu',
      phone: '+91 98765 43240',
      parentName: 'Vikram Singh',
      parentPhone: '+91 98765 43241',
      avatar: '👧',
      attendance: 97.8,
      performance: 91.2,
      trend: 'up',
      trendValue: 4.5,
      recentActivity: 'Scored 98% in Recent Test',
      lastActive: '30 min ago',
      subjects: {
        Mathematics: 94,
        Science: 92,
        English: 90,
        Hindi: 91,
        'Social Studies': 89
      },
      pendingAssignments: 0,
      completedAssignments: 20,
      status: 'active',
      behaviorRating: 'excellent',
      healthStatus: 'good'
    },
    {
      id: 5,
      name: 'Kavya Iyer',
      rollNumber: '2024-9B-022',
      class: 'Grade 9-B',
      grade: 9,
      section: 'B',
      email: 'kavya.iyer@student.edu',
      phone: '+91 98765 43250',
      parentName: 'Suresh Iyer',
      parentPhone: '+91 98765 43251',
      avatar: '👧',
      attendance: 78.5,
      performance: 58.3,
      trend: 'down',
      trendValue: 8.2,
      recentActivity: 'Absent for 3 consecutive days',
      lastActive: '2 days ago',
      subjects: {
        Mathematics: 55,
        Science: 60,
        English: 62,
        Hindi: 58,
        'Social Studies': 57
      },
      pendingAssignments: 8,
      completedAssignments: 10,
      status: 'critical',
      behaviorRating: 'needs-improvement',
      healthStatus: 'medical-leave'
    }
  ]);

  const [filteredStudents, setFilteredStudents] = useState(students);

  const classes = ['all', 'Grade 10-A', 'Grade 9-B', 'Grade 8-C', 'Grade 11-A'];
  const performanceFilters = ['all', 'excellent', 'good', 'average', 'poor'];
  const attendanceFilters = ['all', 'above-90', '75-90', 'below-75'];

  useEffect(() => {
    filterStudents();
  }, [searchTerm, filterClass, filterPerformance, filterAttendance, students]);

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterClass !== 'all') {
      filtered = filtered.filter(student => student.class === filterClass);
    }

    if (filterPerformance !== 'all') {
      filtered = filtered.filter(student => {
        if (filterPerformance === 'excellent') return student.performance >= 85;
        if (filterPerformance === 'good') return student.performance >= 70 && student.performance < 85;
        if (filterPerformance === 'average') return student.performance >= 60 && student.performance < 70;
        if (filterPerformance === 'poor') return student.performance < 60;
        return true;
      });
    }

    if (filterAttendance !== 'all') {
      filtered = filtered.filter(student => {
        if (filterAttendance === 'above-90') return student.attendance >= 90;
        if (filterAttendance === '75-90') return student.attendance >= 75 && student.attendance < 90;
        if (filterAttendance === 'below-75') return student.attendance < 75;
        return true;
      });
    }

    setFilteredStudents(filtered);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Student list refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh students');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Exporting student data...');
    // Implement export functionality
  };

  const viewStudentInsights = (studentId) => {
    navigate(`/teacher/students/${studentId}/insights`);
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      'needs-attention': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 85) return 'text-green-600 bg-green-100';
    if (performance >= 70) return 'text-blue-600 bg-blue-100';
    if (performance >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return 'text-green-600';
    if (attendance >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600 mt-1">Manage and track student performance across all classes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <Download size={18} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              <UserPlus size={18} />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} />
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold">{students.length}</p>
          <p className="text-sm text-blue-100 mt-1">Students Under Guidance</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={24} />
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">
            {students.filter(s => s.status === 'active').length}
          </p>
          <p className="text-sm text-green-100 mt-1">Active & On Track</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle size={24} />
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">
              {students.filter(s => s.status === 'needs-attention').length}
            </span>
          </div>
          <p className="text-3xl font-bold">
            {students.filter(s => s.status === 'needs-attention').length}
          </p>
          <p className="text-sm text-yellow-100 mt-1">Need Attention</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle size={24} className="animate-pulse" />
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">
              Critical
            </span>
          </div>
          <p className="text-3xl font-bold">
            {students.filter(s => s.status === 'critical').length}
          </p>
          <p className="text-sm text-red-100 mt-1">Critical Cases</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex flex-wrap gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, roll number, or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={18} />
              Filters
              {(filterClass !== 'all' || filterPerformance !== 'all' || filterAttendance !== 'all') && (
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map(cls => (
                <option key={cls} value={cls}>
                  {cls === 'all' ? 'All Classes' : cls}
                </option>
              ))}
            </select>

            <select
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Performance Levels</option>
              <option value="excellent">Excellent (≥85%)</option>
              <option value="good">Good (70-84%)</option>
              <option value="average">Average (60-69%)</option>
              <option value="poor">Poor (&lt;60%)</option>
            </select>

            <select
              value={filterAttendance}
              onChange={(e) => setFilterAttendance(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Attendance</option>
              <option value="above-90">Above 90%</option>
              <option value="75-90">75-90%</option>
              <option value="below-75">Below 75%</option>
            </select>
          </div>
        )}
      </div>

      {/* Students Grid/Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">No students found</p>
          <p className="text-sm text-gray-600 mt-1">Try adjusting your filters or search criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                      {student.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.rollNumber}</p>
                      <p className="text-xs text-indigo-600 font-medium">{student.class}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(student.status)}`}>
                    {student.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock size={14} />
                  <span>{student.lastActive}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Performance & Attendance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Performance</span>
                      <div className="flex items-center gap-1">
                        {student.trend === 'up' ? (
                          <TrendingUp size={14} className="text-green-600" />
                        ) : (
                          <TrendingDown size={14} className="text-red-600" />
                        )}
                        <span className={`text-xs font-semibold ${student.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {student.trendValue}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                          style={{ width: `${student.performance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{student.performance}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Attendance</span>
                      <span className={`text-xs font-semibold ${getAttendanceColor(student.attendance)}`}>
                        {student.attendance >= 90 ? '✓' : '⚠'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                          style={{ width: `${student.attendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{student.attendance}%</span>
                    </div>
                  </div>
                </div>

                {/* Subject Scores */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Subject Performance</h4>
                  <div className="space-y-1">
                    {Object.entries(student.subjects).slice(0, 3).map(([subject, score]) => (
                      <div key={subject} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">{subject}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded ${getPerformanceColor(score)}`}>
                          {score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignments */}
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="text-xs text-gray-600">Pending Assignments</p>
                    <p className="text-lg font-bold text-orange-700">{student.pendingAssignments}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Completed</p>
                    <p className="text-lg font-bold text-green-700">{student.completedAssignments}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Recent Activity</p>
                  <p className="text-xs text-gray-900 font-medium">{student.recentActivity}</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} />
                    <span>Parent: {student.parentName}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => viewStudentInsights(student.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <BarChart3 size={18} />
                  View Insights
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assignments
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-xl">
                          {student.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.rollNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{student.class}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getPerformanceColor(student.performance)}`}>
                          {student.performance}%
                        </span>
                        {student.trend === 'up' ? (
                          <TrendingUp size={16} className="text-green-600" />
                        ) : (
                          <TrendingDown size={16} className="text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${getAttendanceColor(student.attendance)}`}>
                        {student.attendance}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{student.pendingAssignments} pending</span>
                        <span className="text-xs text-gray-500">/ {student.completedAssignments} done</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(student.status)}`}>
                        {student.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewStudentInsights(student.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStudents;