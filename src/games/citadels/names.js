export const names = {
  game: 'Citadels',
  crown: 'Crown',
  crowned: 'crowned player',
  gold: 'gold',
  district: 'district',
  city: 'city',
  character: 'character',
  roles: {
    assassin: 'Assassin',
    thief: 'Thief',
    magician: 'Magician',
    king: 'King',
    bishop: 'Bishop',
    merchant: 'Merchant',
    architect: 'Architect',
    warlord: 'Warlord',
  },
  types: {
    noble: 'Noble',
    religious: 'Religious',
    trade: 'Trade',
    military: 'Military',
    unique: 'Unique',
  },
};

export const ROLE_ORDER = [
  'assassin',
  'thief',
  'magician',
  'king',
  'bishop',
  'merchant',
  'architect',
  'warlord',
];

export const ROLE_RANK = Object.fromEntries(ROLE_ORDER.map((id, index) => [id, index + 1]));

export const TYPE_COLORS = {
  noble: '#c4a35a',
  religious: '#4a6fa5',
  trade: '#2f6b4f',
  military: '#a3543a',
  unique: '#6b4a8a',
};
