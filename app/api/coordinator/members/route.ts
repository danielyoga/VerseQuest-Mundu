import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getCurrentSheetName, getTodayDayJakarta } from "@/lib/sheetName";
import { getCoordinatorRanting, isCoordinatorForRanting } from "@/lib/coordinators";
import { serverDebugLog } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This response's body changes daily (which day column is read) even though the
// request URL (phone + ranting) stays identical — without this, a browser or CDN
// cache can keep serving a stale "all submitted" snapshot from an earlier day.
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") ?? "";

  const rantingParam = request.nextUrl.searchParams.get("ranting") ?? "";
  const ranting = rantingParam
    ? (isCoordinatorForRanting(phone, rantingParam) ? rantingParam : null)
    : getCoordinatorRanting(phone);
  if (!ranting) {
    return NextResponse.json(
      { error: "Akses ditolak." },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const sheets = await getSheetsClient();
    const sheetName = getCurrentSheetName(ranting);
    const day = getTodayDayJakarta();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!A:AZ`,
    });

    const rows = res.data.values ?? [];
    if (rows.length < 1) {
      return NextResponse.json({ ranting, members: [] }, { headers: NO_STORE_HEADERS });
    }

    // Parse header to find today's day column — handles any extra columns before the day columns.
    const header = rows[0].map((c: unknown) => String(c ?? "").trim());
    const dayColIndex = header.findIndex((h) => h === String(day));
    if (dayColIndex < 0) {
      console.warn(`[coordinator/members] day column "${day}" not found`);
    }

    const dataRows = rows.slice(1);
    const members = dataRows
      .filter((row) => row[0] || row[1])
      .map((row) => {
        const cell = dayColIndex >= 0 ? String(row[dayColIndex] ?? "").trim() : "";
        const submitted_today = cell !== "";
        return {
          phone: String(row[0] ?? ""),
          name: String(row[1] ?? ""),
          submitted_today,
        };
      });

    serverDebugLog(
      "coordinator/members",
      `ranting=${ranting} members=${members.length} submitted=${members.filter((m) => m.submitted_today).length}`
    );
    return NextResponse.json({ ranting, members }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error("[coordinator/members]", err);
    return NextResponse.json(
      { error: "Gagal memuat data." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
