// src/config/theme.js
export const theme = {
  colors: {
    primary: {
      light: '#F97316',
      main: '#EA580C',
      dark: '#C2410C',
    },
    secondary: {
      light: '#22D3EE',
      main: '#06B6D4',
      dark: '#0891B2',
    },
    success: {
      light: '#4ADE80',
      main: '#22C55E',
      dark: '#16A34A',
    },
    error: {
      light: '#F87171',
      main: '#EF4444',
      dark: '#DC2626',
    },
    warning: {
      light: '#FCD34D',
      main: '#F59E0B',
      dark: '#D97706',
    },
    text: {
      primary: '#1F2937',
      secondary: '#4B5563',
      disabled: '#9CA3AF',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      heading: ['Poppins', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};