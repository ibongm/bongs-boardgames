import { cardById } from './cards.js';

export function scoreBreakdown(state, seat) {
  const p = state.players[seat];
  const lines = [];
  let total = 0;
  const types = new Set();

  (p.city || []).forEach((id) => {
    const card = cardById(id);
    if (!card) return;
    const points = card.scoreAs || card.cost || 0;
    lines.push({
      label: card.name,
      points,
      note: card.scoreAs && card.scoreAs !== card.cost ? `costs ${card.cost}, scores ${card.scoreAs}` : null,
    });
    total += points;
    types.add(card.type);
  });

  const typeList = ['noble', 'religious', 'trade', 'military', 'unique'];
  const hq = (p.city || []).find((id) => cardById(id)?.name === 'Haunted Quarter');
  let hauntedAs = null;
  if (hq && types.size < 5) {
    const missing = typeList.find((t) => !types.has(t));
    if (missing) {
      const hasOtherUnique = (p.city || []).some((id) => id !== hq && cardById(id)?.type === 'unique');
      if (!hasOtherUnique) types.delete('unique');
      types.add(missing);
      hauntedAs = missing;
    }
  }

  if (types.size >= 5) {
    lines.push({
      label: 'All five district types',
      points: 3,
      note: hauntedAs ? `Haunted Quarter counted as ${hauntedAs}` : null,
    });
    total += 3;
  }

  if ((p.city || []).length >= 7) {
    const first = state.firstCompleteSeat === seat;
    lines.push({
      label: first ? 'First completed city' : 'Completed city',
      points: first ? 4 : 2,
      note: first ? 'seven districts first' : 'seven districts',
    });
    total += first ? 4 : 2;
  }

  if ((p.city || []).some((id) => cardById(id)?.name === 'Imperial Treasury')) {
    lines.push({ label: 'Imperial Treasury', points: p.gold || 0, note: `${p.gold || 0} gold left` });
    total += p.gold || 0;
  }
  if ((p.city || []).some((id) => cardById(id)?.name === 'Map Room')) {
    const cards = p.hand?.length || 0;
    lines.push({ label: 'Map Room', points: cards, note: `${cards} cards in hand` });
    total += cards;
  }
  if ((p.city || []).some((id) => cardById(id)?.name === 'Statue') && state.crownSeat === seat) {
    lines.push({ label: 'Statue', points: 5, note: 'held the crown' });
    total += 5;
  }
  if ((p.city || []).some((id) => cardById(id)?.name === 'Wishing Well')) {
    const uniques = (p.city || []).filter((id) => cardById(id)?.unique).length;
    lines.push({
      label: 'Wishing Well',
      points: uniques,
      note: `${uniques} unique district${uniques === 1 ? '' : 's'}`,
    });
    total += uniques;
  }

  if (!lines.length) lines.push({ label: 'No districts', points: 0, note: null });

  return {
    seat,
    name: p.name || `Seat ${seat + 1}`,
    total,
    lines,
    citySize: (p.city || []).length,
    gold: p.gold || 0,
    roleId: p.roleId || null,
  };
}

export function scoreSeat(state, seat) {
  return scoreBreakdown(state, seat).total;
}
