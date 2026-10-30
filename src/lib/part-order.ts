interface OrderedTitle {
  title: string;
  type?: string;
  episodeInfo?: { seasonNumber: number; episodeNumber: number };
}

function sequence(item: OrderedTitle) {
  const title = item.title.toLowerCase().replace(/[_\W]+/g, " ").trim();
  if (item.episodeInfo) {
    return { key: `episode:${title}`, number: item.episodeInfo.seasonNumber, sub: item.episodeInfo.episodeNumber, letter: "" };
  }
  // Only a number after the name can identify a part; keep any VJ suffix
  // in the group key so unrelated titles aren't merged.
  const match = /^(.*\D)\s+(\d+)([a-z]?)(.*)$/.exec(title);
  if (!match) return null;
  return { key: `${item.type || "movie"}:${match[1].trim()}:#:${match[4].trim()}`, number: Number(match[2]), sub: 0, letter: match[3] };
}

/** Retain catalogue ranking, but keep related parts together first-to-last. */
export function orderMovieParts<T extends OrderedTitle>(items: readonly T[]): T[] {
  const groups = new Map<string, { item: T; number: number; sub: number; letter: string }[]>();
  for (const item of items) {
    const part = sequence(item);
    if (!part) continue;
    const group = groups.get(part.key) || [];
    group.push({ item, ...part });
    groups.set(part.key, group);
  }
  const emitted = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const part = sequence(item);
    const group = part ? groups.get(part.key) : undefined;
    if (!part || !group || group.length < 2) { result.push(item); continue; }
    if (emitted.has(part.key)) continue;
    emitted.add(part.key);
    group.sort((a, b) => a.number - b.number || a.sub - b.sub || a.letter.localeCompare(b.letter));
    result.push(...group.map(entry => entry.item));
  }
  return result;
}