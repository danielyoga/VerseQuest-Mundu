import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getCurrentSheetName, getTodayDayJakarta, colLetter } from "@/lib/sheetName";
import { getCoordinatorRanting } from "@/lib/coordinators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") ?? "";

  const ranting = getCoordinatorRanting(phone);
  console.log(`[coordinator/members] request phone="${phone}" → ranting=${ranting ?? "DENIED"}`);
  if (!ranting) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetName = getCurrentSheetName(ranting);
    // A=phone(0), B=name(1), C=day1(2), D=day2(3) … so day N is at 0-based index N+1
    const day = getTodayDayJakarta();
    const dayColIndex = day + 1;
    const lastCol = colLetter(dayColIndex);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!A:${lastCol}`,
    });

    const rows = res.data.values ?? [];
    const dataRows = rows.slice(1);

    const members = dataRows
      .filter((row) => row[0] || row[1])
      .map((row) => {
        const cell = String(row[dayColIndex] ?? "").trim();
        const submitted_today = cell !== "";
        console.log(`[coordinator/members] name=${String(row[1] ?? "")} day=${day} col=${lastCol} cell="${cell}" submitted=${submitted_today}`);
        return {
          phone: String(row[0] ?? ""),
          name: String(row[1] ?? ""),
          submitted_today,
        };
      });

    console.log(`[coordinator/members] ranting=${ranting} count=${members.length} day=${day} col=${lastCol}`);
    return NextResponse.json({ ranting, members });
  } catch (err) {
    console.error("[coordinator/members]", err);
    return NextResponse.json({ error: "Gagal memuat data." }, { status: 500 });
  }
}
