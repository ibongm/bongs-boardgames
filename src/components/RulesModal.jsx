import Modal from './Modal.jsx';
import { getGame } from '../games/registry.js';
import { resolveRules } from '../lib/gameMeta.js';

export default function RulesModal({ gameId, copy, open, onClose, matchInfo, footer }) {
  const game = getGame(gameId);
  if (!game) return null;
  const rules = resolveRules(game, copy);
  const title = copy?.title || game.meta.title;

  return (
    <Modal title={`${title} rules`} open={open} onClose={onClose} footer={footer}>
      <p className="text-cream/55 text-xs uppercase tracking-wide">{game.meta.seats} players</p>
      {matchInfo && (
        <div className="mt-3 rounded-xl border border-gold/20 bg-ink/40 p-3 text-cream/80">
          <p className="text-xs uppercase tracking-wide text-cream/50">This match</p>
          <p className="mt-1">{matchInfo}</p>
        </div>
      )}
      <h3 className="mt-4 font-display text-lg text-gold">How to play</h3>
      <p className="mt-2">{rules.howToPlay || 'Rules have not been written for this title yet.'}</p>
      {rules.details && (
        <>
          <h3 className="mt-5 font-display text-lg text-gold">Details</h3>
          <p className="mt-2">{rules.details}</p>
        </>
      )}
    </Modal>
  );
}
