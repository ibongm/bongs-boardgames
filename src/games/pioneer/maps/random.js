// Shuffled Random Isle generator for Pioneer
// Shuffles 19 terrains, 9 trading posts, 18 spiral tokens, ensures no adjacent 6 and 8

import { HEXES } from '../board.js';

export const SPIRAL_HEX_IDS = [
  'hex_0', 'hex_1', 'hex_2', 'hex_6', 'hex_11', 'hex_15',
  'hex_18', 'hex_17', 'hex_16', 'hex_12', 'hex_7', 'hex_3',
  'hex_4', 'hex_5', 'hex_10', 'hex_14', 'hex_13', 'hex_8',
  'hex_9',
];

export const STANDARD_TOKENS = [
  5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11,
];

export const BASE_TERRAINS = [
  'forest', 'forest', 'forest', 'forest',
  'pasture', 'pasture', 'pasture', 'pasture',
  'fields', 'fields', 'fields', 'fields',
  'hills', 'hills', 'hills',
  'mountains', 'mountains', 'mountains',
  'desert',
];

export const BASE_POST_TYPES = [
  { type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
  { type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
  { type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
  { type: 'generic', ratio: 3, resource: null, name: '3:1 Post' },
  { type: 'special', ratio: 2, resource: 'wood', name: '2:1 Wood Post' },
  { type: 'special', ratio: 2, resource: 'clay', name: '2:1 Clay Post' },
  { type: 'special', ratio: 2, resource: 'sheep', name: '2:1 Sheep Post' },
  { type: 'special', ratio: 2, resource: 'wheat', name: '2:1 Wheat Post' },
  { type: 'special', ratio: 2, resource: 'stone', name: '2:1 Stone Post' },
];

function shuffle(list, rand = Math.random) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function areHexesAdjacent(h1, h2) {
  const v1 = HEXES[h1]?.vertices || [];
  const v2 = HEXES[h2]?.vertices || [];
  const shared = v1.filter((v) => v2.includes(v));
  return shared.length >= 2;
}

export function createRandomMap(rand = Math.random) {
  const terrains = shuffle(BASE_TERRAINS, rand);

  // Assign terrains to spiral hexes
  const hexMap = {};
  let desertHexId = null;
  SPIRAL_HEX_IDS.forEach((hId, idx) => {
    const t = terrains[idx];
    if (t === 'desert') desertHexId = hId;
    hexMap[hId] = { id: hId, terrain: t, number: null };
  });

  // Assign number tokens along the spiral, skipping desert
  let tokenIdx = 0;
  SPIRAL_HEX_IDS.forEach((hId) => {
    if (hexMap[hId].terrain !== 'desert') {
      hexMap[hId].number = STANDARD_TOKENS[tokenIdx];
      tokenIdx += 1;
    }
  });

  // Ensure no two red numbers (6 and 8) are adjacent
  const isRed = (num) => num === 6 || num === 8;
  let swaps = 0;
  while (swaps < 50) {
    let conflictFound = false;
    for (let i = 0; i < SPIRAL_HEX_IDS.length; i += 1) {
      const hA = SPIRAL_HEX_IDS[i];
      if (!isRed(hexMap[hA].number)) continue;
      for (let j = i + 1; j < SPIRAL_HEX_IDS.length; j += 1) {
        const hB = SPIRAL_HEX_IDS[j];
        if (!isRed(hexMap[hB].number)) continue;
        if (areHexesAdjacent(hA, hB)) {
          conflictFound = true;
          // Find a non-red hex to swap with hB
          const swapTarget = SPIRAL_HEX_IDS.find(
            (cId) =>
              hexMap[cId].terrain !== 'desert' &&
              !isRed(hexMap[cId].number) &&
              !areHexesAdjacent(cId, hA)
          );
          if (swapTarget) {
            const temp = hexMap[hB].number;
            hexMap[hB].number = hexMap[swapTarget].number;
            hexMap[swapTarget].number = temp;
          }
          break;
        }
      }
      if (conflictFound) break;
    }
    if (!conflictFound) break;
    swaps += 1;
  }

  // Shuffle trading posts
  const shuffledPosts = shuffle(BASE_POST_TYPES, rand).map((post, idx) => ({
    ...post,
    postId: `post_${idx}`,
  }));

  // Convert hexMap back to ordered array
  const hexSpecs = [];
  for (let i = 0; i < 19; i += 1) {
    const hId = `hex_${i}`;
    hexSpecs.push({
      terrain: hexMap[hId].terrain,
      number: hexMap[hId].number,
    });
  }

  return {
    hexSpecs,
    tradingPostSpecs: shuffledPosts,
    banditHexId: desertHexId || 'hex_9',
  };
}
