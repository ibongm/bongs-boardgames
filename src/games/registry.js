import React, { Suspense, lazy } from 'react';
import { meta as tttMeta } from './tic-tac-toe/meta.js';
import * as tttEngine from './tic-tac-toe/engine.js';
import * as tttAi from './tic-tac-toe/ai.js';
import { rules as tttRules } from './tic-tac-toe/rules.js';

import { meta as c4Meta } from './connect-four/meta.js';
import * as c4Engine from './connect-four/engine.js';
import * as c4Ai from './connect-four/ai.js';
import { rules as c4Rules } from './connect-four/rules.js';

import { meta as citadelsMeta } from './citadels/meta.js';
import * as citadelsEngine from './citadels/engine.js';
import * as citadelsAi from './citadels/ai.js';
import { rules as citadelsRules } from './citadels/rules.js';

import { meta as pioneerMeta } from './pioneer/meta.js';
import * as pioneerEngine from './pioneer/engine.js';
import * as pioneerAi from './pioneer/ai.js';
import { rules as pioneerRules } from './pioneer/rules.js';

function createLazyBoard(loader) {
  const LazyComponent = lazy(loader);
  return function LazyBoardWrapper(props) {
    return React.createElement(
      Suspense,
      {
        fallback: React.createElement(
          'div',
          { className: 'h-40 rounded-xl bg-espresso/30 flex items-center justify-center text-xs text-ink/40 animate-pulse' },
          'Loading board…'
        ),
      },
      React.createElement(LazyComponent, props)
    );
  };
}

export const games = {
  'tic-tac-toe': { meta: tttMeta, engine: tttEngine, ai: tttAi, rules: tttRules, Board: createLazyBoard(() => import('./tic-tac-toe/Board.jsx')) },
  'connect-four': { meta: c4Meta, engine: c4Engine, ai: c4Ai, rules: c4Rules, Board: createLazyBoard(() => import('./connect-four/Board.jsx')) },
  citadels: { meta: citadelsMeta, engine: citadelsEngine, ai: citadelsAi, rules: citadelsRules, Board: createLazyBoard(() => import('./citadels/Board.jsx')) },
  pioneer: { meta: pioneerMeta, engine: pioneerEngine, ai: pioneerAi, rules: pioneerRules, Board: createLazyBoard(() => import('./pioneer/Board.jsx')) },
};

export function listGames() {
  return Object.values(games);
}

export function getGame(id) {
  return games[id] || null;
}
