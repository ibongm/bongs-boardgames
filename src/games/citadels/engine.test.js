import { describe, it, expect } from 'vitest';
import * as citadelsEngine from './engine.js';

describe('Citadels engine', () => {
  it('creates valid initial draft state', () => {
    const state = citadelsEngine.createState({ seatCount: 4, seed: 42 });
    expect(state.seatCount).toBe(4);
    expect(state.players).toHaveLength(4);
    expect(state.players[0].gold).toBe(2);
    expect(state.players[0].hand).toHaveLength(4);
    expect(state.phase).toBe('draft');
    expect(state.draftRemaining.length).toBeGreaterThan(0);
  });

  it('redacts hidden information for spectators and opposing players in publicView', () => {
    const state = citadelsEngine.createState({ seatCount: 4, seed: 42 });
    
    // Test spectator view
    const spectatorView = citadelsEngine.publicView(state, 'spectator');
    expect(spectatorView.players[0].hand.every((c) => c === 'hidden')).toBe(true);
    expect(spectatorView.players[1].hand.every((c) => c === 'hidden')).toBe(true);
    expect(spectatorView.draftRemaining.every((c) => c === 'hidden')).toBe(true);
    expect(spectatorView.deck).toBeUndefined();

    // Test player 0 view
    const player0View = citadelsEngine.publicView(state, 0);
    expect(player0View.players[0].hand.every((c) => c !== 'hidden')).toBe(true);
    expect(player0View.players[1].hand.every((c) => c === 'hidden')).toBe(true);
    expect(player0View.deck).toBeUndefined();
  });

  it('correctly scores Haunted Quarter with other unique districts for 5-color bonus', () => {
    const state = citadelsEngine.createState({ seatCount: 4, seed: 42 });
    // City has: noble (manor-1), religious (temple-1), trade (market-1), unique (factory), unique (haunted-quarter)
    // Missing military, but Haunted Quarter should supply military, keeping unique from factory -> 5 colors = +3 bonus
    state.players[0].city = ['manor-1', 'temple-1', 'market-1', 'factory', 'haunted-quarter'];
    const score = citadelsEngine.scoreSeat(state, 0);
    // Manor(3) + Temple(1) + Market(2) + Factory(5) + HauntedQuarter(2) = 13
    // 5-color bonus = +3
    // Total = 16
    expect(score).toBe(16);
  });
});
