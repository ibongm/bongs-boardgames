import { useState, useMemo } from 'react';
import HexBoard from './views/HexBoard.jsx';
import HandDock from './views/HandDock.jsx';
import SeatPanel from './views/SeatPanel.jsx';
import TradeModal from './views/TradeModal.jsx';
import BanditModal from './views/BanditModal.jsx';
import BuildPicker from './views/BuildPicker.jsx';
import Log from './views/Log.jsx';
import { canBuyCard } from './build.js';
import { INTERSECTIONS } from './board.js';

export default function PioneerBoard({
  state,
  canPlay = false,
  viewerSeat = 0,
  onMove = () => {},
  interactive = true,
  sidebarTop = null,
  sidebarBottom = null,
}) {
  const [selectedElement, setSelectedElement] = useState(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [setupPendingIntersection, setSetupPendingIntersection] = useState(null);
  const [error, setError] = useState('');

  if (!state) return null;

  if (!interactive) {
    return (
      <div className="w-full flex items-center justify-center pointer-events-none">
        <HexBoard
          state={state}
          canPlay={false}
          viewerSeat={viewerSeat}
          interactive={false}
        />
      </div>
    );
  }

  const isSpectator = viewerSeat === 'spectator' || typeof viewerSeat !== 'number' || viewerSeat < 0;
  const currentActorSeat = state.actorSeat !== undefined && state.actorSeat !== null ? state.actorSeat : state.turn;
  const actorPlayer = state.players?.[currentActorSeat];
  const viewerPlayer = !isSpectator ? state.players?.[viewerSeat] : null;
  const isMyTurn = !isSpectator && canPlay && currentActorSeat === viewerSeat;
  const isGameOver = state.phase === 'gameover' || state.winner !== null;

  // Actions
  function handleRoll() {
    setError('');
    onMove({ type: 'roll' });
  }

  function handleEndTurn() {
    setError('');
    setSelectedElement(null);
    onMove({ type: 'endTurn' });
  }

  function handleBuyCard() {
    setError('');
    try {
      onMove({ type: 'buyCard' });
    } catch (err) {
      setError(err.message);
    }
  }

  function handlePlayCard(cardId) {
    setError('');
    try {
      onMove({ type: 'playCard', cardId });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleBankTrade(give, take) {
    setError('');
    try {
      onMove({ type: 'bankTrade', give, take });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleOfferTrade(give, want) {
    setError('');
    try {
      onMove({ type: 'offerTrade', give, want, actorSeat: viewerSeat });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCounterTrade(offerId, give, want) {
    setError('');
    try {
      onMove({ type: 'counterTrade', offerId, give, want, actorSeat: viewerSeat });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAcceptTrade(offerId) {
    setError('');
    try {
      onMove({ type: 'acceptTrade', offerId, actorSeat: viewerSeat });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleConfirmBuildRoad(pathId) {
    setError('');
    setSelectedElement(null);
    onMove({ type: 'buildRoad', pathId });
  }

  function handleConfirmBuildSettlement(intersectionId) {
    setError('');
    setSelectedElement(null);
    onMove({ type: 'buildSettlement', intersectionId });
  }

  function handleConfirmBuildCity(intersectionId) {
    setError('');
    setSelectedElement(null);
    onMove({ type: 'buildCity', intersectionId });
  }

  // Setup mode clicks
  function handleIntersectionClick(elem) {
    if (!canPlay || !interactive) return;

    if (state.phase === 'setup') {
      if (elem.legal) {
        setSetupPendingIntersection(elem.id);
        setSelectedElement({ ...elem, isSetup: true });
      }
      return;
    }

    setSelectedElement(elem);
  }

  function handlePathClick(elem) {
    if (!canPlay || !interactive) return;

    if (state.phase === 'setup' && setupPendingIntersection) {
      // Complete setup pair
      const validPaths = INTERSECTIONS[setupPendingIntersection]?.pathIds || [];
      if (validPaths.includes(elem.id)) {
        onMove({
          type: 'placeSetup',
          intersectionId: setupPendingIntersection,
          pathId: elem.id,
        });
        setSetupPendingIntersection(null);
        setSelectedElement(null);
      } else {
        setError('Road must connect directly to the placed settlement');
      }
      return;
    }

    setSelectedElement(elem);
  }

  function handleBanditHexClick(hexId) {
    if (!canPlay || !interactive || state.phase !== 'bandit') return;
    onMove({ type: 'moveBandit', hexId, stealFromSeat: null });
  }

  function handleDiscard(resources) {
    setError('');
    onMove({ type: 'discard', resources });
  }

  function handleSteal(hexId, stealFromSeat) {
    setError('');
    onMove({ type: 'moveBandit', hexId, stealFromSeat });
  }

  const canBuyBreakthrough = isMyTurn && state.phase === 'main' && canBuyCard(state, viewerSeat);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
      {/* Left Column: Controls, Seats, Hand, Log */}
      <aside className="w-full lg:w-[380px] xl:w-[410px] shrink-0 flex flex-col gap-3">
        {sidebarTop}

        {/* Seat Overview Panel */}
        <SeatPanel
          players={state.players}
          turn={state.turn}
          actorSeat={state.actorSeat}
          viewerSeat={viewerSeat}
          longestRouteSeat={state.longestRouteSeat}
          grandGarrisonSeat={state.grandGarrisonSeat}
        />

        {/* Hand Dock & Build Costs */}
        <HandDock
          resources={viewerPlayer?.resources || {}}
          hiddenCards={viewerPlayer?.hiddenCards || []}
          cardsBoughtThisTurn={viewerPlayer?.cardsBoughtThisTurn || []}
          canPlay={canPlay && !isGameOver}
          phase={state.phase}
          playedCardThisTurn={state.playedCardThisTurn}
          onPlayCard={handlePlayCard}
        />

        {/* Activity Log */}
        <Log log={state.log || []} />

        {sidebarBottom}
      </aside>

      {/* Right Column: Board Arena */}
      <section className="flex-1 min-w-0 w-full flex flex-col items-center gap-3">
        {/* Top Banner / Win Announcement */}
        {isGameOver ? (
          <div className="w-full bg-amber-100 border-2 border-amber-500 rounded-2xl p-3.5 text-center">
            <p className="font-display text-xl sm:text-2xl font-bold text-amber-900">
              Pioneer · {state.players?.[state.winner]?.name} reaches 10 points and wins the island!
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Settlements, cities, Longest Route, Grand Garrison, and secret Charters have settled the realm.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-cream border border-gold/25 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] text-white font-bold"
                style={{ backgroundColor: actorPlayer?.color }}
              >
                {actorPlayer?.symbol}
              </span>
              <span className="font-medium text-xs sm:text-sm text-ink">
                {isMyTurn ? 'Your turn' : `${actorPlayer?.name || 'A player'}'s turn`} ·{' '}
                <span className="capitalize font-semibold text-gold">{state.phase} phase</span>
              </span>
            </div>

            {state.dice && (
              <div className="flex items-center gap-1.5 bg-cream border border-gold/30 rounded-xl px-2.5 py-1 text-xs font-semibold">
                <span className="text-ink/60">Dice:</span>
                <span className="font-mono text-gold font-bold">
                  {state.dice[0]} + {state.dice[1]} = {state.dice[0] + state.dice[1]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Bar (Only buttons: Roll, Play Breakthrough, Trade, Bank, End turn. No Build button!) */}
        {interactive && canPlay && isMyTurn && !isGameOver && (
          <div className="w-full bg-cream border border-gold/25 rounded-2xl p-2.5 flex flex-wrap items-center gap-2 shadow-xs">
            {state.phase === 'rolling' && (
              <button
                type="button"
                onClick={handleRoll}
                className="btn btn-primary py-2 px-6 text-sm font-bold min-h-11 shadow-sm"
              >
                Roll Dice
              </button>
            )}

            {state.phase === 'setup' && (
              <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs text-amber-900">
                {setupPendingIntersection ? (
                  <span>Settlement selected! Now click a connecting road path.</span>
                ) : (
                  <span>Initial placement: click an intersection to build your settlement.</span>
                )}
              </div>
            )}

            {state.phase === 'main' && (
              <>
                <button
                  type="button"
                  onClick={() => setTradeModalOpen(true)}
                  className="border border-gold/40 hover:bg-gold/10 rounded-xl px-3 py-2 text-xs font-semibold min-h-11 text-ink"
                >
                  Trade
                </button>
                <button
                  type="button"
                  onClick={() => setTradeModalOpen(true)}
                  className="border border-gold/40 hover:bg-gold/10 rounded-xl px-3 py-2 text-xs font-semibold min-h-11 text-ink"
                >
                  Bank
                </button>
                <button
                  type="button"
                  onClick={handleBuyCard}
                  disabled={!canBuyBreakthrough}
                  className="border border-gold/40 hover:bg-gold/10 rounded-xl px-3 py-2 text-xs font-semibold min-h-11 text-ink disabled:opacity-40"
                >
                  Buy Breakthrough
                </button>
                <button
                  type="button"
                  onClick={handleEndTurn}
                  className="ml-auto btn btn-primary py-2 px-5 text-xs font-semibold min-h-11"
                >
                  End turn
                </button>
              </>
            )}

            {error && <p className="w-full text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )}

        {/* Main Board Map */}
        <HexBoard
          state={state}
          canPlay={canPlay && !isGameOver}
          viewerSeat={viewerSeat}
          selectedElement={selectedElement}
          onSelectPath={handlePathClick}
          onSelectIntersection={handleIntersectionClick}
          onSelectBanditHex={handleBanditHexClick}
          interactive={interactive}
        />
      </section>

      {/* Contextual Modals */}
      <BuildPicker
        selectedElement={selectedElement}
        onConfirmBuildRoad={handleConfirmBuildRoad}
        onConfirmBuildSettlement={handleConfirmBuildSettlement}
        onConfirmBuildCity={handleConfirmBuildCity}
        onConfirmSetupPlacement={() => {}}
        onCancel={() => setSelectedElement(null)}
        isSetup={state.phase === 'setup'}
        freeRoads={state.freeRoads || 0}
      />

      <TradeModal
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        state={state}
        viewerSeat={viewerSeat}
        onBankTrade={handleBankTrade}
        onOfferTrade={handleOfferTrade}
        onCounterTrade={handleCounterTrade}
        onAcceptTrade={handleAcceptTrade}
      />

      <BanditModal
        state={state}
        viewerSeat={viewerSeat}
        onDiscard={handleDiscard}
        onSteal={handleSteal}
      />
    </div>
  );
}
