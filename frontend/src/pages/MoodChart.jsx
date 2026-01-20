import React from 'react';
import InsightsPanel from '../components/InsightsPanel';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/shared/Loading';

export default function MoodChart() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Please log in to view your mood insights</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mood Insights</h1>
      <div className="max-w-6xl mx-auto">
        <InsightsPanel />
      </div>
    </div>
  );
}