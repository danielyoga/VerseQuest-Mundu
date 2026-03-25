/**
 * Map sheet row ↔ calendar date: row `GSHEET_SCHEDULE_DATA_ROW_ANCHOR` (default 2)
 * is `GSHEET_SCHEDULE_ANCHOR_DATE` (default 2026-03-22 = 22 Mar 2026).
 */

const DEFAULT_DATA_ROW_ANCHOR = 2;
const DEFAULT_ANCHOR_ISO = "2026-03-22";

function parseIsoYmd(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every(Number.isFinite)) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

export type ScheduleAnchor = {
  /** Sheet row index for the anchor date (1-based, includes header on row 1). */
  dataRowAnchor: number;
  /** Local calendar midnight of the date stored in that row. */
  anchorDate: Date;
};

export function getScheduleAnchor(): ScheduleAnchor | null {
  const rowRaw = process.env.GSHEET_SCHEDULE_DATA_ROW_ANCHOR;
  const dataRowAnchor =
    rowRaw !== undefined && rowRaw !== ""
      ? Number(rowRaw)
      : DEFAULT_DATA_ROW_ANCHOR;
  if (!Number.isFinite(dataRowAnchor) || dataRowAnchor < 2) return null;

  const iso =
    process.env.GSHEET_SCHEDULE_ANCHOR_DATE?.trim() ?? DEFAULT_ANCHOR_ISO;
  const parts = parseIsoYmd(iso);
  if (!parts) return null;
  const anchorDate = new Date(parts.y, parts.m - 1, parts.d);
  return { dataRowAnchor, anchorDate };
}

/** Whole days between two local calendar dates (b - a). */
export function daysBetweenLocal(a: Date, b: Date): number {
  const t0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const t1 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((t1 - t0) / 86400000);
}

/** Sheet row (1-based) for a local calendar day; one row per day in the sheet. */
export function sheetRowForLocalDate(target: Date, anchor: ScheduleAnchor): number {
  return anchor.dataRowAnchor + daysBetweenLocal(anchor.anchorDate, target);
}

/** Monday 00:00 local of the week containing `d` (ISO week: Monday = start). */
export function mondayOfWeekContaining(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = c.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  c.setDate(c.getDate() + mondayOffset);
  return c;
}

/** Inclusive min/max sheet rows to cover all given local dates (ignore invalid rows before row 2). */
export function sheetRowRangeForLocalDates(
  dates: Date[],
  anchor: ScheduleAnchor
): { minRow: number; maxRow: number } | null {
  const rows = dates
    .map((d) => sheetRowForLocalDate(d, anchor))
    .filter((r) => r >= 2);
  if (rows.length === 0) return null;
  return {
    minRow: Math.min(...rows),
    maxRow: Math.max(...rows),
  };
}
