import { cardById, firstGameDeck } from './cards.js';
import { ROLE_ORDER, ROLE_RANK } from './names.js';

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

function mulberry(seed) {
  let s = (Number(seed) >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const next = list.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function player(state, seat) {
  return state.players[seat];
}

function hasCard(city, name) {
  return city.some((id) => cardById(id)?.name === name);
}

function cityNames(city) {
  return city.map((id) => cardById(id)?.name);
}

function hasFactory(city) {
  return city.some((id) => id === 'factory' || cardById(id)?.name === 'Factory');
}

export function buildCost(state, seat, cardId) {
  const card = cardById(cardId);
  if (!card) return 99;
  let cost = card.cost;
  if (card.unique && card.name !== 'Factory' && hasFactory(player(state, seat).city)) {
    cost = Math.max(1, cost - 1);
  }
  return cost;
}

function canBuildName(state, seat, cardId) {
  const card = cardById(cardId);
  if (!card) return false;
  if (player(state, seat).city.some((id) => cardById(id)?.name === card.name)) {
    return hasCard(player(state, seat).city, 'Quarry');
  }
  return true;
}

function faceupCount(seatCount) {
  if (seatCount <= 4) return 2;
  if (seatCount === 5) return 1;
  return 0;
}

function drawFromDeck(state, n) {
  const taken = [];
  for (let i = 0; i < n; i += 1) {
    if (!state.deck.length) break;
    taken.push(state.deck.shift());
  }
  return taken;
}

function bury(state, cardIds) {
  state.deck.push(...cardIds);
}

function log(state, text) {
  state.log = [...(state.log || []).slice(-40), text];
}

function resetTurnFlags(state) {
  state.gathered = false;
  state.builtCount = 0;
  state.buildLimit = 1;
  state.abilityUsed = false;
  state.typeIncomeUsed = false;
  state.labUsed = false;
  state.smithyUsed = false;
  state.pendingDraw = null;
}

function ownerOfRole(state, roleId) {
  return state.players.findIndex((p) => p.roleId === roleId);
}

function startDraft(state) {
  const rand = mulberry(state.seed + state.round * 97);
  let pack = shuffle(ROLE_ORDER.slice(), rand);
  const faceup = [];
  const needed = faceupCount(state.seatCount);
  let guard = 0;
  while (faceup.length < needed && pack.length && guard < 20) {
    guard += 1;
    const role = pack.shift();
    if (role === 'king') {
      pack.push(role);
      pack = shuffle(pack, rand);
      continue;
    }
    faceup.push(role);
  }
  const facedown = pack.length ? [pack.shift()] : [];
  state.faceupDiscard = faceup;
  state.facedownDiscard = facedown;
  state.draftRemaining = pack;
  state.players.forEach((p) => {
    p.roleId = null;
    p.roleRevealed = false;
  });
  state.killedRole = null;
  state.stolenRole = null;
  state.rankCalled = 0;
  state.phase = 'draft';
  state.actorSeat = state.crownSeat;
  state.turn = state.actorSeat;
  resetTurnFlags(state);
  log(state, `Round ${state.round}: characters are drafted.`);
}

function beginRank(state, rank) {
  if (rank > 8) {
    if (state.killedRole === 'king') {
      const heir = ownerOfRole(state, 'king');
      if (heir >= 0) {
        state.crownSeat = heir;
        const holder = player(state, heir);
        holder.roleRevealed = true;
        log(state, `${holder.name || `Seat ${heir + 1}`} inherits the crown.`);
      }
    }
    if (state.firstCompleteSeat !== null) {
      finishGame(state);
      return;
    }
    state.round += 1;
    startDraft(state);
    return;
  }
  state.rankCalled = rank;
  const roleId = ROLE_ORDER[rank - 1];
  const seat = ownerOfRole(state, roleId);
  if (seat < 0) {
    beginRank(state, rank + 1);
    return;
  }
  if (state.killedRole === roleId) {
    log(state, `${roleId} was killed and skips the turn.`);
    beginRank(state, rank + 1);
    return;
  }
  const holder = player(state, seat);
  holder.roleRevealed = true;
  if (state.stolenRole === roleId) {
    const thiefSeat = ownerOfRole(state, 'thief');
    if (thiefSeat >= 0 && holder.gold > 0) {
      const taken = holder.gold;
      player(state, thiefSeat).gold += taken;
      holder.gold = 0;
      log(state, `The Thief steals ${taken} gold.`);
    }
  }
  state.actorSeat = seat;
  state.turn = seat;
  state.phase = 'gather';
  resetTurnFlags(state);
  if (roleId === 'architect') state.buildLimit = 3;
  if (roleId === 'king') {
    state.crownSeat = seat;
    log(state, `${holder.name || `Seat ${seat + 1}`} takes the crown.`);
  }
}

function typeCount(state, seat, type) {
  const city = player(state, seat).city;
  let n = city.filter((id) => cardById(id)?.type === type).length;
  if (city.some((id) => cardById(id)?.name === 'School of Magic')) n += 1;
  return n;
}

function applyPassiveExtras(state, seat) {
  const role = player(state, seat).roleId;
  if (role === 'merchant' && !state.merchantBonus) {
    player(state, seat).gold += 1;
    state.merchantBonus = true;
    log(state, 'Merchant gains 1 extra gold.');
  }
  if (role === 'architect' && !state.architectCards) {
    const extra = drawFromDeck(state, 2);
    player(state, seat).hand.push(...extra);
    state.architectCards = true;
    log(state, 'Architect draws 2 extra cards.');
  }
}

function finishGame(state) {
  const scores = state.players.map((_, seat) => scoreSeat(state, seat));
  state.scores = scores;
  let winner = 0;
  let best = -1;
  scores.forEach((score, seat) => {
    if (score > best) {
      best = score;
      winner = seat;
    } else if (score === best) {
      const rankA = ROLE_RANK[player(state, seat).roleId] || 0;
      const rankB = ROLE_RANK[player(state, winner).roleId] || 0;
      if (rankA > rankB) winner = seat;
    }
  });
  state.phase = 'gameover';
  state.winner = winner;
  state.draw = false;
  state.actorSeat = null;
  state.turn = winner;
  log(state, `Game over. Seat ${winner + 1} wins with ${scores[winner]} points.`);
}

export function scoreSeat(state, seat) {
  const p = player(state, seat);
  let points = 0;
  const types = new Set();
  p.city.forEach((id) => {
    const card = cardById(id);
    if (!card) return;
    points += card.scoreAs || card.cost;
    types.add(card.type);
  });
  const hq = p.city.find((id) => cardById(id)?.name === 'Haunted Quarter');
  if (hq && types.size < 5) {
    const missing = ['noble', 'religious', 'trade', 'military', 'unique'].find((t) => !types.has(t));
    if (missing) {
      const hasOtherUnique = p.city.some((id) => id !== hq && cardById(id)?.type === 'unique');
      if (!hasOtherUnique) types.delete('unique');
      types.add(missing);
    }
  }
  if (types.size >= 5) points += 3;
  if (p.city.length >= 7) points += state.firstCompleteSeat === seat ? 4 : 2;
  if (p.city.some((id) => cardById(id)?.name === 'Imperial Treasury')) points += p.gold;
  if (p.city.some((id) => cardById(id)?.name === 'Map Room')) points += p.hand.length;
  if (p.city.some((id) => cardById(id)?.name === 'Statue') && state.crownSeat === seat) points += 5;
  if (p.city.some((id) => cardById(id)?.name === 'Wishing Well')) {
    points += p.city.filter((id) => cardById(id)?.unique).length;
  }
  return points;
}

export function createState(options = {}) {
  const seatCount = Math.min(6, Math.max(4, Number(options.seatCount) || 4));
  const seed = Number(options.seed) || Date.now();
  const rand = mulberry(seed);
  let deck = shuffle(firstGameDeck(), rand);
  const players = Array.from({ length: seatCount }, (_, i) => ({
    name: options.colors?.[i] || `Seat ${i + 1}`,
    gold: 2,
    hand: deck.splice(0, 4),
    city: [],
    roleId: null,
    roleRevealed: false,
  }));
  const state = {
    revision: 0,
    seatCount,
    seed,
    round: 1,
    phase: 'draft',
    actorSeat: 0,
    turn: 0,
    crownSeat: 0,
    rankCalled: 0,
    faceupDiscard: [],
    facedownDiscard: [],
    draftRemaining: [],
    deck,
    players,
    killedRole: null,
    stolenRole: null,
    firstCompleteSeat: null,
    winner: null,
    draw: false,
    log: [],
    scores: null,
    merchantBonus: false,
    architectCards: false,
    pendingDraw: null,
  };
  startDraft(state);
  return state;
}

export function actorSeatOf(state) {
  return state.actorSeat;
}

function assertActor(state, actorSeat) {
  if (state.phase === 'gameover') throw new Error('Game over');
  if (state.actorSeat !== actorSeat) throw new Error('Not your turn');
}

export function applyAction(state, action, actorSeat) {
  const next = clone(state);
  assertActor(next, actorSeat);
  const type = action?.type;
  if (type === 'pickRole') pickRole(next, actorSeat, action.roleId);
  else if (type === 'gatherGold') gatherGold(next, actorSeat);
  else if (type === 'gatherCards') gatherCards(next, actorSeat, action.keepIndex);
  else if (type === 'keepDrawn') keepDrawn(next, actorSeat, action.keepIndex);
  else if (type === 'typeIncome') typeIncome(next, actorSeat);
  else if (type === 'assassinKill') assassinKill(next, actorSeat, action.roleId);
  else if (type === 'thiefRob') thiefRob(next, actorSeat, action.roleId);
  else if (type === 'magicianSwap') magicianSwap(next, actorSeat, action.seat);
  else if (type === 'magicianRedraw') magicianRedraw(next, actorSeat, action.cardIds || []);
  else if (type === 'build') buildDistrict(next, actorSeat, action.cardId, action.payWithCards || []);
  else if (type === 'warlordDestroy') warlordDestroy(next, actorSeat, action.seat, action.districtIndex);
  else if (type === 'useLab') useLab(next, actorSeat, action.cardId);
  else if (type === 'useSmithy') useSmithy(next, actorSeat);
  else if (type === 'endTurn') endTurn(next, actorSeat);
  else throw new Error('Unknown action');
  next.revision = (state.revision || 0) + 1;
  next.turn = next.actorSeat;
  return next;
}

export function applyMove(state, move) {
  if (move && typeof move === 'object' && move.type) {
    return applyAction(state, move, move.actor ?? state.actorSeat);
  }
  throw new Error('Illegal move');
}

function pickRole(state, seat, roleId) {
  if (state.phase !== 'draft') throw new Error('Not drafting');
  if (!state.draftRemaining.includes(roleId)) throw new Error('That character is not available');
  player(state, seat).roleId = roleId;
  state.draftRemaining = state.draftRemaining.filter((id) => id !== roleId);
  log(state, `Seat ${seat + 1} chose a character.`);
  const nextSeat = (seat + 1) % state.seatCount;
  const chosen = state.players.filter((p) => p.roleId).length;
  if (chosen >= state.seatCount) {
    if (state.draftRemaining.length) {
      state.facedownDiscard.push(...state.draftRemaining);
      state.draftRemaining = [];
    }
    beginRank(state, 1);
    return;
  }
  state.actorSeat = nextSeat;
}

function gatherGold(state, seat) {
  if (state.phase !== 'gather' || state.gathered) throw new Error('Already gathered');
  player(state, seat).gold += 2;
  state.gathered = true;
  state.phase = 'main';
  applyPassiveExtras(state, seat);
  log(state, `Seat ${seat + 1} takes 2 gold.`);
}

function gatherCards(state, seat) {
  if (state.phase !== 'gather' || state.gathered) throw new Error('Already gathered');
  const drawn = drawFromDeck(state, 2);
  const library = hasCard(player(state, seat).city, 'Library');
  if (library || drawn.length <= 1) {
    player(state, seat).hand.push(...drawn);
    state.gathered = true;
    state.phase = 'main';
    applyPassiveExtras(state, seat);
    log(state, `Seat ${seat + 1} draws district cards.`);
    return;
  }
  state.pendingDraw = drawn;
  state.phase = 'chooseCard';
}

function keepDrawn(state, seat, keepIndex) {
  if (state.phase !== 'chooseCard' || !state.pendingDraw) throw new Error('No cards to keep');
  const drawn = state.pendingDraw;
  const keep = drawn[keepIndex] ?? drawn[0];
  const rest = drawn.filter((id) => id !== keep);
  player(state, seat).hand.push(keep);
  bury(state, rest);
  state.pendingDraw = null;
  state.gathered = true;
  state.phase = 'main';
  applyPassiveExtras(state, seat);
  log(state, `Seat ${seat + 1} keeps a district card.`);
}

function typeIncome(state, seat) {
  if (state.phase !== 'main') throw new Error('Not in the main step');
  if (state.typeIncomeUsed) throw new Error('Already took district gold');
  const role = player(state, seat).roleId;
  const map = { king: 'noble', bishop: 'religious', merchant: 'trade', warlord: 'military' };
  const type = map[role];
  if (!type) throw new Error('This character has no district gold');
  const n = typeCount(state, seat, type);
  player(state, seat).gold += n;
  state.typeIncomeUsed = true;
  log(state, `Seat ${seat + 1} gains ${n} gold from ${type} districts.`);
}

function assassinKill(state, seat, roleId) {
  if (player(state, seat).roleId !== 'assassin') throw new Error('Not the Assassin');
  if (state.abilityUsed) throw new Error('Ability already used');
  if (state.phase !== 'main') throw new Error('Gather first');
  if (!ROLE_ORDER.includes(roleId) || roleId === 'assassin') throw new Error('Illegal target');
  state.killedRole = roleId;
  state.abilityUsed = true;
  log(state, 'The Assassin marks a character.');
}

function thiefRob(state, seat, roleId) {
  if (player(state, seat).roleId !== 'thief') throw new Error('Not the Thief');
  if (state.abilityUsed) throw new Error('Ability already used');
  if (state.phase !== 'main') throw new Error('Gather first');
  if (roleId === 'thief' || roleId === 'assassin' || roleId === state.killedRole) throw new Error('Illegal target');
  if (!ROLE_ORDER.includes(roleId)) throw new Error('Illegal target');
  state.stolenRole = roleId;
  state.abilityUsed = true;
  log(state, 'The Thief marks a character.');
}

function magicianSwap(state, seat, other) {
  if (player(state, seat).roleId !== 'magician') throw new Error('Not the Magician');
  if (state.abilityUsed) throw new Error('Ability already used');
  if (state.phase !== 'main') throw new Error('Gather first');
  if (other === seat || other < 0 || other >= state.seatCount) throw new Error('Illegal seat');
  const a = player(state, seat).hand;
  const b = player(state, other).hand;
  player(state, seat).hand = b;
  player(state, other).hand = a;
  state.abilityUsed = true;
  log(state, `Seat ${seat + 1} swaps hands with seat ${other + 1}.`);
}

function magicianRedraw(state, seat, cardIds) {
  if (player(state, seat).roleId !== 'magician') throw new Error('Not the Magician');
  if (state.abilityUsed) throw new Error('Ability already used');
  if (state.phase !== 'main') throw new Error('Gather first');
  const hand = player(state, seat).hand;
  if (cardIds.some((id) => !hand.includes(id))) throw new Error('Card not in hand');
  const keep = hand.filter((id) => !cardIds.includes(id));
  bury(state, cardIds);
  const drawn = drawFromDeck(state, cardIds.length);
  player(state, seat).hand = [...keep, ...drawn];
  state.abilityUsed = true;
  log(state, `Seat ${seat + 1} redraws ${cardIds.length} cards.`);
}

function buildDistrict(state, seat, cardId, payWithCards) {
  if (state.phase !== 'main') throw new Error('Gather first');
  if (state.builtCount >= state.buildLimit) throw new Error('Building limit reached');
  const hand = player(state, seat).hand;
  if (!hand.includes(cardId)) throw new Error('Card not in hand');
  if (!canBuildName(state, seat, cardId)) throw new Error('Duplicate district');
  const cost = buildCost(state, seat, cardId);
  const card = cardById(cardId);
  let payCards = (payWithCards || []).filter((id) => id !== cardId && hand.includes(id));
  if (card?.name === "Thieves' Den" && !payCards.length && player(state, seat).gold < cost) {
    const need = cost - player(state, seat).gold;
    payCards = hand.filter((id) => id !== cardId).slice(0, Math.max(0, need));
  }
  const cardPay = card?.name === "Thieves' Den" ? payCards.slice(0, cost) : [];
  const goldNeed = Math.max(0, cost - cardPay.length);
  if (player(state, seat).gold < goldNeed) throw new Error('Not enough gold');
  player(state, seat).gold -= goldNeed;
  player(state, seat).hand = hand.filter((id) => id !== cardId && !cardPay.includes(id));
  if (cardPay.length) bury(state, cardPay);
  player(state, seat).city.push(cardId);
  state.builtCount += 1;
  log(state, `Seat ${seat + 1} builds ${card?.name || cardId}.`);
  if (player(state, seat).city.length >= 7 && state.firstCompleteSeat === null) {
    state.firstCompleteSeat = seat;
    log(state, `Seat ${seat + 1} completes a city.`);
  }
}

function warlordDestroy(state, seat, targetSeat, districtIndex) {
  if (player(state, seat).roleId !== 'warlord') throw new Error('Not the Warlord');
  if (state.abilityUsed) throw new Error('Ability already used');
  if (state.phase !== 'main') throw new Error('Gather first');
  const target = player(state, targetSeat);
  const cardId = target.city[districtIndex];
  if (!cardId) throw new Error('No district there');
  const card = cardById(cardId);
  if (card?.indestructible || card?.name === 'Keep') throw new Error('Keep cannot be destroyed');
  if (target.city.length >= 7) throw new Error('Completed city');
  const bishopSeat = ownerOfRole(state, 'bishop');
  if (targetSeat === bishopSeat && state.killedRole !== 'bishop' && player(state, bishopSeat).roleRevealed) {
    throw new Error('Bishop is protected');
  }
  const price = Math.max(0, card.cost - 1);
  if (player(state, seat).gold < price) throw new Error('Not enough gold');
  player(state, seat).gold -= price;
  target.city.splice(districtIndex, 1);
  bury(state, [cardId]);
  state.abilityUsed = true;
  log(state, `Warlord destroys ${card.name}.`);
}

function useLab(state, seat, cardId) {
  if (state.phase !== 'main') throw new Error('Gather first');
  if (state.labUsed) throw new Error('Already used');
  if (!hasCard(player(state, seat).city, 'Laboratory')) throw new Error('No Laboratory');
  const hand = player(state, seat).hand;
  if (!hand.includes(cardId)) throw new Error('Card not in hand');
  player(state, seat).hand = hand.filter((id) => id !== cardId);
  bury(state, [cardId]);
  player(state, seat).gold += 2;
  state.labUsed = true;
  log(state, 'Laboratory discards a card for 2 gold.');
}

function useSmithy(state, seat) {
  if (state.phase !== 'main') throw new Error('Gather first');
  if (state.smithyUsed) throw new Error('Already used');
  if (!hasCard(player(state, seat).city, 'Smithy')) throw new Error('No Smithy');
  if (player(state, seat).gold < 2) throw new Error('Not enough gold');
  player(state, seat).gold -= 2;
  player(state, seat).hand.push(...drawFromDeck(state, 3));
  state.smithyUsed = true;
  log(state, 'Smithy pays 2 gold for 3 cards.');
}

function endTurn(state, seat) {
  if (state.phase !== 'main') throw new Error('Gather first');
  log(state, `Seat ${seat + 1} ends the turn.`);
  beginRank(state, state.rankCalled + 1);
}

export function legalActions(state, seat) {
  if (!state || state.phase === 'gameover' || state.actorSeat !== seat) return [];
  const actions = [];
  const p = player(state, seat);
  if (state.phase === 'draft') {
    state.draftRemaining.forEach((roleId) => actions.push({ type: 'pickRole', roleId }));
    return actions;
  }
  if (state.phase === 'chooseCard' && state.pendingDraw) {
    state.pendingDraw.forEach((_, keepIndex) => actions.push({ type: 'keepDrawn', keepIndex }));
    return actions;
  }
  if (state.phase === 'gather') {
    actions.push({ type: 'gatherGold' });
    if (state.deck.length) actions.push({ type: 'gatherCards' });
    return actions;
  }
  if (state.phase !== 'main') return actions;
  const role = p.roleId;
  if (!state.typeIncomeUsed && ['king', 'bishop', 'merchant', 'warlord'].includes(role)) {
    actions.push({ type: 'typeIncome' });
  }
  if (!state.abilityUsed && role === 'assassin') {
    ROLE_ORDER.filter((id) => id !== 'assassin').forEach((roleId) => actions.push({ type: 'assassinKill', roleId }));
  }
  if (!state.abilityUsed && role === 'thief') {
    ROLE_ORDER.filter((id) => id !== 'thief' && id !== 'assassin' && id !== state.killedRole).forEach((roleId) =>
      actions.push({ type: 'thiefRob', roleId })
    );
  }
  if (!state.abilityUsed && role === 'magician') {
    for (let i = 0; i < state.seatCount; i += 1) {
      if (i !== seat) actions.push({ type: 'magicianSwap', seat: i });
    }
    if (p.hand.length) actions.push({ type: 'magicianRedraw', cardIds: p.hand.slice() });
  }
  if (!state.abilityUsed && role === 'warlord') {
    state.players.forEach((other, otherSeat) => {
      if (other.city.length >= 7) return;
      const bishopSeat = ownerOfRole(state, 'bishop');
      if (otherSeat === bishopSeat && state.killedRole !== 'bishop' && player(state, bishopSeat).roleRevealed) return;
      other.city.forEach((id, districtIndex) => {
        const card = cardById(id);
        if (!card || card.name === 'Keep') return;
        const price = Math.max(0, card.cost - 1);
        if (p.gold >= price) actions.push({ type: 'warlordDestroy', seat: otherSeat, districtIndex });
      });
    });
  }
  if (state.builtCount < state.buildLimit) {
    p.hand.forEach((cardId) => {
      if (!canBuildName(state, seat, cardId)) return;
      const cost = buildCost(state, seat, cardId);
      if (cardById(cardId)?.name === "Thieves' Den") {
        if (p.gold + p.hand.length - 1 >= cost) actions.push({ type: 'build', cardId, payWithCards: [] });
      } else if (p.gold >= cost) {
        actions.push({ type: 'build', cardId, payWithCards: [] });
      }
    });
  }
  if (!state.labUsed && hasCard(p.city, 'Laboratory')) {
    p.hand.forEach((cardId) => actions.push({ type: 'useLab', cardId }));
  }
  if (!state.smithyUsed && hasCard(p.city, 'Smithy') && p.gold >= 2) {
    actions.push({ type: 'useSmithy' });
  }
  actions.push({ type: 'endTurn' });
  return actions;
}

export function publicView(state, viewer) {
  const view = clone(state);
  delete view.deck;
  view.facedownDiscard = (state.facedownDiscard || []).map(() => 'hidden');
  view.players = state.players.map((p, seat) => ({
    ...p,
    hand: viewer === seat ? p.hand.slice() : p.hand.map(() => 'hidden'),
    handCount: p.hand.length,
    roleId: p.roleRevealed || viewer === seat ? p.roleId : null,
  }));
  if (viewer !== state.actorSeat && state.phase === 'draft') {
    view.draftRemaining = state.draftRemaining.map(() => 'hidden');
  }
  if (view.pendingDraw && viewer !== state.actorSeat) {
    view.pendingDraw = view.pendingDraw.map(() => 'hidden');
  }
  return view;
}

export function status(state) {
  return {
    over: state.phase === 'gameover' || state.winner !== null,
    winner: state.winner,
    draw: false,
    turn: state.actorSeat,
    phase: state.phase,
  };
}
