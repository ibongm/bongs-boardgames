import { useMemo, useState } from 'react';
import { cardById, displayName } from './cards.js';
import { names, ROLE_ORDER, TYPE_COLORS } from './names.js';
import { buildCost, legalActions } from './engine.js';

function typeTone(type) {
  return TYPE_COLORS[type] || '#c4a35a';
}

function CardFace({ cardId, selected, onClick, disabled, badge }) {
  const card = cardById(cardId);
  if (!card) {
    return <div className="h-16 w-12 rounded-md bg-walnut border border-gold/20" />;
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`text-left rounded-md px-2 py-1.5 min-h-11 border ${
        selected ? 'border-gold bg-gold/20' : 'border-gold/25 bg-cream'
      }`}
      style={{ minWidth: '5.5rem' }}
    >
      <span className="block text-[10px] uppercase tracking-wide" style={{ color: typeTone(card.type) }}>
        {names.types[card.type]}
      </span>
      <span className="block text-ink text-sm font-semibold leading-tight">{card.name}</span>
      <span className="block text-ink/70 text-xs">{card.cost} gold{badge ? ` · ${badge}` : ''}</span>
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
    return <p className="text-cream/60 text-sm">Citadels table</p>;
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

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {state.players.map((p, i) => (
          <div key={i} className="rounded-md bg-cream/90 px-2 py-1">
            <p className="text-[10px] text-ink/60 truncate">{p.name || `Seat ${i + 1}`}</p>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {p.city.slice(0, 4).map((id) => (
                <span key={id} className="w-3 h-3 rounded-sm" style={{ background: typeTone(cardById(id)?.type) }} />
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {ROLE_ORDER.map((roleId, index) => {
          const faceup = state.faceupDiscard?.includes(roleId);
          const holder = state.players.find((p) => p.roleRevealed && p.roleId === roleId);
          return (
            <div key={roleId} className={`rounded-md px-2 py-1 text-xs min-h-11 flex flex-col justify-center ${
              faceup ? 'bg-walnut/40 text-cream/40 line-through' : 'bg-walnut border border-gold/25 text-cream'
            }`}>
              <span className="text-gold font-mono">{index + 1}</span>
              <span>{names.roles[roleId]}</span>
              {holder && <span className="text-cream/50">{holder.name}</span>}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-cream/70">Round {state.round || 1} · {phaseLabel}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {state.players.map((p, i) => (
          <div key={i} className={`rounded-xl border p-3 ${i === actor ? 'border-gold bg-walnut' : 'border-gold/20 bg-walnut/60'}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-cream font-semibold text-sm">
                {p.name || `Seat ${i + 1}`}{i === viewerSeat ? ' · you' : ''}{state.crownSeat === i ? ' · crown' : ''}
              </p>
              <p className="text-gold text-xs">{p.gold} gold · {p.hand?.length || 0} cards{p.roleRevealed && p.roleId ? ` · ${names.roles[p.roleId]}` : ''}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.city.length ? p.city.map((id, districtIndex) => {
                const destroy = actions.find((a) => a.type === 'warlordDestroy' && a.seat === i && a.districtIndex === districtIndex);
                return (
                  <button key={id} type="button" disabled={!destroy} onClick={() => send(destroy)} className="rounded px-1.5 py-1 text-[11px] text-ink min-h-8" style={{ background: typeTone(cardById(id)?.type) }}>
                    {displayName(id)}
                  </button>
                );
              }) : <span className="text-cream/40 text-xs">Empty city</span>}
            </div>
          </div>
        ))}
      </div>
      {state.phase === 'draft' && canPlay && (
        <div className="flex flex-wrap gap-2">
          {actions.filter((a) => a.type === 'pickRole').map((action) => (
            <button key={action.roleId} type="button" className="bg-gold text-ink font-semibold rounded-md px-3 py-2 min-h-11" onClick={() => send(action)}>
              {ROLE_ORDER.indexOf(action.roleId) + 1}. {names.roles[action.roleId]}
            </button>
          ))}
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
          {actions.some((a) => a.type === 'gatherGold') && <button type="button" className="bg-gold text-ink font-semibold rounded-md px-3 py-2 min-h-11" onClick={() => send({ type: 'gatherGold' })}>Take 2 gold</button>}
          {actions.some((a) => a.type === 'gatherCards') && <button type="button" className="border border-gold/40 rounded-md px-3 py-2 min-h-11 text-cream" onClick={() => send({ type: 'gatherCards' })}>Draw cards</button>}
          {actions.some((a) => a.type === 'typeIncome') && <button type="button" className="border border-gold/40 rounded-md px-3 py-2 min-h-11 text-cream" onClick={() => send({ type: 'typeIncome' })}>District gold</button>}
          {actions.filter((a) => a.type === 'assassinKill').map((action) => (
            <button key={action.roleId} type="button" className="border border-rust/50 rounded-md px-3 py-2 min-h-11 text-cream" onClick={() => send(action)}>Kill {names.roles[action.roleId]}</button>
          ))}
          {actions.filter((a) => a.type === 'thiefRob').map((action) => (
            <button key={action.roleId} type="button" className="border border-gold/40 rounded-md px-3 py-2 min-h-11 text-cream" onClick={() => send(action)}>Rob {names.roles[action.roleId]}</button>
          ))}
          {actions.filter((a) => a.type === 'magicianSwap').map((action) => (
            <button key={action.seat} type="button" className="border border-gold/40 rounded-md px-3 py-2 min-h-11 text-cream" onClick={() => send(action)}>Swap with {state.players[action.seat]?.name || `seat ${action.seat + 1}`}</button>
          ))}
          {actions.some((a) => a.type === 'magicianRedraw') && <button type="button" className="border border-gold/40 rounded-md px-3 py-2 min-h-11 text-cream" onClick={() => send({ type: 'magicianRedraw', cardIds: you.hand.slice() })}>Redraw whole hand</button>}
          {actions.some((a) => a.type === 'useSmithy') && <button type="button" className="border border-gold/40 rounded-md px-3 py-2 min-h-11 text-cream" onClick={() => send({ type: 'useSmithy' })}>Smithy</button>}
          {actions.some((a) => a.type === 'endTurn') && <button type="button" className="bg-gold text-ink font-semibold rounded-md px-3 py-2 min-h-11" onClick={() => send({ type: 'endTurn' })}>End turn</button>}
        </div>
      )}
      {you && (
        <div>
          <p className="text-xs uppercase tracking-wide text-cream/50 mb-2">Your hand</p>
          <div className="flex flex-wrap gap-2">
            {(you.hand || []).filter((id) => id !== 'hidden').map((id) => {
              const build = actions.find((a) => a.type === 'build' && a.cardId === id);
              const lab = actions.find((a) => a.type === 'useLab' && a.cardId === id);
              const cost = buildCost(state, viewerSeat, id);
              return (
                <div key={id} className="space-y-1">
                  <CardFace cardId={id} selected={selectedHand === id} onClick={() => setSelectedHand(id)} badge={`${cost} to build`} />
                  {selectedHand === id && (
                    <div className="flex gap-1">
                      {build && <button type="button" className="bg-gold text-ink text-xs rounded px-2 py-1 min-h-8" onClick={() => send(build)}>Build</button>}
                      {lab && <button type="button" className="border border-gold/40 text-cream text-xs rounded px-2 py-1 min-h-8" onClick={() => send(lab)}>Lab</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {state.phase === 'gameover' && (
        <p className="text-center font-display text-2xl text-gold">{state.players[state.winner]?.name || 'A player'} wins{state.scores ? ` with ${state.scores[state.winner]} points` : ''}.</p>
      )}
    </div>
  );
}
