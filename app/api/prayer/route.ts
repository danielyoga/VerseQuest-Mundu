import { NextResponse, type NextRequest } from "next/server";
import { getCachedPrayerRows } from "@/lib/prayers-cache";
import { defaultPrayer, isPrayerDate, pickPrayer, type PrayerPayload } from "@/lib/prayer-content";
import { serverDebugLog } from "@/lib/log";

export const runtime = "nodejs";

/** GET /api/prayer?date=YYYY-MM-DD — date is the device's local date. */
export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isPrayerDate(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  try {
    const row = pickPrayer(await getCachedPrayerRows(), date);
    const data: PrayerPayload = row
      ? { date: row.date, text: row.text, source: "sheet" }
      : defaultPrayer();
    serverDebugLog("prayer", `GET ${date} ${Date.now() - t0}ms (${data.source})`);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    // 503 so the client falls back to its cached prayer before the default.
    console.error("[prayer]", err);
    return NextResponse.json({ error: "Gagal memuat doa." }, { status: 503 });
  }
}
