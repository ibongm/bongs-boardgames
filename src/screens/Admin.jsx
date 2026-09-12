import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { saveSite } from '../services/site.js';
import { listUsers, adminUpdateUser } from '../services/users.js';
import { watchLobby, closeRoom } from '../services/rooms.js';
import { listGames } from '../games/registry.js';
import { firebaseReady } from '../lib/firebase.js';
import Modal from '../components/Modal.jsx';

function patchGame(copy, id, entry, field, value) {
  return { ...copy, games: { ...copy.games, [id]: { ...entry, [field]: value } } };
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</span>
      {children}
    </label>
  );
}

export default function Admin() {
  const site = useSite();
  const [copy, setCopy] = useState(site);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);

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

  async function saveGame() {
    await saveSite(copy);
    setNote('Game saved.');
    setEditingId(null);
  }

  const games = listGames();
  const editingGame = games.find((game) => game.meta.id === editingId);
  const editingEntry = editingId ? copy.games[editingId] || {} : {};

  return (
    <div className="space-y-10">
      <h1 className="font-display text-5xl font-bold text-gold tracking-tight">Admin</h1>
      {note && <p className="text-sm text-gold">{note}</p>}

      <form onSubmit={saveCopy} className="paper-card rounded-3xl p-6 space-y-3">
        <h2 className="font-display text-2xl font-bold text-gold">Site copy</h2>
        <Field label="Home title">
          <input className="w-full rounded-lg px-3 py-2 min-h-11" value={copy.homeTitle} onChange={(e) => setCopy({ ...copy, homeTitle: e.target.value })} />
        </Field>
        <Field label="Tagline">
          <textarea className="w-full rounded-lg px-3 py-2" rows={2} value={copy.tagline} onChange={(e) => setCopy({ ...copy, tagline: e.target.value })} />
        </Field>
        <Field label="Footer">
          <textarea className="w-full rounded-lg px-3 py-2" rows={2} value={copy.footer} onChange={(e) => setCopy({ ...copy, footer: e.target.value })} />
        </Field>
        <button type="submit" className="btn btn-primary">Save copy</button>
      </form>

      <section className="paper-card rounded-3xl p-6">
        <h2 className="font-display text-2xl font-bold text-gold">Games</h2>
        <p className="mt-1 text-sm text-ink/65">Select a title to edit its page copy.</p>
        <ul className="mt-4 divide-y divide-gold/15">
          {games.map((game) => {
            const id = game.meta.id;
            const entry = copy.games[id] || {};
            const title = entry.title || game.meta.title;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setEditingId(id)}
                  className="w-full flex flex-wrap items-center justify-between gap-2 py-3 text-left min-h-11"
                >
                  <span className="font-display text-xl text-gold">{title}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-ink/60">
                    {entry.featured ? <span className="rounded-full bg-gold/15 text-gold px-2 py-0.5">Featured</span> : null}
                    {entry.published === false ? <span className="rounded-full bg-ink/10 px-2 py-0.5">Hidden</span> : <span className="rounded-full bg-gold/10 px-2 py-0.5">Published</span>}
                    <span className="text-gold font-semibold">Edit</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Modal
        title={editingEntry.title || editingGame?.meta.title || 'Edit game'}
        open={Boolean(editingId)}
        onClose={() => setEditingId(null)}
        footer={
          <>
            <button type="button" className="btn btn-primary" onClick={saveGame}>Save game</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
          </>
        }
      >
        {editingId && (
          <div className="space-y-3">
            <Field label="Title">
              <input className="w-full rounded-lg px-3 py-2 min-h-11" value={editingEntry.title || ''} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'title', e.target.value))} />
            </Field>
            <Field label="Blurb">
              <textarea className="w-full rounded-lg px-3 py-2" rows={2} value={editingEntry.blurb || ''} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'blurb', e.target.value))} />
            </Field>
            <Field label="Similar to">
              <input className="w-full rounded-lg px-3 py-2 min-h-11" value={editingEntry.similarTo || ''} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'similarTo', e.target.value))} />
            </Field>
            <Field label="Released">
              <input className="w-full rounded-lg px-3 py-2 min-h-11" placeholder="YYYY-MM-DD" value={editingEntry.releasedAt || ''} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'releasedAt', e.target.value))} />
            </Field>
            <Field label="New until">
              <input className="w-full rounded-lg px-3 py-2 min-h-11" placeholder="YYYY-MM-DD (optional)" value={editingEntry.newUntil || ''} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'newUntil', e.target.value))} />
            </Field>
            <Field label="How to play override">
              <textarea className="w-full rounded-lg px-3 py-2" rows={4} value={editingEntry.howToPlay || ''} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'howToPlay', e.target.value))} />
            </Field>
            <Field label="Details override">
              <textarea className="w-full rounded-lg px-3 py-2" rows={4} value={editingEntry.rulesDetails || ''} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'rulesDetails', e.target.value))} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={editingEntry.published !== false} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'published', e.target.checked))} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={Boolean(editingEntry.featured)} onChange={(e) => setCopy(patchGame(copy, editingId, editingEntry, 'featured', e.target.checked))} />
              Featured
            </label>
          </div>
        )}
      </Modal>

      <section className="paper-card rounded-3xl p-6">
        <h2 className="font-display text-2xl font-bold text-gold">Players</h2>
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
        <h2 className="font-display text-2xl font-bold text-gold">Live rooms</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rooms.map((room) => (
            <li key={room.id} className="flex justify-between gap-2">
              <span>{room.code} · {room.gameId} · {room.status}</span>
              <button type="button" className="text-gold underline-offset-4 hover:underline" onClick={() => closeRoom(room.id)}>Close</button>
            </li>
          ))}
          {!rooms.length && <li className="text-ink/55">No live rooms.</li>}
        </ul>
      </section>
    </div>
  );
}
