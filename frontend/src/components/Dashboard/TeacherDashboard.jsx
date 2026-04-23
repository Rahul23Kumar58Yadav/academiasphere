import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getStudentsByClass, 
  updateStudentPerformance, 
  getPerformanceMetrics,
  addPerformanceNote,
  getAIRecommendations 
} from '../../services/teacherService';
import { Calendar, BookOpen, TrendingUp, AlertCircle, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [performanceData, setPerformanceData] = useState({});
  const [aiRecommendations, setAiRecommendations] = useState([]);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudentsByClass(selectedClass);
      setStudents(response.data);
      
      // Fetch performance metrics for all students
      const metrics = {};
      for (const student of response.data) {
        const perfResponse = await getPerformanceMetrics(student._id);
        metrics[student._id] = perfResponse.data;
      }
      setPerformanceData(metrics);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent({
      ...student,
      marks: performanceData[student._id]?.currentMarks || {},
      attendance: performanceData[student._id]?.attendancePercentage || 0,
      notes: performanceData[student._id]?.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  const handleInputChange = (field, value) => {
    setEditingStudent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMarksChange = (subject, value) => {
    setEditingStudent(prev => ({
      ...prev,
      marks: {
        ...prev.marks,
        [subject]: parseFloat(value) || 0
      }
    }));
  };

  const handleSavePerformance = async () => {
    if (!editingStudent) return;

    try {
      setLoading(true);
      
      const updatePayload = {
        studentId: editingStudent._id,
        marks: editingStudent.marks,
        attendance: editingStudent.attendance,
        notes: editingStudent.notes,
        updatedBy: user._id
      };

      await updateStudentPerformance(updatePayload);
      
      // Fetch AI recommendations after update
      const aiResponse = await getAIRecommendations(editingStudent._id);
      setAiRecommendations(aiResponse.data);

      toast.success('Performance updated successfully');
      
      // Refresh student data
      await fetchStudents();
      setEditingStudent(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update performance');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const calculateAverage = (marks) => {
    const values = Object.values(marks);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage student performance and track progress</p>
      </div>

      {/* Class Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a class...</option>
          {user?.assignedClasses?.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* Students List */}
      {selectedClass && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students in {selectedClass}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No students found in this class
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <StudentPerformanceCard
                  key={student._id}
                  student={student}
                  performanceData={performanceData[student._id]}
                  isEditing={editingStudent?._id === student._id}
                  editingStudent={editingStudent}
                  onEdit={() => handleEditClick(student)}
                  onCancel={handleCancelEdit}
                  onSave={handleSavePerformance}
                  onInputChange={handleInputChange}
                  onMarksChange={handleMarksChange}
                  getPerformanceColor={getPerformanceColor}
                  calculateAverage={calculateAverage}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations Modal */}
      {aiRecommendations.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {aiRecommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-800">{rec.recommendation}</p>
                  <span className="text-xs text-blue-600 mt-1 inline-block">
                    Confidence: {(rec.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAiRecommendations([])}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Student Performance Card Component
const StudentPerformanceCard = ({
  student,
  performanceData,
  isEditing,
  editingStudent,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
  onMarksChange,
  getPerformanceColor,
  calculateAverage,
  loading
}) => {
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

  if (isEditing) {
    return (
      <div className="p-6 bg-blue-50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
            <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Marks Input */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Subject Marks</h4>
            {subjects.map((subject) => (
              <div key={subject} className="flex items-center gap-3">
                <label className="w-32 text-sm text-gray-700">{subject}:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingStudent.marks[subject] || ''}
                  onChange={(e) => onMarksChange(subject, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0-100"
                />
              </div>
            ))}
          </div>

          {/* Attendance and Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attendance %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editingStudent.attendance}
                onChange={(e) => onInputChange('attendance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Performance Notes
              </label>
              <textarea
                value={editingStudent.notes}
                onChange={(e) => onInputChange('notes', e.target.value)}
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about student's performance..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
            </div>
            
            {performanceData && (
              <div className="flex gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(performanceData.attendancePercentage)}`}>
                  Attendance: {performanceData.attendancePercentage}%
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(calculateAverage(performanceData.currentMarks))}`}>
                  Average: {calculateAverage(performanceData.currentMarks)}%
                </span>
              </div>
            )}
          </div>

          {/* Subject Marks Display */}
          {performanceData?.currentMarks && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {Object.entries(performanceData.currentMarks).map(([subject, marks]) => (
                <div key={subject} className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">{subject}</p>
                  <p className="text-lg font-semibold text-gray-900">{marks}/100</p>
                </div>
              ))}
            </div>
          )}

          {/* Performance Notes */}
          {performanceData?.notes && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Notes:</strong> {performanceData.notes}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit2 size={16} />
          Edit
        </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;