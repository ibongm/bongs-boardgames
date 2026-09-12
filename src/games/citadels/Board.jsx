import { useMemo, useState } from 'react';
import { cardById, displayName } from './cards.js';
import { names, ROLE_ORDER, TYPE_COLORS } from './names.js';
import { buildCost, legalActions } from './engine.js';

function typeTone(type) {
  return TYPE_COLORS[type] || '#6b1c28';
}

function CardFace({ cardId, selected, onClick, disabled, badge }) {
  const card = cardById(cardId);
  if (!card) {
    return <div className="h-16 w-12 rounded-md bg-cream border border-gold/25" />;
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`text-left rounded-md px-2 py-1.5 min-h-11 border ${
        selected ? 'border-gold bg-gold/10' : 'border-gold/25 bg-cream'
      }`}
      style={{ minWidth: '5.5rem' }}
    >
      <span className="block text-[10px] uppercase tracking-wide font-semibold" style={{ color: typeTone(card.type) }}>
        {names.types[card.type]}
      </span>
      <span className="block text-ink text-sm font-semibold leading-tight">{card.name}</span>
      <span className="block text-ink/70 text-xs">
        {card.cost} gold{badge ? ` · ${badge}` : ''}
      </span>
    </button>
  );
}

function OutlineButton({ children, onClick }) {
  return (
    <button type="button" className="border border-gold/40 rounded-md px-3 py-2 min-h-11 text-ink" onClick={onClick}>
      {children}
    </button>
  );
}

