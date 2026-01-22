import React, { useState } from 'react';
import axios from 'axios';
import InsightsPanel from '../components/InsightsPanel';

export default function Career() {
  const [question, setQuestion] = useState('');
  const [resume, setResume] = useState('');
  const [role, setRole] = useState('');
  const [task, setTask] = useState('explore');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('careers');
  const [moodValue, setMoodValue] = useState(3);
  const [moodNote, setMoodNote] = useState('');
  const [showInsights, setShowInsights] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL;

  const suggested = [
    { task: 'explore', label: 'Career Path Exploration' },
    { task: 'skills', label: 'Skills Gap Analysis' },
    { task: 'industry', label: 'Industry & Market Insights' },
    { task: 'roadmap', label: 'Career Development Plan' },
    { task: 'courses', label: 'Learning Recommendations' },
    { task: 'opportunities', label: 'Job Market Opportunities' },
  ];

  const handleSuggested = (s) => {
    setTask(s.task);
    setQuestion('');
    setTimeout(() => {
      handleSubmit();
    }, 60);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!role.trim() && !question.trim() && !resume.trim()) {
      setError('Please provide some information about your interests, skills, or goals.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null); // Clear previous results when starting new search

    try {
      const resp = await axios.post(`${apiBase}/api/career`, {
        interests: role.trim(),
        skills: resume.trim(),
        mindset: question.trim(),
        mood: moodValue,
        moodNote: moodNote.trim(),
        context: {
          task,
          mood: moodValue,
          moodNote: moodNote.trim()
        }
      });

      setResult(resp.data);
    } catch (err) {
      console.error('Career API Error:', err);
      setError('Sorry, there was a problem getting career suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveToJournal = async (title, content) => {
    try {
      await axios.post(`${apiBase}/api/journal`, {
        title,
        content,
        tags: ['career']
      });
      alert('Saved to journal!');
    } catch (err) {
      console.error('Journal API Error:', err);
      alert('Could not save to journal. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50 py-4 xs:py-6 sm:py-10 px-3 xs:px-4 sm:px-6 md:px-10 mt-16 xs:mt-14 sm:mt-16 md:mt-0 pb-safe-bottom">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 xs:mb-8 text-center">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold text-orange-600 mb-2 xs:mb-4">AI Career Navigator</h1>
          <p className="text-base xs:text-lg sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto px-2">Get personalized career guidance powered by AI. Discover paths aligned with your skills and interests.</p>
          <div className="mt-4 xs:mt-6 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-3 xs:p-4 shadow-sm border border-orange-100 hover:border-orange-300 transition text-center">
              <div className="text-xl xs:text-2xl mb-1 xs:mb-2">🎯</div>
              <h3 className="font-medium text-gray-900 text-sm xs:text-base">Career Discovery</h3>
              <p className="text-xs text-gray-600 mt-1">Find your ideal career path based on your interests</p>
            </div>
            <div className="bg-white rounded-xl p-3 xs:p-4 shadow-sm border border-orange-100 hover:border-orange-300 transition text-center">
              <div className="text-xl xs:text-2xl mb-1 xs:mb-2">💡</div>
              <h3 className="font-medium text-gray-900 text-sm xs:text-base">Skills Analysis</h3>
              <p className="text-sm text-gray-600">Get insights on your skills and growth areas</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 hover:border-orange-300 transition">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="font-medium text-gray-900">Market Trends</h3>
              <p className="text-sm text-gray-600">Learn about high-demand careers and skills</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 hover:border-orange-300 transition">
              <div className="text-2xl mb-2">🎓</div>
              <h3 className="font-medium text-gray-900">Learning Path</h3>
              <p className="text-sm text-gray-600">Get customized learning recommendations</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {suggested.map(s => (
                <button
                  key={s.task}
                  onClick={() => handleSuggested(s)}
                  className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200 hover:bg-orange-100 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-orange-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tell us about yourself</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What are you looking for? 🎯</label>
                  <select 
                    value={task} 
                    onChange={(e)=>setTask(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="explore">Career Path Exploration</option>
                    <option value="skills">Skills Gap Analysis</option>
                    <option value="industry">Industry & Market Insights</option>
                    <option value="roadmap">Career Development Plan</option>
                    <option value="courses">Learning Recommendations</option>
                    <option value="opportunities">Job Market Opportunities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Interests & Target Fields 💫</label>
                  <input 
                    value={role} 
                    onChange={(e)=>setRole(e.target.value)} 
                    placeholder="e.g., AI/ML, UX design, data science, digital marketing..." 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tell us more about your background 🎓</label>
                  <textarea 
                    value={question} 
                    onChange={(e)=>setQuestion(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                    rows={3}
                    placeholder="Current situation, education, career goals..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Skills & Experience 🚀</label>
                  <textarea 
                    value={resume} 
                    onChange={(e)=>setResume(e.target.value)} 
                    rows={4} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                    placeholder="List your technical skills, soft skills, projects, certifications..."
                  />
                </div>

                <div className="mt-3 bg-white p-3 rounded-lg border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick mood (optional)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="1" max="5" value={moodValue} onChange={e=>setMoodValue(Number(e.target.value))} className="flex-1" />
                    <div className="text-sm text-gray-600 w-24 text-center">{moodValue}/5</div>
                  </div>
                  <input value={moodNote} onChange={e=>setMoodNote(e.target.value)} placeholder="Add a short note (optional)" className="mt-3 w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Get Personalized Guidance</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    {result.mood && <span className="inline-block mr-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">Mood: {result.mood}</span>}
                    {result.insight && <span className="inline-block px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm">Insight: {result.insight}</span>}
                  </div>
                  <div>
                    <button onClick={()=>setShowInsights(s=>!s)} className="px-3 py-1 text-sm border rounded-md">{showInsights ? 'Hide Insights' : 'Show Insights'}</button>
                  </div>
                </div>
                <div className="mb-6 flex gap-3 border-b">
                  <button 
                    onClick={() => setActiveTab('careers')}
                    className={`pb-3 px-1 ${activeTab === 'careers' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-gray-600'}`}
                  >
                    Career Paths
                  </button>
                  <button 
                    onClick={() => setActiveTab('skills')}
                    className={`pb-3 px-1 ${activeTab === 'skills' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-gray-600'}`}
                  >
                    Skills & Learning
                  </button>
                  <button 
                    onClick={() => setActiveTab('market')}
                    className={`pb-3 px-1 ${activeTab === 'market' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-gray-600'}`}
                  >
                    Market Insights
                  </button>
                </div>

                {activeTab === 'careers' && (
                  <div className="space-y-6">
                    {result.careers?.map((career, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{career.title}</h3>
                        <p className="text-gray-600 mb-4">{career.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Why This Fits You</h4>
                            <p className="text-gray-600">{career.why}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Growth Path</h4>
                            <p className="text-gray-600">{career.growthPath}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Key Skills Needed</h4>
                          <div className="flex flex-wrap gap-2">
                            {career.keySkills?.map((skill, i) => (
                              <span key={i} className="px-3 py-1 bg-orange-50 text-orange-800 rounded-full text-sm">{skill}</span>
                            ))}
                          </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                          <ul className="space-y-2">
                            {career.steps?.map((step, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-orange-500">•</span>
                                <span className="text-gray-600">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    {result.careers?.map((career, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border">
                        <h3 className="font-medium text-gray-900 mb-4">Learning Path for {career.title}</h3>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Required Qualifications</h4>
                          <p className="text-gray-600">{career.requiredQualifications}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Resources</h4>
                          <ul className="space-y-2">
                            {career.learningResources?.map((resource, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-orange-500">•</span>
                                <span className="text-gray-600">{resource}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'market' && (
                  <div className="space-y-6">
                    {result.careers?.map((career, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border">
                        <h3 className="font-medium text-gray-900 mb-4">{career.title} - Market Overview</h3>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Market Demand</h4>
                          <p className="text-gray-600">{career.marketDemand}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      const summary = result.careers?.map(c => (
                        `Career Path: ${c.title}\n\n` +
                        `${c.description}\n\n` +
                        `Why This Fits You: ${c.why}\n\n` +
                        `Market Demand: ${c.marketDemand}\n\n` +
                        `Growth Path: ${c.growthPath}\n\n` +
                        `Key Skills: ${c.keySkills?.join(', ')}\n\n` +
                        `Next Steps:\n${c.steps?.map(s => `• ${s}`).join('\n')}\n\n` +
                        `Learning Resources:\n${c.learningResources?.map(r => `• ${r}`).join('\n')}`
                      )).join('\n\n---\n\n');
                      
                      saveToJournal('Career Discovery Results', summary);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <span>Save to Journal</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </button>
                </div>
                {showInsights && (
                  <div className="mt-6">
                    <InsightsPanel />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
