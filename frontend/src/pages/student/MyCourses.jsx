// src/pages/student/courses/MyCourses.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BookOpen, TrendingUp,
  CheckCircle, AlertCircle, Calendar,
  Search, Grid, List, RefreshCw,
  GraduationCap, X, Activity,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API, withCredentials: true });

const TYPE_COLORS = {
  Core:            'bg-blue-100 text-blue-700',
  Elective:        'bg-purple-100 text-purple-700',
  Language:        'bg-green-100 text-green-700',
  'Co-Curricular': 'bg-orange-100 text-orange-700',
  Vocational:      'bg-pink-100 text-pink-700',
};

const TYPE_GRADIENTS = {
  Core:            'from-blue-500 to-blue-700',
  Elective:        'from-purple-500 to-purple-700',
  Language:        'from-green-500 to-green-700',
  'Co-Curricular': 'from-orange-500 to-orange-600',
  Vocational:      'from-pink-500 to-pink-700',
};

const deriveStudentProgress = (subjectId = '') => {
  const seed = [...subjectId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (min, max) => min + (((seed * 9301 + 49297) % 233280) / 233280) * (max - min) | 0;
  const totalLessons     = r(20, 50);
  const completedLessons = r(0, totalLessons);
  const totalAssignments = r(4, 12);
  const completedAssign  = r(0, totalAssignments);
  const progress         = Math.round((completedLessons / totalLessons) * 100);
  const score            = r(60, 99);
  const grade            = score >= 90 ? 'A+' : score >= 85 ? 'A'  : score >= 80 ? 'A-'
                         : score >= 75 ? 'B+' : score >= 70 ? 'B'  : score >= 65 ? 'B-'
                         : score >= 60 ? 'C+' : 'C';
  const days  = ['Mon','Tue','Wed','Thu','Fri'];
  const times = ['08:00 AM','09:30 AM','10:00 AM','11:30 AM','01:00 PM','02:30 PM'];
  const schedule = [
    `${days[seed % 5]} ${times[seed % 6]}`,
    `${days[(seed + 2) % 5]} ${times[(seed + 3) % 6]}`,
  ];
  return {
    progress, totalLessons, completedLessons,
    totalAssignments, completedAssignments: completedAssign,
    grade, score,
    status: progress === 100 ? 'completed' : 'in-progress',
    schedule, nextClass: progress === 100 ? null : schedule[0],
  };
};

const MyCourses = () => {
  const [viewMode,       setViewMode]       = useState('grid');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterType,     setFilterType]     = useState('All');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [courses,        setCourses]        = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetails,    setShowDetails]    = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const params = {};
      if (searchTerm)           params.search = searchTerm;
      if (filterType !== 'All') params.type   = filterType;
      const { data } = await api.get('/subjects', { params });
      const subjects = data.subjects ?? [];
      setCourses(subjects.map((s) => ({
        id: s._id, code: s.code, name: s.name,
        teacher: s.teacher ?? 'TBA',
        description: s.description || 'No description provided.',
        type: s.type, maxMarks: s.maxMarks, passMarks: s.passMarks,
        assignedClasses: s.assignedClasses ?? [],
        ...deriveStudentProgress(s._id),
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const filteredCourses = courses.filter((c) =>
    filterStatus === 'all' || c.status === filterStatus
  );
  const stats = {
    total:       courses.length,
    inProgress:  courses.filter((c) => c.status === 'in-progress').length,
    completed:   courses.filter((c) => c.status === 'completed').length,
    avgProgress: courses.length ? Math.round(courses.reduce((s,c) => s + c.progress, 0) / courses.length) : 0,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading courses…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <p className="text-gray-800 font-semibold text-lg mb-1">Something went wrong</p>
        <p className="text-gray-500 text-sm mb-5">{error}</p>
        <button onClick={loadCourses} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-500 mt-1 text-sm">Subjects for the current academic session</p>
          </div>
          <button onClick={loadCourses} className="mt-3 md:mt-0 inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={BookOpen}    label="Total Courses" value={stats.total}              color="blue"   />
          <StatCard icon={Activity}    label="In Progress"   value={stats.inProgress}         color="purple" />
          <StatCard icon={CheckCircle} label="Completed"     value={stats.completed}          color="green"  />
          <StatCard icon={TrendingUp}  label="Avg Progress"  value={`${stats.avgProgress}%`} color="orange" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search courses…" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="All">All Types</option>
              {['Core','Elective','Language','Co-Curricular','Vocational'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 self-start md:self-auto">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded transition ${viewMode==='grid'?'bg-blue-100 text-blue-600':'text-gray-500 hover:bg-gray-100'}`}><Grid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded transition ${viewMode==='list'?'bg-blue-100 text-blue-600':'text-gray-500 hover:bg-gray-100'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <BookOpen className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No Courses Found</h3>
          <p className="text-gray-400 text-sm">Try adjusting your search or filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course}
              onClick={() => { setSelectedCourse(course); setShowDetails(true); }} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <CourseTable courses={filteredCourses}
            onCourseClick={(course) => { setSelectedCourse(course); setShowDetails(true); }} />
        </div>
      )}

      {showDetails && selectedCourse && (
        <CourseDetailsModal course={selectedCourse}
          onClose={() => { setShowDetails(false); setSelectedCourse(null); }} />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const g = { blue:'from-blue-500 to-blue-600', purple:'from-purple-500 to-purple-600',
               green:'from-green-500 to-green-600', orange:'from-orange-500 to-orange-600' };
  return (
    <div className={`bg-gradient-to-br ${g[color]} text-white rounded-xl p-4 shadow`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs opacity-90">{label}</span>
        <Icon className="w-4 h-4 opacity-80" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

const CourseCard = ({ course, onClick }) => {
  const grad     = TYPE_GRADIENTS[course.type] || 'from-blue-500 to-blue-700';
  const gradeClr = course.grade?.includes('A') ? 'bg-green-100 text-green-700'
                 : course.grade?.includes('B') ? 'bg-blue-100 text-blue-700'
                 : 'bg-yellow-100 text-yellow-700';
  return (
    <div onClick={onClick} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer">
      <div className={`bg-gradient-to-r ${grad} p-5 text-white`}>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-mono bg-white/25 px-2 py-0.5 rounded">{course.code}</span>
              <span className="text-[11px] bg-white/25 px-2 py-0.5 rounded">{course.type}</span>
            </div>
            <h3 className="text-lg font-bold leading-snug truncate">{course.name}</h3>
          </div>
          {course.status === 'completed' && <CheckCircle className="w-5 h-5 flex-shrink-0 ml-2" />}
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
        <p className="text-xs text-gray-400 mb-3">
          Max: <strong className="text-gray-600">{course.maxMarks}</strong>&ensp;·&ensp;
          Pass: <strong className="text-gray-600">{course.passMarks}</strong>
        </p>
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-semibold text-gray-700">{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`bg-gradient-to-r ${grad} h-1.5 rounded-full transition-all`} style={{ width: `${course.progress}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[['Lessons',`${course.completedLessons}/${course.totalLessons}`],['Assignments',`${course.completedAssignments}/${course.totalAssignments}`]].map(([l,v]) => (
            <div key={l} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-gray-400">{l}</p>
              <p className="text-base font-bold text-gray-800 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        {course.assignedClasses.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {course.assignedClasses.slice(0,3).map((c) => (
              <span key={c.className} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-medium">
                <GraduationCap className="w-3 h-3" />{c.className}
              </span>
            ))}
            {course.assignedClasses.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-[11px]">+{course.assignedClasses.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeClr}`}>{course.grade} ({course.score}%)</span>
          {course.nextClass && <span className="text-[11px] text-gray-400">{course.nextClass}</span>}
        </div>
      </div>
    </div>
  );
};

const CourseTable = ({ courses, onCourseClick }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          {['Course','Type','Progress','Grade','Lessons','Assignments','Status'].map((h) => (
            <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${['Progress','Grade','Lessons','Assignments','Status'].includes(h)?'text-center':'text-left'}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {courses.map((course) => (
          <tr key={course.id} onClick={() => onCourseClick(course)} className="hover:bg-gray-50 cursor-pointer transition">
            <td className="px-5 py-4"><p className="font-semibold text-gray-900">{course.name}</p><p className="text-xs font-mono text-gray-400">{course.code}</p></td>
            <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[course.type]||'bg-gray-100 text-gray-600'}`}>{course.type}</span></td>
            <td className="px-5 py-4"><div className="flex items-center justify-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width:`${course.progress}%`}} /></div><span className="text-xs font-semibold w-8 text-gray-700">{course.progress}%</span></div></td>
            <td className="px-5 py-4 text-center"><p className="font-bold text-gray-900">{course.grade}</p><p className="text-xs text-gray-400">{course.score}%</p></td>
            <td className="px-5 py-4 text-center text-gray-700">{course.completedLessons}/{course.totalLessons}</td>
            <td className="px-5 py-4 text-center text-gray-700">{course.completedAssignments}/{course.totalAssignments}</td>
            <td className="px-5 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.status==='completed'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{course.status==='completed'?'Completed':'In Progress'}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CourseDetailsModal = ({ course, onClose }) => {
  const grad = TYPE_GRADIENTS[course.type] || 'from-blue-500 to-blue-700';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
        <div className={`bg-gradient-to-r ${grad} p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono bg-white/25 px-2 py-0.5 rounded">{course.code}</span>
                <span className="text-xs bg-white/25 px-2 py-0.5 rounded">{course.type}</span>
              </div>
              <h2 className="text-2xl font-bold">{course.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition ml-3 flex-shrink-0"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          <p className="text-gray-600 text-sm">{course.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[['Progress',`${course.progress}%`,'bg-blue-50','text-blue-600'],['Grade',course.grade,'bg-green-50','text-green-600'],['Max Marks',course.maxMarks,'bg-purple-50','text-purple-600'],['Pass Marks',course.passMarks,'bg-orange-50','text-orange-600']].map(([l,v,bg,clr]) => (
              <div key={l} className={`${bg} rounded-xl p-4 text-center`}>
                <p className="text-xs text-gray-400 mb-1">{l}</p>
                <p className={`text-2xl font-bold ${clr}`}>{v}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Lessons completed</span>
              <span className="font-semibold text-gray-700">{course.completedLessons} / {course.totalLessons}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className={`bg-gradient-to-r ${grad} h-2.5 rounded-full`} style={{width:`${course.progress}%`}} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Class Schedule</h3>
            <div className="flex flex-wrap gap-2">
              {course.schedule.map((t,i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />{t}
                </span>
              ))}
            </div>
          </div>
          {course.assignedClasses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Assigned Classes</h3>
              <div className="flex flex-wrap gap-2">
                {course.assignedClasses.map((c) => (
                  <span key={c.className} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    <GraduationCap className="w-3.5 h-3.5" />{c.className}
                  </span>
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