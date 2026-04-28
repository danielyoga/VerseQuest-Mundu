import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getCurrentSheetName } from "@/lib/sheetName";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const ranting = searchParams.get("ranting");

  if (!phone || !ranting) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetName = getCurrentSheetName(ranting);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!A:J`,
    });

    const rows = (res.data.values ?? []) as string[][];
    const dataRows = rows.slice(1);
    const userRow = dataRows.find((row) => row[0] === phone);

    if (!userRow) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      name: userRow[1] ?? "",
      streak_count: parseInt(userRow[8] ?? "0", 10),
      xp_total: parseInt(userRow[9] ?? "0", 10),
      last_submitted_at: userRow[3] ?? null,
    });
  } catch (err) {
    console.error("[user/me]", err);
    const message = err instanceof Error && err.message.includes("Unable to parse range")
      ? "Sheet bulan ini belum tersedia."
      : "Gagal memuat data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
