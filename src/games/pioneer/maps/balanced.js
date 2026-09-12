// Fixed Balanced Isle layout (beginner layout) for Pioneer
// 19 hexes with fixed terrain and numbers, 9 trading posts, 4 printed start pairs

export const RESOURCE_TYPES = ['wood', 'clay', 'sheep', 'wheat', 'stone'];

export const TERRAIN_TO_RESOURCE = {
  forest: 'wood',
  hills: 'clay',
  pasture: 'sheep',
  fields: 'wheat',
  mountains: 'stone',
  desert: null,
};

export const NUMBER_PIPS = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

// 19 hexes in row-major order
export const BALANCED_HEX_SPECS = [
  // Row 0 (3)
  { terrain: 'mountains', number: 10 },
  { terrain: 'pasture', number: 2 },
  { terrain: 'forest', number: 9 },
  // Row 1 (4)
  { terrain: 'fields', number: 12 },
  { terrain: 'hills', number: 6 },
  { terrain: 'pasture', number: 4 },
  { terrain: 'hills', number: 10 },
  // Row 2 (5)
  { terrain: 'fields', number: 9 },
  { terrain: 'forest', number: 11 },
  { terrain: 'desert', number: null },
  { terrain: 'forest', number: 3 },
  { terrain: 'mountains', number: 8 },
  // Row 3 (4)
  { terrain: 'forest', number: 8 },
  { terrain: 'mountains', number: 3 },
  { terrain: 'fields', number: 4 },
  { terrain: 'pasture', number: 5 },
  // Row 4 (3)
  { terrain: 'hills', number: 5 },
  { terrain: 'fields', number: 6 },
  { terrain: 'pasture', number: 11 },
];

export const BALANCED_TRADING_POST_SPECS = [
  { postId: 'post_0', type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
  { postId: 'post_1', type: 'special', ratio: 2, resource: 'sheep', name: '2:1 Sheep Post' },
  { postId: 'post_2', type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
  { postId: 'post_3', type: 'special', ratio: 2, resource: 'wood', name: '2:1 Wood Post' },
  { postId: 'post_4', type: 'special', ratio: 2, resource: 'stone', name: '2:1 Stone Post' },
  { postId: 'post_5', type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
  { postId: 'post_6', type: 'special', ratio: 2, resource: 'wheat', name: '2:1 Wheat Post' },
  { postId: 'post_7', type: 'special', ratio: 2, resource: 'clay', name: '2:1 Clay Post' },
  { postId: 'post_8', type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
];

// Printed starting pairs for up to 4 seats
export const BALANCED_STARTS = [
  {
    seat: 0,
    settlement1: 'int_8',
    road1: 'path_7',
    settlement2: 'int_48',
    road2: 'path_63',
    starred: 'int_8',
  },
  {
    seat: 1,
    settlement1: 'int_22',
    road1: 'path_24',
    settlement2: 'int_36',
    road2: 'path_45',
    starred: 'int_22',
  },
  {
    seat: 2,
    settlement1: 'int_40',
    road1: 'path_51',
    settlement2: 'int_5',
    road2: 'path_3',
    starred: 'int_40',
  },
  {
    seat: 3,
    settlement1: 'int_26',
    road1: 'path_32',
    settlement2: 'int_43',
    road2: 'path_54',
    starred: 'int_26',
  },
];
