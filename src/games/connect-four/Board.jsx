export default function ConnectFourBoard({ state, canPlay, onMove, interactive = true }) {
  const cols = state.board[0].length;
  return (
    <div className="felt-panel rounded-2xl p-3 shadow-table w-full max-w-md mx-auto">
      {interactive && (
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: cols }, (_, col) => (
            <button
              key={col}
              type="button"
              className="h-8 min-h-8 rounded-md bg-gold/20 text-cream text-xs font-semibold hover:bg-gold/40"
              disabled={!canPlay || state.board[0][col] !== null}
              onClick={() => onMove(col)}
            >
              ▼
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-1">
        {state.board.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-1">
            {row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`aspect-square rounded-full border border-black/20 ${
                  cell === 0 ? 'bg-cream' : cell === 1 ? 'bg-rust' : 'bg-felt-deep'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
