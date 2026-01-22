// File: udaan/frontend/src/pages/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { publish } from '../utils/eventBus';

// Chatbot page tailored to Udaan: supports conversation history, suggested prompts,
// typing state, and saving assistant replies as Journal entries.
export default function Chatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem('udaan_chat_history');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // persist a small chat history locally so user has context between reloads
    try {
      localStorage.setItem('udaan_chat_history', JSON.stringify(messages.slice(-50)));
    } catch (e) {
      // ignore storage errors
    }
    // auto-scroll to bottom
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const authHeader = () => ({ headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });

  const suggestedPrompts = [
    'Help me write a short journal entry about today',
    'I am feeling anxious — quick grounding techniques',
    "Career advice: how to ask for a raise",
    'Mood check-in: how to interpret my emotions',
    'Give me a 3-step plan to improve focus',
  ];

  const appendMessage = (m) => setMessages((s) => [...s, m]);

  const sendQuery = async (text) => {
    if (!text || !text.trim()) return;
    setError(null);
    const userMsg = { id: Date.now() + '-u', role: 'user', text: text.trim(), date: new Date().toISOString() };
    appendMessage(userMsg);
    setInput('');
    setLoading(true);
      try {
      const res = await axios.post(apiBase + '/api/chat', { message: text }, authHeader());

      // backend returns structured { response, mood, summary }
  let replyText = '';
  let moodTag = undefined;
  let langTag = undefined;
  let summary = '';
      if (!res || res.data == null) {
        replyText = 'No response from assistant.';
      } else if (typeof res.data === 'string') {
        replyText = res.data;
      } else if (typeof res.data.response === 'string') {
        replyText = res.data.response;
        moodTag = res.data.mood;
        langTag = res.data.language;
        summary = res.data.summary || '';
      } else if (typeof res.data.reply === 'string') {
        // backward compatibility
        replyText = res.data.reply;
      } else if (Array.isArray(res.data.messages)) {
        replyText = res.data.messages.map((m) => (m.role === 'assistant' ? m.content || m.text || '' : '')).join('\n');
      } else {
        replyText = JSON.stringify(res.data);
      }

      const assistantMsg = { id: Date.now() + '-a', role: 'assistant', text: replyText, mood: moodTag, summary, language: langTag, date: new Date().toISOString() };
      appendMessage(assistantMsg);
      // If the backend recognized and persisted a mood tag for an authenticated user,
      // notify insights to refresh immediately
      if (moodTag && localStorage.getItem('token')) {
        try { publish('moods:updated', { moodTag }); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error(err);
      setError('Chatbot error — please try again.');
      appendMessage({ id: Date.now() + '-a', role: 'assistant', text: 'Sorry, I could not get a response. Try again later.', date: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    sendQuery(input);
  };

  const handleSuggested = (text) => {
    sendQuery(text);
  };

  const saveAsJournal = async (message) => {
    // Save assistant message as a journal entry via backend
    try {
      await axios.post(apiBase + '/api/journal', { title: 'Saved from Chatbot', content: message.text }, authHeader());
      // feedback in UI
      appendMessage({ id: Date.now() + '-sys', role: 'system', text: 'Saved to your Journal.', date: new Date().toISOString() });
    } catch (err) {
      console.error(err);
      appendMessage({ id: Date.now() + '-sys', role: 'system', text: 'Failed to save to Journal.', date: new Date().toISOString() });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      appendMessage({ id: Date.now() + '-sys', role: 'system', text: 'Copied to clipboard', date: new Date().toISOString() });
    } catch (e) {
      appendMessage({ id: Date.now() + '-sys', role: 'system', text: 'Could not copy', date: new Date().toISOString() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendQuery(input);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 py-4 xs:py-6 sm:py-10 px-3 xs:px-4 sm:px-6 mt-16 xs:mt-14 sm:mt-16 md:mt-0 pb-safe-bottom">
      <div className="mx-auto max-w-4xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden flex flex-col h-[calc(100vh-120px)] xs:h-[calc(100vh-140px)]">
        <header className="flex items-center gap-3 xs:gap-4 p-4 xs:p-6 border-b border-white/40 flex-shrink-0">
          <div className="w-10 xs:w-12 h-10 xs:h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm xs:text-lg flex-shrink-0">UA</div>
          <div className="flex-grow min-w-0">
            <h3 className="text-lg xs:text-xl font-bold text-orange-700 truncate">Udaan Assistant</h3>
            <p className="text-xs xs:text-sm text-gray-600 line-clamp-1">Your friendly companion for journaling, mood checks and career tips.</p>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">Private · Personalized</div>
        </header>

        <main className="p-3 xs:p-6 overflow-y-auto flex-grow flex flex-col">
          <section className="mb-4 flex-shrink-0">
            <div className="flex flex-wrap gap-2 xs:gap-3">
              {suggestedPrompts.map((s) => (
                <button key={s} onClick={() => handleSuggested(s)} className="text-xs xs:text-sm bg-orange-50 text-orange-700 px-2 xs:px-4 py-1.5 xs:py-2 rounded-full border border-orange-100 hover:bg-orange-100 transition whitespace-normal xs:whitespace-nowrap">{s}</button>
              ))}
            </div>
          </section>

          <div className="flex flex-col lg:flex-row gap-4 xs:gap-6 flex-grow min-h-0">
            <div className="flex-1 flex flex-col min-h-0 lg:min-h-auto">
              <div ref={listRef} className="bg-white p-3 xs:p-4 rounded-lg border border-orange-100 flex-grow overflow-auto shadow-sm">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8 xs:mt-20 text-sm xs:text-base">Start a conversation — try a suggested prompt or ask something new.</div>
                )}

                <div className="space-y-3 xs:space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex items-start ${m.role === 'assistant' ? 'justify-start' : m.role === 'user' ? 'justify-end' : 'justify-center'}`}>
                      {m.role === 'assistant' && (
                        <div className="w-8 xs:w-10 h-8 xs:h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mr-2 xs:mr-3 flex-shrink-0 text-xs xs:text-base">🤖</div>
                      )}

                      <div className={`max-w-xs xs:max-w-sm lg:max-w-lg p-2 xs:p-3 rounded-lg text-sm xs:text-base ${m.role === 'assistant' ? 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900' : m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        <div className="whitespace-pre-line break-words">{m.text}</div>
                        <div className="mt-1 xs:mt-2 flex items-center gap-1 xs:gap-2 flex-wrap">
                          {m.mood && (
                            <span className="inline-block text-xs bg-orange-100 text-orange-700 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded">{m.mood}</span>
                          )}
                          {m.language && (
                            <span className="inline-block text-xs bg-gray-100 text-gray-700 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded">{m.language === 'hi' ? 'हिंदी' : m.language === 'hinglish' ? 'Hinglish' : 'English'}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1 xs:mt-2 gap-1">
                          <div className="text-xs text-gray-400">{m.date ? new Date(m.date).toLocaleString() : ''}</div>
                          <div className="flex items-center gap-1 xs:gap-2">
                            {m.role === 'assistant' && (
                              <>
                                <button onClick={() => copyToClipboard(m.text)} className="text-xs text-blue-600 hover:underline">Copy</button>
                                <button onClick={() => saveAsJournal(m)} className="text-xs text-green-600 hover:underline">Save</button>
                              </>
                            )}
                            {m.role === 'system' && <span className="text-xs text-gray-500">{m.text}</span>}
                          </div>
                        </div>
                      </div>

                      {m.role === 'user' && (
                        <div className="w-8 xs:w-10 h-8 xs:h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center ml-2 xs:ml-3 flex-shrink-0 text-xs xs:text-sm">You</div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-start">
                      <div className="w-8 xs:w-10 h-8 xs:h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mr-2 xs:mr-3 flex-shrink-0">🤖</div>
                      <div className="p-2 xs:p-3 rounded-lg bg-orange-50 text-orange-800">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-orange-600 animate-bounce inline-block" />
                          <span className="h-2 w-2 rounded-full bg-orange-600 animate-bounce inline-block delay-75" />
                          <span className="h-2 w-2 rounded-full bg-orange-600 animate-bounce inline-block delay-150" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 flex flex-col xs:flex-row gap-2 xs:gap-3 items-stretch xs:items-start flex-shrink-0">
                <textarea 
                  onKeyDown={handleKeyDown} 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Ask anything... (Enter to send)" 
                  className="flex-1 border border-gray-300 p-2 xs:p-3 rounded-lg resize-none min-h-[44px] xs:h-20 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-orange-500" 
                />
                <div className="flex gap-2 flex-shrink-0 w-full xs:w-auto">
                  <button type="submit" disabled={loading || !input.trim()} className="flex-1 xs:flex-none px-3 xs:px-4 py-2 xs:py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm xs:text-base rounded-lg font-medium transition-all min-h-[44px]">{loading ? 'Thinking…' : 'Send'}</button>
                  <button type="button" onClick={() => { setMessages([]); localStorage.removeItem('udaan_chat_history'); }} className="flex-1 xs:flex-none px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-300 text-sm xs:text-base rounded-lg hover:bg-gray-50 transition-all min-h-[44px]">Clear</button>
                </div>
              </form>
            </div>

            <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0">
              <div className="p-3 xs:p-4 bg-white rounded-lg border border-orange-100 shadow-sm sticky top-0">
                <h4 className="font-semibold mb-2 text-sm xs:text-base">Quick actions</h4>
                <p className="text-xs xs:text-sm text-gray-600 mb-3">Use assistant replies to create journal entries or copy helpful tips.</p>
                <button onClick={() => {
                  const last = [...messages].reverse().find(m => m.role === 'assistant');
                  if (last) saveAsJournal(last);
                  else appendMessage({ id: Date.now() + '-sys', role: 'system', text: 'No assistant replies to save', date: new Date().toISOString() });
                }} className="w-full mb-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-all min-h-[44px] flex items-center justify-center">Save last reply to Journal</button>
                <button onClick={() => { const last = [...messages].reverse().find(m => m.role === 'assistant'); if (last) copyToClipboard(last.text); }} className="w-full px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-all min-h-[44px] flex items-center justify-center">Copy last reply</button>
              </div>

              <div className="mt-4 text-xs xs:text-sm text-gray-500 p-3 bg-white rounded-lg border border-gray-100">
                <div className="font-medium mb-2">Tips</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Try suggested prompts to get started.</li>
                  <li>Save insights to your Journal for reflection.</li>
                  <li>Messages are stored locally; clear anytime.</li>
                </ul>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
