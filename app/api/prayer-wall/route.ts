import { NextResponse } from "next/server";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export type Prayer = {
  rowIndex: number;
  submitted_at: string;
  /** Display name — "Anonim" when show_name=false */
  username: string;
  /** Always the real submitter username, used for ownership checks */
  real_username: string;
  ranting: string | null;
  prayer_request: string;
  show_name: boolean;
  answered: boolean;
};

export async function GET(request: Request) {
  const t0 = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const adminPhone = searchParams.get("adminPhone") ?? "";
    // Admin bypass: real names are always visible to admins for pastoral follow-up
    const callerIsAdmin = adminPhone ? isAdmin(adminPhone) : false;

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
        const realUsername = row[1] ?? "";
        return {
          rowIndex: originalIndex + 2,
          submitted_at: row[0] ?? "",
          username: (showName || callerIsAdmin) ? realUsername : "Anonim",
          real_username: realUsername,
          ranting: (showName || callerIsAdmin) ? (row[2] ?? null) : null,
          prayer_request: row[3] ?? "",
          show_name: showName,
          answered,
        };
      })
      .reverse();

    console.log(`[prayer-wall] GET ${Date.now() - t0}ms count=${prayers.length} isAdmin=${callerIsAdmin}`);
    return NextResponse.json({ prayers }, {
      headers: { "Cache-Control": "no-store" },
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[prayer-wall] POST error", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: { rowIndex?: number; username?: string; adminPhone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const { rowIndex, username, adminPhone } = body;
  // Server-side admin check — never trust a flag from the client
  const callerIsAdmin = adminPhone ? isAdmin(adminPhone) : false;
  console.log(`[prayer-wall] PATCH received rowIndex=${rowIndex} username="${username}" isAdmin=${callerIsAdmin}`);

  if (!rowIndex || !username) {
    console.warn(`[prayer-wall] PATCH rejected: missing fields rowIndex=${rowIndex} username="${username}"`);
    return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  }

  try {
    const sheets = await getSheetsClient();

    const range = `Prayer_Wall!B${rowIndex}:F${rowIndex}`;
    console.log(`[prayer-wall] PATCH reading sheet range="${range}"`);
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range,
    });

    const row = readRes.data.values?.[0] as string[] | undefined;
    console.log(`[prayer-wall] PATCH sheet row=`, JSON.stringify(row ?? null));

    if (!row) {
      console.warn(`[prayer-wall] PATCH row not found rowIndex=${rowIndex}`);
      return NextResponse.json({ error: "Doa tidak ditemukan." }, { status: 404 });
    }

    const ownerUsername = row[0];
    console.log(`[prayer-wall] PATCH ownership check ownerUsername="${ownerUsername}" requestUsername="${username}" callerIsAdmin=${callerIsAdmin}`);

    if (!callerIsAdmin && ownerUsername !== username) {
      console.warn(`[prayer-wall] PATCH forbidden: ownerUsername="${ownerUsername}" !== requestUsername="${username}"`);
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

    console.log(`[prayer-wall] PATCH success rowIndex=${rowIndex} username="${username}" isAdmin=${callerIsAdmin}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[prayer-wall] PATCH error", err);
    return NextResponse.json({ error: "Gagal memperbarui." }, { status: 500 });
  }
}
