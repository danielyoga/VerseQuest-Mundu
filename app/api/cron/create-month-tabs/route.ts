/**
 * POST /api/cron/create-month-tabs
 *
 * Creates next-month streak tabs for every ranting that has a tab in the current month.
 * Tabs are named {RANTING}_{MonthName}, e.g. "POHON_September".
 *
 * - Discovers rantings from existing {RANTING}_{CurrentMonth} tabs — no env-var list needed.
 * - Carries phone+name rows from the current tab, leaving all day columns blank.
 * - Skips any tab that already exists.
 * - Idempotent: safe to call multiple times.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * Override month/year via query params for testing:
 *   POST /api/cron/create-month-tabs?month=9&year=2026
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getSheetsClient,
  getSpreadsheetId,
  escapeSheetTitleForRange,
  findHeaderIndex,
  MONTH_TAB_READ_ROW_CAP,
} from "@/lib/google-sheets/client";
import {
  getAllSheetTitles,
  invalidateSheetTitleCache,
  listRantingMonthTabTitles,
  rantingFromMonthTabTitle,
  monthEnglishName,
} from "@/lib/google-sheets/month-sheet-tab";

export const runtime = "nodejs";

function daysInMonth(year: number, month: number): number {
  // month is 1-indexed; new Date(y, m, 0) gives last day of month m
  return new Date(year, month, 0).getDate();
}

/** Jakarta UTC+7 current date. */
function jakartaNow(): { month: number; year: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { month: get("month"), year: get("year"), day: get("day") };
}

function nextMonthYear(month: number, year: number): { month: number; year: number } {
  return month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
}

type TabResult = {
  ranting: string;
  tabTitle: string;
  created: boolean;
  usersCarried: number;
  reason?: string;
};

async function createTabForRanting(
  ranting: string,
  sourceTabTitle: string,
  targetYear: number,
  targetMonth: number
): Promise<TabResult> {
  const tabTitle = `${ranting}_${monthEnglishName(targetMonth)}`;
  const spreadsheetId = getSpreadsheetId();
  const sheets = await getSheetsClient();

  // Check existence (fresh — caller already invalidated cache before starting)
  const titles = await getAllSheetTitles();
  if (titles.some((t) => t.toLowerCase() === tabTitle.toLowerCase())) {
    return { ranting, tabTitle, created: false, usersCarried: 0, reason: "already_exists" };
  }

  // Read phone + name from current month's tab
  let userRows: [string, string][] = [];
  try {
    const srcTab = escapeSheetTitleForRange(sourceTabTitle);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${srcTab}!A1:B${MONTH_TAB_READ_ROW_CAP}`,
    });
    const rows = res.data.values ?? [];
    if (rows.length >= 1) {
      const header = rows[0].map((c: unknown) => String(c ?? ""));
      const iPhone = findHeaderIndex(header, ["phone_number", "phone", "nomor"]);
      const iName = findHeaderIndex(header, ["name", "nama"]);
      if (iPhone >= 0 && iName >= 0) {
        for (let r = 1; r < rows.length; r++) {
          const phone = String(rows[r]?.[iPhone] ?? "").trim();
          const name = String(rows[r]?.[iName] ?? "").trim();
          if (phone) userRows.push([phone, name]);
        }
      }
    }
  } catch {
    // Non-fatal — create the tab with header only
  }

  const days = daysInMonth(targetYear, targetMonth);
  const totalCols = 2 + days;

  // Add the sheet
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: tabTitle,
              gridProperties: {
                rowCount: Math.max(100, userRows.length + 20),
                columnCount: totalCols + 2,
              },
            },
          },
        },
      ],
    },
  });

  // Bust cache so subsequent iterations see the new tab
  invalidateSheetTitleCache();

  // Build header + data rows
  const dayHeaders = Array.from({ length: days }, (_, i) => String(i + 1));
  const headerRow = ["Phone_Number", "Name", ...dayHeaders];
  const dataRows = userRows.map(([phone, name]) => [phone, name, ...Array<string>(days).fill("")]);

  const newTab = escapeSheetTitleForRange(tabTitle);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${newTab}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headerRow, ...dataRows] },
  });

  return { ranting, tabTitle, created: true, usersCarried: userRows.length };
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine current and target month
  const now = jakartaNow();
  const qMonth = req.nextUrl.searchParams.get("month");
  const qYear = req.nextUrl.searchParams.get("year");
  const force = req.nextUrl.searchParams.get("force") === "true";

  const currentMonth = qMonth ? Number(qMonth) : now.month;
  const currentYear = qYear ? Number(qYear) : now.year;
  if (!Number.isFinite(currentMonth) || currentMonth < 1 || currentMonth > 12) {
    return NextResponse.json({ error: "invalid month param" }, { status: 400 });
  }

  // Guard: only run on the last day of the month (skip early otherwise)
  if (!force && !qMonth) {
    const lastDay = daysInMonth(currentYear, currentMonth);
    if (now.day !== lastDay) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Not the last day of the month (today is day ${now.day}, last day is ${lastDay}). Pass ?force=true to override.`,
      });
    }
  }

  const target = nextMonthYear(currentMonth, currentYear);

  // Discover rantings from current-month tabs
  const currentTabs = await listRantingMonthTabTitles(currentMonth);
  if (currentTabs.length === 0) {
    return NextResponse.json({
      ok: true,
      message: `No ${monthEnglishName(currentMonth)} tabs found — nothing to create`,
      results: [],
    });
  }

  const rantings = currentTabs
    .map((t) => ({ tab: t, ranting: rantingFromMonthTabTitle(t, currentMonth) }))
    .filter((x): x is { tab: string; ranting: string } => x.ranting !== null);

  // Bust cache once before we start creating tabs
  invalidateSheetTitleCache();

  const results: TabResult[] = [];
  for (const { tab, ranting } of rantings) {
    try {
      const r = await createTabForRanting(ranting, tab, target.year, target.month);
      results.push(r);
    } catch (err) {
      results.push({
        ranting,
        tabTitle: `${ranting}_${monthEnglishName(target.month)}`,
        created: false,
        usersCarried: 0,
        reason: `error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  const created = results.filter((r) => r.created).length;
  const skipped = results.filter((r) => !r.created && r.reason === "already_exists").length;
  const failed = results.filter((r) => !r.created && r.reason !== "already_exists").length;

  return NextResponse.json({
    ok: failed === 0,
    targetMonth: `${monthEnglishName(target.month)} ${target.year}`,
    summary: { created, skipped, failed },
    results,
  });
}
