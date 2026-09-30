import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { isDevotionAdmin } from "@/lib/constants";
import { readPrayerRows, upsertPrayerRow } from "@/lib/google-sheets/prayers-sheet";
import { PRAYERS_CACHE_TAG } from "@/lib/prayers-cache";
import { isPrayerDate, PRAYER_MAX_CHARS, validatePrayerText } from "@/lib/prayer-content";

export const runtime = "nodejs";

/**
 * GET /api/admin/prayer?phone=&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Prayers in the range as { prayers: { [date]: text } }. Reads the sheet directly (no cache)
 * so the admin list reflects manual sheet edits too.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const phone = (sp.get("phone") ?? "").trim();
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  if (!isDevotionAdmin(phone)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  if (!isPrayerDate(from) || !isPrayerDate(to) || from > to) {
    return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
  }

  try {
    const prayers: Record<string, string> = {};
    for (const row of await readPrayerRows()) {
      if (!isPrayerDate(row.date) || row.date < from || row.date > to || !row.text.trim()) continue;
      // First row per date wins, same as the member read.
      if (!(row.date in prayers)) prayers[row.date] = row.text;
    }
    return NextResponse.json({ prayers }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[admin/prayer GET]", err);
    return NextResponse.json({ error: "Gagal memuat doa." }, { status: 500 });
  }
}

/** POST /api/admin/prayer { phone, date, text } — upsert one day's prayer. */
export async function POST(request: Request) {
  let phone: string, date: string, text: string;
  try {
    const body = (await request.json()) as { phone?: unknown; date?: unknown; text?: unknown };
    phone = String(body.phone ?? "").trim();
    date = String(body.date ?? "").trim();
    text = typeof body.text === "string" ? body.text : "";
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (!isDevotionAdmin(phone)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  if (!isPrayerDate(date)) {
    return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
  }

  const checked = validatePrayerText(text);
  if (!checked.ok) {
    const error =
      checked.error === "empty"
        ? "Doa tidak boleh kosong."
        : `Doa tidak boleh lebih dari ${PRAYER_MAX_CHARS} karakter.`;
    return NextResponse.json({ error, code: checked.error }, { status: 400 });
  }

  try {
    const { updated } = await upsertPrayerRow(date, checked.text, phone);
    // Expire now so members and the admin list see the new text on their next load.
    revalidateTag(PRAYERS_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ success: true, updated, date, text: checked.text });
  } catch (err) {
    console.error("[admin/prayer POST]", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
