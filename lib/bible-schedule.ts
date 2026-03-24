import scheduleRaw from "@/data/bible-verse-schedule.json";
import { getVerseCountForChapter } from "@/lib/bible-data";

export type ScheduleEntry = {
  month?: number;
  date: number;
  book: string;
  reading: string;
};

const SCHEDULE: ScheduleEntry[] = scheduleRaw as ScheduleEntry[];

/** Parsed range: start and end chapter/verse (inclusive). */
export type ReadingConstraint = {
  book: string;
  startCh: number;
  startVs: number;
  endCh: number;
  endVs: number;
};

/**
 * Parses strings like "2:9 - 3:14" or "7:1 - 60" (same chapter).
 * Whitespace around "-" is ignored.
 */
export function parseReadingRange(reading: string): Omit<ReadingConstraint, "book"> {
  const s = reading.replace(/\s/g, "");
  const two = s.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (two) {
    return {
      startCh: Number(two[1]),
      startVs: Number(two[2]),
      endCh: Number(two[3]),
      endVs: Number(two[4]),
    };
  }
  const one = s.match(/^(\d+):(\d+)-(\d+)$/);
  if (one) {
    const ch = Number(one[1]);
    return {
      startCh: ch,
      startVs: Number(one[2]),
      endCh: ch,
      endVs: Number(one[3]),
    };
  }
  throw new Error(`Invalid reading range: ${reading}`);
}

export function getScheduleForDate(d: Date): ScheduleEntry | null {
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return (
    SCHEDULE.find(
      (e) =>
        e.date === day && (e.month === undefined || e.month === month)
    ) ?? null
  );
}

export function constraintFromEntry(entry: ScheduleEntry): ReadingConstraint {
  const r = parseReadingRange(entry.reading);
  return { book: entry.book, ...r };
}

function rangeInclusive(a: number, b: number): number[] {
  if (a > b) return [];
  const out: number[] = [];
  for (let v = a; v <= b; v++) out.push(v);
  return out;
}

/** Inclusive verse numbers for this chapter within the reading range. */
export function getAllowedVersesInChapter(
  chapter: number,
  c: ReadingConstraint,
  maxVerseInChapter: number
): number[] {
  const { startCh, startVs, endCh, endVs } = c;
  if (chapter < startCh || chapter > endCh) return [];

  if (chapter === startCh && chapter === endCh) {
    return rangeInclusive(
      startVs,
      Math.min(endVs, maxVerseInChapter)
    );
  }
  if (chapter === startCh) {
    return rangeInclusive(startVs, maxVerseInChapter);
  }
  if (chapter === endCh) {
    return rangeInclusive(1, Math.min(endVs, maxVerseInChapter));
  }
  return rangeInclusive(1, maxVerseInChapter);
}

export function listChaptersInRange(c: ReadingConstraint): number[] {
  const out: number[] = [];
  for (let ch = c.startCh; ch <= c.endCh; ch++) out.push(ch);
  return out;
}

/** Validates that chapter/verse is inside the allowed range for this book. */
export function isSelectionInConstraint(
  book: string,
  chapter: number,
  verse: number,
  c: ReadingConstraint
): boolean {
  if (book !== c.book) return false;
  const maxV = getVerseCountForChapter(book, chapter);
  const allowed = getAllowedVersesInChapter(chapter, c, maxV);
  return allowed.includes(verse);
}
