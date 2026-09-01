import {
  escapeSheetTitleForRange,
  findHeaderIndex,
  getSheetsClient,
  getSpreadsheetId,
  MONTH_TAB_READ_ROW_CAP,
} from "./client";
import { getRantingList } from "@/lib/constants";
import {
  getAllSheetTitles,
  getSheetNamingMode,
  listRantingMonthTabTitles,
  rantingFromMonthTabTitle,
  resolveMonthTabTitle,
} from "./month-sheet-tab";
import { normalizePhone } from "@/lib/preregister";

const preregisterDebug =
  process.env.VERSEQUEST_DEBUG_PREREGISTER === "1";

function dbg(...args: unknown[]) {
  if (!preregisterDebug) return;
  console.log("[preregister-lookup]", ...args);
}

export type PreregisterLookupResult = {
  name: string;
  /** Ranting prefix from the tab where the phone was found (ranting mode). */
  ranting?: string;
  tabTitle: string;
};

function tabAlreadyQueued(tab: string, queue: string[]): boolean {
  const key = tab.toLowerCase();
  return queue.some((t) => t.toLowerCase() === key);
}

/** Order: preferred tab, then env ranting list, then any other month tabs. */
async function buildTabsToSearch(
  month: number,
  ranting?: string
): Promise<string[]> {
  const primary = await resolveMonthTabTitle(month, ranting);
  const queue: string[] = [];
  if (primary) queue.push(primary);

  if (getSheetNamingMode() !== "ranting") {
    return queue;
  }

  const monthTabs = await listRantingMonthTabTitles(month);
  for (const r of getRantingList()) {
    const match = monthTabs.find(
      (t) =>
        rantingFromMonthTabTitle(t, month)?.toLowerCase() === r.toLowerCase()
    );
    if (match && !tabAlreadyQueued(match, queue)) queue.push(match);
  }
  for (const t of monthTabs) {
    if (!tabAlreadyQueued(t, queue)) queue.push(t);
  }
  return queue;
}

function findNameInRows(
  rows: unknown[][],
  canonicalPhone: string,
  tabTitle: string
): string | null {
  if (rows.length < 2) {
    dbg("abort: empty tab", tabTitle);
    return null;
  }

  const header = rows[0].map((c) => String(c ?? ""));
  const iPhone = findHeaderIndex(header, ["phone_number", "phone", "nomor"]);
  const iName = findHeaderIndex(header, ["name", "nama"]);

  if (iPhone < 0 || iName < 0) {
    dbg("abort: phone/name column not found in header", header);
    return null;
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const raw = String(row[iPhone] ?? "").trim();
    const normalized = normalizePhone(raw);
    if (normalized === canonicalPhone) {
      const name = String(row[iName] ?? "").trim();
      dbg("match on sheet row", r + 1, { raw, normalized, namePreview: name.slice(0, 20) });
      return name || null;
    }
  }

  dbg("no match in tab", tabTitle);
  return null;
}

/**
 * Fetches every candidate tab in a single batched request instead of one
 * `values.get` round-trip per tab — searching N tabs sequentially otherwise
 * costs N network round-trips (multiple seconds once N gets past a handful).
 */
async function lookupNamesInTabs(
  tabTitles: string[],
  canonicalPhone: string
): Promise<Map<string, string>> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const ranges = tabTitles.map(
    (t) => `${escapeSheetTitleForRange(t)}!A1:Z${MONTH_TAB_READ_ROW_CAP}`
  );
  dbg("batch fetching tabs", tabTitles);

  let res;
  try {
    res = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });
  } catch (e) {
    dbg("spreadsheets.values.batchGet failed", e);
    return new Map();
  }

  const found = new Map<string, string>();
  const valueRanges = res.data.valueRanges ?? [];
  for (let i = 0; i < tabTitles.length; i++) {
    const rows = (valueRanges[i]?.values ?? []) as unknown[][];
    const name = findNameInRows(rows, canonicalPhone, tabTitles[i]);
    if (name) found.set(tabTitles[i], name);
  }
  return found;
}

/**
 * Tab resolved via VERSEQUEST_SHEET_NAMING mode. Pass ranting for "ranting" mode.
 * In ranting mode, if the phone is not on the selected tab, searches other
 * `{ranting}_{Month}` tabs and returns the ranting where the row was found.
 */
export async function lookupPreregisteredName(
  canonicalPhone: string,
  month: number,
  ranting?: string
): Promise<PreregisterLookupResult | null> {
  const spreadsheetId = getSpreadsheetId();
  dbg("lookup", { spreadsheetId, month, canonicalPhone, ranting });

  const tabsToSearch = await buildTabsToSearch(month, ranting);
  if (tabsToSearch.length === 0) {
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

  dbg("tabs to search (in order)", tabsToSearch);

  const namesByTab = await lookupNamesInTabs(tabsToSearch, canonicalPhone);
  for (const tabTitle of tabsToSearch) {
    const name = namesByTab.get(tabTitle);
    if (!name) continue;

    const resolvedRanting = rantingFromMonthTabTitle(tabTitle, month) ?? undefined;
    if (
      resolvedRanting &&
      ranting &&
      resolvedRanting.toLowerCase() !== ranting.toLowerCase()
    ) {
      dbg("resolved ranting from sheet tab", {
        requested: ranting,
        resolved: resolvedRanting,
        tabTitle,
      });
    }

    return {
      name,
      ranting: resolvedRanting,
      tabTitle,
    };
  }

  return null;
}
