import { NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { getTodaySheetDate } from "@/lib/sheetName";
import { isDevotionAdmin } from "@/lib/constants";

export const runtime = "nodejs";

const SHEET = "Devotion_and_Reflection";

export async function POST(request: Request) {
  let phone: string, devotion: string, devotionTitle: string, reflection: string[];
  try {
    const body = (await request.json()) as {
      phone?: string;
      devotion?: string;
      devotionTitle?: string;
      reflection?: string[];
    };
    phone = (body.phone ?? "").trim();
    devotion = (body.devotion ?? "").trim();
    devotionTitle = (body.devotionTitle ?? "").trim();
    reflection = Array.isArray(body.reflection) ? body.reflection : [];
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (!isDevotionAdmin(phone)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  if (!devotion || devotion.length < 50) {
    return NextResponse.json(
      { error: "Renungan tidak boleh kosong (min. 50 karakter)" },
      { status: 400 }
    );
  }

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const today = getTodaySheetDate();
    const reflectionJoined = reflection.filter(Boolean).join("|");
    // Columns: Date | Devotion | Devotion Title | Reflection
    const newRow = [today, devotion, devotionTitle, reflectionJoined];

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET}!A:D`,
    });

    const rows = res.data.values ?? [];
    const rowIndex = rows.findIndex(
      (row, i) => i > 0 && (row[0] as string | undefined)?.trim() === today
    );

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET}!A${rowIndex + 1}:D${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newRow] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET}!A:D`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newRow] },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[devotion/save]", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
