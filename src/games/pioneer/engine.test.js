import { describe, it, expect } from 'vitest';
import * as pioneerEngine from './engine.js';

describe('Pioneer engine', () => {
  it('creates balanced island state with correct pieces and starting buildings', () => {
    const state = pioneerEngine.createState({ seatCount: 4, mapId: 'map_balanced' });
    expect(state.players).toHaveLength(4);
    expect(state.phase).toBe('rolling');
    expect(state.turn).toBe(0);
    // Balanced isle starts with 2 settlements and 2 roads per player
    expect(state.players[0].settlementsLeft).toBe(3); // 5 - 2
    expect(state.players[0].roadsLeft).toBe(13); // 15 - 2
    expect(state.players[0].publicVP).toBe(2);
  });

  it('supports domestic trading: player offers, opponent accepts', () => {
    let state = pioneerEngine.createState({ seatCount: 4, mapId: 'map_balanced' });
    state.phase = 'main';
    state.turn = 0;
    state.actorSeat = 0;

    // Give player 0 wood, player 1 clay
    state.players[0].resources = { wood: 2, clay: 0, sheep: 0, wheat: 0, stone: 0 };
    state.players[1].resources = { wood: 0, clay: 2, sheep: 0, wheat: 0, stone: 0 };

    // Player 0 offers 1 wood for 1 clay
    state = pioneerEngine.applyMove(state, {
      type: 'offerTrade',
      actorSeat: 0,
      give: { wood: 1 },
      want: { clay: 1 },
    });

    expect(state.offers).toHaveLength(1);
    const offerId = state.offers[0].id;
    expect(state.offers[0].fromSeat).toBe(0);

    // Player 1 accepts the offer
    state = pioneerEngine.applyMove(state, {
      type: 'acceptTrade',
      offerId,
      actorSeat: 1,
    });

    // Verify atomic resource exchange
    expect(state.players[0].resources.wood).toBe(1);
    expect(state.players[0].resources.clay).toBe(1);
    expect(state.players[1].resources.wood).toBe(1);
    expect(state.players[1].resources.clay).toBe(1);
    expect(state.offers).toHaveLength(0); // Cleared on acceptance
  });

  it('supports domestic trading: opponent counters, active player accepts counter', () => {
    let state = pioneerEngine.createState({ seatCount: 4, mapId: 'map_balanced' });
    state.phase = 'main';
    state.turn = 0;
    state.actorSeat = 0;

    state.players[0].resources = { wood: 2, clay: 0, sheep: 2, wheat: 0, stone: 0 };
    state.players[1].resources = { wood: 0, clay: 2, sheep: 0, wheat: 0, stone: 0 };

    // Player 0 offers 1 wood for 2 clay
    state = pioneerEngine.applyMove(state, {
      type: 'offerTrade',
      actorSeat: 0,
      give: { wood: 1 },
      want: { clay: 2 },
    });

    const offerId = state.offers[0].id;

    // Player 1 counters: offer 1 clay for 1 sheep
    state = pioneerEngine.applyMove(state, {
      type: 'counterTrade',
      offerId,
      actorSeat: 1,
      give: { clay: 1 },
      want: { sheep: 1 },
    });

    expect(state.offers).toHaveLength(2);
    const counterId = state.offers[1].id;
    expect(state.offers[1].fromSeat).toBe(1);

    // Active player (0) accepts Player 1's counter-offer
    state = pioneerEngine.applyMove(state, {
      type: 'acceptTrade',
      offerId: counterId,
      actorSeat: 0,
    });

    expect(state.players[0].resources.sheep).toBe(1);
    expect(state.players[0].resources.clay).toBe(1);
    expect(state.players[1].resources.clay).toBe(1);
    expect(state.players[1].resources.sheep).toBe(1);
  });

  it('allows bot to evaluate and accept human trade offers', async () => {
    const { evaluateTradeOffer } = await import('./ai.js');
    const state = pioneerEngine.createState({ seatCount: 4, mapId: 'map_balanced' });
    state.players[1].resources = { wood: 0, clay: 3, sheep: 0, wheat: 0, stone: 0 };
    const offer = {
      id: 'offer_123',
      fromSeat: 0,
      give: { wood: 1 },
      want: { clay: 1 },
      closed: false,
    };
    const accept = evaluateTradeOffer(state, 1, offer);
    expect(accept).not.toBeNull();
    expect(accept.type).toBe('acceptTrade');
    expect(accept.actorSeat).toBe(1);
  });
});
