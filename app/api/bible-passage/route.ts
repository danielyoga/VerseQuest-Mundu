import { NextRequest, NextResponse } from "next/server";
import { getAlkitabMobiSlug, fetchTbChapterVerses } from "@/lib/alkitab-mobi";
import { getVerseCountForChapter } from "@/lib/bible-data";
import {
  getAllowedVersesInChapter,
  parseReadingRange,
  type ReadingConstraint,
} from "@/lib/bible-schedule";

export const runtime = "nodejs";

const MAX_VERSES = 300;

function buildConstraint(book: string, reading: string): ReadingConstraint {
  return { book, ...parseReadingRange(reading) };
}

export async function GET(req: NextRequest) {
  const book = req.nextUrl.searchParams.get("book");
  const reading = req.nextUrl.searchParams.get("reading");

  if (!book?.trim() || !reading?.trim()) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const bookTrim = book.trim();
  const slug = getAlkitabMobiSlug(bookTrim);
  if (!slug) {
    return NextResponse.json({ error: "unknown_book" }, { status: 400 });
  }

  let c: ReadingConstraint;
  try {
    c = buildConstraint(bookTrim, reading);
  } catch {
    return NextResponse.json({ error: "bad_reading" }, { status: 400 });
  }

  let verseTotal = 0;
  for (let ch = c.startCh; ch <= c.endCh; ch++) {
    const maxV = getVerseCountForChapter(bookTrim, ch);
    verseTotal += getAllowedVersesInChapter(ch, c, maxV).length;
  }
  if (verseTotal > MAX_VERSES) {
    return NextResponse.json({ error: "passage_too_long" }, { status: 400 });
  }

  try {
    const chapterMaps = new Map<number, Map<number, string>>();
    const chapters: number[] = [];
    for (let ch = c.startCh; ch <= c.endCh; ch++) chapters.push(ch);

    await Promise.all(
      chapters.map(async (ch) => {
        const map = await fetchTbChapterVerses(slug, ch);
        chapterMaps.set(ch, map);
      })
    );

    const verses: { chapter: number; verse: number; text: string }[] = [];

    for (let ch = c.startCh; ch <= c.endCh; ch++) {
      const maxV = getVerseCountForChapter(bookTrim, ch);
      const allowed = getAllowedVersesInChapter(ch, c, maxV);
      const map = chapterMaps.get(ch);
      if (!map) continue;

      for (const v of allowed) {
        const text = map.get(v);
        if (text === undefined) {
          verses.push({
            chapter: ch,
            verse: v,
            text: "—",
          });
        } else {
          verses.push({ chapter: ch, verse: v, text });
        }
      }
    }

    return NextResponse.json({
      verses,
      version: "TB",
      source: "alkitab.mobi",
    });
  } catch {
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}
