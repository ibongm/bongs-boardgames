import { meta } from './meta.js';

export function createState() {
  return {
    board: Array.from({ length: meta.rows }, () => Array(meta.cols).fill(null)),
    turn: 0,
    revision: 0,
    winner: null,
    draw: false,
  };
}

export function legalMoves(state) {
  if (state.winner !== null || state.draw) return [];
  const moves = [];
  for (let col = 0; col < meta.cols; col += 1) {
    if (state.board[0][col] === null) moves.push(col);
  }
  return moves;
}

function dropRow(board, col) {
  for (let row = meta.rows - 1; row >= 0; row -= 1) {
    if (board[row][col] === null) return row;
  }
  return -1;
}

function countDir(board, row, col, dr, dc, seat) {
  let n = 0;
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < meta.rows && c >= 0 && c < meta.cols && board[r][c] === seat) {
    n += 1;
    r += dr;
    c += dc;
  }
  return n;
}

export function winnerFrom(board, row, col, seat) {
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const total = 1 + countDir(board, row, col, dr, dc, seat) + countDir(board, row, col, -dr, -dc, seat);
    if (total >= 4) return seat;
  }
  return null;
}

export function applyMove(state, move) {
  const col = Number(move);
  if (!legalMoves(state).includes(col)) throw new Error('Illegal move');
  const board = state.board.map((row) => row.slice());
  const row = dropRow(board, col);
  board[row][col] = state.turn;
  const winner = winnerFrom(board, row, col, state.turn);
  const draw = winner === null && board[0].every((cell) => cell !== null);
  return { board, turn: state.turn === 0 ? 1 : 0, revision: state.revision + 1, winner, draw };
}

export function status(state) {
  return { over: Boolean(state.winner !== null || state.draw), winner: state.winner, draw: state.draw, turn: state.turn };
}
