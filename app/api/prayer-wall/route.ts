import { NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";

export const runtime = "nodejs";

export type Prayer = {
  rowIndex: number;
  submitted_at: string;
  username: string;
  ranting: string | null;
  prayer_request: string;
  show_name: boolean;
  answered: boolean;
};

let prayerCache: { data: Prayer[]; expiresAt: number } | null = null;
const PRAYER_CACHE_TTL_MS = 60_000;

export async function GET() {
  const t0 = Date.now();
  try {
    if (prayerCache && Date.now() < prayerCache.expiresAt) {
      console.log(`[prayer-wall] GET ${Date.now() - t0}ms (cache hit) count=${prayerCache.data.length}`);
      return NextResponse.json({ prayers: prayerCache.data }, {
        headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
      });
    }

    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: "Prayer_Wall!A:F",
    });

    const rows = (res.data.values ?? []) as string[][];
    const prayers: Prayer[] = rows
      .slice(1)
      .map((row, originalIndex) => {
        const showName = String(row[4] ?? "").toUpperCase() === "TRUE";
        const answered = String(row[5] ?? "").toUpperCase() === "TRUE";
        return {
          rowIndex: originalIndex + 2,
          submitted_at: row[0] ?? "",
          username: showName ? (row[1] ?? "") : "Anonim",
          ranting: showName ? (row[2] ?? null) : null,
          prayer_request: row[3] ?? "",
          show_name: showName,
          answered,
        };
      })
      .reverse();

    prayerCache = { data: prayers, expiresAt: Date.now() + PRAYER_CACHE_TTL_MS };
    console.log(`[prayer-wall] GET ${Date.now() - t0}ms (sheets) count=${prayers.length}`);
    return NextResponse.json({ prayers }, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[prayer-wall] GET error", err);
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
      range: "Prayer_Wall!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toISOString(),
          username ?? "",
          ranting ?? "",
          prayer_request.trim(),
          show_name ? "TRUE" : "FALSE",
          "FALSE",
        ]],
      },
    });

    prayerCache = null;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[prayer-wall] POST error", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: { rowIndex?: number; username?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const { rowIndex, username } = body;
  if (!rowIndex || !username) {
    return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  }

  try {
    const sheets = await getSheetsClient();

    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `Prayer_Wall!B${rowIndex}:F${rowIndex}`,
    });

    const row = readRes.data.values?.[0] as string[] | undefined;
    if (!row) {
      return NextResponse.json({ error: "Doa tidak ditemukan." }, { status: 404 });
    }

    const ownerUsername = row[0];
    if (ownerUsername !== username) {
      return NextResponse.json(
        { error: "Hanya pembuat doa yang dapat menandai sebagai terjawab." },
        { status: 403 }
      );
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `Prayer_Wall!F${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["TRUE"]] },
    });

    prayerCache = null;
    console.log(`[prayer-wall] PATCH rowIndex=${rowIndex} username=${username}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[prayer-wall] PATCH error", err);
    return NextResponse.json({ error: "Gagal memperbarui." }, { status: 500 });
  }
}
