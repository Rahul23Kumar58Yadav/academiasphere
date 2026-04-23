import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  ArrowLeft,
  Target,
  Brain,
  Star,
  BookOpen,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const ClassAnalytics = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month'); // week, month, semester, year

  // Mock data - Replace with actual API calls
  const [classData] = useState({
    id: 1,
    className: 'Grade 10-A',
    subject: 'Mathematics',
    totalStudents: 42,
    teacher: 'Priya Sharma',
    room: '201'
  });

  const [performanceData] = useState({
    currentAverage: 82.5,
    previousAverage: 79.3,
    trend: 'up',
    trendPercentage: 4.0,
    distribution: {
      excellent: { count: 12, percentage: 28.6, range: '90-100%' },
      good: { count: 18, percentage: 42.9, range: '75-89%' },
      average: { count: 10, percentage: 23.8, range: '60-74%' },
      needsImprovement: { count: 2, percentage: 4.7, range: '<60%' }
    },
    topPerformers: [
      { id: 1, name: 'Aarav Kumar', score: 96, rank: 1, improvement: '+5%' },
      { id: 2, name: 'Diya Sharma', score: 94, rank: 2, improvement: '+3%' },
      { id: 3, name: 'Rohan Patel', score: 92, rank: 3, improvement: '+8%' },
      { id: 4, name: 'Ananya Singh', score: 91, rank: 4, improvement: '+2%' },
      { id: 5, name: 'Arjun Reddy', score: 90, rank: 5, improvement: '+6%' }
    ],
    strugglingStudents: [
      { id: 6, name: 'Kavya Iyer', score: 58, issues: ['Attendance', 'Assignments'], suggestions: 'Extra tutoring needed' },
      { id: 7, name: 'Vikram Malhotra', score: 55, issues: ['Conceptual gaps', 'Participation'], suggestions: 'One-on-one sessions' }
    ]
  });

  const [attendanceData] = useState({
    overall: 92.9,
    trend: 'up',
    trendValue: 2.3,
    monthlyData: [
      { month: 'Aug', percentage: 89.5 },
      { month: 'Sep', percentage: 91.2 },
      { month: 'Oct', percentage: 93.4 },
      { month: 'Nov', percentage: 92.1 },
      { month: 'Dec', percentage: 92.9 }
    ],
    dailyAverage: {
      monday: 94,
      tuesday: 93,
      wednesday: 91,
      thursday: 92,
      friday: 90,
      saturday: 89
    },
    perfectAttendance: 15,
    irregular: 3
  });

  const [assignmentData] = useState({
    totalAssigned: 24,
    completed: 20,
    pending: 4,
    avgCompletionRate: 85.4,
    avgSubmissionTime: '2.3 days',
    lateSubmissions: 12,
    assignments: [
      { 
        id: 1, 
        title: 'Quadratic Equations - Chapter 4', 
        dueDate: '2025-12-22',
        submitted: 38,
        total: 42,
        avgScore: 84,
        status: 'active'
      },
      { 
        id: 2, 
        title: 'Algebraic Expressions', 
        dueDate: '2025-12-15',
        submitted: 42,
        total: 42,
        avgScore: 88,
        status: 'completed'
      },
      { 
        id: 3, 
        title: 'Linear Equations Practice', 
        dueDate: '2025-12-10',
        submitted: 40,
        total: 42,
        avgScore: 82,
        status: 'completed'
      }
    ]
  });

  const [topicAnalysis] = useState([
    { 
      topic: 'Quadratic Equations', 
      mastery: 88, 
      completed: true, 
      avgScore: 87,
      strength: 'high',
      timeSpent: '8 hours'
    },
    { 
      topic: 'Algebraic Expressions', 
      mastery: 85, 
      completed: true, 
      avgScore: 84,
      strength: 'high',
      timeSpent: '6 hours'
    },
    { 
      topic: 'Linear Equations', 
      mastery: 79, 
      completed: true, 
      avgScore: 78,
      strength: 'medium',
      timeSpent: '7 hours'
    },
    { 
      topic: 'Polynomials', 
      mastery: 72, 
      completed: true, 
      avgScore: 71,
      strength: 'medium',
      timeSpent: '9 hours'
    },
    { 
      topic: 'Trigonometry Basics', 
      mastery: 65, 
      completed: false, 
      avgScore: 64,
      strength: 'low',
      timeSpent: '5 hours'
    }
  ]);

  const [aiInsights] = useState([
    {
      type: 'recommendation',
      priority: 'high',
      title: 'Focus Area Identified',
      message: 'Students are struggling with Trigonometry Basics. Consider dedicating additional class time or organizing revision sessions.',
      action: 'Schedule Revision Session'
    },
    {
      type: 'success',
      priority: 'medium',
      title: 'Excellent Progress',
      message: 'Class performance in Quadratic Equations has improved by 12% compared to last month.',
      action: 'View Details'
    },
    {
      type: 'warning',
      priority: 'high',
      title: 'Attendance Concern',
      message: '3 students have irregular attendance patterns. Early intervention recommended.',
      action: 'View Students'
    },
    {
      type: 'info',
      priority: 'low',
      title: 'Assignment Completion',
      message: 'Overall assignment submission rate is above class average. Keep up the good work!',
      action: 'View Report'
    }
  ]);

  const handleExportReport = () => {
    toast.success('Generating analytics report...');
    // Implement export functionality
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return 'text-green-600 bg-green-100';
    if (mastery >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getInsightColor = (type) => {
    const colors = {
      recommendation: 'border-l-4 border-blue-500 bg-blue-50',
      success: 'border-l-4 border-green-500 bg-green-50',
      warning: 'border-l-4 border-yellow-500 bg-yellow-50',
      info: 'border-l-4 border-purple-500 bg-purple-50'
    };
    return colors[type] || 'border-l-4 border-gray-500 bg-gray-50';
  };

  const getInsightIcon = (type) => {
    const icons = {
      recommendation: Brain,
      success: Star,
      warning: AlertTriangle,
      info: Target
    };
    const Icon = icons[type] || Target;
    return <Icon size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/teacher/classes')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classData.className} Analytics</h1>
              <p className="text-gray-600 mt-1">{classData.subject} • {classData.totalStudents} Students</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Award size={28} />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
              performanceData.trend === 'up' ? 'bg-green-500 bg-opacity-30' : 'bg-red-500 bg-opacity-30'
            }`}>
              {performanceData.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {performanceData.trendPercentage}%
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Class Average</p>
          <p className="text-4xl font-bold">{performanceData.currentAverage}%</p>
          <p className="text-xs opacity-75 mt-2">Previous: {performanceData.previousAverage}%</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <ClipboardCheck size={28} />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
              attendanceData.trend === 'up' ? 'bg-green-600 bg-opacity-40' : 'bg-red-500 bg-opacity-30'
            }`}>
              {attendanceData.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {attendanceData.trendValue}%
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Attendance Rate</p>
          <p className="text-4xl font-bold">{attendanceData.overall}%</p>
          <p className="text-xs opacity-75 mt-2">Perfect: {attendanceData.perfectAttendance} students</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <BookOpen size={28} />
            <span className="px-3 py-1 bg-white bg-opacity-30 rounded-full text-sm font-semibold">
              {assignmentData.pending} Pending
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">Assignment Completion</p>
          <p className="text-4xl font-bold">{assignmentData.avgCompletionRate}%</p>
          <p className="text-xs opacity-75 mt-2">{assignmentData.completed}/{assignmentData.totalAssigned} completed</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Users size={28} />
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm opacity-90 mb-1">Students at Risk</p>
          <p className="text-4xl font-bold">{performanceData.strugglingStudents.length}</p>
          <p className="text-xs opacity-75 mt-2">Need immediate attention</p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="text-indigo-600" size={24} />
              Performance Distribution
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(performanceData.distribution).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-gray-600 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-gray-500">{value.range}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      value.percentage >= 30 ? 'bg-green-100 text-green-700' :
                      value.percentage >= 20 ? 'bg-blue-100 text-blue-700' :
                      value.percentage >= 10 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {value.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          value.percentage >= 30 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                          value.percentage >= 20 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          value.percentage >= 10 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${value.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{value.count}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Attendance Trend */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Attendance Trend</h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {attendanceData.monthlyData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg flex items-center justify-center text-white text-xs font-semibold"
                        style={{ height: `${data.percentage}%` }}
                      >
                        {data.percentage}%
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="text-yellow-600" size={24} />
              Top Performers
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {performanceData.topPerformers.map((student, index) => (
              <div key={student.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-gray-300'
                }`}>
                  {student.rank}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{student.name}</h4>
                  <p className="text-xs text-gray-600">Score: {student.score}%</p>
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                  {student.improvement}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Mastery Analysis */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-purple-600" size={24} />
            Topic Mastery Analysis
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {topicAnalysis.map((topic, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{topic.topic}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Time Spent: {topic.timeSpent} • Avg Score: {topic.avgScore}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getMasteryColor(topic.mastery)}`}>
                      {topic.mastery}% Mastery
                    </span>
                    {topic.completed && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        topic.mastery >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        topic.mastery >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${topic.mastery}%` }}
                    ></div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    topic.strength === 'high' ? 'bg-green-100 text-green-700' :
                    topic.strength === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {topic.strength.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI-Powered Insights & Struggling Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="text-indigo-600" size={24} />
              AI-Powered Insights
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-xl ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  <div className={
                    insight.type === 'recommendation' ? 'text-blue-600' :
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                    'text-purple-600'
                  }>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-700 mb-3">{insight.message}</p>
                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                      {insight.action} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Struggling Students */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={24} />
              Students Need Attention
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {performanceData.strugglingStudents.map((student) => (
              <div key={student.id} className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-red-700 font-semibold mt-1">Score: {student.score}%</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-1">Issues Identified:</p>
                  <div className="flex flex-wrap gap-1">
                    {student.issues.map((issue, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-red-200">
                  <p className="text-xs text-gray-600 mb-1">AI Suggestion:</p>
                  <p className="text-sm text-gray-900 font-medium">{student.suggestions}</p>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                  Schedule Intervention
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAnalytics;