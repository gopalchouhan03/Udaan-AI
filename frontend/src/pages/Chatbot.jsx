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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 py-10 px-4 mt-10">
      <div className="mx-auto max-w-4xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
        <header className="flex items-center gap-4 p-6 border-b border-white/40">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">UA</div>
          <div>
            <h3 className="text-xl font-bold text-orange-700">Udaan Assistant</h3>
            <p className="text-sm text-gray-600">Your friendly companion for journaling, mood checks and career tips.</p>
          </div>
          <div className="ml-auto text-sm text-gray-500">Private · Personalized</div>
        </header>

        <main className="p-6">
          <section className="mb-4">
            <div className="flex flex-wrap gap-3">
              {suggestedPrompts.map((s) => (
                <button key={s} onClick={() => handleSuggested(s)} className="text-sm bg-orange-50 text-orange-700 px-4 py-2 rounded-full border border-orange-100 hover:bg-orange-100 transition">{s}</button>
              ))}
            </div>
          </section>

          <div className="flex gap-6">
            <div className="flex-1">
              <div ref={listRef} className="bg-white p-4 rounded-lg border border-orange-100 h-96 overflow-auto shadow-sm">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">Start a conversation — try a suggested prompt or ask something new.</div>
                )}

                <div className="space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex items-start ${m.role === 'assistant' ? 'justify-start' : m.role === 'user' ? 'justify-end' : 'justify-center'}`}>
                      {m.role === 'assistant' && (
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mr-3">🤖</div>
                      )}

                      <div className={`max-w-[78%] p-3 rounded-lg ${m.role === 'assistant' ? 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900' : m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        <div className="text-sm whitespace-pre-line">{m.text}</div>
                        <div className="mt-2 flex items-center gap-2">
                          {m.mood && (
                            <span className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">{m.mood}</span>
                          )}
                          {m.language && (
                            <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{m.language === 'hi' ? 'हिंदी' : m.language === 'hinglish' ? 'Hinglish' : 'English'}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-400">{m.date ? new Date(m.date).toLocaleString() : ''}</div>
                          <div className="flex items-center gap-2">
                            {m.role === 'assistant' && (
                              <>
                                <button onClick={() => copyToClipboard(m.text)} className="text-xs text-blue-600">Copy</button>
                                <button onClick={() => saveAsJournal(m)} className="text-xs text-green-600">Save</button>
                              </>
                            )}
                            {m.role === 'system' && <span className="text-xs text-gray-500">{m.text}</span>}
                          </div>
                        </div>
                      </div>

                      {m.role === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center ml-3">You</div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mr-3">🤖</div>
                      <div className="p-3 rounded-lg bg-orange-50 text-orange-800">
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

              <form onSubmit={handleSubmit} className="mt-4 flex gap-3 items-start">
                <textarea onKeyDown={handleKeyDown} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the assistant anything... (Enter to send, Shift+Enter for newline)" className="flex-1 border p-3 rounded-lg resize-none h-20" />
                <div className="flex flex-col gap-2">
                  <button type="submit" disabled={loading || !input.trim()} className="px-4 py-2 bg-orange-600 text-white rounded-lg">{loading ? 'Thinking…' : 'Send'}</button>
                  <button type="button" onClick={() => { setMessages([]); localStorage.removeItem('udaan_chat_history'); }} className="px-4 py-2 border rounded-lg">Clear</button>
                </div>
              </form>
            </div>

            <aside className="w-72">
              <div className="p-4 bg-white rounded-lg border border-orange-100 shadow-sm">
                <h4 className="font-semibold mb-2">Quick actions</h4>
                <p className="text-sm text-gray-600 mb-3">Use assistant replies to create journal entries or copy helpful tips.</p>
                <button onClick={() => {
                  const last = [...messages].reverse().find(m => m.role === 'assistant');
                  if (last) saveAsJournal(last);
                  else appendMessage({ id: Date.now() + '-sys', role: 'system', text: 'No assistant replies to save', date: new Date().toISOString() });
                }} className="w-full mb-2 px-3 py-2 bg-green-600 text-white rounded">Save last reply to Journal</button>
                <button onClick={() => { const last = [...messages].reverse().find(m => m.role === 'assistant'); if (last) copyToClipboard(last.text); }} className="w-full px-3 py-2 border rounded">Copy last reply</button>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <div className="font-medium mb-1">Tips</div>
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
