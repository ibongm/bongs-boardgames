import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updateDisplayName } from '../services/users.js';

export default function Settings() {
  const { profile, firebaseUser, setProfile } = useAuth();
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
    <form onSubmit={onSubmit} className="max-w-md paper-card rounded-3xl p-6">
      <h1 className="font-display text-4xl font-bold text-gold tracking-tight">Profile settings</h1>
      <label className="block mt-5 text-sm text-ink/60">
        Display name
        <input className="mt-1 w-full rounded-lg px-3 py-2 min-h-11" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <p className="mt-3 text-xs text-ink/40">{firebaseUser?.email || profile.email}</p>
      <button type="submit" className="btn btn-primary mt-4">Save</button>
      {saved && <p className="mt-2 text-sm text-gold">Saved.</p>}
    </form>
  );
}
