import { emptySeat, updateRoom } from './rooms.js';
import { commitMove, createMatch } from './matches.js';
import { getGame } from '../games/registry.js';
import { applyMatchResult } from './stats.js';

const DISCONNECT_MS = 30_000;

export function occupiedSeats(room) {
  return (room.seats || []).filter((seat) => seat.type !== 'empty');
}

export async function sitDown(room, profile) {
  const seats = room.seats.map((seat) => ({ ...seat }));
  if (seats.some((seat) => seat.uid === profile.uid)) return;
  const open = seats.findIndex((seat) => seat.type === 'empty');
  if (open < 0) {
    const spectators = [...(room.spectators || [])];
    if (!spectators.some((s) => s.uid === profile.uid)) {
      spectators.push({ uid: profile.uid, name: profile.displayName });
    }
    await updateRoom(room.id, { spectators });
    return;
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
  await updateRoom(room.id, { seats, spectators });
}

export async function addBot(room, difficulty = 'medium') {
  const seats = room.seats.map((seat) => ({ ...seat }));
  const open = seats.findIndex((seat) => seat.type === 'empty');
  if (open < 0) return;
  seats[open] = {
    uid: `bot-${open}`,
    name: `Bot (${difficulty})`,
    type: 'bot',
    difficulty,
    lastSeen: Date.now(),
    disconnectedAt: null,
  };
  await updateRoom(room.id, { seats });
}

export async function removeSeat(room, index) {
  const seats = room.seats.map((seat, i) => (i === index ? emptySeat() : { ...seat }));
  await updateRoom(room.id, { seats });
}

export async function heartbeat(room, uid) {
  const seats = room.seats.map((seat) =>
    seat.uid === uid && seat.type === 'human'
      ? { ...seat, lastSeen: Date.now(), disconnectedAt: null }
      : { ...seat }
  );
  await updateRoom(room.id, { seats });
}

export async function replaceStaleHumans(room) {
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
  if (changed) await updateRoom(room.id, { seats });
  return seats;
}

export async function startRoom(room) {
  if (occupiedSeats(room).length < 2) throw new Error('Need two seats filled');
  const match = await createMatch(room);
  await updateRoom(room.id, { status: 'playing', matchId: match.id });
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
    await updateRoom(room.id, { status: 'finished' });
    await applyMatchResult(updated);
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
