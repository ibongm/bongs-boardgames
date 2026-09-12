import { useState } from 'react';
import { getDiscardRequiredCount, getEligibleStealSeats } from '../bandit.js';

const RESOURCES = [
  { id: 'wood', label: 'Wood', icon: '🪵' },
  { id: 'clay', label: 'Clay', icon: '🧱' },
  { id: 'sheep', label: 'Sheep', icon: '🐑' },
  { id: 'wheat', label: 'Wheat', icon: '🌾' },
  { id: 'stone', label: 'Stone', icon: '🪨' },
];

export default function BanditModal({
  state,
  viewerSeat = 0,
  selectedHexId = null,
  onDiscard = () => {},
  onSteal = () => {},
}) {
  if (!state) return null;

  const isDiscardPhase = state.phase === 'discarding';
  const player = state.players[viewerSeat];
  const totalCards = Object.values(player?.resources || {}).reduce((s, n) => s + (n || 0), 0);
  const requiredDiscard = getDiscardRequiredCount(totalCards);
  const alreadyDiscarded = state.discardsDone?.[viewerSeat];

  // Discard local state
  const [discardCounts, setDiscardCounts] = useState({ wood: 0, clay: 0, sheep: 0, wheat: 0, stone: 0 });
  const totalDiscardSelected = Object.values(discardCounts).reduce((s, n) => s + (n || 0), 0);

  // Steal local state
  const isBanditPhase = state.phase === 'bandit';
  const isActivePlayer = state.turn === viewerSeat;
  const currentHexId = selectedHexId || state.banditHexId;
  const eligibleOpponents = (isBanditPhase && isActivePlayer && currentHexId)
    ? getEligibleStealSeats(state, currentHexId, viewerSeat)
    : [];
  const [selectedOppSeat, setSelectedOppSeat] = useState(null);

  // If discarding required for viewer
  if (isDiscardPhase && requiredDiscard > 0 && !alreadyDiscarded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-cream border-2 border-red-700/60 rounded-3xl p-5 shadow-2xl max-w-sm w-full">
          <p className="font-display text-lg font-bold text-red-800 mb-1">A 7 was Rolled!</p>
          <p className="text-xs text-ink/75 mb-3">
            You hold {totalCards} resource cards. The Bandit forces you to discard{' '}
            <strong className="text-ink font-bold">{requiredDiscard}</strong> cards of your choice.
          </p>

          <div className="space-y-2 mb-4">
            {RESOURCES.map((r) => {
              const held = player?.resources?.[r.id] || 0;
              const count = discardCounts[r.id] || 0;
              return (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-walnut/5 border border-gold/15">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{r.icon}</span>
                    <div>
                      <span className="text-xs font-semibold text-ink">{r.label}</span>
                      <span className="text-[10px] text-ink/50 block">In hand: {held}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={count <= 0}
                      onClick={() => setDiscardCounts((c) => ({ ...c, [r.id]: Math.max(0, count - 1) }))}
                      className="w-7 h-7 rounded-lg bg-walnut/10 font-bold text-sm disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-sm">{count}</span>
                    <button
                      type="button"
                      disabled={count >= held || totalDiscardSelected >= requiredDiscard}
                      onClick={() => setDiscardCounts((c) => ({ ...c, [r.id]: count + 1 }))}
                      className="w-7 h-7 rounded-lg bg-walnut/10 font-bold text-sm disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={totalDiscardSelected !== requiredDiscard}
            onClick={() => onDiscard(discardCounts)}
            className="w-full btn btn-primary py-2.5 text-sm min-h-11 disabled:opacity-40"
          >
            Confirm Discard ({totalDiscardSelected}/{requiredDiscard})
          </button>
        </div>
      </div>
    );
  }

  // If active player needs to select who to steal from
  if (isBanditPhase && isActivePlayer && eligibleOpponents.length > 0) {
    const oppToSteal = selectedOppSeat !== null ? selectedOppSeat : eligibleOpponents[0];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="bg-cream border-2 border-gold rounded-3xl p-5 shadow-2xl max-w-sm w-full">
          <p className="font-display text-lg font-bold text-ink mb-1">Bandit Plunder</p>
          <p className="text-xs text-ink/75 mb-3">
            Choose an adjacent opponent to steal 1 random resource card from:
          </p>

          <div className="space-y-2 mb-4">
            {eligibleOpponents.map((oppSeat) => {
              const opp = state.players[oppSeat];
              const isSelected = oppToSteal === oppSeat;
              return (
                <button
                  key={oppSeat}
                  type="button"
                  onClick={() => setSelectedOppSeat(oppSeat)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                    isSelected ? 'border-gold bg-gold/15' : 'border-gold/20 bg-cream/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] text-white font-bold"
                      style={{ backgroundColor: opp.color }}
                    >
                      {opp.symbol}
                    </span>
                    <span className="font-semibold text-xs text-ink">{opp.name}</span>
                  </div>
                  <span className="text-xs text-ink/60 font-medium">
                    {opp.cardCount ?? Object.values(opp.resources || {}).reduce((s, n) => s + (n || 0), 0)} cards
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onSteal(currentHexId, oppToSteal)}
            className="w-full btn btn-primary py-2.5 text-sm min-h-11"
          >
            Steal Random Resource
          </button>
        </div>
      </div>
    );
  }

  return null;
}
