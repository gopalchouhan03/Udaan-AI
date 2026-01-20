// File: src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import MoodChart from './pages/MoodChart';
import Chatbot from './pages/Chatbot';
import Career from './pages/Career';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Pages that should use shared layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          {/* Protected Routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/journal" element={
            <ProtectedRoute>
              <Journal />
            </ProtectedRoute>
          } />
          <Route path="/mood-chart" element={
            <ProtectedRoute>
              <MoodChart />
            </ProtectedRoute>
          } />
          <Route path="/chatbot" element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Public Routes */}
          <Route path="/career" element={<Career />} />
        </Route>

        {/* Standalone auth pages without layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
