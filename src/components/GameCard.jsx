import { Link } from 'react-router-dom';
import { getGame } from '../games/registry.js';

export default function GameCard({ id, copy }) {
  const game = getGame(id);
  if (!game || copy?.published === false) return null;
  const Board = game.Board;
  return (
    <article className="rounded-2xl border border-gold/25 bg-walnut p-5 shadow-table flex flex-col">
      <div className="pointer-events-none mb-5 max-w-[220px] mx-auto w-full">
        <Board state={game.meta.previewState} canPlay={false} onMove={() => {}} interactive={false} />
      </div>
      <p className="font-display text-2xl text-gold">{copy?.title || game.meta.title}</p>
      <p className="text-cream/80 mt-2 text-sm leading-relaxed flex-1">{copy?.blurb}</p>
      <p className="text-cream/50 mt-4 text-xs uppercase tracking-wide">{game.meta.seats} players · bots unrated</p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Link
          to={`/play/${id}`}
          className="flex-1 text-center bg-gold text-ink font-semibold rounded-md px-4 py-3 min-h-11"
        >
          Play vs bot
        </Link>
        <Link
          to={`/games/${id}`}
          className="flex-1 text-center border border-gold/40 rounded-md px-4 py-3 min-h-11 text-cream"
        >
          Tables & rules
        </Link>
      </div>
    </article>
  );
}
