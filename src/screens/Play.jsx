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
    return <p className="text-ink/60">That game is not available.</p>;
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
      <div className="paper-card border border-gold/20 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/40 font-semibold">Practice Table · Unrated</p>
            <h1 className="font-display text-2xl font-bold text-gold">{title}</h1>
          </div>
          <button
            type="button"
            className="btn btn-ghost text-xs px-3 py-1.5 min-h-9"
            onClick={() => setRulesOpen(true)}
          >
            Rules
          </button>
        </div>

        {/* Difficulty pills */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink/40 font-semibold mb-1">Bot Difficulty</p>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDifficulty(item.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold min-h-9 transition-colors ${
                  difficulty === item.id ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table size & Map Layout */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gold/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/40 font-semibold mb-1">Seats</p>
            <div className="flex gap-1">
              {[3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeatCount(n)}
                  className={`flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 transition-colors ${
                    seatCount === n ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/40 font-semibold mb-1">Map</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMapId('map_balanced')}
                className={`flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 truncate px-1 transition-colors ${
                  mapId === 'map_balanced' ? 'btn-primary' : 'btn-ghost'
                }`}
                title="Balanced Isle: fixed beginner layout"
              >
                Balanced
              </button>
              {firebaseUser ? (
                <button
                  type="button"
                  onClick={() => setMapId('map_shuffled')}
                  className={`flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 truncate px-1 transition-colors ${
                    mapId === 'map_shuffled' ? 'btn-primary' : 'btn-ghost'
                  }`}
                  title="Random Isle: procedural island layout"
                >
                  Random
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-1 rounded-xl text-xs font-semibold min-h-8 truncate px-1 border border-gold/15 text-ink/30 cursor-not-allowed"
                  title="Sign in to unlock Random Isle"
                >
                  Random 🔒
                </button>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <label className="flex items-center gap-1.5 text-xs text-ink/60 pt-1">
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
      <div className="paper-card border border-gold/20 rounded-2xl p-3 space-y-2 text-center">
        <p className="font-display text-base font-bold text-gold">{headline}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={newGame}
            className="flex-1 btn btn-primary text-xs min-h-10"
          >
            New game
          </button>
          {firebaseUser ? (
            <Link
              to={`/games/${gameId}`}
              className="flex-1 btn btn-ghost text-xs min-h-10"
            >
              Play a person
            </Link>
          ) : (
            <Link
              to="/sign-in"
              state={{ from: `/games/${gameId}` }}
              className="flex-1 btn btn-ghost text-xs min-h-10"
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
      <p className="text-sm text-ink/50">Practice table · vs bot · unrated</p>
      <div className="flex flex-wrap items-center gap-3 mt-1">
        <h1 className="font-display text-4xl font-bold text-gold">{title}</h1>
        <button type="button" className="btn btn-ghost text-sm px-3 py-2 min-h-9" onClick={() => setRulesOpen(true)}>
          Rules
        </button>
      </div>
      {copy.similarTo && <p className="mt-1 text-ink/45">Similar to {copy.similarTo}</p>}
      <p className="mt-3 text-ink/70">{copy.blurb}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {DIFFICULTIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setDifficulty(item.id)}
            className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 transition-colors ${
              difficulty === item.id ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {isAdmin && (
        <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
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
              className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 transition-colors ${
                seatCount === n ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              {n} seats
            </button>
          ))}
        </div>
      )}
      {gameId === 'pioneer' && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-1.5">Map Layout</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMapId('map_balanced')}
              className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 transition-colors ${
                mapId === 'map_balanced' ? 'btn-primary' : 'btn-ghost'
              }`}
              title="Best for beginners: fixed layout with printed starts"
            >
              Balanced Isle
            </button>
            {firebaseUser ? (
              <button
                type="button"
                onClick={() => setMapId('map_shuffled')}
                className={`px-3 py-2 rounded-full text-sm font-semibold min-h-11 transition-colors ${
                  mapId === 'map_shuffled' ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                Random Isle
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="px-3 py-2 rounded-full text-sm font-semibold min-h-11 border border-gold/15 text-ink/30 cursor-not-allowed"
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
        <p className="mt-4 text-center font-display text-2xl font-bold text-gold">{headline}</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <button type="button" onClick={newGame} className="btn btn-primary">
            New game
          </button>
          {firebaseUser ? (
            <Link to={`/games/${gameId}`} className="btn btn-ghost">
              Play a person
            </Link>
          ) : (
            <Link
              to="/sign-in"
              state={{ from: `/games/${gameId}` }}
              className="btn btn-ghost"
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
