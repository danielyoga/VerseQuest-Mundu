/**
 * Reads the "bible verse schedule" tab, fetches TB text for each day's reading from alkitab.mobi,
 * and writes JSON arrays into the "Verses" column (for the app to consume via /api/schedule-today).
 *
 * Monthly run (recommended): `npm run gsheet:monthly` — uses the current calendar month unless you pass `--month`.
 *
 * Usage:
 *   npm run gsheet:monthly
 *   npm run gsheet:monthly -- --month 4
 *   npm run gsheet:monthly -- --month 4 --force
 *   npm run gsheet:populate-schedule -- --force   # alias (same script)
 *
 * Month resolution (first match wins): `--month` → `GSHEET_SCHEDULE_MONTH` env → current calendar month.
 * Year: `GSHEET_SCHEDULE_YEAR` or anchor date year (see `lib/google-sheets/schedule-sheet-anchor.ts`).
 *
 * Expected header row (case-insensitive): Month | Date | Book | Reading | Verses
 * (Month optional if you use implicit month or GSHEET_SCHEDULE_MONTH.)
 */

import { fetchPassageVersesFromReading } from "@/lib/bible/fetch-passage-verses";
import {
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
} from "@/lib/google-sheets/client";
import {
  loadScheduleSheetData,
  loadScheduleSheetDataForMonthYear,
} from "@/lib/schedule/from-sheet";
import {
  getScheduleAnchor,
  sheetRowRangeForLocalDates,
} from "@/lib/google-sheets/schedule-sheet-anchor";

const SCHEDULE_SHEET_TITLE =
  process.env.GSHEET_SCHEDULE_SHEET ?? "bible verse schedule";

function parseCellInt(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseCliArgs() {
  const argv = process.argv.slice(2);
  let force = false;
  let month: number | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") force = true;
    else if (a === "--month" && argv[i + 1] !== undefined) {
      month = Number(argv[++i]);
    } else if (a.startsWith("--month=")) {
      month = Number(a.slice("--month=".length));
    }
  }
  return {
    force,
    month:
      typeof month === "number" && month >= 1 && month <= 12 ? month : undefined,
  };
}

async function main() {
  const { force, month: cliMonth } = parseCliArgs();

  const envMonth = process.env.GSHEET_SCHEDULE_MONTH
    ? Number(process.env.GSHEET_SCHEDULE_MONTH)
    : undefined;
  const envMonthOk =
    Number.isFinite(envMonth) && envMonth! >= 1 && envMonth! <= 12
      ? envMonth
      : undefined;

  const implicitMonth =
    cliMonth ?? envMonthOk ?? new Date().getMonth() + 1;

  const yearRaw = process.env.GSHEET_SCHEDULE_YEAR;
  const year =
    yearRaw !== undefined && yearRaw !== "" && Number.isFinite(Number(yearRaw))
      ? Number(yearRaw)
      : getScheduleAnchor()?.anchorDate.getFullYear() ??
        new Date().getFullYear();

  console.log(
    `Month filter: ${implicitMonth} (${cliMonth != null ? "--month" : envMonthOk != null ? "GSHEET_SCHEDULE_MONTH" : "calendar"}), year ${year}`
  );

  const anchor = getScheduleAnchor();
  let minSheetRow = 2;
  if (anchor) {
    const lastDay = new Date(year, implicitMonth, 0).getDate();
    const dates: Date[] = [];
    for (let d = 1; d <= lastDay; d++) {
      dates.push(new Date(year, implicitMonth - 1, d));
    }
    const range = sheetRowRangeForLocalDates(dates, anchor);
    if (range) minSheetRow = range.minRow;
  }

  const sheetData =
    (await loadScheduleSheetDataForMonthYear(year, implicitMonth)) ??
    (await loadScheduleSheetData());

  if (!sheetData) {
    console.error("Could not load schedule sheet.");
    process.exit(1);
  }

  const { rows } = sheetData;
  const header = rows[0].map((c) => String(c ?? ""));
  const iMonth = findHeaderIndex(header, ["month", "bulan"]);
  const iDate = findHeaderIndex(header, ["date", "tanggal"]);
  const iBook = findHeaderIndex(header, ["book"]);
  const iReading = findHeaderIndex(header, [
    "reading",
    "reading selection",
    "bacaan",
  ]);
  const iVerses = findHeaderIndex(header, ["verses", "ayat"]);

  if (iDate < 0 || iBook < 0 || iReading < 0 || iVerses < 0) {
    console.error("Missing required columns. Found:", header);
    process.exit(1);
  }

  const spreadsheetId = getSpreadsheetId();
  const sheets = await getSheetsClient();
  const title = escapeSheetTitleForRange(SCHEDULE_SHEET_TITLE);

  /** 0 → A, 25 → Z, 26 → AA */
  const colLetter = (indexZeroBased: number) => {
    let n = indexZeroBased + 1;
    let s = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  const updates: { row1Based: number; json: string }[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (iMonth >= 0) {
      const rm = parseCellInt(row[iMonth]);
      if (rm === null || rm !== implicitMonth) continue;
    }

    const book = String(row[iBook] ?? "").trim();
    const reading = String(row[iReading] ?? "").trim();
    const existingVerses = String(row[iVerses] ?? "").trim();

    if (!book || !reading) continue;

    if (existingVerses && !force) {
      console.log(
        `Sheet row ${minSheetRow + r - 1}: skip (Verses already set). Use --force to overwrite.`
      );
      continue;
    }

    try {
      const verses = await fetchPassageVersesFromReading(book, reading);
      const json = JSON.stringify(verses);
      const sheetRow1Based = minSheetRow + (r - 1);
      updates.push({ row1Based: sheetRow1Based, json });
      console.log(
        `Sheet row ${sheetRow1Based}: ${book} ${reading} → ${verses.length} verse(s)`
      );
    } catch (e) {
      console.error(
        `Sheet row ${minSheetRow + r - 1}: failed (${book} ${reading})`,
        e
      );
    }

    await sleep(150);
  }

  if (updates.length === 0) {
    console.log("Nothing to write.");
    return;
  }

  const verseCol = colLetter(iVerses);
  const data = updates.map((u) => ({
    range: `${title}!${verseCol}${u.row1Based}`,
    values: [[u.json]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  });

  console.log(`Wrote ${updates.length} cell(s) in column ${verseCol}.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
