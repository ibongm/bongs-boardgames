export default function ConnectFourBoard({ state, canPlay, onMove, interactive = true }) {
  const cols = state.board[0].length;

  const handleColumnClick = (c) => {
    if (!interactive || !canPlay || state.board[0][c] !== null) return;
    onMove(c);
  };

  return (
    <div className="felt-panel rounded-3xl p-3 w-full max-w-md mx-auto select-none">
      {interactive && (
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: cols }, (_, col) => (
            <button
              key={col}
              type="button"
              aria-label={`Drop in column ${col + 1}`}
              className="min-h-11 rounded-lg bg-cream/15 text-cream text-xs font-semibold hover:bg-cream/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              disabled={!canPlay || state.board[0][col] !== null}
              onClick={() => handleColumnClick(col)}
            >
              ▼
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-1">
        {state.board.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-1">
            {row.map((cell, c) => {
              const columnPlayable = interactive && canPlay && state.board[0][c] === null;
              return (
                <div
                  key={`${r}-${c}-${cell}`}
                  role={interactive ? 'button' : undefined}
                  tabIndex={columnPlayable ? 0 : undefined}
                  aria-label={interactive ? `Column ${c + 1}` : undefined}
                  onClick={() => handleColumnClick(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleColumnClick(c);
                    }
                  }}
                  className={`disc ${cell === 0 ? 'disc-ivory' : cell === 1 ? 'disc-ink' : 'disc-empty'} ${
                    columnPlayable ? 'cursor-pointer hover:ring-2 hover:ring-gold/60' : ''
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
