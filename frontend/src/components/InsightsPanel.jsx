import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import demoInsights from '../data/demoInsights';
import { subscribe } from '../utils/eventBus';
import MoodLegend from './MoodLegend';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const InsightsPanel = () => {
  const [insights, setInsights] = useState({
    chartData: [],
    averageMood: 0,
    completionRate: 0,
    topTriggers: [],
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    const fetchInsights = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/insights`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setInsights(res.data || {
            chartData: [],
            averageMood: 0,
            completionRate: 0,
            topTriggers: [],
            message: ''
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching insights:', err);
          // Backend sometimes returns { error: '...' } or { message: '...' }
          const serverMsg = err.response?.data?.message || err.response?.data?.error;
          setError(serverMsg || err.message || 'Could not load insights');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInsights();

    // subscribe to task/mood updates so we can refresh charts when user modifies tasks or moods
    const unsubTasks = subscribe('tasks:updated', () => {
      fetchInsights();
    });
    const unsubMoods = subscribe('moods:updated', () => {
      fetchInsights();
    });

    return () => {
      isMounted = false;
      unsubTasks && unsubTasks();
      unsubMoods && unsubMoods();
    };
  }, [apiBase]);

  // If there's no real data and we're in dev, fall back to demoInsights
  const displayedInsights = (insights.chartData && insights.chartData.length > 0)
    ? insights
    : (import.meta.env.DEV ? demoInsights : insights);

  const isDemo = import.meta.env.DEV && displayedInsights === demoInsights;

  // Simple suggested actions derived from detected top triggers and rates
  const suggestions = [];
  if (displayedInsights.topTriggers && displayedInsights.topTriggers.length) {
    if (displayedInsights.topTriggers.includes('High Workload')) {
      suggestions.push('Break large tasks into smaller steps and spread them through the week.');
    }
    if (displayedInsights.topTriggers.includes('Sleep')) {
      suggestions.push('Maintain a consistent sleep schedule and avoid screens before bed.');
    }
    if (displayedInsights.topTriggers.includes('Low Task Completion')) {
      suggestions.push('Try focusing on 1–2 small wins per day to build momentum.');
    }
  }
  // Suggestions based on completion/mood
  if (displayedInsights.completionRate < 0.4) suggestions.push('Prioritize key tasks and consider shorter focus blocks (Pomodoro).');
  if (displayedInsights.averageMood < 3) suggestions.push('Consider journaling about your feelings or trying a short grounding exercise.');

  const moodChartData = React.useMemo(() => ({
    labels: (displayedInsights.chartData || []).map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: 'Mood',
      data: (displayedInsights.chartData || []).map(d => d.mood),
      borderColor: 'rgb(251, 146, 60)',
      backgroundColor: 'rgba(251, 146, 60, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }), [displayedInsights.chartData]);

  const [showCompletionOverlay, setShowCompletionOverlay] = React.useState(false);

  const moodChartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        min: 0,
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          // If dataset is the completion overlay, format as percent
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label && label.toLowerCase().includes('completion')) {
              // value is scaled 0-5 -> convert to percent
              const pct = Math.round((value / 5) * 100);
              return `${label}: ${pct}%`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    }
  }), []);

  const taskCompletionData = React.useMemo(() => ({
    labels: ['Completed', 'Pending'],
    datasets: [{
      data: [
        Math.round(displayedInsights.completionRate * 100),
        Math.round(100 - (displayedInsights.completionRate * 100))
      ],
      backgroundColor: [
        'rgba(52, 211, 153, 0.8)',
        'rgba(251, 146, 60, 0.4)'
      ],
      borderColor: [
        'rgb(52, 211, 153)',
        'rgb(251, 146, 60)'
      ],
      borderWidth: 1
    }]
  }), [displayedInsights.completionRate]);

  const taskChartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false }
    }
  }), []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading insights...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100 transition-all hover:shadow-md">
          <div className="text-sm text-gray-600 flex items-center justify-between">
            <span>Average Mood</span>
            <span className="text-xs text-gray-400" title="1 = Lowest, 5 = Highest">1-5</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-3xl font-semibold text-orange-600">{Number(displayedInsights.averageMood).toFixed(1)}</div>
            <div>
              <div className="text-sm text-gray-600">
                {displayedInsights.averageMood >= 4 ? 'Good overall' : displayedInsights.averageMood >= 3 ? 'Neutral' : 'Needs attention'}
              </div>
              <div className="text-xs text-gray-400">Average mood over the last week</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100 transition-all hover:shadow-md">
          <div className="text-sm text-gray-600">Task Completion</div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-orange-600">{Math.round(displayedInsights.completionRate * 100)}%</div>
            <div className="w-full bg-gray-100 h-3 rounded-full mt-2 overflow-hidden">
              <div className="h-3 bg-emerald-400" style={{ width: `${Math.round(displayedInsights.completionRate * 100)}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">Percent of tasks completed during the week — higher means more tasks finished.</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100 transition-all hover:shadow-md">
          <div className="text-sm text-gray-600">Top Triggers</div>
          <div className="text-sm mt-2">
            {displayedInsights.topTriggers.length > 0 ? (
              displayedInsights.topTriggers.map((trigger) => (
                <span key={trigger} className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs mr-2 mb-1">
                  {trigger}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No triggers recorded</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">These are likely factors that influenced your mood this week.</div>
        </div>
      </div>

      {/* Message Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">Weekly Insight</h3>
          {isDemo && (
            <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
              Demo
            </span>
          )}
        </div>

        <p className="text-gray-700">{displayedInsights.message || 'Not enough data to generate insights yet.'}</p>

        {suggestions && suggestions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">What you can try</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      {displayedInsights.chartData.length > 0 ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold mb-4">Mood Trend</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show task completion</label>
                <button
                  onClick={() => setShowCompletionOverlay(!showCompletionOverlay)}
                  className={`px-3 py-1 text-sm rounded-full border ${showCompletionOverlay ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  {showCompletionOverlay ? 'On' : 'Off'}
                </button>
              </div>
            </div>
            <div className="h-64">
              <Line data={
                // if overlay enabled, add the completion dataset (scaled to 0-5)
                showCompletionOverlay && displayedInsights.completionRate != null
                  ? {
                      ...moodChartData,
                      datasets: [
                        ...moodChartData.datasets,
                        {
                          label: 'Task Completion (scaled)',
                          data: (displayedInsights.chartData || []).map(() => Number(displayedInsights.completionRate) * 5),
                          borderColor: 'rgba(59, 130, 246, 0.9)',
                          borderDash: [6, 4],
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          tension: 0.2,
                          fill: false,
                          pointRadius: 0
                        }
                      ]
                    }
                  : moodChartData
              } options={moodChartOptions} />
            </div>
          </div>

          {/* Task Completion Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 transition-all hover:shadow-md">
            <h3 className="text-lg font-semibold mb-4">Task Completion</h3>
            <div className="h-64">
              <Pie data={taskCompletionData} options={taskChartOptions} />
            </div>
          </div>
        </div>
        {/* Mood legend for quick reference */}
        <div>
          <MoodLegend />
        </div>
        </>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-orange-100">
          <p className="text-gray-500">No mood data available yet. Start tracking your mood to see trends!</p>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;