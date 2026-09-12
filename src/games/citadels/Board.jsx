import { useMemo, useState } from 'react';
import { cardById, displayName } from './cards.js';
import { names, ROLE_ORDER, TYPE_COLORS } from './names.js';
import { buildCost, legalActions } from './engine.js';
import { scoreBreakdown } from './score.js';
import { stemOf } from './info.js';
import { DistrictPicture, RolePicture } from './Art.jsx';
import Inspect from './Inspect.jsx';

function typeTone(type) {
  return TYPE_COLORS[type] || '#6366f1';
}

function CardFace({ cardId, onClick, badge }) {
  const card = cardById(cardId);
  if (!card) {
    return <div className="h-24 w-16 rounded-md bg-felt-deep border border-gold/20" />;
  }
  return (
    <button type="button" onClick={onClick} className="text-left rounded-md border border-gold/20 bg-felt-deep p-1 min-w-[4.6rem]">
      <DistrictPicture stem={stemOf(cardId)} type={card.type} className="w-16 mx-auto" />
      <span className="block mt-1 text-[10px] uppercase tracking-wide font-semibold" style={{ color: typeTone(card.type) }}>
        {names.types[card.type]}
      </span>
      <span className="block text-ink text-xs font-semibold leading-tight">{card.name}</span>
      <span className="block text-ink/60 text-[11px]">
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

function sheetsOf(state) {
  if (state.scoreSheets?.length) return state.scoreSheets;
  if (!state.players) return [];
  return state.players.map((_, seat) => scoreBreakdown(state, seat));
}

function Scoreboard({ state }) {
  const sheets = sheetsOf(state)
    .slice()
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.seat - b.seat;
    });
  return (
    <section className="rounded-2xl border border-gold/30 bg-walnut p-4 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/55">Final scores</p>
        <p className="font-display text-2xl text-gold">
          {state.players[state.winner]?.name || 'A player'} wins with {state.scores?.[state.winner] ?? sheets[0]?.total} points
        </p>
        <p className="text-sm text-ink/70 mt-1">District values, then bonuses. Ties go to the higher character rank this round.</p>
      </div>
      <ol className="space-y-3">
        {sheets.map((sheet, place) => {
          const won = sheet.seat === state.winner;
          return (
            <li key={sheet.seat} className={`rounded-xl border p-3 ${won ? 'border-gold bg-felt-deep' : 'border-gold/15 bg-felt-deep/50'}`}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-ink">
                  {place + 1}. {sheet.name}
                  {won ? ' · winner' : ''}
                  {sheet.roleId ? ` · ${names.roles[sheet.roleId]}` : ''}
                </p>
                <p className="font-display text-xl text-gold">{sheet.total}</p>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {sheet.lines.map((line, i) => (
                  <li key={`${line.label}-${i}`} className="flex justify-between gap-3 text-ink/80">
                    <span>
                      {line.label}
                      {line.note ? <span className="text-ink/55"> · {line.note}</span> : null}
                    </span>
                    <span className="font-semibold text-ink shrink-0">
                      {line.points > 0 ? '+' : ''}
                      {line.points}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
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
  const acting = state.players[actor];
  const over = state.phase === 'gameover';

  function send(action) {
    if (!canPlay || !action) return;
    setInspect(null);
    onMove(action);
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {state.players.map((p, i) => (
          <div key={i} className="rounded-md bg-felt-deep px-2 py-1 border border-gold/15">
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

  const phaseHint = {
    draft: canPlay ? 'Pick a character from the list below.' : `${acting?.name || 'A player'} is choosing a character.`,
    gather: canPlay ? 'Take 2 gold, or draw district cards.' : `${acting?.name || 'A player'} is gathering gold or cards.`,
    chooseCard: canPlay ? 'Keep one of the cards you drew.' : `${acting?.name || 'A player'} is choosing a card.`,
    main: canPlay ? 'Build, use an ability, or end the turn.' : `${acting?.name || 'A player'} is taking their turn.`,
    gameover: 'Cities are scored. Open a district to read it.',
  }[state.phase] || state.phase;

  const phaseTitle = {
    draft: 'Draft characters',
    gather: 'Gather',
    chooseCard: 'Keep a card',
    main: acting?.roleRevealed && acting?.roleId ? names.roles[acting.roleId] : 'Take your turn',
    gameover: 'Game over',
  }[state.phase] || state.phase;

  const currentRank = state.rankCalled || 0;

  const youBlock = (
    <>
      {you && !over && (
        <section>
          <p className="text-[11px] uppercase tracking-wide text-ink/55 mb-1">
            Your hand · {you.gold} gold
            {you.roleId ? ` · ${names.roles[you.roleId]}` : ''}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
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
        </section>
      )}
      {state.phase === 'draft' && canPlay && (
        <section className="rounded-xl border border-gold/25 bg-walnut p-2">
          <p className="text-sm font-semibold text-ink mb-2">Choose your character</p>
          <div className="flex flex-wrap gap-2">
            {actions
              .filter((a) => a.type === 'pickRole')
              .map((action) => (
                <button key={action.roleId} type="button" className="bg-gold text-cream font-semibold rounded-md px-3 py-2 min-h-11" onClick={() => send(action)}>
                  {ROLE_ORDER.indexOf(action.roleId) + 1}. {names.roles[action.roleId]}
                </button>
              ))}
          </div>
        </section>
      )}
      {state.phase === 'chooseCard' && canPlay && (
        <section className="rounded-xl border border-gold/25 bg-walnut p-2">
          <p className="text-sm font-semibold text-ink mb-2">Keep one card. The other goes under the deck.</p>
          <div className="flex flex-wrap gap-2">
            {(state.pendingDraw || []).map((id, keepIndex) => (
              <div key={id} className="space-y-1">
                <CardFace cardId={id} onClick={() => setInspect({ kind: 'card', cardId: id })} />
                <button type="button" className="bg-gold text-cream text-xs font-semibold rounded px-2 py-1 min-h-8 w-full" onClick={() => send({ type: 'keepDrawn', keepIndex })}>
                  Keep
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {canPlay && (state.phase === 'gather' || state.phase === 'main') && (
        <section className="rounded-xl border border-gold/25 bg-walnut p-2 space-y-2">
          <p className="text-sm font-semibold text-ink">{state.phase === 'gather' ? 'Gather first' : 'Your actions'}</p>
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
              <OutlineButton onClick={() => send({ type: 'typeIncome' })}>Gold from your districts</OutlineButton>
            )}
            {actions.filter((a) => a.type === 'assassinKill').map((action) => (
              <OutlineButton key={action.roleId} onClick={() => send(action)}>Kill {names.roles[action.roleId]}</OutlineButton>
            ))}
            {actions.filter((a) => a.type === 'thiefRob').map((action) => (
              <OutlineButton key={action.roleId} onClick={() => send(action)}>Rob {names.roles[action.roleId]}</OutlineButton>
            ))}
            {actions.filter((a) => a.type === 'magicianSwap').map((action) => (
              <OutlineButton key={action.seat} onClick={() => send(action)}>Swap hand with {state.players[action.seat]?.name || `seat ${action.seat + 1}`}</OutlineButton>
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
          {state.phase === 'main' && <p className="text-xs text-ink/60">Tap a card in your hand to build it.</p>}
        </section>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3 text-ink">
      {over && <Scoreboard state={state} />}
      {!over && (
        <section className="rounded-xl border border-gold/25 bg-walnut p-2">
          <p className="text-[11px] uppercase tracking-wide text-ink/55">
            Round {state.round || 1}
            {canPlay ? ' · your turn' : acting ? ` · ${acting.name}` : ''}
            {state.crownSeat === viewerSeat ? ' · crown' : ''}
          </p>
          <p className="font-display text-xl text-gold leading-tight">{phaseTitle}</p>
          <p className="text-sm text-ink/80">{phaseHint}</p>
        </section>
      )}
      <div className="order-2 sm:order-4 sticky bottom-0 z-20 -mx-3 px-3 py-2 bg-rust/95 backdrop-blur-sm border-t border-gold/15 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:border-0 space-y-2">
        {youBlock}
      </div>
      <section className="order-3 sm:order-2">
        <p className="text-[11px] uppercase tracking-wide text-ink/55 mb-1">Characters</p>
        <div className="grid grid-cols-4 gap-1">
          {ROLE_ORDER.map((roleId, index) => {
            const rank = index + 1;
            const faceup = state.faceupDiscard?.includes(roleId);
            const holder = state.players.find((p) => p.roleRevealed && p.roleId === roleId);
            const killed = state.killedRole === roleId;
            const current = !over && currentRank === rank && state.phase !== 'draft';
            let status = '';
            if (faceup) status = 'out';
            else if (killed && !holder) status = 'killed';
            else if (holder) status = holder.name;
            else if (current) status = 'now';
            return (
              <button
                key={roleId}
                type="button"
                onClick={() => setInspect({ kind: 'role', roleId })}
                className={`rounded-md p-1 text-[10px] leading-tight flex flex-col items-center border text-center ${
                  current
                    ? 'bg-gold text-cream border-gold'
                    : faceup || killed
                      ? 'bg-felt-deep/40 border-gold/15 text-ink/40'
                      : holder
                        ? 'bg-gold/15 border-gold text-ink'
                        : 'bg-felt-deep border-gold/20 text-ink'
                }`}
              >
                <RolePicture roleId={roleId} className="w-full max-w-[3.2rem]" />
                <span className={`font-mono font-semibold ${current ? 'text-cream' : 'text-gold'}`}>{rank}</span>
                <span className={`font-semibold truncate w-full ${faceup ? 'line-through' : ''}`}>{names.roles[roleId]}</span>
                {status ? <span className="truncate w-full">{status}</span> : <span className="text-ink/40">—</span>}
              </button>
            );
          })}
        </div>
      </section>
      <section className="order-4 sm:order-3">
        <p className="text-[11px] uppercase tracking-wide text-ink/55 mb-1">Cities</p>
        <div className="grid grid-cols-2 gap-2">
          {state.players.map((p, i) => {
            const now = !over && i === actor;
            return (
              <div key={i} className={`rounded-lg border p-2 ${now ? 'border-gold bg-felt-deep col-span-2' : 'border-gold/15 bg-felt-deep/40'}`}>
                <button type="button" className="w-full text-left" onClick={() => setInspect({ kind: 'seat', seat: i })}>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-ink font-semibold text-xs leading-tight">
                      {p.name || `Seat ${i + 1}`}
                      {i === viewerSeat ? ' · you' : ''}
                      {state.crownSeat === i ? ' · crown' : ''}
                    </p>
                    {now && <span className="text-[9px] uppercase tracking-wide bg-gold text-cream rounded-full px-1.5 py-0.5">Now</span>}
                    {over && i === state.winner && (
                      <span className="text-[9px] uppercase tracking-wide bg-gold text-cream rounded-full px-1.5 py-0.5">Won</span>
                    )}
                  </div>
                  <p className="text-ink/70 text-[11px] mt-0.5">
                    {p.gold}g · {p.hand?.length || 0} cards · {p.city.length} built
                    {p.roleRevealed && p.roleId ? ` · ${names.roles[p.roleId]}` : ''}
                    {over && state.scores ? ` · ${state.scores[i]}` : ''}
                  </p>
                </button>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.city.length ? (
                    p.city.map((id, districtIndex) => {
                      const card = cardById(id);
                      const destroy = actions.find((a) => a.type === 'warlordDestroy' && a.seat === i && a.districtIndex === districtIndex);
                      return (
                        <button
                          key={`${id}-${districtIndex}`}
                          type="button"
                          onClick={() => setInspect({ kind: 'card', cardId: id, destroy: destroy || null })}
                          className="rounded border border-gold/15 bg-felt-deep w-10 p-0 text-left"
                          title={displayName(id)}
                        >
                          <DistrictPicture stem={stemOf(id)} type={card?.type} />
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-ink/45 text-[11px]">Empty</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {!!state.log?.length && (
        <details className="order-5 text-xs text-ink/60">
          <summary className="cursor-pointer text-ink/70">Recent events</summary>
          <ol className="mt-1 space-y-0.5 max-h-28 overflow-auto">
            {state.log.slice(-10).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </details>
      )}
      <Inspect inspect={inspect} onClose={() => setInspect(null)} onOpen={setInspect} state={state} viewerSeat={viewerSeat} actions={actions} onAction={send} />
    </div>
  );
}
