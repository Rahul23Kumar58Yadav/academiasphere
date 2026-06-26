// src/pages/school-admin/results/GradeAnalytics.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Award, Target,
  AlertTriangle,AlertCircle, CheckCircle, Calendar, Filter, Download, Printer,
  RefreshCw, Eye, ChevronDown, Star, Percent, BookOpen, Activity,
  Zap, Brain, Trophy, ThumbsUp, ThumbsDown, Minus, Info, Search,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter, ScatterChart,
} from 'recharts';

const GradeAnalytics = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const classes = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'All Subjects'];
  const exams = ['Unit Test 1', 'Unit Test 2', 'Midterm', 'Unit Test 3', 'Final Exam'];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    loadAnalytics();
  }, [selectedClass, selectedSection, selectedSubject, selectedExam, selectedTimeframe]);

  const loadAnalytics = () => {
    setLoading(true);
    setTimeout(() => {
      // Mock analytics data
      setAnalytics({
        overview: {
          totalStudents: 240,
          averageScore: 78.5,
          passPercentage: 85.4,
          highestScore: 98,
          lowestScore: 42,
          medianScore: 79,
          standardDeviation: 12.3,
        },
        gradeDistribution: [
          { grade: 'A+', count: 28, percentage: 11.7 },
          { grade: 'A', count: 45, percentage: 18.8 },
          { grade: 'B+', count: 52, percentage: 21.7 },
          { grade: 'B', count: 48, percentage: 20.0 },
          { grade: 'C+', count: 32, percentage: 13.3 },
          { grade: 'C', count: 20, percentage: 8.3 },
          { grade: 'D', count: 10, percentage: 4.2 },
          { grade: 'F', count: 5, percentage: 2.1 },
        ],
        scoreRanges: [
          { range: '90-100', count: 35, percentage: 14.6 },
          { range: '80-89', count: 68, percentage: 28.3 },
          { range: '70-79', count: 72, percentage: 30.0 },
          { range: '60-69', count: 42, percentage: 17.5 },
          { range: '50-59', count: 18, percentage: 7.5 },
          { range: '0-49', count: 5, percentage: 2.1 },
        ],
        performanceTrend: [
          { exam: 'UT1', average: 74.2, highest: 95, lowest: 45 },
          { exam: 'UT2', average: 76.8, highest: 96, lowest: 48 },
          { exam: 'Mid', average: 77.5, highest: 97, lowest: 44 },
          { exam: 'UT3', average: 78.1, highest: 98, lowest: 42 },
          { exam: 'Final', average: 78.5, highest: 98, lowest: 42 },
        ],
        subjectComparison: [
          { subject: 'Math', average: 76.5, passed: 82, failed: 18 },
          { subject: 'Science', average: 79.2, passed: 87, failed: 13 },
          { subject: 'English', average: 81.5, passed: 90, failed: 10 },
          { subject: 'History', average: 75.3, passed: 80, failed: 20 },
          { subject: 'Comp Sci', average: 82.8, passed: 92, failed: 8 },
        ],
        topPerformers: [
          { rank: 1, name: 'Sarah Brown', studentId: 'STU2024004', score: 98, grade: 'A+', improvement: 5 },
          { rank: 2, name: 'Emily Johnson', studentId: 'STU2024002', score: 96, grade: 'A+', improvement: 3 },
          { rank: 3, name: 'Lisa Anderson', studentId: 'STU2024006', score: 95, grade: 'A+', improvement: 2 },
          { rank: 4, name: 'David Martinez', studentId: 'STU2024005', score: 93, grade: 'A', improvement: 4 },
          { rank: 5, name: 'Jennifer Taylor', studentId: 'STU2024008', score: 92, grade: 'A', improvement: 1 },
        ],
        lowPerformers: [
          { rank: 1, name: 'Student A', studentId: 'STU2024020', score: 42, grade: 'F', decline: -8 },
          { rank: 2, name: 'Student B', studentId: 'STU2024021', score: 48, grade: 'F', decline: -5 },
          { rank: 3, name: 'Student C', studentId: 'STU2024022', score: 52, grade: 'F', decline: -3 },
          { rank: 4, name: 'Student D', studentId: 'STU2024023', score: 55, grade: 'D', decline: -2 },
          { rank: 5, name: 'Student E', studentId: 'STU2024024', score: 58, grade: 'D', decline: -1 },
        ],
        insights: [
          {
            id: 1,
            type: 'positive',
            title: 'Overall Performance Improvement',
            description: 'Class average has improved by 4.3% compared to the previous exam',
            impact: 'high',
          },
          {
            id: 2,
            type: 'warning',
            title: 'Low Pass Rate in Mathematics',
            description: 'Only 82% students passed Mathematics, below the 85% target',
            impact: 'medium',
          },
          {
            id: 3,
            type: 'positive',
            title: 'Excellent English Performance',
            description: '90% pass rate in English, exceeding expectations',
            impact: 'medium',
          },
          {
            id: 4,
            type: 'alert',
            title: 'At-Risk Students Identified',
            description: '5 students scored below 50% and need immediate intervention',
            impact: 'high',
          },
        ],
        classComparison: [
          { class: 'Grade 10A', average: 78.5, rank: 1 },
          { class: 'Grade 10B', average: 76.2, rank: 2 },
          { class: 'Grade 10C', average: 74.8, rank: 3 },
          { class: 'Grade 10D', average: 72.5, rank: 4 },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
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
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Grade Analytics</h1>
                <p className="text-gray-600">Comprehensive performance analysis and insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadAnalytics}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => alert('Export analytics')}
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sections</option>
              {sections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Exams</option>
              {exams.map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>

            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">Current Semester</option>
              <option value="previous">Previous Semester</option>
              <option value="year">Academic Year</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <StatCard icon={Users} label="Students" value={analytics.overview.totalStudents} color="blue" />
          <StatCard icon={Target} label="Average" value={`${analytics.overview.averageScore}%`} color="purple" />
          <StatCard icon={CheckCircle} label="Pass Rate" value={`${analytics.overview.passPercentage}%`} color="green" />
          <StatCard icon={TrendingUp} label="Highest" value={analytics.overview.highestScore} color="emerald" />
          <StatCard icon={TrendingDown} label="Lowest" value={analytics.overview.lowestScore} color="red" />
          <StatCard icon={Activity} label="Median" value={analytics.overview.medianScore} color="indigo" />
          <StatCard icon={BarChart3} label="Std Dev" value={analytics.overview.standardDeviation.toFixed(1)} color="orange" />
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-600" />
            Key Insights & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.insights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Grade Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="grade" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Ranges */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Range Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.scoreRanges}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }) => `${range}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.scoreRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="exam" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={3} name="Average" />
                <Line type="monotone" dataKey="highest" stroke="#10b981" strokeWidth={2} name="Highest" />
                <Line type="monotone" dataKey="lowest" stroke="#ef4444" strokeWidth={2} name="Lowest" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Comparison */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={analytics.subjectComparison}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                <Radar name="Average Score" dataKey="average" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Radar name="Pass Rate" dataKey="passed" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top & Low Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Top Performers
              </h3>
              <span className="text-sm text-gray-600">Top 5</span>
            </div>
            <div className="space-y-3">
              {analytics.topPerformers.map((student) => (
                <div key={student.rank} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      student.rank === 1 ? 'bg-yellow-500' :
                      student.rank === 2 ? 'bg-gray-400' :
                      student.rank === 3 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {student.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-600">{student.studentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{student.score}%</p>
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{student.improvement}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Performers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Needs Attention
              </h3>
              <span className="text-sm text-gray-600">Bottom 5</span>
            </div>
            <div className="space-y-3">
              {analytics.lowPerformers.map((student) => (
                <div key={student.rank} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-white">
                      {student.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-600">{student.studentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{student.score}%</p>
                    <div className="flex items-center space-x-1 text-xs text-red-600">
                      <TrendingDown className="w-3 h-3" />
                      <span>{student.decline}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Class Comparison */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Average Score</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.classComparison.map((cls) => (
                  <tr key={cls.class} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white inline-flex ${
                        cls.rank === 1 ? 'bg-yellow-500' :
                        cls.rank === 2 ? 'bg-gray-400' :
                        cls.rank === 3 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {cls.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{cls.class}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-gray-900">{cls.average}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${cls.average}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    emerald: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-lg p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs opacity-90">{label}</span>
        <Icon className="w-4 h-4 opacity-90" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

const InsightCard = ({ insight }) => {
  const getIcon = (type) => {
    switch(type) {
      case 'positive': return ThumbsUp;
      case 'warning': return AlertTriangle;
      case 'alert': return AlertCircle;
      default: return Info;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'positive': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'alert': return 'border-red-500 bg-red-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getIconColor = (type) => {
    switch(type) {
      case 'positive': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'alert': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const Icon = getIcon(insight.type);

  return (
    <div className={`border-l-4 ${getColor(insight.type)} rounded-lg p-4`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${getIconColor(insight.type)} mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
          <p className="text-sm text-gray-700">{insight.description}</p>
        </div>
      </div>
    </div>
  );
};

export default GradeAnalytics;