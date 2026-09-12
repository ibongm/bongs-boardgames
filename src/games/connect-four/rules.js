export const rules = {
  howToPlay: `Two players drop coloured discs into a 7-column, 6-row grid.
On your turn choose a column; the disc falls to the lowest empty slot.
First to connect four discs in a row — horizontal, vertical, or diagonal — wins.
If the grid fills with no four-in-a-row, the game is a draw.`,
  details: `Seat 1 drops cream discs; seat 2 drops rust discs.
A column cannot be chosen when it is already full.
Bots use Easy (random), Medium (blocks obvious wins), or Hard (short search).
A human who leaves a live table is replaced by a Medium bot after 30 seconds.
Spectators may watch but cannot drop discs.
Practice games against a bot on the Play page do not change ratings.`,
};
