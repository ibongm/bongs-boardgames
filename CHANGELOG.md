# Changelog

### [2026-09-12] - Document Pioneer Zero-Scroll Split Layout in Product Log
- **Files Changed**:
  - `docs/SITE.md` (Modified)
- **Details**:
  - Documented Pioneer's desktop two-column zero-scroll layout with left sidebar and right-side interactive board arena.

### [2026-09-12] - Pioneer Zero-Scroll Split Layout in Practice Screen
- **Files Changed**:
  - `src/screens/Play.jsx` (Modified)
- **Details**:
  - Integrated Pioneer practice table controls (difficulty selector, table size, map layout, rules trigger, test mode, and match buttons) into `sidebarTop` and `sidebarBottom` slots of the board component, enabling an unencumbered side-by-side desktop arena view.

### [2026-09-12] - Responsive Two-Column Split Layout in PioneerBoard
- **Files Changed**:
  - `src/games/pioneer/Board.jsx` (Modified)
- **Details**:
  - Restructured Pioneer tabletop layout into a desktop two-column split (`flex-col lg:flex-row`), grouping player seat summaries, hand resource chips, build cheatsheet, and activity log in a left sidebar, with the turn status banner, contextual action bar, and island HexBoard in a dedicated right arena. Supported `sidebarTop` and `sidebarBottom` prop injection.

### [2026-09-12] - Viewport Height Constraint on HexBoard Container
- **Files Changed**:
  - `src/games/pioneer/views/HexBoard.jsx` (Modified)
- **Details**:
  - Bound the HexBoard container to `max-w-[min(100%,calc(100vh-160px))]` to ensure the entire SVG island fits comfortably within desktop viewports without requiring vertical page scrolling.

### [2026-09-12] - Adapt SeatPanel Grid for Desktop Sidebar
- **Files Changed**:
  - `src/games/pioneer/views/SeatPanel.jsx` (Modified)
- **Details**:
  - Configured responsive grid (`grid-cols-2 sm:grid-cols-4 lg:grid-cols-2`) so player status cards arrange cleanly inside desktop sidebars and horizontal mobile strips.

### [2026-09-12] - Compact Island Activity Log Sizing
- **Files Changed**:
  - `src/games/pioneer/views/Log.jsx` (Modified)
- **Details**:
  - Reduced match log container height to `h-32 sm:h-36` with refined typography and entry counters for space efficiency within desktop sidebars.

### [2026-09-12] - Expand Desktop Container Width to max-w-7xl
- **Files Changed**:
  - `src/components/Layout.jsx` (Modified)
  - `src/components/Header.jsx` (Modified)
- **Details**:
  - Expanded main layout and header container widths from `max-w-6xl` to `max-w-7xl` and adjusted vertical padding to `py-4 sm:py-6` to support rich two-column tabletop board game viewports.

### [2026-09-12] - Null-Safe Fallback in useAuth Context Hook
- **Files Changed**:
  - `src/context/AuthContext.jsx` (Modified)
- **Details**:
  - Returned an empty object fallback from `useAuth()` to prevent destructuring exceptions when components access auth state during context initialization.

### [2026-09-12] - Complete PreviewState Population for Pioneer
- **Files Changed**:
  - `src/games/pioneer/meta.js` (Modified)
- **Details**:
  - Populated `previewState` with `createState({ seatCount: 4, mapId: 'map_balanced' })` so that hexes, intersections, paths, and trading posts are fully realized for home shelf game card previews.

### [2026-09-12] - Compact Preview Mode for PioneerBoard
- **Files Changed**:
  - `src/games/pioneer/Board.jsx` (Modified)
- **Details**:
  - Rendered isolated `<HexBoard />` in compact preview mode when `interactive === false`, preventing docks, seat panels, and match modals from rendering inside small home card previews.

### [2026-09-12] - HexBoard Null Checks and Property Guards
- **Files Changed**:
  - `src/games/pioneer/views/HexBoard.jsx` (Modified)
- **Details**:
  - Added null guard for board state and optional chaining for `state.paths`, `state.intersections`, `state.hexes`, and `state.players` to prevent uncaught runtime errors during preview and card rendering.

### [2026-09-12] - Document Pioneer in Product Log
- **Files Changed**:
  - `docs/SITE.md` (Modified)
