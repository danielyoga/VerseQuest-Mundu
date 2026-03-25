import type { PassageVerseRow } from "@/lib/bible/fetch-passage-verses";
import type { ScheduleWindowDay } from "./window-types";
import {
  BIBLE_VERSE_SCHEDULE_RANGE_FALLBACK,
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
} from "@/lib/google-sheets/client";
import {
  getScheduleAnchor,
  mondayOfWeekContaining,
  sheetRowForLocalDate,
  sheetRowRangeForLocalDates,
} from "@/lib/google-sheets/schedule-sheet-anchor";

const SCHEDULE_SHEET_TITLE =
  process.env.GSHEET_SCHEDULE_SHEET ?? "bible verse schedule";

/** When the sheet has no Month column (only Date), set e.g. GSHEET_SCHEDULE_MONTH=3 */
function implicitScheduleMonth(): number | undefined {
  const raw = process.env.GSHEET_SCHEDULE_MONTH;
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function parseCellInt(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse the schedule "Date" cell. Supports:
 * - Full dates: `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD` (Sheets often stores `25/03/2026`)
 * - Day-only `1`–`31` with month from the Month column or `GSHEET_SCHEDULE_MONTH`
 */
function parseCalendarMonthDayFromRow(
  row: string[],
  iMonth: number,
  iDate: number,
  fallbackMonth: number | undefined
): { month: number; date: number } | null {
  const dateCell = String(row[iDate] ?? "").trim();
  if (!dateCell) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateCell);
  if (iso) {
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { month: m, date: d };
  }

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(dateCell);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, date: day };
    }
  }

  const rd = parseCellInt(dateCell);
  if (rd === null || rd < 1 || rd > 31) return null;
  const rm =
    iMonth >= 0 ? parseCellInt(row[iMonth]) : fallbackMonth ?? null;
  if (rm === null || rm < 1 || rm > 12) return null;
  return { month: rm, date: rd };
}

export type ScheduleFromSheetResult =
  | {
      ok: true;
      book: string;
      reading: string;
      month: number;
      date: number;
      verses: PassageVerseRow[];
    }
  | {
      ok: false;
      reason: "verses_empty" | "verses_invalid";
      book: string;
      reading: string;
      month: number;
      date: number;
    }
  | { ok: false; reason: "no_row" };

export type ScheduleSheetData = {
  rows: string[][];
  iMonth: number;
  iDate: number;
  iBook: number;
  iReading: number;
  iVerses: number;
  fallbackMonth: number | undefined;
};

function parseHeaderAndBuildData(
  headerCells: string[],
  bodyRows: string[][]
): ScheduleSheetData | null {
  const header = headerCells.map((c) => String(c ?? ""));
  const iMonth = findHeaderIndex(header, ["month", "bulan"]);
  const iDate = findHeaderIndex(header, ["date", "tanggal", "tgl"]);
  const iBook = findHeaderIndex(header, ["book"]);
  const iReading = findHeaderIndex(header, [
    "reading",
    "reading selection",
    "bacaan",
  ]);
  const iVerses = findHeaderIndex(header, ["verses", "ayat"]);

  if (iDate < 0 || iBook < 0 || iReading < 0 || iVerses < 0) {
    return null;
  }

  const w = header.length;
  const rows: string[][] = [
    header,
    ...bodyRows.map((row) => {
      const out: string[] = [];
      for (let i = 0; i < w; i++) {
        out.push(String(row[i] ?? ""));
      }
      return out;
    }),
  ];

  return {
    rows,
    iMonth,
    iDate,
    iBook,
    iReading,
    iVerses,
    fallbackMonth: implicitScheduleMonth(),
  };
}

