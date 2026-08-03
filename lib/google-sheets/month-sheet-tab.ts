import { getSheetsClient, getSpreadsheetId } from "./client";

const ENGLISH_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// ---------------------------------------------------------------------------
// Sheet-naming mode (env-configurable, no code changes needed to switch)
// ---------------------------------------------------------------------------
//
// VERSEQUEST_SHEET_NAMING controls which tab-naming convention is active:
//
//   "simple"  (default) — legacy: tabs named after the month only,
//             e.g. "April", "4", "04".  resolveMonthTabTitle scans all titles.
//
//   "ranting" — v3 spec: tabs named "{ranting}_{month}", e.g. "A_April".
//             Supply a ranting when calling resolveMonthTabTitle, or set
//             VERSEQUEST_DEFAULT_RANTING so existing callers keep working.
//
// .env.local examples:
//   VERSEQUEST_SHEET_NAMING=ranting
//   VERSEQUEST_DEFAULT_RANTING=A

export type SheetNamingMode = "simple" | "ranting";

export function getSheetNamingMode(): SheetNamingMode {
  const raw = process.env.VERSEQUEST_SHEET_NAMING?.trim().toLowerCase();
  return raw === "ranting" ? "ranting" : "simple";
}

export function getDefaultRanting(): string {
  return process.env.VERSEQUEST_DEFAULT_RANTING?.trim() ?? "A";
}

// ---------------------------------------------------------------------------
// Sheet title cache
// ---------------------------------------------------------------------------

let cachedTitles: string[] | null = null;
let cachedAt = 0;
const TITLE_CACHE_MS = 60_000;

/** Force-expire the tab title cache (call after adding/deleting a sheet tab). */
export function invalidateSheetTitleCache(): void {
  cachedTitles = null;
  cachedAt = 0;
}

/** All tab titles in the spreadsheet (short-lived cache). */
export async function getAllSheetTitles(): Promise<string[]> {
  const now = Date.now();
  if (cachedTitles && now - cachedAt < TITLE_CACHE_MS) return cachedTitles;
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
  cachedTitles = (meta.data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));
  cachedAt = now;
  return cachedTitles;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map "March" | "3" | "03" → 1–12; non-month tabs → null. */
export function monthNumberFromTabTitle(title: string): number | null {
  const t = title.trim();
  const n = parseInt(t, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 12) return n;
  const idx = ENGLISH_MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === t.toLowerCase()
  );
  if (idx >= 0) return idx + 1;
  return null;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the spreadsheet tab title for a given calendar month (1–12).
 *
 * - simple mode  : scans all tab titles for a match (legacy behaviour).
 * - ranting mode : constructs "{ranting}_{MonthName}", e.g. "A_April".
 *                  Falls back to VERSEQUEST_DEFAULT_RANTING when ranting is
 *                  not supplied, so existing callers keep working unchanged.
 *
 * Returns null when no matching tab is found.
 */
export async function resolveMonthTabTitle(
  month: number,
  ranting?: string
): Promise<string | null> {
  if (month < 1 || month > 12) return null;

  const mode = getSheetNamingMode();

  if (mode === "ranting") {
    const r = (ranting ?? getDefaultRanting()).trim();
    const monthName = ENGLISH_MONTH_NAMES[month - 1];
    const candidate = `${r}_${monthName}`;
    const titles = await getAllSheetTitles();
    if (titles.includes(candidate)) return candidate;
    const found = titles.find(
      (t) => t.toLowerCase() === candidate.toLowerCase()
    );
    return found ?? null;
  }

  // simple mode — original behaviour
  const titles = await getAllSheetTitles();
  const candidates = [
    ENGLISH_MONTH_NAMES[month - 1],
    String(month),
    month.toString().padStart(2, "0"),
  ];
  for (const c of candidates) {
    if (titles.includes(c)) return c;
  }
  for (const c of candidates) {
    const found = titles.find((t) => t.toLowerCase() === c.toLowerCase());
    if (found) return found;
  }
  return null;
}

/** English month name for calendar month 1–12. */
export function monthEnglishName(month: number): string {
  return ENGLISH_MONTH_NAMES[month - 1] ?? "";
}

/** Extract ranting prefix from a tab like `LABU_June` / `LABU_JUNE`. */
export function rantingFromMonthTabTitle(
  tabTitle: string,
  month: number
): string | null {
  const monthName = monthEnglishName(month);
  if (!monthName) return null;
  const suffix = `_${monthName}`;
  if (!tabTitle.toLowerCase().endsWith(suffix.toLowerCase())) return null;
  const prefix = tabTitle.slice(0, tabTitle.length - suffix.length).trim();
  return prefix || null;
}

/** All `{ranting}_{Month}` tabs for a calendar month (ranting mode). */
export async function listRantingMonthTabTitles(month: number): Promise<string[]> {
  if (month < 1 || month > 12) return [];
  const monthName = monthEnglishName(month);
  const suffix = `_${monthName}`;
  const titles = await getAllSheetTitles();
  return titles.filter(
    (t) =>
      t.length > suffix.length &&
      t.toLowerCase().endsWith(suffix.toLowerCase())
  );
}
