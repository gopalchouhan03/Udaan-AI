// File: frontend/src/components/MoodTracker.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MoodLegend from './MoodLegend'
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { publish } from '../utils/eventBus';
import { subscribe } from '../utils/eventBus';
import FaceMoodDetector from './FaceMoodDetector';

const MoodTracker = () => {
  const [moodValue, setMoodValue] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [detectedSuggestion, setDetectedSuggestion] = useState(null);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [mode, setMode] = useState('fast'); // 'ultra' | 'fast' | 'balanced'
  const [cameraPerf, setCameraPerf] = useState({ fps: 0, avgMs: 0 });

  const apiBase = import.meta.env.VITE_API_URL;

  const fetchMoodStats = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/mood/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching mood stats:', err);
      setError('Could not load mood statistics');
    }
  };

  useEffect(() => {
    fetchMoodStats();
  }, []);

  useEffect(() => {
    const unsub1 = subscribe('moods:detected', (payload) => {
      // show suggestion only when detection confidence is reasonable
      if (payload && payload.confidence > 0.4) {
        setDetectedSuggestion(payload);
      }
    });
    const unsub2 = subscribe('camera:perf', (p) => {
      setCameraPerf({ fps: p.fps || 0, avgMs: p.avgMs || 0 });
    });
    return () => {
      unsub1 && unsub1();
      unsub2 && unsub2();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    // Optimistic update: update local stats immediately
    const prevStats = stats;
    try {
      if (stats) {
        const newCount = (stats.count || 0) + 1;
        const newAverage = ((stats.average || 0) * (stats.count || 0) + moodValue) / newCount;
        const newMoods = [{ date: new Date().toISOString(), value: moodValue }, ...(stats.moods || [])];
        const newStats = {
          ...stats,
          count: newCount,
          average: newAverage,
          moods: newMoods
        };
        setStats(newStats);
      }
      // publish before request so charts refresh instantly
      publish('moods:updated', { value: moodValue, optimistic: true });

      const res = await axios.post(`${apiBase}/api/mood`, {
        value: moodValue,
        note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // on success, refresh authoritative stats
      setNote('');
      setShowForm(false);
      fetchMoodStats();
      publish('moods:updated', { value: moodValue, optimistic: false, saved: res.data });
    } catch (err) {
      console.error('Error logging mood:', err);
      setError('Could not save mood');
      // rollback optimistic stats
      setStats(prevStats);
      publish('moods:updated', { action: 'create:failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuggestion = async () => {
    if (!detectedSuggestion) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/api/mood`, {
        value: detectedSuggestion.value,
        note: 'Auto-detected by camera',
        source: 'camera'
      }, { headers: { Authorization: `Bearer ${token}` } });
      // refresh stats and clear suggestion
      fetchMoodStats();
      publish('moods:updated', { value: detectedSuggestion.value, saved: res.data });
      setDetectedSuggestion(null);
    } catch (err) {
      console.error('Error saving detected mood', err);
      setError('Could not save detected mood');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableCamera = () => {
    // Show a small confirm privacy prompt before enabling
    const ok = window.confirm('Enable camera-based mood detection? Video stays in your browser; no images are uploaded.');
    if (ok) {
      setPrivacyConfirmed(true);
      setCameraEnabled(true);
    }
  };

  // Chart configuration
  const chartData = {
    labels: stats?.moods?.map(m => new Date(m.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Mood',
      data: stats?.moods?.map(m => m.value) || [],
      fill: true,
      borderColor: 'rgb(251, 146, 60)',
      backgroundColor: 'rgba(251, 146, 60, 0.1)',
      tension: 0.4,
    }]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Mood Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-sm border border-orange-100"
      >
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            How are you feeling?
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your mood</label>
              <input
                type="range"
                min="1"
                max="5"
                value={moodValue}
                onChange={(e) => setMoodValue(Number(e.target.value))}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Low</span>
                <span>Low</span>
                <span>Neutral</span>
                <span>Good</span>
                <span>Great</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add a note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="What's making you feel this way?"
                rows="2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Mood'}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Camera-based detection (opt-in) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">Camera mood suggestion</div>
            <div className="text-xs text-gray-500">Opt-in: detection runs locally in your browser</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button onClick={() => setMode('ultra')} className={`px-2 py-1 text-xs rounded ${mode === 'ultra' ? 'bg-emerald-100 border-emerald-200' : 'bg-white border'}`}>Ultra</button>
              <button onClick={() => setMode('fast')} className={`px-2 py-1 text-xs rounded ${mode === 'fast' ? 'bg-emerald-100 border-emerald-200' : 'bg-white border'}`}>Fast</button>
              <button onClick={() => setMode('balanced')} className={`px-2 py-1 text-xs rounded ${mode === 'balanced' ? 'bg-emerald-100 border-emerald-200' : 'bg-white border'}`}>Balanced</button>
            </div>

            <div className="flex items-center gap-3">
              {!cameraEnabled ? (
                <button onClick={handleEnableCamera} className="px-3 py-1 bg-white border rounded text-sm">Enable</button>
              ) : (
                <button onClick={() => { setCameraEnabled(false); setDetectedSuggestion(null); }} className="px-3 py-1 bg-red-50 border rounded text-sm">Disable</button>
              )}

              <div className="text-xs text-gray-600 px-2 py-1 border rounded" title="Camera performance">
                <span className={`${cameraPerf.fps >= 20 ? 'text-emerald-600' : cameraPerf.fps >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                  {cameraPerf.fps} FPS
                </span>
                <span className="text-gray-400"> · {cameraPerf.avgMs} ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-4">
          <div>
            <FaceMoodDetector enabled={cameraEnabled} autoSave={false} onSave={handleSaveSuggestion} mode={mode} />
          </div>

          <div className="flex-1">
            {detectedSuggestion ? (
              <div className="border rounded p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-700">Suggested mood: <span className="font-semibold text-orange-600">{detectedSuggestion.value}</span></div>
                    <div className="text-xs text-gray-500">Confidence: {(detectedSuggestion.confidence * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-500 mt-1">Source: camera (local)</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveSuggestion} className="px-3 py-1 bg-emerald-500 text-white rounded text-sm">Save suggested mood</button>
                    <button onClick={() => setDetectedSuggestion(null)} className="px-3 py-1 bg-white border rounded text-sm">Dismiss</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No recent suggestion. Make sure your face is visible to the camera.</div>
            )}
          </div>
        </div>
      </div>

      {/* Mood Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
            <div className="text-sm text-gray-600">Average Mood</div>
            <div className="text-2xl font-semibold text-orange-600">
              {stats.average.toFixed(1)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
            <div className="text-sm text-gray-600">Entries</div>
            <div className="text-2xl font-semibold text-orange-600">
              {stats.count}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
            <div className="text-sm text-gray-600">Trend</div>
            <div className="text-2xl font-semibold text-orange-600">
              {stats.trend > 0 ? '↗' : stats.trend < 0 ? '↘' : '→'}
              {Math.abs(stats.trend).toFixed(1)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mood Chart */}
      {stats?.moods?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-orange-100"
        >
          <h3 className="text-lg font-semibold mb-4">Mood History</h3>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>
      )}

      <MoodLegend />
    </div>
  );
};

export default MoodTracker;