import Modal from './Modal.jsx';
import { getGame } from '../games/registry.js';
import { resolveRules } from '../lib/gameMeta.js';

function Blocks({ text }) {
  if (!text) return null;
  return text
    .trim()
    .split(/\n\n+/)
    .map((block, index) => {
      const lines = block.split('\n');
      const titleish = lines.length > 1 && lines[0].length < 48 && !lines[0].includes('.');
      if (titleish) {
        return (
          <div key={index} className="mt-4 first:mt-0">
            <p className="font-semibold text-ink">{lines[0]}</p>
            <p className="mt-1 whitespace-pre-wrap">{lines.slice(1).join('\n')}</p>
          </div>
        );
      }
      return (
        <p key={index} className="mt-3 first:mt-0 whitespace-pre-wrap">
          {block}
        </p>
      );
    });
}

export default function RulesModal({ gameId, copy, open, onClose, matchInfo, footer }) {
  const game = getGame(gameId);
  if (!game) return null;
  const rules = resolveRules(game, copy);
  const title = copy?.title || game.meta.title;
  const minSeats = game.meta.seatsMin || game.meta.seats;
  const maxSeats = game.meta.seatsMax || game.meta.seats;
  const seatsLabel = maxSeats && maxSeats !== minSeats ? `${minSeats}–${maxSeats}` : String(game.meta.seats);

  return (
    <Modal title={`${title} rules`} open={open} onClose={onClose} footer={footer}>
      <p className="text-ink/60 text-xs uppercase tracking-wide">{seatsLabel} players</p>
      {matchInfo && (
        <div className="mt-3 rounded-xl border border-gold/20 bg-cream p-3 text-ink">
          <p className="text-xs uppercase tracking-wide text-ink/60">This match</p>
          <p className="mt-1">{matchInfo}</p>
        </div>
      )}
      <h3 className="mt-4 font-display text-lg text-gold">How to play</h3>
      <div className="mt-2">
        <Blocks text={rules.howToPlay || 'Rules have not been written for this title yet.'} />
      </div>
      {rules.details && (
        <>
          <h3 className="mt-5 font-display text-lg text-gold">Details</h3>
          <div className="mt-2">
            <Blocks text={rules.details} />
          </div>
        </>
      )}
    </Modal>
  );
}
