import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Award,
  ClipboardCheck,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
  Users,
  AlertCircle,
  Brain,
  Star,
  Target,
  Activity,
  FileText,
  MessageSquare,
  Bell,
  Download,
  Edit,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentInsights = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, academic, attendance, behavior

  // Mock student data - Replace with actual API call
  const [studentData] = useState({
    id: 1,
    name: 'Aarav Kumar',
    rollNumber: '2024-10A-025',
    class: 'Grade 10-A',
    section: 'A',
    avatar: '👦',
    email: 'aarav.kumar@student.edu',
    phone: '+91 98765 43210',
    dateOfBirth: '2010-05-15',
    bloodGroup: 'O+',
    address: '123, Green Park, New Delhi - 110016',
    parentName: 'Rajesh Kumar',
    parentEmail: 'rajesh.kumar@parent.com',
    parentPhone: '+91 98765 43211',
    admissionDate: '2019-04-01',
    overallPerformance: 87.5,
    overallAttendance: 94.5,
    rank: 5,
    totalStudents: 42,
    trend: 'up',
    trendValue: 5.2
  });

  const [academicData] = useState({
    subjects: {
      Mathematics: {
        currentScore: 92,
        previousScore: 87,
        trend: 'up',
        assignments: { completed: 18, total: 20, pending: 2 },
        tests: [
          { name: 'Mid-term', score: 94, date: '2025-11-15' },
          { name: 'Unit Test 3', score: 90, date: '2025-12-01' },
          { name: 'Chapter 4 Quiz', score: 92, date: '2025-12-10' }
        ],
        strengths: ['Problem Solving', 'Algebra'],
        weaknesses: ['Geometry', 'Speed'],
        teacher: 'Ms. Priya Sharma'
      },
      Science: {
        currentScore: 88,
        previousScore: 85,
        trend: 'up',
        assignments: { completed: 17, total: 20, pending: 3 },
        tests: [
          { name: 'Mid-term', score: 90, date: '2025-11-15' },
          { name: 'Unit Test 3', score: 86, date: '2025-12-01' },
          { name: 'Lab Practical', score: 88, date: '2025-12-08' }
        ],
        strengths: ['Physics', 'Lab Work'],
        weaknesses: ['Chemistry Equations', 'Biology'],
        teacher: 'Mr. Amit Verma'
      },
      English: {
        currentScore: 85,
        previousScore: 83,
        trend: 'up',
        assignments: { completed: 19, total: 20, pending: 1 },
        tests: [
          { name: 'Mid-term', score: 87, date: '2025-11-15' },
          { name: 'Essay Writing', score: 84, date: '2025-11-28' },
          { name: 'Grammar Test', score: 85, date: '2025-12-05' }
        ],
        strengths: ['Reading Comprehension', 'Vocabulary'],
        weaknesses: ['Creative Writing', 'Grammar'],
        teacher: 'Mrs. Sarah Gupta'
      },
      Hindi: {
        currentScore: 90,
        previousScore: 88,
        trend: 'up',
        assignments: { completed: 20, total: 20, pending: 0 },
        tests: [
          { name: 'Mid-term', score: 92, date: '2025-11-15' },
          { name: 'Unit Test 3', score: 89, date: '2025-12-01' }
        ],
        strengths: ['Grammar', 'Literature'],
        weaknesses: ['Essay Writing'],
        teacher: 'Mr. Rajesh Singh'
      },
      'Social Studies': {
        currentScore: 86,
        previousScore: 84,
        trend: 'up',
        assignments: { completed: 18, total: 20, pending: 2 },
        tests: [
          { name: 'Mid-term', score: 88, date: '2025-11-15' },
          { name: 'Map Work', score: 85, date: '2025-12-02' }
        ],
        strengths: ['History', 'Geography'],
        weaknesses: ['Political Science'],
        teacher: 'Ms. Kavya Reddy'
      }
    },
    performanceHistory: [
      { month: 'Jul', score: 82 },
      { month: 'Aug', score: 84 },
      { month: 'Sep', score: 85 },
      { month: 'Oct', score: 86 },
      { month: 'Nov', score: 87 },
      { month: 'Dec', score: 87.5 }
    ]
  });

  const [attendanceData] = useState({
    overall: 94.5,
    monthlyData: [
      { month: 'Jul', present: 22, absent: 1, total: 23, percentage: 95.7 },
      { month: 'Aug', present: 24, absent: 0, total: 24, percentage: 100 },
      { month: 'Sep', present: 21, absent: 2, total: 23, percentage: 91.3 },
      { month: 'Oct', present: 23, absent: 1, total: 24, percentage: 95.8 },
      { month: 'Nov', present: 22, absent: 1, total: 23, percentage: 95.7 },
      { month: 'Dec', present: 18, absent: 2, total: 20, percentage: 90 }
    ],
    recentRecords: [
      { date: '2025-12-19', status: 'present', subject: 'All' },
      { date: '2025-12-18', status: 'present', subject: 'All' },
      { date: '2025-12-17', status: 'present', subject: 'All' },
      { date: '2025-12-16', status: 'absent', subject: 'All', reason: 'Sick Leave' },
      { date: '2025-12-15', status: 'present', subject: 'All' }
    ],
    totalPresent: 130,
    totalAbsent: 7,
    totalClasses: 137
  });

  const [behaviorData] = useState({
    overallRating: 'excellent',
    disciplineScore: 95,
    participationScore: 88,
    teamworkScore: 92,
    leadershipScore: 85,
    incidents: [
      { date: '2025-11-15', type: 'positive', description: 'Led group project presentation', severity: 'none' },
      { date: '2025-10-20', type: 'positive', description: 'Helped classmate with homework', severity: 'none' },
      { date: '2025-09-15', type: 'neutral', description: 'Late submission of assignment', severity: 'minor' }
    ],
    achievements: [
      { date: '2025-12-10', title: 'Science Quiz Winner', category: 'Academic' },
      { date: '2025-11-20', title: 'Best Team Player Award', category: 'Sports' },
      { date: '2025-10-15', title: 'Perfect Attendance - October', category: 'Discipline' }
    ],
    teacherRemarks: [
      { date: '2025-12-15', teacher: 'Ms. Priya Sharma', subject: 'Mathematics', remark: 'Excellent problem-solving skills. Shows great improvement.' },
      { date: '2025-12-10', teacher: 'Mr. Amit Verma', subject: 'Science', remark: 'Active participation in lab activities. Good analytical thinking.' },
      { date: '2025-12-05', teacher: 'Mrs. Sarah Gupta', subject: 'English', remark: 'Needs to work on creative writing. Good vocabulary.' }
    ]
  });

  const [aiInsights] = useState([
    {
      type: 'strength',
      title: 'Strong Mathematical Foundation',
      description: 'Aarav shows exceptional aptitude in Mathematics, particularly in problem-solving and algebra. Recommend advanced challenges to maintain engagement.',
      confidence: 92,
      action: 'Consider enrollment in Math Olympiad preparation'
    },
    {
      type: 'improvement',
      title: 'Geometry Needs Attention',
      description: 'While overall Math performance is excellent, geometry concepts need reinforcement. Recommend additional practice and visual learning tools.',
      confidence: 85,
      action: 'Schedule extra help session for geometry'
    },
    {
      type: 'behavior',
      title: 'Excellent Leadership Potential',
      description: 'Demonstrates natural leadership qualities in group activities. Could benefit from more leadership opportunities.',
      confidence: 88,
      action: 'Assign as class monitor or team leader'
    },
    {
      type: 'warning',
      title: 'Occasional Attendance Issues',
      description: 'Two absences this month. Monitor health and ensure no pattern develops.',
      confidence: 78,
      action: 'Follow up with parents if pattern continues'
    }
  ]);

  const getInsightColor = (type) => {
    const colors = {
      strength: 'border-l-4 border-green-500 bg-green-50',
      improvement: 'border-l-4 border-yellow-500 bg-yellow-50',
      behavior: 'border-l-4 border-blue-500 bg-blue-50',
      warning: 'border-l-4 border-red-500 bg-red-50'
    };
    return colors[type] || 'border-l-4 border-gray-500 bg-gray-50';
  };

  const getInsightIcon = (type) => {
    const icons = {
      strength: Star,
      improvement: Target,
      behavior: Users,
      warning: AlertCircle
    };
    const Icon = icons[type] || Brain;
    return <Icon size={20} />;
  };

  const handleSendMessage = () => {
    toast.success('Opening message composer...');
  };

  const handleDownloadReport = () => {
    toast.success('Generating comprehensive report...');
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/teacher/students')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                {studentData.avatar}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{studentData.name}</h1>
                <p className="text-gray-600 mt-1">{studentData.rollNumber} • {studentData.class}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                    Rank: {studentData.rank}/{studentData.totalStudents}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    studentData.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {studentData.trend === 'up' ? '↑' : '↓'} {studentData.trendValue}% this month
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSendMessage}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={18} />
              Message
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} />
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Award size={28} />
            <TrendingUp size={20} />
          </div>
          <p className="text-sm opacity-90 mb-1">Overall Performance</p>
          <p className="text-4xl font-bold">{studentData.overallPerformance}%</p>
          <p className="text-xs opacity-75 mt-2">Excellent Progress</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <ClipboardCheck size={28} />
            <CheckCircle size={20} />
          </div>
          <p className="text-sm opacity-90 mb-1">Attendance Rate</p>
          <p className="text-4xl font-bold">{studentData.overallAttendance}%</p>
          <p className="text-xs opacity-75 mt-2">{attendanceData.totalPresent}/{attendanceData.totalClasses} classes</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Target size={28} />
            <Star size={20} />
          </div>
          <p className="text-sm opacity-90 mb-1">Class Rank</p>
          <p className="text-4xl font-bold">#{studentData.rank}</p>
          <p className="text-xs opacity-75 mt-2">Out of {studentData.totalStudents} students</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Users size={28} />
            <Activity size={20} />
          </div>
          <p className="text-sm opacity-90 mb-1">Behavior Rating</p>
          <p className="text-4xl font-bold capitalize">{behaviorData.overallRating}</p>
          <p className="text-xs opacity-75 mt-2">Discipline: {behaviorData.disciplineScore}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'academic', label: 'Academic Performance', icon: BookOpen },
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'behavior', label: 'Behavior & Growth', icon: Star }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="text-indigo-600" size={20} />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Date of Birth:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(studentData.dateOfBirth).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Activity size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Blood Group:</span>
                      <span className="font-semibold text-gray-900">{studentData.bloodGroup}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Email:</span>
                      <span className="font-semibold text-gray-900">{studentData.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Phone:</span>
                      <span className="font-semibold text-gray-900">{studentData.phone}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <span className="text-gray-600 w-32">Address:</span>
                      <span className="font-semibold text-gray-900">{studentData.address}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="text-purple-600" size={20} />
                    Parent Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Parent Name:</span>
                      <span className="font-semibold text-gray-900">{studentData.parentName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Email:</span>
                      <span className="font-semibold text-gray-900">{studentData.parentEmail}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Phone:</span>
                      <span className="font-semibold text-gray-900">{studentData.parentPhone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-600 w-32">Admission Date:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(studentData.admissionDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-Powered Insights */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="text-indigo-600" size={20} />
                  AI-Powered Insights
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-xl ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start gap-3">
                        <div className={
                          insight.type === 'strength' ? 'text-green-600' :
                          insight.type === 'improvement' ? 'text-yellow-600' :
                          insight.type === 'behavior' ? 'text-blue-600' :
                          'text-red-600'
                        }>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              Confidence: {insight.confidence}%
                            </span>
                            <button className="text-xs font-semibold text-indigo-600 hover:underline">
                              {insight.action} →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Trend */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={20} />
                  Performance Trend (6 Months)
                </h3>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-end justify-between gap-2 h-48">
                    {academicData.performanceHistory.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{data.score}%</span>
                        <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '100%' }}>
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg"
                            style={{ height: `${(data.score / 100) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Performance Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              {Object.entries(academicData.subjects).map(([subject, data]) => (
                <div key={subject} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{subject}</h3>
                      <p className="text-sm text-gray-600">Teacher: {data.teacher}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-4 py-2 rounded-lg text-xl font-bold ${getScoreColor(data.currentScore)}`}>
                          {data.currentScore}%
                        </span>
                        {data.trend === 'up' ? (
                          <TrendingUp className="text-green-600" size={20} />
                        ) : (
                          <TrendingDown className="text-red-600" size={20} />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">Previous: {data.previousScore}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Assignments */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Assignments</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-semibold text-green-700">{data.assignments.completed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-semibold text-orange-700">{data.assignments.pending}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-semibold text-gray-900">{data.assignments.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Tests */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Tests</h4>
                      <div className="space-y-2">
                        {data.tests.slice(0, 3).map((test, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 truncate flex-1">{test.name}</span>
                            <span className={`font-semibold px-2 py-0.5 rounded ml-2 ${getScoreColor(test.score)}`}>
                              {test.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {data.strengths.map((strength, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {strength}
                          </span>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Needs Work</h4>
                      <div className="flex flex-wrap gap-1">
                        {data.weaknesses.map((weakness, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            {weakness}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

           // Continuation of StudentInsights.jsx - Attendance and Behavior Tabs

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Monthly Attendance Chart */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={20} />
                  Monthly Attendance Overview
                </h3>
                <div className="flex items-end justify-between gap-2 h-64">
                  {attendanceData.monthlyData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{data.percentage}%</span>
                      <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '100%' }}>
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg"
                          style={{ height: `${data.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                      <div className="text-xs text-gray-500">
                        <div>{data.present}P</div>
                        <div>{data.absent}A</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <CheckCircle className="text-green-600" size={28} />
                    <span className="text-2xl font-bold text-green-700">{attendanceData.totalPresent}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Total Present</p>
                  <p className="text-xs text-gray-600 mt-1">Out of {attendanceData.totalClasses} classes</p>
                </div>

                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <XCircle className="text-red-600" size={28} />
                    <span className="text-2xl font-bold text-red-700">{attendanceData.totalAbsent}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Total Absent</p>
                  <p className="text-xs text-gray-600 mt-1">Missing classes</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <BarChart3 className="text-blue-600" size={28} />
                    <span className="text-2xl font-bold text-blue-700">{attendanceData.overall}%</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Overall Rate</p>
                  <p className="text-xs text-gray-600 mt-1">Excellent attendance</p>
                </div>
              </div>

              {/* Recent Attendance Records */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="text-gray-600" size={20} />
                  Recent Attendance Records
                </h3>
                <div className="space-y-3">
                  {attendanceData.recentRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          record.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-IN', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-gray-600">{record.subject}</p>
                          {record.reason && (
                            <p className="text-xs text-orange-600 mt-1">Reason: {record.reason}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'present' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Behavior & Growth Tab */}
          {activeTab === 'behavior' && (
            <div className="space-y-6">
              {/* Behavior Scores */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Discipline</p>
                  <p className="text-3xl font-bold text-purple-700">{behaviorData.disciplineScore}%</p>
                  <div className="mt-3 w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${behaviorData.disciplineScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Participation</p>
                  <p className="text-3xl font-bold text-blue-700">{behaviorData.participationScore}%</p>
                  <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${behaviorData.participationScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Teamwork</p>
                  <p className="text-3xl font-bold text-green-700">{behaviorData.teamworkScore}%</p>
                  <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${behaviorData.teamworkScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Leadership</p>
                  <p className="text-3xl font-bold text-orange-700">{behaviorData.leadershipScore}%</p>
                  <div className="mt-3 w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: `${behaviorData.leadershipScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="text-yellow-600" size={20} />
                  Recent Achievements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {behaviorData.achievements.map((achievement, index) => (
                    <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <Award className="text-yellow-600 mt-1" size={24} />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{achievement.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{achievement.category}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(achievement.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavioral Incidents */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-gray-600" size={20} />
                  Behavioral Records
                </h3>
                <div className="space-y-3">
                  {behaviorData.incidents.map((incident, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      incident.type === 'positive' 
                        ? 'bg-green-50 border-green-500' 
                        : incident.type === 'neutral'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-red-50 border-red-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{incident.description}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(incident.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          incident.type === 'positive' 
                            ? 'bg-green-100 text-green-700' 
                            : incident.type === 'neutral'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Remarks */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="text-indigo-600" size={20} />
                  Teacher Remarks
                </h3>
                <div className="space-y-4">
                  {behaviorData.teacherRemarks.map((remark, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{remark.teacher}</p>
                          <p className="text-sm text-gray-600">{remark.subject}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(remark.date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{remark.remark}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentInsights;