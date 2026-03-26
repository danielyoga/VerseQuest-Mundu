import type { ScheduleVerseRow } from "@/lib/schedule/window-types";

export type VerseRef = { book: string; chapter: number; verse: number };

/** Sheet rows are chapter+verse only; book is today’s schedule book. Legacy refs may include `book`. */
export type CommunityRefInput = { chapter: number; verse: number } & Partial<
  Pick<VerseRef, "book">
>;

/** Keep only refs that appear in today’s scheduled passage (verse text comes from that passage). */
export function filterRefsInTodaySchedule(
  refs: CommunityRefInput[],
  scheduleBook: string | null,
  passage: ScheduleVerseRow[] | null
): VerseRef[] {
  if (!scheduleBook || !passage?.length) return [];
  return refs
    .filter(
      (r) =>
        (r.book == null || r.book === scheduleBook) &&
        passage.some((p) => p.chapter === r.chapter && p.verse === r.verse)
    )
    .map((r) => ({
      book: scheduleBook,
      chapter: r.chapter,
      verse: r.verse,
    }));
}
