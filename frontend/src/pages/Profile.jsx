import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Profile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL;

  const authHeader = () => ({ headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiBase + '/api/user/profile', authHeader());
      const data = res.data || {};
      setName(data.name || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
    } catch (err) {
      console.error('Could not load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.put(apiBase + '/api/user/profile', { name, email, bio }, authHeader());
      setMessage({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      console.error('Could not save profile', err);
      setMessage({ type: 'error', text: 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 px-4">
      <div className="bg-white/95 p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-700">{(name || 'U').charAt(0)}</div>
          <div>
            <h1 className="text-xl font-bold">Profile</h1>
            <p className="text-sm text-gray-500">Manage your account details</p>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {message && (
              <div className={`${message.type === 'error' ? 'text-red-600' : 'text-green-600'} text-sm`}>{message.text}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 block w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1 block w-full border p-2 rounded" />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={fetchProfile} className="px-4 py-2 border rounded">Reset</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