- **Details**:
  - Documented Pioneer specifications (`published: false`), 3-4 seats, 45-second disconnect replacement, guest spectating rules, and multi-player Elo adjustments.

### [2026-09-12] - Update Firestore Security Rules for Public Spectating
- **Files Changed**:
  - `firestore.rules` (Modified)
- **Details**:
  - Allowed unauthenticated read access to public `rooms` and `matches` documents for spectator support.
  - Added access controls for the `matches/{id}/secrets/{seatIndex}` collection restricting private hands to authenticated seat owners.

### [2026-09-12] - Add Pioneer Map Hosting Selection to GameInfo Screen
- **Files Changed**:
  - `src/screens/GameInfo.jsx` (Modified)
- **Details**:
  - Added map layout picker for Pioneer tables (Balanced Isle vs Random Isle), ensuring guests are prompted to sign in for Random Isle.

### [2026-09-12] - Enable Pioneer Practice Mode and Map Toggles
- **Files Changed**:
  - `src/screens/Play.jsx` (Modified)
- **Details**:
  - Enabled unrated bot practice on `/play/pioneer` while remaining unpublished on home shelves.
  - Added map selection with guest gating on Random Isle and seamless sign-in draft preservation.

### [2026-09-12] - Open Room Route for Guest Spectating
- **Files Changed**:
  - `src/App.jsx` (Modified)
- **Details**:
  - Unwrapped `/rooms/:code` route from `Protected` guard to allow unsigned guests to spectate public games.

### [2026-09-12] - Enable Public Spectating and Redacted State in Room Screen
- **Files Changed**:
  - `src/screens/Room.jsx` (Modified)
- **Details**:
  - Allowed unauthenticated guests to open rooms in read-only spectating mode without throwing authentication errors.
  - Fed engine `publicView` redacting secret hands and breakthrough cards for spectators and opponents.

### [2026-09-12] - Adapt Elo Calculations for Multi-Human Matches
- **Files Changed**:
  - `src/services/stats.js` (Modified)
- **Details**:
  - Updated `nextRating` to compare winners against the average rating of the other participating humans, distributing smaller losses across opponents while ignoring bots.

### [2026-09-12] - Enforce Full Seat Count Before Match Start
- **Files Changed**:
  - `src/services/roomActions.js` (Modified)
- **Details**:
  - Enforced that all configured room seats (`seatCount`) must be filled with humans or bots before starting a match.

### [2026-09-12] - Pass Dynamic Match Configuration in Matches Service
- **Files Changed**:
  - `src/services/matches.js` (Modified)
- **Details**:
  - Forwarded `seatCount` and `mapId` from the room document to `game.engine.createState(...)`.

### [2026-09-12] - Support Dynamic Seats and Map IDs in Room Creation
- **Files Changed**:
  - `src/services/rooms.js` (Modified)
- **Details**:
  - Extended `createRoom` to accept `seatCount` and `mapId`, clamping seats to the game's min/max bounds and storing them on the room document.

### [2026-09-12] - Add Pioneer Unpublished Default Site Configuration
- **Files Changed**:
  - `src/lib/defaults.js` (Modified)
- **Details**:
  - Added default configuration for Pioneer with `published: false` to ensure it remains hidden from public home shelves until published by the owner.

### [2026-09-12] - Register Pioneer in Games Registry
- **Files Changed**:
  - `src/games/registry.js` (Modified)
- **Details**:
  - Registered Pioneer module bundle (`meta`, `engine`, `ai`, `rules`, `Board`) alongside Tic-Tac-Toe, Connect Four, and Citadels.

### [2026-09-12] - Create Pioneer Top-Level Board Component
- **Files Changed**:
  - `src/games/pioneer/Board.jsx` (Created)
- **Details**:
  - Orchestrated Pioneer table layout with contextual map-click construction, action bar (Roll, Play Breakthrough, Trade, Bank, End turn), Hand Dock, Seat Panels, and win announcements without proprietary symbols.

### [2026-09-12] - Create Pioneer SVG HexBoard View
- **Files Changed**:
  - `src/games/pioneer/views/HexBoard.jsx` (Created)
- **Details**:
  - Rendered complete 19-hex pointy-top island with pan/zoom controls, frequency pip tokens, coastal trading post piers, and $\ge 44$px touch targets for roads and settlements.

