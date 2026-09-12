import { legalActions, actorSeatOf } from './engine.js';
import { cardById } from './cards.js';
import { ROLE_RANK } from './names.js';

function pick(list, rand) {
  if (!list.length) return null;
  return list[Math.floor(rand() * list.length)];
}

function seeded(state) {
  let s = ((state.seed || 1) + (state.revision || 0) * 17) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function chooseMove(state, difficulty = 'medium') {
  const seat = actorSeatOf(state);
  if (seat === null || seat === undefined) return null;
  const actions = legalActions(state, seat);
  if (!actions.length) return null;
  const rand = seeded(state);
  const level = difficulty || 'medium';
  if (level === 'easy') return easyPick(actions, state, seat, rand);
  if (level === 'hard') return hardPick(actions, state, seat, rand) || mediumPick(actions, state, seat, rand);
  return mediumPick(actions, state, seat, rand);
}

function easyPick(actions, state, seat, rand) {
  const gold = actions.find((a) => a.type === 'gatherGold');
  if (gold && (state.players[seat].gold || 0) < 3) return gold;
  const builds = actions.filter((a) => a.type === 'build');
  if (builds.length && rand() < 0.7) {
    return builds.sort((a, b) => cardById(a.cardId).cost - cardById(b.cardId).cost)[0];
  }
  const end = actions.find((a) => a.type === 'endTurn');
  const useful = actions.filter((a) => a.type !== 'endTurn');
  if (useful.length && rand() < 0.85) return pick(useful, rand);
  return end || pick(actions, rand);
}

function mediumPick(actions, state, seat, rand) {
  if (state.phase === 'draft') return draftPick(actions, state, seat);
  if (state.phase === 'chooseCard') {
    const drawn = state.pendingDraw || [];
    let best = 0;
    drawn.forEach((id, i) => {
      if ((cardById(id)?.cost || 0) > (cardById(drawn[best])?.cost || 0)) best = i;
    });
    return { type: 'keepDrawn', keepIndex: best };
  }
  if (state.phase === 'gather') {
    const p = state.players[seat];
    const cheap = p.hand.some((id) => (cardById(id)?.cost || 9) <= p.gold + 2);
    if (p.gold < 2 || !cheap) return actions.find((a) => a.type === 'gatherGold') || actions[0];
    return actions.find((a) => a.type === 'gatherCards') || actions[0];
  }
  const income = actions.find((a) => a.type === 'typeIncome');
  if (income) return income;
  const kill = actions.find((a) => a.type === 'assassinKill' && a.roleId === 'warlord')
    || actions.find((a) => a.type === 'assassinKill' && a.roleId === 'architect');
  if (kill && leadingSeat(state) !== seat) return kill;
  const rob = actions.find((a) => a.type === 'thiefRob' && a.roleId === 'merchant')
    || actions.find((a) => a.type === 'thiefRob' && a.roleId === 'king');
  if (rob) return rob;
  const builds = actions.filter((a) => a.type === 'build');
  if (builds.length) {
    return builds.sort((a, b) => cardById(b.cardId).cost - cardById(a.cardId).cost)[0];
  }
  const destroy = actions
    .filter((a) => a.type === 'warlordDestroy' && a.seat !== seat)
    .sort((a, b) => {
      const ca = cardById(state.players[a.seat].city[a.districtIndex]);
      const cb = cardById(state.players[b.seat].city[b.districtIndex]);
      return (cb?.cost || 0) - (ca?.cost || 0);
    });
  if (destroy[0]) return destroy[0];
  const swap = actions.find((a) => a.type === 'magicianSwap' && state.players[a.seat].hand.length > state.players[seat].hand.length);
  if (swap) return swap;
  return actions.find((a) => a.type === 'endTurn') || pick(actions, rand);
}

function hardPick(actions, state, seat, rand) {
  if (state.phase === 'draft') return draftPick(actions, state, seat, true);
  const leader = leadingSeat(state);
  const killLeader = actions.find((a) => a.type === 'assassinKill' && likelyRole(state, leader) === a.roleId);
  if (killLeader) return killLeader;
  return mediumPick(actions, state, seat, rand);
}

function draftPick(actions, state, seat, hard = false) {
  const city = state.players[seat].city;
  const counts = { noble: 0, religious: 0, trade: 0, military: 0 };
  city.forEach((id) => {
    const t = cardById(id)?.type;
    if (counts[t] !== undefined) counts[t] += 1;
  });
  const prefer = [];
  if (city.length >= 5) prefer.push('bishop', 'warlord');
  if (state.players[seat].hand.length <= 1) prefer.push('architect', 'magician');
  if (counts.trade >= 2) prefer.push('merchant');
  if (counts.noble >= 2) prefer.push('king');
  if (counts.military >= 2) prefer.push('warlord');
  if (hard && leadingSeat(state) !== seat) prefer.unshift('assassin', 'warlord');
  for (const roleId of prefer) {
    const hit = actions.find((a) => a.roleId === roleId);
    if (hit) return hit;
  }
  const ranks = actions.slice().sort((a, b) => (ROLE_RANK[b.roleId] || 0) - (ROLE_RANK[a.roleId] || 0));
  return ranks[0] || actions[0];
}

function leadingSeat(state) {
  let best = 0;
  let score = -1;
  state.players.forEach((p, i) => {
    const s = p.city.reduce((n, id) => n + (cardById(id)?.cost || 0), 0) + p.city.length;
    if (s > score) {
      score = s;
      best = i;
    }
  });
  return best;
}

function likelyRole(state, seat) {
  const p = state.players[seat];
  if (p.roleRevealed) return p.roleId;
  if (p.city.filter((id) => cardById(id)?.type === 'trade').length >= 2) return 'merchant';
  if (p.city.length >= 5) return 'architect';
  return 'warlord';
}
