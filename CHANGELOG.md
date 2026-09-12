# Changelog

## 2026-09-12

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
