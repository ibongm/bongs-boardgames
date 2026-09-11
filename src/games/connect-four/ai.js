import { applyMove, legalMoves } from './engine.js';

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function scoreBoard(state, aiSeat) {
  if (state.winner === aiSeat) return 1000;
  if (state.winner !== null) return -1000;
  return 0;
}

function search(state, aiSeat, depth, maximizing) {
  if (depth === 0 || state.winner !== null || state.draw) {
    return { score: scoreBoard(state, aiSeat), move: null };
  }
  let best = maximizing ? { score: -Infinity, move: null } : { score: Infinity, move: null };
  for (const move of legalMoves(state)) {
    const result = search(applyMove(state, move), aiSeat, depth - 1, !maximizing);
    if (maximizing && result.score > best.score) best = { score: result.score, move };
    if (!maximizing && result.score < best.score) best = { score: result.score, move };
  }
  return best;
}

export function chooseMove(state, difficulty = 'medium') {
  const moves = legalMoves(state);
  if (!moves.length) return null;
  if (difficulty === 'easy') return randomChoice(moves);
  const winNow = moves.find((move) => applyMove(state, move).winner === state.turn);
  if (winNow !== undefined) return winNow;
  const block = moves.find((move) => {
    const opp = { ...state, turn: state.turn === 0 ? 1 : 0 };
    return applyMove(opp, move).winner === opp.turn;
  });
  if (difficulty === 'medium') {
    if (block !== undefined && Math.random() < 0.8) return block;
    if (moves.includes(3) && Math.random() < 0.5) return 3;
    return randomChoice(moves);
  }
  return search(state, state.turn, 4, true).move ?? block ?? randomChoice(moves);
}
