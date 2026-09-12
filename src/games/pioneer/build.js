// Building rules, costs, spacing, and connectivity for Pioneer

import { INTERSECTIONS, PATHS } from './board.js';

export const COSTS = {
  road: { wood: 1, clay: 1 },
  settlement: { wood: 1, clay: 1, sheep: 1, wheat: 1 },
  city: { stone: 3, wheat: 2 },
  card: { stone: 1, sheep: 1, wheat: 1 },
};

export const MAX_PIECES = {
  roads: 15,
  settlements: 5,
  cities: 4,
};

export function canAfford(resources, cost) {
  if (!resources || !cost) return false;
  return Object.entries(cost).every(([res, amount]) => (resources[res] || 0) >= amount);
}

export function deductCost(resources, cost) {
  const next = { ...resources };
  Object.entries(cost).forEach(([res, amount]) => {
    next[res] = Math.max(0, (next[res] || 0) - amount);
  });
  return next;
}

export function canBuildRoad(state, seat, pathId, isFree = false) {
  const player = state.players[seat];
  if (!player || player.roadsLeft <= 0) return false;
  if (!isFree && !canAfford(player.resources, COSTS.road)) return false;

  const path = PATHS[pathId];
  if (!path) return false;
  if (state.paths[pathId]) return false; // already occupied

  const { intA, intB } = path;

  // Check if either endpoint allows connection for this seat
  const connectsAt = (intId) => {
    const b = state.intersections[intId];
    // If own building is here, connects!
    if (b && b.seat === seat) return true;
    // If enemy building is here, blocks connection from outside roads
    if (b && b.seat !== seat) return false;
    // Otherwise, check if an existing road of this seat touches intId
    const touchingPaths = INTERSECTIONS[intId].pathIds;
    return touchingPaths.some((pId) => state.paths[pId]?.seat === seat);
  };

  return connectsAt(intA) || connectsAt(intB);
}

export function canBuildSettlement(state, seat, intersectionId, isSetup = false) {
  const player = state.players[seat];
  if (!player || player.settlementsLeft <= 0) return false;
  if (!isSetup && !canAfford(player.resources, COSTS.settlement)) return false;

  const intObj = INTERSECTIONS[intersectionId];
  if (!intObj) return false;
  if (state.intersections[intersectionId]) return false; // already occupied

  // Spacing rule: no adjacent intersection may be occupied by ANY player
  const hasNeighborBuilding = intObj.neighborIntIds.some((nbrId) => Boolean(state.intersections[nbrId]));
  if (hasNeighborBuilding) return false;

  // If normal turn, must connect to at least one road owned by this seat
  if (!isSetup) {
    const hasConnectingRoad = intObj.pathIds.some((pId) => state.paths[pId]?.seat === seat);
    if (!hasConnectingRoad) return false;
  }

  return true;
}

export function canBuildCity(state, seat, intersectionId) {
  const player = state.players[seat];
  if (!player || player.citiesLeft <= 0) return false;
  if (!canAfford(player.resources, COSTS.city)) return false;

  const building = state.intersections[intersectionId];
  // Must be own settlement
  return Boolean(building && building.seat === seat && building.type === 'settlement');
}

export function canBuyCard(state, seat) {
  const player = state.players[seat];
  if (!player) return false;
  if (!canAfford(player.resources, COSTS.card)) return false;
  return (state.deck || []).length > 0;
}
