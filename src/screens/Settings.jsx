import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updateDisplayName } from '../services/users.js';

export default function Settings() {
  const { profile, setProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [saved, setSaved] = useState(false);
  if (!profile) return null;

  async function onSubmit(event) {
    event.preventDefault();
    await updateDisplayName(profile.id, name);
    setProfile({ ...profile, displayName: name.trim() });
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md bg-walnut border border-gold/20 rounded-2xl p-5">
      <h1 className="font-display text-3xl text-gold">Profile settings</h1>
      <label className="block mt-5 text-sm text-cream/70">
        Display name
        <input className="mt-1 w-full rounded-md px-3 py-2 text-ink" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <p className="mt-3 text-xs text-cream/50">{profile.email}</p>
      <button type="submit" className="mt-4 bg-gold text-ink font-semibold rounded-md px-4 py-2">Save</button>
      {saved && <p className="mt-2 text-sm text-gold">Saved.</p>}
    </form>
  );
}
