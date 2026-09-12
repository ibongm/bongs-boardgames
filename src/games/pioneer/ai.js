// Bot AI for Pioneer (Easy, Medium, Hard)

import { HEXES, INTERSECTIONS, PATHS } from './board.js';
import { NUMBER_PIPS, TERRAIN_TO_RESOURCE } from './maps/balanced.js';
import { legalActions } from './engine.js';
import { canBuildSettlement } from './build.js';
import { getDiscardRequiredCount, getEligibleStealSeats } from './bandit.js';

function hexPips(hex) {
  return hex?.number ? NUMBER_PIPS[hex.number] || 0 : 0;
}

function intersectionPips(state, intId) {
  const intObj = INTERSECTIONS[intId];
  if (!intObj) return 0;
  return intObj.hexIds.reduce((sum, hId) => {
    const hex = state.hexes.find((h) => h.id === hId);
    return sum + hexPips(hex);
  }, 0);
}

function intersectionResourceWeights(state, intId, preferWoodClay = false) {
  const intObj = INTERSECTIONS[intId];
  if (!intObj) return 0;
  let weight = 0;
  intObj.hexIds.forEach((hId) => {
    const hex = state.hexes.find((h) => h.id === hId);
    if (!hex) return;
    const pips = hexPips(hex);
    const res = TERRAIN_TO_RESOURCE[hex.terrain];
    if (res === 'wood' || res === 'clay') {
      weight += pips * (preferWoodClay ? 1.6 : 1.2);
    } else if (res === 'wheat' || res === 'sheep') {
      weight += pips * 1.1;
    } else if (res === 'stone') {
      weight += pips * (preferWoodClay ? 0.9 : 1.3);
    }
  });
  return weight;
}

