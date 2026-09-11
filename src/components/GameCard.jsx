import { Link } from 'react-router-dom';
import { getGame } from '../games/registry.js';

export default function GameCard({ id, copy }) {
  const game = getGame(id);
  if (!game || copy?.published === false) return null;
  const Board = game.Board;
  return (
    <article className="paper-card rounded-3xl p-6 flex flex-col">
      <div className="pointer-events-none mb-6 h-48 flex items-center justify-center">
        <div className="w-full max-w-[200px]">
          <Board state={game.meta.previewState} canPlay={false} onMove={() => {}} interactive={false} />
        </div>
      </div>
      <p className="font-display text-3xl text-gold tracking-tight">{copy?.title || game.meta.title}</p>
      <p className="text-ink/70 mt-2 text-sm leading-relaxed flex-1">{copy?.blurb}</p>
      <p className="text-ink/40 mt-4 text-xs uppercase tracking-[0.14em]">{game.meta.seats} players · practice unrated</p>
      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <Link to={`/play/${id}`} className="btn btn-primary flex-1">
          Play vs bot
        </Link>
        <Link to={`/games/${id}`} className="btn btn-ghost flex-1">
          Tables
        </Link>
      </div>
    </article>
  );
}
