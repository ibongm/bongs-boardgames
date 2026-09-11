export const meta = {
  id: 'connect-four',
  title: 'Connect Four',
  seats: 2,
  cols: 7,
  rows: 6,
  previewState: {
    board: [
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, 0, null, null, null],
      [null, null, 1, 1, null, null, null],
      [null, 0, 0, 0, 1, null, null],
      [0, 1, 1, 0, 1, 0, null],
    ],
    turn: 0,
    revision: 12,
    winner: null,
    draw: false,
  },
};
