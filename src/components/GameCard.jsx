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
    <article className="rounded-2xl border border-white/10 paper-card p-5 flex flex-col min-w-[260px] sm:min-w-0 transition-all duration-200 hover:-translate-y-1 hover:border-gold/30 hover:shadow-table group">
      <div className="pointer-events-none mb-5 max-w-[220px] mx-auto w-full">
        <Board state={game.meta.previewState} canPlay={false} onMove={() => {}} interactive={false} />
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {featured && (
          <span className="text-[10px] uppercase tracking-wide bg-gold/15 text-gold px-2 py-0.5 rounded-full border border-gold/20 font-semibold">
            Featured
          </span>
        )}
        {fresh && (
          <span className="text-[10px] uppercase tracking-wide bg-parchment/10 text-parchment px-2 py-0.5 rounded-full border border-parchment/20 font-semibold">
            New
          </span>
        )}
      </div>
      <p className="font-display text-xl font-bold text-gold">{copy?.title || game.meta.title}</p>
      {copy?.similarTo && <p className="text-ink/45 text-sm mt-0.5">Similar to {copy.similarTo}</p>}
      <p className="text-ink/70 mt-2 text-sm leading-relaxed flex-1">{copy?.blurb}</p>
      <p className="text-ink/40 mt-4 text-xs uppercase tracking-wide">
        {game.meta.seatsMax && game.meta.seatsMax !== game.meta.seats
          ? `${game.meta.seatsMin || game.meta.seats}–${game.meta.seatsMax}`
          : game.meta.seats}{' '}
        players · bots unrated
      </p>
      {hint && <p className="text-ink/50 mt-1 text-xs">{hint}</p>}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Link to={`/play/${id}`} className="btn btn-primary flex-1 text-center text-sm">
          Play vs bot
        </Link>
        <Link
          to={`/games/${id}`}
          className="flex-1 text-center btn btn-ghost text-sm"
        >
          Tables &amp; rules
        </Link>
      </div>
    </article>
  );
}
