# Changelog

## 2026-09-12

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
