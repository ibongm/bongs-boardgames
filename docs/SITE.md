# Bong's Board Games — product log

Living description of the site. Update this file whenever behaviour or presentation changes.

## What it is

Public tabletop rooms plus instant bot practice. English only. Playable on phones and PCs.

- Site: https://bongs-boardgames.vercel.app
- Repo: https://github.com/ibongm/bongs-boardgames
- Firebase: `bongs-boardgames-55d28`
- Admin email: `ivanm.ploce@gmail.com`

## Standing rules for every change

- Reuse one modal component for overlays.
- Player-facing copy has a code default and can be overridden in Admin.
- Hide empty chrome (no empty home shelves, no blank rules modal).
- Rules control on a live table must be reachable with a thumb.
- Public home shelves for everyone; personal shelves only after sign-in.
- Prefer small files over growing `Home.jsx` / `Room.jsx`.
- English only.
- On a finished rated match, write `lastPlayedAt` and site aggregates.
- Featured / New are badges and can also be their own rows.

## Home

Rows, in order:

1. Featured (up to 6) — Admin `featured`
2. New (up to 6) — `releasedAt` + 30 days, or `newUntil` if set
3. Most popular (up to 6) — finished rated matches (`stats/games`)
4. Most players (up to 6) — unique humans who finished that title
5. Your most played (3) — signed-in, by that player's play count
6. Last played (3) — signed-in, by `lastPlayedAt`

Empty rows are hidden. A game may appear in more than one row.

Each card: preview board, Featured/New badges, title, “Similar to …”, blurb, player count, optional personal hint, Play vs bot / Tables & rules.

## Games

Shipped: Tic-Tac-Toe (2), Connect Four (2), Citadels (4–6, working title).
Unpublished / In Development: Pioneer (3–4 seats, island settlement board game, `published: false`).

Per-game Admin fields: title, blurb, similarTo, published, featured, releasedAt, newUntil, howToPlay, rulesDetails, order. Unpublished games do not appear on home shelves.

## Rules

One popup, two layers: How to play, then Details. Same modal on the game page, the practice table, and a live/finished room. Live rooms add a “This match” strip (seats, bot difficulty, disconnect replacement). Citadels and Pioneer wait 45 seconds; other titles wait 30 seconds.

Shipped text lives in `src/games/<id>/rules.js`. Admin overrides win when non-empty.

Citadels ships the first-game rules (4–6 seats, eight characters, fourteen uniques). Body, cards, and the rules modal use ink on cream. Cream text stays on the burgundy header and filled primary buttons. Display face is Source Serif 4. Districts, characters, and other seats open a popup with art and the card or player text. Official card photos for all 8 characters, card back, 17 basic districts, and 10 unique districts are extracted from the official demo cards sheet.

Pioneer ships complete 5th-edition-style island settlement rules (3–4 seats, 10 Victory Points): pointy-top hex grid, Balanced Isle printed starts, Random Isle spiral placement, 2d6 production, roll of 7 discard/Bandit/steal, maritime and domestic trading, contextual building (roads, settlements, cities), Breakthrough deck with hidden Charters, Longest Route, and Grand Garrison.

## Play

- Sign-in required to create or sit at a human room.
- Public spectating: guests and unauthenticated visitors can spectate any public table in read-only mode with hidden information redacted.
- Practice vs bot: instant on `/play/:gameId`, unrated. For Pioneer, guests may practice on Balanced Isle; Random Isle requires signing in.
- Google + email/password.
- Public lobby + room code. Optional host password.
- Host adds bots in the lobby only (Easy / Medium / Hard).
- Disconnect: wait 30s (45s in Citadels and Pioneer), then replace with a Medium bot.
- Ratings only for matches with 2+ signed-in humans. Winner is rated against the average of other participating humans; bots are excluded from rating adjustments.

## After a match

Win/loss/draw on the profile. Per-game leaderboard. `games.{id}.lastPlayedAt` on the player. Site-wide `stats/games` counters for shelves. Pioneer completes with one winner (no draws).
