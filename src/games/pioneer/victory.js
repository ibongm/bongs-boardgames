// Victory points calculation and win declarations for Pioneer

import { getCardDef } from './cards.js';

export function calculatePublicVP(state, seat) {
  let vp = 0;

  // Settlements: 1 VP each, Cities: 2 VP each
  Object.values(state.intersections || {}).forEach((b) => {
    if (b && b.seat === seat) {
      if (b.type === 'settlement') vp += 1;
      if (b.type === 'city') vp += 2;
    }
  });

  // Longest Route: 2 VP
  if (state.longestRouteSeat === seat) vp += 2;

  // Grand Garrison: 2 VP
  if (state.grandGarrisonSeat === seat) vp += 2;

  return vp;
}

export function calculateHiddenVP(state, seat) {
  const player = state.players[seat];
  if (!player) return 0;

  let hiddenVP = 0;
  (player.hiddenCards || []).forEach((cId) => {
    const def = getCardDef(cId);
    if (def?.isCharter) hiddenVP += def.vp;
  });

  return hiddenVP;
}

export function calculateTotalVP(state, seat) {
  return calculatePublicVP(state, seat) + calculateHiddenVP(state, seat);
}

export function canDeclareWin(state, actorSeat) {
  if (state.turn !== actorSeat) return false;
  return calculateTotalVP(state, actorSeat) >= 10;
}
