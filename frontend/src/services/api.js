const API_BASE = import.meta.env.VITE_API_BASE || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api/v1'
    : '/api/v1');

function toQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
      searchParams.append(key, value);
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('campusiq_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    throw new Error(`Unable to connect to CampusIQ backend at ${API_BASE}. Please ensure the backend server is running.`);
  }

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof errJson.detail === 'object' && errJson.detail !== null) {
        errorDetail = JSON.stringify(errJson.detail);
      } else if (errJson.detail) {
        errorDetail = String(errJson.detail);
      } else {
        errorDetail = JSON.stringify(errJson);
      }
    } catch (e) {
      errorDetail = response.statusText || `Request failed with status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  signupStudent: (data) => request('/auth/signup/student', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  signupFaculty: (data) => request('/auth/signup/faculty', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => request('/auth/me'),
  verifyRole: (selectedRole) => request('/auth/verify-role', {
    method: 'POST',
    body: JSON.stringify({ selected_role: selectedRole }),
  }),
  forgotPassword: (data) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  resetPassword: (data) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProfile: (data) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  changePassword: (data) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Tasks & Assignments
  getTasks: (params = {}) => request(`/tasks${toQueryString(params)}`),
  getTaskDetails: (taskId) => request(`/tasks/${taskId}`),
  createTask: (data) => request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  submitTask: (taskId, data) => request(`/tasks/${taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  reviewSubmission: (submissionId, data) => request(`/tasks/submissions/${submissionId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  updateTask: (taskId, data) => request(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, {
    method: 'DELETE',
  }),

  // Students
  getStudents: (params = {}) => request(`/students${toQueryString(params)}`),
  getStudentProfile: (studentId) => request(`/students/${studentId}`),
  getExamRadar: (studentId) => request(`/students/${studentId}/radar`),
  updateCareerMission: (studentId, careerGoal) => request(`/students/${studentId}/career-mission`, {
    method: 'POST',
    body: JSON.stringify({ career_goal: careerGoal }),
  }),
  toggleMilestone: (milestoneId) => request(`/students/milestone/${milestoneId}/toggle`, {
    method: 'PATCH',
  }),

  // Faculty
  getFacultyDashboard: (branch) => {
    const q = branch ? `?branch=${branch}` : '';
    return request(`/faculty/dashboard${q}`);
  },
  addMarks: (data) => request('/faculty/add-marks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  recordAttendance: (data) => request('/faculty/record-attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMentorCandidates: (studentId) => request(`/faculty/mentor-candidates/${studentId}`),
  assignMentor: (data) => request('/faculty/assign-mentor', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getFacultyStudentsGrades: (params = {}) => request(`/faculty/students-grades${toQueryString(params)}`),

  // Admin
  getAdminDashboard: (params = {}) => request(`/admin/dashboard${toQueryString(params)}`),
  getStaff: (params = {}) => request(`/admin/staff${toQueryString(params)}`),
  createStaff: (data) => request('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStaff: (staffId, data) => request(`/admin/staff/${staffId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  toggleStaffStatus: (staffId) => request(`/admin/staff/${staffId}/status`, {
    method: 'PATCH',
  }),
  deleteStaff: (staffId) => request(`/admin/staff/${staffId}`, {
    method: 'DELETE',
  }),
  createStudent: (data) => request('/admin/students', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStudent: (studentId, data) => request(`/admin/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  toggleStudentStatus: (studentId) => request(`/admin/students/${studentId}/status`, {
    method: 'PATCH',
  }),
  deleteStudent: (studentId) => request(`/admin/students/${studentId}`, {
    method: 'DELETE',
  }),
  getUsers: (params = {}) => request(`/admin/users${toQueryString(params)}`),
  updateUserPermissions: (userId, data) => request(`/admin/users/${userId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getGrowthLeague: () => request('/admin/growth-league'),
  getLeaderboard: (params = {}) => request(`/admin/leaderboard${toQueryString(params)}`),

  // Risk & Segmentation
  getRiskIntelligence: (params = {}) => request(`/risks${toQueryString(params)}`),
  getSegmentation: (branch) => {
    const q = branch ? `?branch=${branch}` : '';
    return request(`/risks/segmentation${q}`);
  },

  // Interventions
  getInterventions: (params = {}) => request(`/interventions${toQueryString(params)}`),
  createIntervention: (data) => request('/interventions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateInterventionStatus: (id, data) => request(`/interventions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Learning Arena
  getQuizQuestions: (params = {}) => request(`/quiz/questions${toQueryString(params)}`),
  submitQuizAnswer: (data) => request('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getQuizHistory: (studentId) => request(`/quiz/history/${studentId}`),

  // Simulator
  runSimulation: (data) => request('/simulator/what-if', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Feedback
  submitFeedback: (data) => request('/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getFeedback: (params = {}) => request(`/feedback${toQueryString(params)}`),

  // Data Integration
  previewCsv: async (dataType, file) => {
    const token = localStorage.getItem('campusiq_token');
    const formData = new FormData();
    formData.append('data_type', dataType);
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/data/preview-csv`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'CSV preview failed');
    }
    return response.json();
  },
  commitCsv: (dataType, previewData) => request('/data/commit-csv', {
    method: 'POST',
    body: JSON.stringify({ data_type: dataType, preview_data: previewData }),
  }),

  // Reports
  getExecutiveReport: (params = {}) => request(`/reports/executive${toQueryString(params)}`),
  getBatchRiskReport: (branch) => {
    const q = branch ? `?branch=${branch}` : '';
    return request(`/reports/batch-risk${q}`);
  },

  // Materials
  getMaterials: (params = {}) => request(`/materials${toQueryString(params)}`),
  uploadMaterial: (data) => request('/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  addMaterial: (data) => request('/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
