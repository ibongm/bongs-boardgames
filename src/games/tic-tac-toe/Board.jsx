import { meta } from './meta.js';

export default function TicTacToeBoard({ state, canPlay, onMove }) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
      {state.board.map((cell, index) => (
        <button
          key={index}
          type="button"
          onClick={() => canPlay && cell === null && onMove(index)}
          className="aspect-square rounded-lg bg-cream text-ink text-4xl font-display font-bold shadow-inner hover:bg-parchment disabled:hover:bg-cream"
          disabled={!canPlay || cell !== null}
        >
          {cell === null ? '' : meta.marks[cell]}
        </button>
      ))}
    </div>
  );
}
