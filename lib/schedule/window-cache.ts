import type { ScheduleWindowDay, ScheduleWindowResponse } from "./window-types";

export const SCHEDULE_WINDOW_CACHE_KEY = "versequest_schedule_window_v1";

type Stored = {
  anchor: string;
  payload: ScheduleWindowResponse;
};

/** Valid only when `anchor` matches today's local YYYY-MM-DD (new day → miss → refetch). */
export function readScheduleWindowCache(anchorYmd: string): ScheduleWindowResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCHEDULE_WINDOW_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed.anchor !== anchorYmd || !parsed.payload?.days) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

export function writeScheduleWindowCache(
  anchorYmd: string,
  payload: ScheduleWindowResponse
): void {
  try {
    const body: Stored = { anchor: anchorYmd, payload };
    localStorage.setItem(SCHEDULE_WINDOW_CACHE_KEY, JSON.stringify(body));
  } catch {
    /* quota / private mode */
  }
}

/** Remove cached window (e.g. after detecting stale or unusable payload). */
export function clearScheduleWindowCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SCHEDULE_WINDOW_CACHE_KEY);
  } catch {
    /* quota / private mode */
  }
}

/**
 * True when we can trust the cached entry for today without refetching the sheet.
 * `no_row` or a missing entry means we should fetch again (sheet may have been updated).
 */
export function isUsableCachedScheduleDay(day: ScheduleWindowDay | undefined): boolean {
  if (!day) return false;
  if (day.ok) return true;
  if (day.reason === "no_row") return false;
  if (day.book != null && day.reading != null) return true;
  return false;
}
