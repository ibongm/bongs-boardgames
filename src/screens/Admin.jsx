import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { saveSite } from '../services/site.js';
import { listUsers, adminUpdateUser } from '../services/users.js';
import { watchLobby, closeRoom } from '../services/rooms.js';
import { listGames } from '../games/registry.js';
import { firebaseReady } from '../lib/firebase.js';

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
      <h1 className="font-display text-4xl text-gold">Admin</h1>
      {note && <p className="text-sm text-gold">{note}</p>}

      <form onSubmit={saveCopy} className="bg-walnut border border-gold/20 rounded-2xl p-5 space-y-3">
        <h2 className="font-display text-2xl">Site copy</h2>
        <input className="w-full rounded-md px-3 py-2 text-ink" value={copy.homeTitle} onChange={(e) => setCopy({ ...copy, homeTitle: e.target.value })} />
        <textarea className="w-full rounded-md px-3 py-2 text-ink" rows={2} value={copy.tagline} onChange={(e) => setCopy({ ...copy, tagline: e.target.value })} />
        <textarea className="w-full rounded-md px-3 py-2 text-ink" rows={2} value={copy.footer} onChange={(e) => setCopy({ ...copy, footer: e.target.value })} />
        {listGames().map((game) => {
          const entry = copy.games[game.meta.id] || {};
          return (
            <fieldset key={game.meta.id} className="border border-gold/20 rounded-xl p-3">
              <legend className="px-1 text-gold">{game.meta.title}</legend>
              <input
                className="w-full rounded-md px-3 py-2 text-ink mb-2"
                value={entry.title || ''}
                onChange={(e) => setCopy({ ...copy, games: { ...copy.games, [game.meta.id]: { ...entry, title: e.target.value } } })}
              />
              <textarea
                className="w-full rounded-md px-3 py-2 text-ink"
                rows={2}
                value={entry.blurb || ''}
                onChange={(e) => setCopy({ ...copy, games: { ...copy.games, [game.meta.id]: { ...entry, blurb: e.target.value } } })}
              />
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={entry.published !== false}
                  onChange={(e) => setCopy({ ...copy, games: { ...copy.games, [game.meta.id]: { ...entry, published: e.target.checked } } })}
                />
                Published
              </label>
            </fieldset>
          );
        })}
        <button type="submit" className="bg-gold text-ink font-semibold rounded-md px-4 py-2">Save copy</button>
      </form>

      <section className="bg-walnut border border-gold/20 rounded-2xl p-5">
        <h2 className="font-display text-2xl">Players</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-2 justify-between border-b border-gold/10 py-2">
              <span>{user.displayName} · {user.email} · {user.role}{user.disabled ? ' · disabled' : ''}</span>
              <span className="flex gap-2">
                <button type="button" className="text-gold" onClick={() => adminUpdateUser(user.id, { disabled: !user.disabled }).then(() => listUsers().then(setUsers))}>
                  {user.disabled ? 'Enable' : 'Disable'}
                </button>
                <button type="button" className="text-gold" onClick={() => adminUpdateUser(user.id, { role: user.role === 'admin' ? 'player' : 'admin' }).then(() => listUsers().then(setUsers))}>
                  Toggle admin
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-walnut border border-gold/20 rounded-2xl p-5">
        <h2 className="font-display text-2xl">Live rooms</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rooms.map((room) => (
            <li key={room.id} className="flex justify-between gap-2">
              <span>{room.code} · {room.gameId} · {room.status}</span>
              <button type="button" className="text-gold" onClick={() => closeRoom(room.id)}>Close</button>
            </li>
          ))}
          {!rooms.length && <li className="text-cream/50">No live rooms.</li>}
        </ul>
      </section>
    </div>
  );
}
