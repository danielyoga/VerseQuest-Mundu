import { toLocalDateString } from "@/lib/date-utils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Normalize to YYYY-MM-DD, drop invalid tokens. */
export function normalizeYmdList(dates: string[]): string[] {
  const out = new Set<string>();
  for (const d of dates) {
    const ymd = String(d ?? "")
      .trim()
      .slice(0, 10);
    if (DATE_RE.test(ymd)) out.add(ymd);
  }
  return [...out].sort();
}

export function mergeSubmissionDateSets(a: string[], b: string[]): string[] {
  return normalizeYmdList([...a, ...b]);
}

/**
 * XP: never drop progress — max of local, remote, and implied by unique days.
 * (10 XP per unique submission day matches client `submitVerse`.)
 */
export function mergeXpTotals(
  localXp: number,
  remoteXp: number,
  mergedDateCount: number
): number {
  const implied = mergedDateCount * 10;
  return Math.max(
    Number.isFinite(localXp) ? localXp : 0,
    Number.isFinite(remoteXp) ? remoteXp : 0,
    implied
  );
}

/**
 * Current streak = consecutive calendar days with a submission, ending at the latest submitted day.
 */
export function recomputeStreakStatsFromDates(
  dates: string[]
): { streak_count: number; last_submitted_at: string | null } {
  const sorted = normalizeYmdList(dates);
  if (sorted.length === 0) {
    return { streak_count: 0, last_submitted_at: null };
  }
  const last = sorted[sorted.length - 1]!;
  const set = new Set(sorted);
  let count = 0;
  const cursor = new Date(`${last}T12:00:00`);
  while (set.has(toLocalDateString(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak_count: count, last_submitted_at: last };
}

/** API + client: merged sync payload (sheet stores only dates in month tabs). */
export interface StreakSyncMergedPayload {
  submission_dates: string[];
  streak_count: number;
  last_submitted_at: string | null;
  xp_total: number;
}

export function buildMergedLocalState(
  prevXp: number,
  mergedDates: string[]
): Pick<
  StreakSyncMergedPayload,
  "submission_dates" | "streak_count" | "last_submitted_at" | "xp_total"
> {
  const { streak_count, last_submitted_at } =
    recomputeStreakStatsFromDates(mergedDates);
  const xp_total = mergeXpTotals(prevXp, 0, mergedDates.length);
  return {
    submission_dates: mergedDates,
    streak_count,
    last_submitted_at,
    xp_total,
  };
}
