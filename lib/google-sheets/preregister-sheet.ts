import {
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
  MONTH_TAB_READ_ROW_CAP,
} from "./client";
import { resolveMonthTabTitle } from "./month-sheet-tab";
import { normalizePhone } from "@/lib/preregister";

/** Tab = English month name ("March") or "3" / "03" — see resolveMonthTabTitle. */
export async function lookupPreregisteredName(
  canonicalPhone: string,
  month: number
): Promise<string | null> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tabTitle = await resolveMonthTabTitle(month);
  if (!tabTitle) return null;
  const title = escapeSheetTitleForRange(tabTitle);

  let res;
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${title}!A1:Z${MONTH_TAB_READ_ROW_CAP}`,
    });
  } catch {
    return null;
  }

  const rows = res.data.values ?? [];
  if (rows.length < 2) return null;

  const header = rows[0].map((c) => String(c ?? ""));
  const iPhone = findHeaderIndex(header, ["phone_number", "phone", "nomor"]);
  const iName = findHeaderIndex(header, ["name", "nama"]);

  if (iPhone < 0 || iName < 0) return null;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const raw = String(row[iPhone] ?? "").trim();
    const normalized = normalizePhone(raw);
    if (normalized === canonicalPhone) {
      const name = String(row[iName] ?? "").trim();
      return name || null;
    }
  }

  return null;
}
