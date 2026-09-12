// Seven discard, Bandit movement, and stealing logic for Pioneer

import { HEXES, INTERSECTIONS } from './board.js';

export function getDiscardRequiredCount(resourceCount) {
  return resourceCount >= 8 ? Math.floor(resourceCount / 2) : 0;
}

export function getPendingDiscardSeats(state) {
  const pending = [];
  state.players.forEach((p, seat) => {
    const total = Object.values(p.resources || {}).reduce((s, n) => s + (n || 0), 0);
    const required = getDiscardRequiredCount(total);
    const alreadyDiscarded = state.discardsDone?.[seat] || false;
    if (required > 0 && !alreadyDiscarded) {
      pending.push({ seat, required, current: total });
    }
  });
  return pending;
}

export function getEligibleStealSeats(state, hexId, actorSeat) {
  const hex = HEXES[hexId];
  if (!hex) return [];

  const eligibleSeats = new Set();
  hex.vertices.forEach((intId) => {
    const building = state.intersections[intId];
    if (building && building.seat !== actorSeat) {
      const opp = state.players[building.seat];
      const oppCount = Object.values(opp?.resources || {}).reduce((s, n) => s + (n || 0), 0);
      if (oppCount > 0) {
        eligibleSeats.add(building.seat);
      }
    }
  });

  return Array.from(eligibleSeats);
}

export function pickRandomResource(resources, rand = Math.random) {
  const deck = [];
  Object.entries(resources || {}).forEach(([res, count]) => {
    for (let i = 0; i < count; i += 1) deck.push(res);
  });
  if (deck.length === 0) return null;
  const idx = Math.floor(rand() * deck.length);
  return deck[idx];
}

export function updateGrandGarrison(state) {
  const currentHolder = state.grandGarrisonSeat;
  const currentBest = currentHolder !== null && currentHolder !== undefined
    ? state.players[currentHolder]?.playedGuards || 0
    : 2;

  let nextHolder = currentHolder;

  state.players.forEach((p, seat) => {
    if (p.playedGuards >= 3 && p.playedGuards > currentBest) {
      nextHolder = seat;
    }
  });

  if (nextHolder !== state.grandGarrisonSeat) {
    state.grandGarrisonSeat = nextHolder;
    return {
      changed: true,
      previous: currentHolder,
      current: nextHolder,
    };
  }

  return { changed: false };
}
