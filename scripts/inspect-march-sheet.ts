/**
 * List sheet tabs, then print first rows of a March-like tab.
 * Live structure (example): tab "March", row1 Phone_Number | Name | 25 | 26 | … | 31 (day-of-month columns).
 * Run: GOOGLE_APPLICATION_CREDENTIALS=./secrets/....json npx tsx scripts/inspect-march-sheet.ts
 */
import {
  escapeSheetTitleForRange,
  getSheetsClient,
  getSpreadsheetId,
} from "@/lib/google-sheets/client";

async function main() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = (meta.data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter(Boolean) as string[];
  console.log("Tab titles:", titles.join(" | "));

  const marchLike =
    titles.find((t) => /march/i.test(t)) ??
    titles.find((t) => t === "3" || t === "03") ??
    titles.find((t) => /^\d+$/.test(t));
  if (!marchLike) {
    console.error("No march-like tab found.");
    return;
  }
  console.log("Using tab:", marchLike);
  const tab = escapeSheetTitleForRange(marchLike);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A1:AG20`,
  });
  const rows = res.data.values ?? [];
  console.log("Rows:", rows.length);
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(rows[i]));
  }
}

main().catch(console.error);
