import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getCurrentSheetName, getTodayDayJakarta } from "@/lib/sheetName";
import { getCoordinatorRanting, isCoordinatorForRanting } from "@/lib/coordinators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") ?? "";

  const rantingParam = request.nextUrl.searchParams.get("ranting") ?? "";
  const ranting = rantingParam
    ? (isCoordinatorForRanting(phone, rantingParam) ? rantingParam : null)
    : getCoordinatorRanting(phone);
  console.log(`[coordinator/members] request phone="${phone}" ranting="${rantingParam}" → ${ranting ?? "DENIED"}`);
  if (!ranting) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetName = getCurrentSheetName(ranting);
    const day = getTodayDayJakarta();
    console.log(`[coordinator/members] sheet="${sheetName}" day=${day}`);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!A:AZ`,
    });

    const rows = res.data.values ?? [];
    console.log(`[coordinator/members] rows fetched=${rows.length}`);
    if (rows.length < 1) return NextResponse.json({ ranting, members: [] });

    // Parse header to find today's day column — handles any extra columns before the day columns.
    const header = rows[0].map((c: unknown) => String(c ?? "").trim());
    const dayColIndex = header.findIndex((h) => h === String(day));
    if (dayColIndex < 0) {
      console.warn(`[coordinator/members] day column "${day}" not found in header=${JSON.stringify(header)}`);
    } else {
      console.log(`[coordinator/members] header day="${day}" found at col index=${dayColIndex}`);
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

    const submittedCount = members.filter((m) => m.submitted_today).length;
    console.log(`[coordinator/members] ranting=${ranting} members=${members.length} submitted=${submittedCount} pending=${members.length - submittedCount}`);
    return NextResponse.json({ ranting, members });
  } catch (err) {
    console.error("[coordinator/members]", err);
    return NextResponse.json({ error: "Gagal memuat data." }, { status: 500 });
  }
}
