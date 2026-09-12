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

export function serializeMatchState(state) {
  if (!state) return state;
  if (Array.isArray(state.board) && Array.isArray(state.board[0])) {
    return {
      ...state,
      board: state.board.map((row) => ({ cells: row })),
      _encodedBoard: 'rows',
    };
  }
  return state;
}

export function deserializeMatchState(state) {
  if (!state) return state;
  if (state._encodedBoard === 'rows' && Array.isArray(state.board)) {
    const { _encodedBoard, ...rest } = state;
    return {
      ...rest,
      board: state.board.map((r) => r.cells),
    };
  }
  return state;
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
  const rawState = game.engine.createState({ seatCount: seats.length, mapId: room.mapId, map: room.mapId });
  const payload = {
    roomId: room.id,
    gameId: room.gameId,
    seats,
    playerIds,
    playerSeats,
    ratingSnapshot,
    statsAppliedBy: {},
    state: serializeMatchState(rawState),
    result: null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'matches'), payload);
  return { id: ref.id, ...payload, state: rawState };
}

export function watchMatch(matchId, callback) {
  return onSnapshot(doc(db, 'matches', matchId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    callback({
      id: snap.id,
      ...data,
      state: deserializeMatchState(data.state),
    });
  });
}

export async function commitMove(matchId, expectedRevision, patch) {
  const ref = doc(db, 'matches', matchId);
  let applied = false;
  const dbPatch = { ...patch };
  if (dbPatch.state) {
    dbPatch.state = serializeMatchState(dbPatch.state);
  }
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = snap.data();
    if (current.result) return;
    if (current.state?.revision !== expectedRevision) return;
    tx.update(ref, dbPatch);
    applied = true;
  });
  return applied;
}
