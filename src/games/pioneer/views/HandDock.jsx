import { getCardDef } from '../cards.js';

const RESOURCE_THEMES = {
  wood: { label: 'Wood', color: '#4d7c0f', bg: '#f0fdf4', border: '#bbf7d0', icon: '🪵' },
  clay: { label: 'Clay', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: '🧱' },
  sheep: { label: 'Sheep', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🐑' },
  wheat: { label: 'Wheat', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🌾' },
  stone: { label: 'Stone', color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: '🪨' },
};

export default function HandDock({
  resources = {},
  hiddenCards = [],
  cardsBoughtThisTurn = [],
  canPlay = false,
  phase = 'main',
  playedCardThisTurn = false,
  onPlayCard = () => {},
}) {
  const resourceKeys = ['wood', 'clay', 'sheep', 'wheat', 'stone'];

  return (
    <div className="bg-cream border border-gold/25 rounded-3xl p-3 sm:p-4 space-y-3">
      {/* Hand resources */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-ink/55">Your Resources</p>
          <span className="text-xs text-ink/60">
            {Object.values(resources).reduce((s, n) => s + (n || 0), 0)} cards in hand
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {resourceKeys.map((res) => {
            const theme = RESOURCE_THEMES[res];
            const count = resources[res] || 0;
            return (
              <div
                key={res}
                className="rounded-2xl border p-2 flex flex-col items-center justify-center transition-all min-h-12 text-center"
                style={{
                  backgroundColor: theme.bg,
                  borderColor: count > 0 ? theme.color : theme.border,
                }}
              >
                <span className="text-base sm:text-lg mb-0.5">{theme.icon}</span>
                <span className="text-[11px] font-semibold text-ink">{theme.label}</span>
                <span
                  className="font-display text-base font-bold mt-0.5"
                  style={{ color: count > 0 ? theme.color : '#9ca3af' }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakthrough cards in hand */}
      {hiddenCards.length > 0 && (
        <div className="pt-2 border-t border-gold/15">
          <p className="text-xs uppercase tracking-wider font-semibold text-ink/55 mb-2">
            Breakthrough Cards ({hiddenCards.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {hiddenCards.map((cId, idx) => {
              const def = getCardDef(cId);
              const isBoughtThisTurn = cardsBoughtThisTurn.includes(cId);
              const isGuard = def?.type === 'guard';
              const canPlayThisCard =
                canPlay &&
                !playedCardThisTurn &&
                !isBoughtThisTurn &&
                (isGuard ? (phase === 'rolling' || phase === 'main') : phase === 'main') &&
                !def?.isCharter;

              return (
                <div
                  key={`${cId}-${idx}`}
                  className="rounded-xl border border-gold/30 bg-walnut/5 p-2.5 min-w-[130px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-ink">{def?.title || 'Card'}</span>
                      {def?.isCharter && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] px-1 rounded font-bold">1 VP</span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink/70 mt-1 leading-snug">{def?.description}</p>
                    {isBoughtThisTurn && (
                      <p className="text-[9px] text-gold font-medium mt-1">Bought this turn</p>
                    )}
                  </div>
                  {canPlayThisCard && (
                    <button
                      type="button"
                      onClick={() => onPlayCard(cId)}
                      className="mt-2 w-full bg-gold text-cream text-xs font-semibold py-1.5 px-2 rounded-lg min-h-9 transition-colors hover:bg-gold/90"
                    >
                      Play
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Build costs strip */}
      <div className="pt-2 border-t border-gold/15 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs text-ink/65">
        <span className="font-semibold uppercase tracking-wider text-ink/45">Costs:</span>
        <span>
          <strong className="text-ink">Road:</strong> 1 Wood, 1 Clay
        </span>
        <span>
          <strong className="text-ink">Settlement:</strong> 1W, 1C, 1 Sheep, 1 Wheat
        </span>
        <span>
          <strong className="text-ink">City:</strong> 3 Stone, 2 Wheat
        </span>
        <span>
          <strong className="text-ink">Breakthrough:</strong> 1 Stone, 1 Sheep, 1 Wheat
        </span>
      </div>
    </div>
  );
}
