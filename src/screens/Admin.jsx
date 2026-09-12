import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { saveSite } from '../services/site.js';
import { listUsers, adminUpdateUser } from '../services/users.js';
import { watchLobby, closeRoom } from '../services/rooms.js';
import { listGames } from '../games/registry.js';
import { firebaseReady } from '../lib/firebase.js';

function patchGame(copy, id, entry, field, value) {
  return { ...copy, games: { ...copy.games, [id]: { ...entry, [field]: value } } };
}

export default function Admin() {
  const site = useSite();
  const [copy, setCopy] = useState(site);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => setCopy(site), [site]);
  useEffect(() => {
    if (!firebaseReady) return undefined;
    listUsers().then(setUsers);
    return watchLobby(setRooms);
  }, []);

  async function saveCopy(event) {
    event.preventDefault();
    await saveSite(copy);
    setNote('Site copy saved.');
  }

  return (
    <div className="space-y-10">
      <h1 className="font-display text-5xl text-gold tracking-tight">Admin</h1>
      {note && <p className="text-sm text-gold">{note}</p>}

      <form onSubmit={saveCopy} className="paper-card rounded-3xl p-6 space-y-3">
        <h2 className="font-display text-2xl">Site copy</h2>
        <input className="w-full rounded-lg px-3 py-2 min-h-11" value={copy.homeTitle} onChange={(e) => setCopy({ ...copy, homeTitle: e.target.value })} />
        <textarea className="w-full rounded-lg px-3 py-2" rows={2} value={copy.tagline} onChange={(e) => setCopy({ ...copy, tagline: e.target.value })} />
        <textarea className="w-full rounded-lg px-3 py-2" rows={2} value={copy.footer} onChange={(e) => setCopy({ ...copy, footer: e.target.value })} />
        {listGames().map((game) => {
          const id = game.meta.id;
          const entry = copy.games[id] || {};
          return (
            <fieldset key={id} className="border border-gold/20 rounded-xl p-3 space-y-2">
              <legend className="px-1 text-gold">{game.meta.title}</legend>
              <input className="w-full rounded-lg px-3 py-2 min-h-11" value={entry.title || ''} onChange={(e) => setCopy(patchGame(copy, id, entry, 'title', e.target.value))} />
              <textarea className="w-full rounded-lg px-3 py-2" rows={2} value={entry.blurb || ''} onChange={(e) => setCopy(patchGame(copy, id, entry, 'blurb', e.target.value))} />
              <input className="w-full rounded-lg px-3 py-2 min-h-11" placeholder="Similar to" value={entry.similarTo || ''} onChange={(e) => setCopy(patchGame(copy, id, entry, 'similarTo', e.target.value))} />
              <input className="w-full rounded-lg px-3 py-2 min-h-11" placeholder="Released YYYY-MM-DD" value={entry.releasedAt || ''} onChange={(e) => setCopy(patchGame(copy, id, entry, 'releasedAt', e.target.value))} />
              <input className="w-full rounded-lg px-3 py-2 min-h-11" placeholder="New until YYYY-MM-DD (optional)" value={entry.newUntil || ''} onChange={(e) => setCopy(patchGame(copy, id, entry, 'newUntil', e.target.value))} />
              <textarea className="w-full rounded-lg px-3 py-2" rows={4} placeholder="How to play override" value={entry.howToPlay || ''} onChange={(e) => setCopy(patchGame(copy, id, entry, 'howToPlay', e.target.value))} />
              <textarea className="w-full rounded-lg px-3 py-2" rows={4} placeholder="Details override" value={entry.rulesDetails || ''} onChange={(e) => setCopy(patchGame(copy, id, entry, 'rulesDetails', e.target.value))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={entry.published !== false} onChange={(e) => setCopy(patchGame(copy, id, entry, 'published', e.target.checked))} />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(entry.featured)} onChange={(e) => setCopy(patchGame(copy, id, entry, 'featured', e.target.checked))} />
                Featured
              </label>
            </fieldset>
          );
        })}
        <button type="submit" className="btn btn-primary">Save copy</button>
      </form>

      <section className="paper-card rounded-3xl p-6">
        <h2 className="font-display text-2xl">Players</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-2 justify-between border-b border-gold/10 py-2">
              <span>{user.displayName} · {user.email} · {user.role}{user.disabled ? ' · disabled' : ''}</span>
              <span className="flex gap-2">
                <button type="button" className="text-gold underline-offset-4 hover:underline" onClick={() => adminUpdateUser(user.id, { disabled: !user.disabled }).then(() => listUsers().then(setUsers))}>
                  {user.disabled ? 'Enable' : 'Disable'}
                </button>
                <button type="button" className="text-gold underline-offset-4 hover:underline" onClick={() => adminUpdateUser(user.id, { role: user.role === 'admin' ? 'player' : 'admin' }).then(() => listUsers().then(setUsers))}>
                  Toggle admin
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="paper-card rounded-3xl p-6">
        <h2 className="font-display text-2xl">Live rooms</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rooms.map((room) => (
            <li key={room.id} className="flex justify-between gap-2">
              <span>{room.code} · {room.gameId} · {room.status}</span>
              <button type="button" className="text-gold underline-offset-4 hover:underline" onClick={() => closeRoom(room.id)}>Close</button>
            </li>
          ))}
          {!rooms.length && <li className="text-ink/45">No live rooms.</li>}
        </ul>
      </section>
    </div>
  );
}
