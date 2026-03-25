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

let cachedTitles: string[] | null = null;
let cachedAt = 0;
const TITLE_CACHE_MS = 60_000;

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

/**
 * Resolve spreadsheet tab title for calendar month (1–12).
 * Tries English name, then "3", "03" — matches live sheets like "March".
 */
export async function resolveMonthTabTitle(month: number): Promise<string | null> {
  if (month < 1 || month > 12) return null;
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
