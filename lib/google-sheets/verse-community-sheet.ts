import {
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
} from "./client";

/** Tab name for the community verses sheet. */
export function getCommunityVersesTabTitle(): string {
  return process.env.VERSEQUEST_COMMUNITY_VERSES_TAB ?? "Today_Community_Verses";
}

const MAX_COMMUNITY_READ_ROWS = 500;
const CLEAR_BELOW_HEADER = `A2:C${MAX_COMMUNITY_READ_ROWS}`;

function clampReadRows(totalRows: number): number {
  return Math.max(2, Math.min(MAX_COMMUNITY_READ_ROWS, Math.floor(totalRows)));
}

export type CommunityVerseRef = {
  chapter: number;
  verse: number;
  /** DD/MM/YYYY — present when the sheet has a create_date column */
  createDate?: string;
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

/** Returns today's date as DD/MM/YYYY (server local time). */
function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

type ParsedRow = {
  ref: CommunityVerseRef;
  /** chapter, verse [, create_date] */
  raw: string[];
};

const VERSE_CACHE_TTL_MS = 60_000;
let versePayloadCache: { data: { verses: CommunityVerseRef[]; count: number }; expiresAt: number } | null = null;

export function invalidateVerseCommunityCache(): void {
  versePayloadCache = null;
}

/** Serialize writes so concurrent requests cannot double-append the same ref. */
let communityWriteChain: Promise<void> = Promise.resolve();

function withCommunityWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = communityWriteChain.then(fn);
  communityWriteChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

type HeaderIndices = {
  iCh: number;
  iVs: number;
  iDate: number | null;
};

/**
 * Detect header row. Supports:
 *   - chapter | verse
 *   - chapter | verse | create_date  (preferred format)
 *   - book | chapter | verse  (legacy)
 * Falls back to positional if no recognisable header.
 */
function parseHeaderIndices(header: string[]): HeaderIndices | null {
  const iCh = findHeaderIndex(header, ["chapter", "pasal", "ch"]);
  const iVs = findHeaderIndex(header, ["verse", "ayat"]);
  if (iCh < 0 || iVs < 0) return null;
  const iDate = findHeaderIndex(header, ["create_date", "date", "tanggal", "tgl"]);
  return { iCh, iVs, iDate: iDate >= 0 ? iDate : null };
}

function rowToParsed(row: string[], idx: HeaderIndices): ParsedRow | null {
  if (!row?.length) return null;
  const ch = parseInt(String(row[idx.iCh] ?? "").trim(), 10);
  const vs = parseInt(String(row[idx.iVs] ?? "").trim(), 10);
  if (!Number.isFinite(ch) || !Number.isFinite(vs)) return null;
  const createDate =
    idx.iDate != null ? String(row[idx.iDate] ?? "").trim() : undefined;
  const raw: string[] = [String(ch), String(vs)];
  if (createDate !== undefined) raw.push(createDate);
  return { ref: { chapter: ch, verse: vs, createDate: createDate || undefined }, raw };
}

async function readCommunitySheetRows(options?: {
  readRows?: number;
}): Promise<{
  rows: ParsedRow[];
  hasDateCol: boolean;
} | null> {
  const readRows = clampReadRows(options?.readRows ?? MAX_COMMUNITY_READ_ROWS);
  // Read up to 3 columns to capture create_date if present
  const readRange = `A1:C${readRows}`;
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

  const firstRow = data[0].map((c: unknown) => String(c ?? ""));
  let idx: HeaderIndices;
  let startRow: number;

  const detected = parseHeaderIndices(firstRow);
  if (detected) {
    idx = detected;
    startRow = 1;
  } else {
    // No recognisable header — assume chapter|verse positional (legacy)
    idx = { iCh: 0, iVs: 1, iDate: null };
    startRow = 0;
  }

  const out: ParsedRow[] = [];
  for (let r = startRow; r < data.length; r++) {
    const parsed = rowToParsed(
      (data[r] ?? []).map((c: unknown) => String(c ?? "")),
      idx
    );
    if (parsed) out.push(parsed);
  }
  return { rows: out, hasDateCol: idx.iDate != null };
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

async function writeCommunitySheetRows(rows: ParsedRow[], hasDateCol: boolean): Promise<void> {
  const header = hasDateCol ? ["chapter", "verse", "create_date"] : ["chapter", "verse"];
  const outRows: string[][] = [
    header,
    ...rows.map((p) => (hasDateCol ? p.raw.slice(0, 3) : p.raw.slice(0, 2))),
  ];

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = escapeSheetTitleForRange(getCommunityVersesTabTitle());
  const colEnd = hasDateCol ? "C" : "B";

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tab}!${CLEAR_BELOW_HEADER}`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1:${colEnd}${outRows.length}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: outRows },
  });
}

/**
 * Returns unique refs for today (if sheet has create_date column) or all refs.
 * Sorted by chapter then verse.
 */
export async function getCommunityVersesPayload(maxRows?: number): Promise<{
  verses: CommunityVerseRef[];
  count: number;
}> {
  const isDefaultRead = maxRows == null || !Number.isFinite(maxRows);
  if (isDefaultRead && versePayloadCache && Date.now() < versePayloadCache.expiresAt) {
    return versePayloadCache.data;
  }

  const parsed = await readCommunitySheetRows(
    isDefaultRead
      ? { readRows: MAX_COMMUNITY_READ_ROWS }
      : { readRows: clampReadRows(maxRows) }
  );
  if (!parsed) return { verses: [], count: 0 };

  const today = todayDDMMYYYY();
  const seen = new Set<string>();
  const out: CommunityVerseRef[] = [];

  for (const p of parsed.rows) {
    // When the sheet has a date column, only include rows matching today
    if (parsed.hasDateCol && p.ref.createDate && p.ref.createDate !== today) continue;
    const k = refKey(p.ref.chapter, p.ref.verse);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p.ref);
  }
  out.sort(compareChapterVerse);
  const result = { verses: out, count: out.length };
  if (isDefaultRead) {
    versePayloadCache = { data: result, expiresAt: Date.now() + VERSE_CACHE_TTL_MS };
  }
  return result;
}

/** Unique passage count for today — full read. */
export async function getCommunityUniqueVerseCount(): Promise<number> {
  return (await getCommunityVersesPayload()).count;
}

/**
 * Deletes rows whose create_date does not match today's date.
 * No-ops when the sheet has no date column (nothing to prune).
 * Runs inside the write lock so it is safe alongside concurrent syncs.
 */
export async function pruneStaleRows(): Promise<void> {
  await withCommunityWriteLock(async () => {
    const parsed = await readCommunitySheetRows({ readRows: MAX_COMMUNITY_READ_ROWS });
    if (!parsed || !parsed.hasDateCol) return;

    const today = todayDDMMYYYY();
    const kept = parsed.rows.filter(
      (p) => !p.ref.createDate || p.ref.createDate === today
    );

    // Nothing changed — skip the write to avoid unnecessary API calls
    if (kept.length === parsed.rows.length) return;

    const unique = uniqueSortedRows(kept);
    await writeCommunitySheetRows(unique, true);
    if (process.env.VERSEQUEST_DEBUG_LOGS === "1") {
      console.log(
        `[community] pruned ${parsed.rows.length - kept.length} stale row(s); kept ${unique.length}`
      );
    }
  });
}

/**
 * Read → merge new ref if missing → single write.
 * Locked so overlapping streak-sync requests cannot insert duplicates.
 */
export async function syncCommunitySheetAfterVerseSubmit(params: {
  book: string;
  chapter: number;
  verse: number;
}): Promise<void> {
  const { chapter, verse } = params;
  await withCommunityWriteLock(async () => {
    const parsed = await readCommunitySheetRows({ readRows: MAX_COMMUNITY_READ_ROWS });
    const key = refKey(chapter, verse);
    const existing = parsed?.rows ?? [];
    const exists = existing.some((p) => refKey(p.ref.chapter, p.ref.verse) === key);
    if (exists) return;

    const createDate = todayDDMMYYYY();
    const newRow: ParsedRow = {
      ref: { chapter, verse, createDate },
      raw: [String(chapter), String(verse), createDate],
    };
    const merged = uniqueSortedRows([...existing, newRow]);
    await writeCommunitySheetRows(merged, parsed?.hasDateCol ?? true);
  });
}

/** One row per unique (chapter, verse); sorted. Locked. */
export async function dedupeCommunitySheet(): Promise<void> {
  await withCommunityWriteLock(async () => {
    const parsed = await readCommunitySheetRows({ readRows: MAX_COMMUNITY_READ_ROWS });
    if (!parsed) return;
    const unique = uniqueSortedRows(parsed.rows);
    await writeCommunitySheetRows(unique, parsed.hasDateCol);
  });
}

/** All rows in the community tab (unique refs, sorted). Prefer getCommunityVersesPayload when you also need count. */
export async function readAllCommunityVerseRefs(): Promise<CommunityVerseRef[]> {
  return (await getCommunityVersesPayload()).verses;
}
