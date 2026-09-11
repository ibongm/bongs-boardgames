import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { getGame } from '../games/registry.js';

export async function createMatch(room) {
  const game = getGame(room.gameId);
  const payload = {
    roomId: room.id,
    gameId: room.gameId,
    seats: room.seats,
    state: game.engine.createState(),
    result: null,
    statsApplied: false,
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

export async function updateMatch(matchId, patch) {
  await updateDoc(doc(db, 'matches', matchId), patch);
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
