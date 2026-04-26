import axios from '../config/axios.config';

const API_BASE_URL = '/api/v1/teacher';


export const getStudentsByClass = async (className) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/students/class/${className}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching students by class:', error);
    throw error;
  }
};


export const getMyStudents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};


export const getStudentById = async (studentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student details:', error);
    throw error;
  }
};


export const updateStudentPerformance = async (performanceData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/students/${performanceData.studentId}/performance`,
      performanceData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating student performance:', error);
    throw error;
  }
};


export const getPerformanceMetrics = async (studentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/performance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};


export const addPerformanceNote = async (studentId, noteData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/students/${studentId}/notes`,
      noteData
    );
    return response.data;
  } catch (error) {
    console.error('Error adding performance note:', error);
    throw error;
  }
};


export const getAIRecommendations = async (studentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/ai-recommendations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    throw error;
  }
};


export const markAttendance = async (attendanceData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/attendance/mark`, attendanceData);
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};


export const getAttendanceByClass = async (classId, startDate, endDate) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/attendance/class/${classId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};


export const getStudentAttendance = async (studentId, month) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/attendance/student/${studentId}`, {
      params: { month }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    throw error;
  }
};


export const createAssignment = async (assignmentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/assignments`, assignmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};


export const getAssignmentsByClass = async (classId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assignments/class/${classId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};


export const updateAssignment = async (assignmentId, updateData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/assignments/${assignmentId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
};


export const deleteAssignment = async (assignmentId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/assignments/${assignmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};


export const gradeAssignment = async (submissionId, gradeData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/assignments/submissions/${submissionId}/grade`,
      gradeData
    );
    return response.data;
  } catch (error) {
    console.error('Error grading assignment:', error);
    throw error;
  }
};


export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    throw error;
  }
};


export const createLessonPlan = async (lessonData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/lesson-plans`, lessonData);
    return response.data;
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    throw error;
  }
};


export const getLessonPlans = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/lesson-plans`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    throw error;
  }
};


export const getMySchedule = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/schedule`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
};


export const getClassAnalytics = async (classId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/class/${classId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    throw error;
  }
};


export const sendNotification = async (notificationData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/notifications`, notificationData);
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};


export const generateReport = async (reportData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reports/generate`, reportData);
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};


export const exportReportPDF = async (reportId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reports/${reportId}/export`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

export default {
  getStudentsByClass,
  getMyStudents,
  getStudentById,
  updateStudentPerformance,
  getPerformanceMetrics,
  addPerformanceNote,
  getAIRecommendations,
  markAttendance,
  getAttendanceByClass,
  getStudentAttendance,
  createAssignment,
  getAssignmentsByClass,
  updateAssignment,
  deleteAssignment,
  gradeAssignment,
  getAssignmentSubmissions,
  createLessonPlan,
  getLessonPlans,
  getMySchedule,
  getClassAnalytics,
  sendNotification,
  generateReport,
  exportReportPDF
};