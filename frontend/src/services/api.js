// src/services/api.js
import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY, USER_DATA_KEY } from '../config/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Login API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Register API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },
};

export const userService = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
};

export const moodService = {
  trackMood: (data) => api.post('/api/mood', data),
  getMoodHistory: () => api.get('/api/mood/history'),
  getMoodInsights: () => api.get('/api/mood/insights'),
};

export const journalService = {
  createEntry: (data) => api.post('/api/journal', data),
  getEntries: () => api.get('/api/journal'),
  updateEntry: (id, data) => api.put(`/api/journal/${id}`, data),
  deleteEntry: (id) => api.delete(`/api/journal/${id}`),
};

export const taskService = {
  createTask: (data) => api.post('/api/tasks', data),
  getTasks: () => api.get('/api/tasks'),
  updateTask: (id, data) => api.put(`/api/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`),
};

export default api;