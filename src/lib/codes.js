const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomRoomCode(length = 6) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join('');
}

export function emptyGameStats() {
  return {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winsVsHumans: 0,
    winsVsBots: 0,
    rating: 1000,
    lastPlayedAt: 0,
  };
}

export function emptyLifetime() {
  return { played: 0, wins: 0, losses: 0, draws: 0 };
}

export function ratingDelta(winnerRating, loserRating, draw = false) {
  const expected = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const k = 24;
  if (draw) return Math.round(k * (0.5 - expected));
  return Math.round(k * (1 - expected));
}
