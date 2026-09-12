# Changelog

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
