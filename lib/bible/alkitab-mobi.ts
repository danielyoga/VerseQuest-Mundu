/**
 * Alkitab Mobile SABDA (alkitab.mobi) — TB passage fetch for server-side use.
 * Book slugs match site URLs, e.g. Nehemiah → Neh, Genesis → Kej.
 *
 * HTML is parsed with regex (no cheerio) so Next/Turbopack never bundles a DOM parser.
 */

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** English book name (same as bible-data / schedule JSON) → alkitab.mobi path segment */
export const BOOK_EN_TO_ALKITAB_MOBI_SLUG: Record<string, string> = {
  Genesis: "Kej",
  Exodus: "Kel",
  Leviticus: "Im",
  Numbers: "Bil",
  Deuteronomy: "Ulh",
  Joshua: "Yos",
  Judges: "Hak",
  Ruth: "Rut",
  "1 Samuel": "1Sam",
  "2 Samuel": "2Sam",
  "1 Kings": "1Raj",
  "2 Kings": "2Raj",
  "1 Chronicles": "1Taw",
  "2 Chronicles": "2Taw",
  Ezra: "Ezra",
  Nehemiah: "Neh",
  Esther: "Est",
  Job: "Ayb",
  Psalms: "Maz",
  Proverbs: "Ams",
  Ecclesiastes: "Peng",
  "Song of Solomon": "Kid",
  Isaiah: "Yes",
  Jeremiah: "Yer",
  Lamentations: "Rat",
  Ezekiel: "Yeh",
  Daniel: "Dan",
  Hosea: "Hos",
  Joel: "Yol",
  Amos: "Amos",
  Obadiah: "Oba",
  Jonah: "Yun",
  Micah: "Mik",
  Nahum: "Nah",
  Habakkuk: "Hab",
  Zephaniah: "Zef",
  Haggai: "Hag",
  Zechariah: "Zak",
  Malachi: "Mal",
  Matthew: "Mat",
  Mark: "Mrk",
  Luke: "Luk",
  John: "Yoh",
  Acts: "Kis",
  Romans: "Rom",
  "1 Corinthians": "1Kor",
  "2 Corinthians": "2Kor",
  Galatians: "Gal",
  Ephesians: "Efs",
  Philippians: "Filip",
  Colossians: "Kol",
  "1 Thessalonians": "1Tes",
  "2 Thessalonians": "2Tes",
  "1 Timothy": "1Tim",
  "2 Timothy": "2Tim",
  Titus: "Tit",
  Philemon: "Flm",
  Hebrews: "Ibr",
  James: "Yak",
  "1 Peter": "1Ptr",
  "2 Peter": "2Ptr",
  "1 John": "1Yoh",
  "2 John": "2Yoh",
  "3 John": "3Yoh",
  Jude: "Yud",
  Revelation: "Wah",
};

export function getAlkitabMobiSlug(bookEn: string): string | undefined {
  return BOOK_EN_TO_ALKITAB_MOBI_SLUG[bookEn];
}

/**
 * Verse rows from a single chapter page (TB).
 * Matches alkitab.mobi markup: reftext link + span with data-begin (read-along audio).
 */
export function parseAlkitabMobiChapterHtml(html: string): { verse: number; text: string }[] {
  const out: { verse: number; text: string }[] = [];
  const re =
    /<span class="reftext"><a[^>]*>(\d+)<\/a><\/span>\s*<span[^>]*data-begin[^>]*>([^<]*)<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const verse = parseInt(m[1], 10);
    const raw = m[2].trim();
    if (!Number.isFinite(verse) || verse < 1 || !raw) continue;
    out.push({ verse, text: decodeHtmlEntities(raw) });
  }
  out.sort((a, b) => a.verse - b.verse);
  return out;
}

const TB_BASE = "https://alkitab.mobi/tb";

export async function fetchTbChapterVerses(
  slug: string,
  chapter: number
): Promise<Map<number, string>> {
  const url = `${TB_BASE}/${slug}/${chapter}/`;
  const res = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "VerseQuest/1.0",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`alkitab.mobi ${res.status}`);
  }

  const html = await res.text();
  const rows = parseAlkitabMobiChapterHtml(html);
  const map = new Map<number, string>();
  for (const { verse, text } of rows) {
    map.set(verse, text);
  }
  return map;
}
