import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { getGame } from '../games/registry.js';

async function ratingFor(uid, gameId) {
  try {
    const pub = await getDoc(doc(db, 'publicProfiles', uid));
    if (pub.exists()) return pub.data()?.games?.[gameId]?.rating || 1000;
  } catch {
    /* ignore */
  }
  try {
    const priv = await getDoc(doc(db, 'users', uid));
    return priv.data()?.games?.[gameId]?.rating || 1000;
  } catch {
    return 1000;
  }
}

export async function createMatch(room) {
  const game = getGame(room.gameId);
  const seats = (room.seats || []).map((seat) => ({ ...seat }));
  const playerSeats = {};
  seats.forEach((seat, index) => {
    if (seat.type === 'human' && seat.uid) playerSeats[seat.uid] = index;
  });
  const playerIds = Object.keys(playerSeats);
  const ratingSnapshot = {};
  await Promise.all(
    playerIds.map(async (uid) => {
      ratingSnapshot[uid] = await ratingFor(uid, room.gameId);
    })
  );
  const payload = {
    roomId: room.id,
    gameId: room.gameId,
    seats,
    playerIds,
    playerSeats,
    ratingSnapshot,
    statsAppliedBy: {},
    state: game.engine.createState(),
    result: null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'matches'), payload);
  return { id: ref.id, ...payload };
}

export function watchMatch(matchId, callback) {
  return onSnapshot(doc(db, 'matches', matchId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function commitMove(matchId, expectedRevision, patch) {
  const ref = doc(db, 'matches', matchId);
  let applied = false;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = snap.data();
    if (current.result) return;
    if (current.state?.revision !== expectedRevision) return;
    tx.update(ref, patch);
    applied = true;
  });
  return applied;
}
