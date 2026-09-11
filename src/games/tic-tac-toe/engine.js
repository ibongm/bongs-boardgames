const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createState() {
  return { board: Array(9).fill(null), turn: 0, revision: 0, winner: null, draw: false };
}

export function legalMoves(state) {
  if (state.winner || state.draw) return [];
  return state.board.map((cell, index) => (cell === null ? index : null)).filter((v) => v !== null);
}

export function applyMove(state, move) {
  const index = Number(move);
  if (!legalMoves(state).includes(index)) throw new Error('Illegal move');
  const board = state.board.slice();
  board[index] = state.turn;
  const next = {
    board,
    turn: state.turn === 0 ? 1 : 0,
    revision: state.revision + 1,
    winner: null,
    draw: false,
  };
  next.winner = winnerOf(board);
  next.draw = next.winner === null && board.every((cell) => cell !== null);
  return next;
}

export function winnerOf(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export function status(state) {
  return { over: Boolean(state.winner !== null || state.draw), winner: state.winner, draw: state.draw, turn: state.turn };
}
