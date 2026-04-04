import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";

export const runtime = "nodejs";

const SHEET = "Devotion_and_Reflection";

/** Returns DD/MM/YYYY for yesterday (server local time). */
function yesterdaySheetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * GET /api/devotion/reflection?date=DD/MM/YYYY
 * Returns { date, reflection: string[] } for the given date.
 * Defaults to yesterday when no date param is provided.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || yesterdaySheetDate();

    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A:D`,
    });

    const rows = res.data.values ?? [];
    const dataRows = rows.slice(1);
    const match = dataRows.find((row) => row[0]?.trim() === date);

    if (!match) {
      return NextResponse.json({ date, reflection: [] });
    }

    // Sheet columns: Date | Devotion | Devotion Title | Reflection
    const reflection = match[3]
      ? (match[3] as string).split("|").map((s) => s.trim()).filter(Boolean)
      : [];

    return NextResponse.json({ date, reflection });
  } catch (err) {
    console.error("[devotion/reflection]", err);
    return NextResponse.json({ error: "Failed to load reflection." }, { status: 500 });
  }
}
