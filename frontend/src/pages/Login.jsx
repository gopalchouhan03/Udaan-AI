// File: udaan/frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Brain, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get the page user tried to visit or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Form validation
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await login({ 
        email: email.trim(), 
        password: password.trim() 
      });
      // Only navigate if login is successful
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-amber-50 py-10 px-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-xl border border-white/60 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <img src="Logo.png" alt="Udaan" className="h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-orange-600">Welcome back</h2>
          <p className="text-sm text-gray-600">Sign in to continue to your Udaan workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="w-full px-4 py-2 rounded-lg border" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="w-full px-4 py-2 rounded-lg border" placeholder="Your password" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2">
            {loading ? 'Signing in…' : 'Login'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account? <Link to="/register" className="text-orange-600 font-medium">Register</Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-orange-600">
          <Brain size={16} /> <Heart size={16} /> <span className="text-sm italic">Balance your mind and mission</span>
        </div>
      </motion.div>
    </div>
  );
}
