import { createState } from './engine.js';

function createPreviewState() {
  const s = createState({ seatCount: 4, mapId: 'map_balanced' });
  s.phase = 'main';
  s.turn = 0;
  s.actorSeat = 0;
  s.dice = [3, 5];
  s.longestRouteSeat = 0;
  if (s.players?.[0]) {
    s.players[0].name = 'You';
    s.players[0].resources = { wood: 2, clay: 1, sheep: 1, wheat: 1, stone: 0 };
    s.players[0].victoryPoints = 4;
    s.players[0].publicVP = 4;
    s.players[0].cardCount = 5;
    s.players[0].playedGuards = 1;
    s.players[0].routeLength = 5;
    s.players[0].hiddenCards = ['guard'];
  }
  return s;
}

export const meta = {
  id: 'pioneer',
  title: 'Pioneer',
  seats: 4,
  seatsMin: 3,
  seatsMax: 4,
  disconnectMs: 45000,
  colors: ['#c2410c', '#1d4ed8', '#d97706', '#15803d'],
  colorNames: ['Amber', 'Sapphire', 'Topaz', 'Emerald'],
  colorSymbols: ['●', '■', '▲', '◆'],
  previewState: createPreviewState(),
};
