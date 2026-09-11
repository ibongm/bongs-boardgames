import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { emptySeat, getRoom, withRoom } from './rooms.js';
import { commitMove, createMatch } from './matches.js';
import { getGame } from '../games/registry.js';

const DISCONNECT_MS = 30_000;

export function occupiedSeats(room) {
  return (room.seats || []).filter((seat) => seat.type !== 'empty');
}

function withParticipant(room, uid) {
  return Array.from(new Set([...(room.participantIds || []), uid].filter(Boolean)));
}

export async function sitDown(roomId, profile) {
  return withRoom(roomId, (room) => {
    if (room.status === 'finished') return null;
    const seats = room.seats.map((seat) => ({ ...seat }));
    if (seats.some((seat) => seat.uid === profile.uid)) return null;
    const open = seats.findIndex((seat) => seat.type === 'empty');
    if (open < 0) {
      const spectators = [...(room.spectators || [])];
      if (!spectators.some((s) => s.uid === profile.uid)) {
        spectators.push({ uid: profile.uid, name: profile.displayName });
      }
      return { spectators, participantIds: withParticipant(room, profile.uid) };
    }
    seats[open] = {
      uid: profile.uid,
      name: profile.displayName,
      type: 'human',
      difficulty: null,
      lastSeen: Date.now(),
      disconnectedAt: null,
    };
    const spectators = (room.spectators || []).filter((s) => s.uid !== profile.uid);
    return { seats, spectators, participantIds: withParticipant(room, profile.uid) };
  });
}

export async function addBot(roomId, difficulty = 'medium') {
  return withRoom(roomId, (room) => {
    if (room.status !== 'waiting') return null;
    const seats = room.seats.map((seat) => ({ ...seat }));
    const open = seats.findIndex((seat) => seat.type === 'empty');
    if (open < 0) return null;
    seats[open] = {
      uid: `bot-${open}`,
      name: `Bot (${difficulty})`,
      type: 'bot',
      difficulty,
      lastSeen: Date.now(),
      disconnectedAt: null,
    };
    return { seats };
  });
}

export async function removeSeat(roomId, index) {
  return withRoom(roomId, (room) => {
    if (room.status !== 'waiting') return null;
    const removed = room.seats[index];
    const seats = room.seats.map((seat, i) => (i === index ? emptySeat() : { ...seat }));
    const participantIds = (room.participantIds || []).filter((uid) => uid !== removed?.uid || uid === room.hostId);
    return { seats, participantIds: Array.from(new Set([room.hostId, ...participantIds])) };
  });
}

export async function heartbeat(roomId, uid) {
  return withRoom(roomId, (room) => {
    let changed = false;
    const seats = room.seats.map((seat) => {
      if (seat.uid === uid && seat.type === 'human') {
        changed = true;
        return { ...seat, lastSeen: Date.now(), disconnectedAt: null };
      }
      return { ...seat };
    });
    return changed ? { seats } : null;
  });
}

export async function replaceStaleHumans(roomId) {
  return withRoom(roomId, (room) => {
    if (room.status !== 'playing') return null;
    const now = Date.now();
    let changed = false;
    const seats = room.seats.map((seat) => {
      if (seat.type !== 'human' || !seat.lastSeen) return { ...seat };
      if (now - seat.lastSeen < DISCONNECT_MS) return { ...seat };
      if (!seat.disconnectedAt) {
        changed = true;
        return { ...seat, disconnectedAt: seat.lastSeen };
      }
      if (now - seat.disconnectedAt < DISCONNECT_MS) return { ...seat };
      changed = true;
      return {
        uid: `bot-replace-${seat.uid}`,
        name: 'Bot (medium)',
        type: 'bot',
        difficulty: 'medium',
        lastSeen: now,
        disconnectedAt: null,
      };
    });
    return changed ? { seats } : null;
  });
}

export async function startRoom(roomId) {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  if (occupiedSeats(room).length < 2) throw new Error('Need two seats filled');
  if (room.status !== 'waiting') throw new Error('Game already started');
  const match = await createMatch(room);
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'rooms', roomId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Room not found');
    if (snap.data().status !== 'waiting') return;
    tx.update(ref, { status: 'playing', matchId: match.id });
  });
  return match;
}

export async function playMove(match, room, move, actorUid) {
  const game = getGame(match.gameId);
  const current = match.seats[match.state.turn];
  if (current.type === 'human' && current.uid !== actorUid) throw new Error('Not your turn');
  const nextState = game.engine.applyMove(match.state, move);
  const result = game.engine.status(nextState).over
    ? { winner: nextState.winner, draw: nextState.draw }
    : null;
  const patch = { state: nextState, result, seats: room.seats };
  const applied = await commitMove(match.id, match.state.revision, patch);
  if (!applied) return match;
  const updated = { ...match, ...patch };
  if (result) {
    await withRoom(room.id, (live) => (live.status === 'playing' ? { status: 'finished' } : null));
  }
  return updated;
}

export async function playBotIfNeeded(match, room) {
  if (!match || match.result) return match;
  const game = getGame(match.gameId);
  const current = match.seats[match.state.turn];
  if (current?.type !== 'bot') return match;
  const move = game.ai.chooseMove(match.state, current.difficulty || 'medium');
  if (move === null || move === undefined) return match;
  return playMove(match, room, move, current.uid);
}
