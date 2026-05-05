import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getCurrentSheetName } from "@/lib/sheetName";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const ranting = searchParams.get("ranting");

  console.log(`[user/me] GET phone=${phone ?? "?"} ranting=${ranting ?? "?"}`);

  if (!phone || !ranting) {
    console.warn(`[user/me] missing params — phone=${phone} ranting=${ranting}`);
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetName = getCurrentSheetName(ranting);
    console.log(`[user/me] sheets client ready, querying sheet="${sheetName}" +${Date.now() - t0}ms`);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!A:J`,
    });

    const rows = (res.data.values ?? []) as string[][];
    const dataRows = rows.slice(1);
    const userRow = dataRows.find((row) => row[0] === phone);

    if (!userRow) {
      console.warn(`[user/me] 404 phone=${phone} not found in sheet +${Date.now() - t0}ms`);
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    console.log(`[user/me] 200 phone=${phone} streak=${userRow[8] ?? 0} xp=${userRow[9] ?? 0} +${Date.now() - t0}ms`);
    return NextResponse.json({
      name: userRow[1] ?? "",
      streak_count: parseInt(userRow[8] ?? "0", 10),
      xp_total: parseInt(userRow[9] ?? "0", 10),
      last_submitted_at: userRow[3] ?? null,
    });
  } catch (err) {
    console.error(`[user/me] ERROR +${Date.now() - t0}ms`, err);
    const message = err instanceof Error && err.message.includes("Unable to parse range")
      ? "Sheet bulan ini belum tersedia."
      : "Gagal memuat data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
