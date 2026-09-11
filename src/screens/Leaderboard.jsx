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
      <h1 className="font-display text-5xl text-gold tracking-tight">Leaderboards</h1>
      <p className="mt-2 text-sm text-ink/55">Rated games only — two people at the table. Bot practice never counts.</p>
      <div className="mt-5 flex gap-2 flex-wrap">
        {games.map((game) => (
          <Link
            key={game.meta.id}
            to={`/leaderboards/${game.meta.id}`}
            className={`px-4 py-2 rounded-full text-sm min-h-11 inline-flex items-center font-semibold ${
              activeId === game.meta.id ? 'bg-gold text-cream' : 'btn-ghost'
            }`}
          >
            {site.games[game.meta.id]?.title || game.meta.title}
          </Link>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl paper-card">
        <table className="w-full text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Rank</th>
              <th className="px-4 py-3 text-left font-semibold">Player</th>
              <th className="px-4 py-3 text-left font-semibold">Rating</th>
              <th className="px-4 py-3 text-left font-semibold">Played</th>
              <th className="px-4 py-3 text-left font-semibold">Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.user.id} className="border-t border-gold/10">
                <td className="px-4 py-3 tabular-nums">{index + 1}</td>
                <td className="px-4 py-3">
                  <Link className="text-gold underline-offset-4 hover:underline" to={`/players/${row.user.id}`}>
                    {row.user.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3 tabular-nums">{row.stats.rating}</td>
                <td className="px-4 py-3 tabular-nums">{row.stats.played}</td>
                <td className="px-4 py-3 tabular-nums">{row.stats.winsVsHumans || 0}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-4 py-8 text-ink/45" colSpan={5}>
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
