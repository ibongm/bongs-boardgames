// Longest Route calculation and award management for Pioneer

import { PATHS } from './board.js';

export function calculateLongestRoute(state, seat) {
  const ownedPathIds = Object.keys(state.paths).filter((pId) => state.paths[pId]?.seat === seat);
  if (ownedPathIds.length === 0) return 0;

  const adj = new Map();
  ownedPathIds.forEach((pId) => {
    const p = PATHS[pId];
    if (!p) return;
    if (!adj.has(p.intA)) adj.set(p.intA, []);
    if (!adj.has(p.intB)) adj.set(p.intB, []);
    adj.get(p.intA).push({ next: p.intB, pathId: pId });
    adj.get(p.intB).push({ next: p.intA, pathId: pId });
  });

  let maxLength = 0;

  function dfs(currentInt, visitedEdges) {
    if (visitedEdges.size > maxLength) maxLength = visitedEdges.size;

    // Check if current intersection is blocked by an enemy building
    const building = state.intersections[currentInt];
    if (building && building.seat !== seat && visitedEdges.size > 0) {
      // Enemy settlement/city terminates path continuation
      return;
    }

    const edges = adj.get(currentInt) || [];
    for (let i = 0; i < edges.length; i += 1) {
      const edge = edges[i];
      if (!visitedEdges.has(edge.pathId)) {
        visitedEdges.add(edge.pathId);
        dfs(edge.next, visitedEdges);
        visitedEdges.delete(edge.pathId);
      }
    }
  }

  for (const startInt of adj.keys()) {
    dfs(startInt, new Set());
  }

  return maxLength;
}

export function updateLongestRoute(state) {
  const routeLengths = state.players.map((_, seat) => calculateLongestRoute(state, seat));

  // Update route lengths on player objects
  state.players.forEach((p, seat) => {
    p.routeLength = routeLengths[seat];
  });

  const currentHolder = state.longestRouteSeat;
  const currentBest = currentHolder !== null && currentHolder !== undefined ? routeLengths[currentHolder] : 0;

  let nextHolder = currentHolder;

  if (currentHolder === null || currentHolder === undefined) {
    // Look for first player with >= 5
    let bestSeat = null;
    let bestVal = 4;
    routeLengths.forEach((len, seat) => {
      if (len > bestVal) {
        bestVal = len;
        bestSeat = seat;
      }
    });
    if (bestSeat !== null) nextHolder = bestSeat;
  } else {
    // Current holder exists. Check if current holder still has at least 5
    if (routeLengths[currentHolder] < 5) {
      // Find new leader
      let maxLen = 4;
      let candidates = [];
      routeLengths.forEach((len, seat) => {
        if (len > maxLen) {
          maxLen = len;
          candidates = [seat];
        } else if (len === maxLen && maxLen >= 5) {
          candidates.push(seat);
        }
      });
      // If exactly 1 player uniquely has >= 5, they get it. If tie, returns to table.
      nextHolder = candidates.length === 1 ? candidates[0] : null;
    } else {
      // Check if someone beats current holder strictly
      routeLengths.forEach((len, seat) => {
        if (seat !== currentHolder && len > currentBest) {
          nextHolder = seat;
        }
      });
    }
  }

  if (nextHolder !== state.longestRouteSeat) {
    state.longestRouteSeat = nextHolder;
    return {
      changed: true,
      previous: currentHolder,
      current: nextHolder,
    };
  }

  return { changed: false };
}
