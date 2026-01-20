import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/shared/Loading';

export default function Journal() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const apiBase = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!user) return;
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${apiBase}/api/journal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      setError(serverMsg || 'Could not load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      await axios.delete(`${apiBase}/api/journal/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(entries.filter(entry => entry._id !== id));
    } catch (err) {
      console.error('Error deleting entry:', err);
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || 'Could not delete entry');
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      const res = await axios.post(`${apiBase}/api/journal`, {
        title,
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEntries([res.data, ...entries]);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Error adding entry:', err);
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || 'Could not add entry');
    }
  };

  if (authLoading) return <Loading fullScreen />;

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Please log in to access your journal</h2>
      </div>
    );
  }

  // filter entries by query
  const visibleEntries = entries.filter(e => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (e.title || '').toLowerCase().includes(q) || (e.content || '').toLowerCase().includes(q);
  });

  return (
    <div className="container mx-auto px-4 py-8 mt-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Journal</h1>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 mb-6">
            <form onSubmit={handleAddEntry} className="space-y-4">
              {error && <div className="text-red-500">{error}</div>}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title"
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={5}
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search entries..."
                    className="p-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Save Entry</button>
                </div>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {loading ? (
              <Loading />
            ) : visibleEntries.length === 0 ? (
              <div className="text-center text-gray-500">No entries yet. Write your first one!</div>
            ) : (
              visibleEntries.map((entry) => (
                <div key={entry._id} className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{entry.title}</h3>
                    <button
                      onClick={() => handleDeleteEntry(entry._id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50"
                      title="Delete entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-4">{entry.content}</p>
                  <div className="text-sm text-gray-500">{new Date(entry.date || entry.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
            <h2 className="text-lg font-semibold mb-4">Tasks</h2>
            <TaskList />
          </div>
        </aside>
      </div>
    </div>
  );
}