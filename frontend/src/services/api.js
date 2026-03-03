import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('impersonatedUser');
        window.location.href = '/login';
      }

      // Return error message from API
      const errorMessage = error.response.data?.error || 'An error occurred';
      return Promise.reject(new Error(errorMessage));
    }

    return Promise.reject(new Error('Network error'));
  }
);

// Authentication
export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = (name, email, password, role_id) => {
  return api.post('/auth/register', { name, email, password, role_id });
};

export const impersonate = (target_user_id, token) => {
  return api.post('/auth/impersonate', { target_user_id }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const exitImpersonation = (token) => {
  return api.post('/auth/exit-impersonation', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const requestPasswordReset = (email) => {
  return api.post('/auth/request-reset', { email });
};

export const resetPassword = (token, new_password) => {
  return api.post('/auth/reset-password', { token, new_password });
};

// Users
export const getUsers = (includeInactive = false) => {
  return api.get(`/users?include_inactive=${includeInactive}`);
};

export const getUser = (id) => {
  return api.get(`/users/${id}`);
};

export const createUser = (data) => {
  return api.post('/users', data);
};

export const updateUser = (id, data) => {
  return api.put(`/users/${id}`, data);
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};

export const restoreUser = (id) => {
  return api.post(`/users/${id}/restore`);
};

// Projects
export const getProjects = () => {
  return api.get('/projects');
};

export const getProject = (id) => {
  return api.get(`/projects/${id}`);
};

export const createProject = (data) => {
  return api.post('/projects', data);
};

export const updateProject = (id, data) => {
  return api.put(`/projects/${id}`, data);
};

export const deleteProject = (id) => {
  return api.delete(`/projects/${id}`);
};

export const addProjectMember = (projectId, userId, roleInProject = 'member') => {
  return api.post(`/projects/${projectId}/members`, { user_id: userId, role_in_project: roleInProject });
};

export const removeProjectMember = (projectId, userId) => {
  return api.delete(`/projects/${projectId}/members/${userId}`);
};

// Tasks
export const getTasks = (projectId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) {
    params.append('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status);
  }
  if (filters.assigned_to) {
    params.append('assigned_to', filters.assigned_to);
  }
  return api.get(`/projects/${projectId}/tasks?${params.toString()}`);
};

export const getTask = (id) => {
  return api.get(`/tasks/${id}`);
};

export const createTask = (projectId, data) => {
  return api.post(`/projects/${projectId}/tasks`, data);
};

export const updateTask = (id, data) => {
  return api.put(`/tasks/${id}`, data);
};

export const deleteTask = (id) => {
  return api.delete(`/tasks/${id}`);
};

// Comments
export const getComments = (taskId) => {
  return api.get(`/tasks/${taskId}/comments`);
};

export const addComment = (taskId, content) => {
  return api.post(`/tasks/${taskId}/comments`, { content });
};

// Audit Logs
export const getAuditLogs = (limit = 50, offset = 0) => {
  return api.get(`/audit-logs?limit=${limit}&offset=${offset}`);
};

export default api;
