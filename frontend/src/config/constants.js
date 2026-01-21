// src/config/constants.js
export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  JOURNAL: '/journal',
  MOOD_CHART: '/mood-chart',
  CHATBOT: '/chatbot',
  CAREER: '/career',
  PROFILE: '/profile',
};

export const AUTH_TOKEN_KEY = 'token';
export const USER_DATA_KEY = 'userData';