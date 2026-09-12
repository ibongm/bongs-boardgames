// Dice roll and resource production logic for Pioneer

import { HEXES } from './board.js';
import { TERRAIN_TO_RESOURCE } from './maps/balanced.js';

export function rollDice(rand = Math.random) {
  const d1 = Math.floor(rand() * 6) + 1;
  const d2 = Math.floor(rand() * 6) + 1;
  return [d1, d2];
}

export function calculateProduction(state, roll) {
  const total = roll[0] + roll[1];
  if (total === 7) return { yields: {}, shortages: [], blockedHexIds: [] };

  // Collect demands per resource
  // resource -> seat -> amount
  const demands = {};
  const blockedHexIds = [];

  state.hexes.forEach((hex) => {
    if (hex.number !== total) return;
    if (hex.id === state.banditHexId) {
      blockedHexIds.push(hex.id);
      return;
    }

    const res = TERRAIN_TO_RESOURCE[hex.terrain];
    if (!res) return;

    if (!demands[res]) demands[res] = {};

    const boardHex = HEXES[hex.id];
    if (!boardHex) return;

    boardHex.vertices.forEach((intId) => {
      const building = state.intersections[intId];
      if (!building) return;

      const qty = building.type === 'city' ? 2 : 1;
      demands[res][building.seat] = (demands[res][building.seat] || 0) + qty;
    });
  });

  const yields = {};
  for (let s = 0; s < state.seatCount; s += 1) {
    yields[s] = {};
  }
  const shortages = [];

  // Resolve bank stock
  Object.entries(demands).forEach(([res, seatMap]) => {
    const totalDemanded = Object.values(seatMap).reduce((s, n) => s + n, 0);
    const bankAvailable = state.bank[res] || 0;

    if (bankAvailable >= totalDemanded) {
      // Full distribution
      Object.entries(seatMap).forEach(([seat, amt]) => {
        yields[seat][res] = amt;
      });
    } else {
      // Shortage condition
      const seatsInvolved = Object.keys(seatMap);
      if (seatsInvolved.length === 1) {
        // Single player gets remaining bank cards
        const singleSeat = seatsInvolved[0];
        yields[singleSeat][res] = bankAvailable;
        shortages.push({ resource: res, partial: true, seat: singleSeat, granted: bankAvailable });
      } else {
        // Multiple players: nobody gets any cards of this resource
        shortages.push({ resource: res, cancelled: true, totalDemanded, available: bankAvailable });
      }
    }
  });

  return { yields, shortages, blockedHexIds };
}
