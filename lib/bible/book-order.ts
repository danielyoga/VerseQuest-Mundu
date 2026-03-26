import { BIBLE_BOOKS } from "@/lib/bible/data";

const bookSortIndex = new Map<string, number>();
let idx = 0;
for (const b of BIBLE_BOOKS.oldTestament) {
  bookSortIndex.set(b.name, idx++);
}
for (const b of BIBLE_BOOKS.newTestament) {
  bookSortIndex.set(b.name, idx++);
}

/** Canonical Bible order (English book keys used in schedule / submissions). Unknown books sort last. */
export function getBookSortIndex(book: string): number {
  return bookSortIndex.get(book) ?? 10_000;
}

export function compareVerseRefs(
  a: { book: string; chapter: number; verse: number },
  b: { book: string; chapter: number; verse: number }
): number {
  const ab = getBookSortIndex(a.book) - getBookSortIndex(b.book);
  if (ab !== 0) return ab;
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  return a.verse - b.verse;
}
