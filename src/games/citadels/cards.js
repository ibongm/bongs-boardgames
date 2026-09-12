function copies(id, name, type, cost, count, extra = {}) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${id}-${i + 1}`,
    name,
    type,
    cost,
    unique: type === 'unique',
    ...extra,
  }));
}

export const BASIC_CARDS = [
  ...copies('manor', 'Manor', 'noble', 3, 5),
  ...copies('castle', 'Castle', 'noble', 4, 4),
  ...copies('palace', 'Palace', 'noble', 5, 3),
  ...copies('temple', 'Temple', 'religious', 1, 3),
  ...copies('church', 'Church', 'religious', 2, 3),
  ...copies('monastery', 'Monastery', 'religious', 3, 3),
  ...copies('cathedral', 'Cathedral', 'religious', 5, 2),
  ...copies('tavern', 'Tavern', 'trade', 1, 5),
  ...copies('market', 'Market', 'trade', 2, 4),
  ...copies('trading-post', 'Trading Post', 'trade', 2, 3),
  ...copies('docks', 'Docks', 'trade', 3, 3),
  ...copies('harbor', 'Harbor', 'trade', 4, 3),
  ...copies('town-hall', 'Town Hall', 'trade', 5, 2),
  ...copies('watchtower', 'Watchtower', 'military', 1, 3),
  ...copies('prison', 'Prison', 'military', 2, 3),
  ...copies('battlefield', 'Battlefield', 'military', 3, 3),
  ...copies('fortress', 'Fortress', 'military', 5, 2),
];

export const UNIQUE_CARDS = [
  { id: 'dragon-gate', name: 'Dragon Gate', type: 'unique', cost: 6, unique: true, scoreAs: 8 },
  { id: 'factory', name: 'Factory', type: 'unique', cost: 5, unique: true },
  { id: 'haunted-quarter', name: 'Haunted Quarter', type: 'unique', cost: 2, unique: true },
  { id: 'imperial-treasury', name: 'Imperial Treasury', type: 'unique', cost: 5, unique: true },
  { id: 'keep', name: 'Keep', type: 'unique', cost: 3, unique: true, indestructible: true },
  { id: 'laboratory', name: 'Laboratory', type: 'unique', cost: 5, unique: true },
  { id: 'library', name: 'Library', type: 'unique', cost: 6, unique: true },
  { id: 'map-room', name: 'Map Room', type: 'unique', cost: 5, unique: true },
  { id: 'quarry', name: 'Quarry', type: 'unique', cost: 5, unique: true },
  { id: 'school-of-magic', name: 'School of Magic', type: 'unique', cost: 6, unique: true },
  { id: 'smithy', name: 'Smithy', type: 'unique', cost: 5, unique: true },
  { id: 'statue', name: 'Statue', type: 'unique', cost: 3, unique: true },
  { id: 'thieves-den', name: "Thieves' Den", type: 'unique', cost: 6, unique: true },
  { id: 'wishing-well', name: 'Wishing Well', type: 'unique', cost: 5, unique: true },
];

export const ALL_CARDS = [...BASIC_CARDS, ...UNIQUE_CARDS];

const BY_ID = Object.fromEntries(ALL_CARDS.map((card) => [card.id, card]));

export function cardById(id) {
  return BY_ID[id] || null;
}

export function firstGameDeck() {
  return ALL_CARDS.map((card) => card.id);
}

export function displayName(id) {
  return cardById(id)?.name || id;
}
