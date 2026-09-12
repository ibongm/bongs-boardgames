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
}) {
  const [selectedElement, setSelectedElement] = useState(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [setupPendingIntersection, setSetupPendingIntersection] = useState(null);
  const [error, setError] = useState('');

  if (!state) return null;

  const currentActorSeat = state.actorSeat !== undefined && state.actorSeat !== null ? state.actorSeat : state.turn;
  const actorPlayer = state.players[currentActorSeat];
  const viewerPlayer = state.players[viewerSeat] || state.players[0];
  const isMyTurn = canPlay && currentActorSeat === viewerSeat;
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
      onMove({ type: 'offerTrade', give, want });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCounterTrade(offerId, give, want) {
    setError('');
    try {
      onMove({ type: 'counterTrade', offerId, give, want });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAcceptTrade(offerId) {
    setError('');
    try {
      onMove({ type: 'acceptTrade', offerId });
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
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner / Win Announcement */}
      {isGameOver ? (
        <div className="bg-amber-100 border-2 border-amber-500 rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-amber-900">
            Pioneer - {state.players[state.winner]?.name} reaches 10 points and wins the island!
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Settlements, cities, Longest Route, Grand Garrison, and secret Charters have settled the realm.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] text-white font-bold"
              style={{ backgroundColor: actorPlayer?.color }}
            >
              {actorPlayer?.symbol}
            </span>
            <span className="font-medium text-sm text-ink">
              {isMyTurn ? 'Your turn' : `${actorPlayer?.name}'s turn`} ·{' '}
              <span className="capitalize font-semibold text-gold">{state.phase} phase</span>
            </span>
          </div>

          {state.dice && (
            <div className="flex items-center gap-1 bg-cream border border-gold/30 rounded-xl px-2.5 py-1 text-xs font-semibold">
              <span className="text-ink/60">Dice:</span>
              <span className="font-mono text-gold font-bold">
                {state.dice[0]} + {state.dice[1]} = {state.dice[0] + state.dice[1]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Seat Overview Panel */}
      <SeatPanel
        players={state.players}
        turn={state.turn}
        actorSeat={state.actorSeat}
        viewerSeat={viewerSeat}
        longestRouteSeat={state.longestRouteSeat}
        grandGarrisonSeat={state.grandGarrisonSeat}
      />

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

      {/* Action Bar (Only buttons: Roll, Play Breakthrough, Trade, Bank, End turn. No Build button!) */}
      {interactive && canPlay && isMyTurn && !isGameOver && (
        <div className="bg-cream border border-gold/25 rounded-2xl p-3 flex flex-wrap items-center gap-2">
          {state.phase === 'rolling' && (
            <button
              type="button"
              onClick={handleRoll}
              className="btn btn-primary py-2.5 px-6 text-sm font-bold min-h-11 shadow-sm"
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

      {/* Hand Dock & Build Costs */}
      <HandDock
        resources={viewerPlayer.resources}
        hiddenCards={viewerPlayer.hiddenCards}
        cardsBoughtThisTurn={viewerPlayer.cardsBoughtThisTurn || []}
        canPlay={canPlay && !isGameOver}
        phase={state.phase}
        playedCardThisTurn={state.playedCardThisTurn}
        onPlayCard={handlePlayCard}
      />

      {/* Log */}
      <Log log={state.log} />

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
