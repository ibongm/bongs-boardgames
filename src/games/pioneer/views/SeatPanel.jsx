export default function SeatPanel({
  players = [],
  turn = 0,
  actorSeat = 0,
  viewerSeat = 0,
  longestRouteSeat = null,
  grandGarrisonSeat = null,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {players.map((p, seat) => {
        const isTurn = (actorSeat !== undefined && actorSeat !== null ? actorSeat : turn) === seat;
        const isViewer = viewerSeat === seat;
        const hasRoute = longestRouteSeat === seat;
        const hasGarrison = grandGarrisonSeat === seat;

        return (
          <div
            key={seat}
            className={`rounded-2xl border p-2.5 transition-all ${
              isTurn
                ? 'border-gold bg-cream shadow-sm ring-1 ring-gold/40'
                : 'border-gold/20 bg-cream/60'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.symbol}
                </span>
                <span className="font-medium text-xs text-ink truncate">
                  {p.name}
                  {isViewer ? ' (You)' : ''}
                </span>
              </div>
              <div className="flex items-baseline gap-0.5 flex-shrink-0">
                <span className="font-display text-lg font-bold text-gold">
                  {isViewer ? p.victoryPoints : p.publicVP}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">VP</span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-ink/70 text-center">
              <div className="bg-walnut/10 rounded px-1 py-0.5">
                <span className="block text-[9px] uppercase tracking-wider text-ink/45">Cards</span>
                <span className="font-semibold">{p.cardCount ?? Object.values(p.resources || {}).reduce((s, n) => s + (n || 0), 0)}</span>
              </div>
              <div className="bg-walnut/10 rounded px-1 py-0.5">
                <span className="block text-[9px] uppercase tracking-wider text-ink/45">Guards</span>
                <span className="font-semibold">{p.playedGuards || 0}</span>
              </div>
              <div className="bg-walnut/10 rounded px-1 py-0.5">
                <span className="block text-[9px] uppercase tracking-wider text-ink/45">Route</span>
                <span className="font-semibold">{p.routeLength || 0}</span>
              </div>
            </div>

            {(hasRoute || hasGarrison) && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {hasRoute && (
                  <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 rounded px-1.5 py-0.2 text-[9px] font-semibold">
                    Route (+2)
                  </span>
                )}
                {hasGarrison && (
                  <span className="inline-block bg-red-100 text-red-900 border border-red-300 rounded px-1.5 py-0.2 text-[9px] font-semibold">
                    Garrison (+2)
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
