# Bong's Board Games

English-only public tabletop site. Playable on phones and PCs.

- Site: https://bongs-boardgames.vercel.app
- Repo: https://github.com/ibongm/bongs-boardgames
- Vercel project: bongs-boardgames on team Bong
- Firebase: `bongs-boardgames-55d28`
- Admin email: ivanm.ploce@gmail.com
- Stack: Vite + React + Firebase + Vercel

Product log: `docs/SITE.md`. Changelog: `CHANGELOG.md`. Update both when behaviour or presentation changes.

## What the site is

Public rooms plus instant bot practice. Guests may play versus a bot; those games never count. Ranked tables require an account. Stats and Elo apply only when two signed-in humans sat down.

## Standing rules

- Prefer small modular files. Do not grow `Home.jsx` or `Room.jsx` into feature dumping grounds.
- Reuse one modal component for overlays.
- Player-facing copy has a code default and can be overridden in Admin.
- Hide empty chrome (no empty home shelves, no blank rules modal).
- Rules control on a live table must be reachable with a thumb.
- Public home shelves for everyone; personal shelves only after sign-in.
- Featured / New are badges and can also be their own rows.
- On a finished rated match, write `lastPlayedAt` and site aggregates.
- English only.
- Do not commit `.env` secrets. Use `.env.example` only.

## Home

Rows, in order. Empty rows are hidden. A game may appear in more than one row.

1. Featured (up to 6) — Admin `featured`
2. New (up to 6) — `releasedAt` + 30 days, or `newUntil` if set
3. Most popular (up to 6) — finished rated matches (`stats/games`)
4. Most players (up to 6) — unique humans who finished that title
5. Your most played (3) — signed-in, by that player's play count
6. Last played (3) — signed-in, by `lastPlayedAt`

Each card: preview board, Featured/New badges, title, “Similar to …”, blurb, player count, optional personal hint, Play vs bot / Tables & rules.

## Games

Shipped: Tic-Tac-Toe (`tic-tac-toe`, 2 players), Connect Four (`connect-four`, 2 players).

Each game lives under `src/games/<id>/` with `meta.js`, `engine.js`, `ai.js`, `rules.js`, `Board.jsx`. Register in `src/games/registry.js` as `{ meta, engine, ai, rules, Board }`.

Per-game Admin fields: title, blurb, similarTo, published, featured, releasedAt, newUntil, howToPlay, rulesDetails, order. Unpublished games must not appear on home shelves.

## Rules

One popup, two layers: How to play, then Details. Same modal on the game page, the practice table, and a live or finished room. Live rooms add a “This match” strip (seats, bot difficulty, 30-second disconnect replacement).

Shipped text lives in `src/games/<id>/rules.js`. Admin overrides win when non-empty.

## Auth, rooms, and play

- Sign-in required to create or join a Firebase room.
- Google + email/password. Display name is chosen by the player and editable on profile.
- Public lobby plus room code. Optional host password.
- Spectators allowed.
- Host may add bots in the lobby only (Easy / Medium / Hard).
- Mid-game disconnect: wait 30 seconds, then replace the human with a Medium bot.
- Practice vs bot on `/play/:gameId` is public and unrated.
- Ratings only when two or more signed-in humans are in `playerIds`.

## After a match

Win / loss / draw on the profile. Per-game leaderboard. Store `games.{id}.lastPlayedAt` on the player. Increment site-wide `stats/games` counters used by home shelves.

## How to work in this repo

1. Read `docs/SITE.md` and this file before editing.
2. Match existing patterns in `src/games/`, `src/services/`, and `src/screens/`.
3. After a behaviour change, update `docs/SITE.md` and `CHANGELOG.md`.
4. Do not regress Tic-Tac-Toe or Connect Four.
