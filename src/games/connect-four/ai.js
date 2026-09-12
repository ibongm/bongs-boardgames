import { applyMove, legalMoves } from './engine.js';

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function evaluateWindow(window, aiSeat, oppSeat) {
  let score = 0;
  let aiCount = 0;
  let oppCount = 0;
  let emptyCount = 0;

  for (let i = 0; i < 4; i++) {
    const val = window[i];
    if (val === aiSeat) aiCount++;
    else if (val === oppSeat) oppCount++;
    else emptyCount++;
  }

  if (aiCount === 4) return 10000;
  if (oppCount === 4) return -10000;

  if (aiCount === 3 && emptyCount === 1) score += 50;
  else if (aiCount === 2 && emptyCount === 2) score += 10;

  if (oppCount === 3 && emptyCount === 1) score -= 50;
  else if (oppCount === 2 && emptyCount === 2) score -= 10;

  return score;
}

function scoreBoard(state, aiSeat) {
  if (state.winner === aiSeat) return 10000;
  if (state.winner !== null) return -10000;
  if (state.draw) return 0;

  const oppSeat = aiSeat === 0 ? 1 : 0;
  const board = state.board;
  let score = 0;

  // Center column preference
  const centerCol = 3;
  for (let r = 0; r < 6; r++) {
    if (board[r][centerCol] === aiSeat) score += 4;
    else if (board[r][centerCol] === oppSeat) score -= 4;
    if (board[r][2] === aiSeat) score += 2;
    else if (board[r][2] === oppSeat) score -= 2;
    if (board[r][4] === aiSeat) score += 2;
    else if (board[r][4] === oppSeat) score -= 2;
  }

  // Horizontal windows
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
      score += evaluateWindow(window, aiSeat, oppSeat);
    }
  }

  // Vertical windows
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 3; r++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += evaluateWindow(window, aiSeat, oppSeat);
    }
  }

  // Diagonal / (positive slope)
  for (let r = 3; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      const window = [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]];
      score += evaluateWindow(window, aiSeat, oppSeat);
    }
  }

  // Diagonal \ (negative slope)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
      score += evaluateWindow(window, aiSeat, oppSeat);
    }
  }

  return score;
}

function search(state, aiSeat, depth, alpha = -Infinity, beta = Infinity, maximizing = true) {
  if (depth === 0 || state.winner !== null || state.draw) {
    return { score: scoreBoard(state, aiSeat), move: null };
  }
  const moves = legalMoves(state);
  const centerOrder = [3, 2, 4, 1, 5, 0, 6];
  moves.sort((a, b) => centerOrder.indexOf(a) - centerOrder.indexOf(b));

  let bestMove = moves[0] ?? null;

  if (maximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const result = search(nextState, aiSeat, depth - 1, alpha, beta, false);
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const result = search(nextState, aiSeat, depth - 1, alpha, beta, true);
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, minScore);
      if (beta <= alpha) break;
    }
    return { score: minScore, move: bestMove };
  }
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
  return search(state, state.turn, 4, -Infinity, Infinity, true).move ?? block ?? winNow ?? randomChoice(moves);
}
