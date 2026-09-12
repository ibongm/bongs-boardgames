import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGame } from '../games/registry.js';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import RulesModal from '../components/RulesModal.jsx';

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

function actorOf(state) {
  if (!state) return 0;
  if (state.actorSeat !== undefined && state.actorSeat !== null) return state.actorSeat;
  return state.turn;
}

export default function Play() {
  const { gameId } = useParams();
  const game = getGame(gameId);
  const site = useSite();
  const { firebaseUser, isAdmin } = useAuth();
  const copy = site.games[gameId] || {};
  const minSeats = game?.meta?.seatsMin || game?.meta?.seats || 2;
  const maxSeats = game?.meta?.seatsMax || game?.meta?.seats || minSeats;
  const [seatCount, setSeatCount] = useState(game?.meta?.seats || minSeats);
  const [difficulty, setDifficulty] = useState('medium');
  const [mapId, setMapId] = useState('map_balanced');
  const [state, setState] = useState(() => game?.engine.createState({ seatCount: game?.meta?.seats || 2, mapId: 'map_balanced' }) || null);
  const [seed, setSeed] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [testMode, setTestMode] = useState(() => {
    try {
      return isAdmin && localStorage.getItem('bbg-test-mode') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!game) return;
    setState(game.engine.createState({ seatCount, mapId: gameId === 'pioneer' ? mapId : undefined, seed: Date.now() }));
    setSeed((n) => n + 1);
  }, [gameId, game, seatCount, mapId]);

  const status = useMemo(() => (state && game ? game.engine.status(state) : null), [state, game]);
  const actor = actorOf(state);
  const humanTurn = Boolean(state && status && !status.over && (testMode || actor === 0));
  const viewerSeat = testMode ? actor : 0;

  useEffect(() => {
    if (testMode) return undefined;
    if (!game || !state || !status || status.over || actor === 0) return undefined;
    const revision = state.revision;
    const timer = setTimeout(() => {
      setState((current) => {
        if (!current || current.revision !== revision) return current;
        if (game.engine.status(current).over) return current;
        if (actorOf(current) === 0) return current;
        const move = game.ai.chooseMove(current, difficulty);
        if (move === null || move === undefined) return current;
        try {
          return game.engine.applyMove(current, move);
        } catch {
          return current;
        }
      });
    }, 420);
    return () => clearTimeout(timer);
  }, [game, state, status, difficulty, seed, actor, testMode]);

  if (!game || copy.published === false || !state) {
    return <p className="text-ink/70">That game is not available.</p>;
  }

  const Board = game.Board;
  const title = copy.title || game.meta.title;
  const disconnectSec = Math.round((game.meta.disconnectMs || 30000) / 1000);
  let headline = 'Your turn';
  if (status?.over) {
    if (status.draw) headline = 'Draw.';
    else headline = status.winner === 0 ? 'You win.' : `${state.players?.[status.winner]?.name || 'A bot'} wins.`;
  } else if (testMode) {
    headline = `Test mode · acting as seat ${actor + 1}`;
  } else if (!humanTurn) {
    headline = 'Bots are thinking…';
  }

  function onMove(move) {
    if (!humanTurn) return;
    try {
      setState((current) => game.engine.applyMove(current, move));
    } catch {
      /* illegal */
    }
  }

  function newGame() {
    setState(game.engine.createState({ seatCount, mapId: gameId === 'pioneer' ? mapId : undefined, seed: Date.now() }));
    setSeed((n) => n + 1);
  }

  const wide = maxSeats > 2;

  if (gameId === 'pioneer') {
    const pioneerSidebarTop = (
      <div className="bg-cream border border-gold/25 rounded-2xl p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">Practice Table · Unrated</p>
            <h1 className="font-display text-2xl text-gold">{title}</h1>
          </div>
          <button
            type="button"
            className="border border-gold/40 hover:bg-gold/10 rounded-xl px-3 py-1.5 text-xs font-semibold min-h-9 text-ink"
            onClick={() => setRulesOpen(true)}
          >
            Rules
          </button>
        </div>

        {/* Difficulty pills */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold mb-1">Bot Difficulty</p>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDifficulty(item.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold min-h-9 transition-colors ${
                  difficulty === item.id ? 'bg-gold text-cream shadow-xs' : 'border border-gold/30 text-ink hover:bg-gold/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table size & Map Layout */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gold/15">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold mb-1">Seats</p>
            <div className="flex gap-1">
              {[3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeatCount(n)}
                  className={`flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 ${
                    seatCount === n ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold mb-1">Map</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMapId('map_balanced')}
                className={`flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 truncate px-1 ${
                  mapId === 'map_balanced' ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
                }`}
                title="Balanced Isle: fixed beginner layout"
              >
                Balanced
              </button>
              {firebaseUser ? (
                <button
                  type="button"
                  onClick={() => setMapId('map_shuffled')}
                  className={`flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 truncate px-1 ${
                    mapId === 'map_shuffled' ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
                  }`}
                  title="Random Isle: procedural island layout"
                >
                  Random
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 truncate px-1 border border-gold/20 text-ink/35 cursor-not-allowed bg-walnut/5"
                  title="Sign in to unlock Random Isle"
                >
                  Random 🔒
                </button>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <label className="flex items-center gap-1.5 text-xs text-ink/75 pt-1">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => {
                const on = e.target.checked;
                setTestMode(on);
                try {
                  localStorage.setItem('bbg-test-mode', on ? '1' : '0');
                } catch {}
              }}
            />
            <span>Test mode (no bot timer)</span>
          </label>
        )}
      </div>
    );

    const pioneerSidebarBottom = (
      <div className="bg-cream border border-gold/25 rounded-2xl p-3 space-y-2 text-center shadow-xs">
        <p className="font-display text-base font-semibold text-gold">{headline}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={newGame}
            className="flex-1 bg-gold text-cream font-semibold rounded-xl py-2 px-3 text-xs min-h-10 hover:bg-gold/90 shadow-xs"
          >
            New game
          </button>
          {firebaseUser ? (
            <Link
              to={`/games/${gameId}`}
              className="flex-1 border border-gold/40 rounded-xl py-2 px-3 text-xs text-center min-h-10 text-ink hover:bg-gold/5 flex items-center justify-center font-medium"
            >
              Play a person
            </Link>
          ) : (
            <Link
              to="/sign-in"
              state={{ from: `/games/${gameId}` }}
              className="flex-1 border border-gold/40 rounded-xl py-2 px-3 text-xs text-center min-h-10 text-ink hover:bg-gold/5 flex items-center justify-center font-medium"
            >
              Sign in to play
            </Link>
          )}
        </div>
      </div>
    );

    return (
      <div className="w-full">
        <Board
          state={state}
          canPlay={humanTurn}
          onMove={onMove}
          viewerSeat={viewerSeat}
          sidebarTop={pioneerSidebarTop}
          sidebarBottom={pioneerSidebarBottom}
        />
        <RulesModal
          gameId={gameId}
          copy={copy}
          open={rulesOpen}
          onClose={() => setRulesOpen(false)}
          matchInfo={`Practice table · you vs ${seatCount - 1}× ${difficulty} bot. Unrated. A live-table leaver is replaced by a Medium bot after ${disconnectSec} seconds.`}
        />
      </div>
    );
  }

  return (
    <div className={wide ? 'max-w-4xl mx-auto' : 'max-w-xl mx-auto'}>
      <p className="text-sm text-ink/70">Practice table · vs bot · unrated</p>
      <div className="flex flex-wrap items-center gap-3 mt-1">
        <h1 className="font-display text-4xl text-gold">{title}</h1>
        <button type="button" className="border border-gold/40 rounded-md px-3 py-2 text-sm min-h-11" onClick={() => setRulesOpen(true)}>
          Rules
        </button>
      </div>
      {copy.similarTo && <p className="mt-1 text-ink/55">Similar to {copy.similarTo}</p>}
      <p className="mt-3 text-ink/80">{copy.blurb}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {DIFFICULTIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setDifficulty(item.id)}
            className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 ${
              difficulty === item.id ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {isAdmin && (
        <label className="mt-3 flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => {
              const on = e.target.checked;
              setTestMode(on);
              try {
                localStorage.setItem('bbg-test-mode', on ? '1' : '0');
              } catch {
                /* ignore */
              }
            }}
          />
          Test mode — no bot timer, play every seat
        </label>
      )}
      {maxSeats > minSeats && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: maxSeats - minSeats + 1 }, (_, i) => minSeats + i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSeatCount(n)}
              className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 ${
                seatCount === n ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
              }`}
            >
              {n} seats
            </button>
          ))}
        </div>
      )}
      {gameId === 'pioneer' && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-ink/55 mb-1.5">Map Layout</p>
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
                  state={{ from: `/play/${gameId}` }}
                  className="text-xs text-gold underline-offset-4 hover:underline"
                >
                  Sign in to unlock Random Isle
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Board state={state} canPlay={humanTurn} onMove={onMove} viewerSeat={viewerSeat} />
        <p className="mt-4 text-center font-display text-2xl text-gold">{headline}</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <button type="button" onClick={newGame} className="bg-gold text-cream font-semibold rounded-md px-4 py-3 min-h-11">
            New game
          </button>
          {firebaseUser ? (
            <Link to={`/games/${gameId}`} className="border border-gold/40 rounded-md px-4 py-3 text-center min-h-11">
              Play a person
            </Link>
          ) : (
            <Link
              to="/sign-in"
              state={{ from: `/games/${gameId}` }}
              className="border border-gold/40 rounded-md px-4 py-3 text-center min-h-11"
            >
              Sign in to play a person
            </Link>
          )}
        </div>
      </div>
      <RulesModal
        gameId={gameId}
        copy={copy}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        matchInfo={`Practice table · you vs ${seatCount - 1}× ${difficulty} bot. Unrated. A live-table leaver is replaced by a Medium bot after ${disconnectSec} seconds.`}
      />
    </div>
  );
}
