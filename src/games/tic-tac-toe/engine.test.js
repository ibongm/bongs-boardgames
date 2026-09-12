import { describe, it, expect } from 'vitest';
import * as tttEngine from './engine.js';

describe('Tic-Tac-Toe engine', () => {
  it('creates clean initial state', () => {
    const state = tttEngine.createState();
    expect(state.board).toHaveLength(9);
    expect(state.board.every((c) => c === null)).toBe(true);
    expect(state.turn).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.draw).toBe(false);
  });

  it('allows legal moves and alternates turns', () => {
    let state = tttEngine.createState();
    state = tttEngine.applyMove(state, 4);
    expect(state.board[4]).toBe(0);
    expect(state.turn).toBe(1);
    state = tttEngine.applyMove(state, 0);
    expect(state.board[0]).toBe(1);
    expect(state.turn).toBe(0);
  });

  it('rejects illegal moves', () => {
    let state = tttEngine.createState();
    state = tttEngine.applyMove(state, 4);
    expect(() => tttEngine.applyMove(state, 4)).toThrow('Illegal move');
  });

  it('detects a row win', () => {
    let state = tttEngine.createState();
    state = tttEngine.applyMove(state, 0);
    state = tttEngine.applyMove(state, 3);
    state = tttEngine.applyMove(state, 1);
    state = tttEngine.applyMove(state, 4);
    state = tttEngine.applyMove(state, 2);
    expect(state.winner).toBe(0);
    expect(tttEngine.status(state).over).toBe(true);
    expect(tttEngine.legalMoves(state)).toEqual([]);
  });

  it('detects a draw', () => {
    let state = tttEngine.createState();
    const sequence = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const move of sequence) {
      state = tttEngine.applyMove(state, move);
    }
    expect(state.winner).toBeNull();
    expect(state.draw).toBe(true);
    expect(tttEngine.status(state).over).toBe(true);
  });
});