/** Fetch header + A{minRow}:D{maxRow} in one batch (minimal rows). */
async function fetchScheduleDataForRowRange(
  minRow: number,
  maxRow: number
): Promise<ScheduleSheetData | null> {
  const anchor = getScheduleAnchor();
  if (!anchor || minRow < 2 || maxRow < minRow) return null;

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const title = escapeSheetTitleForRange(SCHEDULE_SHEET_TITLE);

  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${title}!A1:D1`, `${title}!A${minRow}:D${maxRow}`],
  });

  const vr = res.data.valueRanges ?? [];
  const headerRow = vr[0]?.values?.[0];
  const body = vr[1]?.values ?? [];
  if (!headerRow?.length) return null;

  return parseHeaderAndBuildData(
    headerRow.map((c) => String(c ?? "")),
    body.map((row) => (row ?? []).map((c) => String(c ?? "")))
  );
}

/** Fallback when anchor env is broken (should not happen with defaults). */
async function fetchScheduleDataFallbackWide(): Promise<ScheduleSheetData | null> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const title = escapeSheetTitleForRange(SCHEDULE_SHEET_TITLE);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${title}!${BIBLE_VERSE_SCHEDULE_RANGE_FALLBACK}`,
  });
  const rows = res.data.values ?? [];
  if (rows.length < 2) return null;
  const headerCells = (rows[0] ?? []).map((c) => String(c ?? ""));
  const bodyRows = rows.slice(1).map((row) => row.map((c) => String(c ?? "")));
  return parseHeaderAndBuildData(headerCells, bodyRows);
}

/**
 * Loads schedule data for the **calendar week** (Mon–Sun) that contains `fromDate`,
 * plus any extra days in `[fromDate, fromDate + dayCount - 1]` if that window crosses
 * the week (so lookups always work). Typically ≤ ~10 rows; often **7 rows** for one week.
 */
async function loadScheduleDataForWindow(
  fromDate: Date,
  dayCount: number
): Promise<ScheduleSheetData | null> {
  const anchor = getScheduleAnchor();
  if (!anchor) {
    return fetchScheduleDataFallbackWide();
  }

  const dc = Math.min(Math.max(1, dayCount), 7);
  const windowDates: Date[] = [];
  for (let i = 0; i < dc; i++) {
    const t = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate() + i
    );
    windowDates.push(t);
  }

  const weekStart = mondayOfWeekContaining(fromDate);
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const t = new Date(weekStart);
    t.setDate(weekStart.getDate() + i);
    weekDates.push(t);
  }

  const key = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const merged = new Map<string, Date>();
  for (const d of windowDates) merged.set(key(d), d);
  for (const d of weekDates) merged.set(key(d), d);
  const allDates = [...merged.values()];

  const range = sheetRowRangeForLocalDates(allDates, anchor);
  if (!range) {
    return fetchScheduleDataFallbackWide();
  }

  return fetchScheduleDataForRowRange(range.minRow, range.maxRow);
}

async function loadScheduleDataForSingleLocalDate(
  d: Date
): Promise<ScheduleSheetData | null> {
  const anchor = getScheduleAnchor();
  if (!anchor) {
    return fetchScheduleDataFallbackWide();
  }
  const row = sheetRowForLocalDate(d, anchor);
  if (row < 2) {
    return fetchScheduleDataFallbackWide();
  }
  return fetchScheduleDataForRowRange(row, row);
}

export function lookupScheduleForDate(
  data: ScheduleSheetData,
  month: number,
  date: number
): ScheduleFromSheetResult {
  const { rows, iMonth, iDate, iBook, iReading, iVerses, fallbackMonth } = data;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const cal = parseCalendarMonthDayFromRow(
      row,
      iMonth,
      iDate,
      fallbackMonth
    );
    if (!cal || cal.month !== month || cal.date !== date) continue;

    const book = String(row[iBook] ?? "").trim();
    const reading = String(row[iReading] ?? "").trim();
    const rawVerses = String(row[iVerses] ?? "").trim();

    if (!book || !reading) continue;

    if (!rawVerses) {
      return {
        ok: false,
        reason: "verses_empty",
        book,
        reading,
        month,
        date,
      };
    }

    try {
      const parsed = JSON.parse(rawVerses) as unknown;
      if (!Array.isArray(parsed)) {
        return {
          ok: false,
          reason: "verses_invalid",
          book,
          reading,
          month,
          date,
        };
      }
      const verses: PassageVerseRow[] = [];
      for (const item of parsed) {
        if (
          item &&
          typeof item === "object" &&
          "chapter" in item &&
          "verse" in item &&
          "text" in item
        ) {
          const o = item as Record<string, unknown>;
          verses.push({
            chapter: Number(o.chapter),
            verse: Number(o.verse),
            text: String(o.text),
          });
        }
      }
      if (verses.length === 0) {
        return {
          ok: false,
          reason: "verses_invalid",
          book,
          reading,
          month,
          date,
        };
      }
      return {
        ok: true,
        book,
        reading,
        month,
        date,
        verses,
      };
    } catch {
      return {
        ok: false,
        reason: "verses_invalid",
        book,
        reading,
        month,
        date,
      };
    }
  }

  return { ok: false, reason: "no_row" };
}