### [2026-09-12] - Create Pioneer Bandit Modal Component
- **Files Changed**:
  - `src/games/pioneer/views/BanditModal.jsx` (Created)
- **Details**:
  - Added interactive dialog for 7-roll resource discarding and targeted random card plunder from adjacent opponents.

### [2026-09-12] - Create Pioneer Trade Modal Component
- **Files Changed**:
  - `src/games/pioneer/views/TradeModal.jsx` (Created)
- **Details**:
  - Added interactive maritime Bank Trading view with dynamic harbour rates (2:1/3:1/4:1) and domestic trading desk with open offers and counters.

### [2026-09-12] - Create Pioneer BuildPicker Contextual Action Component
- **Files Changed**:
  - `src/games/pioneer/views/BuildPicker.jsx` (Created)
- **Details**:
  - Implemented map-click contextual confirmation dialog for road construction, settlement founding, and city upgrades without an action bar build button.

### [2026-09-12] - Create Pioneer Hand Dock Component
- **Files Changed**:
  - `src/games/pioneer/views/HandDock.jsx` (Created)
- **Details**:
  - Built player resource docks (wood, clay, sheep, wheat, stone), Breakthrough card holders, and a permanent Pioneer build costs strip.

### [2026-09-12] - Create Pioneer Player Seat Panel Component
- **Files Changed**:
  - `src/games/pioneer/views/SeatPanel.jsx` (Created)
- **Details**:
  - Rendered compact seat cards with color-blind symbols, public VP, card counts, played Guards, route lengths, and award badges.

### [2026-09-12] - Create Pioneer In-Game Log Component
- **Files Changed**:
  - `src/games/pioneer/views/Log.jsx` (Created)
- **Details**:
  - Added real-time scrollable match activity log with automated scroll snapping for rolls, yields, trades, and builds.

### [2026-09-12] - Create Pioneer Rules Copy
- **Files Changed**:
  - `src/games/pioneer/rules.js` (Created)
- **Details**:
  - Authored original, trademark-free rulebook copy for the How to Play and Details modals covering the spacing rule, trading rates, breakthroughs, and 45s disconnects.

### [2026-09-12] - Fix Discard Phase Actor Sequencing in Pioneer Engine
- **Files Changed**:
  - `src/games/pioneer/engine.js` (Modified)
- **Details**:
  - Dynamically routed `state.actorSeat` through all pending players requiring 7-roll discards before advancing to the Bandit relocation phase.

### [2026-09-12] - Create Pioneer Bot AI
- **Files Changed**:
  - `src/games/pioneer/ai.js` (Created)
- **Details**:
  - Implemented AI bot heuristics across three difficulty tiers (Easy, Medium, Hard).
  - Added pip probability weighting, wood/clay setup bias, intelligent Bandit relocation, and build priority trees.

### [2026-09-12] - Create Pioneer Game Engine
- **Files Changed**:
  - `src/games/pioneer/engine.js` (Created)
- **Details**:
  - Implemented the complete Pioneer state lifecycle (`createState`, `applyAction`, `legalActions`, `publicView`, `status`, `applyMove`).
  - Added multi-phase state machine (setup, rolling, discarding, bandit, main, gameover) with full rules enforcement.

### [2026-09-12] - Create Pioneer Board Setup Logic
- **Files Changed**:
  - `src/games/pioneer/setup.js` (Created)
- **Details**:
  - Implemented printed starts and opening resources distribution for Balanced Isle.
  - Added two-round snake draft placement for Random Isle with second-settlement resource yield.

### [2026-09-12] - Create Pioneer Victory Point System
- **Files Changed**:
  - `src/games/pioneer/victory.js` (Created)
- **Details**:
  - Implemented public and hidden Victory Point calculations (settlements, cities, awards, charters).
  - Enforced active turn win declaration requirement at 10+ points.

### [2026-09-12] - Create Pioneer Dice and Resource Production Logic
- **Files Changed**:
  - `src/games/pioneer/production.js` (Created)
- **Details**:
  - Implemented 2d6 dice rolls and per-hex production yields (1 per settlement, 2 per city).
  - Added Bandit production blocking and bank shortage resolution.

### [2026-09-12] - Create Pioneer Bandit and Discard Mechanics
- **Files Changed**:
  - `src/games/pioneer/bandit.js` (Created)
