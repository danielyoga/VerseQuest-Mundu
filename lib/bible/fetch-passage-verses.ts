import { getAlkitabMobiSlug, fetchTbChapterVerses } from "./alkitab-mobi";
import { getVerseCountForChapter } from "./data";
import {
  getAllowedVersesInChapter,
  parseReadingRange,
  type ReadingConstraint,
} from "./schedule";

export type PassageVerseRow = { chapter: number; verse: number; text: string };

export const MAX_PASSAGE_VERSES = 300;

function buildConstraint(book: string, reading: string): ReadingConstraint {
  return { book, ...parseReadingRange(reading) };
}

/** Fetches TB verse text from alkitab.mobi for a scheduled reading range (same rules as /api/bible-passage). */
export async function fetchPassageVersesFromReading(
  bookTrim: string,
  reading: string
): Promise<PassageVerseRow[]> {
  const slug = getAlkitabMobiSlug(bookTrim);
  if (!slug) {
    throw new Error("unknown_book");
  }

  const c = buildConstraint(bookTrim, reading);

  let verseTotal = 0;
  for (let ch = c.startCh; ch <= c.endCh; ch++) {
    const maxV = getVerseCountForChapter(bookTrim, ch);
    verseTotal += getAllowedVersesInChapter(ch, c, maxV).length;
  }
  if (verseTotal > MAX_PASSAGE_VERSES) {
    throw new Error("passage_too_long");
  }

  const chapterMaps = new Map<number, Map<number, string>>();
  const chapters: number[] = [];
  for (let ch = c.startCh; ch <= c.endCh; ch++) chapters.push(ch);

  await Promise.all(
    chapters.map(async (ch) => {
      const map = await fetchTbChapterVerses(slug, ch);
      chapterMaps.set(ch, map);
    })
  );

  const verses: PassageVerseRow[] = [];

  for (let ch = c.startCh; ch <= c.endCh; ch++) {
    const maxV = getVerseCountForChapter(bookTrim, ch);
    const allowed = getAllowedVersesInChapter(ch, c, maxV);
    const map = chapterMaps.get(ch);
    if (!map) continue;

    for (const v of allowed) {
      const text = map.get(v);
      if (text === undefined) {
        verses.push({ chapter: ch, verse: v, text: "—" });
      } else {
        verses.push({ chapter: ch, verse: v, text });
      }
    }
  }

  return verses;
}
