import { applyMove, legalMoves, winnerOf } from './engine.js';

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function minimax(state, aiSeat, maximizing) {
  if (state.winner !== null) {
    return { score: state.winner === aiSeat ? 10 - state.revision : state.revision - 10 };
  }
  if (state.draw) return { score: 0 };
  let best = maximizing ? { score: -Infinity, move: null } : { score: Infinity, move: null };
  for (const move of legalMoves(state)) {
    const result = minimax(applyMove(state, move), aiSeat, !maximizing);
    if (maximizing && result.score > best.score) best = { score: result.score, move };
    if (!maximizing && result.score < best.score) best = { score: result.score, move };
  }
  return best;
}

export function chooseMove(state, difficulty = 'medium') {
  const moves = legalMoves(state);
  if (!moves.length) return null;
  if (difficulty === 'easy') return randomChoice(moves);
  const perfect = minimax(state, state.turn, true).move;
  if (difficulty === 'hard') return perfect ?? randomChoice(moves);
  const winNow = moves.find((move) => winnerOf(applyMove(state, move).board) === state.turn);
  if (winNow !== undefined) return winNow;
  return Math.random() < 0.55 ? perfect : randomChoice(moves);
}
