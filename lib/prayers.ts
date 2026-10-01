import { defaultPrayer, type PrayerPayload } from "@/lib/prayer-content";

const PRAYER_CACHE_KEY = "vq_prayer_cache";

function readCache(): PrayerPayload | null {
  try {
    const raw = localStorage.getItem(PRAYER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PrayerPayload>;
    if (typeof parsed.text !== "string" || !parsed.text.trim()) return null;
    return { date: parsed.date ?? null, text: parsed.text, source: "cache" };
  } catch {
    return null;
  }
}

function writeCache(p: PrayerPayload): void {
  try {
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({ date: p.date, text: p.text }));
  } catch {
    /* storage unavailable: offline fallback just won't exist */
  }
}

/** Shown on first paint so Amen never waits: cached prayer, else the built-in default. */
export function getInitialPrayer(): PrayerPayload {
  return readCache() ?? defaultPrayer();
}

/**
 * Today's prayer from the API (`today` = device local YYYY-MM-DD).
 * Sheet text is cached for offline use; on failure or no content, falls back to cache, then default.
 */
export async function fetchTodayPrayer(today: string): Promise<PrayerPayload> {
  try {
    const res = await fetch(`/api/prayer?date=${encodeURIComponent(today)}`);
    if (res.ok) {
      const data = (await res.json()) as PrayerPayload;
      if (data.source === "sheet" && data.text) {
        writeCache(data);
        return data;
      }
    }
  } catch {
    /* offline or network error */
  }
  return getInitialPrayer();
}
