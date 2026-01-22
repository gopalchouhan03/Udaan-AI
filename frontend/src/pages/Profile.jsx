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
    <div className="max-w-3xl mx-auto mt-16 xs:mt-14 sm:mt-20 md:mt-0 px-3 xs:px-4 sm:px-6 pb-safe-bottom">
      <div className="bg-white/95 p-4 xs:p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 mb-4 xs:mb-6">
          <div className="h-12 xs:h-16 w-12 xs:w-16 rounded-full bg-gray-200 flex items-center justify-center text-lg xs:text-2xl font-semibold text-gray-700 flex-shrink-0">{(name || 'U').charAt(0)}</div>
          <div>
            <h1 className="text-lg xs:text-xl font-bold">Profile</h1>
            <p className="text-xs xs:text-sm text-gray-500">Manage your account details</p>
          </div>
        </div>

        {loading ? (
          <div className="text-xs xs:text-sm text-gray-500">Loading…</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 xs:space-y-4">
            {message && (
              <div className={`${message.type === 'error' ? 'text-red-600' : 'text-green-600'} text-xs xs:text-sm p-2 xs:p-3 rounded-lg ${message.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>{message.text}</div>
            )}

            <div>
              <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 p-2 xs:p-3 rounded-lg text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]" />
            </div>

            <div>
              <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border border-gray-300 p-2 xs:p-3 rounded-lg text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]" />
            </div>

            <div>
              <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full border border-gray-300 p-2 xs:p-3 rounded-lg text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="flex flex-col xs:flex-row items-center justify-end gap-2 xs:gap-3 pt-4">
              <button type="button" onClick={fetchProfile} className="w-full xs:w-auto px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-300 rounded-lg text-sm xs:text-base hover:bg-gray-50 transition-all min-h-[44px]">Reset</button>
              <button type="submit" disabled={saving} className="w-full xs:w-auto px-3 xs:px-4 py-2 xs:py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm xs:text-base transition-all min-h-[44px]">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
