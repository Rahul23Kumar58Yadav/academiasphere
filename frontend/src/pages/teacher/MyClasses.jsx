import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  ChevronRight,
  Award,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyClasses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const [classes, setClasses] = useState([
    {
      id: 1,
      className: 'Grade 10-A',
      subject: 'Mathematics',
      grade: 10,
      section: 'A',
      totalStudents: 42,
      presentToday: 39,
      attendanceRate: 92.9,
      avgPerformance: 82.5,
      trend: 'up',
      trendValue: 3.2,
      nextClass: '2025-12-20 10:00 AM',
      room: '201',
      pendingAssignments: 8,
      completedTopics: 28,
      totalTopics: 35,
      recentActivity: 'Quiz completed - Quadratic Equations',
      classStrength: {
        excellent: 12,
        good: 18,
        average: 10,
        needsAttention: 2
      }
    },
    {
      id: 2,
      className: 'Grade 9-B',
      subject: 'Science',
      grade: 9,
      section: 'B',
      totalStudents: 38,
      presentToday: 35,
      attendanceRate: 92.1,
      avgPerformance: 76.8,
      trend: 'up',
      trendValue: 2.1,
      nextClass: '2025-12-20 02:00 PM',
      room: '305',
      pendingAssignments: 5,
      completedTopics: 22,
      totalTopics: 30,
      recentActivity: 'Lab Report submitted - Chemical Reactions',
      classStrength: {
        excellent: 8,
        good: 16,
        average: 12,
        needsAttention: 2
      }
    },
    {
      id: 3,
      className: 'Grade 8-C',
      subject: 'Mathematics',
      grade: 8,
      section: 'C',
      totalStudents: 35,
      presentToday: 31,
      attendanceRate: 88.6,
      avgPerformance: 74.2,
      trend: 'down',
      trendValue: 1.8,
      nextClass: '2025-12-21 09:00 AM',
      room: '201',
      pendingAssignments: 12,
      completedTopics: 18,
      totalTopics: 28,
      recentActivity: 'Assignment Due - Algebraic Expressions',
      classStrength: {
        excellent: 5,
        good: 14,
        average: 13,
        needsAttention: 3
      }
    },
    {
      id: 4,
      className: 'Grade 11-A',
      subject: 'Science',
      grade: 11,
      section: 'A',
      totalStudents: 40,
      presentToday: 38,
      attendanceRate: 95.0,
      avgPerformance: 85.3,
      trend: 'up',
      trendValue: 4.5,
      nextClass: '2025-12-20 11:00 AM',
      room: '305',
      pendingAssignments: 3,
      completedTopics: 25,
      totalTopics: 32,
      recentActivity: 'Practical completed - Thermodynamics',
      classStrength: {
        excellent: 15,
        good: 18,
        average: 6,
        needsAttention: 1
      }
    }
  ]);

  const [filteredClasses, setFilteredClasses] = useState(classes);

  const subjects = ['all', 'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];
  const grades = ['all', 8, 9, 10, 11, 12];

  useEffect(() => {
    filterClasses();
  }, [searchTerm, filterSubject, filterGrade, classes]);

  const filterClasses = () => {
    let filtered = [...classes];

    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(cls => cls.subject === filterSubject);
    }

    if (filterGrade !== 'all') {
      filtered = filtered.filter(cls => cls.grade === parseInt(filterGrade));
    }

    setFilteredClasses(filtered);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Classes refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh classes');
    } finally {
      setLoading(false);
    }
  };

  const viewClassDetails = (classId) => {
    navigate(`/teacher/classes/${classId}`);
  };

  const viewAnalytics = (classId) => {
    navigate(`/teacher/classes/${classId}/analytics`);
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 80) return 'text-green-600 bg-green-100';
    if (performance >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return 'text-green-600';
    if (attendance >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateProgress = (completed, total) => {
    return ((completed / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all your assigned classes</p>
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by class or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {grades.map(grade => (
              <option key={grade} value={grade}>
                {grade === 'all' ? 'All Grades' : `Grade ${grade}`}
              </option>
            ))}
          </select>

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
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} />
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold">{classes.length}</p>
          <p className="text-sm text-blue-100 mt-1">Classes Assigned</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} />
            <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-3xl font-bold">
            {classes.reduce((sum, cls) => sum + cls.totalStudents, 0)}
          </p>
          <p className="text-sm text-green-100 mt-1">Total Students</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <ClipboardCheck size={24} />
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">
            {(classes.reduce((sum, cls) => sum + cls.attendanceRate, 0) / classes.length).toFixed(1)}%
          </p>
          <p className="text-sm text-purple-100 mt-1">Avg Attendance</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Award size={24} />
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">
            {(classes.reduce((sum, cls) => sum + cls.avgPerformance, 0) / classes.length).toFixed(1)}%
          </p>
          <p className="text-sm text-orange-100 mt-1">Avg Performance</p>
        </div>
      </div>

      {/* Classes Grid/List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">No classes found</p>
          <p className="text-sm text-gray-600 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
          : 'space-y-4'
        }>
          {filteredClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-2xl font-bold">{classItem.className}</h3>
                    <p className="text-indigo-100 text-sm mt-1">{classItem.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                      classItem.trend === 'up' 
                        ? 'bg-green-500 bg-opacity-30' 
                        : 'bg-red-500 bg-opacity-30'
                    }`}>
                      {classItem.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {classItem.trendValue}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-indigo-100">Total Students</p>
                    <p className="text-2xl font-bold">{classItem.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-100">Present Today</p>
                    <p className="text-2xl font-bold">{classItem.presentToday}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Attendance</span>
                      <span className={`text-sm font-bold ${getAttendanceColor(classItem.attendanceRate)}`}>
                        {classItem.attendanceRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                        style={{ width: `${classItem.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Performance</span>
                      <span className="text-sm font-bold text-gray-900">
                        {classItem.avgPerformance}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: `${classItem.avgPerformance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Class Strength Distribution */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Student Performance Distribution</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <span className="text-xl font-bold text-green-700">{classItem.classStrength.excellent}</span>
                      </div>
                      <p className="text-xs text-gray-600">Excellent</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <span className="text-xl font-bold text-blue-700">{classItem.classStrength.good}</span>
                      </div>
                      <p className="text-xs text-gray-600">Good</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <span className="text-xl font-bold text-yellow-700">{classItem.classStrength.average}</span>
                      </div>
                      <p className="text-xs text-gray-600">Average</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <span className="text-xl font-bold text-red-700">{classItem.classStrength.needsAttention}</span>
                      </div>
                      <p className="text-xs text-gray-600">Needs Help</p>
                    </div>
                  </div>
                </div>

                {/* Progress & Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Curriculum Progress</p>
                    <p className="text-lg font-bold text-blue-700">
                      {calculateProgress(classItem.completedTopics, classItem.totalTopics)}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {classItem.completedTopics}/{classItem.totalTopics} topics
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-gray-600 mb-1">Pending Reviews</p>
                    <p className="text-lg font-bold text-orange-700">
                      {classItem.pendingAssignments}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">assignments</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Recent Activity</p>
                      <p className="text-sm text-gray-900 font-medium">{classItem.recentActivity}</p>
                    </div>
                  </div>
                </div>

                {/* Next Class */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <Calendar size={16} />
                  <span>Next Class:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(classItem.nextClass).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="ml-auto text-gray-500">Room {classItem.room}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => viewClassDetails(classItem.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Eye size={18} />
                    View Details
                  </button>
                  <button
                    onClick={() => viewAnalytics(classItem.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <BarChart3 size={18} />
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;