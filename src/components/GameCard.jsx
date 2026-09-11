import { Link } from 'react-router-dom';
import { getGame } from '../games/registry.js';

export default function GameCard({ id, copy }) {
  const game = getGame(id);
  if (!game || copy?.published === false) return null;
  return (
    <Link
      to={`/games/${id}`}
      className="block rounded-2xl border border-gold/25 bg-walnut p-5 hover:border-gold/60 transition shadow-table"
    >
      <p className="font-display text-2xl text-gold">{copy?.title || game.meta.title}</p>
      <p className="text-cream/80 mt-2 text-sm leading-relaxed">{copy?.blurb}</p>
      <p className="text-cream/50 mt-4 text-xs uppercase tracking-wide">{game.meta.seats} players</p>
    </Link>
  );
}