export default function CitadelsBoard({ state, canPlay, onMove, interactive = true, viewerSeat = 0 }) {
  const [selectedHand, setSelectedHand] = useState(null);
  const [payCards, setPayCards] = useState([]);
  const actions = useMemo(
    () => (state && canPlay ? legalActions(state, state.actorSeat) : []),
    [state, canPlay]
  );

  if (!state?.players) {
    return <p className="text-ink/70 text-sm">Citadels table</p>;
  }

  const compact = interactive === false;
  const actor = state.actorSeat;
  const you = state.players[viewerSeat];

  function send(action) {
    if (!canPlay || !action) return;
    setSelectedHand(null);
    setPayCards([]);
    onMove(action);
  }

  function togglePay(id) {
    setPayCards((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {state.players.map((p, i) => (
          <div key={i} className="rounded-md bg-cream px-2 py-1 border border-gold/15">
            <p className="text-[10px] text-ink/70 truncate">{p.name || `Seat ${i + 1}`}</p>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {p.city.slice(0, 4).map((id) => (
                <span
                  key={id}
                  className="w-3 h-3 rounded-sm"
                  style={{ background: typeTone(cardById(id)?.type) }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const phaseLabel = {
    draft: 'Choose a character',
    gather: 'Gather gold or cards',
    chooseCard: 'Keep one card',
    main: 'Build, use an ability, or end the turn',
    gameover: 'Game over',
  }[state.phase] || state.phase;

  return (
    <div className="space-y-4 text-ink">
      <div className="flex flex-wrap gap-1">
        {ROLE_ORDER.map((roleId, index) => {
          const faceup = state.faceupDiscard?.includes(roleId);
          const holder = state.players.find((p) => p.roleRevealed && p.roleId === roleId);
          const called = state.rankCalled > index + 1 || holder;
          return (
            <div
              key={roleId}
              className={`rounded-md px-2 py-1 text-xs min-h-11 flex flex-col justify-center border ${
                faceup
                  ? 'bg-cream border-gold/20 text-ink/55 line-through'
                  : holder
                    ? 'bg-gold/10 border-gold text-ink'
                    : 'bg-cream border-gold/25 text-ink'
              }`}
            >
              <span className="font-mono font-semibold text-gold">{index + 1}</span>
              <span className="font-semibold">{names.roles[roleId]}</span>
              {faceup && <span className="no-underline text-ink/50">discarded</span>}
              {holder && <span className="text-ink/70">{holder.name}</span>}
              {!faceup && !holder && called && state.killedRole === roleId && (
                <span className="text-ink/50">killed</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-ink/80">
        Round {state.round || 1} · {phaseLabel}
        {state.killedRole ? ' · Assassin marked a rank' : ''}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {state.players.map((p, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 ${
              i === actor ? 'border-gold bg-cream' : 'border-gold/20 bg-cream/70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ink font-semibold text-sm">
                {p.name || `Seat ${i + 1}`}
                {i === viewerSeat ? ' · you' : ''}
                {state.crownSeat === i ? ' · crown' : ''}
              </p>
              <p className="text-ink/80 text-xs">
                {p.gold} gold · {p.hand?.length || 0} cards
                {p.roleRevealed && p.roleId ? ` · ${names.roles[p.roleId]}` : ''}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.city.length ? (
                p.city.map((id, districtIndex) => {
                  const destroy = actions.find((a) => a.type === 'warlordDestroy' && a.seat === i && a.districtIndex === districtIndex);
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!destroy}
                      onClick={() => send(destroy)}
                      className="rounded px-1.5 py-1 text-[11px] text-cream min-h-8 font-semibold"
                      style={{ background: typeTone(cardById(id)?.type) }}
                      title={destroy ? `Destroy for ${Math.max(0, (cardById(id)?.cost || 1) - 1)} gold` : displayName(id)}
                    >
                      {displayName(id)}
                    </button>
                  );
                })
              ) : (
                <span className="text-ink/50 text-xs">Empty city</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {state.phase === 'draft' && canPlay && (
        <div>
          <p className="text-sm text-ink/80 mb-2">Pick a character. The rest pass left.</p>
          <div className="flex flex-wrap gap-2">
            {actions
              .filter((a) => a.type === 'pickRole')
              .map((action) => (
                <button
                  key={action.roleId}
                  type="button"
                  className="bg-gold text-cream font-semibold rounded-md px-3 py-2 min-h-11"
                  onClick={() => send(action)}
                >
                  {ROLE_ORDER.indexOf(action.roleId) + 1}. {names.roles[action.roleId]}
                </button>
              ))}
          </div>
        </div>
      )}

      {state.phase === 'chooseCard' && canPlay && (
        <div className="flex flex-wrap gap-2">
          {(state.pendingDraw || []).map((id, keepIndex) => (
            <CardFace key={id} cardId={id} onClick={() => send({ type: 'keepDrawn', keepIndex })} />
          ))}
        </div>
      )}

      {canPlay && (state.phase === 'gather' || state.phase === 'main') && (
        <div className="flex flex-wrap gap-2">
          {actions.some((a) => a.type === 'gatherGold') && (
            <button type="button" className="bg-gold text-cream font-semibold rounded-md px-3 py-2 min-h-11" onClick={() => send({ type: 'gatherGold' })}>
              Take 2 gold
            </button>
          )}
          {actions.some((a) => a.type === 'gatherCards') && (
            <OutlineButton onClick={() => send({ type: 'gatherCards' })}>Draw cards</OutlineButton>
          )}
          {actions.some((a) => a.type === 'typeIncome') && (
            <OutlineButton onClick={() => send({ type: 'typeIncome' })}>District gold</OutlineButton>
          )}
          {actions
            .filter((a) => a.type === 'assassinKill')
            .map((action) => (
              <OutlineButton key={action.roleId} onClick={() => send(action)}>
                Kill {names.roles[action.roleId]}
              </OutlineButton>
            ))}
          {actions
            .filter((a) => a.type === 'thiefRob')
            .map((action) => (
              <OutlineButton key={action.roleId} onClick={() => send(action)}>
                Rob {names.roles[action.roleId]}
              </OutlineButton>
            ))}
          {actions
            .filter((a) => a.type === 'magicianSwap')
            .map((action) => (
              <OutlineButton key={action.seat} onClick={() => send(action)}>
                Swap with {state.players[action.seat]?.name || `seat ${action.seat + 1}`}
              </OutlineButton>
            ))}
          {actions.some((a) => a.type === 'magicianRedraw') && (
            <OutlineButton onClick={() => send({ type: 'magicianRedraw', cardIds: you.hand.slice() })}>
              Redraw whole hand
            </OutlineButton>
          )}
          {actions.some((a) => a.type === 'useSmithy') && (
            <OutlineButton onClick={() => send({ type: 'useSmithy' })}>Smithy: 2 gold for 3 cards</OutlineButton>
          )}
          {actions.some((a) => a.type === 'endTurn') && (
            <button type="button" className="bg-gold text-cream font-semibold rounded-md px-3 py-2 min-h-11" onClick={() => send({ type: 'endTurn' })}>
              End turn
            </button>
          )}
        </div>
      )}

      {you && (
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/60 mb-2">Your hand</p>
          <div className="flex flex-wrap gap-2">
            {(you.hand || []).filter((id) => id !== 'hidden').map((id) => {
              const build = actions.find((a) => a.type === 'build' && a.cardId === id);
              const lab = actions.find((a) => a.type === 'useLab' && a.cardId === id);
              const cost = buildCost(state, viewerSeat, id);
              const den = cardById(id)?.name === "Thieves' Den";
              return (
                <div key={id} className="space-y-1">
                  <CardFace
                    cardId={id}
                    selected={selectedHand === id || payCards.includes(id)}
                    onClick={() => {
                      if (den) togglePay(id);
                      setSelectedHand(id);
                    }}
                    badge={`${cost} to build`}
                  />
                  {selectedHand === id && (
                    <div className="flex gap-1">
                      {build && (
                        <button
                          type="button"
                          className="bg-gold text-cream text-xs rounded px-2 py-1 min-h-8 font-semibold"
                          onClick={() => send({ type: 'build', cardId: id, payWithCards: payCards.filter((c) => c !== id) })}
                        >
                          Build
                        </button>
                      )}
                      {lab && (
                        <button type="button" className="border border-gold/40 text-ink text-xs rounded px-2 py-1 min-h-8" onClick={() => send(lab)}>
                          Lab
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!you.hand?.filter((id) => id !== 'hidden').length && <span className="text-ink/50 text-sm">Empty hand</span>}
          </div>
        </div>
      )}

      {state.phase === 'gameover' && (
        <p className="text-center font-display text-2xl text-gold">
          {state.players[state.winner]?.name || 'A player'} wins
          {state.scores ? ` with ${state.scores[state.winner]} points` : ''}.
        </p>
      )}

      {!!state.log?.length && (
        <ol className="text-xs text-ink/60 space-y-0.5 max-h-28 overflow-auto">
          {state.log.slice(-8).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
