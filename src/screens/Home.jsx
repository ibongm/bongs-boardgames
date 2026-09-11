import { Link } from 'react-router-dom';
import GameCard from '../components/GameCard.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { listGames } from '../games/registry.js';

export default function Home() {
  const site = useSite();
  const { firebaseUser } = useAuth();
  const cards = listGames()
    .map((game) => ({ id: game.meta.id, copy: site.games[game.meta.id] }))
    .sort((a, b) => (a.copy?.order || 0) - (b.copy?.order || 0));
  return (
    <div>
      <p className="font-display text-4xl md:text-5xl text-gold">{site.homeTitle}</p>
      <p className="mt-4 max-w-2xl text-lg text-cream/80 leading-relaxed">{site.tagline}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <GameCard key={card.id} id={card.id} copy={card.copy} />
        ))}
      </div>
      <p className="mt-8 text-sm text-cream/60">
        Bot games are practice and never hit the board.{' '}
        {firebaseUser ? (
          <Link to="/lobby" className="text-gold">
            Open the lobby
          </Link>
        ) : (
          <Link to="/sign-in" className="text-gold">
            Sign in to play a person
          </Link>
        )}
        .
      </p>
    </div>
  );
}
