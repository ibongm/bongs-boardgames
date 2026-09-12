import { useState } from 'react';
import { getBankTradeRate, canBankTrade } from '../trade.js';

const RESOURCES = [
  { id: 'wood', label: 'Wood', icon: '🪵' },
  { id: 'clay', label: 'Clay', icon: '🧱' },
  { id: 'sheep', label: 'Sheep', icon: '🐑' },
  { id: 'wheat', label: 'Wheat', icon: '🌾' },
  { id: 'stone', label: 'Stone', icon: '🪨' },
];

export default function TradeModal({
  open = false,
  onClose = () => {},
  state,
  viewerSeat = 0,
  onBankTrade = () => {},
  onOfferTrade = () => {},
  onCounterTrade = () => {},
  onAcceptTrade = () => {},
}) {
  if (!open || !state) return null;

  const player = state.players[viewerSeat];
  const isActivePlayer = state.turn === viewerSeat;
  const [tab, setTab] = useState('bank'); // 'bank' or 'domestic'

  // Bank trade state
  const [giveRes, setGiveRes] = useState('wood');
  const [takeRes, setTakeRes] = useState('clay');

  // Domestic trade state
  const [giveCounts, setGiveCounts] = useState({ wood: 0, clay: 0, sheep: 0, wheat: 0, stone: 0 });
  const [wantCounts, setWantCounts] = useState({ wood: 0, clay: 0, sheep: 0, wheat: 0, stone: 0 });

  const currentRate = player ? getBankTradeRate(state, viewerSeat, giveRes) : 4;
  const bankLegal = player ? canBankTrade(state, viewerSeat, giveRes, takeRes) : false;

  const totalGive = Object.values(giveCounts).reduce((s, n) => s + (n || 0), 0);
  const totalWant = Object.values(wantCounts).reduce((s, n) => s + (n || 0), 0);

  function handleBankSubmit(e) {
    e.preventDefault();
    if (!bankLegal) return;
    onBankTrade(giveRes, takeRes);
    onClose();
  }

  function handleOfferSubmit(e) {
    e.preventDefault();
    if (totalGive < 1) return;
    onOfferTrade(giveCounts, wantCounts);
    setGiveCounts({ wood: 0, clay: 0, sheep: 0, wheat: 0, stone: 0 });
    setWantCounts({ wood: 0, clay: 0, sheep: 0, wheat: 0, stone: 0 });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-cream border-2 border-gold rounded-3xl p-5 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gold/20 pb-3">
          <p className="font-display text-xl font-bold text-ink">Trading Desk</p>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/40 hover:text-ink text-base px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mt-3 mb-4">
          <button
            type="button"
            onClick={() => setTab('bank')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold min-h-10 transition-colors ${
              tab === 'bank' ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
            }`}
          >
            Bank Trade (Maritime)
          </button>
          <button
            type="button"
            onClick={() => setTab('domestic')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold min-h-10 transition-colors ${
              tab === 'domestic' ? 'bg-gold text-cream' : 'border border-gold/30 text-ink'
            }`}
          >
            Domestic Trade (Players)
          </button>
        </div>

        {/* Bank Trade View */}
        {tab === 'bank' && (
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-ink/75 mb-2">
                1. Give resource to Bank (Your current rate: <strong className="text-gold">{currentRate}:1</strong>)
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {RESOURCES.map((r) => {
                  const hasCards = (player?.resources?.[r.id] || 0) >= getBankTradeRate(state, viewerSeat, r.id);
                  const rate = getBankTradeRate(state, viewerSeat, r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setGiveRes(r.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        giveRes === r.id
                          ? 'border-gold bg-gold/15 font-bold'
                          : 'border-gold/20 bg-cream/70'
                      }`}
                    >
                      <span className="block text-base">{r.icon}</span>
                      <span className="block text-[11px] mt-0.5">{r.label}</span>
                      <span className="block text-[10px] text-ink/50 mt-0.5">{rate}:1</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink/75 mb-2">2. Take resource from Bank</p>
              <div className="grid grid-cols-5 gap-1.5">
                {RESOURCES.map((r) => {
                  const inBank = state.bank[r.id] || 0;
                  const disabled = r.id === giveRes || inBank < 1;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setTakeRes(r.id)}
                      className={`p-2 rounded-xl border text-center transition-all disabled:opacity-30 ${
                        takeRes === r.id
                          ? 'border-gold bg-gold/15 font-bold'
                          : 'border-gold/20 bg-cream/70'
                      }`}
                    >
                      <span className="block text-base">{r.icon}</span>
                      <span className="block text-[11px] mt-0.5">{r.label}</span>
                      <span className="block text-[10px] text-ink/50 mt-0.5">{inBank} left</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-walnut/5 rounded-xl p-3 text-xs text-ink/75">
              Trading <strong className="text-ink">{currentRate} {giveRes}</strong> for <strong className="text-ink">1 {takeRes}</strong>.
            </div>

            <button
              type="submit"
              disabled={!bankLegal}
              className="w-full btn btn-primary py-2.5 text-sm min-h-11 disabled:opacity-40"
            >
              Confirm Bank Trade
            </button>
          </form>
        )}

        {/* Domestic Trade View */}
        {tab === 'domestic' && (
          <div className="space-y-4">
            {isActivePlayer ? (
              <form onSubmit={handleOfferSubmit} className="space-y-3">
                <p className="text-xs text-ink/70">
                  Propose an offer to the table. Leave the "Want" side empty to solicit counters from opponents!
                </p>

                <div>
                  <p className="text-xs font-semibold text-ink/80 mb-1">You Offer (Give):</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {RESOURCES.map((r) => (
                      <div key={r.id} className="border border-gold/20 rounded-xl p-1 text-center bg-cream/70">
                        <span className="block text-xs">{r.icon}</span>
                        <span className="text-[10px] text-ink/60">{player?.resources?.[r.id] || 0} held</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <button
                            type="button"
                            className="w-5 h-5 rounded bg-walnut/10 text-xs font-bold"
                            onClick={() => setGiveCounts((c) => ({ ...c, [r.id]: Math.max(0, c[r.id] - 1) }))}
                          >
                            -
                          </button>
                          <span className="text-xs font-bold">{giveCounts[r.id]}</span>
                          <button
                            type="button"
                            className="w-5 h-5 rounded bg-walnut/10 text-xs font-bold"
                            onClick={() =>
                              setGiveCounts((c) => ({
                                ...c,
                                [r.id]: Math.min(player?.resources?.[r.id] || 0, c[r.id] + 1),
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink/80 mb-1">You Request (Want):</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {RESOURCES.map((r) => (
                      <div key={r.id} className="border border-gold/20 rounded-xl p-1 text-center bg-cream/70">
                        <span className="block text-xs">{r.icon}</span>
                        <span className="text-[10px] text-ink/60">{r.label}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <button
                            type="button"
                            className="w-5 h-5 rounded bg-walnut/10 text-xs font-bold"
                            onClick={() => setWantCounts((c) => ({ ...c, [r.id]: Math.max(0, c[r.id] - 1) }))}
                          >
                            -
                          </button>
                          <span className="text-xs font-bold">{wantCounts[r.id]}</span>
                          <button
                            type="button"
                            className="w-5 h-5 rounded bg-walnut/10 text-xs font-bold"
                            onClick={() => setWantCounts((c) => ({ ...c, [r.id]: c[r.id] + 1 }))}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={totalGive < 1}
                  className="w-full btn btn-primary py-2 text-sm min-h-10 disabled:opacity-40"
                >
                  Send Trade Offer
                </button>
              </form>
            ) : (
              <p className="text-xs text-ink/70">
                Only the active player ({state.players[state.turn]?.name}) can initiate open trades. You may counter incoming offers below.
              </p>
            )}

            {/* Active offers list */}
            <div className="pt-3 border-t border-gold/20">
              <p className="text-xs uppercase tracking-wider font-semibold text-ink/55 mb-2">Open Offers</p>
              {(state.offers || []).length === 0 ? (
                <p className="text-xs text-ink/40">No active offers on the table.</p>
              ) : (
                <div className="space-y-2">
                  {state.offers.map((offer) => {
                    const fromPlayer = state.players[offer.fromSeat];
                    const giveText = Object.entries(offer.give)
                      .filter(([, n]) => n > 0)
                      .map(([r, n]) => `${n} ${r}`)
                      .join(', ');
                    const wantText = Object.entries(offer.want)
                      .filter(([, n]) => n > 0)
                      .map(([r, n]) => `${n} ${r}`)
                      .join(', ');

                    return (
                      <div
                        key={offer.id}
                        className="rounded-xl border border-gold/30 bg-walnut/5 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-ink">
                            {fromPlayer?.name}: Offers {giveText || 'nothing'}
                          </p>
                          <p className="text-ink/65 text-[11px]">
                            {wantText ? `Wants: ${wantText}` : 'Wants: open to counters'}
                          </p>
                        </div>
                        {isActivePlayer && offer.fromSeat !== viewerSeat && (
                          <button
                            type="button"
                            onClick={() => onAcceptTrade(offer.id)}
                            className="btn btn-primary py-1 px-3 text-xs min-h-8"
                          >
                            Accept
                          </button>
                        )}
                        {!isActivePlayer && offer.fromSeat === state.turn && (
                          <button
                            type="button"
                            onClick={() => onAcceptTrade(offer.id)}
                            className="btn btn-primary py-1 px-3 text-xs min-h-8"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
