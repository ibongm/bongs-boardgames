export const DISTRICT_TEXT = {
  manor: 'A noble house. Counts as a Noble district for the King and for the five-type bonus.',
  castle: 'A noble stronghold. Counts as a Noble district for the King and for the five-type bonus.',
  palace: 'The grandest Noble district. Worth 5 gold to build.',
  temple: 'A small Religious district. Counts for the Bishop.',
  church: 'A Religious district. Counts for the Bishop.',
  monastery: 'A Religious district. Counts for the Bishop.',
  cathedral: 'The grandest Religious district. Worth 5 gold to build.',
  tavern: 'A Trade district. Counts for the Merchant.',
  market: 'A Trade district. Counts for the Merchant.',
  'trading-post': 'A Trade district. Counts for the Merchant.',
  docks: 'A Trade district. Counts for the Merchant.',
  harbor: 'A Trade district. Counts for the Merchant.',
  'town-hall': 'The grandest Trade district. Worth 5 gold to build.',
  watchtower: 'A Military district. Counts for the Warlord.',
  prison: 'A Military district. Counts for the Warlord.',
  battlefield: 'A Military district. Counts for the Warlord.',
  fortress: 'The grandest Military district. Worth 5 gold to build.',
  'dragon-gate': 'Unique. Costs 6 gold. At the end of the game it scores 8 points instead of 6.',
  factory: 'Unique. Other unique districts you build cost 1 less gold (minimum 1). The Factory itself is not discounted.',
  'haunted-quarter': 'Unique. At the end of the game you may treat it as any one district type you are missing, so it can complete the five-type bonus.',
  'imperial-treasury': 'Unique. At the end of the game score 1 extra point for each gold you still have.',
  keep: 'Unique. The Warlord cannot destroy this district.',
  laboratory: 'Unique. Once on your turn you may discard 1 card from your hand to gain 2 gold.',
  library: 'Unique. When you gather cards you keep both instead of choosing one.',
  'map-room': 'Unique. At the end of the game score 1 extra point for each card in your hand.',
  quarry: 'Unique. You may build a district whose name already appears in your city.',
  'school-of-magic': 'Unique. When a character pays you gold for a district type, this card counts as the type of your choice.',
  smithy: 'Unique. Once on your turn you may pay 2 gold to draw 3 district cards.',
  statue: 'Unique. At the end of the game score 5 extra points if you hold the crown.',
  'thieves-den': 'Unique. You may pay part or all of its 6-gold cost by discarding cards from your hand. Each discarded card pays 1 gold.',
  'wishing-well': 'Unique. At the end of the game score 1 extra point for each unique district in your city, including this one.',
};

export const ROLE_TEXT = {
  assassin: {
    rank: 1,
    text: 'Name a character other than the Assassin. That character is killed: they skip their turn and do not reveal.',
  },
  thief: {
    rank: 2,
    text: 'Name a character other than the Assassin or the killed character. When that character is revealed, take all of their gold.',
  },
  magician: {
    rank: 3,
    text: 'Once during your turn, either swap your whole hand with another player, or discard any number of cards from your hand and draw the same number.',
  },
  king: {
    rank: 4,
    text: 'Take the crown. You start the next draft. Gain 1 gold for each Noble district in your city. If the King was killed they still receive the crown when rank 4 is called, but they take no turn.',
  },
  bishop: {
    rank: 5,
    text: 'Gain 1 gold for each Religious district. The Warlord cannot destroy districts in your city this round unless you were killed.',
  },
  merchant: {
    rank: 6,
    text: 'Gain 1 extra gold, then gain 1 gold for each Trade district in your city.',
  },
  architect: {
    rank: 7,
    text: 'Draw 2 extra district cards. You may build up to three districts this turn.',
  },
  warlord: {
    rank: 8,
    text: 'Gain 1 gold for each Military district. You may destroy one district in another city by paying one less than its cost. You cannot destroy the Keep, a district in a completed city of seven, or a Bishop’s city if the Bishop revealed and was not killed.',
  },
};

export function stemOf(id) {
  if (!id || id === 'hidden') return null;
  return String(id).replace(/-\d+$/, '');
}