- **Details**:
  - Implemented roll of 7 discard calculations (half rounded down for 8+ cards).
  - Added Bandit relocation, adjacent opponent detection, random stealing, and Grand Garrison tracking.

### [2026-09-12] - Create Pioneer Trading Engine
- **Files Changed**:
  - `src/games/pioneer/trade.js` (Created)
- **Details**:
  - Added bank trading rate calculations (4:1 baseline, 3:1 generic post, 2:1 specialized post).
  - Implemented structured domestic trade offers with counter-offers, inventory verification, and trade validations.

### [2026-09-12] - Create Pioneer Longest Route Calculation
- **Files Changed**:
  - `src/games/pioneer/route.js` (Created)
- **Details**:
  - Implemented continuous road graph traversal calculating maximum non-repeating simple path length.
  - Handled enemy settlement road splits, ties, and Longest Route card reassignment ($\ge 5$ roads).

### [2026-09-12] - Create Pioneer Building Rules and Validation
- **Files Changed**:
  - `src/games/pioneer/build.js` (Created)
- **Details**:
  - Added building costs for roads, settlements, cities, and Breakthrough cards.
  - Implemented piece inventory tracking (15 roads, 5 settlements, 4 cities).
  - Enforced the spacing rule and network connectivity with enemy settlement road blocks.

### [2026-09-12] - Create Pioneer Breakthrough Cards System
- **Files Changed**:
  - `src/games/pioneer/cards.js` (Created)
- **Details**:
  - Defined the 25 Breakthrough cards deck (14 Guard, 2 Rich Yield, 2 Trade Dominance, 2 Road Building, and 5 hidden Charters).
  - Implemented card ID parsers and deck shuffling routines.

### [2026-09-12] - Create Random Isle Map Generator
- **Files Changed**:
  - `src/games/pioneer/maps/random.js` (Created)
- **Details**:
  - Implemented procedural Random Isle generator with spiral token distribution, desert skipping, and automated token swapping to prevent adjacent 6 and 8 red numbers.

### [2026-09-12] - Create Balanced Isle Fixed Map Definition
- **Files Changed**:
  - `src/games/pioneer/maps/balanced.js` (Created)
- **Details**:
  - Encoded fixed 19-hex terrain, 18 number tokens, 9 trading posts, and 4 starter pairs for Balanced Isle with starter spacing guarantees.

### [2026-09-12] - Create Pioneer Metadata and Preview State
- **Files Changed**:
  - `src/games/pioneer/meta.js` (Created)
- **Details**:
  - Defined Pioneer metadata with 3-4 seats, 45-second disconnect timeout, color-blind friendly piece symbols, and sample match preview state.

### [2026-09-12] - Create Pioneer Hex Grid Topology and Board Coordinates
- **Files Changed**:
  - `src/games/pioneer/board.js` (Created)
- **Details**:
  - Implemented axial geometry and SVG coordinates for the 19-hex pointy-top island grid (3-4-5-4-3 layout).
  - Derived canonical tables and deterministic lookup graphs for 54 intersections, 72 paths, and 9 perimeter trading post slots.

