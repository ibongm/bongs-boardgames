export default function ConnectFourBoard({ state, canPlay, onMove, interactive = true }) {
  const cols = state.board[0].length;
  return (
    <div className="felt-panel rounded-3xl p-3 w-full max-w-md mx-auto">
      {interactive && (
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: cols }, (_, col) => (
            <button
              key={col}
              type="button"
              aria-label={`Drop in column ${col + 1}`}
              className="min-h-11 rounded-lg bg-cream/15 text-cream text-xs font-semibold hover:bg-cream/30"
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
                key={`${r}-${c}-${cell}`}
                className={`disc ${cell === 0 ? 'disc-ivory' : cell === 1 ? 'disc-ink' : 'disc-empty'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
