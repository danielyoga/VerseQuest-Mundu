import path from "node:path";
import { google } from "googleapis";

const DEFAULT_SPREADSHEET_ID = "1RjzYxqNEthZLbffXvNGVYpj3V3PtEpQJF40ksSUZkyo";

export function getSpreadsheetId(): string {
  return process.env.VERSEQUEST_SPREADSHEET_ID ?? DEFAULT_SPREADSHEET_ID;
}

/** bible verse schedule tab: columns A–D. Prefer row-range fetch via `schedule-sheet-anchor` (not this full slice). */
export const BIBLE_VERSE_SCHEDULE_RANGE_FALLBACK = "A1:D400";

/**
 * Month tabs (Phone / Name / day columns): reads only scan header + this many data rows.
 * Preregister uses A–Z; streak reads use through column AZ for day headers.
 */
export const MONTH_TAB_READ_ROW_CAP = 90;

function resolveKeyFilePath(): string | undefined {
  const explicit = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!explicit) return undefined;
  return path.isAbsolute(explicit)
    ? explicit
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), explicit);
}

/** Full read/write access to spreadsheets. */
export function getSheetsAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const credentials = JSON.parse(json) as Record<string, unknown>;
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  const keyFile = resolveKeyFilePath();
  if (keyFile) {
    return new google.auth.GoogleAuth({
      keyFile,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  throw new Error(
    "No Google credentials: set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON."
  );
}

export async function getSheetsClient() {
  const auth = getSheetsAuth();
  return google.sheets({ version: "v4", auth });
}

/** Escape sheet title for A1 range: 'My Sheet'!A1 */
export function escapeSheetTitleForRange(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

export function findHeaderIndex(
  headerRow: string[],
  candidates: string[]
): number {
  const norm = (s: string) => s.trim().toLowerCase();
  const targets = candidates.map(norm);
  for (let i = 0; i < headerRow.length; i++) {
    const cell = norm(headerRow[i] ?? "");
    if (targets.includes(cell)) return i;
  }
  return -1;
}
