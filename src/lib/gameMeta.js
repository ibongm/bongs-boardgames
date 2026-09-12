const NEW_MS = 30 * 24 * 60 * 60 * 1000;

export function publishedGames(site) {
  return Object.entries(site.games || {})
    .filter(([, copy]) => copy?.published !== false)
    .map(([id, copy]) => ({ id, copy }))
    .sort((a, b) => (a.copy.order || 0) - (b.copy.order || 0));
}

export function isFeatured(copy) {
  return Boolean(copy?.featured);
}

export function isNew(copy, now = Date.now()) {
  if (copy?.published === false) return false;
  if (copy?.newUntil) {
    const until = Date.parse(copy.newUntil);
    return Number.isFinite(until) && now < until;
  }
  if (!copy?.releasedAt) return false;
  const released = Date.parse(copy.releasedAt);
  return Number.isFinite(released) && now < released + NEW_MS;
}

export function resolveRules(game, copy = {}) {
  const shipped = game?.rules || { howToPlay: '', details: '' };
  return {
    howToPlay: (copy.howToPlay || shipped.howToPlay || '').trim(),
    details: (copy.rulesDetails || shipped.details || '').trim(),
  };
}
