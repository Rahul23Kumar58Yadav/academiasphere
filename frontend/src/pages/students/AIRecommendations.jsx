import React, { useState } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Clock,
  BarChart3,
  Sparkles,
  Star,
  RefreshCw,
  Download,
  Play,
  FileText,
  Users,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const AIRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, academic, study, wellness

  // Mock AI recommendations data
  const recommendations = {
    overview: {
      overallScore: 87.5,
      studyEfficiency: 82,
      improvementPotential: 15,
      strongSubjects: 3,
      needsAttention: 2,
      lastAnalyzed: '2025-12-19'
    },
    insights: [
      {
        id: 1,
        category: 'academic',
        priority: 'high',
        title: 'Mathematics Excellence Path',
        icon: Target,
        description: 'Based on your consistent 92% average in Mathematics, you have strong potential for advanced topics.',
        recommendation: 'Consider enrolling in Math Olympiad preparation or advanced problem-solving courses.',
        actionItems: [
          'Practice 5 advanced problems daily',
          'Join the school Math club',
          'Participate in online competitions'
        ],
        estimatedImpact: '+8% improvement potential',
        confidence: 94
      },
      {
        id: 2,
        category: 'academic',
        priority: 'high',
        title: 'Grammar Enhancement Needed',
        icon: AlertCircle,
        description: 'Analysis shows consistent challenges with English grammar concepts.',
        recommendation: 'Dedicate 20 minutes daily to grammar exercises and practice tests.',
        actionItems: [
          'Complete grammar workbook Chapter 3-5',
          'Use grammar checking apps',
          'Practice essay writing weekly'
        ],
        estimatedImpact: '+12% improvement potential',
        confidence: 89
      },
      {
        id: 3,
        category: 'study',
        priority: 'medium',
        title: 'Optimize Study Schedule',
        icon: Clock,
        description: 'Your peak performance hours are 6-8 AM and 6-8 PM based on test scores.',
        recommendation: 'Schedule difficult subjects during your peak hours for better retention.',
        actionItems: [
          'Study Math and Science in morning',
          'Review languages in evening',
          'Take breaks every 45 minutes'
        ],
        estimatedImpact: '+10% efficiency boost',
        confidence: 92
      },
      {
        id: 4,
        category: 'study',
        priority: 'medium',
        title: 'Strengthen Chemistry Foundation',
        icon: BookOpen,
        description: 'Chemical equations and balancing showing gaps in understanding.',
        recommendation: 'Focus on fundamental concepts before moving to complex topics.',
        actionItems: [
          'Revisit periodic table basics',
          'Practice balancing equations daily',
          'Watch conceptual videos'
        ],
        estimatedImpact: '+15% score improvement',
        confidence: 87
      },
      {
        id: 5,
        category: 'wellness',
        priority: 'medium',
        title: 'Maintain Excellent Attendance',
        icon: CheckCircle,
        description: 'Your 94.5% attendance is excellent. Consistency correlates with better performance.',
        recommendation: 'Continue current attendance patterns and plan ahead for unavoidable absences.',
        actionItems: [
          'Keep attendance above 95%',
          'Catch up immediately after any absence',
          'Maintain health routines'
        ],
        estimatedImpact: 'Sustain current performance',
        confidence: 96
      },
      {
        id: 6,
        category: 'academic',
        priority: 'low',
        title: 'Leverage Strong Hindi Skills',
        icon: Star,
        description: 'Consistent 90% scores in Hindi show language aptitude.',
        recommendation: 'Use this strength to improve other language subjects using similar techniques.',
        actionItems: [
          'Apply reading techniques to English',
          'Create vocabulary lists like Hindi',
          'Practice translation exercises'
        ],
        estimatedImpact: '+5% in language subjects',
        confidence: 85
      },
      {
        id: 7,
        category: 'study',
        priority: 'high',
        title: 'Enhanced Lab Preparation',
        icon: Sparkles,
        description: 'Lab performance can improve with better pre-lab preparation.',
        recommendation: 'Review lab procedures and theory before practical sessions.',
        actionItems: [
          'Read lab manual 1 day before',
          'Watch demo videos',
          'Prepare observation tables in advance'
        ],
        estimatedImpact: '+8% in practical exams',
        confidence: 90
      },
      {
        id: 8,
        category: 'wellness',
        priority: 'low',
        title: 'Balanced Study-Life Integration',
        icon: Users,
        description: 'Your extracurricular participation enhances overall development.',
        recommendation: 'Continue balancing academics with sports and arts activities.',
        actionItems: [
          'Maintain cricket practice schedule',
          'Continue music classes',
          'Allocate time for hobbies'
        ],
        estimatedImpact: 'Better stress management',
        confidence: 88
      }
    ],
    studyPlan: {
      daily: [
        { time: '06:00 - 07:30', activity: 'Mathematics - Problem Solving', priority: 'high' },
        { time: '07:30 - 08:00', activity: 'Breakfast & Preparation', priority: 'medium' },
        { time: '08:00 - 12:45', activity: 'School Classes', priority: 'high' },
        { time: '12:45 - 13:30', activity: 'Lunch & Rest', priority: 'medium' },
        { time: '16:00 - 17:00', activity: 'Homework & Assignments', priority: 'high' },
        { time: '17:00 - 18:00', activity: 'Sports / Physical Activity', priority: 'medium' },
        { time: '18:30 - 20:00', activity: 'Subject Revision - Rotation', priority: 'high' },
        { time: '20:30 - 21:00', activity: 'Light Reading / Relaxation', priority: 'low' }
      ],
      weekly: [
        { day: 'Monday', focus: 'Mathematics & Science', duration: '3 hours' },
        { day: 'Tuesday', focus: 'Languages (English & Hindi)', duration: '3 hours' },
        { day: 'Wednesday', focus: 'Science & Social Studies', duration: '3 hours' },
        { day: 'Thursday', focus: 'Computer Science & Math', duration: '3 hours' },
        { day: 'Friday', focus: 'Comprehensive Review', duration: '2.5 hours' },
        { day: 'Saturday', focus: 'Practice Tests & Weak Areas', duration: '3 hours' },
        { day: 'Sunday', focus: 'Light Revision & Planning', duration: '2 hours' }
      ]
    },
    resources: [
      {
        id: 1,
        title: 'Advanced Mathematics Practice',
        type: 'Practice',
        subject: 'Mathematics',
        difficulty: 'Advanced',
        estimatedTime: '30 min/day',
        link: '#'
      },
      {
        id: 2,
        title: 'English Grammar Masterclass',
        type: 'Video Course',
        subject: 'English',
        difficulty: 'Intermediate',
        estimatedTime: '45 min/day',
        link: '#'
      },
      {
        id: 3,
        title: 'Chemistry Lab Techniques',
        type: 'Tutorial',
        subject: 'Science',
        difficulty: 'Beginner',
        estimatedTime: '20 min/session',
        link: '#'
      },
      {
        id: 4,
        title: 'Study Techniques & Time Management',
        type: 'Guide',
        subject: 'General',
        difficulty: 'All Levels',
        estimatedTime: '1 hour',
        link: '#'
      }
    ],
    goals: [
      {
        id: 1,
        goal: 'Achieve 95%+ in Mathematics',
        currentProgress: 92,
        targetProgress: 95,
        deadline: '2026-03-15',
        status: 'on-track'
      },
      {
        id: 2,
        goal: 'Improve English to 90%',
        currentProgress: 85,
        targetProgress: 90,
        deadline: '2026-03-15',
        status: 'needs-effort'
      },
      {
        id: 3,
        goal: 'Maintain 95%+ Attendance',
        currentProgress: 94.5,
        targetProgress: 95,
        deadline: '2026-03-31',
        status: 'on-track'
      }
    ]
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return badges[priority] || badges.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      academic: BookOpen,
      study: Lightbulb,
      wellness: Users
    };
    return icons[category] || Lightbulb;
  };

  const getStatusColor = (status) => {
    const colors = {
      'on-track': 'bg-green-100 text-green-800',
      'needs-effort': 'bg-yellow-100 text-yellow-800',
      'behind': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['needs-effort'];
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('AI analysis refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh recommendations');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = selectedCategory === 'all'
    ? recommendations.insights
    : recommendations.insights.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI-Powered Recommendations</h1>
              <p className="text-gray-600 mt-1">Personalized insights to boost your performance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <Award size={28} className="mb-3" />
          <p className="text-sm opacity-90 mb-1">Overall Score</p>
          <p className="text-4xl font-bold">{recommendations.overview.overallScore}%</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <TrendingUp size={28} className="mb-3" />
          <p className="text-sm opacity-90 mb-1">Study Efficiency</p>
          <p className="text-4xl font-bold">{recommendations.overview.studyEfficiency}%</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <Target size={28} className="mb-3" />
          <p className="text-sm opacity-90 mb-1">Improvement Potential</p>
          <p className="text-4xl font-bold">+{recommendations.overview.improvementPotential}%</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <Star size={28} className="mb-3" />
          <p className="text-sm opacity-90 mb-1">Strong Subjects</p>
          <p className="text-4xl font-bold">{recommendations.overview.strongSubjects}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <AlertCircle size={28} className="mb-3" />
          <p className="text-sm opacity-90 mb-1">Needs Attention</p>
          <p className="text-4xl font-bold">{recommendations.overview.needsAttention}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'all', label: 'All Recommendations', icon: Brain },
            { id: 'academic', label: 'Academic', icon: BookOpen },
            { id: 'study', label: 'Study Tips', icon: Lightbulb },
            { id: 'wellness', label: 'Wellness', icon: Users }
          ].map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={18} />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-4">
        {filteredRecommendations.map(insight => {
          const IconComponent = insight.icon;
          return (
            <div
              key={insight.id}
              className={`bg-white rounded-xl shadow-sm border-l-4 p-6 hover:shadow-md transition-all ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <IconComponent size={24} className="text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{insight.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPriorityBadge(insight.priority)}`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{insight.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-purple-600 mb-1">
                        <Zap size={14} />
                        <span className="font-semibold">AI Confidence</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{insight.confidence}%</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                    <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Lightbulb size={16} />
                      AI Recommendation
                    </h4>
                    <p className="text-sm text-blue-800">{insight.recommendation}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Action Steps:</h4>
                    <ul className="space-y-2">
                      {insight.actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200">
                      <span className="text-xs font-semibold">Estimated Impact: </span>
                      <span className="font-bold">{insight.estimatedImpact}</span>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm">
                      <Play size={16} />
                      Start Action Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI-Generated Study Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="text-purple-600" size={24} />
            Optimized Daily Schedule
          </h2>
          <div className="space-y-2">
            {recommendations.studyPlan.daily.map((slot, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  slot.priority === 'high' ? 'border-red-500 bg-red-50' :
                  slot.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{slot.activity}</p>
                    <p className="text-xs text-gray-600">{slot.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    slot.priority === 'high' ? 'bg-red-200 text-red-800' :
                    slot.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {slot.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Focus */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24} />
            Weekly Focus Areas
          </h2>
          <div className="space-y-3">
            {recommendations.studyPlan.weekly.map((plan, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{plan.day}</h4>
                  <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded font-semibold">
                    {plan.duration}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{plan.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Resources */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="text-green-600" size={24} />
          Recommended Learning Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.resources.map(resource => (
            <div key={resource.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900">{resource.title}</h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                  {resource.type}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subject:</span>
                  <span className="font-semibold text-gray-900">{resource.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span>Difficulty:</span>
                  <span className="font-semibold text-gray-900">{resource.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Required:</span>
                  <span className="font-semibold text-gray-900">{resource.estimatedTime}</span>
                </div>
              </div>
              <button className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm">
                Access Resource →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Goals Progress */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="text-orange-600" size={24} />
          Your Goals & Progress
        </h2>
        <div className="space-y-4">
          {recommendations.goals.map(goal => (
            <div key={goal.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{goal.goal}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Deadline: {new Date(goal.deadline).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(goal.status)}`}>
                  {goal.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Progress</span>
                  <span className="font-bold text-gray-900">{goal.currentProgress}% / {goal.targetProgress}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${(goal.currentProgress / goal.targetProgress) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;