import {
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
} from "./client";

/** Today-only tab: chapter | verse (book comes from today’s schedule on the client). */
export function getCommunityVersesTabTitle(): string {
  return process.env.VERSEQUEST_COMMUNITY_VERSES_TAB ?? "Today_Community_Verses";
}

/** Full read for writes (sync/dedupe) — must not truncate or merges can drop rows. */
const MAX_COMMUNITY_READ_ROWS = 500;
const CLEAR_BELOW_HEADER = `A2:B${MAX_COMMUNITY_READ_ROWS}`;

function clampReadRows(totalRows: number): number {
  return Math.max(2, Math.min(MAX_COMMUNITY_READ_ROWS, Math.floor(totalRows)));
}

export type CommunityVerseRef = {
  chapter: number;
  verse: number;
};

function refKey(chapter: number, verse: number): string {
  return `${chapter}|${verse}`;
}

function compareChapterVerse(
  a: CommunityVerseRef,
  b: CommunityVerseRef
): number {
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  return a.verse - b.verse;
}

type ParsedRow = {
  ref: CommunityVerseRef;
  raw: string[];
};

/** Serialize writes so concurrent streak-sync runs cannot double-append the same ref. */
let communityWriteChain: Promise<void> = Promise.resolve();

function withCommunityWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = communityWriteChain.then(fn);
  communityWriteChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/** Recognized header: chapter | verse (or legacy book | chapter | verse). */
function parseHeaderIndices2Col(header: string[]) {
  const iCh = findHeaderIndex(header, ["chapter", "pasal", "ch"]);
  const iVs = findHeaderIndex(header, ["verse", "ayat"]);
  if (iCh < 0 || iVs < 0) return null;
  return { iCh, iVs };
}

function parseHeaderIndices3Col(header: string[]) {
  const iBook = findHeaderIndex(header, ["book", "kitab"]);
  const iCh = findHeaderIndex(header, ["chapter", "pasal", "ch"]);
  const iVs = findHeaderIndex(header, ["verse", "ayat"]);
  if (iBook < 0 || iCh < 0 || iVs < 0) return null;
  return { iBook, iCh, iVs };
}

const FALLBACK_2COL = { iCh: 0, iVs: 1 } as const;
const FALLBACK_3COL = { iBook: 0, iCh: 1, iVs: 2 } as const;
const SYNTHETIC_HEADER_2 = ["chapter", "verse"];

function rowToParsed2Col(
  row: string[],
  indices: { iCh: number; iVs: number }
): ParsedRow | null {
  if (!row?.length) return null;
  const ch = parseInt(String(row[indices.iCh] ?? "").trim(), 10);
  const vs = parseInt(String(row[indices.iVs] ?? "").trim(), 10);
  if (!Number.isFinite(ch) || !Number.isFinite(vs)) return null;
  const raw = [String(ch), String(vs)];
  return { ref: { chapter: ch, verse: vs }, raw };
}

function rowToParsed3ColLegacy(
  row: string[],
  indices: { iBook: number; iCh: number; iVs: number }
): ParsedRow | null {
  if (!row?.length) return null;
  const ch = parseInt(String(row[indices.iCh] ?? "").trim(), 10);
  const vs = parseInt(String(row[indices.iVs] ?? "").trim(), 10);
  if (!Number.isFinite(ch) || !Number.isFinite(vs)) return null;
  const raw = [String(ch), String(vs)];
  return { ref: { chapter: ch, verse: vs }, raw };
}

type ReadMode = "2col" | "3col";

/**
 * @param readRows Total rows to fetch including header (row 1). Larger = more data, slower.
 *        GET /api/verse-community can pass 1 + today’s passage verse count for a tight range.
 */
