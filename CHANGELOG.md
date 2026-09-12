# Changelog

## 2026-09-12

- Players can no longer write `role`, `disabled`, `stats`, or `games` on their private user document. Only display name (and email to match the signed-in account) may change. Admin role on first create is limited to `ivanm.ploce@gmail.com`.
- Rated Elo and play counts now live on `publicProfiles`. The private user doc is identity and privileges only.
- Match creates require the signed-in player to be in `playerIds`. Match updates freeze game/room/player identity, write `result` once, and after the result only allow stats flags.
- Room creates must be hosted by the signer. Waiting rooms can no longer be edited by arbitrary signed-in users unless they are joining (`participantIds`). Host, code, game, password hash, and createdAt are frozen.
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
