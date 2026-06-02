const COUNT_TTL_MS = 60_000;

let cachedAt = 0;
let cachedCount: number | null = null;
let inflight: Promise<number> | null = null;

/** Dedupe community badge fetches across nav mounts and tab visibility. */
export function fetchVerseCommunityCount(force = false): Promise<number> {
  const now = Date.now();
  if (!force && cachedCount !== null && now - cachedAt < COUNT_TTL_MS) {
    return Promise.resolve(cachedCount);
  }
  if (inflight) return inflight;

  inflight = fetch("/api/verse-community-count")
    .then((r) => r.json() as Promise<{ count?: number }>)
    .then((d) => {
      const count = typeof d.count === "number" ? d.count : 0;
      cachedCount = count;
      cachedAt = Date.now();
      return count;
    })
    .catch(() => {
      cachedCount = 0;
      cachedAt = Date.now();
      return 0;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateVerseCommunityCountCache(): void {
  cachedAt = 0;
}
