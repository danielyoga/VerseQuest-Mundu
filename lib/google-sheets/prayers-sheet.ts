import { getSheetsClient, getSpreadsheetId } from "./client";
import type { PrayerRow } from "@/lib/prayer-content";

/** Global tab (same for every ranting): A date (YYYY-MM-DD) · B text · C updated_by · D updated_at. */
export const PRAYERS_SHEET = "Prayers";

/** All prayer rows. A missing tab counts as empty, not as an error. */
export async function readPrayerRows(): Promise<PrayerRow[]> {
  const sheets = await getSheetsClient();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${PRAYERS_SHEET}!A:B`,
    });
    const rows = res.data.values ?? [];
    return rows.slice(1).map((row) => ({
      date: String(row[0] ?? "").trim(),
      text: String(row[1] ?? ""),
    }));
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unable to parse range")) return [];
    throw err;
  }
}

export const PRAYERS_HEADER = ["date", "text", "updated_by", "updated_at"] as const;

/**
 * Create the Prayers tab if it doesn't exist: header row, frozen, column A as plain text
 * (so a typed 2026-10-01 stays a string instead of becoming a Sheets date). Idempotent.
 */
export async function ensurePrayersTab(): Promise<{ created: boolean }> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(title)",
  });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === PRAYERS_SHEET);
  if (exists) return { created: false };

  const added = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: PRAYERS_SHEET,
              gridProperties: { rowCount: 400, columnCount: PRAYERS_HEADER.length, frozenRowCount: 1 },
            },
          },
        },
      ],
    },
  });
  const sheetId = added.data.replies?.[0]?.addSheet?.properties?.sheetId;

  if (sheetId != null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startColumnIndex: 0, endColumnIndex: 1 },
              cell: { userEnteredFormat: { numberFormat: { type: "TEXT" } } },
              fields: "userEnteredFormat.numberFormat",
            },
          },
        ],
      },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${PRAYERS_SHEET}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...PRAYERS_HEADER]] },
  });

  return { created: true };
}

/**
 * Write the prayer for `date`: overwrite the first row with that date, else append one,
 * so saving never creates a duplicate. RAW input keeps the date a string and stops text
 * starting with "=" from becoming a formula. Creates the tab first if it is missing.
 */
export async function upsertPrayerRow(
  date: string,
  text: string,
  updatedBy: string
): Promise<{ updated: boolean }> {
  await ensurePrayersTab();
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${PRAYERS_SHEET}!A:A`,
  });
  const rowIndex = (res.data.values ?? []).findIndex(
    (row, i) => i > 0 && String(row[0] ?? "").trim() === date
  );
  const values = [[date, text, updatedBy, new Date().toISOString()]];

  if (rowIndex !== -1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${PRAYERS_SHEET}!A${rowIndex + 1}:D${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
    return { updated: true };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${PRAYERS_SHEET}!A:D`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
  return { updated: false };
}
