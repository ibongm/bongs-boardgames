// Pure game engine for Pioneer

import { HEXES, INTERSECTIONS, PATHS, TRADING_POST_SLOTS } from './board.js';
import { BALANCED_HEX_SPECS, BALANCED_TRADING_POST_SPECS, TERRAIN_TO_RESOURCE } from './maps/balanced.js';
import { createRandomMap } from './maps/random.js';
import { applyBalancedStarts, applySetupAction } from './setup.js';
import { rollDice, calculateProduction } from './production.js';
import {
  COSTS,
  MAX_PIECES,
  canAfford,
  deductCost,
  canBuildRoad,
  canBuildSettlement,
  canBuildCity,
  canBuyCard,
} from './build.js';
import { calculateLongestRoute, updateLongestRoute } from './route.js';
import {
  createBreakthroughDeck,
  cardTypeFromId,
  getCardDef,
} from './cards.js';
import {
  getPendingDiscardSeats,
  getEligibleStealSeats,
  pickRandomResource,
  updateGrandGarrison,
} from './bandit.js';
import {
  canBankTrade,
  getBankTradeRate,
  canMakeTradeOffer,
  canCounterTrade,
  canAcceptTrade,
} from './trade.js';
import {
  calculatePublicVP,
  calculateHiddenVP,
  calculateTotalVP,
  canDeclareWin,
} from './victory.js';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createRng(seed) {
  let s = (Number(seed) >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createState(options = {}) {
  const seatCount = Math.min(4, Math.max(3, Number(options.seatCount) || 4));
  const mapId = options.mapId || options.map || 'map_balanced';
  const rand = createRng(options.seed || Date.now());

  const colors = options.colors || ['#c2410c', '#1d4ed8', '#d97706', '#15803d'];
  const symbols = ['●', '■', '▲', '◆'];
  const names = ['Amber', 'Sapphire', 'Topaz', 'Emerald'];

  // Initialize players
  const players = [];
  for (let s = 0; s < seatCount; s += 1) {
    players.push({
      seat: s,
      name: options.names?.[s] || (s === 0 ? 'You' : `Bot ${s}`),
      color: colors[s % colors.length],
      symbol: symbols[s % symbols.length],
      resources: { wood: 0, clay: 0, sheep: 0, wheat: 0, stone: 0 },
      hiddenCards: [],
      cardsBoughtThisTurn: [],
      playedGuards: 0,
      roadsLeft: MAX_PIECES.roads,
      settlementsLeft: MAX_PIECES.settlements,
      citiesLeft: MAX_PIECES.cities,
      routeLength: 0,
      publicVP: 0,
      victoryPoints: 0,
    });
  }

  // Bank: 19 of each resource card (95 total)
  const bank = { wood: 19, clay: 19, sheep: 19, wheat: 19, stone: 19 };

  let hexes;
  let tradingPosts;
  let banditHexId;

  if (mapId === 'map_shuffled') {
    const generated = createRandomMap(rand);
    hexes = generated.hexSpecs.map((spec, i) => ({
      id: `hex_${i}`,
      terrain: spec.terrain,
      number: spec.number,
    }));
    tradingPosts = generated.tradingPostSpecs;
    banditHexId = generated.banditHexId;
  } else {
    // Balanced Isle
    hexes = BALANCED_HEX_SPECS.map((spec, i) => ({
      id: `hex_${i}`,
      terrain: spec.terrain,
      number: spec.number,
    }));
    tradingPosts = BALANCED_TRADING_POST_SPECS;
    banditHexId = 'hex_9'; // Desert at center
  }

  const state = {
    revision: 1,
    seatCount,
    mapId,
    phase: mapId === 'map_shuffled' ? 'setup' : 'rolling',
    setupStep: mapId === 'map_shuffled' ? 0 : null,
    turn: 0,
    actorSeat: 0,
    dice: null,
    hexes,
    intersections: {}, // intId -> { seat, type }
    paths: {}, // pathId -> { seat }
    tradingPosts,
    tradingPostSlots: Object.fromEntries(TRADING_POST_SLOTS.map((s) => [s.id, s])),
    banditHexId,
    banditReturnPhase: 'main',
    bank,
    deck: createBreakthroughDeck(rand),
    discardPile: [],
    discardsDone: {},
    playedCardThisTurn: false,
    freeRoads: 0,
    longestRouteSeat: null,
    grandGarrisonSeat: null,
    offers: [],
    log: [{ text: `Match started on ${mapId === 'map_shuffled' ? 'Random Isle' : 'Balanced Isle'}.` }],
    winner: null,
    draw: false,
    players,
  };

  if (mapId !== 'map_shuffled') {
    applyBalancedStarts(state);
  }

  // Update initial VP and routes
  updateLongestRoute(state);
  state.players.forEach((p, s) => {
    p.publicVP = calculatePublicVP(state, s);
    p.victoryPoints = calculateTotalVP(state, s);
  });

  return state;
}

export function applyAction(stateIn, action, actorSeatIn) {
  const state = clone(stateIn);
  if (state.phase === 'gameover' || state.winner !== null) {
    throw new Error('Game is over');
  }

  const actorSeat = actorSeatIn !== undefined && actorSeatIn !== null ? actorSeatIn : state.actorSeat;
  const player = state.players[actorSeat];
  if (!player) throw new Error('Invalid actor seat');

  switch (action.type) {
    case 'placeSetup': {
      if (state.phase !== 'setup') throw new Error('Not in setup phase');
      if (state.turn !== actorSeat) throw new Error('Not your turn to place setup');
      applySetupAction(state, action, actorSeat);
      state.log.push({
        text: `${player.name} placed a settlement and road.`,
      });
      break;
    }

    case 'roll': {
      if (state.phase !== 'rolling') throw new Error('Not rolling phase');
      if (state.turn !== actorSeat) throw new Error('Not your turn to roll');

      const dice = rollDice();
      state.dice = dice;
      const total = dice[0] + dice[1];
      state.log.push({
        text: `${player.name} rolled ${total} (${dice[0]} + ${dice[1]}).`,
      });

      if (total === 7) {
        state.discardsDone = {};
        const pending = getPendingDiscardSeats(state);
        if (pending.length > 0) {
          state.phase = 'discarding';
          state.actorSeat = pending[0].seat;
          state.log.push({
            text: `A 7 was rolled! ${pending.map((p) => state.players[p.seat].name).join(', ')} must discard half their cards.`,
          });
        } else {
          state.phase = 'bandit';
          state.actorSeat = state.turn;
          state.banditReturnPhase = 'main';
        }
      } else {
        const prod = calculateProduction(state, dice);
        const logLines = [];

        Object.entries(prod.yields).forEach(([seatStr, resMap]) => {
          const s = Number(seatStr);
          const p = state.players[s];
          const items = [];
          Object.entries(resMap).forEach(([res, amt]) => {
            if (amt > 0) {
              p.resources[res] = (p.resources[res] || 0) + amt;
              state.bank[res] = Math.max(0, state.bank[res] - amt);
              items.push(`${amt} ${res}`);
            }
          });
          if (items.length > 0) {
            logLines.push(`${p.name} collected ${items.join(', ')}`);
          }
        });

        if (logLines.length > 0) {
          state.log.push({ text: logLines.join('. ') + '.' });
        }
        if (prod.blockedHexIds.length > 0) {
          state.log.push({ text: 'Bandit blocked production on its hex.' });
        }

        state.phase = 'main';
      }
      break;
    }

    case 'discard': {
      if (state.phase !== 'discarding') throw new Error('Not in discarding phase');
      const totalInHand = Object.values(player.resources || {}).reduce((s, n) => s + (n || 0), 0);
      const required = Math.floor(totalInHand / 2);
      const given = action.resources || {};
      const totalGiven = Object.values(given).reduce((s, n) => s + (n || 0), 0);

      if (totalGiven !== required) {
        throw new Error(`Must discard exactly ${required} cards`);
      }

      // Check player has these cards
      for (const [res, count] of Object.entries(given)) {
        if ((player.resources[res] || 0) < count) {
          throw new Error(`Cannot discard more ${res} than owned`);
        }
      }

      // Deduct and return to bank
      for (const [res, count] of Object.entries(given)) {
        player.resources[res] -= count;
        state.bank[res] += count;
      }

      state.discardsDone[actorSeat] = true;
      state.log.push({
        text: `${player.name} discarded ${required} card${required === 1 ? '' : 's'}.`,
      });

      // Check if all pending discards are finished
      const remaining = getPendingDiscardSeats(state);
      if (remaining.length === 0) {
        state.phase = 'bandit';
        state.actorSeat = state.turn;
        state.banditReturnPhase = 'main';
      } else {
        state.actorSeat = remaining[0].seat;
      }
      break;
    }

    case 'moveBandit': {
      if (state.phase !== 'bandit') throw new Error('Not in bandit phase');
      if (state.turn !== actorSeat) throw new Error('Not active player');

      const { hexId, stealFromSeat } = action;
      if (!hexId || hexId === state.banditHexId) {
        throw new Error('Bandit must move to a different hex');
      }
      if (!HEXES[hexId]) throw new Error('Invalid hex');

      state.banditHexId = hexId;
      state.log.push({
        text: `${player.name} moved the Bandit.`,
      });

      if (stealFromSeat !== null && stealFromSeat !== undefined) {
        const eligible = getEligibleStealSeats(state, hexId, actorSeat);
        if (!eligible.includes(stealFromSeat)) {
          throw new Error('Target seat is not eligible for steal');
        }

        const victim = state.players[stealFromSeat];
        const stolenRes = pickRandomResource(victim.resources);
        if (stolenRes) {
          victim.resources[stolenRes] -= 1;
          player.resources[stolenRes] = (player.resources[stolenRes] || 0) + 1;
          state.log.push({
            text: `${player.name} stole a card from ${victim.name}.`,
          });
        }
      }

      state.phase = state.banditReturnPhase || 'main';
      break;
    }

    case 'playCard': {
      if (state.turn !== actorSeat) throw new Error('Can only play cards on your turn');
      const { cardId, params } = action;
      if (!player.hiddenCards.includes(cardId)) {
        throw new Error('Player does not hold that card');
      }
      if (player.cardsBoughtThisTurn.includes(cardId)) {
        const def = getCardDef(cardId);
        if (!def?.isCharter) {
          throw new Error('Cannot play a Breakthrough bought on the same turn');
        }
      }

      const cardType = cardTypeFromId(cardId);

      if (cardType === 'guard') {
        if (state.playedCardThisTurn) throw new Error('Already played a Breakthrough this turn');
        player.hiddenCards = player.hiddenCards.filter((id) => id !== cardId);
        player.playedGuards += 1;
        state.discardPile.push(cardId);
        state.playedCardThisTurn = true;

        const awardRes = updateGrandGarrison(state);
        state.log.push({
          text: `${player.name} played a Guard! (Total: ${player.playedGuards})`,
        });
        if (awardRes.changed) {
          const newHolder = state.players[awardRes.current];
          state.log.push({
            text: `${newHolder.name} claimed Grand Garrison!`,
          });
        }

        // Trigger bandit movement
        state.banditReturnPhase = state.phase; // return to 'rolling' or 'main'
        state.phase = 'bandit';
        break;
      }

      if (state.phase !== 'main') throw new Error('Cannot play this card right now');
      if (state.playedCardThisTurn) throw new Error('Already played a Breakthrough this turn');

      if (cardType === 'rich_yield') {
        const picked = params?.resources || [];
        if (picked.length !== 2) throw new Error('Rich Yield requires 2 resources');
        picked.forEach((res) => {
          if (state.bank[res] > 0) {
            state.bank[res] -= 1;
            player.resources[res] = (player.resources[res] || 0) + 1;
          }
        });
        player.hiddenCards = player.hiddenCards.filter((id) => id !== cardId);
        state.discardPile.push(cardId);
        state.playedCardThisTurn = true;
        state.log.push({
          text: `${player.name} played Rich Yield and took 2 resources from the bank.`,
        });
      } else if (cardType === 'trade_dominance') {
        const named = params?.resource;
        if (!named || !state.bank[named] === undefined) throw new Error('Must name a valid resource');
        let totalTaken = 0;
        state.players.forEach((other, s) => {
          if (s !== actorSeat) {
            const count = other.resources[named] || 0;
            if (count > 0) {
              other.resources[named] = 0;
              player.resources[named] = (player.resources[named] || 0) + count;
              totalTaken += count;
            }
          }
        });
        player.hiddenCards = player.hiddenCards.filter((id) => id !== cardId);
        state.discardPile.push(cardId);
        state.playedCardThisTurn = true;
        state.log.push({
          text: `${player.name} played Trade Dominance on ${named}, collecting ${totalTaken} card${totalTaken === 1 ? '' : 's'}.`,
        });
      } else if (cardType === 'road_building') {
        player.hiddenCards = player.hiddenCards.filter((id) => id !== cardId);
        state.discardPile.push(cardId);
        state.playedCardThisTurn = true;
        state.freeRoads = 2;
        state.log.push({
          text: `${player.name} played Road Building (2 free roads).`,
        });
      }
      break;
    }

    case 'buildRoad': {
      if (state.turn !== actorSeat) throw new Error('Not your turn to build');
      if (state.phase !== 'main') throw new Error('Can only build in main phase');
      const isFree = state.freeRoads > 0;
      if (!canBuildRoad(state, actorSeat, action.pathId, isFree)) {
        throw new Error('Illegal road placement');
      }

      if (isFree) {
        state.freeRoads -= 1;
      } else {
        player.resources = deductCost(player.resources, COSTS.road);
        state.bank.wood += COSTS.road.wood;
        state.bank.clay += COSTS.road.clay;
      }

      state.paths[action.pathId] = { seat: actorSeat };
      player.roadsLeft -= 1;

      const routeRes = updateLongestRoute(state);
      state.log.push({ text: `${player.name} built a road.` });
      if (routeRes.changed) {
        if (routeRes.current !== null) {
          state.log.push({ text: `${state.players[routeRes.current].name} claimed Longest Route!` });
        } else {
          state.log.push({ text: 'Longest Route was tied/broken and returned to the board.' });
        }
      }
      break;
    }

    case 'buildSettlement': {
      if (state.turn !== actorSeat) throw new Error('Not your turn to build');
      if (state.phase !== 'main') throw new Error('Can only build in main phase');
      if (!canBuildSettlement(state, actorSeat, action.intersectionId, false)) {
        throw new Error('Illegal settlement placement');
      }

      player.resources = deductCost(player.resources, COSTS.settlement);
      state.bank.wood += COSTS.settlement.wood;
      state.bank.clay += COSTS.settlement.clay;
      state.bank.sheep += COSTS.settlement.sheep;
      state.bank.wheat += COSTS.settlement.wheat;

      state.intersections[action.intersectionId] = { seat: actorSeat, type: 'settlement' };
      player.settlementsLeft -= 1;

      // May split an opponent's road!
      const routeRes = updateLongestRoute(state);
      state.log.push({ text: `${player.name} built a settlement.` });
      if (routeRes.changed) {
        if (routeRes.current !== null) {
          state.log.push({ text: `${state.players[routeRes.current].name} claimed Longest Route!` });
        } else {
          state.log.push({ text: 'Longest Route was tied/broken and returned to the board.' });
        }
      }
      break;
    }

    case 'buildCity': {
      if (state.turn !== actorSeat) throw new Error('Not your turn to build');
      if (state.phase !== 'main') throw new Error('Can only build in main phase');
      if (!canBuildCity(state, actorSeat, action.intersectionId)) {
        throw new Error('Illegal city upgrade');
      }

      player.resources = deductCost(player.resources, COSTS.city);
      state.bank.stone += COSTS.city.stone;
      state.bank.wheat += COSTS.city.wheat;

      state.intersections[action.intersectionId].type = 'city';
      player.citiesLeft -= 1;
      player.settlementsLeft += 1; // refunded to stock

      state.log.push({ text: `${player.name} upgraded a settlement to a city.` });
      break;
    }

    case 'buyCard': {
      if (state.turn !== actorSeat) throw new Error('Not your turn');
      if (state.phase !== 'main') throw new Error('Can only buy in main phase');
      if (!canBuyCard(state, actorSeat)) throw new Error('Cannot buy Breakthrough card');

      player.resources = deductCost(player.resources, COSTS.card);
      state.bank.stone += COSTS.card.stone;
      state.bank.sheep += COSTS.card.sheep;
      state.bank.wheat += COSTS.card.wheat;

      const drawnCard = state.deck.shift();
      player.hiddenCards.push(drawnCard);
      player.cardsBoughtThisTurn.push(drawnCard);

      state.log.push({ text: `${player.name} bought a Breakthrough card.` });
      break;
    }

    case 'bankTrade': {
      if (state.turn !== actorSeat) throw new Error('Not your turn to trade');
      if (state.phase !== 'main') throw new Error('Can only trade in main phase');
      const { give, take } = action;
      if (!canBankTrade(state, actorSeat, give, take)) throw new Error('Illegal bank trade');

      const rate = getBankTradeRate(state, actorSeat, give);
      player.resources[give] -= rate;
      state.bank[give] += rate;
      state.bank[take] -= 1;
      player.resources[take] = (player.resources[take] || 0) + 1;

      state.log.push({
        text: `${player.name} traded ${rate} ${give} with the bank for 1 ${take}.`,
      });
      break;
    }

    case 'offerTrade': {
      const { give, want } = action;
      if (!canMakeTradeOffer(state, actorSeat, give, want)) throw new Error('Illegal trade offer');
      const offerId = `offer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      state.offers.push({
        id: offerId,
        fromSeat: actorSeat,
        give,
        want,
        closed: false,
      });
      break;
    }

    case 'counterTrade': {
      const { offerId, give, want } = action;
      if (!canCounterTrade(state, actorSeat, offerId, give, want)) throw new Error('Illegal counter offer');
      const counterId = `counter_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      state.offers.push({
        id: counterId,
        parentOfferId: offerId,
        fromSeat: actorSeat,
        give,
        want,
        closed: false,
      });
      break;
    }

    case 'acceptTrade': {
      const { offerId } = action;
      if (!canAcceptTrade(state, actorSeat, offerId)) throw new Error('Illegal trade acceptance');
      const offer = state.offers.find((o) => o.id === offerId);
      const isOfferFromActive = offer.fromSeat === state.turn;
      const giverSeat = isOfferFromActive ? offer.fromSeat : actorSeat;
      const receiverSeat = isOfferFromActive ? actorSeat : offer.fromSeat;

      const pGiver = state.players[giverSeat];
      const pReceiver = state.players[receiverSeat];

      // Atomic transfer
      Object.entries(offer.give).forEach(([res, amt]) => {
        pGiver.resources[res] -= amt;
        pReceiver.resources[res] = (pReceiver.resources[res] || 0) + amt;
      });
      Object.entries(offer.want).forEach(([res, amt]) => {
        pReceiver.resources[res] -= amt;
        pGiver.resources[res] = (pGiver.resources[res] || 0) + amt;
      });

      offer.closed = true;
      state.offers = []; // close active trade window on deal

      const giveStr = Object.entries(offer.give).map(([r, n]) => `${n} ${r}`).join(', ');
      const wantStr = Object.entries(offer.want).map(([r, n]) => `${n} ${r}`).join(', ');
      state.log.push({
        text: `${pGiver.name} traded ${giveStr} to ${pReceiver.name} for ${wantStr}.`,
      });
      break;
    }

    case 'closeTrade': {
      state.offers = [];
      break;
    }

    case 'declareWin': {
      if (!canDeclareWin(state, actorSeat)) throw new Error('Cannot declare win');
      state.phase = 'gameover';
      state.winner = actorSeat;
      state.log.push({
        text: `Pioneer - ${player.name} reaches 10 points and wins the island!`,
      });
      break;
    }

    case 'endTurn': {
      if (state.turn !== actorSeat) throw new Error('Not your turn to end');
      if (state.phase !== 'main') throw new Error('Cannot end turn in current phase');

      // Auto declare win if player reached >= 10 points
      if (calculateTotalVP(state, actorSeat) >= 10) {
        state.phase = 'gameover';
        state.winner = actorSeat;
        state.log.push({
          text: `Pioneer - ${player.name} reaches 10 points and wins the island!`,
        });
        break;
      }

      // Reset turn variables
      player.cardsBoughtThisTurn = [];
      state.playedCardThisTurn = false;
      state.freeRoads = 0;
      state.offers = [];

      // Move to next player
      state.turn = (state.turn + 1) % state.seatCount;
      state.actorSeat = state.turn;
      state.phase = 'rolling';
      break;
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }

  // Update VP and routes after any action
  state.players.forEach((p, s) => {
    p.publicVP = calculatePublicVP(state, s);
    p.victoryPoints = calculateTotalVP(state, s);
  });

  state.revision = (state.revision || 1) + 1;
  return state;
}

export function legalActions(state, actorSeat) {
  if (state.phase === 'gameover' || state.winner !== null) return [];
  const actions = [];
  const player = state.players[actorSeat];
  if (!player) return actions;

  if (state.phase === 'setup') {
    if (state.turn === actorSeat) {
      // Find legal settlement intersections and connected paths
      Object.keys(INTERSECTIONS).forEach((intId) => {
        if (canBuildSettlement(state, actorSeat, intId, true)) {
          const validPaths = INTERSECTIONS[intId].pathIds.filter((pId) => !state.paths[pId]);
          validPaths.forEach((pathId) => {
            actions.push({ type: 'placeSetup', intersectionId: intId, pathId });
          });
        }
      });
    }
    return actions;
  }

  if (state.phase === 'discarding') {
    const total = Object.values(player.resources || {}).reduce((s, n) => s + (n || 0), 0);
    const required = Math.floor(total / 2);
    if (required > 0 && !state.discardsDone?.[actorSeat]) {
      // Return a helper discard action placeholder
      actions.push({ type: 'discard', required });
    }
    return actions;
  }

  if (state.phase === 'bandit') {
    if (state.turn === actorSeat) {
      state.hexes.forEach((hex) => {
        if (hex.id !== state.banditHexId) {
          const eligibleSeats = getEligibleStealSeats(state, hex.id, actorSeat);
          if (eligibleSeats.length > 0) {
            eligibleSeats.forEach((seat) => {
              actions.push({ type: 'moveBandit', hexId: hex.id, stealFromSeat: seat });
            });
          } else {
            actions.push({ type: 'moveBandit', hexId: hex.id, stealFromSeat: null });
          }
        }
      });
    }
    return actions;
  }

  if (state.phase === 'rolling') {
    if (state.turn === actorSeat) {
      actions.push({ type: 'roll' });
      // Can play Guard before roll
      if (!state.playedCardThisTurn) {
        player.hiddenCards.forEach((cId) => {
          if (cardTypeFromId(cId) === 'guard' && !player.cardsBoughtThisTurn.includes(cId)) {
            actions.push({ type: 'playCard', cardId: cId });
          }
        });
      }
    }
    return actions;
  }

  if (state.phase === 'main') {
    if (state.turn === actorSeat) {
      // Can declare win?
      if (canDeclareWin(state, actorSeat)) {
        actions.push({ type: 'declareWin' });
      }

      // Can build road?
      if (player.roadsLeft > 0 && (state.freeRoads > 0 || canAfford(player.resources, COSTS.road))) {
        Object.keys(PATHS).forEach((pathId) => {
          if (canBuildRoad(state, actorSeat, pathId, state.freeRoads > 0)) {
            actions.push({ type: 'buildRoad', pathId });
          }
        });
      }

      // Can build settlement?
      if (player.settlementsLeft > 0 && canAfford(player.resources, COSTS.settlement)) {
        Object.keys(INTERSECTIONS).forEach((intId) => {
          if (canBuildSettlement(state, actorSeat, intId, false)) {
            actions.push({ type: 'buildSettlement', intersectionId: intId });
          }
        });
      }

      // Can build city?
      if (player.citiesLeft > 0 && canAfford(player.resources, COSTS.city)) {
        Object.keys(state.intersections).forEach((intId) => {
          if (canBuildCity(state, actorSeat, intId)) {
            actions.push({ type: 'buildCity', intersectionId: intId });
          }
        });
      }

      // Can buy card?
      if (canBuyCard(state, actorSeat)) {
        actions.push({ type: 'buyCard' });
      }

      // Can play cards?
      if (!state.playedCardThisTurn) {
        player.hiddenCards.forEach((cId) => {
          if (!player.cardsBoughtThisTurn.includes(cId)) {
            const def = getCardDef(cId);
            if (def && !def.isCharter) {
              actions.push({ type: 'playCard', cardId: cId });
            }
          }
        });
      }

      // Bank trades
      const resTypes = ['wood', 'clay', 'sheep', 'wheat', 'stone'];
      resTypes.forEach((give) => {
        resTypes.forEach((take) => {
          if (canBankTrade(state, actorSeat, give, take)) {
            actions.push({ type: 'bankTrade', give, take });
          }
        });
      });

      actions.push({ type: 'endTurn' });
    }
  }

  return actions;
}

export function publicView(state, viewerSeat) {
  const view = clone(state);

  // Redact deck order
  view.deckCount = (state.deck || []).length;
  delete view.deck;

  // Redact player cards
  view.players = state.players.map((p, seat) => {
    const isViewer = viewerSeat === seat;
    const totalCards = Object.values(p.resources || {}).reduce((s, n) => s + (n || 0), 0);

    return {
      ...p,
      resources: isViewer ? p.resources : { cardCount: totalCards },
      cardCount: totalCards,
      hiddenCards: isViewer ? p.hiddenCards : p.hiddenCards.map(() => 'hidden'),
      breakthroughCount: (p.hiddenCards || []).length,
    };
  });

  return view;
}

export function status(state) {
  return {
    over: state.phase === 'gameover' || state.winner !== null,
    winner: state.winner,
    draw: false,
    turn: state.actorSeat !== undefined && state.actorSeat !== null ? state.actorSeat : state.turn,
    phase: state.phase,
  };
}

export function applyMove(state, move) {
  if (typeof move === 'object' && move !== null) {
    const actor = move.actorSeat !== undefined ? move.actorSeat : state.actorSeat ?? state.turn;
    return applyAction(state, move, actor);
  }
  throw new Error('Pioneer requires action objects');
}
