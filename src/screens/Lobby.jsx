import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { watchLobby, findRoomByCode } from '../services/rooms.js';
import { getGame } from '../games/registry.js';
import { useSite } from '../context/SiteContext.jsx';
import { firebaseReady } from '../lib/firebase.js';

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const site = useSite();

  useEffect(() => {
    if (!firebaseReady) return undefined;
    return watchLobby(setRooms);
  }, []);

  async function joinCode(event) {
    event.preventDefault();
    setError('');
    const room = await findRoomByCode(code.trim());
    if (!room) {
      setError('No room uses that code.');
      return;
    }
    navigate(`/rooms/${room.code}`);
  }

  return (
    <div>
      <h1 className="font-display text-5xl text-gold tracking-tight">Lobby</h1>
      <form onSubmit={joinCode} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-lg">
        <input className="flex-1 rounded-lg px-3 py-2 min-h-11 uppercase" placeholder="Room code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button type="submit" className="btn btn-primary">Join by code</button>
      </form>
      {error && <p className="mt-2 text-sm text-gold">{error}</p>}
      <div className="mt-8 overflow-x-auto rounded-3xl paper-card">
        <table className="w-full text-sm text-left">
          <thead className="text-ink/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Game</th>
              <th className="px-4 py-3 font-semibold">Seats</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const filled = (room.seats || []).filter((s) => s.type !== 'empty').length;
              const title = site.games[room.gameId]?.title || getGame(room.gameId)?.meta.title;
              return (
                <tr key={room.id} className="border-t border-gold/10">
                  <td className="px-4 py-3 font-mono">{room.code}{room.passwordHash ? ' · locked' : ''}</td>
                  <td className="px-4 py-3">{title}</td>
                  <td className="px-4 py-3 tabular-nums">{filled}/{room.seats?.length || 0}</td>
                  <td className="px-4 py-3 capitalize">{room.status}</td>
                  <td className="px-4 py-3"><Link to={`/rooms/${room.code}`} className="text-gold underline-offset-4 hover:underline">Open</Link></td>
                </tr>
              );
            })}
            {!rooms.length && (
              <tr>
                <td className="px-4 py-8 text-ink/45" colSpan={5}>No open rooms. Create one from a game page.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