async function readCommunitySheetRows(options?: {
  readRows?: number;
}): Promise<{
  header: string[];
  mode: ReadMode;
  rows: ParsedRow[];
} | null> {
  const readRows = clampReadRows(
    options?.readRows ?? MAX_COMMUNITY_READ_ROWS
  );
  const readRange = `A1:B${readRows}`;
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = escapeSheetTitleForRange(getCommunityVersesTabTitle());
  let res;
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!${readRange}`,
    });
  } catch {
    return null;
  }
  const data = res.data.values ?? [];
  if (data.length < 1) return null;
  const firstRow = data[0].map((c) => String(c ?? ""));
  const header2 = parseHeaderIndices2Col(firstRow);
  const header3 = parseHeaderIndices3Col(firstRow);

  let header: string[];
  let mode: ReadMode;
  let startRow: number;

  if (header2) {
    header = firstRow;
    mode = "2col";
    startRow = 1;
  } else if (header3) {
    header = firstRow;
    mode = "3col";
    startRow = 1;
  } else {
    if (rowToParsed2Col(firstRow, FALLBACK_2COL)) {
      header = [...SYNTHETIC_HEADER_2];
      mode = "2col";
      startRow = 0;
    } else if (rowToParsed3ColLegacy(firstRow, FALLBACK_3COL)) {
      header = ["book", "chapter", "verse"];
      mode = "3col";
      startRow = 0;
    } else {
      return null;
    }
  }

  const out: ParsedRow[] = [];
  for (let r = startRow; r < data.length; r++) {
    const row = data[r];
    const parsed =
      mode === "2col"
        ? rowToParsed2Col(row ?? [], header2 ?? FALLBACK_2COL)
        : rowToParsed3ColLegacy(row ?? [], header3 ?? FALLBACK_3COL);
    if (parsed) out.push(parsed);
  }
  return { header, mode, rows: out };
}

function uniqueSortedRows(rows: ParsedRow[]): ParsedRow[] {
  const firstByKey = new Map<string, ParsedRow>();
  for (const p of rows) {
    const k = refKey(p.ref.chapter, p.ref.verse);
    if (!firstByKey.has(k)) firstByKey.set(k, p);
  }
  return [...firstByKey.values()].sort((a, b) =>
    compareChapterVerse(a.ref, b.ref)
  );
}

async function writeCommunitySheetUniqueRows(unique: ParsedRow[]): Promise<void> {
  const header = [...SYNTHETIC_HEADER_2];
  const outRows: string[][] = [
    header,
    ...unique.map((p) => p.raw.slice(0, 2)),
  ];

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = escapeSheetTitleForRange(getCommunityVersesTabTitle());

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tab}!${CLEAR_BELOW_HEADER}`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1:B${outRows.length}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: outRows },
  });
}

/**
 * One read: sorted unique refs + count (shared by verse-community API and badge).
 * @param maxRows Total sheet rows to read (including header). Omit for full read (badge / server sync).
 */
export async function getCommunityVersesPayload(maxRows?: number): Promise<{
  verses: CommunityVerseRef[];
  count: number;
}> {
  const parsed = await readCommunitySheetRows(
    maxRows == null || !Number.isFinite(maxRows)
      ? { readRows: MAX_COMMUNITY_READ_ROWS }
      : { readRows: clampReadRows(maxRows) }
  );
  if (!parsed) return { verses: [], count: 0 };

  const seen = new Set<string>();
  const out: CommunityVerseRef[] = [];
  for (const p of parsed.rows) {
    const k = refKey(p.ref.chapter, p.ref.verse);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p.ref);
  }
  out.sort(compareChapterVerse);
  return { verses: out, count: out.length };
}

/** Unique passage count — full read (nav badge has no schedule hint). */
export async function getCommunityUniqueVerseCount(): Promise<number> {
  return (await getCommunityVersesPayload()).count;
}

/**
 * Read → merge new ref if missing → single write (no append + second-pass dedupe).
 * Locked so overlapping streak-sync requests cannot insert duplicates.
 */
export async function syncCommunitySheetAfterVerseSubmit(params: {
  book: string;
  chapter: number;
  verse: number;
}): Promise<void> {
  const { chapter, verse } = params;
  await withCommunityWriteLock(async () => {
    const parsed = await readCommunitySheetRows({
      readRows: MAX_COMMUNITY_READ_ROWS,
    });
    const key = refKey(chapter, verse);
    const existing = parsed?.rows ?? [];
    const exists = existing.some(
      (p) => refKey(p.ref.chapter, p.ref.verse) === key
    );
    if (exists) return;

    const newRow: ParsedRow = {
      ref: { chapter, verse },
      raw: [String(chapter), String(verse)],
    };
    const merged = uniqueSortedRows([...existing, newRow]);
    await writeCommunitySheetUniqueRows(merged);
  });
}

/** One row per unique (chapter, verse); sorted. Locked. */
export async function dedupeCommunitySheet(): Promise<void> {
  await withCommunityWriteLock(async () => {
    const parsed = await readCommunitySheetRows({
      readRows: MAX_COMMUNITY_READ_ROWS,
    });
    if (!parsed) return;
    const unique = uniqueSortedRows(parsed.rows);
    await writeCommunitySheetUniqueRows(unique);
  });
}

/** All rows in the today-only tab (unique refs, sorted). Prefer getCommunityVersesPayload when you also need count. */
export async function readAllCommunityVerseRefs(): Promise<CommunityVerseRef[]> {
  return (await getCommunityVersesPayload()).verses;
}
