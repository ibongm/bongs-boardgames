import { meta } from './meta.js';

export default function TicTacToeBoard({ state, canPlay, onMove }) {
  return (
    <div className="ttt-board">
      {state.board.map((cell, index) => (
        <button
          key={index}
          type="button"
          aria-label={cell === null ? `Square ${index + 1}` : meta.marks[cell]}
          onClick={() => canPlay && cell === null && onMove(index)}
          disabled={!canPlay || cell !== null}
        >
          {cell === null ? '' : meta.marks[cell]}
        </button>
      ))}
    </div>
  );
}
