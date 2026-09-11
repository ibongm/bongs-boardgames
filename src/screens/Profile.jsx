import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '../services/users.js';
import { listGames } from '../games/registry.js';
import { useSite } from '../context/SiteContext.jsx';
import { emptyGameStats, emptyLifetime } from '../lib/codes.js';

export default function Profile() {
  const { uid } = useParams();
  const [user, setUser] = useState(null);
  const [missing, setMissing] = useState(false);
  const site = useSite();

  useEffect(() => {
    let alive = true;
    setMissing(false);
    setUser(null);
    getUser(uid).then((found) => {
      if (!alive) return;
      setUser(found);
      setMissing(!found);
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  if (missing) return <p className="text-cream/70">Player not found.</p>;
  if (!user) return <p>Loading profile…</p>;
  const life = user.stats || emptyLifetime();
  const rate = life.played ? Math.round((life.wins / life.played) * 100) : 0;

  return (
    <div>
      <h1 className="font-display text-4xl text-gold">{user.displayName}</h1>
      <p className="text-cream/60 mt-1 text-sm">{user.role === 'admin' ? 'Administrator' : 'Player'}</p>
      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Played" value={life.played} />
        <Stat label="Wins" value={life.wins} />
        <Stat label="Losses" value={life.losses} />
        <Stat label="Win rate" value={`${rate}%`} />
      </dl>
      <div className="mt-8 grid gap-4">
        {listGames().map((game) => {
          const stats = user.games?.[game.meta.id] || emptyGameStats();
          const title = site.games[game.meta.id]?.title || game.meta.title;
          return (
            <article key={game.meta.id} className="bg-walnut border border-gold/20 rounded-2xl p-4">
              <p className="font-display text-xl text-gold">{title}</p>
              <p className="text-sm text-cream/80 mt-2">
                Rating {stats.rating} · {stats.played} rated games · {stats.winsVsHumans || 0} wins vs people
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-walnut border border-gold/20 rounded-xl p-3">
      <p className="text-xs uppercase tracking-wide text-cream/50">{label}</p>
      <p className="text-2xl font-display text-cream mt-1">{value}</p>
    </div>
  );
}
