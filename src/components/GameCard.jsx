import { Link } from 'react-router-dom';
import { getGame } from '../games/registry.js';
import { isFeatured, isNew } from '../lib/gameMeta.js';

export default function GameCard({ id, copy, hint }) {
  const game = getGame(id);
  if (!game || copy?.published === false) return null;
  const Board = game.Board;
  const featured = isFeatured(copy);
  const fresh = isNew(copy);

  return (
    <article className="rounded-2xl border border-gold/25 bg-walnut p-5 shadow-table flex flex-col min-w-[260px] sm:min-w-0">
      <div className="pointer-events-none mb-5 max-w-[220px] mx-auto w-full">
        <Board state={game.meta.previewState} canPlay={false} onMove={() => {}} interactive={false} />
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {featured && <span className="text-[10px] uppercase tracking-wide bg-gold/15 text-gold px-2 py-0.5 rounded-full">Featured</span>}
        {fresh && <span className="text-[10px] uppercase tracking-wide bg-gold/10 text-ink/70 px-2 py-0.5 rounded-full">New</span>}
      </div>
      <p className="font-display text-2xl text-gold">{copy?.title || game.meta.title}</p>
      {copy?.similarTo && <p className="text-ink/70 text-sm mt-0.5">Similar to {copy.similarTo}</p>}
      <p className="text-ink/80 mt-2 text-sm leading-relaxed flex-1">{copy?.blurb}</p>
      <p className="text-ink/55 mt-4 text-xs uppercase tracking-wide">{game.meta.seats} players · bots unrated</p>
      {hint && <p className="text-ink/60 mt-1 text-xs">{hint}</p>}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Link to={`/play/${id}`} className="flex-1 text-center bg-gold text-cream font-semibold rounded-md px-4 py-3 min-h-11">
          Play vs bot
        </Link>
        <Link to={`/games/${id}`} className="flex-1 text-center border border-gold/40 rounded-md px-4 py-3 min-h-11 text-ink">
          Tables & rules
        </Link>
      </div>
    </article>
  );
}
