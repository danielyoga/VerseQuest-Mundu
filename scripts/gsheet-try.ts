/**
 * Read values from the VerseQuest spreadsheet (range from env or default).
 *
 * Setup (Google Cloud):
 * 1. Enable "Google Sheets API" for your project.
 * 2. Create a service account → download JSON key into `secrets/` (gitignored).
 * 3. Share the spreadsheet with the service account email (Editor if you will write later).
 *
 * Auth (same as app): GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.
 *
 * For `next dev`, add the same variable in `.env.local` so API routes can reach Sheets.
 *
 * Optional env:
 *   GSHEET_RANGE — A1 notation (default: A1:AG100). Example: Tab!A1:C100
 */

import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";

async function main() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const range = process.env.GSHEET_RANGE ?? "A1:AG100";

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = res.data.values ?? [];
  console.log(`Range "${range}": ${rows.length} row(s)`);
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
