// src/pages/student/courses/MyCourses.jsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, Users, Star, TrendingUp, Download, Eye,
  PlayCircle, FileText, Video, Image, Link as LinkIcon,
  CheckCircle, AlertCircle, Calendar, Award, Target, BarChart3,
  ChevronRight, Search, Filter, Grid, List, RefreshCw, Book,
  Bookmark, Share2, MessageSquare, ThumbsUp, Zap, Brain,Activity,
} from 'lucide-react';
import {
  CircularProgressbar, buildStyles,
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const MyCourses = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'in-progress', 'completed'
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    setLoading(true);
    setTimeout(() => {
      setCourses([
        {
          id: 1,
          code: 'MATH301',
          name: 'Advanced Mathematics',
          teacher: 'Mr. John Smith',
          teacherPhoto: null,
          thumbnail: null,
          description: 'Advanced topics in algebra, calculus, and analytical geometry',
          progress: 75,
          totalLessons: 40,
          completedLessons: 30,
          totalAssignments: 8,
          completedAssignments: 6,
          grade: 'A',
          score: 92,
          status: 'in-progress',
          schedule: ['Mon 09:00 AM', 'Wed 09:00 AM', 'Fri 09:00 AM'],
          nextClass: 'Monday, 09:00 AM',
          materials: [
            { id: 1, type: 'video', name: 'Lecture 1: Introduction to Calculus', duration: '45 min' },
            { id: 2, type: 'document', name: 'Chapter 5 Notes.pdf', size: '2.3 MB' },
            { id: 3, type: 'assignment', name: 'Assignment 7: Integration', dueDate: '2024-04-15' },
          ],
          announcements: [
            { id: 1, title: 'Midterm Exam on April 20', date: '2024-04-10' },
            { id: 2, title: 'New Study Materials Added', date: '2024-04-08' },
          ],
        },
        {
          id: 2,
          code: 'PHY201',
          name: 'Physics - Mechanics',
          teacher: 'Mrs. Emily Johnson',
          teacherPhoto: null,
          thumbnail: null,
          description: 'Classical mechanics, motion, forces, and energy',
          progress: 60,
          totalLessons: 35,
          completedLessons: 21,
          totalAssignments: 6,
          completedAssignments: 4,
          grade: 'B+',
          score: 88,
          status: 'in-progress',
          schedule: ['Tue 10:30 AM', 'Thu 10:30 AM'],
          nextClass: 'Tuesday, 10:30 AM',
          materials: [
            { id: 1, type: 'video', name: 'Lecture 15: Newton\'s Laws', duration: '50 min' },
            { id: 2, type: 'document', name: 'Lab Manual.pdf', size: '4.1 MB' },
          ],
          announcements: [
            { id: 1, title: 'Lab Session Tomorrow', date: '2024-04-11' },
          ],
        },
        {
          id: 3,
          code: 'ENG101',
          name: 'English Literature',
          teacher: 'Ms. Sarah Brown',
          teacherPhoto: null,
          thumbnail: null,
          description: 'Study of classic and contemporary literature',
          progress: 85,
          totalLessons: 30,
          completedLessons: 25,
          totalAssignments: 5,
          completedAssignments: 5,
          grade: 'A+',
          score: 95,
          status: 'in-progress',
          schedule: ['Mon 12:00 PM', 'Wed 12:00 PM'],
          nextClass: 'Monday, 12:00 PM',
          materials: [
            { id: 1, type: 'document', name: 'Shakespeare Study Guide.pdf', size: '1.8 MB' },
            { id: 2, type: 'link', name: 'Online Poetry Database', url: 'https://...' },
          ],
          announcements: [],
        },
        {
          id: 4,
          code: 'CS202',
          name: 'Computer Science',
          teacher: 'Mr. David Martinez',
          teacherPhoto: null,
          thumbnail: null,
          description: 'Programming fundamentals and data structures',
          progress: 45,
          totalLessons: 38,
          completedLessons: 17,
          totalAssignments: 10,
          completedAssignments: 4,
          grade: 'A-',
          score: 90,
          status: 'in-progress',
          schedule: ['Tue 02:00 PM', 'Thu 02:00 PM', 'Fri 02:00 PM'],
          nextClass: 'Tuesday, 02:00 PM',
          materials: [
            { id: 1, type: 'video', name: 'Binary Trees Tutorial', duration: '60 min' },
            { id: 2, type: 'document', name: 'Code Examples.zip', size: '8.5 MB' },
          ],
          announcements: [
            { id: 1, title: 'Coding Assignment Due Friday', date: '2024-04-12' },
          ],
        },
        {
          id: 5,
          code: 'HIST101',
          name: 'World History',
          teacher: 'Dr. Michael Wilson',
          teacherPhoto: null,
          thumbnail: null,
          description: 'Ancient civilizations to modern world history',
          progress: 100,
          totalLessons: 32,
          completedLessons: 32,
          totalAssignments: 4,
          completedAssignments: 4,
          grade: 'A-',
          score: 87,
          status: 'completed',
          schedule: ['Mon 11:00 AM', 'Thu 11:00 AM'],
          nextClass: null,
          materials: [],
          announcements: [],
        },
      ]);
      setLoading(false);
    }, 800);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: courses.length,
    inProgress: courses.filter(c => c.status === 'in-progress').length,
    completed: courses.filter(c => c.status === 'completed').length,
    avgProgress: Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-1">Enrolled courses for Academic Year 2024-2025</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={BookOpen} label="Total Courses" value={stats.total} color="blue" />
          <StatCard icon={Activity} label="In Progress" value={stats.inProgress} color="purple" />
          <StatCard icon={CheckCircle} label="Completed" value={stats.completed} color="green" />
          <StatCard icon={TrendingUp} label="Avg Progress" value={`${stats.avgProgress}%`} color="orange" />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
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
          </div>
        </div>
      </div>

      {/* Courses Grid/List */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h3>
          <p className="text-gray-600">Try adjusting your search or filter</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => {
                setSelectedCourse(course);
                setShowCourseDetails(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <CourseTable
            courses={filteredCourses}
            onCourseClick={(course) => {
              setSelectedCourse(course);
              setShowCourseDetails(true);
            }}
          />
        </div>
      )}

      {/* Course Details Modal */}
      {showCourseDetails && selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => {
            setShowCourseDetails(false);
            setSelectedCourse(null);
          }}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-lg p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm opacity-90">{label}</span>
        <Icon className="w-5 h-5 opacity-90" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

const CourseCard = ({ course, onClick }) => {
  const getGradeColor = (grade) => {
    if (grade.includes('A')) return 'bg-green-100 text-green-700';
    if (grade.includes('B')) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
    >
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm opacity-90">{course.code}</p>
            <h3 className="text-xl font-bold mt-1">{course.name}</h3>
          </div>
          {course.status === 'completed' && (
            <CheckCircle className="w-6 h-6" />
          )}
        </div>
        <p className="text-sm opacity-90">{course.teacher}</p>
      </div>

      {/* Course Body */}
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Course Progress</span>
            <span className="font-semibold text-gray-900">{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Lessons</p>
            <p className="text-lg font-bold text-gray-900">{course.completedLessons}/{course.totalLessons}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Assignments</p>
            <p className="text-lg font-bold text-gray-900">{course.completedAssignments}/{course.totalAssignments}</p>
          </div>
        </div>

        {/* Grade & Next Class */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Current Grade</p>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(course.grade)}`}>
              {course.grade} ({course.score}%)
            </span>
          </div>
          {course.nextClass && (
            <div className="text-right">
              <p className="text-xs text-gray-600">Next Class</p>
              <p className="text-xs font-semibold text-gray-900">{course.nextClass}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseTable = ({ courses, onCourseClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Teacher</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Progress</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Grade</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Lessons</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Assignments</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {courses.map(course => (
            <tr
              key={course.id}
              onClick={() => onCourseClick(course)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4">
                <div>
                  <p className="font-semibold text-gray-900">{course.name}</p>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{course.teacher}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center">
                  <div className="w-16">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-2 text-sm font-semibold text-gray-900">{course.progress}%</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-lg font-bold text-gray-900">{course.grade}</span>
                <p className="text-xs text-gray-600">{course.score}%</p>
              </td>
              <td className="px-6 py-4 text-center text-sm text-gray-900">
                {course.completedLessons}/{course.totalLessons}
              </td>
              <td className="px-6 py-4 text-center text-sm text-gray-900">
                {course.completedAssignments}/{course.totalAssignments}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  course.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {course.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CourseDetailsModal = ({ course, onClose }) => {
  const getMaterialIcon = (type) => {
    switch(type) {
      case 'video': return Video;
      case 'document': return FileText;
      case 'link': return LinkIcon;
      case 'assignment': return ClipboardList;
      default: return FileText;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-90">{course.code}</p>
              <h2 className="text-2xl font-bold mt-1">{course.name}</h2>
              <p className="text-sm opacity-90 mt-2">{course.teacher}</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Course</h3>
            <p className="text-gray-700">{course.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-blue-600">{course.progress}%</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Grade</p>
              <p className="text-2xl font-bold text-green-600">{course.grade}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Lessons</p>
              <p className="text-2xl font-bold text-purple-600">{course.completedLessons}/{course.totalLessons}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Assignments</p>
              <p className="text-2xl font-bold text-orange-600">{course.completedAssignments}/{course.totalAssignments}</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Class Schedule</h3>
            <div className="flex flex-wrap gap-2">
              {course.schedule.map((time, index) => (
                <span key={index} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                  {time}
                </span>
              ))}
            </div>
          </div>

          {/* Materials */}
          {course.materials.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Materials</h3>
              <div className="space-y-2">
                {course.materials.map(material => {
                  const Icon = getMaterialIcon(material.type);
                  return (
                    <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{material.name}</p>
                          {material.duration && <p className="text-xs text-gray-600">{material.duration}</p>}
                          {material.size && <p className="text-xs text-gray-600">{material.size}</p>}
                        </div>
                      </div>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Announcements */}
          {course.announcements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Announcements</h3>
              <div className="space-y-2">
                {course.announcements.map(announcement => (
                  <div key={announcement.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{announcement.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCourses;