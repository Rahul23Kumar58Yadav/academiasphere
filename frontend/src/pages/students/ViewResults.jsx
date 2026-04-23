import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  BarChart3,
  Trophy,
  Target,
  BookOpen,
  Calendar,
  Filter,
  RefreshCw,
  Star,
  AlertCircle,
  CheckCircle,
  Medal
} from 'lucide-react';
import toast from 'react-hot-toast';

const ViewResults = () => {
  const [selectedExam, setSelectedExam] = useState('mid-term-2025');
  const [viewMode, setViewMode] = useState('detailed'); // detailed or summary
  const [loading, setLoading] = useState(false);

  // Mock results data
  const exams = [
    { id: 'mid-term-2025', name: 'Mid-Term Examination 2025', date: '2025-11-15', type: 'Mid-Term' },
    { id: 'unit-test-3', name: 'Unit Test 3', date: '2025-12-01', type: 'Unit Test' },
    { id: 'quarterly-2025', name: 'Quarterly Examination 2025', date: '2025-09-20', type: 'Quarterly' },
    { id: 'half-yearly-2025', name: 'Half Yearly Examination 2025', date: '2025-07-15', type: 'Half Yearly' }
  ];

  const resultsData = {
    'mid-term-2025': {
      examName: 'Mid-Term Examination 2025',
      examDate: '2025-11-15',
      resultDate: '2025-11-25',
      totalMarks: 600,
      marksObtained: 525,
      percentage: 87.5,
      grade: 'A',
      rank: 5,
      totalStudents: 42,
      status: 'Published',
      subjects: [
        {
          name: 'Mathematics',
          totalMarks: 100,
          marksObtained: 92,
          grade: 'A+',
          teacher: 'Ms. Priya Sharma',
          remarks: 'Excellent problem-solving skills',
          strengths: ['Algebra', 'Geometry'],
          weaknesses: ['Speed in calculations'],
          trend: 'up',
          previousMarks: 87
        },
        {
          name: 'Science',
          totalMarks: 100,
          marksObtained: 88,
          grade: 'A',
          teacher: 'Mr. Amit Verma',
          remarks: 'Good understanding of concepts',
          strengths: ['Physics', 'Lab Work'],
          weaknesses: ['Chemistry equations'],
          trend: 'up',
          previousMarks: 85
        },
        {
          name: 'English',
          totalMarks: 100,
          marksObtained: 85,
          grade: 'A',
          teacher: 'Mrs. Sarah Gupta',
          remarks: 'Improve creative writing',
          strengths: ['Reading', 'Vocabulary'],
          weaknesses: ['Grammar', 'Essay writing'],
          trend: 'neutral',
          previousMarks: 85
        },
        {
          name: 'Hindi',
          totalMarks: 100,
          marksObtained: 90,
          grade: 'A+',
          teacher: 'Mr. Rajesh Singh',
          remarks: 'Outstanding performance',
          strengths: ['Literature', 'Grammar'],
          weaknesses: ['Handwriting'],
          trend: 'up',
          previousMarks: 88
        },
        {
          name: 'Social Studies',
          totalMarks: 100,
          marksObtained: 86,
          grade: 'A',
          teacher: 'Ms. Kavya Reddy',
          remarks: 'Good analytical skills',
          strengths: ['History', 'Geography'],
          weaknesses: ['Political Science'],
          trend: 'up',
          previousMarks: 84
        },
        {
          name: 'Computer Science',
          totalMarks: 100,
          marksObtained: 84,
          grade: 'A',
          teacher: 'Mr. Vikram Patel',
          remarks: 'Strong programming skills',
          strengths: ['Coding', 'Logic'],
          weaknesses: ['Theory concepts'],
          trend: 'down',
          previousMarks: 86
        }
      ]
    }
  };

  const currentResult = resultsData[selectedExam];

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'bg-green-500 text-white',
      'A': 'bg-blue-500 text-white',
      'B+': 'bg-yellow-500 text-white',
      'B': 'bg-orange-500 text-white',
      'C': 'bg-red-500 text-white',
      'F': 'bg-gray-500 text-white'
    };
    return colors[grade] || 'bg-gray-500 text-white';
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { label: 'Outstanding', color: 'text-green-600', icon: Trophy };
    if (percentage >= 80) return { label: 'Excellent', color: 'text-blue-600', icon: Award };
    if (percentage >= 70) return { label: 'Good', color: 'text-yellow-600', icon: Star };
    if (percentage >= 60) return { label: 'Satisfactory', color: 'text-orange-600', icon: CheckCircle };
    return { label: 'Needs Improvement', color: 'text-red-600', icon: AlertCircle };
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Results refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    toast.success('Downloading result report...');
  };

  const performanceLevel = getPerformanceLevel(currentResult?.percentage || 0);
  const PerformanceIcon = performanceLevel.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
            <p className="text-gray-600 mt-1">View your academic performance and progress</p>
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
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} />
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Exam Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-3">
          {exams.map(exam => (
            <button
              key={exam.id}
              onClick={() => setSelectedExam(exam.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedExam === exam.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-left">
                <p className="font-bold">{exam.name}</p>
                <p className="text-xs opacity-75">{new Date(exam.date).toLocaleDateString('en-IN')}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {currentResult ? (
        <>
          {/* Overall Performance Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex flex-wrap justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-white bg-opacity-30 rounded-2xl flex items-center justify-center">
                    <PerformanceIcon size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{currentResult.percentage}%</h2>
                    <p className="text-indigo-100">Overall Percentage</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white bg-opacity-20 rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Total Marks</p>
                    <p className="text-2xl font-bold">{currentResult.totalMarks}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Marks Obtained</p>
                    <p className="text-2xl font-bold">{currentResult.marksObtained}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Grade</p>
                    <p className="text-2xl font-bold">{currentResult.grade}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Class Rank</p>
                    <p className="text-2xl font-bold">#{currentResult.rank}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-2xl p-6 text-center min-w-[200px]">
                <Trophy size={48} className="mx-auto mb-3" />
                <p className="text-sm opacity-90 mb-1">Performance Level</p>
                <p className="text-2xl font-bold mb-2">{performanceLevel.label}</p>
                <p className="text-xs opacity-75">Rank {currentResult.rank} out of {currentResult.totalStudents}</p>
              </div>
            </div>
          </div>

          {/* Subject-wise Results */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Subject-wise Performance</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    viewMode === 'detailed'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Detailed
                </button>
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    viewMode === 'summary'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Summary
                </button>
              </div>
            </div>

            {viewMode === 'detailed' ? (
              <div className="space-y-4">
                {currentResult.subjects.map((subject, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                          <span className={`px-3 py-1 rounded-lg font-bold shadow-sm ${getGradeColor(subject.grade)}`}>
                            {subject.grade}
                          </span>
                          {subject.trend === 'up' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp size={18} />
                              <span className="text-sm font-semibold">Improved</span>
                            </div>
                          )}
                          {subject.trend === 'down' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <TrendingDown size={18} />
                              <span className="text-sm font-semibold">Declined</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Teacher: {subject.teacher}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">{subject.marksObtained}</p>
                        <p className="text-sm text-gray-600">out of {subject.totalMarks}</p>
                        <p className="text-lg font-semibold text-indigo-600 mt-1">
                          {((subject.marksObtained / subject.totalMarks) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                          style={{ width: `${(subject.marksObtained / subject.totalMarks) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Comparison with Previous */}
                    {subject.previousMarks && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Previous Score:</span>
                          <span className="font-semibold text-gray-900">{subject.previousMarks}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-gray-600">Improvement:</span>
                          <span className={`font-bold ${
                            subject.marksObtained > subject.previousMarks ? 'text-green-600' :
                            subject.marksObtained < subject.previousMarks ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {subject.marksObtained > subject.previousMarks ? '+' : ''}
                            {subject.marksObtained - subject.previousMarks} marks
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Strengths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {subject.strengths.map((strength, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-medium">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                          <AlertCircle size={16} />
                          Areas to Improve
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {subject.weaknesses.map((weakness, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">
                              {weakness}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Teacher Remarks */}
                    {subject.remarks && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">Teacher's Remarks</h4>
                        <p className="text-sm text-blue-800">{subject.remarks}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Summary View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentResult.subjects.map((subject, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900">{subject.name}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Score</span>
                        <span className="font-bold text-gray-900">
                          {subject.marksObtained}/{subject.totalMarks}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                          style={{ width: `${(subject.marksObtained / subject.totalMarks) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Percentage</span>
                      <span className="font-bold text-indigo-600">
                        {((subject.marksObtained / subject.totalMarks) * 100).toFixed(1)}%
                      </span>
                    </div>

                    {subject.trend !== 'neutral' && (
                      <div className={`mt-3 flex items-center gap-1 text-sm ${
                        subject.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {subject.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="font-semibold">
                          {subject.trend === 'up' ? 'Improved' : 'Declined'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Grade Distribution</h3>
              <div className="space-y-3">
                {['A+', 'A', 'B+', 'B'].map(grade => {
                  const count = currentResult.subjects.filter(s => s.grade === grade).length;
                  const percentage = (count / currentResult.subjects.length) * 100;
                  return (
                    <div key={grade}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">Grade {grade}</span>
                        <span className="text-gray-600">{count} subjects</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getGradeColor(grade)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Subjects */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Performing Subjects</h3>
              <div className="space-y-3">
                {[...currentResult.subjects]
                  .sort((a, b) => b.marksObtained - a.marksObtained)
                  .slice(0, 5)
                  .map((subject, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{subject.name}</p>
                        <p className="text-sm text-gray-600">{subject.marksObtained} marks</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">No results available</p>
          <p className="text-sm text-gray-600 mt-1">Results for this examination are not yet published</p>
        </div>
      )}
    </div>
  );
};

export default ViewResults;