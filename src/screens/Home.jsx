import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HomeShelf from '../components/HomeShelf.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { listGames } from '../games/registry.js';
import { isFeatured, isNew, publishedGames } from '../lib/gameMeta.js';
import { watchGameStats } from '../services/aggregates.js';
import { firebaseReady } from '../lib/firebase.js';

function take(list, n) {
  return list.slice(0, n);
}

export default function Home() {
  const site = useSite();
  const { firebaseUser, profile } = useAuth();
  const [aggregates, setAggregates] = useState({});
  const labels = site.shelves || {};

  useEffect(() => {
    if (!firebaseReady) return undefined;
    return watchGameStats(setAggregates);
  }, []);

  const catalog = useMemo(() => {
    const published = publishedGames(site).filter((item) => listGames().some((game) => game.meta.id === item.id));
    return published;
  }, [site]);

  const featured = take(catalog.filter((item) => isFeatured(item.copy)), 6);
  const newest = take(
    catalog.filter((item) => isNew(item.copy)).sort((a, b) => Date.parse(b.copy.releasedAt || 0) - Date.parse(a.copy.releasedAt || 0)),
    6
  );
  const popular = catalog.some((item) => (aggregates[item.id]?.played || 0) > 0)
    ? take([...catalog].sort((a, b) => (aggregates[b.id]?.played || 0) - (aggregates[a.id]?.played || 0)), 6)
    : [];
  const mostPlayers = catalog.some((item) => (aggregates[item.id]?.uniquePlayers || 0) > 0)
    ? take(
        [...catalog].sort((a, b) => (aggregates[b.id]?.uniquePlayers || 0) - (aggregates[a.id]?.uniquePlayers || 0)),
        6
      )
    : [];

  const yourMost = firebaseUser
    ? take(
        [...catalog]
          .map((item) => ({
            ...item,
            hint: `${profile?.games?.[item.id]?.played || 0} played`,
            played: profile?.games?.[item.id]?.played || 0,
          }))
          .filter((item) => item.played > 0)
          .sort((a, b) => b.played - a.played),
        3
      )
    : [];

  const lastPlayed = firebaseUser
    ? take(
        [...catalog]
          .map((item) => ({
            ...item,
            at: profile?.games?.[item.id]?.lastPlayedAt || 0,
          }))
          .filter((item) => item.at > 0)
          .sort((a, b) => b.at - a.at)
          .map((item) => ({ ...item, hint: `Last played ${new Date(item.at).toLocaleDateString()}` })),
        3
      )
    : [];

  return (
    <div>
      <p className="font-display text-4xl md:text-5xl font-bold text-gold tracking-tight">{site.homeTitle}</p>
      <p className="mt-4 max-w-2xl text-lg text-ink/80 leading-relaxed">{site.tagline}</p>

      <HomeShelf title={labels.featured || 'Featured'} items={featured} />
      <HomeShelf title={labels.newest || 'New'} items={newest} />
      <HomeShelf title={labels.popular || 'Most popular'} items={popular} />
      <HomeShelf title={labels.mostPlayers || 'Most players'} items={mostPlayers} />
      <HomeShelf title={labels.yourMost || 'Your most played'} items={yourMost} />
      <HomeShelf title={labels.lastPlayed || 'Last played'} items={lastPlayed} />

      <p className="mt-8 text-sm text-ink/65">
        Bot games are practice and never hit the board.{' '}
        {firebaseUser ? (
          <Link to="/lobby" className="text-gold font-semibold">
            Open the lobby
          </Link>
        ) : (
          <Link to="/sign-in" className="text-gold font-semibold">
            Sign in to play a person
          </Link>
        )}
        .
      </p>
    </div>
  );
}
