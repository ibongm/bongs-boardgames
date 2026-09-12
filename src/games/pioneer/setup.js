// Initial board setup for Balanced Isle and Random Isle

import { INTERSECTIONS, PATHS } from './board.js';
import { BALANCED_STARTS, TERRAIN_TO_RESOURCE } from './maps/balanced.js';
import { canBuildSettlement } from './build.js';

export function applyBalancedStarts(state) {
  const seatCount = state.seatCount;

  for (let s = 0; s < seatCount; s += 1) {
    const start = BALANCED_STARTS[s];
    if (!start) continue;

    const player = state.players[s];

    // Place settlements
    state.intersections[start.settlement1] = { seat: s, type: 'settlement' };
    state.intersections[start.settlement2] = { seat: s, type: 'settlement' };
    player.settlementsLeft -= 2;

    // Place roads
    state.paths[start.road1] = { seat: s };
    state.paths[start.road2] = { seat: s };
    player.roadsLeft -= 2;

    // Grant opening resources from starred settlement
    const starredInt = INTERSECTIONS[start.starred];
    if (starredInt) {
      starredInt.hexIds.forEach((hId) => {
        const hex = state.hexes.find((h) => h.id === hId);
        if (hex && hex.terrain !== 'desert') {
          const res = TERRAIN_TO_RESOURCE[hex.terrain];
          if (res) {
            player.resources[res] = (player.resources[res] || 0) + 1;
            if (state.bank[res] > 0) state.bank[res] -= 1;
          }
        }
      });
    }
  }

  state.phase = 'rolling';
  state.turn = 0;
  state.actorSeat = 0;
}

export function getSetupPlacementOrder(seatCount) {
  // Round 1: 0, 1, 2, (3)
  // Round 2: (3), 2, 1, 0
  const r1 = Array.from({ length: seatCount }, (_, i) => i);
  const r2 = Array.from({ length: seatCount }, (_, i) => seatCount - 1 - i);
  return [...r1, ...r2];
}

export function applySetupAction(state, action, actorSeat) {
  const { intersectionId, pathId } = action;
  const player = state.players[actorSeat];
  if (!player) throw new Error('Invalid seat');

  if (!canBuildSettlement(state, actorSeat, intersectionId, true)) {
    throw new Error('Illegal settlement placement');
  }

  const pObj = PATHS[pathId];
  if (!pObj || state.paths[pathId]) throw new Error('Illegal path');
  if (pObj.intA !== intersectionId && pObj.intB !== intersectionId) {
    throw new Error('Road must connect to the placed settlement');
  }

  // Place settlement and road
  state.intersections[intersectionId] = { seat: actorSeat, type: 'settlement' };
  player.settlementsLeft -= 1;

  state.paths[pathId] = { seat: actorSeat };
  player.roadsLeft -= 1;

  const currentStep = state.setupStep || 0;
  const isRoundTwo = currentStep >= state.seatCount;

  // Round 2 grants starting resources from this second settlement
  if (isRoundTwo) {
    const intObj = INTERSECTIONS[intersectionId];
    intObj.hexIds.forEach((hId) => {
      const hex = state.hexes.find((h) => h.id === hId);
      if (hex && hex.terrain !== 'desert') {
        const res = TERRAIN_TO_RESOURCE[hex.terrain];
        if (res) {
          player.resources[res] = (player.resources[res] || 0) + 1;
          if (state.bank[res] > 0) state.bank[res] -= 1;
        }
      }
    });
  }

  const nextStep = currentStep + 1;
  const totalSteps = state.seatCount * 2;

  if (nextStep >= totalSteps) {
    // Setup complete!
    state.phase = 'rolling';
    // The player who placed last rolls first
    state.turn = actorSeat;
    state.actorSeat = actorSeat;
    state.setupStep = null;
  } else {
    state.setupStep = nextStep;
    const order = getSetupPlacementOrder(state.seatCount);
    state.turn = order[nextStep];
    state.actorSeat = order[nextStep];
  }
}
