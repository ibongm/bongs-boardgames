import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listPublicProfiles } from '../services/users.js';
import { listGames, getGame } from '../games/registry.js';
import { useSite } from '../context/SiteContext.jsx';
import { emptyGameStats } from '../lib/codes.js';

export default function Leaderboard() {
  const { gameId } = useParams();
  const site = useSite();
  const [users, setUsers] = useState([]);
  const games = listGames();
  const activeId = gameId || games[0]?.meta.id;

  useEffect(() => {
    listPublicProfiles().then(setUsers);
  }, []);

  const rows = useMemo(() => {
    return users
      .map((user) => ({ user, stats: user.games?.[activeId] || emptyGameStats() }))
      .filter((row) => (row.stats.played || 0) > 0)
      .sort((a, b) => (b.stats.rating || 1000) - (a.stats.rating || 1000));
  }, [users, activeId]);

  return (
    <div>
      <h1 className="font-display text-4xl text-gold">Leaderboards</h1>
      <p className="mt-2 text-sm text-cream/60">Rated games only — two people at the table. Bot practice never counts.</p>
      <div className="mt-4 flex gap-2 flex-wrap">
        {games.map((game) => (
          <Link
            key={game.meta.id}
            to={`/leaderboards/${game.meta.id}`}
            className={`px-3 py-2 rounded-full text-sm min-h-11 inline-flex items-center ${
              activeId === game.meta.id ? 'bg-gold text-ink' : 'border border-gold/30'
            }`}
          >
            {site.games[game.meta.id]?.title || game.meta.title}
          </Link>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-gold/20">
        <table className="w-full text-sm">
          <thead className="bg-walnut text-cream/70">
            <tr>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-left">Rating</th>
              <th className="px-3 py-2 text-left">Played</th>
              <th className="px-3 py-2 text-left">Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.user.id} className="border-t border-gold/10">
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2">
                  <Link className="text-gold" to={`/players/${row.user.id}`}>
                    {row.user.displayName}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.stats.rating}</td>
                <td className="px-3 py-2">{row.stats.played}</td>
                <td className="px-3 py-2">{row.stats.winsVsHumans || 0}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-3 py-6 text-cream/50" colSpan={5}>
                  No rated games for {getGame(activeId)?.meta.title || 'this title'} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
