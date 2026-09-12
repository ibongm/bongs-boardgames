import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getGame } from '../games/registry.js';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createRoom } from '../services/rooms.js';
import { firebaseReady } from '../lib/firebase.js';
import RulesModal from '../components/RulesModal.jsx';

export default function GameInfo() {
  const { gameId } = useParams();
  const game = getGame(gameId);
  const site = useSite();
  const { profile, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const minSeats = game?.meta?.seatsMin || game?.meta?.seats || 2;
  const maxSeats = game?.meta?.seatsMax || game?.meta?.seats || minSeats;
  const [seatCount, setSeatCount] = useState(game?.meta?.seats || minSeats);
  const [mapId, setMapId] = useState('map_balanced');
  const copy = site.games[gameId] || {};

  if (!game || (copy.published === false && game.meta.id !== 'pioneer')) return <p>That game is not available.</p>;

  const Board = game.Board;

  async function onCreate(event) {
    event.preventDefault();
    if (!firebaseUser) {
      navigate('/sign-in', { state: { from: `/games/${gameId}` } });
      return;
    }
    try {
      const room = await createRoom({
        host: { uid: firebaseUser.uid, displayName: profile?.displayName || firebaseUser?.displayName || 'Host' },
        gameId,
        password: password.trim() || null,
        seatCount,
        mapId: gameId === 'pioneer' ? mapId : null,
      });
      navigate(`/rooms/${room.code}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="font-display text-5xl text-gold tracking-tight">{copy.title || game.meta.title}</p>
      {copy.similarTo && <p className="mt-1 text-ink/45">Similar to {copy.similarTo}</p>}
      <p className="mt-3 text-ink/70">{copy.blurb}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ink/40">
        {maxSeats > minSeats ? `${minSeats}–${maxSeats}` : game.meta.seats} seats · humans and bots
      </p>
      <button type="button" className="btn btn-ghost mt-4" onClick={() => setRulesOpen(true)}>
        Rules
      </button>

      <div className="mt-8 pointer-events-none max-w-xs">
        <Board state={game.meta.previewState} canPlay={false} onMove={() => {}} interactive={false} />
      </div>

      <Link to={`/play/${gameId}`} className="btn btn-primary mt-8">
        Play vs bot
      </Link>
      <p className="mt-2 text-xs text-ink/45">Instant, no account, does not count toward ratings.</p>

      <form onSubmit={onCreate} className="mt-8 space-y-3 paper-card rounded-3xl p-6">
        <p className="font-display text-2xl text-gold tracking-tight">Host a table</p>
        <p className="text-sm text-ink/65">
          Rated only when two people sit down. A bot in the other chair is still just practice.
        </p>
        {maxSeats > minSeats && (
          <div>
            <p className="text-sm text-ink/65">Players at this table</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: maxSeats - minSeats + 1 }, (_, i) => minSeats + i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeatCount(n)}
                  className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 ${
                    seatCount === n ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
                  }`}
                >
                  {n} players
                </button>
              ))}
            </div>
            {gameId === 'citadels' && (
              <p className="mt-2 text-xs text-ink/55">
                {seatCount === 4 && '4 players: two characters face up, one face down.'}
                {seatCount === 5 && '5 players: one character face up, one face down.'}
                {seatCount === 6 && '6 players: no face-up discard, one character face down. Seven characters are drafted.'}
              </p>
            )}
            {gameId === 'pioneer' && (
              <div className="mt-4">
                <p className="text-sm text-ink/65 mb-1.5">Island Map Layout</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMapId('map_balanced')}
                    className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 ${
                      mapId === 'map_balanced' ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
                    }`}
                    title="Best for beginners: fixed layout with printed starts"
                  >
                    Balanced Isle
                  </button>
                  {firebaseUser ? (
                    <button
                      type="button"
                      onClick={() => setMapId('map_shuffled')}
                      className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 ${
                        mapId === 'map_shuffled' ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
                      }`}
                    >
                      Random Isle
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        className="px-3 py-2 rounded-full text-sm font-semibold min-h-11 border border-gold/20 text-ink/35 cursor-not-allowed bg-walnut/5"
                        title="Random Isle is available after you sign in. Guests may play Balanced Isle against bots."
                      >
                        Random Isle
                      </button>
                      <Link
                        to="/sign-in"
                        state={{ from: `/games/${gameId}` }}
                        className="text-xs text-gold underline-offset-4 hover:underline"
                      >
                        Sign in to unlock Random Isle
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <label className="block text-sm text-ink/65">
          Optional room password
          <input
            className="mt-1 w-full rounded-lg px-3 py-2 min-h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for an open room"
          />
        </label>
        {error && <p className="text-sm text-gold">{error}</p>}
        <button type="submit" disabled={!firebaseReady} className="btn btn-primary">
          {firebaseUser ? 'Create room' : 'Sign in to create a room'}
        </button>
      </form>
      <Link to="/lobby" className="inline-block mt-4 text-gold text-sm underline-offset-4 hover:underline">
        Open lobby
      </Link>
      <RulesModal gameId={gameId} copy={copy} open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
