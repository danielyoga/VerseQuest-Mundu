import { NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";

export const runtime = "nodejs";

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type Prayer = {
  submitted_at: string;
  username: string;
  ranting: string | null;
  prayer_request: string;
  show_name: boolean;
};

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: "Prayer_Wall!A:E",
    });

    const rows = (res.data.values ?? []) as string[][];
    const prayers: Prayer[] = rows
      .slice(1)
      .reverse()
      .map((row) => {
        const showName = String(row[4] ?? "").toUpperCase() === "TRUE";
        return {
          submitted_at: row[0] ?? "",
          username: showName ? (row[1] ?? "") : "Anonim",
          ranting: showName ? (row[2] ?? null) : null,
          prayer_request: row[3] ?? "",
          show_name: showName,
        };
      });

    return NextResponse.json({ prayers });
  } catch (err) {
    console.error("[prayer-wall/get]", err);
    return NextResponse.json({ error: "Gagal memuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { username?: string; ranting?: string; prayer_request?: string; show_name?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const { username, ranting, prayer_request, show_name } = body;

  if (!prayer_request?.trim()) {
    return NextResponse.json(
      { error: "Permintaan doa tidak boleh kosong" },
      { status: 400 }
    );
  }
  if (prayer_request.trim().length < 10) {
    return NextResponse.json({ error: "Minimal 10 karakter" }, { status: 400 });
  }
  if (prayer_request.trim().length > 500) {
    return NextResponse.json({ error: "Maksimal 500 karakter" }, { status: 400 });
  }

  try {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: "Prayer_Wall!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          getTodayString(),
          username ?? "",
          ranting ?? "",
          prayer_request.trim(),
          show_name ? "TRUE" : "FALSE",
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[prayer-wall/post]", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
