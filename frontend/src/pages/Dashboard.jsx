import React, { useState } from 'react';
import { Smile, BookOpenCheck, BrainCircuit, MessagesSquare, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import InsightsPanel from '../components/InsightsPanel';
import MoodTracker from '../components/MoodTracker';
import TaskList from '../components/TaskList';
import Card from '../components/shared/Card';
import Loading from '../components/shared/Loading';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('insights');

  if (loading) {
    return <Loading fullScreen />;
  }

  // Features section data
  const features = [
    {
      title: 'Mood Tracker',
      description: 'Track your daily moods and receive insights that help you understand yourself better.',
      icon: <Smile />
    },
    {
      title: 'Journal',
      description: 'Express, reflect, and grow with guided writing suggestions powered by AI.',
      icon: <BookOpenCheck />
    },
    {
      title: 'Career AI',
      description: 'Discover career paths and guidance tailored to your strengths and mindset.',
      icon: <BrainCircuit />
    },
    {
      title: 'AI Chatbot',
      description: 'Chat anytime with Udaan\'s empathetic AI companion for motivation and support.',
      icon: <MessagesSquare />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white mt-10">
      {user ? (
        <div className="px-6 sm:px-10 lg:px-24 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Message */}
            <Card className="mb-6 p-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Welcome back, {user.name}! 👋
              </h2>
              <p className="text-gray-600">
                Track your progress and maintain your well-being with Udaan.
              </p>
            </Card>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'insights'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50'
                }`}
              >
                Insights
              </button>
              <button
                onClick={() => setActiveTab('mood')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'mood'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50'
                }`}
              >
                Mood Tracker
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50'
                }`}
              >
                Tasks
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 'insights' && <InsightsPanel />}
              {activeTab === 'mood' && <MoodTracker />}
              {activeTab === 'tasks' && <TaskList />}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Hero Section */}
          <section className="relative overflow-hidden text-center px-6 sm:px-10 lg:px-24 py-20">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-200 via-white to-orange-100 blur-3xl opacity-60"></div>

            <motion.div
              className="relative max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="/Logo.png"
                alt="Udaan Logo"
                className="h-24 mx-auto mb-6 drop-shadow-lg"
              />
              <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-orange-600 drop-shadow-sm">
                Take Flight toward a balanced future
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
                Udaan combines emotional wellbeing with career growth — AI-powered
                insights, guided reflection, and compassionate coaching in one place.
              </p>

              <div className="flex items-center justify-center gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center gap-3 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full shadow-lg"
                >
                  Get Started
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <a
                  href="/chatbot"
                  className="inline-flex items-center gap-3 border border-orange-200 hover:bg-orange-50 px-6 py-3 rounded-full text-orange-600"
                >
                  Try the Chatbot
                </a>
              </div>
            </motion.div>
          </section>

          {/* Features Grid */}
          <section className="px-6 sm:px-10 lg:px-24 py-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
                >
                  <div className="text-orange-500 mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
