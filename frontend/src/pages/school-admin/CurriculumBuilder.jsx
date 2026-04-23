// src/pages/school-admin/curriculum/CurriculumBuilder.jsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit, Trash2, Copy, Save, Download, Upload, Eye,
  ChevronDown, ChevronRight, FileText, Video, Image, Link, CheckCircle,
  Calendar, Clock, Users, Target, Award, Search, Filter, Grid, List,
  Settings, Share2, Printer, RefreshCw, AlertCircle, Info, Star,
  Layers, Move, GripVertical, Play, Pause, BarChart3, TrendingUp,
  BookMarked, Clipboard, AlignLeft, Code, Music, Globe, Brain,
} from 'lucide-react';

const CurriculumBuilder = () => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [curriculum, setCurriculum] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'grid'
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Arts', 'Physical Education', 'Music'];

  const lessonTypes = [
    { value: 'lecture', label: 'Lecture', icon: BookOpen },
    { value: 'practical', label: 'Practical', icon: Brain },
    { value: 'assessment', label: 'Assessment', icon: CheckCircle },
    { value: 'discussion', label: 'Discussion', icon: Users },
    { value: 'project', label: 'Project', icon: Layers },
  ];

  const resourceTypes = [
    { value: 'document', label: 'Document', icon: FileText },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'image', label: 'Image', icon: Image },
    { value: 'link', label: 'Link', icon: Link },
    { value: 'audio', label: 'Audio', icon: Music },
  ];

  useEffect(() => {
    if (selectedGrade && selectedSubject) {
      loadCurriculum();
    }
  }, [selectedGrade, selectedSubject]);

  const loadCurriculum = () => {
    setLoading(true);
    setTimeout(() => {
      // Mock curriculum data
      setCurriculum({
        id: 1,
        grade: selectedGrade,
        subject: selectedSubject,
        year: '2024-2025',
        status: 'active',
        lastModified: '2024-03-20',
        units: [
          {
            id: 1,
            title: 'Introduction to Algebra',
            description: 'Fundamental concepts of algebraic expressions and equations',
            order: 1,
            duration: '4 weeks',
            objectives: [
              'Understand variables and constants',
              'Solve linear equations',
              'Apply algebraic concepts to real-world problems',
            ],
            standards: ['CCSS.MATH.CONTENT.8.EE.A.1', 'CCSS.MATH.CONTENT.8.EE.B.5'],
            lessons: [
              {
                id: 1,
                title: 'Variables and Expressions',
                type: 'lecture',
                duration: 45,
                order: 1,
                description: 'Introduction to variables, constants, and algebraic expressions',
                objectives: ['Define variables and constants', 'Write algebraic expressions'],
                activities: ['Warm-up exercises', 'Guided practice', 'Group work'],
                resources: [
                  { id: 1, type: 'document', name: 'Lesson Plan.pdf', size: '2.3 MB' },
                  { id: 2, type: 'video', name: 'Introduction Video.mp4', size: '45 MB' },
                  { id: 3, type: 'link', name: 'Khan Academy', url: 'https://...' },
                ],
                assessment: 'Quiz on expressions',
                homework: 'Practice worksheet pages 12-15',
              },
              {
                id: 2,
                title: 'Solving Linear Equations',
                type: 'practical',
                duration: 60,
                order: 2,
                description: 'Hands-on practice with solving one and two-step equations',
                objectives: ['Solve one-step equations', 'Solve two-step equations'],
                activities: ['Individual practice', 'Peer teaching', 'Real-world applications'],
                resources: [
                  { id: 4, type: 'document', name: 'Practice Problems.pdf', size: '1.8 MB' },
                  { id: 5, type: 'image', name: 'Equation Diagrams.png', size: '800 KB' },
                ],
                assessment: 'Problem-solving activity',
                homework: 'Complete 20 practice problems',
              },
            ],
            progress: 65,
            status: 'in-progress',
          },
          {
            id: 2,
            title: 'Geometry Basics',
            description: 'Introduction to geometric shapes, angles, and measurements',
            order: 2,
            duration: '3 weeks',
            objectives: [
              'Identify geometric shapes',
              'Measure angles and lines',
              'Calculate area and perimeter',
            ],
            standards: ['CCSS.MATH.CONTENT.8.G.A.1', 'CCSS.MATH.CONTENT.8.G.B.7'],
            lessons: [
              {
                id: 3,
                title: 'Angles and Lines',
                type: 'lecture',
                duration: 45,
                order: 1,
                description: 'Understanding different types of angles and line relationships',
                objectives: ['Classify angles', 'Identify parallel and perpendicular lines'],
                activities: ['Angle measurement practice', 'Drawing exercises'],
                resources: [
                  { id: 6, type: 'document', name: 'Geometry Guide.pdf', size: '3.2 MB' },
                ],
                assessment: 'Angle identification quiz',
                homework: 'Draw and label 10 different angles',
              },
            ],
            progress: 20,
            status: 'scheduled',
          },
          {
            id: 3,
            title: 'Statistics and Probability',
            description: 'Data analysis, graphs, and basic probability concepts',
            order: 3,
            duration: '5 weeks',
            objectives: [
              'Create and interpret graphs',
              'Calculate mean, median, mode',
              'Understand probability basics',
            ],
            standards: ['CCSS.MATH.CONTENT.8.SP.A.1', 'CCSS.MATH.CONTENT.8.SP.A.4'],
            lessons: [],
            progress: 0,
            status: 'not-started',
          },
        ],
        totalLessons: 25,
        completedLessons: 15,
        totalDuration: '12 weeks',
      });
      setLoading(false);
    }, 800);
  };

  const toggleUnit = (unitId) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const handleAddUnit = (unitData) => {
    console.log('Adding unit:', unitData);
    setShowAddUnitModal(false);
    loadCurriculum();
  };

  const handleAddLesson = (lessonData) => {
    console.log('Adding lesson:', lessonData);
    setShowAddLessonModal(false);
    loadCurriculum();
  };

  const handleDeleteUnit = (unitId) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      console.log('Deleting unit:', unitId);
      loadCurriculum();
    }
  };

  const handleDeleteLesson = (lessonId) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      console.log('Deleting lesson:', lessonId);
      loadCurriculum();
    }
  };

  const handleSaveCurriculum = () => {
    alert('Curriculum saved successfully!');
  };

  const handlePublishCurriculum = () => {
    if (confirm('Publish this curriculum? It will be available to all teachers.')) {
      alert('Curriculum published successfully!');
    }
  };

  if (!selectedGrade || !selectedSubject) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Curriculum Builder</h1>
              <p className="text-gray-600">Create and manage comprehensive curriculum plans</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Select Grade" required>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Select Subject" required>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedGrade}
                  >
                    <option value="">Choose subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => selectedGrade && selectedSubject && loadCurriculum()}
                  disabled={!selectedGrade || !selectedSubject}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Load Curriculum</span>
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
          <p className="text-gray-600">Loading curriculum...</p>
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
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedSubject} Curriculum</h1>
                  <p className="text-gray-600">{selectedGrade} • Academic Year {curriculum.year}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedGrade('');
                setSelectedSubject('');
                setCurriculum(null);
              }}
              className="mt-4 md:mt-0 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Change Subject
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <StatCard icon={Layers} label="Total Units" value={curriculum.units.length} color="blue" />
            <StatCard icon={BookMarked} label="Total Lessons" value={curriculum.totalLessons} color="purple" />
            <StatCard icon={CheckCircle} label="Completed" value={curriculum.completedLessons} color="green" />
            <StatCard icon={Clock} label="Duration" value={curriculum.totalDuration} color="orange" />
            <StatCard icon={TrendingUp} label="Progress" value={`${Math.round((curriculum.completedLessons / curriculum.totalLessons) * 100)}%`} color="indigo" />
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddUnitModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Unit</span>
              </button>

              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`p-2 rounded ${viewMode === 'tree' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveCurriculum}
                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={handlePublishCurriculum}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Publish</span>
              </button>
              <button
                onClick={() => alert('Export curriculum')}
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

        {/* Curriculum Content */}
        {viewMode === 'tree' ? (
          <div className="space-y-4">
            {curriculum.units.map((unit, index) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                index={index}
                isExpanded={expandedUnits.has(unit.id)}
                onToggle={() => toggleUnit(unit.id)}
                onEdit={() => alert('Edit unit')}
                onDelete={() => handleDeleteUnit(unit.id)}
                onAddLesson={() => {
                  setSelectedUnit(unit);
                  setShowAddLessonModal(true);
                }}
                onEditLesson={(lesson) => {
                  setSelectedLesson(lesson);
                  alert('Edit lesson');
                }}
                onDeleteLesson={handleDeleteLesson}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.units.map((unit) => (
              <UnitGridCard
                key={unit.id}
                unit={unit}
                onEdit={() => alert('Edit unit')}
                onDelete={() => handleDeleteUnit(unit.id)}
                onView={() => {
                  setSelectedUnit(unit);
                  toggleUnit(unit.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddUnitModal && (
        <AddUnitModal
          onClose={() => setShowAddUnitModal(false)}
          onSubmit={handleAddUnit}
        />
      )}

      {showAddLessonModal && selectedUnit && (
        <AddLessonModal
          unit={selectedUnit}
          onClose={() => {
            setShowAddLessonModal(false);
            setSelectedUnit(null);
          }}
          onSubmit={handleAddLesson}
          lessonTypes={lessonTypes}
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
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm opacity-90">{label}</span>
        <Icon className="w-5 h-5 opacity-90" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

const UnitCard = ({ unit, index, isExpanded, onToggle, onEdit, onDelete, onAddLesson, onEditLesson, onDeleteLesson }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Unit Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <button
              onClick={onToggle}
              className="p-1 hover:bg-white/20 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm opacity-90">Unit {index + 1}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(unit.status)} bg-white/20`}>
                  {unit.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">{unit.title}</h3>
              <p className="text-sm opacity-90 mb-3">{unit.description}</p>
              <div className="flex items-center space-x-4 text-sm opacity-90">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{unit.duration}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <BookMarked className="w-4 h-4" />
                  <span>{unit.lessons.length} lessons</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{unit.objectives.length} objectives</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{unit.progress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${unit.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Objectives */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              Learning Objectives
            </h4>
            <ul className="space-y-2">
              {unit.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards */}
          {unit.standards && unit.standards.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2 text-purple-600" />
                Standards Alignment
              </h4>
              <div className="flex flex-wrap gap-2">
                {unit.standards.map((standard, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lessons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <BookMarked className="w-4 h-4 mr-2 text-orange-600" />
                Lessons ({unit.lessons.length})
              </h4>
              <button
                onClick={onAddLesson}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lesson</span>
              </button>
            </div>
            {unit.lessons.length > 0 ? (
              <div className="space-y-3">
                {unit.lessons.map((lesson, idx) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={idx}
                    onEdit={() => onEditLesson(lesson)}
                    onDelete={() => onDeleteLesson(lesson.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No lessons added yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UnitGridCard = ({ unit, onEdit, onDelete, onView }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'in-progress': return 'border-blue-500 bg-blue-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'scheduled': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 ${getStatusColor(unit.status)} hover:shadow-xl transition-shadow cursor-pointer`} onClick={onView}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">{unit.title}</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{unit.description}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{unit.duration}</span>
            </span>
            <span className="flex items-center space-x-1">
              <BookMarked className="w-4 h-4" />
              <span>{unit.lessons.length} lessons</span>
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{unit.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 rounded-full h-2 transition-all"
                style={{ width: `${unit.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LessonCard = ({ lesson, index, onEdit, onDelete }) => {
  const getLessonIcon = (type) => {
    switch(type) {
      case 'lecture': return BookOpen;
      case 'practical': return Brain;
      case 'assessment': return CheckCircle;
      case 'discussion': return Users;
      case 'project': return Layers;
      default: return FileText;
    }
  };

  const Icon = getLessonIcon(lesson.type);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs text-gray-500">Lesson {index + 1}</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                {lesson.type}
              </span>
            </div>
            <h5 className="font-semibold text-gray-900 mb-1">{lesson.title}</h5>
            <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{lesson.duration} min</span>
              </span>
              {lesson.resources && (
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>{lesson.resources.length} resources</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Trash2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AddUnitModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    objectives: [''],
    standards: [''],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal title="Add New Unit" onClose={onClose} size="large">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Unit Title" required>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </FormField>

        <FormField label="Description" required>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            required
          />
        </FormField>

        <FormField label="Duration">
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            placeholder="e.g., 4 weeks"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Unit
          </button>
        </div>
      </form>
    </Modal>
  );
};

const AddLessonModal = ({ unit, onClose, onSubmit, lessonTypes }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'lecture',
    duration: 45,
    description: '',
    objectives: [''],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal title={`Add Lesson to ${unit.title}`} onClose={onClose} size="large">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Lesson Title" required>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Lesson Type" required>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {lessonTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Duration (minutes)" required>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
          </FormField>
        </div>

        <FormField label="Description">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </FormField>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Lesson
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Modal = ({ title, children, onClose, size = 'medium' }) => {
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full my-8`}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <AlertCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
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

export default CurriculumBuilder;