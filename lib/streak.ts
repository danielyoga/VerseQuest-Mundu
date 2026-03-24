import { toLocalDateString } from "./date-utils";
import type { StoredState } from "@/types";

export type WeekDotState = "done" | "today" | "missed" | "future";

/** Streak shown in UI: 0 if gap > 1 day, else stored count. */
export function getDisplayStreak(state: Pick<StoredState, "streak_count" | "last_submitted_at">): number {
  const today = toLocalDateString(new Date());
  const yesterday = toLocalDateString(new Date(Date.now() - 86400000));
  const last = state.last_submitted_at?.slice(0, 10) ?? null;
  if (!last) return 0;
  if (last === today) return state.streak_count;
  if (last === yesterday) return state.streak_count;
  return 0;
}

export function hasSubmittedToday(lastSubmittedAt: string | null): boolean {
  if (!lastSubmittedAt) return false;
  return lastSubmittedAt.slice(0, 10) === toLocalDateString(new Date());
}

export function getMoodEmoji(streak: number): string {
  if (streak === 0) return "😢";
  if (streak <= 5) return "😊";
  if (streak <= 14) return "😄";
  return "🤩";
}

/** Mon–Sun dots for the current week */
export function getWeekDots(submissionDates: string[], now: Date = new Date()): WeekDotState[] {
  const todayStr = toLocalDateString(now);
  const set = new Set(submissionDates.map((d) => d.slice(0, 10)));

  const d = new Date(now);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const out: WeekDotState[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    const dateStr = toLocalDateString(x);

    if (dateStr > todayStr) {
      out.push("future");
    } else if (dateStr === todayStr) {
      out.push(set.has(dateStr) ? "done" : "today");
    } else {
      out.push(set.has(dateStr) ? "done" : "missed");
    }
  }
  return out;
}

/** After a successful submit: compute new streak */
export function computeStreakAfterSubmit(
  prev: Pick<StoredState, "streak_count" | "last_submitted_at">,
  todayStr: string,
  yesterdayStr: string
): number {
  const last = prev.last_submitted_at?.slice(0, 10) ?? null;
  if (last === todayStr) return prev.streak_count;
  if (!last || last < yesterdayStr) return 1;
  if (last === yesterdayStr) return prev.streak_count + 1;
  return 1;
}
