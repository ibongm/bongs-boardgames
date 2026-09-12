import { doc, increment, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const statsRef = () => doc(db, 'stats', 'games');

export function watchGameStats(callback) {
  if (!db) return () => {};
  return onSnapshot(statsRef(), (snap) => {
    callback(snap.exists() ? snap.data().games || {} : {});
  });
}

export async function recordFinishedMatch(gameId, { countMatch, firstTimeForPlayer }) {
  if (!db || !gameId) return;
  const patch = {};
  if (countMatch) patch[`games.${gameId}.played`] = increment(1);
  if (firstTimeForPlayer) patch[`games.${gameId}.uniquePlayers`] = increment(1);
  if (!Object.keys(patch).length) return;
  await setDoc(statsRef(), patch, { merge: true });
}
