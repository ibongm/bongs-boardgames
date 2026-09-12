import Modal from '../../components/Modal.jsx';
import { cardById, displayName } from './cards.js';
import { names } from './names.js';
import { DISTRICT_TEXT, ROLE_TEXT, stemOf } from './info.js';
import { DistrictPicture, RolePicture } from './Art.jsx';
import { buildCost } from './engine.js';
import { scoreBreakdown } from './score.js';

function typeTone(type) {
  return (
    {
      noble: '#c4a35a',
      religious: '#4a6fa5',
      trade: '#2f6b4f',
      military: '#a3543a',
      unique: '#6b4a8a',
    }[type] || '#6366f1'
  );
}

export default function Inspect({ inspect, onClose, onOpen, state, viewerSeat, actions, onAction }) {
  if (!inspect) return null;

  if (inspect.kind === 'role') {
    const roleId = inspect.roleId;
    const info = ROLE_TEXT[roleId];
    const faceup = state.faceupDiscard?.includes(roleId);
    const holder = state.players.find((p) => p.roleRevealed && p.roleId === roleId);
    return (
      <Modal title={names.roles[roleId] || 'Character'} open onClose={onClose}>
        <RolePicture roleId={roleId} className="w-48 mx-auto" />
        <p className="mt-3 text-xs uppercase tracking-wide text-ink/60">Rank {info?.rank || '—'}</p>
        <p className="mt-2">{info?.text}</p>
        {faceup && <p className="mt-3 text-ink/70">Discarded face up this round. Nobody drafted this character.</p>}
        {holder && <p className="mt-3 text-ink/70">Revealed: {holder.name}.</p>}
        {!faceup && !holder && <p className="mt-3 text-ink/70">Still hidden until this rank is called.</p>}
      </Modal>
    );
  }

  if (inspect.kind === 'card') {
    const card = cardById(inspect.cardId);
    if (!card) return null;
    const stem = stemOf(inspect.cardId);
    const cost = state ? buildCost(state, viewerSeat, inspect.cardId) : card.cost;
    const footer = [];
    if (inspect.build && onAction) {
      footer.push(
        <button
          key="build"
          type="button"
          className="bg-gold text-cream font-semibold rounded-md px-3 py-2 min-h-11"
          onClick={() => {
            onAction(inspect.build);
            onClose();
          }}
        >
          Build for {cost} gold
        </button>
      );
    }
    if (inspect.lab && onAction) {
      footer.push(
        <button
          key="lab"
          type="button"
          className="border border-gold/40 text-ink rounded-md px-3 py-2 min-h-11"
          onClick={() => {
            onAction(inspect.lab);
            onClose();
          }}
        >
          Laboratory: discard for 2 gold
        </button>
      );
    }
    if (inspect.destroy && onAction) {
      footer.push(
        <button
          key="destroy"
          type="button"
          className="border border-gold/40 text-ink rounded-md px-3 py-2 min-h-11"
          onClick={() => {
            onAction(inspect.destroy);
            onClose();
          }}
        >
          Destroy
        </button>
      );
    }
    return (
      <Modal title={card.name} open onClose={onClose} footer={footer.length ? footer : undefined}>
        <DistrictPicture stem={stem} type={card.type} className="w-48 mx-auto" />
        <p className="mt-3 text-xs uppercase tracking-wide font-semibold" style={{ color: typeTone(card.type) }}>
          {names.types[card.type]} · {card.cost} gold to build
          {card.scoreAs ? ` · scores ${card.scoreAs}` : ''}
        </p>
        <p className="mt-2">{DISTRICT_TEXT[stem] || `${card.name} is a ${names.types[card.type]} district.`}</p>
      </Modal>
    );
  }

  if (inspect.kind === 'seat') {
    const seat = inspect.seat;
    const p = state.players[seat];
    if (!p) return null;
    const you = seat === viewerSeat;
    const sheet = state.phase === 'gameover' ? scoreBreakdown(state, seat) : null;
    return (
      <Modal title={p.name || `Seat ${seat + 1}`} open onClose={onClose}>
        <p className="text-ink/70">
          {you ? 'You' : 'Player'}
          {state.crownSeat === seat ? ' · holds the crown' : ''}
          {p.roleRevealed && p.roleId ? ` · ${names.roles[p.roleId]}` : ' · character hidden'}
        </p>
        <p className="mt-2">
          {p.gold} gold · {p.hand?.length || 0} cards in hand · {p.city.length} districts
        </p>
        <p className="mt-4 text-xs uppercase tracking-wide text-ink/60">City</p>
        {p.city.length ? (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {p.city.map((id, districtIndex) => {
              const card = cardById(id);
              const destroy = actions.find((a) => a.type === 'warlordDestroy' && a.seat === seat && a.districtIndex === districtIndex);
              return (
                <button
                  key={`${id}-${districtIndex}`}
                  type="button"
                  className="text-left rounded-md border border-gold/20 bg-felt-deep p-1"
                  onClick={() =>
                    onOpen({
                      kind: 'card',
                      cardId: id,
                      destroy: destroy || null,
                    })
                  }
                >
                  <DistrictPicture stem={stemOf(id)} type={card?.type} className="w-full" />
                  <span className="block mt-1 text-xs font-semibold text-ink truncate">{displayName(id)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-ink/60">Empty city.</p>
        )}
        {sheet && (
          <>
            <p className="mt-4 text-xs uppercase tracking-wide text-ink/60">Score</p>
            <ul className="mt-1 space-y-0.5 text-sm text-ink/80">
              {sheet.lines.map((line, i) => (
                <li key={`${line.label}-${i}`} className="flex justify-between gap-3">
                  <span>
                    {line.label}
                    {line.note ? <span className="text-ink/55"> · {line.note}</span> : null}
                  </span>
                  <span className="font-semibold text-ink">{line.points}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 font-semibold text-ink pt-1">
                <span>Total</span>
                <span>{sheet.total}</span>
              </li>
            </ul>
          </>
        )}
        {you && p.hand?.filter((id) => id !== 'hidden').length ? (
          <>
            <p className="mt-4 text-xs uppercase tracking-wide text-ink/60">Your hand</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {p.hand
                .filter((id) => id !== 'hidden')
                .map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="text-left rounded-md border border-gold/20 bg-felt-deep p-1"
                    onClick={() =>
                      onOpen({
                        kind: 'card',
                        cardId: id,
                        build: actions.find((a) => a.type === 'build' && a.cardId === id) || null,
                        lab: actions.find((a) => a.type === 'useLab' && a.cardId === id) || null,
                      })
                    }
                  >
                    <DistrictPicture stem={stemOf(id)} type={cardById(id)?.type} className="w-full" />
                    <span className="block mt-1 text-xs font-semibold text-ink truncate">{displayName(id)}</span>
                  </button>
                ))}
            </div>
          </>
        ) : null}
      </Modal>
    );
  }

  return null;
}
