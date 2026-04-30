import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getCurrentSheetName, getTodayString } from "@/lib/sheetName";
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
    const today = getTodayString();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!A:D`,
    });

    const rows = res.data.values ?? [];
    const dataRows = rows.slice(1);

    const members = dataRows
      .filter((row) => row[0] || row[1])
      .map((row) => ({
        phone: String(row[0] ?? ""),
        name: String(row[1] ?? ""),
        submitted_today: String(row[3] ?? "") === today,
      }));

    console.log(`[coordinator/members] ranting=${ranting} count=${members.length} today=${today}`);
    return NextResponse.json({ ranting, members });
  } catch (err) {
    console.error("[coordinator/members]", err);
    return NextResponse.json({ error: "Gagal memuat data." }, { status: 500 });
  }
}
