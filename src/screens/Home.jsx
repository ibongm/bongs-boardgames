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
      <p className="font-display text-5xl md:text-6xl text-gold tracking-tight leading-[0.95]">{site.homeTitle}</p>
      <p className="mt-5 max-w-xl text-lg text-ink/70 leading-relaxed">{site.tagline}</p>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <GameCard key={card.id} id={card.id} copy={card.copy} />
        ))}
      </div>
      <p className="mt-10 text-sm text-ink/50">
        Bot games are practice and never hit the board.{' '}
        {firebaseUser ? (
          <Link to="/lobby" className="text-gold underline-offset-4 hover:underline">
            Open the lobby
          </Link>
        ) : (
          <Link to="/sign-in" className="text-gold underline-offset-4 hover:underline">
            Sign in to play a person
          </Link>
        )}
        .
      </p>
    </div>
  );
}
