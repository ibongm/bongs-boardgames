import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getGame } from '../games/registry.js';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createRoom } from '../services/rooms.js';
import { firebaseReady } from '../lib/firebase.js';

export default function GameInfo() {
  const { gameId } = useParams();
  const game = getGame(gameId);
  const site = useSite();
  const { profile, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const copy = site.games[gameId] || {};

  if (!game || copy.published === false) return <p>That game is not available.</p>;

  async function onCreate(event) {
    event.preventDefault();
    if (!firebaseUser) {
      navigate('/sign-in', { state: { from: `/games/${gameId}` } });
      return;
    }
    try {
      const room = await createRoom({
        host: { uid: firebaseUser.uid, displayName: profile.displayName },
        gameId,
        password: password.trim() || null,
      });
      navigate(`/rooms/${room.code}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="font-display text-4xl text-gold">{copy.title || game.meta.title}</p>
      <p className="mt-3 text-cream/80">{copy.blurb}</p>
      <p className="mt-2 text-sm text-cream/60">{game.meta.seats} seats · humans and bots</p>
      <form onSubmit={onCreate} className="mt-8 space-y-3 bg-walnut border border-gold/20 rounded-2xl p-5">
        <label className="block text-sm text-cream/70">
          Optional room password
          <input className="mt-1 w-full rounded-md px-3 py-2 text-ink" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank for an open room" />
        </label>
        {error && <p className="text-sm text-parchment">{error}</p>}
        <button type="submit" disabled={!firebaseReady} className="bg-gold text-ink font-semibold rounded-md px-4 py-2">
          Create room
        </button>
      </form>
      <Link to="/lobby" className="inline-block mt-4 text-gold text-sm">Open lobby</Link>
    </div>
  );
}