### [2026-09-12] - Extract and Add Citadels Card Artwork from Demo Cards PDF
- **Files Changed**:
  - `docs/SITE.md` (Modified)
  - `src/games/citadels/photos/back.js` (Modified)
  - `src/games/citadels/photos/district-battlefield.js` (Modified)
  - `src/games/citadels/photos/district-castle.js` (Modified)
  - `src/games/citadels/photos/district-cathedral.js` (Modified)
  - `src/games/citadels/photos/district-church.js` (Modified)
  - `src/games/citadels/photos/district-docks.js` (Modified)
  - `src/games/citadels/photos/district-dragon-gate.js` (Modified)
  - `src/games/citadels/photos/district-fortress.js` (Modified)
  - `src/games/citadels/photos/district-harbor.js` (Modified)
  - `src/games/citadels/photos/district-haunted-quarter.js` (Modified)
  - `src/games/citadels/photos/district-imperial-treasury.js` (Modified)
  - `src/games/citadels/photos/district-keep.js` (Modified)
  - `src/games/citadels/photos/district-laboratory.js` (Modified)
  - `src/games/citadels/photos/district-library.js` (Modified)
  - `src/games/citadels/photos/district-manor.js` (Modified)
  - `src/games/citadels/photos/district-map-room.js` (Modified)
  - `src/games/citadels/photos/district-market.js` (Modified)
  - `src/games/citadels/photos/district-monastery.js` (Modified)
  - `src/games/citadels/photos/district-palace.js` (Modified)
  - `src/games/citadels/photos/district-prison.js` (Modified)
  - `src/games/citadels/photos/district-school-of-magic.js` (Modified)
  - `src/games/citadels/photos/district-smithy.js` (Modified)
  - `src/games/citadels/photos/district-statue.js` (Modified)
  - `src/games/citadels/photos/district-tavern.js` (Modified)
  - `src/games/citadels/photos/district-temple.js` (Modified)
  - `src/games/citadels/photos/district-thieves-den.js` (Modified)
  - `src/games/citadels/photos/district-town-hall.js` (Modified)
  - `src/games/citadels/photos/district-trading-post.js` (Modified)
  - `src/games/citadels/photos/district-watchtower.js` (Modified)
  - `src/games/citadels/photos/role-architect.js` (Modified)
  - `src/games/citadels/photos/role-assassin.js` (Modified)
  - `src/games/citadels/photos/role-bishop.js` (Modified)
  - `src/games/citadels/photos/role-king.js` (Modified)
  - `src/games/citadels/photos/role-magician.js` (Modified)
  - `src/games/citadels/photos/role-merchant.js` (Modified)
  - `src/games/citadels/photos/role-thief.js` (Modified)
  - `src/games/citadels/photos/role-warlord.js` (Modified)
- **Details**:
  - Extracted 36 official cards and card back from `citadels_demo_cards_en.pdf` at 300 DPI with precise card bounding box alignment.
  - Replaced corrupted/truncated base64 JPEGs for Magician, Bishop, and Warlord character cards, resolving decode errors and grey artifact blocks.
  - Added full JPEG card photos for all 17 basic districts and 10 unique districts from the PDF demo set.
  - Cleared corrupted base64 in `district-thieves-den.js` to cleanly fall back to the SVG glyph without image decoding errors.

## 2026-09-12


- Citadels end screen lists every point source per seat (district values, five-type bonus, completed city, Treasury / Map Room / Statue / Wishing Well). The live table shows a round banner, labelled character strip, named city tiles, and a boxed action row.
- Site body, cards, modals, seats, and footers use ink on cream. Cream type stays on the burgundy header and filled primary buttons only.
- Citadels now uses the official first-game card pictures from the attached sheet. Factory, Quarry, Thieves' Den, and Wishing Well use painted cards in the same format. The 3-cost military district shows as Barracks.
- Admin test mode: on a practice table, signed-in admins can tick “Test mode — no bot timer, play every seat.” On a live room, host or admin can tick “Test table — no disconnect timer.”

- Citadels cards, characters, and seats are illustrated and tappable. A popup shows the picture plus the official first-game text. Opening another player shows their gold, hand size, revealed role, and city.
- Citadels table copy uses ink on cream so ranks, seats, and empty cities stay readable on the light theme. Titles use Source Serif 4 instead of Cormorant Garamond.
- Citadels Rules modal now carries the first-game draft, gather, build, eight characters, fourteen uniques, and scoring from the attached rulebook, plus the site guest/bot/45s notes.
- Citadels (working title): first-game eight characters and fourteen unique districts. Practice vs bots on `/play/citadels`. Host picks 4, 5, or 6 seats. Guests practice only; they may spectate live tables. Disconnect wait 45 seconds. Home card published, not featured.
- Rooms and practice tables now honour per-game seat ranges and disconnect timers.

- Home is shelves: Featured, New, Most popular, Most players, Your most played (3), Last played (3). Other public shelves cap at 6. Empty shelves hide.
- Game cards show “Similar to …” under the title, plus Featured / New badges.
- Admin can edit featured, releasedAt, newUntil, similarTo, how-to-play, and details.
- New badge lasts 30 days from releasedAt unless newUntil is set.
- Rules modal (how to play + details) on the game page, practice table, and live/finished room.
- Finished rated matches store lastPlayedAt and increment site aggregates.
- Product description lives in `docs/SITE.md`. Future behaviour changes should be logged here and there.

## 2026-09-11

- First public deploy: Tic-Tac-Toe, Connect Four, rooms, bots, profiles, per-game leaderboards, admin copy.
- Live at https://bongs-boardgames.vercel.app
