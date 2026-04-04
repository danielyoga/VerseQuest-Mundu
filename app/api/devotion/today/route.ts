import { NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getTodaySheetDate } from "@/lib/sheetName";

export const runtime = "nodejs";

const SHEET = "Devotion_and_Reflection";

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const today = getTodaySheetDate();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A:D`,
    });

    const rows = res.data.values ?? [];
    const dataRows = rows.slice(1);
    const match = dataRows.find((row) => row[0]?.trim() === today);

    if (!match) {
      return NextResponse.json({ devotion: null, devotionTitle: null, reflection: [] });
    }

    // Sheet columns: Date | Devotion | Devotion Title | Reflection
    const reflection = match[3]
      ? (match[3] as string).split("|").map((s) => s.trim()).filter(Boolean)
      : [];

    return NextResponse.json({
      date: match[0],
      devotion: (match[1] as string | undefined) ?? null,
      devotionTitle: (match[2] as string | undefined)?.trim() || null,
      reflection,
    });
  } catch (err) {
    console.error("[devotion/today]", err);
    return NextResponse.json({ error: "Gagal memuat renungan." }, { status: 500 });
  }
}
