// Breakthrough cards deck and rules for Pioneer
// 25 cards: 14 Guard, 2 Rich Yield, 2 Trade Dominance, 2 Road Building, 5 Charters

export const CARD_DEFINITIONS = {
  guard: {
    type: 'guard',
    title: 'Guard',
    description: 'Move the Bandit to a new hex and steal 1 resource from an adjacent player.',
    isCharter: false,
    vp: 0,
  },
  rich_yield: {
    type: 'rich_yield',
    title: 'Rich Yield',
    description: 'Take any 2 resource cards of your choice from the Bank.',
    isCharter: false,
    vp: 0,
  },
  trade_dominance: {
    type: 'trade_dominance',
    title: 'Trade Dominance',
    description: 'Name 1 resource. All other players must give you all cards of that resource they hold.',
    isCharter: false,
    vp: 0,
  },
  road_building: {
    type: 'road_building',
    title: 'Road Building',
    description: 'Place 2 new roads at no cost obeying normal connectivity rules.',
    isCharter: false,
    vp: 0,
  },
  forum: {
    type: 'charter',
    charterId: 'forum',
    title: 'Charter: Forum',
    description: '1 Victory Point. Remains hidden until declaring victory.',
    isCharter: true,
    vp: 1,
  },
  archive: {
    type: 'charter',
    charterId: 'archive',
    title: 'Charter: Archive',
    description: '1 Victory Point. Remains hidden until declaring victory.',
    isCharter: true,
    vp: 1,
  },
  exchange: {
    type: 'charter',
    charterId: 'exchange',
    title: 'Charter: Exchange',
    description: '1 Victory Point. Remains hidden until declaring victory.',
    isCharter: true,
    vp: 1,
  },
  academy: {
    type: 'charter',
    charterId: 'academy',
    title: 'Charter: Academy',
    description: '1 Victory Point. Remains hidden until declaring victory.',
    isCharter: true,
    vp: 1,
  },
  keep: {
    type: 'charter',
    charterId: 'keep',
    title: 'Charter: Keep',
    description: '1 Victory Point. Remains hidden until declaring victory.',
    isCharter: true,
    vp: 1,
  },
};

export function createBreakthroughDeck(rand = Math.random) {
  const cards = [];
  for (let i = 0; i < 14; i += 1) cards.push(`guard_${i}`);
  cards.push('rich_yield_0', 'rich_yield_1');
  cards.push('trade_dominance_0', 'trade_dominance_1');
  cards.push('road_building_0', 'road_building_1');
  cards.push('forum_0', 'archive_0', 'exchange_0', 'academy_0', 'keep_0');

  // Shuffle
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function cardTypeFromId(cardId) {
  if (!cardId) return null;
  if (cardId.startsWith('guard_')) return 'guard';
  if (cardId.startsWith('rich_yield_')) return 'rich_yield';
  if (cardId.startsWith('trade_dominance_')) return 'trade_dominance';
  if (cardId.startsWith('road_building_')) return 'road_building';
  if (cardId.startsWith('forum_')) return 'forum';
  if (cardId.startsWith('archive_')) return 'archive';
  if (cardId.startsWith('exchange_')) return 'exchange';
  if (cardId.startsWith('academy_')) return 'academy';
  if (cardId.startsWith('keep_')) return 'keep';
  return null;
}

export function getCardDef(cardId) {
  const type = cardTypeFromId(cardId);
  return type ? CARD_DEFINITIONS[type] : null;
}
