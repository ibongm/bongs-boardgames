import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { emptyGameStats, emptyLifetime, ratingDelta } from '../lib/codes.js';

function bump(stats, key) {
  return { ...stats, [key]: (stats[key] || 0) + 1, played: (stats.played || 0) + 1 };
}

export async function applyMatchResult(match) {
  if (!match.result || match.statsApplied) return;
  const humans = (match.seats || []).filter((seat) => seat.type === 'human' && seat.uid);
  const hasTwoHumans = humans.length >= 2;
  const winnerSeat = match.result.draw ? null : match.result.winner;
  const ratings = {};

  if (hasTwoHumans && winnerSeat !== null) {
    const winner = match.seats[winnerSeat];
    const loser = match.seats[winnerSeat === 0 ? 1 : 0];
    if (winner?.uid && loser?.uid) {
      const [wDoc, lDoc] = await Promise.all([
        getDoc(doc(db, 'users', winner.uid)),
        getDoc(doc(db, 'users', loser.uid)),
      ]);
      const wStats = wDoc.data()?.games?.[match.gameId] || emptyGameStats();
      const lStats = lDoc.data()?.games?.[match.gameId] || emptyGameStats();
      const delta = ratingDelta(wStats.rating, lStats.rating, false);
      ratings[winner.uid] = (wStats.rating || 1000) + delta;
      ratings[loser.uid] = (lStats.rating || 1000) - delta;
    }
  }

  if (hasTwoHumans && match.result.draw) {
    const [a, b] = humans;
    const [aDoc, bDoc] = await Promise.all([
      getDoc(doc(db, 'users', a.uid)),
      getDoc(doc(db, 'users', b.uid)),
    ]);
    const aStats = aDoc.data()?.games?.[match.gameId] || emptyGameStats();
    const bStats = bDoc.data()?.games?.[match.gameId] || emptyGameStats();
    const delta = ratingDelta(aStats.rating, bStats.rating, true);
    ratings[a.uid] = (aStats.rating || 1000) + delta;
    ratings[b.uid] = (bStats.rating || 1000) - delta;
  }

  for (let index = 0; index < match.seats.length; index += 1) {
    const seat = match.seats[index];
    if (seat.type !== 'human' || !seat.uid) continue;
    const ref = doc(db, 'users', seat.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;
    const data = snap.data();
    const life = data.stats || emptyLifetime();
    const perGame = { ...(data.games?.[match.gameId] || emptyGameStats()) };
    const vsBots = (match.seats || []).some((other) => other.type === 'bot');
    const won = winnerSeat === index;
    const lost = winnerSeat !== null && winnerSeat !== index;
    const nextLife = bump(life, won ? 'wins' : lost ? 'losses' : 'draws');
    const nextGame = bump(perGame, won ? 'wins' : lost ? 'losses' : 'draws');
    if (won && vsBots) nextGame.winsVsBots = (nextGame.winsVsBots || 0) + 1;
    if (won && hasTwoHumans) nextGame.winsVsHumans = (nextGame.winsVsHumans || 0) + 1;
    if (ratings[seat.uid] !== undefined) nextGame.rating = ratings[seat.uid];
    await updateDoc(ref, { stats: nextLife, [`games.${match.gameId}`]: nextGame });
  }

  await updateDoc(doc(db, 'matches', match.id), { statsApplied: true });
}
