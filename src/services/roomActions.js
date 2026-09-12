import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { emptySeat, getRoom, withRoom } from './rooms.js';
import { commitMove, createMatch } from './matches.js';
import { getGame } from '../games/registry.js';

const DEFAULT_DISCONNECT_MS = 30_000;

function disconnectMsFor(room) {
  const game = getGame(room?.gameId);
  return game?.meta?.disconnectMs || DEFAULT_DISCONNECT_MS;
}

function actorIndex(match) {
  const state = match?.state;
  if (!state) return 0;
  if (state.actorSeat !== undefined && state.actorSeat !== null) return state.actorSeat;
  return state.turn;
}

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

export async function setRoomSeatCount(roomId, requested) {
  return withRoom(roomId, (room) => {
    if (room.status !== 'waiting') return null;
    const game = getGame(room.gameId);
    const min = game?.meta?.seatsMin || game?.meta?.seats || 2;
    const max = game?.meta?.seatsMax || game?.meta?.seats || min;
    const nextCount = Math.min(max, Math.max(min, Number(requested) || min));
    const current = (room.seats || []).map((seat) => ({ ...seat }));
    const occupied = current.filter((seat) => seat.type !== 'empty').length;
    if (nextCount < occupied) throw new Error(`Already have ${occupied} players seated`);
    if (nextCount === current.length) return null;
    if (nextCount > current.length) {
      while (current.length < nextCount) current.push(emptySeat());
      return { seats: current };
    }
    const kept = [];
    let emptiesToDrop = current.length - nextCount;
    for (let i = current.length - 1; i >= 0; i -= 1) {
      if (emptiesToDrop > 0 && current[i].type === 'empty') {
        emptiesToDrop -= 1;
        continue;
      }
      kept.unshift(current[i]);
    }
    if (kept.length !== nextCount) throw new Error('Clear an empty seat first');
    return { seats: kept };
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

export async function setRoomTestMode(roomId, testMode) {
  return withRoom(roomId, (room) => {
    if (room.testMode === Boolean(testMode)) return null;
    return { testMode: Boolean(testMode) };
  });
}

export async function replaceStaleHumans(roomId) {
  return withRoom(roomId, (room) => {
    if (room.status !== 'playing') return null;
    if (room.testMode) return null;
    const now = Date.now();
    let changed = false;
    const seats = room.seats.map((seat) => {
      if (seat.type !== 'human' || !seat.lastSeen) return { ...seat };
      const wait = disconnectMsFor(room);
      if (now - seat.lastSeen >= 10000 && !seat.disconnectedAt) {
        changed = true;
        return { ...seat, disconnectedAt: now };
      }
      if (seat.disconnectedAt && now - seat.disconnectedAt >= wait) {
        changed = true;
        return {
          uid: `bot-replace-${seat.uid}`,
          name: 'Bot (medium)',
          type: 'bot',
          difficulty: 'medium',
          lastSeen: now,
          disconnectedAt: null,
        };
      }
      return { ...seat };
    });
    return changed ? { seats } : null;
  });
}

export async function startRoom(roomId) {
  const room = await getRoom(roomId);
  if (!room) throw new Error('Room not found');
  const needed = room.seatCount || (room.seats || []).length;
  const filled = occupiedSeats(room).length;
  if (filled < needed) throw new Error('Fill every seat before starting');
  if (filled < 2) throw new Error('Need two seats filled');
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
  const isTradeResponse = move?.type === 'counterTrade' || move?.type === 'acceptTrade';
  const current = match.seats[actorIndex(match)];
  if (isTradeResponse) {
    const isSeated = match.seats.some((s) => s.uid === actorUid);
    if (!isSeated) throw new Error('Not seated at this table');
  } else if (current?.type === 'human' && current.uid !== actorUid) {
    throw new Error('Not your turn');
  }
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

  // If there is an open trade offer in Pioneer, check if any seated bot accepts it
  if (match.gameId === 'pioneer' && match.state?.offers?.some((o) => !o.closed)) {
    const openOffer = match.state.offers.find((o) => !o.closed);
    for (let s = 0; s < match.seats.length; s++) {
      const seat = match.seats[s];
      if (seat?.type === 'bot' && seat.uid && openOffer.fromSeat !== s) {
        const accept = game.ai.evaluateTradeOffer?.(match.state, s, openOffer);
        if (accept) {
          return playMove(match, room, accept, seat.uid);
        }
      }
    }
  }

  const current = match.seats[actorIndex(match)];
  if (current?.type !== 'bot') return match;
  const move = game.ai.chooseMove(match.state, current.difficulty || 'medium');
  if (move === null || move === undefined) return match;
  return playMove(match, room, move, current.uid);
}
