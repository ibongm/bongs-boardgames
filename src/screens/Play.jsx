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

export default function Play() {
  const { gameId } = useParams();
  const game = getGame(gameId);
  const site = useSite();
  const { firebaseUser } = useAuth();
  const copy = site.games[gameId] || {};
  const [difficulty, setDifficulty] = useState('medium');
  const [state, setState] = useState(() => game?.engine.createState() || null);
  const [seed, setSeed] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    if (!game) return;
    setState(game.engine.createState());
    setSeed((n) => n + 1);
  }, [gameId, game]);

  const status = useMemo(() => (state && game ? game.engine.status(state) : null), [state, game]);
  const humanTurn = Boolean(state && status && !status.over && state.turn === 0);

  useEffect(() => {
    if (!game || !state || !status || status.over || state.turn !== 1) return undefined;
    const revision = state.revision;
    const timer = setTimeout(() => {
      setState((current) => {
        if (!current || current.revision !== revision || current.turn !== 1) return current;
        const move = game.ai.chooseMove(current, difficulty);
        if (move === null || move === undefined) return current;
        return game.engine.applyMove(current, move);
      });
    }, 420);
    return () => clearTimeout(timer);
  }, [game, state, status, difficulty, seed]);

  if (!game || copy.published === false || !state) {
    return <p className="text-ink/60">That game is not available.</p>;
  }

  const Board = game.Board;
  const title = copy.title || game.meta.title;
  let headline = 'Your turn';
  if (status?.over) {
    if (status.draw) headline = 'Draw.';
    else headline = status.winner === 0 ? 'You win.' : 'The bot wins.';
  } else if (!humanTurn) {
    headline = 'Bot is thinking…';
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
    setState(game.engine.createState());
    setSeed((n) => n + 1);
  }

  return (
    <div className="max-w-xl mx-auto">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/45">Practice · vs bot · unrated</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-5xl text-gold tracking-tight">{title}</h1>
        <button type="button" className="btn btn-ghost" onClick={() => setRulesOpen(true)}>
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
            className={`px-4 py-2 rounded-full text-sm font-semibold min-h-11 ${
              difficulty === item.id ? 'bg-gold text-cream' : 'btn-ghost'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <Board state={state} canPlay={humanTurn} onMove={onMove} />
        <p className="mt-5 text-center font-display text-3xl text-gold tracking-tight">{headline}</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <button type="button" onClick={newGame} className="btn btn-primary">
            New game
          </button>
          {firebaseUser ? (
            <Link to={`/games/${gameId}`} className="btn btn-ghost">
              Play a person
            </Link>
          ) : (
            <Link to="/sign-in" state={{ from: `/games/${gameId}` }} className="btn btn-ghost">
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
        matchInfo={`Practice table · you vs ${difficulty} bot. Unrated. A live-table leaver is replaced by a Medium bot after 30 seconds.`}
      />
    </div>
  );
}
