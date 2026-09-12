// Bank and domestic trading logic for Pioneer

import { INTERSECTIONS } from './board.js';

export function getBankTradeRate(state, seat, resource) {
  let bestRate = 4;

  // Check trading posts owned by this seat
  state.tradingPosts.forEach((post) => {
    const postSlot = state.tradingPostSlots?.[post.postId];
    if (!postSlot) return;

    // Check if player has a settlement or city on either intersection of this post
    const ownsPost = postSlot.intIds.some((intId) => {
      const b = state.intersections[intId];
      return b && b.seat === seat;
    });

    if (ownsPost) {
      if (post.type === 'special' && post.resource === resource) {
        bestRate = Math.min(bestRate, 2);
      } else if (post.type === 'generic') {
        bestRate = Math.min(bestRate, 3);
      }
    }
  });

  return bestRate;
}

export function canBankTrade(state, seat, giveResource, takeResource) {
  if (!giveResource || !takeResource || giveResource === takeResource) return false;
  const player = state.players[seat];
  if (!player) return false;

  const rate = getBankTradeRate(state, seat, giveResource);
  if ((player.resources[giveResource] || 0) < rate) return false;
  if ((state.bank[takeResource] || 0) < 1) return false;

  return true;
}

export function canMakeTradeOffer(state, actorSeat, give, want) {
  if (state.turn !== actorSeat && state.phase !== 'main') return false;
  const player = state.players[actorSeat];
  if (!player) return false;

  // Must give at least 1 card
  const totalGive = Object.values(give || {}).reduce((s, n) => s + (n || 0), 0);
  if (totalGive < 1) return false;

  // Player must possess the cards to give
  for (const [res, count] of Object.entries(give || {})) {
    if ((player.resources[res] || 0) < count) return false;
  }

  // No like-for-like (cannot give wood and want wood)
  for (const res of Object.keys(give || {})) {
    if ((give[res] || 0) > 0 && (want?.[res] || 0) > 0) return false;
  }

  return true;
}

export function canCounterTrade(state, actorSeat, offerId, give, want) {
  const offer = (state.offers || []).find((o) => o.id === offerId && !o.closed);
  if (!offer) return false;
  if (actorSeat === state.turn) return false; // Opponents counter active player's offer

  const player = state.players[actorSeat];
  if (!player) return false;

  const totalGive = Object.values(give || {}).reduce((s, n) => s + (n || 0), 0);
  const totalWant = Object.values(want || {}).reduce((s, n) => s + (n || 0), 0);
  if (totalGive < 1 || totalWant < 1) return false;

  for (const [res, count] of Object.entries(give || {})) {
    if ((player.resources[res] || 0) < count) return false;
  }

  for (const res of Object.keys(give || {})) {
    if ((give[res] || 0) > 0 && (want?.[res] || 0) > 0) return false;
  }

  return true;
}

export function canAcceptTrade(state, actorSeat, offerId) {
  const offer = (state.offers || []).find((o) => o.id === offerId && !o.closed);
  if (!offer) return false;

  // Active player accepts counter-offer OR opponent accepts active player's offer
  let giverSeat;
  let receiverSeat;
  let giverCards;
  let receiverCards;

  if (offer.fromSeat === state.turn) {
    // Active player made offer, actorSeat is opponent accepting it
    if (actorSeat === state.turn) return false;
    giverSeat = offer.fromSeat;
    receiverSeat = actorSeat;
    giverCards = offer.give;
    receiverCards = offer.want;
  } else {
    // Opponent countered, active player is accepting it
    if (actorSeat !== state.turn) return false;
    giverSeat = offer.fromSeat;
    receiverSeat = actorSeat;
    giverCards = offer.give;
    receiverCards = offer.want;
  }

  const pGiver = state.players[giverSeat];
  const pReceiver = state.players[receiverSeat];
  if (!pGiver || !pReceiver) return false;

  for (const [res, count] of Object.entries(giverCards || {})) {
    if ((pGiver.resources[res] || 0) < count) return false;
  }
  for (const [res, count] of Object.entries(receiverCards || {})) {
    if ((pReceiver.resources[res] || 0) < count) return false;
  }

  return true;
}