/** One Google Sheets read — full fallback range (populate / legacy). */
export async function loadScheduleSheetData(): Promise<ScheduleSheetData | null> {
  return fetchScheduleDataFallbackWide();
}

/** Month bulk-read for populate script: only rows needed for that calendar month. */
export async function loadScheduleSheetDataForMonthYear(
  year: number,
  month: number
): Promise<ScheduleSheetData | null> {
  const anchor = getScheduleAnchor();
  if (!anchor) return fetchScheduleDataFallbackWide();
  const lastDay = new Date(year, month, 0).getDate();
  const dates: Date[] = [];
  for (let d = 1; d <= lastDay; d++) {
    dates.push(new Date(year, month - 1, d));
  }
  const range = sheetRowRangeForLocalDates(dates, anchor);
  if (!range) return fetchScheduleDataFallbackWide();
  return fetchScheduleDataForRowRange(range.minRow, range.maxRow);
}

function defaultScheduleYear(): number {
  const raw = process.env.GSHEET_SCHEDULE_YEAR;
  if (raw !== undefined && raw !== "" && Number.isFinite(Number(raw))) {
    return Number(raw);
  }
  const a = getScheduleAnchor();
  if (a) return a.anchorDate.getFullYear();
  return new Date().getFullYear();
}

/** Loads one schedule row from the bible verse schedule tab by calendar month/day. */
export async function getScheduleForMonthDate(
  month: number,
  date: number
): Promise<ScheduleFromSheetResult> {
  const y = defaultScheduleYear();
  const data = await loadScheduleDataForSingleLocalDate(
    new Date(y, month - 1, date)
  );
  if (!data) {
    return { ok: false, reason: "no_row" };
  }
  return lookupScheduleForDate(data, month, date);
}

function resultToWindowDay(
  year: number,
  month: number,
  date: number,
  r: ScheduleFromSheetResult
): ScheduleWindowDay {
  if (r.ok) {
    return {
      year,
      month,
      date,
      ok: true,
      book: r.book,
      reading: r.reading,
      verses: r.verses,
    };
  }
  if (r.reason === "no_row") {
    return { year, month, date, ok: false, reason: "no_row" };
  }
  return {
    year,
    month,
    date,
    ok: false,
    reason: r.reason,
    book: r.book,
    reading: r.reading,
  };
}

const MAX_WINDOW_DAYS = 7;

function parseYmdParts(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every(Number.isFinite)) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function buildScheduleWindowDays(
  fromYmd: string,
  dayCount: number,
  data: ScheduleSheetData
): ScheduleWindowDay[] {
  const n = Math.min(Math.max(1, dayCount), MAX_WINDOW_DAYS);
  const parts = parseYmdParts(fromYmd);
  if (!parts) return [];
  const { y, m, d } = parts;
  const days: ScheduleWindowDay[] = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(y, m - 1, d + i);
    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    const date = dt.getDate();
    const r = lookupScheduleForDate(data, month, date);
    days.push(resultToWindowDay(year, month, date, r));
  }
  return days;
}

export async function getScheduleWindow(
  fromYmd: string,
  dayCount: number
): Promise<{ from: string; days: ScheduleWindowDay[] }> {
  const n = Math.min(Math.max(1, dayCount), MAX_WINDOW_DAYS);
  const parts = parseYmdParts(fromYmd);
  if (!parts) {
    return { from: fromYmd, days: [] };
  }

  const fromDate = new Date(parts.y, parts.m - 1, parts.d);
  const data = await loadScheduleDataForWindow(fromDate, n);
  if (!data) {
    return { from: fromYmd, days: [] };
  }

  let days = buildScheduleWindowDays(fromYmd, n, data);

  /** Narrow row-range fetch assumes one sheet row per calendar day from anchor; real sheets often differ — retry with full A:D slice. */
  const needsWideFallback = days.some(
    (day) => !day.ok && day.reason === "no_row"
  );
  if (needsWideFallback) {
    const full = await fetchScheduleDataFallbackWide();
    if (full) {
      days = buildScheduleWindowDays(fromYmd, n, full);
    }
  }

  return { from: fromYmd, days };
}
