import { doc, runTransaction, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { emptyGameStats, emptyLifetime, ratingDelta } from '../lib/codes.js';
import { publicProfilePayload } from './users.js';
import { recordFinishedMatch } from './aggregates.js';

function bump(stats, key) {
  return { ...stats, [key]: (stats[key] || 0) + 1, played: (stats.played || 0) + 1 };
}

function nextRating(match, uid, won, lost) {
  const snapshot = match.ratingSnapshot || {};
  const playerIds = match.playerIds || [];
  const oppId = playerIds.find((id) => id !== uid);
  const mine = snapshot[uid] ?? 1000;
  const opp = snapshot[oppId] ?? 1000;
  if (match.result?.draw) return mine + ratingDelta(mine, opp, true);
  if (won) return mine + ratingDelta(mine, opp, false);
  if (lost) return mine - ratingDelta(opp, mine, false);
  return mine;
}

export async function applyOwnMatchResult(match, uid) {
  if (!db || !match?.id || !match.result || !uid) return;
  const playerIds = match.playerIds || [];
  if (playerIds.length < 2 || !playerIds.includes(uid)) return;
  if (match.statsAppliedBy?.[uid]) return;

  const matchRef = doc(db, 'matches', match.id);
  const userRef = doc(db, 'users', uid);
  const pubRef = doc(db, 'publicProfiles', uid);
  let published = null;

  await runTransaction(db, async (tx) => {
    const matchSnap = await tx.get(matchRef);
    const userSnap = await tx.get(userRef);
    const pubSnap = await tx.get(pubRef);
    if (!matchSnap.exists() || !userSnap.exists()) return;
    const live = matchSnap.data();
    if (!live.result) return;
    if ((live.playerIds || []).length < 2) return;
    if ((live.statsAppliedBy || {})[uid]) return;
    if (!(live.playerIds || []).includes(uid)) return;

    const account = userSnap.data();
    const visible = pubSnap.exists() ? pubSnap.data() : account;
    const gameId = live.gameId;
    const life = visible.stats || emptyLifetime();
    const perGame = { ...(visible.games?.[gameId] || emptyGameStats()) };
    const mySeat = live.playerSeats?.[uid];
    const winnerSeat = live.result.draw ? null : live.result.winner;
    const won = winnerSeat === mySeat;
    const lost = winnerSeat !== null && winnerSeat !== mySeat;
    const firstTime = (perGame.played || 0) === 0;
    const nextLife = bump(life, won ? 'wins' : lost ? 'losses' : 'draws');
    const nextGame = bump(perGame, won ? 'wins' : lost ? 'losses' : 'draws');
    if (won) nextGame.winsVsHumans = (nextGame.winsVsHumans || 0) + 1;
    nextGame.rating = nextRating(live, uid, won, lost);
    nextGame.lastPlayedAt = Date.now();
    const popularityNeeded = !live.popularityCounted;

    published = {
      displayName: visible.displayName || account.displayName,
      role: account.role === 'admin' ? 'admin' : 'player',
      stats: nextLife,
      games: { ...(visible.games || {}), [gameId]: nextGame },
    };

    const matchPatch = { [`statsAppliedBy.${uid}`]: true };
    if (popularityNeeded) matchPatch.popularityCounted = true;
    tx.set(pubRef, publicProfilePayload(published), { merge: true });
    tx.update(matchRef, matchPatch);
    published = { ...published, firstTime, countPopularity: popularityNeeded, gameId };
  });

  if (published && (published.countPopularity || published.firstTime)) {
    try {
      await recordFinishedMatch(published.gameId, {
        countMatch: published.countPopularity,
        firstTimeForPlayer: published.firstTime,
      });
    } catch {
      /* stats doc rules may not be live yet */
    }
  }
}
