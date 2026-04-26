import api, { uploadApi } from '../config/axios.config';
const BASE = '';

export const assignmentAPI = {
  getAll:  (filters = {}) => axios.get(`${BASE}/teacher/assignments`, { params: filters }),
  stats:   ()             => axios.get(`${BASE}/teacher/assignments/stats`),
  create:  (payload)      => axios.post(`${BASE}/teacher/assignments`, payload),
  update:  (id, payload)  => axios.put(`${BASE}/teacher/assignments/${id}`, payload),
  remove:  (id)           => axios.delete(`${BASE}/teacher/assignments/${id}`),
  publish: (id)           => axios.patch(`${BASE}/teacher/assignments/${id}/publish`, {}),

  getAllSubmissions:        ()                      => axios.get(`${BASE}/teacher/submissions`),
  getSubmissions:          (assignmentId)           => axios.get(`${BASE}/teacher/assignments/${assignmentId}/submissions`),
  gradeSubmission:         (submissionId, payload)  => axios.put(`${BASE}/teacher/assignments/submissions/${submissionId}/grade`, payload),
  returnSubmission:        (submissionId)           => axios.patch(`${BASE}/teacher/submissions/${submissionId}/return`, {}),
  bulkDownload:            (assignmentId)           => axios.get(`${BASE}/teacher/assignments/${assignmentId}/submissions/bulk-download`, { responseType: 'blob' }),
};

export const schoolAPI = {
  getTeacherSubjects: (teacherId) => axios.get(`${BASE}/school/teachers/${teacherId}/subjects`),
  getSchoolClasses:   (schoolId)  => axios.get(`${BASE}/school/${schoolId}/classes`),
  getSchoolInfo:      (schoolId)  => axios.get(`${BASE}/school/${schoolId}/info`),
};

// src/services/assignment.js  — add these to studentAPI (new export)
export const studentAPI = {
  getAssignments:  (filters = {}) => api.get('/student/assignments',           { params: filters }),
  getAssignment:   (id)           => api.get(`/student/assignments/${id}`),
  getMySubmission: (id)           => api.get(`/student/assignments/${id}/submission`),
  saveDraft:       (id, payload)  => api.post(`/student/assignments/${id}/draft`, payload),
  submit:          (id, fd) => api.post(`/student/assignments/${id}/submit`, fd) ,
};


export default { assignmentAPI, schoolAPI,studentAPI  };