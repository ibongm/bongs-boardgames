import { useMemo, useState } from 'react';
import { cardById, displayName } from './cards.js';
import { names, ROLE_ORDER, TYPE_COLORS } from './names.js';
import { buildCost, legalActions } from './engine.js';
import { stemOf } from './info.js';
import { DistrictPicture, RolePicture } from './Art.jsx';
import Inspect from './Inspect.jsx';

function typeTone(type) {
  return TYPE_COLORS[type] || '#6b1c28';
}

function CardFace({ cardId, onClick, badge }) {
  const card = cardById(cardId);
  if (!card) {
    return <div className="h-24 w-16 rounded-md bg-cream border border-gold/25" />;
  }
  return (
    <button type="button" onClick={onClick} className="text-left rounded-md border border-gold/25 bg-cream p-1 min-w-[4.6rem]">
      <DistrictPicture stem={stemOf(cardId)} type={card.type} className="w-16 mx-auto" />
      <span className="block mt-1 text-[10px] uppercase tracking-wide font-semibold" style={{ color: typeTone(card.type) }}>
        {names.types[card.type]}
      </span>
      <span className="block text-ink text-xs font-semibold leading-tight">{card.name}</span>
      <span className="block text-ink/70 text-[11px]">
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
  const [inspect, setInspect] = useState(null);
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
    setInspect(null);
    onMove(action);
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {state.players.map((p, i) => (
          <div key={i} className="rounded-md bg-cream px-2 py-1 border border-gold/15">
            <p className="text-[10px] text-ink/70 truncate">{p.name || `Seat ${i + 1}`}</p>
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
    <div className="space-y-4 text-ink">
      <div className="flex flex-wrap gap-1">
        {ROLE_ORDER.map((roleId, index) => {
          const faceup = state.faceupDiscard?.includes(roleId);
          const holder = state.players.find((p) => p.roleRevealed && p.roleId === roleId);
          const called = state.rankCalled > index + 1 || holder;
          return (
            <button
              key={roleId}
              type="button"
              onClick={() => setInspect({ kind: 'role', roleId })}
              className={`rounded-md px-2 py-1 text-xs min-h-11 flex items-center gap-2 border text-left ${
                faceup
                  ? 'bg-cream border-gold/20 text-ink/60'
                  : holder
                    ? 'bg-gold/10 border-gold text-ink'
                    : 'bg-cream border-gold/25 text-ink'
              }`}
            >
              <RolePicture roleId={roleId} className="w-8 shrink-0" />
              <span className="flex flex-col justify-center">
                <span className="font-mono font-semibold text-gold">{index + 1}</span>
                <span className={`font-semibold ${faceup ? 'line-through' : ''}`}>{names.roles[roleId]}</span>
                {faceup && <span className="text-ink/50">discarded</span>}
                {holder && <span className="text-ink/70">{holder.name}</span>}
                {!faceup && !holder && called && state.killedRole === roleId && <span className="text-ink/50">killed</span>}
              </span>
            </button>
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
            className={`rounded-xl border p-3 ${i === actor ? 'border-gold bg-cream' : 'border-gold/20 bg-cream/70'}`}
          >
            <button type="button" className="w-full text-left" onClick={() => setInspect({ kind: 'seat', seat: i })}>
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
            </button>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.city.length ? (
                p.city.map((id, districtIndex) => {
                  const destroy = actions.find((a) => a.type === 'warlordDestroy' && a.seat === i && a.districtIndex === districtIndex);
                  return (
                    <button
                      key={`${id}-${districtIndex}`}
                      type="button"
                      onClick={() => setInspect({ kind: 'card', cardId: id, destroy: destroy || null })}
                      className="rounded overflow-hidden border border-gold/20 bg-cream w-12"
                      title={displayName(id)}
                    >
                      <DistrictPicture stem={stemOf(id)} type={cardById(id)?.type} />
                    </button>
                  );
                })
              ) : (
                <button type="button" className="text-ink/50 text-xs" onClick={() => setInspect({ kind: 'seat', seat: i })}>
                  Empty city · view seat
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {state.phase === 'draft' && canPlay && (
        <div>
          <p className="text-sm text-ink/80 mb-2">Pick a character. Tap a portrait for its ability first if you want.</p>
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
            <div key={id} className="space-y-1">
              <CardFace cardId={id} onClick={() => setInspect({ kind: 'card', cardId: id })} />
              <button
                type="button"
                className="bg-gold text-cream text-xs font-semibold rounded px-2 py-1 min-h-8 w-full"
                onClick={() => send({ type: 'keepDrawn', keepIndex })}
              >
                Keep
              </button>
            </div>
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
            <OutlineButton onClick={() => send({ type: 'magicianRedraw', cardIds: you.hand.slice() })}>Redraw whole hand</OutlineButton>
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
            {(you.hand || [])
              .filter((id) => id !== 'hidden')
              .map((id) => {
                const build = actions.find((a) => a.type === 'build' && a.cardId === id);
                const lab = actions.find((a) => a.type === 'useLab' && a.cardId === id);
                const cost = buildCost(state, viewerSeat, id);
                return (
                  <CardFace
                    key={id}
                    cardId={id}
                    badge={`${cost} to build`}
                    onClick={() => setInspect({ kind: 'card', cardId: id, build: build || null, lab: lab || null })}
                  />
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

      <Inspect
        inspect={inspect}
        onClose={() => setInspect(null)}
        onOpen={setInspect}
        state={state}
        viewerSeat={viewerSeat}
        actions={actions}
        onAction={send}
      />
    </div>
  );
}
