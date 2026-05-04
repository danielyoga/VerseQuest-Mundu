import {
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
  MONTH_TAB_READ_ROW_CAP,
} from "./client";
import { getCurrentMonthDayStrings } from "@/lib/date-utils";
import { normalizeYmdList } from "@/lib/streak/sync-merge";
import { normalizePhone } from "@/lib/preregister";
import { resolveMonthTabTitle } from "./month-sheet-tab";

/** New marks use this token; existing non-empty cells are preserved. */
const STREAK_MARK = "v";

function columnIndexToA1Letter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function parseDayHeader(cell: string): number | null {
  const t = String(cell ?? "").trim();
  if (!/^\d{1,2}$/.test(t)) return null;
  const d = parseInt(t, 10);
  if (d >= 1 && d <= 31) return d;
  return null;
}

function isMarkedCell(cell: string): boolean {
  return String(cell ?? "").trim() !== "";
}

/**
 * Read submission YYYY-MM-DD from month tabs for all days in the current month up to today.
 * Always reads exactly one tab. Range `A1:AZ{MONTH_TAB_READ_ROW_CAP}`.
 * `localDatesHint` is kept for call-site compatibility; merging still uses the client’s full date list.
 */
export async function readSubmissionDatesFromMonthlySheets(
  canonicalPhone: string,
  _localDatesHint: string[],
  ranting?: string
): Promise<string[]> {
  const weekList = getCurrentMonthDayStrings();
  const byMonth = new Map<number, { ymd: string; day: number }[]>();
  for (const ymd of weekList) {
    const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!p) continue;
    const month = parseInt(p[2]!, 10);
    const day = parseInt(p[3]!, 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push({ ymd, day });
  }

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const perMonthResults = await Promise.all(
    [...byMonth.entries()].map(async ([month, entries]) => {
      const tabTitle = await resolveMonthTabTitle(month, ranting);
      if (!tabTitle) return [];

      const tab = escapeSheetTitleForRange(tabTitle);
      let res;
      try {
        res = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${tab}!A1:AZ${MONTH_TAB_READ_ROW_CAP}`,
        });
      } catch {
        return [];
      }
      const rows = res.data.values ?? [];
      if (rows.length < 2) return [];

      const header = rows[0].map((c) => String(c ?? ""));
      const iPhone = findHeaderIndex(header, ["phone_number", "phone", "nomor"]);
      if (iPhone < 0) return [];

      const dayColToDay = new Map<number, number>();
      for (let c = 0; c < header.length; c++) {
        const day = parseDayHeader(header[c] ?? "");
        if (day !== null) dayColToDay.set(c, day);
      }
      if (dayColToDay.size === 0) return [];

      let userRow: string[] | null = null;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row?.length) continue;
        const raw = String(row[iPhone] ?? "").trim();
        if (normalizePhone(raw) !== canonicalPhone) continue;
        userRow = row;
        break;
      }
      if (!userRow) return [];

      const wantDayToYmd = new Map<number, string>();
      for (const e of entries) wantDayToYmd.set(e.day, e.ymd);

      const found: string[] = [];
      for (const [col, day] of dayColToDay) {
        const ymd = wantDayToYmd.get(day);
        if (!ymd) continue;
        if (isMarkedCell(String(userRow[col] ?? ""))) found.push(ymd);
      }
      return found;
    })
  );

  return normalizeYmdList(perMonthResults.flat());
}

function groupMergedDatesByYearMonth(
  mergedDates: string[]
): Map<string, Set<number>> {
  const groups = new Map<string, Set<number>>();
  for (const ymd of mergedDates) {
    const s = ymd.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) continue;
    const [yStr, mStr, dStr] = s.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) continue;
    const key = `${y}-${m}`;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key)!.add(d);
  }
  return groups;
}

/**
 * Upsert one row per (year, month): marks day columns for merged dates; never clears existing marks.
 */
async function upsertMonthRow(
  tabTitle: string,
  canonicalPhone: string,
  displayName: string,
  daysToMark: Set<number>
): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = escapeSheetTitleForRange(tabTitle);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A1:AZ2000`,
  });
  const rows = res.data.values ?? [];
  if (rows.length < 1) {
    throw new Error(`Month tab "${tabTitle}" has no header row`);
  }

  const header = rows[0].map((c) => String(c ?? ""));
  const iPhone = findHeaderIndex(header, ["phone_number", "phone", "nomor"]);
  const iName = findHeaderIndex(header, ["name", "nama"]);
  if (iPhone < 0) {
    throw new Error(`Tab "${tabTitle}" has no Phone_Number column`);
  }

  const dayColToDay = new Map<number, number>();
  for (let c = 0; c < header.length; c++) {
    const day = parseDayHeader(header[c] ?? "");
    if (day !== null) dayColToDay.set(c, day);
  }
  if (dayColToDay.size === 0) {
    throw new Error(`Tab "${tabTitle}" has no numeric day columns`);
  }

  let rowIdx = -1;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row?.length) continue;
    if (normalizePhone(String(row[iPhone] ?? "")) === canonicalPhone) {
      rowIdx = r;
      break;
    }
  }

  const newRow = new Array(header.length).fill("");

  if (rowIdx >= 0) {
    const existing = rows[rowIdx];
    for (let c = 0; c < header.length; c++) {
      newRow[c] = String(existing[c] ?? "");
    }
    newRow[iPhone] = String(existing[iPhone] ?? "").trim() || canonicalPhone;
    if (iName >= 0) {
      const prevName = String(existing[iName] ?? "").trim();
      newRow[iName] = displayName.trim() || prevName || "—";
    }
  } else {
    newRow[iPhone] = canonicalPhone;
    if (iName >= 0) newRow[iName] = displayName.trim() || "—";
  }

  for (const [col, dayNum] of dayColToDay) {
    const prev = String(newRow[col] ?? "").trim();
    const want = daysToMark.has(dayNum);
    if (want || isMarkedCell(prev)) {
      newRow[col] = prev || STREAK_MARK;
    }
  }

  const lastLetter = columnIndexToA1Letter(header.length - 1);
  const row1Based = rowIdx >= 0 ? rowIdx + 1 : rows.length + 1;

  if (rowIdx >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A${row1Based}:${lastLetter}${row1Based}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A:${lastLetter}`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [newRow] },
    });
  }
}

/** Write merged dates into month tabs (day columns only). Months are written in parallel. */
export async function upsertMergedMarksForPhone(
  canonicalPhone: string,
  displayName: string,
  mergedDates: string[],
  ranting?: string
): Promise<void> {
  const groups = groupMergedDatesByYearMonth(mergedDates);
  await Promise.all(
    [...groups.entries()].map(async ([ym, days]) => {
      const month = parseInt(ym.split("-")[1]!, 10);
      const tabTitle = await resolveMonthTabTitle(month, ranting);
      if (!tabTitle) return;
      await upsertMonthRow(tabTitle, canonicalPhone, displayName, days);
    })
  );
}
