import { describe, it, expect } from 'vitest';
import * as c4Engine from './engine.js';
import { meta } from './meta.js';

describe('Connect Four engine', () => {
  it('initializes empty board with correct dimensions', () => {
    const state = c4Engine.createState();
    expect(state.board).toHaveLength(meta.rows);
    expect(state.board[0]).toHaveLength(meta.cols);
    expect(state.board.every((row) => row.every((cell) => cell === null))).toBe(true);
    expect(state.turn).toBe(0);
    expect(state.winner).toBeNull();
  });

  it('drops discs to the bottom row', () => {
    let state = c4Engine.createState();
    state = c4Engine.applyMove(state, 3);
    expect(state.board[meta.rows - 1][3]).toBe(0);
    expect(state.turn).toBe(1);
    state = c4Engine.applyMove(state, 3);
    expect(state.board[meta.rows - 2][3]).toBe(1);
    expect(state.turn).toBe(0);
  });

  it('detects a vertical four-in-a-row win', () => {
    let state = c4Engine.createState();
    // 0: col 2, 1: col 3 (repeat 4 times)
    for (let i = 0; i < 3; i++) {
      state = c4Engine.applyMove(state, 2); // 0
      state = c4Engine.applyMove(state, 3); // 1
    }
    state = c4Engine.applyMove(state, 2); // 0 gets 4 in col 2
    expect(state.winner).toBe(0);
    expect(c4Engine.status(state).over).toBe(true);
    expect(c4Engine.legalMoves(state)).toEqual([]);
  });

  it('detects a horizontal four-in-a-row win', () => {
    let state = c4Engine.createState();
    // 0: 0, 1: 0, 0: 1, 1: 1, 0: 2, 1: 2, 0: 3
    for (let c = 0; c < 3; c++) {
      state = c4Engine.applyMove(state, c); // 0 at row 5
      state = c4Engine.applyMove(state, c); // 1 at row 4
    }
    state = c4Engine.applyMove(state, 3); // 0 at row 5, col 3
    expect(state.winner).toBe(0);
    expect(c4Engine.status(state).over).toBe(true);
  });

  it('detects a diagonal win', () => {
    let state = c4Engine.createState();
    // Col 0: 0
    // Col 1: 1, 0
    // Col 2: 1, 1, 0
    // Col 3: 1, 1, 1, 0
    const moves = [
      0, // 0: (5,0)
      1, // 1: (5,1)
      1, // 0: (4,1)
      2, // 1: (5,2)
      2, // 0: (4,2)
      3, // 1: (5,3)
      2, // 0: (3,2)
      3, // 1: (4,3)
      3, // 0: (3,3)
      0, // 1: (4,0)
      3, // 0: (2,3) -> diagonal from (5,0), (4,1), (3,2), (2,3)
    ];
    for (const m of moves) {
      state = c4Engine.applyMove(state, m);
    }
    expect(state.winner).toBe(0);
    expect(c4Engine.status(state).over).toBe(true);
  });
});
