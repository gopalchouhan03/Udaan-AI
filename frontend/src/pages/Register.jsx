// File: udaan/frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const apiBase = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
  await axios.post(apiBase + '/api/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl p-8 shadow-lg border border-white/60">
        <h2 className="text-2xl font-bold text-orange-600 mb-2">Create your account</h2>
        <p className="text-sm text-gray-600 mb-4">Join Udaan to track moods, journal and get career guidance.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <input value={name} onChange={(e)=>setName(e.target.value)} type="text" placeholder="Full name" required className="w-full px-4 py-2 rounded-lg border" />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full px-4 py-2 rounded-lg border" />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full px-4 py-2 rounded-lg border" />
          <button type="submit" disabled={loading} className="w-full py-2 bg-orange-600 text-white rounded-lg">{loading ? 'Creating…' : 'Register'}</button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-600">Already have an account? <Link to="/login" className="text-orange-600 font-medium">Login</Link></div>
      </div>
    </div>
  );
}
