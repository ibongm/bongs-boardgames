# Bong's Board Games

English-only public tabletop site. Playable on phones and PCs.

- Site: https://bongs-boardgames.vercel.app
- Repo: https://github.com/ibongm/bongs-boardgames
- Vercel project: bongs-boardgames on team Bong
- Firebase: `bongs-boardgames-55d28`
- Admin email: ivanm.ploce@gmail.com
- Stack: Vite + React + Firebase + Vercel

Product log: `docs/SITE.md`. Changelog: `CHANGELOG.md`. Update both when behaviour or presentation changes.

If `Pioneer-Build-Plan.docx` or `docs/PIONEER.md` is in this repo or the parent artifacts folder, treat it as the Pioneer implementation spec. Do not invent product decisions that contradict it or this file.

## Standing rules

- Prefer small modular files. Do not grow `Home.jsx` or `Room.jsx` into feature dumping grounds.
- Reuse one modal component for overlays.
- Player-facing copy has a code default and can be overridden in Admin.
- Hide empty chrome (no empty home shelves, no blank rules modal).
- Rules control on a live table must be reachable with a thumb.
- Public home shelves for everyone; personal shelves only after sign-in.
- Featured / New are badges and can also be their own rows.
- On a finished rated match, write `lastPlayedAt` and site aggregates.
- Do not commit `.env` secrets. Use `.env.example` only.
- Do not use CATAN, Catan, Settlers of Catan, Klaus Teuber, Catan Studio, or the rising-sun mark in UI, metadata, README, or rules copy.

## Games already shipped

- Tic-Tac-Toe (`tic-tac-toe`), 2 players.
- Connect Four (`connect-four`), 2 players.

Each game lives under `src/games/<id>/` with `meta.js`, `engine.js`, `ai.js`, `rules.js`, `Board.jsx`. Register in `src/games/registry.js` as `{ meta, engine, ai, rules, Board }`.

Auth: Google + email/password. Display name is chosen by the player and editable on profile. Sign-in is required to create or join a Firebase room for the shipped titles.

Rooms: public by default; join via lobby list and room code; optional host password; spectators allowed; host may add bots in lobby only (Easy / Medium / Hard). Mid-game disconnect for shipped titles: wait 30 seconds, then replace with a Medium bot. Ratings only when two or more signed-in humans are in `playerIds`. Practice vs bot on `/play/:gameId` is unrated.

## Pioneer (third title — unpublished)

Slug: `pioneer`. Folder: `src/games/pioneer/`. Keep `published: false` in `src/lib/defaults.js` until the owner asks for a home card. Do not add Pioneer to home shelves.

### Product locks

- 3–4 seats. Host picks the count. No official two-player variant.
- Combined trade and build after the roll.
- Maps: **Balanced Isle** (hover: best for beginners) and **Random Isle** (signed-in).
- Guests play Balanced Isle versus bots only on `/play/pioneer`.
- Guests may spectate any public table.
- Guests never sit at a human table.
- A guest who signs in while already in the Pioneer lobby immediately unlocks Random Isle and human seats. Do not lose the seat-count draft.
- Build by clicking a path or intersection, showing legal options, then confirming. No Build group in the action bar.
- Domestic trade: mixed-card offers. The want-side may be blank so opponents can counter.
- Pioneer disconnect: 45 seconds, then a bot takes the seat and inherits pieces, resources, and cards. Other titles stay at 30 seconds.
- Rated when two or more signed-in humans are in the match. Guest-versus-bots and practice are unrated.
- Expansions are out of v1. Keep modules and rule-set fields extensible.

### Glossary (player-facing names only)

| Concept | Public name | Internal id |
|---|---|---|
| Game | Pioneer | `pioneer` |
| Beginner map | Balanced Isle | `map_balanced` |
| Variable map | Random Isle | `map_shuffled` |
| Resources | Wood, clay, sheep, wheat, stone | `wood` `clay` `sheep` `wheat` `stone` |
| Terrain | Forest, Hills, Pasture, Fields, Mountains, Desert | matching slugs |
| Pieces | Road, settlement, city | `road` `settlement` `city` |
| Deck | Breakthrough cards | `breakthrough` |
| Effects | Guard, Rich Yield, Trade Dominance, Road Building | `guard` `rich_yield` `trade_dominance` `road_building` |
| Hidden VP cards | Charter (Forum, Archive, Exchange, Academy, Keep) | `charter` |
| Robber piece | Bandit | `bandit` |
| Harbours | Trading posts | `post` |
| Longest Road | Longest Route | `longest_route` |
| Largest Army | Grand Garrison | `grand_garrison` |
| Distance rule | Spacing rule | `spacing` |

Do not put lumber, ore, wool, grain, knight, robber, harbour, Longest Road, or Largest Army in player-facing copy.

### Engine

Tic-Tac-Toe’s `applyMove(state, cellIndex)` is too small. Pioneer exports a pure engine (no Firebase imports):

- `createState({ seatCount, map, seed, colors })`
- `applyAction(state, action, actorSeat)`
- `legalActions(state, actorSeat)`
- `publicView(state, viewerSeat | 'spectator')`
- `status(state)`
- thin `applyMove` adapter so existing `playMove` can pass action objects

Turn flips only on `{ type: 'endTurn' }`. Win at 10 or more points on the active player’s own turn. Charters stay hidden until that declaration.

Hands and unplayed Breakthroughs are hidden. Spectators and opponents see counts only. Do not store full opponent hands on a publicly readable match document.

### Platform hooks Pioneer needs

- `meta.seatsMin = 3`, `meta.seatsMax = 4`, `meta.disconnectMs = 45000`. Keep `meta.seats = 2` on the shipped games.
- `createRoom` accepts `{ seatCount, mapId }`. Start only when every configured seat is filled.
- `/play/pioneer` stays public. Default practice: 4 seats, human seat 0, bots fill the rest, Balanced Isle, unrated.
- Spectating may be public; sitting at a human table still requires a signed-in account.
- Do not regress Tic-Tac-Toe or Connect Four.

## How to work in this repo

1. Read `docs/SITE.md`, this file, and the Pioneer brief before editing.
2. For Pioneer, stay in plan mode until the owner approves. First implementation stays `published: false`.
3. After a behaviour change, update `docs/SITE.md` and `CHANGELOG.md`.
4. Do not set Pioneer `published: true` or add a home card unless the owner explicitly asks.
