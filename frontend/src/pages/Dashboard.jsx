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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white mt-16 xs:mt-14 sm:mt-16 md:mt-0 pb-safe-bottom">
      {user ? (
        <div className="px-3 xs:px-4 sm:px-6 md:px-10 lg:px-24 py-4 xs:py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Message */}
            <Card className="mb-4 xs:mb-6 p-4 xs:p-6">
              <h2 className="text-xl xs:text-2xl font-semibold text-gray-800">
                Welcome back, {user.name}! 👋
              </h2>
              <p className="text-sm xs:text-base text-gray-600 mt-1">
                Track your progress and maintain your well-being with Udaan.
              </p>
            </Card>

            {/* Tab Navigation - Mobile friendly */}
            <div className="flex gap-2 xs:gap-3 mb-4 xs:mb-6 overflow-x-auto pb-2 -mx-3 xs:-mx-4 sm:mx-0 px-3 xs:px-4 sm:px-0">
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-3 xs:px-4 py-2 text-sm xs:text-base rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'insights'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                Insights
              </button>
              <button
                onClick={() => setActiveTab('mood')}
                className={`px-3 xs:px-4 py-2 text-sm xs:text-base rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'mood'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                Mood Tracker
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 xs:px-4 py-2 text-sm xs:text-base rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'tasks'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                Tasks
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px] xs:min-h-[500px]">
              {activeTab === 'insights' && <InsightsPanel />}
              {activeTab === 'mood' && <MoodTracker />}
              {activeTab === 'tasks' && <TaskList />}
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen">
          {/* Hero Section */}
          <section className="relative overflow-hidden text-center px-3 xs:px-4 sm:px-6 md:px-10 lg:px-24 py-12 xs:py-16 sm:py-20">
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
                className="h-16 xs:h-20 sm:h-24 mx-auto mb-4 xs:mb-6 drop-shadow-lg"
              />
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 xs:mb-4 text-orange-600 drop-shadow-sm leading-tight">
                Take Flight toward a balanced future
              </h1>
              <p className="text-base xs:text-lg sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto mb-4 xs:mb-6 px-2">
                Udaan combines emotional wellbeing with career growth — AI-powered
                insights, guided reflection, and compassionate coaching in one place.
              </p>

              <div className="flex flex-col xs:flex-row items-center justify-center gap-3 xs:gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 xs:gap-3 bg-orange-600 hover:bg-orange-700 text-white px-4 xs:px-6 py-2.5 xs:py-3 rounded-full shadow-lg text-sm xs:text-base font-medium transition-all w-full xs:w-auto min-h-[44px]"
                >
                  Get Started
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <a
                  href="/chatbot"
                  className="inline-flex items-center justify-center gap-2 xs:gap-3 border border-orange-200 hover:bg-orange-50 px-4 xs:px-6 py-2.5 xs:py-3 rounded-full text-orange-600 text-sm xs:text-base font-medium transition-all w-full xs:w-auto min-h-[44px]"
                >
                  Try the Chatbot
                </a>
              </div>
            </motion.div>
          </section>

          {/* Features Grid */}
          <section className="px-3 xs:px-4 sm:px-6 md:px-10 lg:px-24 py-12 xs:py-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-6">
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
