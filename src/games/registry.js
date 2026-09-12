import { meta as tttMeta } from './tic-tac-toe/meta.js';
import * as tttEngine from './tic-tac-toe/engine.js';
import * as tttAi from './tic-tac-toe/ai.js';
import { rules as tttRules } from './tic-tac-toe/rules.js';
import TicTacToeBoard from './tic-tac-toe/Board.jsx';
import { meta as c4Meta } from './connect-four/meta.js';
import * as c4Engine from './connect-four/engine.js';
import * as c4Ai from './connect-four/ai.js';
import { rules as c4Rules } from './connect-four/rules.js';
import ConnectFourBoard from './connect-four/Board.jsx';
import { meta as citadelsMeta } from './citadels/meta.js';
import * as citadelsEngine from './citadels/engine.js';
import * as citadelsAi from './citadels/ai.js';
import { rules as citadelsRules } from './citadels/rules.js';
import CitadelsBoard from './citadels/Board.jsx';

export const games = {
  'tic-tac-toe': { meta: tttMeta, engine: tttEngine, ai: tttAi, rules: tttRules, Board: TicTacToeBoard },
  'connect-four': { meta: c4Meta, engine: c4Engine, ai: c4Ai, rules: c4Rules, Board: ConnectFourBoard },
  citadels: { meta: citadelsMeta, engine: citadelsEngine, ai: citadelsAi, rules: citadelsRules, Board: CitadelsBoard },
};

export function listGames() {
  return Object.values(games);
}

export function getGame(id) {
  return games[id] || null;
}
