import {
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
  MONTH_TAB_READ_ROW_CAP,
} from "./client";
import { getAllSheetTitles, resolveMonthTabTitle } from "./month-sheet-tab";
import { normalizePhone } from "@/lib/preregister";

const preregisterDebug =
  process.env.VERSEQUEST_DEBUG_PREREGISTER === "1";

function dbg(...args: unknown[]) {
  if (!preregisterDebug) return;
  console.log("[preregister-lookup]", ...args);
}

/** Tab resolved via VERSEQUEST_SHEET_NAMING mode. Pass ranting for "ranting" mode. */
export async function lookupPreregisteredName(
  canonicalPhone: string,
  month: number,
  ranting?: string
): Promise<string | null> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  dbg("lookup", { spreadsheetId, month, canonicalPhone, ranting });

  const tabTitle = await resolveMonthTabTitle(month, ranting);
  if (!tabTitle) {
    if (preregisterDebug) {
      try {
        const titles = await getAllSheetTitles();
        dbg("no tab for this month; sheet tab titles:", titles);
      } catch (e) {
        dbg("could not list sheet tabs", e);
      }
    }
    return null;
  }
  const title = escapeSheetTitleForRange(tabTitle);
  dbg("using tab", tabTitle, "range", `${title}!A1:Z${MONTH_TAB_READ_ROW_CAP}`);

  let res;
  try {
    res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${title}!A1:Z${MONTH_TAB_READ_ROW_CAP}`,
    });
  } catch (e) {
    dbg("spreadsheets.values.get failed", e);
    return null;
  }

  const rows = res.data.values ?? [];
  dbg("row count (incl. header)", rows.length);
  if (rows.length < 2) {
    dbg("abort: need at least header + 1 data row");
    return null;
  }

  const header = rows[0].map((c) => String(c ?? ""));
  const iPhone = findHeaderIndex(header, ["phone_number", "phone", "nomor"]);
  const iName = findHeaderIndex(header, ["name", "nama"]);
  dbg("header row", header);
  dbg("column indices", { phoneCol: iPhone, nameCol: iName });

  if (iPhone < 0 || iName < 0) {
    dbg(
      "abort: need a phone column (phone_number | phone | nomor) and name column (name | nama)"
    );
    return null;
  }

  const samples: { row: number; raw: string; normalized: string }[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const raw = String(row[iPhone] ?? "").trim();
    const normalized = normalizePhone(raw);
    if (preregisterDebug && samples.length < 8 && raw) {
      samples.push({ row: r + 1, raw, normalized });
    }
    if (normalized === canonicalPhone) {
      const name = String(row[iName] ?? "").trim();
      dbg("match on sheet row", r + 1, { raw, normalized, namePreview: name.slice(0, 20) });
      return name || null;
    }
  }

  dbg("no row matched canonical phone; sample normalized values from sheet", samples);
  dbg("expected normalized", canonicalPhone);
  return null;
}
