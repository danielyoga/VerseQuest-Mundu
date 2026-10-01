/**
 * One-time setup: create the global `Prayers` tab (date · text · updated_by · updated_at).
 * Safe to run again — does nothing if the tab already exists.
 *
 * Auth (same as app): GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.
 * The service account needs Editor access to the spreadsheet.
 */

import { ensurePrayersTab, PRAYERS_SHEET } from "@/lib/google-sheets/prayers-sheet";
import { getSpreadsheetId } from "@/lib/google-sheets/client";

async function main() {
  const { created } = await ensurePrayersTab();
  console.log(
    created
      ? `Created "${PRAYERS_SHEET}" tab in spreadsheet ${getSpreadsheetId()}.`
      : `"${PRAYERS_SHEET}" tab already exists — nothing to do.`
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