export function chooseMove(state, difficulty = 'medium') {
  if (state.phase === 'gameover' || state.winner !== null) return null;

  const actorSeat = state.actorSeat !== undefined && state.actorSeat !== null ? state.actorSeat : state.turn;
  const player = state.players[actorSeat];
  if (!player) return null;

  // Handle discarding phase
  if (state.phase === 'discarding') {
    const total = Object.values(player.resources || {}).reduce((s, n) => s + (n || 0), 0);
    const required = getDiscardRequiredCount(total);
    if (required <= 0 || state.discardsDone?.[actorSeat]) return null;

    // Pick resources to discard
    const toDiscard = {};
    let count = 0;
    // Prefer discarding resource with highest count
    while (count < required) {
      const available = Object.entries(player.resources).filter(
        ([res, amt]) => amt - (toDiscard[res] || 0) > 0
      );
      if (available.length === 0) break;
      available.sort((a, b) => b[1] - a[1]);
      const resToDrop = available[0][0];
      toDiscard[resToDrop] = (toDiscard[resToDrop] || 0) + 1;
      count += 1;
    }
    return { type: 'discard', resources: toDiscard };
  }

  // Handle setup phase
  if (state.phase === 'setup') {
    const legals = legalActions(state, actorSeat);
    if (legals.length === 0) return null;

    if (difficulty === 'easy') {
      return legals[Math.floor(Math.random() * legals.length)];
    }

    // Medium and Hard evaluate pips and wood/clay priorities
    let bestAction = legals[0];
    let bestScore = -1;

    legals.forEach((act) => {
      const score = intersectionResourceWeights(state, act.intersectionId, true);
      if (score > bestScore) {
        bestScore = score;
        bestAction = act;
      }
    });

    return bestAction;
  }

  // Handle rolling phase
  if (state.phase === 'rolling') {
    // Should bot play Guard before rolling?
    if (difficulty !== 'easy' && !state.playedCardThisTurn) {
      const hasGuard = player.hiddenCards.some((id) => id.startsWith('guard_'));
      // If Bandit is on a high pip hex of the bot, play Guard
      const banditHex = state.hexes.find((h) => h.id === state.banditHexId);
      const isBanditOnMe = banditHex && HEXES[banditHex.id]?.vertices.some((intId) => {
        const b = state.intersections[intId];
        return b && b.seat === actorSeat;
      });

      if (hasGuard && isBanditOnMe && hexPips(banditHex) >= 3) {
        const cardId = player.hiddenCards.find((id) => id.startsWith('guard_'));
        return { type: 'playCard', cardId };
      }
    }

    return { type: 'roll' };
  }

  // Handle bandit phase
  if (state.phase === 'bandit') {
    // Find candidate hexes
    const otherHexes = state.hexes.filter((h) => h.id !== state.banditHexId);

    if (difficulty === 'easy') {
      const targetHex = otherHexes[Math.floor(Math.random() * otherHexes.length)];
      const eligibleSeats = getEligibleStealSeats(state, targetHex.id, actorSeat);
      const stealSeat = eligibleSeats.length > 0 ? eligibleSeats[0] : null;
      return { type: 'moveBandit', hexId: targetHex.id, stealFromSeat: stealSeat };
    }

    // Medium & Hard: Target highest-pip hex of the opponent with the most VP or cards
    let bestHex = otherHexes[0];
    let bestVictim = null;
    let bestScore = -999;

    otherHexes.forEach((hex) => {
      const eligible = getEligibleStealSeats(state, hex.id, actorSeat);
      const pips = hexPips(hex);

      // We do not want to place Bandit on our own settlements/cities!
      const touchesSelf = HEXES[hex.id]?.vertices.some((intId) => {
        const b = state.intersections[intId];
        return b && b.seat === actorSeat;
      });

      if (touchesSelf) return;

      eligible.forEach((oppSeat) => {
        const opp = state.players[oppSeat];
        const score = pips * 2 + (opp.publicVP || 0) * 3 + (opp.cardCount || 0);
        if (score > bestScore) {
          bestScore = score;
          bestHex = hex;
          bestVictim = oppSeat;
        }
      });
    });

    return { type: 'moveBandit', hexId: bestHex.id, stealFromSeat: bestVictim };
  }

  // Handle main phase
  if (state.phase === 'main') {
    const legals = legalActions(state, actorSeat);

    // 1. Declare win if available
    const winAct = legals.find((a) => a.type === 'declareWin');
    if (winAct) return winAct;

    // 2. Play Breakthrough card if available and beneficial
    if (difficulty !== 'easy') {
      const cardActs = legals.filter((a) => a.type === 'playCard');
      if (cardActs.length > 0) {
        // Prefer rich_yield or road_building or guard
        const richYield = cardActs.find((a) => a.cardId.startsWith('rich_yield'));
        if (richYield) {
          return { type: 'playCard', cardId: richYield.cardId, params: { resources: ['stone', 'wheat'] } };
        }
        const tradeDom = cardActs.find((a) => a.cardId.startsWith('trade_dominance'));
        if (tradeDom) {
          return { type: 'playCard', cardId: tradeDom.cardId, params: { resource: 'wheat' } };
        }
        const roadBld = cardActs.find((a) => a.cardId.startsWith('road_building'));
        if (roadBld && player.roadsLeft >= 2) {
          return { type: 'playCard', cardId: roadBld.cardId };
        }
      }
    }

    // 3. Build City (huge VP boost)
    const cityActs = legals.filter((a) => a.type === 'buildCity');
    if (cityActs.length > 0) {
      cityActs.sort((a, b) => intersectionPips(state, b.intersectionId) - intersectionPips(state, a.intersectionId));
      return cityActs[0];
    }

    // 4. Build Settlement
    const settActs = legals.filter((a) => a.type === 'buildSettlement');
    if (settActs.length > 0) {
      settActs.sort((a, b) => intersectionPips(state, b.intersectionId) - intersectionPips(state, a.intersectionId));
      return settActs[0];
    }

    // 5. Buy Breakthrough card
    const buyCardAct = legals.find((a) => a.type === 'buyCard');
    if (buyCardAct && Math.random() < (difficulty === 'hard' ? 0.7 : 0.4)) {
      return buyCardAct;
    }

    // 6. Build Road
    const roadActs = legals.filter((a) => a.type === 'buildRoad');
    if (roadActs.length > 0 && (state.freeRoads > 0 || player.roadsLeft > 0)) {
      if (state.freeRoads > 0 || player.resources.wood >= 2 || player.resources.clay >= 2 || difficulty === 'hard') {
        return roadActs[Math.floor(Math.random() * roadActs.length)];
      }
    }

    // 7. Bank trade if one resource away from a goal
    const tradeActs = legals.filter((a) => a.type === 'bankTrade');
    if (tradeActs.length > 0 && difficulty !== 'easy') {
      // If close to city (needs stone & wheat)
      if (player.citiesLeft > 0 && player.resources.stone >= 2 && player.resources.wheat < 2) {
        const trade = tradeActs.find((t) => t.take === 'wheat');
        if (trade) return trade;
      }
      // If close to settlement
      if (player.settlementsLeft > 0 && player.resources.wheat < 1) {
        const trade = tradeActs.find((t) => t.take === 'wheat');
        if (trade) return trade;
      }
    }

    // Otherwise end turn
    return { type: 'endTurn' };
  }

  return null;
}
